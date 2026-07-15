-- Migration: 0005_clubs_enhancements.sql
-- Adds description, category, and image_url to groups table to support rich club profiles.
-- Also adds an is_leader column to group_members.

ALTER TABLE groups
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'General',
ADD COLUMN IF NOT EXISTS image_url TEXT;

ALTER TABLE group_members
ADD COLUMN IF NOT EXISTS is_leader BOOLEAN NOT NULL DEFAULT false;

-- Add a small seed of mock data to existing clubs to make the UI look good
UPDATE groups
SET 
  description = 'A community of tech enthusiasts building cool projects.',
  category = 'Technology',
  image_url = 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=600&auto=format&fit=crop'
WHERE name ILIKE '%tech%';

UPDATE groups
SET 
  description = 'Debate, public speaking, and leadership development.',
  category = 'Academic',
  image_url = 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=600&auto=format&fit=crop'
WHERE name ILIKE '%debate%';

UPDATE groups
SET 
  description = 'Join us to explore different cultures, foods, and languages.',
  category = 'Culture',
  image_url = 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?q=80&w=600&auto=format&fit=crop'
WHERE description IS NULL AND name ILIKE '%culture%';

UPDATE groups
SET 
  description = 'General university club for student activities and fun events!',
  category = 'Social',
  image_url = 'https://images.unsplash.com/photo-1523580494112-071dcb8497cb?q=80&w=600&auto=format&fit=crop'
WHERE description IS NULL;
