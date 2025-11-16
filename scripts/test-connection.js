#!/usr/bin/env node
/**
 * Test database connection script
 * Usage: node scripts/test-connection.js
 */

import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

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

