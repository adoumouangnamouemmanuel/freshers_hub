"use client";

import { Calendar, Plus, Archive, CheckCircle2, Clock } from "lucide-react";
import { AnimatedPage, AnimatedSection } from "@/components/ui/animated-container";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { DataTable } from "@/components/ui/data-table";

const cycles = [
  { id: "1", label: "2024/2025", status: "archived", freshers: 142, coaches: 6, clubs: 4, completionRate: "78%" },
  { id: "2", label: "2025/2026", status: "archived", freshers: 156, coaches: 7, clubs: 5, completionRate: "82%" },
  { id: "3", label: "2026/2027", status: "active", freshers: 168, coaches: 8, clubs: 6, completionRate: "68%" },
  { id: "4", label: "2027/2028", status: "upcoming", freshers: 0, coaches: 0, clubs: 0, completionRate: "—" },
];

export default function AcademicYearsPage() {
  return (
    <AnimatedPage>
      <PageHeader
        title="Academic Years / Cycles"
        description="Manage the one-year cycles that structure all Fresher Hub data"
        badge="Administration"
        action={
          <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#A93C40] text-white text-sm font-semibold hover:bg-[#A93C40]/90 transition-colors shadow-md shadow-[#A93C40]/20 cursor-pointer">
            <Plus className="w-4 h-4" />
            Create New Cycle
          </button>
        }
      />

      <div className="grid gap-5 grid-cols-1 sm:grid-cols-4">
        {cycles.map((cycle) => (
          <AnimatedSection key={cycle.id} className="rounded-2xl border bg-white p-5 shadow-sm hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-3">
              <p className="font-bold text-lg text-[#1A2B4A]">{cycle.label}</p>
              <StatusBadge status={cycle.status} />
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[#6B7280]">Freshers</span>
                <span className="font-medium text-[#1A2B4A]">{cycle.freshers}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B7280]">Peer Coaches</span>
                <span className="font-medium text-[#1A2B4A]">{cycle.coaches}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B7280]">Clubs</span>
                <span className="font-medium text-[#1A2B4A]">{cycle.clubs}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-[#f3f4f6]">
                <span className="text-[#6B7280]">Completion</span>
                <span className="font-semibold text-emerald-600">{cycle.completionRate}</span>
              </div>
            </div>
          </AnimatedSection>
        ))}
      </div>

      <AnimatedSection className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <div className="p-6 border-b border-[#f3f4f6]">
          <h2 className="text-lg font-semibold text-[#1A2B4A]">Cycle History</h2>
        </div>
        <DataTable
          columns={[
            { key: "label", header: "Cycle", render: (c: any) => <span className="font-semibold text-[#1A2B4A]">{c.label}</span> },
            { key: "status", header: "Status", render: (c: any) => <StatusBadge status={c.status} /> },
            { key: "freshers", header: "Freshers", render: (c: any) => <span className="text-[#6B7280]">{c.freshers}</span> },
            { key: "coaches", header: "Coaches", render: (c: any) => <span className="text-[#6B7280]">{c.coaches}</span> },
            { key: "completion", header: "Completion", render: (c: any) => <span className="font-semibold text-emerald-600">{c.completionRate}</span> },
            { key: "actions", header: "", render: (c: any) => c.status === "archived" ? <button className="text-sm text-[#A93C40] font-semibold hover:underline cursor-pointer">View</button> : null },
          ]}
          data={cycles}
          keyExtractor={(c: any) => c.id}
        />
      </AnimatedSection>
    </AnimatedPage>
  );
}