-- Add onboarding_done and onboarding_done_at columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS onboarding_done BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS onboarding_done_at TIMESTAMPTZ;
