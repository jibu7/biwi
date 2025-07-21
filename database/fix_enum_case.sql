-- Fix SubscriptionStatus enum to match application code (lowercase)

-- Step 1: Rename the existing enum type
ALTER TYPE subscriptionstatus RENAME TO subscriptionstatus_old;

-- Step 2: Create the new enum type with lowercase values
CREATE TYPE subscriptionstatus AS ENUM ('trial', 'active', 'suspended', 'cancelled');

-- Step 3: Update the table to use the new enum type, casting from the old type
ALTER TABLE companies ALTER COLUMN subscription_status TYPE subscriptionstatus USING subscription_status::text::lowercase::subscriptionstatus;

-- Step 4: Drop the old enum type
DROP TYPE subscriptionstatus_old;

-- Verify the changes
SELECT 'Updated enum values:' as info;
SELECT enumlabel FROM pg_enum WHERE enumtypid = 'subscriptionstatus'::regtype ORDER BY enumsortorder;

SELECT 'Company subscription statuses:' as info;
SELECT id, name, subscription_status FROM companies;
