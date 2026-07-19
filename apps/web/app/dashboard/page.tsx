"use client";

import { motion } from "framer-motion";
import {
  Users, GraduationCap, Building2, LifeBuoy, TrendingUp, ArrowUpRight,
  Sparkles, Calendar, Shield, Megaphone, Download, Plus,
} from "lucide-react";
import { mockAnalytics, mockCoachAssignments, mockUsers, mockClubs } from "@/lib/mock-data";
import { StatCard } from "@/components/ui/card";
import { ConfidentialityBanner } from "@/components/ui/confidentiality-banner";
import { AnimatedPage, AnimatedSection } from "@/components/ui/animated-container";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] as const } },
};

const recentActivity = [
  { icon: Building2, text: "New club created: Robotics Society", time: "2 hours ago", color: "text-blue-600" },
  { icon: Users, text: "142 new accounts imported for 2027/2028 cycle", time: "1 day ago", color: "text-emerald-600" },
  { icon: Megaphone, text: "Announcement posted by Dr. Grace Asare", time: "2 days ago", color: "text-amber-600" },
  { icon: Calendar, text: "Academic year 2026/2027 marked as current", time: "3 days ago", color: "text-purple-600" },
  { icon: LifeBuoy, text: "New office added: Health Center", time: "5 days ago", color: "text-cyan-600" },
];

export default function DashboardPage() {
  const totalUsers = mockUsers.length;
  const totalFreshers = mockCoachAssignments.length;
  const totalCoaches = mockUsers.filter(u => u.roles.includes("peer_coach")).length;
  const totalClubs = mockClubs.length;

  return (
    <AnimatedPage>
      {/* Header */}
      <AnimatedSection>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="h-8 w-1 rounded-full bg-[#A93C40]" />
              <p className="text-sm font-semibold text-[#A93C40] tracking-widest uppercase">Overview</p>
            </div>
            <h1 className="text-4xl font-bold text-[#1A2B4A] tracking-tight">Platform Dashboard</h1>
            <p className="text-[#6B7280] mt-2 text-lg">Bird's-eye view of Fresher Hub platform health</p>
          </div>
          <div className="flex gap-3">
            <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#e5e7eb] text-sm font-semibold text-[#6B7280] hover:bg-[#f8f4ef] transition-colors cursor-pointer">
              <Download className="w-4 h-4" />
              Export
            </button>
            <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#A93C40] text-white text-sm font-semibold hover:bg-[#A93C40]/90 transition-colors shadow-md shadow-[#A93C40]/20 cursor-pointer">
              <Plus className="w-4 h-4" />
              Quick Action
            </button>
          </div>
        </div>
      </AnimatedSection>

      {/* Summary Cards */}
      <div className="grid gap-5 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard title="Active Users" value={totalUsers} icon={Users} description="Across all roles" />
        <StatCard title="Freshers" value={totalFreshers} icon={GraduationCap} description="This cycle" />
        <StatCard title="Peer Coaches" value={totalCoaches} icon={Users} description="Active" />
        <StatCard title="Clubs" value={totalClubs} icon={Building2} description="Registered" />
        <StatCard title="Offices" value={4} icon={LifeBuoy} description="In Help Center" />
        <StatCard title="Cycle" value="2026/27" icon={Calendar} description="Current academic year" />
      </div>

      {/* Unit Health Snapshot */}
      <AnimatedSection>
        <div className="flex items-center gap-3 mb-4">
          <Sparkles className="w-5 h-5 text-[#A93C40]" />
          <h2 className="text-lg font-semibold text-[#1A2B4A]">Unit Health Snapshot</h2>
        </div>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { unit: "Coaching", rate: 68, trend: "+5%", color: "bg-emerald-500", label: "mandatory sessions completed" },
            { unit: "Counselling", rate: 42, trend: "+2%", color: "bg-blue-500", label: "engagement rate" },
            { unit: "Advising", rate: 55, trend: "+8%", color: "bg-amber-500", label: "sessions booked" },
            { unit: "Buddy Up", rate: 73, trend: "+12%", color: "bg-purple-500", label: "WhatsApp contact rate" },
          ].map((item) => (
            <motion.div
              key={item.unit}
              variants={itemVariants}
              whileHover={{ y: -3 }}
              className="rounded-2xl border bg-white p-5 shadow-sm hover:shadow-lg transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <p className="font-semibold text-[#1A2B4A]">{item.unit}</p>
                <span className="flex items-center gap-0.5 text-xs font-medium text-emerald-600">
                  <ArrowUpRight className="w-3 h-3" />
                  {item.trend}
                </span>
              </div>
              <div className="flex items-end gap-2">
                <p className="text-3xl font-bold text-[#1A2B4A]">{item.rate}%</p>
                <p className="text-xs text-[#6B7280] pb-1">{item.label}</p>
              </div>
              <div className="w-full bg-[#f3f4f6] rounded-full h-2 mt-3 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${item.rate}%` }}
                  transition={{ duration: 1, ease: [0.4, 0, 0.2, 1] }}
                  className={`h-2 rounded-full ${item.color}`}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </AnimatedSection>

      {/* Confidentiality Banner */}
      <AnimatedSection>
        <ConfidentialityBanner />
      </AnimatedSection>

      {/* Two-column: Activity + Quick Actions */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Activity */}
        <AnimatedSection className="lg:col-span-2 rounded-2xl border bg-white shadow-sm overflow-hidden">
          <div className="p-6 border-b border-[#f3f4f6]">
            <h2 className="text-lg font-semibold text-[#1A2B4A]">Recent Platform Activity</h2>
          </div>
          <div className="divide-y divide-[#f3f4f6]">
            {recentActivity.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className="flex items-center gap-4 p-4 hover:bg-[#f8f4ef]/50 transition-colors"
              >
                <div className="w-9 h-9 rounded-lg bg-[#f8f4ef] flex items-center justify-center">
                  <item.icon className={`w-4 h-4 ${item.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#1A2B4A] truncate">{item.text}</p>
                  <p className="text-xs text-[#9CA3AF]">{item.time}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </AnimatedSection>

        {/* Quick Actions */}
        <AnimatedSection className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-[#1A2B4A] mb-4">Quick Actions</h2>
          <div className="space-y-2">
            {[
              { icon: Download, label: "Import new cohort", desc: "Upload admissions CSV" },
              { icon: Calendar, label: "Create academic year", desc: "Set up new cycle" },
              { icon: Megaphone, label: "Post announcement", desc: "Platform-wide notice" },
              { icon: LifeBuoy, label: "Add office", desc: "Update Help Center" },
            ].map((action) => (
              <button
                key={action.label}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-[#f8f4ef] transition-colors text-left cursor-pointer"
              >
                <div className="w-9 h-9 rounded-lg bg-[#A93C40]/5 flex items-center justify-center">
                  <action.icon className="w-4 h-4 text-[#A93C40]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[#1A2B4A]">{action.label}</p>
                  <p className="text-xs text-[#6B7280]">{action.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </AnimatedSection>
      </div>
    </AnimatedPage>
  );
}