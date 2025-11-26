#!/usr/bin/env node
/**
 * Run manual migration: Add userId to customers table
 * Usage: node scripts/run-migration.js
 */

import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const prisma = new PrismaClient();

async function runMigration() {
  console.log('🔄 Starting migration: Add userId to customers table...\n');

  try {
    // Test connection first
    await prisma.$connect();
    console.log('✅ Database connection successful\n');

    // Check if userId column already exists
    const columnExists = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'customers' 
      AND column_name = 'userId'
    `;

    if (Array.isArray(columnExists) && columnExists.length > 0) {
      console.log('⚠️  Column "userId" already exists in customers table');
      console.log('   Skipping column creation...\n');
    } else {
      // Step 1: Add userId column
      console.log('📝 Step 1: Adding userId column...');
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "userId" UUID;
      `);
      console.log('   ✅ Column added\n');

      // Step 2: Add foreign key constraint
      console.log('📝 Step 2: Adding foreign key constraint...');
      try {
        await prisma.$executeRawUnsafe(`
          ALTER TABLE "customers" 
          ADD CONSTRAINT "customers_userId_fkey" 
          FOREIGN KEY ("userId") 
          REFERENCES "users"("id") 
          ON DELETE CASCADE 
          ON UPDATE CASCADE;
        `);
        console.log('   ✅ Foreign key constraint added\n');
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log('   ⚠️  Foreign key constraint already exists\n');
        } else {
          throw error;
        }
      }

      // Step 3: Create index
      console.log('📝 Step 3: Creating index...');
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "customers_userId_idx" ON "customers"("userId");
      `);
      console.log('   ✅ Index created\n');
    }

    // Step 4: Check for existing customers without userId
    console.log('📝 Step 4: Checking for existing customers without userId...');
    const customersWithoutUserId = await prisma.$queryRaw`
      SELECT COUNT(*)::int as count
      FROM "customers"
      WHERE "userId" IS NULL
    `;

    const count = Array.isArray(customersWithoutUserId) && customersWithoutUserId.length > 0
      ? customersWithoutUserId[0].count
      : 0;

    if (count > 0) {
      console.log(`   ⚠️  Found ${count} customer(s) without userId`);
      
      // Get all users
      const users = await prisma.user.findMany({
        select: { id: true, name: true, email: true },
        orderBy: { createdAt: 'asc' },
      });

      if (users.length === 0) {
        console.log('\n   ❌ No users found in database!');
        console.log('   💡 You need to create at least one user before assigning customers.');
        console.log('   💡 Customers without userId will not be visible until assigned.\n');
      } else {
        console.log(`\n   📋 Available users:`);
        users.forEach((user, index) => {
          console.log(`      ${index + 1}. ${user.name} (${user.email}) - ID: ${user.id}`);
        });

        console.log(`\n   💡 To assign existing customers to a user, run:`);
        console.log(`      UPDATE "customers" SET "userId" = '<user-id>' WHERE "userId" IS NULL;`);
        console.log(`\n   💡 Or assign each customer individually based on your business logic.\n`);
      }
    } else {
      console.log('   ✅ All customers have userId assigned\n');
    }

    // Step 5: Check if we should make userId NOT NULL
    console.log('📝 Step 5: Checking column constraints...');
    const columnInfo = await prisma.$queryRaw`
      SELECT is_nullable
      FROM information_schema.columns
      WHERE table_name = 'customers'
      AND column_name = 'userId'
    `;

    const isNullable = Array.isArray(columnInfo) && columnInfo.length > 0
      ? columnInfo[0].is_nullable === 'YES'
      : true;

    if (isNullable && count === 0) {
      console.log('   💡 All customers have userId. You can make it NOT NULL by running:');
      console.log('      ALTER TABLE "customers" ALTER COLUMN "userId" SET NOT NULL;\n');
    } else if (isNullable) {
      console.log('   ⚠️  Column is nullable (some customers may not have userId yet)\n');
    } else {
      console.log('   ✅ Column is NOT NULL\n');
    }

    console.log('✅ Migration completed successfully!');
    console.log('\n📋 Summary:');
    console.log('   - userId column: Added');
    console.log('   - Foreign key constraint: Added');
    console.log('   - Index: Created');
    if (count > 0) {
      console.log(`   - Customers without userId: ${count} (needs manual assignment)`);
    }

  } catch (error) {
    console.error('\n❌ Migration failed:');
    console.error('Error:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runMigration();

