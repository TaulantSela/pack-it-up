-- Fix users with empty string emails
-- This updates all users with empty emails to NULL
-- Run this in your PostgreSQL database if you're getting unique constraint errors

UPDATE "User"
SET email = NULL
WHERE email = '';

-- Verify the fix
SELECT id, email, "createdAt"
FROM "User"
ORDER BY "createdAt" DESC;

