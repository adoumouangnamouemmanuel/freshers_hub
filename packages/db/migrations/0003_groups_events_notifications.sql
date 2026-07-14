-- Migration: 0003_groups_events_notifications.sql
-- Day 10: Groups, targeted posts, events, RSVP, notifications

-- ============================================================
-- 1. Groups
-- ============================================================
CREATE TABLE IF NOT EXISTS groups (
    id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name    TEXT NOT NULL,
    type    TEXT NOT NULL DEFAULT 'custom'  -- 'class_year' | 'cohort' | 'custom'
);

CREATE TABLE IF NOT EXISTS group_members (
    group_id  UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (group_id, user_id)
);

-- ============================================================
-- 2. Post targeting (visibility)
-- ============================================================
ALTER TABLE posts ADD COLUMN IF NOT EXISTS visibility TEXT NOT NULL DEFAULT 'public';
-- visibility: 'public' | 'targeted'

CREATE TABLE IF NOT EXISTS post_targets (
    post_id      UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    target_type  TEXT NOT NULL,     -- 'group' | 'user'
    target_id    UUID NOT NULL,
    PRIMARY KEY (post_id, target_type, target_id)
);

-- ============================================================
-- 3. Events
-- ============================================================
CREATE TABLE IF NOT EXISTS events (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id       UUID NOT NULL UNIQUE REFERENCES posts(id) ON DELETE CASCADE,
    event_date    DATE NOT NULL,
    event_time    TIME NOT NULL,
    location      TEXT,
    organizer     TEXT,
    dress_code    TEXT,
    capacity      INT,
    rsvp_enabled  BOOLEAN NOT NULL DEFAULT true,
    status        TEXT NOT NULL DEFAULT 'scheduled'  -- 'scheduled' | 'cancelled' | 'completed'
);

CREATE TABLE IF NOT EXISTS event_rsvps (
    event_id   UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status     TEXT NOT NULL DEFAULT 'going',   -- 'going' | 'maybe' | 'declined'
    rsvp_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (event_id, user_id)
);

-- ============================================================
-- 4. Notifications
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category        TEXT NOT NULL,     -- 'event', 'announcement', 'rsvp', 'system'
    title           TEXT NOT NULL,
    body            TEXT,
    related_entity  TEXT,              -- e.g. 'event:<uuid>' or 'post:<uuid>'
    read_at         TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread 
    ON notifications(user_id, created_at DESC) WHERE read_at IS NULL;
