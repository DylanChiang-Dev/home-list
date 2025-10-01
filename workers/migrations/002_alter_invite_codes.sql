-- Migration: Add missing columns to invite_codes table
-- Date: 2025-10-01

-- Add id column
ALTER TABLE invite_codes ADD COLUMN id TEXT;

-- Add max_uses column
ALTER TABLE invite_codes ADD COLUMN max_uses INTEGER DEFAULT 1;

-- Add used_count column
ALTER TABLE invite_codes ADD COLUMN used_count INTEGER DEFAULT 0;

-- Update existing rows to have UUID ids
UPDATE invite_codes SET id = lower(hex(randomblob(16))) WHERE id IS NULL;
