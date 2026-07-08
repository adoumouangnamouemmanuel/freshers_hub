INSERT INTO roles (name)
VALUES
  ('student'),
  ('club_lead')
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
VALUES ('2026/2027', '2026-08-01', '2027-06-30', true)
ON CONFLICT (label) DO NOTHING;

INSERT INTO users (id, email, full_name, class_year, country, major)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'fresher.one@ashesi.edu.gh',
  'Fresher One',
  2030,
  'Ghana',
  'Computer Science'
)
ON CONFLICT (email) DO UPDATE
SET email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    class_year = EXCLUDED.class_year,
    country = EXCLUDED.country,
    major = EXCLUDED.major,
    updated_at = now();

INSERT INTO student_profiles (user_id, school_id, identifier, graduation_year)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  '30302030',
  '3030',
  2030
)
ON CONFLICT (user_id) DO UPDATE
SET school_id = EXCLUDED.school_id,
    identifier = EXCLUDED.identifier,
    graduation_year = EXCLUDED.graduation_year;

WITH student_role AS (
  SELECT id FROM roles WHERE name = 'student'
), club_lead_role AS (
  SELECT id FROM roles WHERE name = 'club_lead'
)
INSERT INTO user_roles (user_id, role_id)
SELECT '11111111-1111-1111-1111-111111111111', student_role.id
FROM student_role
ON CONFLICT (user_id, role_id, unit_id) DO NOTHING;

WITH student_role AS (
  SELECT id FROM roles WHERE name = 'student'
), club_lead_role AS (
  SELECT id FROM roles WHERE name = 'club_lead'
), clubs_unit AS (
  SELECT id FROM units WHERE name = 'clubs'
)
INSERT INTO user_roles (user_id, role_id, unit_id)
SELECT '11111111-1111-1111-1111-111111111111', club_lead_role.id, clubs_unit.id
FROM club_lead_role, clubs_unit
ON CONFLICT (user_id, role_id, unit_id) DO NOTHING;