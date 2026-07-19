"use client";

import { useState } from "react";
import { FileText } from "lucide-react";
import { AnimatedPage, AnimatedSection } from "@/components/ui/animated-container";
import { PageHeader } from "@/components/ui/page-header";
import { SearchInput, FilterButton } from "@/components/ui/search-input";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";

const auditLogs = [
  { id: "1", user: "Platform Admin", action: "Role Changed", target: "Ama Owusu → peer_coach", timestamp: "2026-10-15 14:32", status: "success" },
  { id: "2", user: "Coach Yvonne", action: "Assignment Created", target: "Kofi Mensah → Yvonne Ankrah", timestamp: "2026-10-14 11:20", status: "success" },
  { id: "3", user: "Dr. Grace Asare", action: "Session Completed", target: "Counselling session", timestamp: "2026-10-13 16:45", status: "success" },
  { id: "4", user: "System", action: "ODIP Sync", target: "10 pairings synced", timestamp: "2026-10-12 03:00", status: "success" },
  { id: "5", user: "Platform Admin", action: "Data Import", target: "Admissions CSV (150 records)", timestamp: "2026-10-11 09:15", status: "success" },
  { id: "6", user: "System", action: "Session Reminder", target: "15 push notifications sent", timestamp: "2026-10-10 08:00", status: "warning" },
  { id: "7", user: "Platform Admin", action: "Broadcast Sent", target: "Compliance warning to 5 users", timestamp: "2026-10-09 14:00", status: "success" },
  { id: "8", user: "Prof. Kwesi Arthur", action: "Session Booked", target: "Advising appointment", timestamp: "2026-10-08 10:30", status: "success" },
  { id: "9", user: "System", action: "Login Attempt", target: "Failed login for school_id 2023050", timestamp: "2026-10-07 22:15", status: "error" },
  { id: "10", user: "Platform Admin", action: "Settings Updated", target: "Academic year changed to 2026/2027", timestamp: "2026-10-06 11:00", status: "success" },
];

export default function AuditLogPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const filtered = auditLogs.filter((log) => {
    const ms = log.user.toLowerCase().includes(search.toLowerCase()) || log.action.toLowerCase().includes(search.toLowerCase());
    if (filter === "all") return ms;
    return ms && log.status === filter;
  });

  return (
    <AnimatedPage>
      <PageHeader
        title="Audit Log"
        description="Chronological, filterable log of all administrative actions — the accountability layer"
        badge="System"
      />

      <div className="flex flex-col sm:flex-row gap-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Search by user or action..." className="flex-1" />
        <div className="flex gap-2">
          {["all", "success", "warning", "error"].map((f) => (
            <FilterButton key={f} label={f.charAt(0).toUpperCase() + f.slice(1)} active={filter === f} onClick={() => setFilter(f)} />
          ))}
        </div>
      </div>

      <DataTable
        columns={[
          { key: "user", header: "User", render: (log: any) => <span className="font-medium text-[#1A2B4A]">{log.user}</span> },
          { key: "action", header: "Action", render: (log: any) => <span className="text-[#1A2B4A]">{log.action}</span> },
          { key: "target", header: "Details", render: (log: any) => <span className="text-[#6B7280] text-xs">{log.target}</span> },
          { key: "timestamp", header: "Timestamp", render: (log: any) => <span className="text-[#6B7280]">{log.timestamp}</span> },
          { key: "status", header: "Status", render: (log: any) => <StatusBadge status={log.status} /> },
        ]}
        data={filtered}
        keyExtractor={(log: any) => log.id}
      />
    </AnimatedPage>
  );
}