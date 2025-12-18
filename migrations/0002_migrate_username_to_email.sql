-- Add email column
ALTER TABLE "users" ADD COLUMN "email" text UNIQUE;

-- Copy username to email for existing users (if any)
UPDATE "users" SET "email" = "username" WHERE "email" IS NULL;

-- Make email NOT NULL after migration
ALTER TABLE "users" ALTER COLUMN "email" SET NOT NULL;

-- Drop username column
ALTER TABLE "users" DROP COLUMN "username";
