-- Option 1: Delete old trips without userId
-- Uncomment this if you want to delete old trips
-- DELETE FROM "PackingProgress" WHERE "tripId" IN (SELECT id FROM "Trip" WHERE "userId" IS NULL);
-- DELETE FROM "PackingItem" WHERE "tripId" IN (SELECT id FROM "Trip" WHERE "userId" IS NULL);
-- DELETE FROM "Trip" WHERE "userId" IS NULL;

-- Option 2: Assign old trips to a specific user
-- Replace 'your_user_id_here' with an actual Clerk user ID from your User table
-- First, find your user ID:
SELECT id, email FROM "User" ORDER BY "createdAt" DESC LIMIT 5;

-- Then uncomment and update the following line:
-- UPDATE "Trip" SET "userId" = 'your_user_id_here' WHERE "userId" IS NULL;

-- Verify the update
SELECT id, name, "userId", "createdAt" FROM "Trip" ORDER BY "createdAt" DESC;

