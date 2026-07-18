import { AuthRole } from "./auth";

/**
 * Checks if the user has a specific role by name.
 * Handles both string arrays (from JWT) and object arrays (from login response).
 */
export function hasRole(roles: AuthRole[] | string[], roleName: string): boolean {
  if (!roles || !Array.isArray(roles)) return false;
  return roles.some((role) => {
    // Handle string roles (from JWT token)
    if (typeof role === "string") {
      console.log("Checking role:", role, "against", roleName);
      return role === roleName;
    }
    // Handle object roles (from login/refresh response)
    console.log("Checking role object:", role, "against", roleName);
    return role.name === roleName;
  });
}

/**
 * Convenience checks for specific roles
 */
export function isStudent(roles: AuthRole[]): boolean {
  return hasRole(roles, "student");
}

export function isClubLead(roles: AuthRole[]): boolean {
  return hasRole(roles, "club_lead");
}

export function isCoach(roles: AuthRole[]): boolean {
  return hasRole(roles, "peer_coach");
}

export function isCoachAdmin(roles: AuthRole[]): boolean {
  return hasRole(roles, "coach_admin");
}

export function isStaff(roles: AuthRole[]): boolean {
  return hasRole(roles, "staff");
}

export function isFaculty(roles: AuthRole[]): boolean {
  return hasRole(roles, "faculty");
}

export function isAdvisor(roles: AuthRole[]): boolean {
  return hasRole(roles, "advisor");
}

export function isStudentLeader(roles: AuthRole[]): boolean {
  return hasRole(roles, "student_leader");
}

export function isPlatformAdmin(roles: AuthRole[]): boolean {
  return hasRole(roles, "platform_admin");
}

/**
 * Formats role names for display in the UI.
 * Maps internal role names to user-friendly display names.
 */
export function formatRoleName(role: string | { name: string }): string {
  const roleName = typeof role === "string" ? role : role.name;
  
  const roleDisplayMap: Record<string, string> = {
    "coach_admin": "Senior Mental Wellness Coach",
    "peer_coach": "Peer Coach",
    "peer_counsellor": "Peer Counsellor",
    "student": "Student",
    "club_lead": "Club Lead",
    "student_leader": "Student Leader",
    "staff": "Staff",
    "faculty": "Faculty",
    "advisor": "Advisor",
    "platform_admin": "Admin",
  };
  
  return roleDisplayMap[roleName] || roleName.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
}
