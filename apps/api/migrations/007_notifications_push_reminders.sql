-- Push token opt-in table (one row per device per user)
CREATE TABLE IF NOT EXISTS user_push_tokens (
  id          BIGSERIAL PRIMARY KEY,
  user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  push_token  TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, push_token)
);
CREATE INDEX IF NOT EXISTS idx_user_push_tokens_user_id ON user_push_tokens(user_id);

-- Scheduled reminders (processed by a background job)
CREATE TABLE IF NOT EXISTS notification_reminders (
  id              BIGSERIAL    PRIMARY KEY,
  user_id         UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category        TEXT         NOT NULL DEFAULT 'reminder',
  title           TEXT         NOT NULL,
  body            TEXT         NOT NULL,
  related_entity  TEXT,
  scheduled_at    TIMESTAMPTZ  NOT NULL,
  sent_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notification_reminders_due
  ON notification_reminders(scheduled_at) WHERE sent_at IS NULL;
