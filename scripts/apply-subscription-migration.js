#!/usr/bin/env node
/**
 * Apply subscription migration: Add subscriptions, billing_history, coupons, payment_webhooks tables
 * Usage: node scripts/apply-subscription-migration.js
 */

import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

async function applyMigration() {
  console.log('🔄 Applying subscription migration...\n');

  try {
    // Test connection first
    await prisma.$connect();
    console.log('✅ Database connection successful\n');

    const statements = [
      // Create subscriptions table
      `CREATE TABLE IF NOT EXISTS "subscriptions" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "userId" UUID NOT NULL,
        "planType" TEXT NOT NULL,
        "status" TEXT NOT NULL,
        "paypalSubscriptionId" TEXT,
        "paypalPlanId" TEXT,
        "startDate" TIMESTAMP(3) NOT NULL,
        "endDate" TIMESTAMP(3),
        "trialEndDate" TIMESTAMP(3),
        "price" DOUBLE PRECISION NOT NULL,
        "currency" TEXT NOT NULL DEFAULT 'USD',
        "couponCode" TEXT,
        "couponId" UUID,
        "isFreeAccess" BOOLEAN NOT NULL DEFAULT false,
        "isTrialCoupon" BOOLEAN NOT NULL DEFAULT false,
        "grantedByAdminId" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
      )`,
      
      // Create billing_history table
      `CREATE TABLE IF NOT EXISTS "billing_history" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "subscriptionId" UUID NOT NULL,
        "invoiceNumber" TEXT NOT NULL,
        "paypalTransactionId" TEXT,
        "paypalSaleId" TEXT,
        "amount" DOUBLE PRECISION NOT NULL,
        "currency" TEXT NOT NULL DEFAULT 'USD',
        "status" TEXT NOT NULL,
        "paymentDate" TIMESTAMP(3) NOT NULL,
        "refundedAmount" DOUBLE PRECISION,
        "refundedDate" TIMESTAMP(3),
        "refundReason" TEXT,
        "invoiceUrl" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "billing_history_pkey" PRIMARY KEY ("id")
      )`,
      
      // Create payment_webhooks table
      `CREATE TABLE IF NOT EXISTS "payment_webhooks" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "paypalEventId" TEXT NOT NULL,
        "eventType" TEXT NOT NULL,
        "payload" JSONB NOT NULL,
        "processed" BOOLEAN NOT NULL DEFAULT false,
        "processedAt" TIMESTAMP(3),
        "error" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "payment_webhooks_pkey" PRIMARY KEY ("id")
      )`,
      
      // Create coupons table
      `CREATE TABLE IF NOT EXISTS "coupons" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "code" TEXT NOT NULL,
        "trialDays" INTEGER NOT NULL,
        "description" TEXT,
        "validFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "validUntil" TIMESTAMP(3),
        "maxUses" INTEGER,
        "currentUses" INTEGER NOT NULL DEFAULT 0,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "coupons_pkey" PRIMARY KEY ("id")
      )`,
      
      // Create indexes
      `CREATE UNIQUE INDEX IF NOT EXISTS "subscriptions_userId_key" ON "subscriptions"("userId")`,
      `CREATE UNIQUE INDEX IF NOT EXISTS "subscriptions_paypalSubscriptionId_key" ON "subscriptions"("paypalSubscriptionId")`,
      `CREATE UNIQUE INDEX IF NOT EXISTS "billing_history_paypalTransactionId_key" ON "billing_history"("paypalTransactionId")`,
      `CREATE UNIQUE INDEX IF NOT EXISTS "payment_webhooks_paypalEventId_key" ON "payment_webhooks"("paypalEventId")`,
      `CREATE UNIQUE INDEX IF NOT EXISTS "coupons_code_key" ON "coupons"("code")`,
      
      // Add foreign keys
      `DO $$ BEGIN
        ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$`,
      
      `DO $$ BEGIN
        ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_couponId_fkey" 
        FOREIGN KEY ("couponId") REFERENCES "coupons"("id") ON DELETE SET NULL ON UPDATE CASCADE;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$`,
      
      `DO $$ BEGIN
        ALTER TABLE "billing_history" ADD CONSTRAINT "billing_history_subscriptionId_fkey" 
        FOREIGN KEY ("subscriptionId") REFERENCES "subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$`,
    ];

    // Drop existing tables first if they exist (to fix type mismatches)
    console.log('🗑️  Dropping existing tables if they exist...\n');
    try {
      await prisma.$executeRawUnsafe('DROP TABLE IF EXISTS "billing_history" CASCADE;');
      await prisma.$executeRawUnsafe('DROP TABLE IF EXISTS "subscriptions" CASCADE;');
      await prisma.$executeRawUnsafe('DROP TABLE IF EXISTS "payment_webhooks" CASCADE;');
      await prisma.$executeRawUnsafe('DROP TABLE IF EXISTS "coupons" CASCADE;');
      console.log('   ✅ Existing tables dropped\n');
    } catch (error) {
      console.log('   ⚠️  Error dropping tables (may not exist):', error.message);
    }

    console.log(`📝 Executing ${statements.length} SQL statements...\n`);

    let successCount = 0;
    let skipCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      try {
        await prisma.$executeRawUnsafe(statement);
        successCount++;
        console.log(`   ✅ Statement ${i + 1}/${statements.length} executed`);
      } catch (error) {
        // Ignore "already exists" errors
        if (error.message.includes('already exists') || 
            error.message.includes('duplicate') ||
            (error.message.includes('relation') && error.message.includes('already exists')) ||
            error.message.includes('constraint') && error.message.includes('already exists')) {
          skipCount++;
          console.log(`   ⚠️  Statement ${i + 1}/${statements.length} skipped (already exists)`);
        } else {
          console.error(`   ❌ Statement ${i + 1}/${statements.length} failed:`, error.message);
          throw error;
        }
      }
    }

    console.log(`\n📊 Summary: ${successCount} executed, ${skipCount} skipped`);
    console.log('\n✅ Migration completed successfully!');
    console.log('\n📋 Created tables:');
    console.log('   - subscriptions');
    console.log('   - billing_history');
    console.log('   - payment_webhooks');
    console.log('   - coupons');

  } catch (error) {
    console.error('\n❌ Migration failed:');
    console.error('Error:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

applyMigration();
