import React from "react";
import SessionsManager from "@/components/features/sessions/SessionsManager";

export default function AdvisingSessionsScreen() {
  return (
    <SessionsManager
      endpoint="/support/advising/sessions"
      title="Advising Sessions"
      isAdminView={true}
      hideMySessions={false}
      showFab={false}
    />
  );
}
