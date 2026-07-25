-- Migration: 0011_add_cover_image.sql
-- Adds cover_image to groups table to support rich club profiles.

ALTER TABLE groups
ADD COLUMN IF NOT EXISTS cover_image TEXT;
