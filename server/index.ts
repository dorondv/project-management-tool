import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

// Prisma Client configuration for Supabase connection pooling
// DATABASE_URL should include: pgbouncer=true&connection_limit=5
// This prevents connection exhaustion and ensures proper pooling
const prisma = new PrismaClient({
  log: ['error', 'warn'],
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
import { testDatabaseConnection } from './middleware/dbTest.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

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

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

const PORT = process.env.PORT || 3001;

// Test database connection on startup
async function startServer() {
  // Start the server first (non-blocking)
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🔌 DB test: http://localhost:${PORT}/health/db`);
  });
  
  // Test connection in background (don't block server startup)
  try {
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Database connection test successful');
  } catch (error: any) {
    console.error('❌ Database connection test failed:', error.message);
    console.warn('⚠️  Server started but database queries may fail');
    console.warn('   Ensure DATABASE_URL includes: pgbouncer=true&connection_limit=5');
  }
}

startServer();

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

