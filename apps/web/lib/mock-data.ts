// ============================================================
// Mock Data for Fresher Hub Admin Dashboard
// ============================================================

export interface User {
  id: string;
  school_id: string;
  email: string;
  full_name: string;
  phone: string;
  class_year: number;
  country: string;
  major: string;
  avatar_url: string;
  is_active: boolean;
  roles: string[];
  created_at: string;
}

export interface Session {
  id: string;
  unit_id: number;
  unit_name: string;
  academic_year: string;
  student_id: string;
  student_name: string;
  provider_id: string;
  provider_name: string;
  with_type: string | null;
  scheduled_at: string;
  location: string;
  status: "booked" | "completed" | "cancelled" | "rescheduled" | "no_show";
  is_mandatory: boolean;
  created_at: string;
}

export interface CoachAssignment {
  id: string;
  academic_year: string;
  fresher_id: string;
  fresher_name: string;
  peer_coach_id: string;
  peer_coach_name: string;
  assigned_by: string;
  sessions_completed: number;
  sessions_required: number;
  created_at: string;
}

export interface Club {
  id: string;
  name: string;
  description: string;
  cover_url: string;
  lead_id: string;
  lead_name: string;
  member_count: number;
  created_at: string;
}

export interface BuddyPairing {
  id: string;
  academic_year: string;
  fresher_id: string;
  fresher_name: string;
  buddy_id: string;
  buddy_name: string;
  odip_ref_id: string;
  synced_at: string;
}

export interface AnalyticsData {
  total_students: number;
  total_sessions: number;
  completion_rate: number;
  active_coaches: number;
  active_clubs: number;
  engagement_rate: number;
  sessions_by_unit: { unit: string; count: number }[];
  completion_by_class_year: { year: number; rate: number }[];
  monthly_sessions: { month: string; count: number }[];
  top_clubs: { name: string; members: number }[];
}

