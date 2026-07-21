import React from "react";
import SessionsManager from "@/components/features/sessions/SessionsManager";

export default function counsellingSessionsScreen() {
  return (
    <SessionsManager
      endpoint="/support/counselling/sessions"
      title="counselling Sessions"
      isAdminView={true}
      hideMySessions={true}
      showFab={true}
      isCounsellorView={true}
    />
  );
}
