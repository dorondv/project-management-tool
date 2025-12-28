import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { ensureDatabaseUrlForPrisma, maskDatabaseUrl } from './utils/databaseUrl.js';

const dbNormalization = ensureDatabaseUrlForPrisma();
if (dbNormalization.messages.length > 0) {
  console.log('ℹ️  Database URL check:');
  dbNormalization.messages.forEach((message) => console.log(`   - ${message}`));
}
if (dbNormalization.maskedUrl) {
  console.log(`🗄️  Using DATABASE_URL: ${dbNormalization.maskedUrl}`);
}

// Prisma Client configuration for Supabase connection pooling
// Using transaction mode (port 6543) - better for Prisma with Supabase pooler
// DATABASE_URL should include: pgbouncer=true&connection_limit=10&sslmode=require
// This allows parallel queries while preventing connection exhaustion
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  // Connection pool optimization is handled via DATABASE_URL parameters
  // For better performance with Supabase:
  // - Use connection pooling (pgbouncer=true)
  // - Set connection_limit=10 for parallel queries (transaction mode can handle more)
  // - Enable SSL (sslmode=require)
  // Note: With pgbouncer transaction mode, we can safely use 10 connections
  // Prisma will automatically reconnect on connection errors (P1017)
});
import { usersRouter } from './routes/users.js';
import { projectsRouter } from './routes/projects.js';
import { tasksRouter } from './routes/tasks.js';
import { customersRouter } from './routes/customers.js';
import { timeEntriesRouter } from './routes/timeEntries.js';
import { incomesRouter } from './routes/incomes.js';
import { notificationsRouter } from './routes/notifications.js';
import { activitiesRouter } from './routes/activities.js';
import { timersRouter } from './routes/timers.js';
import { dashboardRouter } from './routes/dashboard.js';
import { subscriptionsRouter } from './routes/subscriptions.js';
import { paymentsRouter } from './routes/payments.js';
import { adminRouter } from './routes/admin.js';
import { eventsRouter } from './routes/events.js';

const app = express();
const httpServer = createServer(app);

// Initialize Socket.IO with CORS configuration
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Middleware
app.use(cors());
// Increase body size limit to 10MB for profile images and large payloads
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Prisma Client manages its own connection pool automatically
// No need for manual connection checks with proper connection string configuration

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Database connection test
app.get('/health/db', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ 
      status: 'ok', 
      database: 'connected',
      timestamp: new Date().toISOString() 
    });
  } catch (error: any) {
    res.status(500).json({ 
      status: 'error', 
      database: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString() 
    });
  }
});

// API Routes
app.use('/api/users', usersRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/customers', customersRouter);
app.use('/api/time-entries', timeEntriesRouter);
app.use('/api/incomes', incomesRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/activities', activitiesRouter);
app.use('/api/timers', timersRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/subscriptions', subscriptionsRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/events', eventsRouter);

// Error handling middleware with connection retry logic
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  
  // Check if it's a Prisma connection error (P1017)
  const prismaError = err as any;
  if (prismaError.code === 'P1017' || prismaError.message?.includes('Server has closed the connection')) {
    console.warn('⚠️  Database connection error detected - Prisma should auto-reconnect on next query');
  }
  
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

const PORT = process.env.PORT || 3001;

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log(`🔌 WebSocket client connected: ${socket.id}`);

  // Handle authentication
  socket.on('authenticate', async (data: { userId: string }) => {
    try {
      // Verify user exists
      const user = await prisma.user.findUnique({
        where: { id: data.userId },
      });

      if (user) {
        socket.data.userId = data.userId;
        socket.join(`user:${data.userId}`); // Join user-specific room
        socket.emit('authenticated', { success: true });
        console.log(`✅ WebSocket authenticated for user: ${data.userId}`);
      } else {
        socket.emit('authenticated', { success: false, error: 'User not found' });
        socket.disconnect();
      }
    } catch (error: any) {
      console.error('WebSocket authentication error:', error);
      socket.emit('authenticated', { success: false, error: error.message });
      socket.disconnect();
    }
  });

  socket.on('disconnect', () => {
    console.log(`🔌 WebSocket client disconnected: ${socket.id}`);
  });
});

// Export io for use in other modules
export { io };

// Initialize socket service
import { initSocketService } from './utils/socketService.js';
initSocketService(io);

// Test database connection on startup
async function startServer() {
  // Start the HTTP server (which includes WebSocket support)
  httpServer.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🔌 DB test: http://localhost:${PORT}/health/db`);
    console.log(`🔌 WebSocket server ready on ws://localhost:${PORT}`);
  });
  
  // Test connection in background (don't block server startup)
  try {
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Database connection test successful');
  } catch (error: any) {
    console.error('❌ Database connection test failed:', error.message);
    console.warn('⚠️  Server started but database queries may fail');
    
    // Provide helpful debugging information
    const dbUrl = process.env.DATABASE_URL;
    if (dbUrl) {
      const urlObj = new URL(dbUrl);
      console.warn(`   Database host: ${urlObj.hostname}:${urlObj.port}`);
      console.warn(`   Has pgbouncer: ${dbUrl.includes('pgbouncer=true') ? 'Yes' : 'No'}`);
      console.warn(`   Effective URL: ${maskDatabaseUrl(dbUrl)}`);
    } else {
      console.error('   ❌ DATABASE_URL is not set in environment variables');
    }
    
    if (error.message.includes("Can't reach database server")) {
      console.warn('   💡 Possible issues:');
      console.warn('      - Network connectivity problem');
      console.warn('      - Supabase project might be paused');
      console.warn('      - Firewall blocking connection');
      console.warn('      - Connection string might be incorrect');
      console.warn('      - Missing SSL parameters (add ?sslmode=require to DATABASE_URL)');
    }
    
    // Check for missing SSL
    if (dbUrl && !dbUrl.includes('sslmode')) {
      console.warn('   ⚠️  Connection string missing SSL parameter');
      console.warn('      Add &sslmode=require to your DATABASE_URL');
    }
  }
}

startServer();

// Periodic connection health check to keep connections alive
// This helps prevent pgbouncer from closing idle connections
if (process.env.NODE_ENV === 'production') {
  setInterval(async () => {
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch (error: any) {
      // If connection is closed, reconnect
      if (error.code === 'P1017' || error.message?.includes('Server has closed the connection')) {
        console.warn('⚠️  Connection health check failed, reconnecting...');
        try {
          await prisma.$disconnect();
          await prisma.$connect();
          console.log('✅ Connection restored');
        } catch (reconnectError: any) {
          console.error('❌ Failed to restore connection:', reconnectError.message);
        }
      }
    }
  }, 5 * 60 * 1000); // Every 5 minutes
}

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

export { prisma };