// ============================================================
// Users
// ============================================================
export const mockUsers: User[] = [
  { id: "u1", school_id: "2023001", email: "ama.owusu@ashesi.edu.gh", full_name: "Ama Owusu", phone: "+233 50 123 4567", class_year: 2029, country: "Ghana", major: "Computer Science", avatar_url: "", is_active: true, roles: ["student"], created_at: "2026-08-01T00:00:00Z" },
  { id: "u2", school_id: "2023002", email: "kofi.mensah@ashesi.edu.gh", full_name: "Kofi Mensah", phone: "+233 50 234 5678", class_year: 2029, country: "Ghana", major: "Business Administration", avatar_url: "", is_active: true, roles: ["student"], created_at: "2026-08-01T00:00:00Z" },
  { id: "u3", school_id: "2023003", email: "nana.boateng@ashesi.edu.gh", full_name: "Nana Boateng", phone: "+233 50 345 6789", class_year: 2029, country: "Ghana", major: "Engineering", avatar_url: "", is_active: true, roles: ["student"], created_at: "2026-08-01T00:00:00Z" },
  { id: "u4", school_id: "2023004", email: "efua.sackey@ashesi.edu.gh", full_name: "Efua Sackey", phone: "+233 50 456 7890", class_year: 2029, country: "Ghana", major: "Computer Science", avatar_url: "", is_active: true, roles: ["student"], created_at: "2026-08-01T00:00:00Z" },
  { id: "u5", school_id: "2023005", email: "yaw.asante@ashesi.edu.gh", full_name: "Yaw Asante", phone: "+233 50 567 8901", class_year: 2029, country: "Ghana", major: "Business Administration", avatar_url: "", is_active: true, roles: ["student"], created_at: "2026-08-01T00:00:00Z" },
  { id: "u6", school_id: "2023006", email: "akosua.agyemang@ashesi.edu.gh", full_name: "Akosua Agyemang", phone: "+233 50 678 9012", class_year: 2029, country: "Ghana", major: "Engineering", avatar_url: "", is_active: true, roles: ["student"], created_at: "2026-08-01T00:00:00Z" },
  { id: "u7", school_id: "2023007", email: "kwame.otoo@ashesi.edu.gh", full_name: "Kwame Otoo", phone: "+233 50 789 0123", class_year: 2029, country: "Ghana", major: "Computer Science", avatar_url: "", is_active: true, roles: ["student"], created_at: "2026-08-01T00:00:00Z" },
  { id: "u8", school_id: "2023008", email: "abena.osei@ashesi.edu.gh", full_name: "Abena Osei", phone: "+233 50 890 1234", class_year: 2029, country: "Ghana", major: "Business Administration", avatar_url: "", is_active: true, roles: ["student"], created_at: "2026-08-01T00:00:00Z" },
  { id: "u9", school_id: "2023009", email: "kojo.antwi@ashesi.edu.gh", full_name: "Kojo Antwi", phone: "+233 50 901 2345", class_year: 2029, country: "Ghana", major: "Engineering", avatar_url: "", is_active: true, roles: ["student"], created_at: "2026-08-01T00:00:00Z" },
  { id: "u10", school_id: "2023010", email: "adwoa.sarpong@ashesi.edu.gh", full_name: "Adwoa Sarpong", phone: "+233 50 012 3456", class_year: 2029, country: "Ghana", major: "Computer Science", avatar_url: "", is_active: true, roles: ["student"], created_at: "2026-08-01T00:00:00Z" },
  { id: "u11", school_id: "2023011", email: "samuel.nyarko@ashesi.edu.gh", full_name: "Samuel Nyarko", phone: "+233 50 111 2222", class_year: 2029, country: "Ghana", major: "Computer Science", avatar_url: "", is_active: true, roles: ["student"], created_at: "2026-08-01T00:00:00Z" },
  { id: "u12", school_id: "2023012", email: "maame.essilfie@ashesi.edu.gh", full_name: "Maame Essilfie", phone: "+233 50 222 3333", class_year: 2029, country: "Ghana", major: "Business Administration", avatar_url: "", is_active: true, roles: ["student"], created_at: "2026-08-01T00:00:00Z" },
  { id: "u13", school_id: "2023013", email: "ebenezer.quarshie@ashesi.edu.gh", full_name: "Ebenezer Quarshie", phone: "+233 50 333 4444", class_year: 2029, country: "Ghana", major: "Engineering", avatar_url: "", is_active: true, roles: ["student"], created_at: "2026-08-01T00:00:00Z" },
  { id: "u14", school_id: "2023014", email: "naa.dodoo@ashesi.edu.gh", full_name: "Naa Dodoo", phone: "+233 50 444 5555", class_year: 2029, country: "Ghana", major: "Computer Science", avatar_url: "", is_active: true, roles: ["student"], created_at: "2026-08-01T00:00:00Z" },
  { id: "u15", school_id: "2023015", email: "fiifi.quayson@ashesi.edu.gh", full_name: "Fiifi Quayson", phone: "+233 50 555 6666", class_year: 2029, country: "Ghana", major: "Business Administration", avatar_url: "", is_active: true, roles: ["student"], created_at: "2026-08-01T00:00:00Z" },
  // Peer Coaches
  { id: "pc1", school_id: "2022001", email: "yvonne.ankrah@ashesi.edu.gh", full_name: "Yvonne Ankrah", phone: "+233 50 666 7777", class_year: 2028, country: "Ghana", major: "Computer Science", avatar_url: "", is_active: true, roles: ["student", "peer_coach", "coach_admin"], created_at: "2025-08-01T00:00:00Z" },
  { id: "pc2", school_id: "2022002", email: "emmanuel.adjaye@ashesi.edu.gh", full_name: "Emmanuel Adjaye", phone: "+233 50 777 8888", class_year: 2028, country: "Ghana", major: "Engineering", avatar_url: "", is_active: true, roles: ["student", "peer_coach"], created_at: "2025-08-01T00:00:00Z" },
  { id: "pc3", school_id: "2022003", email: "serwaa.amponsah@ashesi.edu.gh", full_name: "Serwaa Amponsah", phone: "+233 50 888 9999", class_year: 2028, country: "Ghana", major: "Business Administration", avatar_url: "", is_active: true, roles: ["student", "peer_coach"], created_at: "2025-08-01T00:00:00Z" },
  { id: "pc4", school_id: "2022004", email: "daniel.owusu@ashesi.edu.gh", full_name: "Daniel Owusu", phone: "+233 50 999 0000", class_year: 2028, country: "Ghana", major: "Computer Science", avatar_url: "", is_active: true, roles: ["student", "peer_coach"], created_at: "2025-08-01T00:00:00Z" },
  // Staff / Unit Heads
  { id: "st1", school_id: "S001", email: "coach.yvonne@ashesi.edu.gh", full_name: "Coach Yvonne Ankrah", phone: "+233 50 101 2020", class_year: 0, country: "Ghana", major: "Staff", avatar_url: "", is_active: true, roles: ["staff", "coach_admin"], created_at: "2024-01-01T00:00:00Z" },
  { id: "st2", school_id: "S002", email: "counselling.head@ashesi.edu.gh", full_name: "Dr. Grace Asare", phone: "+233 50 202 3030", class_year: 0, country: "Ghana", major: "Staff", avatar_url: "", is_active: true, roles: ["staff", "counselling_head"], created_at: "2024-01-01T00:00:00Z" },
  { id: "st3", school_id: "S003", email: "advisor.office@ashesi.edu.gh", full_name: "Prof. Kwesi Arthur", phone: "+233 50 303 4040", class_year: 0, country: "Ghana", major: "Staff", avatar_url: "", is_active: true, roles: ["staff", "advisor"], created_at: "2024-01-01T00:00:00Z" },
  { id: "st4", school_id: "S004", email: "odip.head@ashesi.edu.gh", full_name: "Ms. Akua Bonsu", phone: "+233 50 404 5050", class_year: 0, country: "Ghana", major: "Staff", avatar_url: "", is_active: true, roles: ["staff", "odip_head"], created_at: "2024-01-01T00:00:00Z" },
  { id: "st5", school_id: "S005", email: "admin@ashesi.edu.gh", full_name: "Platform Admin", phone: "+233 50 505 6060", class_year: 0, country: "Ghana", major: "Staff", avatar_url: "", is_active: true, roles: ["staff", "platform_admin"], created_at: "2024-01-01T00:00:00Z" },
  // Club Leads
  { id: "cl1", school_id: "2021001", email: "ama.tech@ashesi.edu.gh", full_name: "Ama Owusu (Tech Club)", phone: "+233 50 606 7070", class_year: 2027, country: "Ghana", major: "Computer Science", avatar_url: "", is_active: true, roles: ["student", "club_lead"], created_at: "2024-08-01T00:00:00Z" },
  { id: "cl2", school_id: "2021002", email: "kofi.entrep@ashesi.edu.gh", full_name: "Kofi Mensah (Entrep)", phone: "+233 50 707 8080", class_year: 2027, country: "Ghana", major: "Business Administration", avatar_url: "", is_active: true, roles: ["student", "club_lead"], created_at: "2024-08-01T00:00:00Z" },
];

