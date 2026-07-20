-- Migration: 004_merge_clubs_to_groups.sql
-- Merges the dedicated 'clubs' table into the 'groups' table to unify collections of users.

-- 1. Add club-specific columns to groups
ALTER TABLE groups ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS lead_user_id UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE groups ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 2. Add role column to group_members
ALTER TABLE group_members ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'member';

-- 3. Migrate existing clubs into groups (if any)
INSERT INTO groups (id, name, type, description, category, is_active, lead_user_id, created_at, updated_at)
SELECT id, name, 'club', description, category, is_active, lead_user_id, created_at, updated_at
FROM clubs
ON CONFLICT (id) DO NOTHING;

-- 4. Migrate existing club members into group_members
INSERT INTO group_members (group_id, user_id, role, joined_at)
SELECT club_id, user_id, 'member', joined_at
FROM club_members
ON CONFLICT (group_id, user_id) DO NOTHING;

-- 5. Drop the old tables
DROP TABLE IF EXISTS club_members CASCADE;
DROP TABLE IF EXISTS clubs CASCADE;
