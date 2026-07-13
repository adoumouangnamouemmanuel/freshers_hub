TRUNCATE TABLE refresh_tokens, activation_codes, credentials, user_roles, student_profiles, academic_years, units, roles, users RESTART IDENTITY CASCADE;

INSERT INTO roles (name)
VALUES
  ('student'),
  ('peer_coach'),
  ('coach_admin'),
  ('staff'),
  ('faculty'),
  ('club_lead'),
  ('advisor'),
  ('student_leader'),
  ('platform_admin')
ON CONFLICT (name) DO NOTHING;

INSERT INTO units (name)
VALUES
  ('coaching'),
  ('counselling'),
  ('advising'),
  ('buddy_up'),
  ('clubs'),
  ('platform')
ON CONFLICT (name) DO NOTHING;

INSERT INTO academic_years (label, start_date, end_date, is_current)
VALUES
  ('2025/2026', '2025-08-01', '2026-06-30', false),
  ('2026/2027', '2026-08-01', '2027-06-30', true)
ON CONFLICT (label) DO UPDATE
SET start_date = EXCLUDED.start_date,
    end_date = EXCLUDED.end_date,
    is_current = EXCLUDED.is_current;

UPDATE academic_years
SET is_current = false
WHERE label <> '2026/2027';

INSERT INTO users (id, email, full_name, phone, class_year, country, major, avatar_url)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'fresher.one@ashesi.edu.gh', 'Fresher One', '+233200000001', 2027, 'Ghana', 'Computer Science', NULL),
  ('22222222-2222-2222-2222-222222222222', 'fresher.two@ashesi.edu.gh', 'Fresher Two', '+233200000002', 2028, 'Nigeria', 'Business Administration', NULL),
  ('33333333-3333-3333-3333-333333333333', 'fresher.three@ashesi.edu.gh', 'Fresher Three', '+233200000003', 2029, 'Kenya', 'Electrical Engineering', NULL),
  ('44444444-4444-4444-4444-444444444444', 'yvonne.ansah@ashesi.edu.gh', 'Yvonne Ansah', '+233200000004', NULL, NULL, NULL, NULL),
  ('55555555-5555-5555-5555-555555555555', 'nana.danquah@ashesi.edu.gh', 'Nana Danquah', '+233200000005', NULL, NULL, NULL, NULL)
ON CONFLICT (email) DO UPDATE
SET full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone,
    class_year = EXCLUDED.class_year,
    country = EXCLUDED.country,
    major = EXCLUDED.major,
    avatar_url = EXCLUDED.avatar_url,
    updated_at = now();

INSERT INTO student_profiles (user_id, school_id, identifier, graduation_year)
VALUES
  ('11111111-1111-1111-1111-111111111111', '30302027', '3030', 2027),
  ('22222222-2222-2222-2222-222222222222', '40412028', '4041', 2028),
  ('33333333-3333-3333-3333-333333333333', '50552029', '5055', 2029)
ON CONFLICT (user_id) DO UPDATE
SET school_id = EXCLUDED.school_id,
    identifier = EXCLUDED.identifier,
    graduation_year = EXCLUDED.graduation_year;

WITH student_role AS (
  SELECT id FROM roles WHERE name = 'student'
), club_lead_role AS (
  SELECT id FROM roles WHERE name = 'club_lead'
), peer_coach_role AS (
  SELECT id FROM roles WHERE name = 'peer_coach'
), coach_admin_role AS (
  SELECT id FROM roles WHERE name = 'coach_admin'
), staff_role AS (
  SELECT id FROM roles WHERE name = 'staff'
), faculty_role AS (
  SELECT id FROM roles WHERE name = 'faculty'
), advisor_role AS (
  SELECT id FROM roles WHERE name = 'advisor'
), student_leader_role AS (
  SELECT id FROM roles WHERE name = 'student_leader'
), coaching_unit AS (
  SELECT id FROM units WHERE name = 'coaching'
), counselling_unit AS (
  SELECT id FROM units WHERE name = 'counselling'
), advising_unit AS (
  SELECT id FROM units WHERE name = 'advising'
), clubs_unit AS (
  SELECT id FROM units WHERE name = 'clubs'
), platform_unit AS (
  SELECT id FROM units WHERE name = 'platform'
)
INSERT INTO user_roles (user_id, role_id, unit_id, assigned_by)
SELECT '11111111-1111-1111-1111-111111111111', student_role.id, NULL, NULL
FROM student_role
ON CONFLICT (user_id, role_id, unit_id) DO NOTHING;

