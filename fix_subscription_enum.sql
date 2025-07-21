-- Fix SubscriptionStatus enum to match application code
-- The application expects lowercase values but database has uppercase

-- First, check current values
SELECT 'Current enum values:' as info;
SELECT enumlabel FROM pg_enum WHERE enumtypid = 'subscriptionstatus'::regtype ORDER BY enumsortorder;

-- Update all existing data to use lowercase values before changing the enum
UPDATE companies SET subscription_status = 'trial' WHERE subscription_status = 'TRIAL';
UPDATE companies SET subscription_status = 'active' WHERE subscription_status = 'ACTIVE';
UPDATE companies SET subscription_status = 'suspended' WHERE subscription_status = 'SUSPENDED';
UPDATE companies SET subscription_status = 'cancelled' WHERE subscription_status = 'CANCELLED';

-- Create a new enum type with lowercase values
CREATE TYPE subscriptionstatus_new AS ENUM ('trial', 'active', 'suspended', 'cancelled');

-- Update the column to use the new enum type
ALTER TABLE companies ALTER COLUMN subscription_status TYPE subscriptionstatus_new USING subscription_status::text::subscriptionstatus_new;

-- Drop the old enum type and rename the new one
DROP TYPE subscriptionstatus;
ALTER TYPE subscriptionstatus_new RENAME TO subscriptionstatus;

-- Verify the changes
SELECT 'Updated enum values:' as info;
SELECT enumlabel FROM pg_enum WHERE enumtypid = 'subscriptionstatus'::regtype ORDER BY enumsortorder;

-- Check updated data
SELECT 'Company subscription statuses:' as info;
SELECT id, name, subscription_status FROM companies;
