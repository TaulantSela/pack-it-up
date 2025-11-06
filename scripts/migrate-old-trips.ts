/**
 * Script to handle trips created before authentication was added
 *
 * This script will:
 * 1. Find trips without userId
 * 2. Either delete them or assign them to the first user
 *
 * Run with: npx tsx scripts/migrate-old-trips.ts
 */

import { PrismaClient } from '@prisma/client';
import * as readline from 'readline';

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => rl.question(query, resolve));
}

async function main() {
  console.log('🔍 Checking for trips without userId...\n');

  // Find trips without userId
  const tripsWithoutUser = await prisma.trip.findMany({
    where: {
      userId: null as any, // TypeScript workaround
    },
    select: {
      id: true,
      name: true,
      destination: true,
      createdAt: true,
    },
  });

  if (tripsWithoutUser.length === 0) {
    console.log('✅ No trips without userId found. Database is clean!');
    rl.close();
    return;
  }

  console.log(`⚠️  Found ${tripsWithoutUser.length} trip(s) without userId:\n`);
  tripsWithoutUser.forEach((trip, index) => {
    console.log(`${index + 1}. ${trip.name} (${trip.destination}) - Created: ${trip.createdAt.toISOString()}`);
  });

  console.log('\n📋 What would you like to do?\n');
  console.log('1. Delete these trips (recommended if they are test data)');
  console.log('2. Assign them to an existing user');
  console.log('3. Cancel and handle manually\n');

  const choice = await question('Enter your choice (1, 2, or 3): ');

  if (choice === '1') {
    // Delete trips
    console.log('\n🗑️  Deleting trips...');

    const tripIds = tripsWithoutUser.map((t) => t.id);

    // Delete related records first
    await prisma.packingProgress.deleteMany({
      where: { tripId: { in: tripIds } },
    });

    await prisma.packingItem.deleteMany({
      where: { tripId: { in: tripIds } },
    });

    const deleted = await prisma.$executeRaw`DELETE FROM "Trip" WHERE "userId" IS NULL`;

    console.log(`✅ Deleted ${deleted} trip(s) and their related data\n`);
  } else if (choice === '2') {
    // Assign to a user
    console.log('\n👥 Finding existing users...');

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (users.length === 0) {
      console.log('❌ No users found in database. Please create a user first or choose option 1 to delete the trips.');
      rl.close();
      return;
    }

    console.log('\nAvailable users:');
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email || 'No email'} (ID: ${user.id.substring(0, 20)}...)`);
    });

    const userChoice = await question(`\nWhich user should own these trips? (1-${users.length}): `);
    const userIndex = parseInt(userChoice) - 1;

    if (userIndex >= 0 && userIndex < users.length) {
      const selectedUser = users[userIndex];

      console.log(`\n📝 Assigning trips to ${selectedUser.email || selectedUser.id}...`);

      const updated = await prisma.$executeRaw`UPDATE "Trip" SET "userId" = ${selectedUser.id} WHERE "userId" IS NULL`;

      console.log(`✅ Assigned ${updated} trip(s) to user\n`);
    } else {
      console.log('❌ Invalid choice. Operation cancelled.');
    }
  } else {
    console.log('\n✋ Operation cancelled. Please handle the trips manually.');
  }

  rl.close();
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log('\n✨ Done! You can now run: npx prisma db push');
    process.exit(0);
  })
  .catch(async (e) => {
    console.error('\n❌ Error:', e);
    await prisma.$disconnect();
    rl.close();
    process.exit(1);
  });
