// Unit IDs: 1=coaching, 2=counselling, 3=advising
export function getUnitLabel(unitId?: number, type?: string): string {
  if (unitId === 3) return "ADVISING";
  if (unitId === 2) return "COUNSELLING";
  if (unitId === 1) return "COACHING";
  // Fallback to type if unit_id is missing
  if (type === "advisor") return "ADVISING";
  if (type === "counsellor") return "COUNSELLING";
  if (type === "peer_coach" || type === "unit_head") return "COACHING";
  return "SESSION";
}

export function getProviderRoleLabel(unitId?: number, type?: string): string {
  if (unitId === 3) return "Advisor";
  if (unitId === 2) return "Counsellor";
  if (unitId === 1) return "Coach";
  if (type === "advisor") return "Advisor";
  if (type === "counsellor") return "Counsellor";
  return "Coach";
}
