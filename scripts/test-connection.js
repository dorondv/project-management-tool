#!/usr/bin/env node
/**
 * Test database connection script
 * Usage: node scripts/test-connection.js
 */

import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const SUPABASE_POOLER_SUFFIX = '.pooler.supabase.com';
const SUPABASE_POOLER_PORT = '6543';

const normalizeDatabaseUrl = (value) => {
  if (!value) {
    return { changed: false, messages: ['DATABASE_URL not set'] };
  }

  try {
    const url = new URL(value);
    const messages = [];
    let changed = false;

    if (url.hostname.endsWith(SUPABASE_POOLER_SUFFIX)) {
      if (!url.port || url.port === '5432') {
        url.port = SUPABASE_POOLER_PORT;
        messages.push('Adjusted port to 6543 for Supabase pooler');
        changed = true;
      }
      const ensureParam = (key, val, description) => {
        if (url.searchParams.get(key) !== val) {
          url.searchParams.set(key, val);
          messages.push(description);
          changed = true;
        }
      };
      ensureParam('pgbouncer', 'true', 'Added pgbouncer=true');
      ensureParam(
        'connection_limit',
        '1',
        'Set connection_limit=1 for Prisma compatibility'
      );
      ensureParam('sslmode', 'require', 'Enforced sslmode=require');
    }

    if (changed) {
      const normalized = url.toString();
      process.env.DATABASE_URL = normalized;
      return { changed, messages, normalized };
    }

    return { changed, messages: [] };
  } catch (error) {
    return {
      changed: false,
      messages: [`Failed to parse DATABASE_URL: ${error.message}`],
    };
  }
};

const maskDatabaseUrl = (value) => {
  if (!value) return value;
  try {
    const safe = new URL(value);
    if (safe.password) {
      safe.password = '****';
    }
    return safe.toString();
  } catch {
    return value;
  }
};

const normalization = normalizeDatabaseUrl(process.env.DATABASE_URL);
if (normalization.messages.length > 0) {
  console.log('ℹ️  Database URL check:');
  normalization.messages.forEach((message) => console.log(`   - ${message}`));
}
if (process.env.DATABASE_URL) {
  console.log(`🗄️  Using DATABASE_URL: ${maskDatabaseUrl(process.env.DATABASE_URL)}`);
}

const prisma = new PrismaClient();

async function testConnection() {
  console.log('🔍 Testing database connection...');
  console.log(`📡 DATABASE_URL: ${process.env.DATABASE_URL ? 'Set' : 'Not set'}`);
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not found in environment variables');
    console.log('💡 Make sure your .env file exists and contains DATABASE_URL');
    process.exit(1);
  }

  try {
    // Test connection
    await prisma.$connect();
    console.log('✅ Prisma Client connected');

    // Test query
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Database query successful:', result);

    // Test table access
    const userCount = await prisma.user.count();
    console.log(`✅ Users table accessible (${userCount} users)`);

    const projectCount = await prisma.project.count();
    console.log(`✅ Projects table accessible (${projectCount} projects)`);

    console.log('\n🎉 Database connection test passed!');
    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Database connection test failed:');
    console.error('Error:', error.message);
    
    if (error.message.includes('Tenant or user not found')) {
      console.error('\n💡 This error usually means:');
      console.error('   1. The connection string format is incorrect');
      console.error('   2. The username/password is wrong');
      console.error('   3. The host/port is incorrect');
      console.error('\n   Get the correct connection string from:');
      console.error('   https://supabase.com/dashboard/project/cjenrxiwoanelwdbqkma/settings/database');
    }
    
    await prisma.$disconnect();
    process.exit(1);
  }
}

testConnection();