// ============================================================
// Coach Assignments
// ============================================================
export const mockCoachAssignments: CoachAssignment[] = [
  { id: "ca1", academic_year: "2026/2027", fresher_id: "u1", fresher_name: "Ama Owusu", peer_coach_id: "pc1", peer_coach_name: "Yvonne Ankrah", assigned_by: "Coach Yvonne Ankrah", sessions_completed: 2, sessions_required: 3, created_at: "2026-09-01T00:00:00Z" },
  { id: "ca2", academic_year: "2026/2027", fresher_id: "u2", fresher_name: "Kofi Mensah", peer_coach_id: "pc1", peer_coach_name: "Yvonne Ankrah", assigned_by: "Coach Yvonne Ankrah", sessions_completed: 1, sessions_required: 3, created_at: "2026-09-01T00:00:00Z" },
  { id: "ca3", academic_year: "2026/2027", fresher_id: "u3", fresher_name: "Nana Boateng", peer_coach_id: "pc2", peer_coach_name: "Emmanuel Adjaye", assigned_by: "Coach Yvonne Ankrah", sessions_completed: 3, sessions_required: 3, created_at: "2026-09-01T00:00:00Z" },
  { id: "ca4", academic_year: "2026/2027", fresher_id: "u4", fresher_name: "Efua Sackey", peer_coach_id: "pc2", peer_coach_name: "Emmanuel Adjaye", assigned_by: "Coach Yvonne Ankrah", sessions_completed: 0, sessions_required: 3, created_at: "2026-09-01T00:00:00Z" },
  { id: "ca5", academic_year: "2026/2027", fresher_id: "u5", fresher_name: "Yaw Asante", peer_coach_id: "pc3", peer_coach_name: "Serwaa Amponsah", assigned_by: "Coach Yvonne Ankrah", sessions_completed: 2, sessions_required: 3, created_at: "2026-09-01T00:00:00Z" },
  { id: "ca6", academic_year: "2026/2027", fresher_id: "u6", fresher_name: "Akosua Agyemang", peer_coach_id: "pc3", peer_coach_name: "Serwaa Amponsah", assigned_by: "Coach Yvonne Ankrah", sessions_completed: 1, sessions_required: 3, created_at: "2026-09-01T00:00:00Z" },
  { id: "ca7", academic_year: "2026/2027", fresher_id: "u7", fresher_name: "Kwame Otoo", peer_coach_id: "pc4", peer_coach_name: "Daniel Owusu", assigned_by: "Coach Yvonne Ankrah", sessions_completed: 0, sessions_required: 3, created_at: "2026-09-01T00:00:00Z" },
  { id: "ca8", academic_year: "2026/2027", fresher_id: "u8", fresher_name: "Abena Osei", peer_coach_id: "pc4", peer_coach_name: "Daniel Owusu", assigned_by: "Coach Yvonne Ankrah", sessions_completed: 3, sessions_required: 3, created_at: "2026-09-01T00:00:00Z" },
  { id: "ca9", academic_year: "2026/2027", fresher_id: "u9", fresher_name: "Kojo Antwi", peer_coach_id: "pc1", peer_coach_name: "Yvonne Ankrah", assigned_by: "Coach Yvonne Ankrah", sessions_completed: 1, sessions_required: 3, created_at: "2026-09-01T00:00:00Z" },
  { id: "ca10", academic_year: "2026/2027", fresher_id: "u10", fresher_name: "Adwoa Sarpong", peer_coach_id: "pc2", peer_coach_name: "Emmanuel Adjaye", assigned_by: "Coach Yvonne Ankrah", sessions_completed: 2, sessions_required: 3, created_at: "2026-09-01T00:00:00Z" },
  { id: "ca11", academic_year: "2026/2027", fresher_id: "u11", fresher_name: "Samuel Nyarko", peer_coach_id: "pc3", peer_coach_name: "Serwaa Amponsah", assigned_by: "Coach Yvonne Ankrah", sessions_completed: 0, sessions_required: 3, created_at: "2026-09-01T00:00:00Z" },
  { id: "ca12", academic_year: "2026/2027", fresher_id: "u12", fresher_name: "Maame Essilfie", peer_coach_id: "pc4", peer_coach_name: "Daniel Owusu", assigned_by: "Coach Yvonne Ankrah", sessions_completed: 2, sessions_required: 3, created_at: "2026-09-01T00:00:00Z" },
  { id: "ca13", academic_year: "2026/2027", fresher_id: "u13", fresher_name: "Ebenezer Quarshie", peer_coach_id: "pc1", peer_coach_name: "Yvonne Ankrah", assigned_by: "Coach Yvonne Ankrah", sessions_completed: 1, sessions_required: 3, created_at: "2026-09-01T00:00:00Z" },
  { id: "ca14", academic_year: "2026/2027", fresher_id: "u14", fresher_name: "Naa Dodoo", peer_coach_id: "pc2", peer_coach_name: "Emmanuel Adjaye", assigned_by: "Coach Yvonne Ankrah", sessions_completed: 3, sessions_required: 3, created_at: "2026-09-01T00:00:00Z" },
  { id: "ca15", academic_year: "2026/2027", fresher_id: "u15", fresher_name: "Fiifi Quayson", peer_coach_id: "pc3", peer_coach_name: "Serwaa Amponsah", assigned_by: "Coach Yvonne Ankrah", sessions_completed: 0, sessions_required: 3, created_at: "2026-09-01T00:00:00Z" },
];

