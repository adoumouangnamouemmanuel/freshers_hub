INSERT INTO roles (name)
VALUES
  ('student'),
  ('peer_coach'),
  ('coach_admin'),
  ('counselling_head'),
  ('advisor'),
  ('odip_head'),
  ('staff'),
  ('faculty'),
  ('student_leader'),
  ('club_lead'),
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
  ('11111111-1111-1111-1111-111111111111', 'fresher.one@ashesi.edu.gh', 'Fresher One', '+233200000001', 2030, 'Ghana', 'Computer Science', NULL),
  ('22222222-2222-2222-2222-222222222222', 'fresher.two@ashesi.edu.gh', 'Fresher Two', '+233200000002', 2030, 'Nigeria', 'Business Administration', NULL),
  ('33333333-3333-3333-3333-333333333333', 'fresher.three@ashesi.edu.gh', 'Fresher Three', '+233200000003', 2029, 'Kenya', 'Electrical Engineering', NULL),
  ('44444444-4444-4444-4444-444444444444', 'ama.boakye@ashesi.edu.gh', 'Ama Boakye', '+233200000004', 2028, 'Ghana', 'Information Systems', NULL),
  ('55555555-5555-5555-5555-555555555555', 'kofi.owusu@ashesi.edu.gh', 'Kofi Owusu', '+233200000005', 2028, 'Ghana', 'Computer Science', NULL),
  ('66666666-6666-6666-6666-666666666666', 'yvonne.ansah@ashesi.edu.gh', 'Yvonne Ansah', '+233200000006', NULL, NULL, NULL, NULL),
  ('77777777-7777-7777-7777-777777777777', 'nana.danquah@ashesi.edu.gh', 'Nana Danquah', '+233200000007', NULL, NULL, NULL, NULL),
  ('88888888-8888-8888-8888-888888888888', 'efua.mensah@ashesi.edu.gh', 'Efua Mensah', '+233200000008', NULL, NULL, NULL, NULL),
  ('99999999-9999-9999-9999-999999999999', 'kojo.mensah@ashesi.edu.gh', 'Kojo Mensah', '+233200000009', NULL, NULL, NULL, NULL),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'sarah.anu@ashesi.edu.gh', 'Sarah Anu', '+233200000010', NULL, NULL, NULL, NULL),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'michael.tetteh@ashesi.edu.gh', 'Michael Tetteh', '+233200000011', NULL, NULL, NULL, NULL),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'platform.admin@ashesi.edu.gh', 'Platform Admin', '+233200000012', NULL, NULL, NULL, NULL)
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
  ('11111111-1111-1111-1111-111111111111', '30302030', '3030', 2030),
  ('22222222-2222-2222-2222-222222222222', '40412030', '4041', 2030),
  ('33333333-3333-3333-3333-333333333333', '50552029', '5055', 2029),
  ('44444444-4444-4444-4444-444444444444', '60662028', '6066', 2028),
  ('55555555-5555-5555-5555-555555555555', '70772028', '7077', 2028)
ON CONFLICT (user_id) DO UPDATE
SET school_id = EXCLUDED.school_id,
    identifier = EXCLUDED.identifier,
    graduation_year = EXCLUDED.graduation_year;

WITH student_role AS (
  SELECT id FROM roles WHERE name = 'student'
)
INSERT INTO user_roles (user_id, role_id)
SELECT user_id, student_role.id
FROM (VALUES
  ('11111111-1111-1111-1111-111111111111'::uuid),
  ('22222222-2222-2222-2222-222222222222'::uuid),
  ('33333333-3333-3333-3333-333333333333'::uuid),
  ('44444444-4444-4444-4444-444444444444'::uuid),
  ('55555555-5555-5555-5555-555555555555'::uuid)
) AS seeded_users(user_id), student_role
ON CONFLICT (user_id, role_id, unit_id) DO NOTHING;

WITH peer_coach_role AS (
  SELECT id FROM roles WHERE name = 'peer_coach'
), club_lead_role AS (
  SELECT id FROM roles WHERE name = 'club_lead'
), coach_admin_role AS (
  SELECT id FROM roles WHERE name = 'coach_admin'
), counselling_head_role AS (
  SELECT id FROM roles WHERE name = 'counselling_head'
), advisor_role AS (
  SELECT id FROM roles WHERE name = 'advisor'
), odip_head_role AS (
  SELECT id FROM roles WHERE name = 'odip_head'
), staff_role AS (
  SELECT id FROM roles WHERE name = 'staff'
), faculty_role AS (
  SELECT id FROM roles WHERE name = 'faculty'
), student_leader_role AS (
  SELECT id FROM roles WHERE name = 'student_leader'
), platform_admin_role AS (
  SELECT id FROM roles WHERE name = 'platform_admin'
), coaching_unit AS (
  SELECT id FROM units WHERE name = 'coaching'
), counselling_unit AS (
  SELECT id FROM units WHERE name = 'counselling'
), advising_unit AS (
  SELECT id FROM units WHERE name = 'advising'
), buddy_up_unit AS (
  SELECT id FROM units WHERE name = 'buddy_up'
), clubs_unit AS (
  SELECT id FROM units WHERE name = 'clubs'
), platform_unit AS (
  SELECT id FROM units WHERE name = 'platform'
)
INSERT INTO user_roles (user_id, role_id, unit_id, assigned_by)
SELECT '66666666-6666-6666-6666-666666666666', peer_coach_role.id, coaching_unit.id, 'cccccccc-cccc-cccc-cccc-cccccccccccc'::uuid
FROM peer_coach_role, coaching_unit
ON CONFLICT (user_id, role_id, unit_id) DO NOTHING;

