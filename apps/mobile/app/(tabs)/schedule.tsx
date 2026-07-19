import React from "react";
import SessionsManager from "../../components/features/sessions/SessionsManager";

export default function ScheduleScreen() {
  // This shows only sessions involving the current user (coach Yvonne)
  return (
    <SessionsManager 
      endpoint="/support/my-sessions" 
      title="My Schedule" 
      isAdminView={true} 
      hideBackButton={true} 
      hideMySessions={false}
      showFab={true}
    />
  );
}
