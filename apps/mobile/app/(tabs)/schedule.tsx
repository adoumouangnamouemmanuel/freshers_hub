import React from "react";
import SessionsManager from "../../components/features/sessions/SessionsManager";

export default function ScheduleScreen() {
  return (
    <SessionsManager 
      endpoint="/support/admin/sessions" 
      title="Schedule" 
      isAdminView={true} 
      hideBackButton={true} 
    />
  );
}
