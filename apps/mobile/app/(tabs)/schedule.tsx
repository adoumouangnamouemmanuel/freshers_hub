import React from "react";
import SessionsManager from "../../components/features/sessions/SessionsManager";

export default function ScheduleScreen() {
  return (
    <SessionsManager 
      endpoint="/support/sessions" 
      title="Schedule" 
      isAdminView={false} 
      hideBackButton={true} 
    />
  );
}
