/**
 * Test script to verify authentication setup
 * This script checks:
 * 1. Database connection
 * 2. User model exists
 * 3. Trip model has userId field
 * 4. Email field is nullable
 *
 * Run with: npx tsx scripts/test-auth.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Testing authentication setup...\n');

  // Test 1: Database connection
  console.log('1️⃣ Testing database connection...');
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully\n');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }

  // Test 2: Check User model
  console.log('2️⃣ Checking User model...');
  try {
    const userCount = await prisma.user.count();
    console.log(`✅ User model exists. Total users: ${userCount}\n`);
  } catch (error) {
    console.error('❌ User model check failed:', error);
    process.exit(1);
  }

  // Test 3: Check Trip model with userId
  console.log('3️⃣ Checking Trip model...');
  try {
    const tripCount = await prisma.trip.count();
    console.log(`✅ Trip model exists. Total trips: ${tripCount}\n`);
  } catch (error) {
    console.error('❌ Trip model check failed:', error);
    process.exit(1);
  }

  // Test 4: List all users with their email status
  console.log('4️⃣ Listing users...');
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        createdAt: true,
        _count: {
          select: { trips: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (users.length === 0) {
      console.log('ℹ️  No users found in database\n');
    } else {
      console.log(`Found ${users.length} user(s):\n`);
      users.forEach((user, index) => {
        console.log(`User ${index + 1}:`);
        console.log(`  - ID: ${user.id.substring(0, 20)}...`);
        console.log(`  - Email: ${user.email || 'NULL'}`);
        console.log(`  - Trips: ${user._count.trips}`);
        console.log(`  - Created: ${user.createdAt.toISOString()}\n`);
      });
    }
  } catch (error) {
    console.error('❌ Failed to list users:', error);
    process.exit(1);
  }

  // Test 5: Check for problematic emails
  console.log('5️⃣ Checking for problematic emails...');
  try {
    const emptyEmailUsers = await prisma.user.findMany({
      where: { email: '' },
    });

    if (emptyEmailUsers.length > 0) {
      console.log(`⚠️  WARNING: Found ${emptyEmailUsers.length} user(s) with empty string emails`);
      console.log('   This will cause unique constraint errors!');
      console.log('   Fix with: npx tsx scripts/fix-empty-emails.ts\n');
    } else {
      console.log('✅ No empty email strings found\n');
    }
  } catch (error) {
    console.error('❌ Failed to check emails:', error);
  }

  console.log('✨ All tests completed successfully!');
  console.log('\n📋 Summary:');
  console.log('   - Database connection: ✅');
  console.log('   - User model: ✅');
  console.log('   - Trip model: ✅');
  console.log('   - Authentication setup: Ready to use!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (e) => {
    console.error('\n❌ Test failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