// ============================================================
// Sessions
// ============================================================
export const mockSessions: Session[] = [
  { id: "s1", unit_id: 1, unit_name: "Coaching", academic_year: "2026/2027", student_id: "u1", student_name: "Ama Owusu", provider_id: "pc1", provider_name: "Yvonne Ankrah", with_type: "peer_coach", scheduled_at: "2026-09-15T10:00:00Z", location: "Library Room 3", status: "completed", is_mandatory: true, created_at: "2026-09-10T00:00:00Z" },
  { id: "s2", unit_id: 1, unit_name: "Coaching", academic_year: "2026/2027", student_id: "u1", student_name: "Ama Owusu", provider_id: "pc1", provider_name: "Yvonne Ankrah", with_type: "peer_coach", scheduled_at: "2026-10-01T14:00:00Z", location: "Student Center", status: "completed", is_mandatory: true, created_at: "2026-09-25T00:00:00Z" },
  { id: "s3", unit_id: 1, unit_name: "Coaching", academic_year: "2026/2027", student_id: "u1", student_name: "Ama Owusu", provider_id: "pc1", provider_name: "Yvonne Ankrah", with_type: "peer_coach", scheduled_at: "2026-10-20T11:00:00Z", location: "Library Room 3", status: "booked", is_mandatory: true, created_at: "2026-10-10T00:00:00Z" },
  { id: "s4", unit_id: 1, unit_name: "Coaching", academic_year: "2026/2027", student_id: "u2", student_name: "Kofi Mensah", provider_id: "pc1", provider_name: "Yvonne Ankrah", with_type: "peer_coach", scheduled_at: "2026-09-18T09:00:00Z", location: "Library Room 1", status: "completed", is_mandatory: true, created_at: "2026-09-12T00:00:00Z" },
  { id: "s5", unit_id: 1, unit_name: "Coaching", academic_year: "2026/2027", student_id: "u3", student_name: "Nana Boateng", provider_id: "pc2", provider_name: "Emmanuel Adjaye", with_type: "peer_coach", scheduled_at: "2026-09-20T13:00:00Z", location: "Library Room 2", status: "completed", is_mandatory: true, created_at: "2026-09-14T00:00:00Z" },
  { id: "s6", unit_id: 1, unit_name: "Coaching", academic_year: "2026/2027", student_id: "u3", student_name: "Nana Boateng", provider_id: "pc2", provider_name: "Emmanuel Adjaye", with_type: "peer_coach", scheduled_at: "2026-10-05T10:00:00Z", location: "Student Center", status: "completed", is_mandatory: true, created_at: "2026-09-28T00:00:00Z" },
  { id: "s7", unit_id: 1, unit_name: "Coaching", academic_year: "2026/2027", student_id: "u3", student_name: "Nana Boateng", provider_id: "pc2", provider_name: "Emmanuel Adjaye", with_type: "peer_coach", scheduled_at: "2026-10-22T15:00:00Z", location: "Library Room 2", status: "completed", is_mandatory: true, created_at: "2026-10-12T00:00:00Z" },
  { id: "s8", unit_id: 1, unit_name: "Coaching", academic_year: "2026/2027", student_id: "u5", student_name: "Yaw Asante", provider_id: "pc3", provider_name: "Serwaa Amponsah", with_type: "peer_coach", scheduled_at: "2026-09-22T11:00:00Z", location: "Library Room 3", status: "completed", is_mandatory: true, created_at: "2026-09-16T00:00:00Z" },
  { id: "s9", unit_id: 1, unit_name: "Coaching", academic_year: "2026/2027", student_id: "u5", student_name: "Yaw Asante", provider_id: "pc3", provider_name: "Serwaa Amponsah", with_type: "peer_coach", scheduled_at: "2026-10-10T14:00:00Z", location: "Student Center", status: "completed", is_mandatory: true, created_at: "2026-10-01T00:00:00Z" },
  { id: "s10", unit_id: 1, unit_name: "Coaching", academic_year: "2026/2027", student_id: "u8", student_name: "Abena Osei", provider_id: "pc4", provider_name: "Daniel Owusu", with_type: "peer_coach", scheduled_at: "2026-09-25T10:00:00Z", location: "Library Room 1", status: "completed", is_mandatory: true, created_at: "2026-09-18T00:00:00Z" },
  { id: "s11", unit_id: 1, unit_name: "Coaching", academic_year: "2026/2027", student_id: "u8", student_name: "Abena Osei", provider_id: "pc4", provider_name: "Daniel Owusu", with_type: "peer_coach", scheduled_at: "2026-10-15T09:00:00Z", location: "Library Room 1", status: "completed", is_mandatory: true, created_at: "2026-10-05T00:00:00Z" },
  { id: "s12", unit_id: 1, unit_name: "Coaching", academic_year: "2026/2027", student_id: "u8", student_name: "Abena Osei", provider_id: "pc4", provider_name: "Daniel Owusu", with_type: "peer_coach", scheduled_at: "2026-11-01T11:00:00Z", location: "Student Center", status: "completed", is_mandatory: true, created_at: "2026-10-20T00:00:00Z" },
  { id: "s13", unit_id: 1, unit_name: "Coaching", academic_year: "2026/2027", student_id: "u14", student_name: "Naa Dodoo", provider_id: "pc2", provider_name: "Emmanuel Adjaye", with_type: "peer_coach", scheduled_at: "2026-09-28T13:00:00Z", location: "Library Room 2", status: "completed", is_mandatory: true, created_at: "2026-09-20T00:00:00Z" },
  { id: "s14", unit_id: 1, unit_name: "Coaching", academic_year: "2026/2027", student_id: "u14", student_name: "Naa Dodoo", provider_id: "pc2", provider_name: "Emmanuel Adjaye", with_type: "peer_coach", scheduled_at: "2026-10-18T10:00:00Z", location: "Student Center", status: "completed", is_mandatory: true, created_at: "2026-10-08T00:00:00Z" },
  { id: "s15", unit_id: 1, unit_name: "Coaching", academic_year: "2026/2027", student_id: "u14", student_name: "Naa Dodoo", provider_id: "pc2", provider_name: "Emmanuel Adjaye", with_type: "peer_coach", scheduled_at: "2026-11-10T14:00:00Z", location: "Library Room 2", status: "completed", is_mandatory: true, created_at: "2026-10-30T00:00:00Z" },
  // Counselling sessions
  { id: "s16", unit_id: 2, unit_name: "Counselling", academic_year: "2026/2027", student_id: "u4", student_name: "Efua Sackey", provider_id: "st2", provider_name: "Dr. Grace Asare", with_type: null, scheduled_at: "2026-09-20T10:00:00Z", location: "Counselling Office", status: "completed", is_mandatory: false, created_at: "2026-09-15T00:00:00Z" },
  { id: "s17", unit_id: 2, unit_name: "Counselling", academic_year: "2026/2027", student_id: "u7", student_name: "Kwame Otoo", provider_id: "st2", provider_name: "Dr. Grace Asare", with_type: null, scheduled_at: "2026-10-05T14:00:00Z", location: "Counselling Office", status: "completed", is_mandatory: false, created_at: "2026-09-28T00:00:00Z" },
  { id: "s18", unit_id: 2, unit_name: "Counselling", academic_year: "2026/2027", student_id: "u11", student_name: "Samuel Nyarko", provider_id: "st2", provider_name: "Dr. Grace Asare", with_type: null, scheduled_at: "2026-10-15T11:00:00Z", location: "Counselling Office", status: "booked", is_mandatory: false, created_at: "2026-10-08T00:00:00Z" },
  // Advising sessions
  { id: "s19", unit_id: 3, unit_name: "Advising", academic_year: "2026/2027", student_id: "u2", student_name: "Kofi Mensah", provider_id: "st3", provider_name: "Prof. Kwesi Arthur", with_type: null, scheduled_at: "2026-09-12T09:00:00Z", location: "Advisor Office", status: "completed", is_mandatory: false, created_at: "2026-09-05T00:00:00Z" },
  { id: "s20", unit_id: 3, unit_name: "Advising", academic_year: "2026/2027", student_id: "u6", student_name: "Akosua Agyemang", provider_id: "st3", provider_name: "Prof. Kwesi Arthur", with_type: null, scheduled_at: "2026-10-01T10:00:00Z", location: "Advisor Office", status: "completed", is_mandatory: false, created_at: "2026-09-22T00:00:00Z" },
  { id: "s21", unit_id: 3, unit_name: "Advising", academic_year: "2026/2027", student_id: "u10", student_name: "Adwoa Sarpong", provider_id: "st3", provider_name: "Prof. Kwesi Arthur", with_type: null, scheduled_at: "2026-10-20T13:00:00Z", location: "Advisor Office", status: "booked", is_mandatory: false, created_at: "2026-10-10T00:00:00Z" },
];

