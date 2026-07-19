"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  UserCheck,
  Sparkles,
} from "lucide-react";
import { mockCoachAssignments } from "@/lib/mock-data";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] as const } },
};

function ProgressBar({ completed, required }: { completed: number; required: number }) {
  const pct = Math.min((completed / required) * 100, 100);
  const color =
    pct >= 100 ? "from-emerald-400 to-emerald-600" :
    pct >= 66 ? "from-blue-400 to-blue-600" :
    pct >= 33 ? "from-amber-400 to-amber-600" :
    "from-red-400 to-red-600";
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 bg-[#f3f4f6] rounded-full h-2.5 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: [0.4, 0, 0.2, 1] }}
          className={`h-2.5 rounded-full bg-gradient-to-r ${color}`}
        />
      </div>
      <span className="text-sm font-semibold text-[#1A2B4A] w-16 text-right">
        {completed}/{required}
      </span>
    </div>
  );
}

export default function CoachingPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");

  const assignments = mockCoachAssignments.filter((a) => {
    const matchesSearch = a.fresher_name.toLowerCase().includes(search.toLowerCase());
    if (filter === "all") return matchesSearch;
    if (filter === "complete") return matchesSearch && a.sessions_completed >= a.sessions_required;
    if (filter === "incomplete") return matchesSearch && a.sessions_completed < a.sessions_required;
    if (filter === "none") return matchesSearch && a.sessions_completed === 0;
    return matchesSearch;
  });

  const totalComplete = assignments.filter((a) => a.sessions_completed >= a.sessions_required).length;
  const totalIncomplete = assignments.filter((a) => a.sessions_completed < a.sessions_required).length;
  const totalNone = assignments.filter((a) => a.sessions_completed === 0).length;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center gap-3 mb-1">
          <div className="h-8 w-1 rounded-full bg-[#A93C40]" />
          <p className="text-sm font-semibold text-[#A93C40] tracking-widest uppercase">Support Unit</p>
        </div>
        <h1 className="text-4xl font-bold text-[#1A2B4A] tracking-tight">Coaching</h1>
        <p className="text-[#6B7280] mt-2 text-lg">Peer coaching assignments and compliance tracking</p>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid gap-5 grid-cols-1 sm:grid-cols-4">
        {[
          { icon: UserCheck, value: assignments.length, label: "Total Assigned", color: "text-[#A93C40]" },
          { icon: CheckCircle2, value: totalComplete, label: "Complete", color: "text-emerald-600" },
          { icon: AlertCircle, value: totalIncomplete, label: "In Progress", color: "text-amber-600" },
          { icon: Clock, value: totalNone, label: "No Sessions Yet", color: "text-red-500" },
        ].map((item, i) => (
          <motion.div
            key={item.label}
            variants={itemVariants}
            whileHover={{ y: -3 }}
            className="rounded-2xl border bg-white p-5 shadow-sm hover:shadow-lg transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#A93C40]/10 to-[#d46a6e]/10 flex items-center justify-center">
                <item.icon className={`w-5 h-5 ${item.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#1A2B4A]">{item.value}</p>
                <p className="text-sm text-[#6B7280]">{item.label}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
          <input
            type="text"
            placeholder="Search freshers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#e5e7eb] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#A93C40]/20 focus:border-[#A93C40] transition-all placeholder:text-[#9CA3AF]"
          />
        </div>
        <div className="flex gap-2">
          {["all", "complete", "incomplete", "none"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                filter === f
                  ? "bg-[#A93C40] text-white border-[#A93C40] shadow-md shadow-[#A93C40]/20"
                  : "bg-white text-[#6B7280] border-[#e5e7eb] hover:bg-[#f8f4ef] hover:text-[#1A2B4A]"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Assignments Table */}
      <motion.div variants={itemVariants} className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <div className="p-6 border-b border-[#f3f4f6]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[#1A2B4A]">Assigned Freshers</h2>
              <p className="text-sm text-[#6B7280] mt-0.5">{assignments.length} total assignments</p>
            </div>
            <Sparkles className="w-4 h-4 text-[#A93C40]" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#f3f4f6] bg-[#f8f4ef]/50">
                {["Fresher", "Peer Coach", "Year", "Progress", "Status"].map((h) => (
                  <th key={h} className="text-left p-4 font-semibold text-[#6B7280] text-xs uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {assignments.map((a, i) => {
                const isComplete = a.sessions_completed >= a.sessions_required;
                return (
                  <motion.tr
                    key={a.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.3 }}
                    className="border-b border-[#f3f4f6] last:border-0 hover:bg-[#f8f4ef]/50 transition-colors"
                  >
                    <td className="p-4 font-semibold text-[#1A2B4A]">{a.fresher_name}</td>
                    <td className="p-4 text-[#6B7280]">{a.peer_coach_name}</td>
                    <td className="p-4 text-[#6B7280]">{a.academic_year}</td>
                    <td className="p-4 w-64"><ProgressBar completed={a.sessions_completed} required={a.sessions_required} /></td>
                    <td className="p-4">
                      {isComplete ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Complete
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          <AlertCircle className="w-3.5 h-3.5" /> In Progress
                        </span>
                      )}
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {assignments.length === 0 && (
          <div className="p-16 text-center text-[#6B7280]">No assignments found matching your search.</div>
        )}
      </motion.div>
    </motion.div>
  );
}