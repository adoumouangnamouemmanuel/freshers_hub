-- ============================================================
-- Migration 003: Platform Admin Support
-- Run once against your PostgreSQL database.
-- Safe to run multiple times (IF NOT EXISTS everywhere).
-- ============================================================

-- ─────────────────────────────────────────────────────────
-- 1. ACADEMIC YEARS
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS academic_years (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    label       TEXT NOT NULL,                    -- e.g. "2025/2026"
    start_date  DATE NOT NULL,
    end_date    DATE NOT NULL,
    is_current  BOOLEAN NOT NULL DEFAULT false,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ensure exactly one row can be current at a time via a partial unique index
CREATE UNIQUE INDEX IF NOT EXISTS academic_years_single_current
    ON academic_years (is_current)
    WHERE is_current = true;

-- Seed a default year if empty
INSERT INTO academic_years (label, start_date, end_date, is_current)
SELECT '2024/2025', '2024-08-01', '2025-07-31', true
WHERE NOT EXISTS (SELECT 1 FROM academic_years);

-- ─────────────────────────────────────────────────────────
-- 2. CLUBS
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS clubs (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT NOT NULL,
    description TEXT,
    category    TEXT,
    lead_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    is_active   BOOLEAN NOT NULL DEFAULT true,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS club_members (
    club_id     UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (club_id, user_id)
);

-- ─────────────────────────────────────────────────────────
-- 3. OFFICES (Help Center)
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS offices (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL,
    description     TEXT,
    contact_email   TEXT,
    contact_phone   TEXT,
    location        TEXT,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS office_staff (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    office_id   UUID NOT NULL REFERENCES offices(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title       TEXT,
    UNIQUE (office_id, user_id)
);

CREATE TABLE IF NOT EXISTS office_links (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    office_id   UUID NOT NULL REFERENCES offices(id) ON DELETE CASCADE,
    label       TEXT NOT NULL,
    url         TEXT NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────────────────
-- 4. PLATFORM SETTINGS (key/value store)
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS platform_settings (
    key         TEXT PRIMARY KEY,
    value       JSONB NOT NULL DEFAULT '{}',
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by  UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Seed default settings
INSERT INTO platform_settings (key, value) VALUES
    ('whatsapp_tracking',   '{"enabled": false, "redirect_base_url": ""}'),
    ('odip_integration',    '{"enabled": false, "api_base_url": "", "last_sync_at": null}'),
    ('push_notifications',  '{"enabled": false, "provider": "expo"}')
ON CONFLICT (key) DO NOTHING;

-- ─────────────────────────────────────────────────────────
-- 5. AUDIT LOG
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_log (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id    UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    action      TEXT NOT NULL,          -- e.g. 'role.assigned', 'post.removed'
    entity_type TEXT NOT NULL,          -- e.g. 'user', 'club', 'post'
    entity_id   UUID,
    metadata    JSONB,                  -- action-specific detail
    ip_address  TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for common query patterns
CREATE INDEX IF NOT EXISTS audit_log_actor_idx  ON audit_log (actor_id);
CREATE INDEX IF NOT EXISTS audit_log_action_idx ON audit_log (action);
CREATE INDEX IF NOT EXISTS audit_log_entity_idx ON audit_log (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS audit_log_time_idx   ON audit_log (created_at DESC);

-- ─────────────────────────────────────────────────────────
-- 6. BUDDY UP SYNC LOG
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS buddy_sync_log (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    triggered_by UUID REFERENCES users(id) ON DELETE SET NULL,
    source      TEXT NOT NULL DEFAULT 'manual', -- 'manual' | 'cron'
    status      TEXT NOT NULL DEFAULT 'success',
    synced_count INT NOT NULL DEFAULT 0,
    error_detail TEXT,
    synced_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────────────────
-- 7. AGGREGATE VIEWS (confidentiality boundary)
--    Platform Admin sees counts/rates — never individual session rows.
-- ─────────────────────────────────────────────────────────

-- Coaching summary per academic year
CREATE OR REPLACE VIEW admin_coaching_summary AS
SELECT
    ca.academic_year_id,
    COUNT(DISTINCT ca.peer_coach_id)                                    AS total_peer_coaches,
    COUNT(DISTINCT ca.fresher_id)                                       AS total_freshers,
    COUNT(s.id) FILTER (
        WHERE s.status = 'completed'
          AND s.with_type = 'peer_coach'
    )                                                                   AS completed_sessions,
    COALESCE(
        ROUND(
            COUNT(s.id) FILTER (WHERE s.status = 'completed' AND s.with_type = 'peer_coach')::NUMERIC
            / NULLIF(COUNT(DISTINCT ca.fresher_id) * 3, 0) * 100
        ), 0
    )                                                                   AS completion_rate
FROM coach_assignments ca
LEFT JOIN sessions s
    ON s.student_id = ca.fresher_id
   AND s.with_type = 'peer_coach'
GROUP BY ca.academic_year_id;

-- Counselling summary (adjust table/column names to match your schema)
CREATE OR REPLACE VIEW admin_counselling_summary AS
SELECT
    s.academic_year_id,
    COUNT(DISTINCT s.student_id)                                        AS total_students_seen,
    COUNT(*)                                                            AS total_sessions,
    COUNT(*) FILTER (WHERE s.status = 'completed')                     AS completed_sessions,
    COALESCE(
        ROUND(COUNT(*) FILTER (WHERE s.status = 'completed')::NUMERIC
            / NULLIF(COUNT(*), 0) * 100), 0
    )                                                                   AS completion_rate
FROM sessions s
JOIN units u ON s.unit_id = u.id
WHERE lower(u.name) = 'counselling'
GROUP BY s.academic_year_id;

-- Advising summary
CREATE OR REPLACE VIEW admin_advising_summary AS
SELECT
    s.academic_year_id,
    COUNT(DISTINCT s.student_id)                                        AS total_students_seen,
    COUNT(*)                                                            AS total_sessions,
    COUNT(*) FILTER (WHERE s.status = 'completed')                     AS completed_sessions,
    COALESCE(
        ROUND(COUNT(*) FILTER (WHERE s.status = 'completed')::NUMERIC
            / NULLIF(COUNT(*), 0) * 100), 0
    )                                                                   AS completion_rate
FROM sessions s
JOIN units u ON s.unit_id = u.id
WHERE lower(u.name) = 'advising'
GROUP BY s.academic_year_id;

-- Buddy Up summary
CREATE OR REPLACE VIEW admin_buddy_up_summary AS
SELECT
    bp.academic_year_id,
    COUNT(*)                                                            AS total_pairings,
    COUNT(*) FILTER (WHERE bp.is_active)                               AS active_pairings,
    MAX(bsl.synced_at)                                                  AS last_sync_at
FROM buddy_pairings bp
CROSS JOIN LATERAL (
    SELECT synced_at FROM buddy_sync_log ORDER BY synced_at DESC LIMIT 1
) bsl
GROUP BY bp.academic_year_id;

-- ─────────────────────────────────────────────────────────
-- 8. ANALYTICS MATERIALIZED VIEWS
--    Refreshed nightly — stale-is-fine aggregate data.
-- ─────────────────────────────────────────────────────────

-- Cohort completion speed
CREATE MATERIALIZED VIEW IF NOT EXISTS analytics_cohort_completion_speed AS
SELECT
    u.class_year,
    ca.academic_year_id,
    COUNT(DISTINCT ca.fresher_id)                                      AS total_freshers,
    COUNT(DISTINCT s.student_id) FILTER (WHERE s.status = 'completed') AS completed_freshers,
    COALESCE(
        ROUND(AVG(
            EXTRACT(EPOCH FROM (s.updated_at - ca.created_at)) / 86400.0
        ) FILTER (WHERE s.status = 'completed')), 0
    )                                                                   AS avg_days_to_complete
FROM coach_assignments ca
LEFT JOIN sessions s
    ON s.student_id = ca.fresher_id AND s.status = 'completed'
JOIN users u ON u.id = ca.fresher_id
GROUP BY u.class_year, ca.academic_year_id;

CREATE UNIQUE INDEX IF NOT EXISTS analytics_cohort_speed_idx
    ON analytics_cohort_completion_speed (class_year, academic_year_id);

-- Monthly session counts (for trend chart)
CREATE MATERIALIZED VIEW IF NOT EXISTS analytics_monthly_sessions AS
SELECT
    DATE_TRUNC('month', s.scheduled_at)  AS month,
    s.academic_year_id,
    u.name                                AS unit_name,
    COUNT(*)                              AS total_sessions,
    COUNT(*) FILTER (WHERE s.status = 'completed') AS completed_sessions
FROM sessions s
JOIN units u ON u.id = s.unit_id
GROUP BY DATE_TRUNC('month', s.scheduled_at), s.academic_year_id, u.name;

CREATE UNIQUE INDEX IF NOT EXISTS analytics_monthly_sessions_idx
    ON analytics_monthly_sessions (month, academic_year_id, unit_name);

-- Grant platform_admin role access to aggregate views (not base tables)
-- NOTE: Replace 'fresher_hub_app' with your actual DB app user
-- GRANT SELECT ON admin_coaching_summary       TO fresher_hub_app;
-- GRANT SELECT ON admin_counselling_summary    TO fresher_hub_app;
-- GRANT SELECT ON admin_advising_summary       TO fresher_hub_app;
-- GRANT SELECT ON admin_buddy_up_summary       TO fresher_hub_app;
-- GRANT SELECT ON analytics_cohort_completion_speed TO fresher_hub_app;
-- GRANT SELECT ON analytics_monthly_sessions   TO fresher_hub_app;

-- ─────────────────────────────────────────────────────────
-- Done. Run: REFRESH MATERIALIZED VIEW CONCURRENTLY analytics_cohort_completion_speed;
--            REFRESH MATERIALIZED VIEW CONCURRENTLY analytics_monthly_sessions;
-- after first seeding session data.
-- ─────────────────────────────────────────────────────────
