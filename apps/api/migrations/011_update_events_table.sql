-- Migration: Add new fields for Google Calendar-style events
ALTER TABLE events
ADD COLUMN IF NOT EXISTS end_date DATE,
ADD COLUMN IF NOT EXISTS end_time TIME,
ADD COLUMN IF NOT EXISTS is_all_day BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS meeting_link VARCHAR(255),
ADD COLUMN IF NOT EXISTS reminder_minutes INT;