WITH student_role AS (
  SELECT id FROM roles WHERE name = 'student'
), club_lead_role AS (
  SELECT id FROM roles WHERE name = 'club_lead'
), student_leader_role AS (
  SELECT id FROM roles WHERE name = 'student_leader'
)
INSERT INTO user_roles (user_id, role_id, unit_id, assigned_by)
SELECT '22222222-2222-2222-2222-222222222222', student_role.id, NULL, NULL
FROM student_role
ON CONFLICT (user_id, role_id, unit_id) DO NOTHING;

WITH club_lead_role AS (
  SELECT id FROM roles WHERE name = 'club_lead'
), student_leader_role AS (
  SELECT id FROM roles WHERE name = 'student_leader'
), clubs_unit AS (
  SELECT id FROM units WHERE name = 'clubs'
)
INSERT INTO user_roles (user_id, role_id, unit_id, assigned_by)
SELECT '22222222-2222-2222-2222-222222222222', club_lead_role.id, clubs_unit.id, '44444444-4444-4444-4444-444444444444'::uuid
FROM club_lead_role, clubs_unit
ON CONFLICT (user_id, role_id, unit_id) DO NOTHING;

WITH student_role AS (
  SELECT id FROM roles WHERE name = 'student'
), peer_coach_role AS (
  SELECT id FROM roles WHERE name = 'peer_coach'
), coaching_unit AS (
  SELECT id FROM units WHERE name = 'coaching'
)
INSERT INTO user_roles (user_id, role_id, unit_id, assigned_by)
SELECT '33333333-3333-3333-3333-333333333333', student_role.id, NULL, NULL
FROM student_role
ON CONFLICT (user_id, role_id, unit_id) DO NOTHING;

WITH peer_coach_role AS (
  SELECT id FROM roles WHERE name = 'peer_coach'
), coaching_unit AS (
  SELECT id FROM units WHERE name = 'coaching'
)
INSERT INTO user_roles (user_id, role_id, unit_id, assigned_by)
SELECT '33333333-3333-3333-3333-333333333333', peer_coach_role.id, coaching_unit.id, '44444444-4444-4444-4444-444444444444'::uuid
FROM peer_coach_role, coaching_unit
ON CONFLICT (user_id, role_id, unit_id) DO NOTHING;

WITH coach_admin_role AS (
  SELECT id FROM roles WHERE name = 'coach_admin'
), staff_role AS (
  SELECT id FROM roles WHERE name = 'staff'
), platform_unit AS (
  SELECT id FROM units WHERE name = 'platform'
)
INSERT INTO user_roles (user_id, role_id, unit_id, assigned_by)
SELECT '44444444-4444-4444-4444-444444444444', coach_admin_role.id, platform_unit.id, NULL
FROM coach_admin_role, platform_unit
ON CONFLICT (user_id, role_id, unit_id) DO NOTHING;

WITH staff_role AS (
  SELECT id FROM roles WHERE name = 'staff'
), platform_unit AS (
  SELECT id FROM units WHERE name = 'platform'
)
INSERT INTO user_roles (user_id, role_id, unit_id, assigned_by)
SELECT '44444444-4444-4444-4444-444444444444', staff_role.id, platform_unit.id, NULL
FROM staff_role, platform_unit
ON CONFLICT (user_id, role_id, unit_id) DO NOTHING;

WITH advisor_role AS (
  SELECT id FROM roles WHERE name = 'advisor'
), faculty_role AS (
  SELECT id FROM roles WHERE name = 'faculty'
), advising_unit AS (
  SELECT id FROM units WHERE name = 'advising'
)
INSERT INTO user_roles (user_id, role_id, unit_id, assigned_by)
SELECT '55555555-5555-5555-5555-555555555555', advisor_role.id, advising_unit.id, NULL
FROM advisor_role, advising_unit
ON CONFLICT (user_id, role_id, unit_id) DO NOTHING;

WITH faculty_role AS (
  SELECT id FROM roles WHERE name = 'faculty'
), platform_unit AS (
  SELECT id FROM units WHERE name = 'platform'
)
INSERT INTO user_roles (user_id, role_id, unit_id, assigned_by)
SELECT '55555555-5555-5555-5555-555555555555', faculty_role.id, platform_unit.id, NULL
FROM faculty_role, platform_unit
ON CONFLICT (user_id, role_id, unit_id) DO NOTHING;