WITH club_lead_role AS (
  SELECT id FROM roles WHERE name = 'club_lead'
), clubs_unit AS (
  SELECT id FROM units WHERE name = 'clubs'
)
INSERT INTO user_roles (user_id, role_id, unit_id, assigned_by)
SELECT '66666666-6666-6666-6666-666666666666', club_lead_role.id, clubs_unit.id, 'cccccccc-cccc-cccc-cccc-cccccccccccc'::uuid
FROM club_lead_role, clubs_unit
ON CONFLICT (user_id, role_id, unit_id) DO NOTHING;

WITH coach_admin_role AS (
  SELECT id FROM roles WHERE name = 'coach_admin'
), coaching_unit AS (
  SELECT id FROM units WHERE name = 'coaching'
)
INSERT INTO user_roles (user_id, role_id, unit_id, assigned_by)
SELECT '77777777-7777-7777-7777-777777777777', coach_admin_role.id, coaching_unit.id, 'cccccccc-cccc-cccc-cccc-cccccccccccc'::uuid
FROM coach_admin_role, coaching_unit
ON CONFLICT (user_id, role_id, unit_id) DO NOTHING;

WITH counselling_head_role AS (
  SELECT id FROM roles WHERE name = 'counselling_head'
), counselling_unit AS (
  SELECT id FROM units WHERE name = 'counselling'
)
INSERT INTO user_roles (user_id, role_id, unit_id, assigned_by)
SELECT '88888888-8888-8888-8888-888888888888', counselling_head_role.id, counselling_unit.id, 'cccccccc-cccc-cccc-cccc-cccccccccccc'::uuid
FROM counselling_head_role, counselling_unit
ON CONFLICT (user_id, role_id, unit_id) DO NOTHING;

WITH advisor_role AS (
  SELECT id FROM roles WHERE name = 'advisor'
), advising_unit AS (
  SELECT id FROM units WHERE name = 'advising'
)
INSERT INTO user_roles (user_id, role_id, unit_id, assigned_by)
SELECT '99999999-9999-9999-9999-999999999999', advisor_role.id, advising_unit.id, 'cccccccc-cccc-cccc-cccc-cccccccccccc'::uuid
FROM advisor_role, advising_unit
ON CONFLICT (user_id, role_id, unit_id) DO NOTHING;

WITH odip_head_role AS (
  SELECT id FROM roles WHERE name = 'odip_head'
), buddy_up_unit AS (
  SELECT id FROM units WHERE name = 'buddy_up'
)
INSERT INTO user_roles (user_id, role_id, unit_id, assigned_by)
SELECT 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', odip_head_role.id, buddy_up_unit.id, 'cccccccc-cccc-cccc-cccc-cccccccccccc'::uuid
FROM odip_head_role, buddy_up_unit
ON CONFLICT (user_id, role_id, unit_id) DO NOTHING;

WITH staff_role AS (
  SELECT id FROM roles WHERE name = 'staff'
), platform_unit AS (
  SELECT id FROM units WHERE name = 'platform'
)
INSERT INTO user_roles (user_id, role_id, unit_id, assigned_by)
SELECT 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', staff_role.id, platform_unit.id, 'cccccccc-cccc-cccc-cccc-cccccccccccc'::uuid
FROM staff_role, platform_unit
ON CONFLICT (user_id, role_id, unit_id) DO NOTHING;

WITH faculty_role AS (
  SELECT id FROM roles WHERE name = 'faculty'
), platform_unit AS (
  SELECT id FROM units WHERE name = 'platform'
)
INSERT INTO user_roles (user_id, role_id, unit_id, assigned_by)
SELECT 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', faculty_role.id, platform_unit.id, 'cccccccc-cccc-cccc-cccc-cccccccccccc'::uuid
FROM faculty_role, platform_unit
ON CONFLICT (user_id, role_id, unit_id) DO NOTHING;

WITH platform_admin_role AS (
  SELECT id FROM roles WHERE name = 'platform_admin'
)
INSERT INTO user_roles (user_id, role_id, unit_id, assigned_by)
SELECT 'cccccccc-cccc-cccc-cccc-cccccccccccc', platform_admin_role.id, NULL, NULL
FROM platform_admin_role
ON CONFLICT (user_id, role_id, unit_id) DO NOTHING;

WITH student_leader_role AS (
  SELECT id FROM roles WHERE name = 'student_leader'
)
INSERT INTO user_roles (user_id, role_id, unit_id, assigned_by)
SELECT '44444444-4444-4444-4444-444444444444', student_leader_role.id, NULL, 'cccccccc-cccc-cccc-cccc-cccccccccccc'::uuid
FROM student_leader_role
ON CONFLICT (user_id, role_id, unit_id) DO NOTHING;