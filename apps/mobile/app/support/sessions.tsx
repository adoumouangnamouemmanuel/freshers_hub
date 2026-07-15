import React from "react";
import SessionsManager from "@/components/features/sessions/SessionsManager";

export default function ViewSessionsScreen() {
  return <SessionsManager endpoint="/support/sessions" title="My Sessions" />;
}
