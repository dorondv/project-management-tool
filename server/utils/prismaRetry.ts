import { PrismaClient } from '@prisma/client';

/**
 * Prisma Connection Retry Utility
 * Handles automatic reconnection when Supabase pgbouncer closes idle connections
 */

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

/**
 * Check if error is a connection error that should trigger retry
 */
export function isConnectionError(error: any): boolean {
  if (!error) return false;
  
  // Prisma error code for closed connection
  if (error.code === 'P1017') return true;
  
  // Check for Rust error kind "Closed" (from Prisma's Rust engine)
  if (error.kind === 'Closed' || error.cause?.kind === 'Closed') return true;
  
  // Check error message for connection-related issues
  const message = error.message?.toLowerCase() || '';
  return (
    message.includes('server has closed the connection') ||
    message.includes('connection closed') ||
    message.includes('can\'t reach database server') ||
    message.includes('connection terminated') ||
    message.includes('error in postgresql connection')
  );
}

/**
 * Execute a Prisma query with automatic retry on connection errors
 */
export async function withRetry<T>(
  prisma: PrismaClient,
  queryFn: () => Promise<T>,
  retries: number = MAX_RETRIES
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // If this is a retry, reconnect first
      if (attempt > 0) {
        try {
          console.log(`🔄 Attempting to reconnect to database (attempt ${attempt}/${retries})...`);
          await prisma.$disconnect();
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * attempt));
          await prisma.$connect();
          console.log(`✅ Database reconnected successfully`);
        } catch (reconnectError: any) {
          console.warn(`⚠️  Reconnection attempt ${attempt} failed:`, reconnectError.message);
        }
      }
      
      return await queryFn();
    } catch (error: any) {
      lastError = error;
      
      // Only retry on connection errors
      if (isConnectionError(error) && attempt < retries) {
        console.warn(
          `⚠️  Database connection error (attempt ${attempt + 1}/${retries + 1}):`,
          error.code || error.message?.substring(0, 100)
        );
        continue;
      }
      
      // Not a connection error or max retries reached
      throw error;
    }
  }
  
  throw lastError;
}