// ============================================================
// Clubs
// ============================================================
export const mockClubs: Club[] = [
  { id: "c1", name: "Tech Club", description: "Exploring technology, coding, and innovation at Ashesi.", cover_url: "", lead_id: "cl1", lead_name: "Ama Owusu (Tech Club)", member_count: 45, created_at: "2025-09-01T00:00:00Z" },
  { id: "c2", name: "Entrepreneurship Club", description: "Fostering entrepreneurial thinking and business skills.", cover_url: "", lead_id: "cl2", lead_name: "Kofi Mensah (Entrep)", member_count: 38, created_at: "2025-09-01T00:00:00Z" },
  { id: "c3", name: "Debate Society", description: "Sharpening critical thinking and public speaking.", cover_url: "", lead_id: "u1", lead_name: "Ama Owusu", member_count: 28, created_at: "2025-09-05T00:00:00Z" },
  { id: "c4", name: "Photography Club", description: "Capturing moments and telling stories through images.", cover_url: "", lead_id: "u5", lead_name: "Yaw Asante", member_count: 22, created_at: "2025-09-10T00:00:00Z" },
  { id: "c5", name: "Music Society", description: "Celebrating music, performance, and cultural expression.", cover_url: "", lead_id: "u8", lead_name: "Abena Osei", member_count: 35, created_at: "2025-09-01T00:00:00Z" },
  { id: "c6", name: "Environmental Club", description: "Promoting sustainability and environmental awareness on campus.", cover_url: "", lead_id: "u12", lead_name: "Maame Essilfie", member_count: 18, created_at: "2025-09-15T00:00:00Z" },
];

