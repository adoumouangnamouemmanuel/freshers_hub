INSERT INTO credentials (user_id, password_hash, is_activated, activated_at)
VALUES
  ('11111111-1111-1111-1111-111111111111', NULL, false, NULL),
  ('22222222-2222-2222-2222-222222222222', NULL, false, NULL),
  ('33333333-3333-3333-3333-333333333333', NULL, false, NULL),
  ('44444444-4444-4444-4444-444444444444', NULL, false, NULL),
  ('55555555-5555-5555-5555-555555555555', NULL, false, NULL)
ON CONFLICT (user_id) DO UPDATE
SET password_hash = EXCLUDED.password_hash,
    is_activated = EXCLUDED.is_activated,
    activated_at = EXCLUDED.activated_at,
    updated_at = now();

INSERT INTO activation_codes (user_id, otp_hash, expires_at, consumed_at)
VALUES
  ('11111111-1111-1111-1111-111111111111', crypt('123456', gen_salt('bf')), now() + interval '2 days', NULL),
  ('22222222-2222-2222-2222-222222222222', crypt('123456', gen_salt('bf')), now() + interval '2 days', NULL),
  ('33333333-3333-3333-3333-333333333333', crypt('123456', gen_salt('bf')), now() + interval '2 days', NULL),
  ('44444444-4444-4444-4444-444444444444', crypt('123456', gen_salt('bf')), now() + interval '2 days', NULL),
  ('55555555-5555-5555-5555-555555555555', crypt('123456', gen_salt('bf')), now() + interval '2 days', NULL)
ON CONFLICT (user_id) DO UPDATE
SET otp_hash = EXCLUDED.otp_hash,
    expires_at = EXCLUDED.expires_at,
    consumed_at = EXCLUDED.consumed_at;