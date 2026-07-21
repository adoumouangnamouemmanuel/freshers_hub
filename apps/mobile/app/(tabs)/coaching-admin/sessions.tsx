import React from "react";
import SessionsManager from "@/components/features/sessions/SessionsManager";

export default function CoachingAdminSessionsScreen() {
  // This shows all sessions in the coaching unit EXCEPT the coach admin's own sessions
  // (which are in My Bookings)
  return <SessionsManager endpoint="/support/admin/sessions" title="Coaching Unit Sessions" isAdminView={true} hideMySessions={true} showFab={false} />;
}
