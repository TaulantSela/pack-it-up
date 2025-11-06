/**
 * Script to fix existing users with empty string emails
 * Run with: npx tsx scripts/fix-empty-emails.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Checking for users with empty email strings...');

  const usersWithEmptyEmails = await prisma.user.findMany({
    where: {
      email: '',
    },
  });

  console.log(`Found ${usersWithEmptyEmails.length} users with empty email strings`);

  if (usersWithEmptyEmails.length > 0) {
    console.log('🔧 Fixing users...');

    for (const user of usersWithEmptyEmails) {
      await prisma.user.update({
        where: { id: user.id },
        data: { email: null },
      });
      console.log(`✅ Fixed user ${user.id}`);
    }

    console.log('✨ All done! Users with empty emails have been updated to null.');
  } else {
    console.log('✅ No users to fix!');
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (e) => {
    console.error('❌ Error:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
