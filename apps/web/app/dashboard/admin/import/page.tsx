"use client";

import { Upload, Download, FileSpreadsheet, CheckCircle2, AlertCircle } from "lucide-react";
import { AnimatedPage, AnimatedSection } from "@/components/ui/animated-container";
import { PageHeader } from "@/components/ui/page-header";
import { MiniStatCard } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";

const importHistory = [
  { id: "1", type: "Admissions Data", date: "2026-08-01", records: 150, status: "success" },
  { id: "2", type: "ODIP Pairings", date: "2026-08-20", records: 10, status: "success" },
  { id: "3", type: "Staff Directory", date: "2026-07-15", records: 25, status: "success" },
  { id: "4", type: "Club Registrations", date: "2026-09-01", records: 6, status: "warning" },
];

export default function ImportPage() {
  return (
    <AnimatedPage>
      <PageHeader
        title="Import / Export"
        description="Bulk import admissions data, ODIP pairings, and export reports"
        badge="Super Admin"
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Import Section */}
        <AnimatedSection className="rounded-2xl border bg-white p-8 shadow-sm">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-[#A93C40]/10 flex items-center justify-center">
              <Upload className="w-6 h-6 text-[#A93C40]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[#1A2B4A]">Import Data</h2>
              <p className="text-sm text-[#6B7280]">Upload CSV files for bulk operations</p>
            </div>
          </div>

          <div className="border-2 border-dashed border-[#e5e7eb] rounded-2xl p-10 text-center hover:border-[#A93C40]/30 transition-colors cursor-pointer group">
            <Upload className="w-10 h-10 text-[#9CA3AF] mx-auto mb-4 group-hover:text-[#A93C40] transition-colors" />
            <p className="font-semibold text-[#1A2B4A]">Drop files here or click to upload</p>
            <p className="text-sm text-[#6B7280] mt-1">Supports CSV, XLSX files</p>
          </div>

          <div className="mt-6 space-y-3">
            {[
              { label: "Admissions Import Template", size: "2.4 MB" },
              { label: "ODIP Pairings Template", size: "1.1 MB" },
              { label: "Staff Directory Template", size: "0.8 MB" },
            ].map((file) => (
              <div key={file.label} className="flex items-center justify-between p-3 rounded-xl bg-[#f8f4ef]">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                  <span className="text-sm font-medium text-[#1A2B4A]">{file.label}</span>
                </div>
                <button className="text-sm text-[#A93C40] font-semibold hover:underline cursor-pointer">Download</button>
              </div>
            ))}
          </div>
        </AnimatedSection>

        {/* Export Section */}
        <AnimatedSection className="rounded-2xl border bg-white p-8 shadow-sm">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
              <Download className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[#1A2B4A]">Export Reports</h2>
              <p className="text-sm text-[#6B7280]">Download platform data and analytics</p>
            </div>
          </div>

          <div className="space-y-3">
            {[
              { label: "Compliance Report", desc: "All units completion status", size: "~3.2 MB" },
              { label: "User Directory", desc: "All registered users and roles", size: "~1.5 MB" },
              { label: "Session History", desc: "All sessions across units", size: "~4.1 MB" },
              { label: "Club Membership", desc: "Club rosters and leads", size: "~0.9 MB" },
              { label: "Analytics Summary", desc: "Aggregated platform metrics", size: "~0.5 MB" },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between p-3 rounded-xl hover:bg-[#f8f4ef] transition-colors">
                <div>
                  <p className="text-sm font-medium text-[#1A2B4A]">{item.label}</p>
                  <p className="text-xs text-[#6B7280]">{item.desc} · {item.size}</p>
                </div>
                <button className="px-4 py-2 rounded-lg bg-[#A93C40]/5 text-[#A93C40] text-sm font-semibold hover:bg-[#A93C40]/10 transition-colors cursor-pointer">
                  Export
                </button>
              </div>
            ))}
          </div>
        </AnimatedSection>
      </div>

      {/* Import History */}
      <AnimatedSection className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <div className="p-6 border-b border-[#f3f4f6]">
          <h2 className="text-lg font-semibold text-[#1A2B4A]">Import History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#f3f4f6] bg-[#f8f4ef]/50">
                {["Type", "Date", "Records", "Status"].map((h) => (
                  <th key={h} className="text-left p-4 font-semibold text-[#6B7280] text-xs uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {importHistory.map((item) => (
                <tr key={item.id} className="border-b last:border-0 hover:bg-[#f8f4ef]/50 transition-colors">
                  <td className="p-4 font-medium text-[#1A2B4A]">{item.type}</td>
                  <td className="p-4 text-[#6B7280]">{item.date}</td>
                  <td className="p-4 text-[#6B7280]">{item.records} records</td>
                  <td className="p-4"><StatusBadge status={item.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AnimatedSection>
    </AnimatedPage>
  );
}