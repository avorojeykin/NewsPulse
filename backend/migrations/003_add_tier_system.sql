-- Migration: Add tier system support
-- Date: 2025-10-05
-- Description: Add tier tracking to users and experiences tables

-- Add tier columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS tier VARCHAR(20) DEFAULT 'free';
ALTER TABLE users ADD COLUMN IF NOT EXISTS whop_membership_id VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50) DEFAULT 'active';
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP;

-- Add tier columns to experiences table
ALTER TABLE experiences ADD COLUMN IF NOT EXISTS tier VARCHAR(20) DEFAULT 'free';
ALTER TABLE experiences ADD COLUMN IF NOT EXISTS whop_plan_id VARCHAR(255);

-- Create indexes for fast tier lookups
CREATE INDEX IF NOT EXISTS idx_users_tier ON users(tier);
CREATE INDEX IF NOT EXISTS idx_users_membership ON users(whop_membership_id);
CREATE INDEX IF NOT EXISTS idx_experiences_tier ON experiences(tier);

-- Add comments
COMMENT ON COLUMN users.tier IS 'User tier: free or premium';
COMMENT ON COLUMN users.whop_membership_id IS 'Whop membership ID from webhook';
COMMENT ON COLUMN users.subscription_status IS 'active, cancelled, expired, past_due';
COMMENT ON COLUMN experiences.tier IS 'Community tier: free or premium';
COMMENT ON COLUMN experiences.whop_plan_id IS 'Whop plan ID (plan_free or plan_premium)';
