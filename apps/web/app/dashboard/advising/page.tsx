"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Search, User, Phone, Sparkles } from "lucide-react";
import { mockSessions, mockUsers } from "@/lib/mock-data";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] as const } },
};

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, string> = {
    completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
    booked: "bg-blue-50 text-blue-700 border-blue-200",
    cancelled: "bg-red-50 text-red-700 border-red-200",
    rescheduled: "bg-amber-50 text-amber-700 border-amber-200",
    no_show: "bg-gray-50 text-gray-700 border-gray-200",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold border ${config[status] || "bg-gray-50 text-gray-700"}`}>
      {status.replace("_", " ")}
    </span>
  );
}

export default function AdvisingPage() {
  const [search, setSearch] = useState("");
  const advisingSessions = mockSessions.filter((s) => s.unit_name === "Advising");
  const advisor = mockUsers.find((u) => u.roles.includes("advisor"));
  const filtered = advisingSessions.filter((s) => s.student_name.toLowerCase().includes(search.toLowerCase()));
  const completed = advisingSessions.filter((s) => s.status === "completed").length;

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8">
      <motion.div variants={itemVariants}>
        <div className="flex items-center gap-3 mb-1">
          <div className="h-8 w-1 rounded-full bg-[#A93C40]" />
          <p className="text-sm font-semibold text-[#A93C40] tracking-widest uppercase">Support Unit</p>
        </div>
        <h1 className="text-4xl font-bold text-[#1A2B4A] tracking-tight">Advising</h1>
        <p className="text-[#6B7280] mt-2 text-lg">Academic advising sessions and student appointments</p>
      </motion.div>

      {advisor && (
        <motion.div variants={itemVariants} className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#A93C40]/10 to-[#d46a6e]/10 flex items-center justify-center">
              <User className="w-7 h-7 text-[#A93C40]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[#1A2B4A]">{advisor.full_name}</h2>
              <p className="text-sm text-[#6B7280]">Academic Advisor</p>
              <div className="flex items-center gap-4 mt-1 text-sm text-[#6B7280]">
                <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{advisor.phone}</span>
                <span>{advisor.email}</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      <div className="grid gap-5 grid-cols-1 sm:grid-cols-3">
        {[
          { label: "Total Sessions", value: advisingSessions.length, color: "text-[#1A2B4A]" },
          { label: "Completed", value: completed, color: "text-emerald-600" },
          { label: "Unique Students", value: new Set(advisingSessions.map((s) => s.student_id)).size, color: "text-blue-600" },
        ].map((item, i) => (
          <motion.div key={item.label} variants={itemVariants} className="rounded-2xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-[#6B7280]">{item.label}</p>
            <p className={`text-2xl font-bold mt-1 ${item.color}`}>{item.value}</p>
          </motion.div>
        ))}
      </div>

      <motion.div variants={itemVariants} className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
        <input type="text" placeholder="Search students..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#e5e7eb] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#A93C40]/20 focus:border-[#A93C40] transition-all placeholder:text-[#9CA3AF]" />
      </motion.div>

      <motion.div variants={itemVariants} className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <div className="p-6 border-b border-[#f3f4f6]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[#1A2B4A]">Advising Sessions</h2>
              <p className="text-sm text-[#6B7280] mt-0.5">{filtered.length} sessions</p>
            </div>
            <Sparkles className="w-4 h-4 text-[#A93C40]" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#f3f4f6] bg-[#f8f4ef]/50">
                {["Student", "Advisor", "Date", "Location", "Status"].map((h) => (
                  <th key={h} className="text-left p-4 font-semibold text-[#6B7280] text-xs uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, i) => (
                <motion.tr key={s.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  className="border-b border-[#f3f4f6] last:border-0 hover:bg-[#f8f4ef]/50 transition-colors">
                  <td className="p-4 font-semibold text-[#1A2B4A]">{s.student_name}</td>
                  <td className="p-4 text-[#6B7280]">{s.provider_name}</td>
                  <td className="p-4 text-[#6B7280]">{new Date(s.scheduled_at).toLocaleDateString()}</td>
                  <td className="p-4 text-[#6B7280]">{s.location}</td>
                  <td className="p-4"><StatusBadge status={s.status} /></td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && <div className="p-16 text-center text-[#6B7280]">No advising sessions found.</div>}
      </motion.div>
    </motion.div>
  );
}