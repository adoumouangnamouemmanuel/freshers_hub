"use client";

import { motion } from "framer-motion";
import { GraduationCap, Users, TrendingUp, Sparkles } from "lucide-react";
import { AnimatedPage, AnimatedSection } from "@/components/ui/animated-container";
import { PageHeader } from "@/components/ui/page-header";
import { MiniStatCard } from "@/components/ui/card";
import { ConfidentialityBanner } from "@/components/ui/confidentiality-banner";
import { mockUsers } from "@/lib/mock-data";

export default function CoachingPage() {
  const peerCoaches = mockUsers.filter(u => u.roles.includes("peer_coach"));
  const coachAdmin = mockUsers.find(u => u.roles.includes("coach_admin"));

  return (
    <AnimatedPage>
      <PageHeader title="Coaching" description="Aggregate coaching program metrics — individual session data is unit-confidential" badge="Support Unit" />

      <ConfidentialityBanner unit="coaching" />

      <div className="grid gap-5 grid-cols-1 sm:grid-cols-4">
        <MiniStatCard icon={Users} value={peerCoaches.length} label="Peer Coaches" />
        <MiniStatCard icon={Users} value="15" label="Assigned Freshers" />
        <MiniStatCard icon={TrendingUp} value="68%" label="Completion Rate" color="text-emerald-600" />
        <MiniStatCard icon={GraduationCap} value="2.4" label="Avg Sessions/Fresher" color="text-blue-600" />
      </div>

      {/* Peer Coach List — structural only */}
      <AnimatedSection className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <div className="p-6 border-b border-[#f3f4f6]">
          <h2 className="text-lg font-semibold text-[#1A2B4A]">Peer Coaches</h2>
          <p className="text-sm text-[#6B7280] mt-0.5">Staffing overview — aggregate completion rates shown, no individual session data</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-[#f3f4f6] bg-[#f8f4ef]/50">
              {["Name", "Assigned Freshers", "Completion Rate", "Status"].map(h => (
                <th key={h} className="text-left p-4 font-semibold text-[#6B7280] text-xs uppercase tracking-wider">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {peerCoaches.map((pc, i) => (
                <motion.tr key={pc.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="border-b last:border-0 hover:bg-[#f8f4ef]/50 transition-colors">
                  <td className="p-4 font-medium text-[#1A2B4A]">{pc.full_name}</td>
                  <td className="p-4 text-[#6B7280]">{Math.floor(Math.random() * 5) + 2}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-[#f3f4f6] rounded-full h-1.5 overflow-hidden">
                        <div className="h-1.5 rounded-full bg-emerald-500" style={{ width: `${60 + Math.floor(Math.random() * 35)}%` }} />
                      </div>
                      <span className="text-xs font-medium text-emerald-600">{Math.floor(Math.random() * 35) + 60}%</span>
                    </div>
                  </td>
                  <td className="p-4"><span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active</span></td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </AnimatedSection>
    </AnimatedPage>
  );
}