import React from "react";
import SessionsManager from "@/components/features/sessions/SessionsManager";

export default function CoachingAdminSessionsScreen() {
  return <SessionsManager endpoint="/support/admin/sessions" title="Unit Sessions" isAdminView={true} />;
}
