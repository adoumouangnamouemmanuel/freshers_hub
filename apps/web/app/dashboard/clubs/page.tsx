"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Users, Building2, User, Sparkles } from "lucide-react";
import { mockClubs } from "@/lib/mock-data";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] as const } },
};

export default function ClubsPage() {
  const [search, setSearch] = useState("");
  const filtered = mockClubs.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));
  const totalMembers = mockClubs.reduce((sum, c) => sum + c.member_count, 0);

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8">
      <motion.div variants={itemVariants}>
        <div className="flex items-center gap-3 mb-1">
          <div className="h-8 w-1 rounded-full bg-[#A93C40]" />
          <p className="text-sm font-semibold text-[#A93C40] tracking-widest uppercase">Student Life</p>
        </div>
        <h1 className="text-4xl font-bold text-[#1A2B4A] tracking-tight">Clubs</h1>
        <p className="text-[#6B7280] mt-2 text-lg">Student clubs and organizations management</p>
      </motion.div>

      <div className="grid gap-5 grid-cols-1 sm:grid-cols-4">
        {[
          { icon: Building2, value: mockClubs.length, label: "Total Clubs", color: "text-[#A93C40]" },
          { icon: Users, value: totalMembers, label: "Total Members", color: "text-blue-600" },
          { icon: Users, value: Math.round(totalMembers / mockClubs.length), label: "Avg Members/Club", color: "text-amber-600" },
          { icon: Building2, value: Math.max(...mockClubs.map((c) => c.member_count)), label: "Largest Club", color: "text-emerald-600" },
        ].map((item, i) => (
          <motion.div key={item.label} variants={itemVariants} whileHover={{ y: -3 }} className="rounded-2xl border bg-white p-5 shadow-sm hover:shadow-lg transition-all">
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

      <motion.div variants={itemVariants} className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
        <input type="text" placeholder="Search clubs..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#e5e7eb] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#A93C40]/20 focus:border-[#A93C40] transition-all placeholder:text-[#9CA3AF]" />
      </motion.div>

      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((club, i) => (
          <motion.div
            key={club.id}
            variants={itemVariants}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
            className="rounded-2xl border bg-white shadow-sm hover:shadow-xl transition-all overflow-hidden group"
          >
            <div className="h-36 rounded-t-2xl bg-gradient-to-br from-[#A93C40]/20 via-[#d46a6e]/10 to-[#1A2B4A]/5 flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
              <Building2 className="w-14 h-14 text-[#A93C40]/30 group-hover:scale-110 group-hover:text-[#A93C40]/40 transition-all duration-300" />
            </div>
            <div className="p-6 space-y-3">
              <h3 className="font-bold text-lg text-[#1A2B4A]">{club.name}</h3>
              <p className="text-sm text-[#6B7280] leading-relaxed">{club.description}</p>
              <div className="flex items-center justify-between text-sm pt-2 border-t border-[#f3f4f6]">
                <span className="flex items-center gap-1.5 text-[#6B7280]">
                  <Users className="w-4 h-4 text-[#A93C40]" />
                  <span className="font-semibold text-[#1A2B4A]">{club.member_count}</span> members
                </span>
                <span className="flex items-center gap-1.5 text-[#6B7280]">
                  <User className="w-4 h-4 text-[#A93C40]" />
                  {club.lead_name}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      {filtered.length === 0 && <div className="p-16 text-center text-[#6B7280]">No clubs found.</div>}
    </motion.div>
  );
}