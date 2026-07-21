import React from "react";
import SessionsManager from "@/components/features/sessions/SessionsManager";

export default function CoachingAdminSessionsScreen() {
  // This shows all sessions in the coaching unit
  return <SessionsManager endpoint="/support/admin/sessions" title="Coaching Unit Sessions" isAdminView={true} showFab={false} />;
}
