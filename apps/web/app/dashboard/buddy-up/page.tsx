"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Users, RefreshCw, ExternalLink, Sparkles } from "lucide-react";
import { mockBuddyPairings } from "@/lib/mock-data";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] as const } },
};

export default function BuddyUpPage() {
  const [search, setSearch] = useState("");
  const filtered = mockBuddyPairings.filter((bp) => {
    const q = search.toLowerCase();
    return bp.fresher_name.toLowerCase().includes(q) || bp.buddy_name.toLowerCase().includes(q);
  });

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8">
      <motion.div variants={itemVariants}>
        <div className="flex items-center gap-3 mb-1">
          <div className="h-8 w-1 rounded-full bg-[#A93C40]" />
          <p className="text-sm font-semibold text-[#A93C40] tracking-widest uppercase">ODIP Program</p>
        </div>
        <h1 className="text-4xl font-bold text-[#1A2B4A] tracking-tight">Buddy Up</h1>
        <p className="text-[#6B7280] mt-2 text-lg">ODIP-sourced buddy pairings between freshers and returning students</p>
      </motion.div>

      <div className="grid gap-5 grid-cols-1 sm:grid-cols-4">
        {[
          { icon: Users, value: mockBuddyPairings.length, label: "Active Pairings" },
          { icon: Users, value: new Set(mockBuddyPairings.map((bp) => bp.fresher_id)).size, label: "Unique Freshers" },
          { icon: Users, value: new Set(mockBuddyPairings.map((bp) => bp.buddy_id)).size, label: "Unique Buddies" },
          { icon: RefreshCw, value: "2026/2027", label: "Academic Year" },
        ].map((item, i) => (
          <motion.div key={item.label} variants={itemVariants} whileHover={{ y: -3 }} className="rounded-2xl border bg-white p-5 shadow-sm hover:shadow-lg transition-all">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#A93C40]/10 to-[#d46a6e]/10 flex items-center justify-center">
                <item.icon className="w-5 h-5 text-[#A93C40]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#1A2B4A]">{item.value}</p>
                <p className="text-sm text-[#6B7280]">{item.label}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div variants={itemVariants} className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <RefreshCw className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="font-semibold text-[#1A2B4A]">ODIP Sync Status</p>
              <p className="text-sm text-[#6B7280]">Last synced: August 20, 2026 — All pairings up to date</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Synced
          </span>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
        <input type="text" placeholder="Search freshers or buddies..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#e5e7eb] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#A93C40]/20 focus:border-[#A93C40] transition-all placeholder:text-[#9CA3AF]" />
      </motion.div>

      <motion.div variants={itemVariants} className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <div className="p-6 border-b border-[#f3f4f6]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[#1A2B4A]">Buddy Pairings</h2>
              <p className="text-sm text-[#6B7280] mt-0.5">{filtered.length} pairings</p>
            </div>
            <Sparkles className="w-4 h-4 text-[#A93C40]" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#f3f4f6] bg-[#f8f4ef]/50">
                {["Fresher", "Buddy", "ODIP Ref", "Synced", "Contact"].map((h) => (
                  <th key={h} className="text-left p-4 font-semibold text-[#6B7280] text-xs uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((bp, i) => (
                <motion.tr key={bp.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  className="border-b border-[#f3f4f6] last:border-0 hover:bg-[#f8f4ef]/50 transition-colors">
                  <td className="p-4 font-semibold text-[#1A2B4A]">{bp.fresher_name}</td>
                  <td className="p-4 text-[#6B7280]">{bp.buddy_name}</td>
                  <td className="p-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                      {bp.odip_ref_id}
                    </span>
                  </td>
                  <td className="p-4 text-[#6B7280]">{new Date(bp.synced_at).toLocaleDateString()}</td>
                  <td className="p-4">
                    <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#A93C40]/5 text-[#A93C40] hover:bg-[#A93C40]/10 transition-colors">
                      <ExternalLink className="w-3.5 h-3.5" /> WhatsApp
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && <div className="p-16 text-center text-[#6B7280]">No buddy pairings found.</div>}
      </motion.div>
    </motion.div>
  );
}