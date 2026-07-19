"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Search, User, Sparkles, Shield } from "lucide-react";
import { mockUsers } from "@/lib/mock-data";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.04 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] as const } },
};

const roleColors: Record<string, string> = {
  student: "bg-blue-50 text-blue-700 border-blue-200",
  peer_coach: "bg-emerald-50 text-emerald-700 border-emerald-200",
  coach_admin: "bg-purple-50 text-purple-700 border-purple-200",
  counselling_head: "bg-rose-50 text-rose-700 border-rose-200",
  advisor: "bg-amber-50 text-amber-700 border-amber-200",
  odip_head: "bg-cyan-50 text-cyan-700 border-cyan-200",
  staff: "bg-gray-50 text-gray-700 border-gray-200",
  club_lead: "bg-indigo-50 text-indigo-700 border-indigo-200",
  platform_admin: "bg-red-50 text-red-700 border-red-200",
};

export default function UsersPage() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const allRoles = Array.from(new Set(mockUsers.flatMap((u) => u.roles))).sort();

  const filtered = mockUsers.filter((u) => {
    const ms = u.full_name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()) || u.school_id.toLowerCase().includes(search.toLowerCase());
    if (roleFilter === "all") return ms;
    return ms && u.roles.includes(roleFilter);
  });

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8">
      <motion.div variants={itemVariants}>
        <div className="flex items-center gap-3 mb-1">
          <div className="h-8 w-1 rounded-full bg-[#A93C40]" />
          <p className="text-sm font-semibold text-[#A93C40] tracking-widest uppercase">Administration</p>
        </div>
        <h1 className="text-4xl font-bold text-[#1A2B4A] tracking-tight">Users</h1>
        <p className="text-[#6B7280] mt-2 text-lg">User management and role administration</p>
      </motion.div>

      <div className="grid gap-5 grid-cols-1 sm:grid-cols-4">
        {[
          { label: "Total Users", value: mockUsers.length, color: "text-[#1A2B4A]" },
          { label: "Students", value: mockUsers.filter((u) => u.roles.includes("student")).length, color: "text-blue-600" },
          { label: "Staff", value: mockUsers.filter((u) => u.roles.includes("staff")).length, color: "text-purple-600" },
          { label: "Peer Coaches", value: mockUsers.filter((u) => u.roles.includes("peer_coach")).length, color: "text-emerald-600" },
        ].map((item, i) => (
          <motion.div key={item.label} variants={itemVariants} className="rounded-2xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-[#6B7280]">{item.label}</p>
            <p className={`text-2xl font-bold mt-1 ${item.color}`}>{item.value}</p>
          </motion.div>
        ))}
      </div>

      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
          <input type="text" placeholder="Search by name, email, or ID..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#e5e7eb] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#A93C40]/20 focus:border-[#A93C40] transition-all placeholder:text-[#9CA3AF]" />
        </div>
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}
          className="px-4 py-3 rounded-xl border border-[#e5e7eb] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#A93C40]/20 focus:border-[#A93C40] transition-all">
          <option value="all">All Roles</option>
          {allRoles.map((role) => (<option key={role} value={role}>{role.replace("_", " ")}</option>))}
        </select>
      </motion.div>

      <motion.div variants={itemVariants} className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <div className="p-6 border-b border-[#f3f4f6]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[#1A2B4A]">All Users</h2>
              <p className="text-sm text-[#6B7280] mt-0.5">{filtered.length} users</p>
            </div>
            <Sparkles className="w-4 h-4 text-[#A93C40]" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#f3f4f6] bg-[#f8f4ef]/50">
                {["Name", "School ID", "Email", "Class Year", "Major", "Roles", "Status"].map((h) => (
                  <th key={h} className="text-left p-4 font-semibold text-[#6B7280] text-xs uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((u, i) => (
                <motion.tr key={u.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                  className="border-b border-[#f3f4f6] last:border-0 hover:bg-[#f8f4ef]/50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#A93C40]/10 to-[#d46a6e]/10 flex items-center justify-center">
                        <User className="w-4 h-4 text-[#A93C40]" />
                      </div>
                      <span className="font-semibold text-[#1A2B4A]">{u.full_name}</span>
                    </div>
                  </td>
                  <td className="p-4 text-[#6B7280] font-mono text-xs">{u.school_id}</td>
                  <td className="p-4 text-[#6B7280]">{u.email}</td>
                  <td className="p-4 text-[#1A2B4A]">{u.class_year > 0 ? u.class_year : "—"}</td>
                  <td className="p-4 text-[#6B7280]">{u.major}</td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-1">
                      {u.roles.map((role) => (
                        <span key={role} className={`inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-semibold border ${roleColors[role] || "bg-gray-50 text-gray-700"}`}>
                          {role.replace("_", " ")}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="p-4">
                    {u.is_active ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-50 text-gray-700 border border-gray-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400" /> Inactive
                      </span>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && <div className="p-16 text-center text-[#6B7280]">No users found.</div>}
      </motion.div>
    </motion.div>
  );
}