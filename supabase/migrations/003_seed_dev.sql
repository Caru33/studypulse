-- StudyPulse — Development Seed Data
-- Only run in development environments!
-- Uses ON CONFLICT DO NOTHING for idempotency.

-- This seed requires a user to exist in auth.users first.
-- After running the app and creating an account, replace 'YOUR_USER_ID' with your actual user ID.

-- Example usage (replace with your actual user UUID):
-- \set user_id 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'

-- For local development, the mock data in lib/mock-data.ts provides equivalent data
-- without needing to run this SQL file.

-- Uncomment and customize once you have a real user ID:

/*
-- Update your profile with university info
UPDATE profiles SET
  university = 'Université de Montréal',
  program = 'Pharmacie'
WHERE id = :'user_id';

-- Insert demo course 1
INSERT INTO courses (id, user_id, title, description, exam_date, total_concepts, mastery_score)
VALUES (
  'aaaaaaaa-0001-0000-0000-000000000001',
  :'user_id',
  'Pharmacologie — Antibiotiques',
  'Mécanismes d''action, résistances et applications cliniques des antibiotiques majeurs',
  (current_date + interval '3 days')::date,
  10,
  0.35
) ON CONFLICT (id) DO NOTHING;

-- Insert demo course 2
INSERT INTO courses (id, user_id, title, description, exam_date, total_concepts, mastery_score)
VALUES (
  'aaaaaaaa-0002-0000-0000-000000000002',
  :'user_id',
  'Calcul Différentiel et Intégral',
  'Limites, dérivées, intégrales et applications',
  (current_date + interval '14 days')::date,
  10,
  0.62
) ON CONFLICT (id) DO NOTHING;
*/
