// TODO: Replace '2026' with dynamic logic querying the current active academic year's start year.
// This is hardcoded for the initial September 2026 launch.
export const getActiveAcademicYearBase = (): number => {
  return 2026;
};

// Determines if a student is a fresher based on their graduation year.
// For the September 2026 launch, the Class of 2030 are the freshers (2026 + 4).
// TODO: Confirm graduation year offset for January intake (e.g., if it's +4 as well).
export const isUserFresher = (classYear?: number | string | null): boolean => {
  if (!classYear) return false;
  const baseYear = getActiveAcademicYearBase();
  return Number(classYear) === baseYear + 4;
};
