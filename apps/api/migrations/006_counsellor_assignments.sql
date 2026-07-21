CREATE TABLE IF NOT EXISTS counsellor_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academic_year_id INTEGER REFERENCES academic_years(id) ON DELETE CASCADE,
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  peer_counsellor_id UUID REFERENCES users(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(academic_year_id, student_id, peer_counsellor_id)
);