// ============================================================
// Buddy Pairings
// ============================================================
export const mockBuddyPairings: BuddyPairing[] = [
  { id: "bp1", academic_year: "2026/2027", fresher_id: "u1", fresher_name: "Ama Owusu", buddy_id: "u11", buddy_name: "Samuel Nyarko", odip_ref_id: "ODIP-2026-001", synced_at: "2026-08-20T00:00:00Z" },
  { id: "bp2", academic_year: "2026/2027", fresher_id: "u2", fresher_name: "Kofi Mensah", buddy_id: "u12", buddy_name: "Maame Essilfie", odip_ref_id: "ODIP-2026-002", synced_at: "2026-08-20T00:00:00Z" },
  { id: "bp3", academic_year: "2026/2027", fresher_id: "u3", fresher_name: "Nana Boateng", buddy_id: "u13", buddy_name: "Ebenezer Quarshie", odip_ref_id: "ODIP-2026-003", synced_at: "2026-08-20T00:00:00Z" },
  { id: "bp4", academic_year: "2026/2027", fresher_id: "u4", fresher_name: "Efua Sackey", buddy_id: "u14", buddy_name: "Naa Dodoo", odip_ref_id: "ODIP-2026-004", synced_at: "2026-08-20T00:00:00Z" },
  { id: "bp5", academic_year: "2026/2027", fresher_id: "u5", fresher_name: "Yaw Asante", buddy_id: "u15", buddy_name: "Fiifi Quayson", odip_ref_id: "ODIP-2026-005", synced_at: "2026-08-20T00:00:00Z" },
  { id: "bp6", academic_year: "2026/2027", fresher_id: "u6", fresher_name: "Akosua Agyemang", buddy_id: "u11", buddy_name: "Samuel Nyarko", odip_ref_id: "ODIP-2026-006", synced_at: "2026-08-20T00:00:00Z" },
  { id: "bp7", academic_year: "2026/2027", fresher_id: "u7", fresher_name: "Kwame Otoo", buddy_id: "u12", buddy_name: "Maame Essilfie", odip_ref_id: "ODIP-2026-007", synced_at: "2026-08-20T00:00:00Z" },
  { id: "bp8", academic_year: "2026/2027", fresher_id: "u8", fresher_name: "Abena Osei", buddy_id: "u13", buddy_name: "Ebenezer Quarshie", odip_ref_id: "ODIP-2026-008", synced_at: "2026-08-20T00:00:00Z" },
  { id: "bp9", academic_year: "2026/2027", fresher_id: "u9", fresher_name: "Kojo Antwi", buddy_id: "u14", buddy_name: "Naa Dodoo", odip_ref_id: "ODIP-2026-009", synced_at: "2026-08-20T00:00:00Z" },
  { id: "bp10", academic_year: "2026/2027", fresher_id: "u10", fresher_name: "Adwoa Sarpong", buddy_id: "u15", buddy_name: "Fiifi Quayson", odip_ref_id: "ODIP-2026-010", synced_at: "2026-08-20T00:00:00Z" },
];

// ============================================================
// Analytics
// ============================================================
export const mockAnalytics: AnalyticsData = {
  total_students: 15,
  total_sessions: 21,
  completion_rate: 71.4,
  active_coaches: 4,
  active_clubs: 6,
  engagement_rate: 68.5,
  sessions_by_unit: [
    { unit: "Coaching", count: 15 },
    { unit: "Counselling", count: 3 },
    { unit: "Advising", count: 3 },
  ],
  completion_by_class_year: [
    { year: 2029, rate: 71 },
    { year: 2028, rate: 85 },
    { year: 2027, rate: 92 },
  ],
  monthly_sessions: [
    { month: "Sep", count: 8 },
    { month: "Oct", count: 9 },
    { month: "Nov", count: 4 },
  ],
  top_clubs: [
    { name: "Tech Club", members: 45 },
    { name: "Entrepreneurship Club", members: 38 },
    { name: "Music Society", members: 35 },
    { name: "Debate Society", members: 28 },
    { name: "Photography Club", members: 22 },
  ],
};