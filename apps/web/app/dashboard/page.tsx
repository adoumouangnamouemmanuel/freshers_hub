"use client";

import {
  AnimatedPage,
  AnimatedSection,
} from "@/components/ui/animated-container";
import { StatCard } from "@/components/ui/card";
import { ConfidentialityBanner } from "@/components/ui/confidentiality-banner";
import { mockClubs, mockCoachAssignments, mockUsers } from "@/lib/mock-data";
import { motion } from "framer-motion";
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  Building2,
  Calendar,
  Download,
  Megaphone,
  Plus,
  TrendingUp,
  Users,
} from "lucide-react";

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] as const },
  },
};

const recentActivity = [
  {
    icon: Building2,
    text: "New club created: Robotics Society",
    time: "2 hours ago",
    color: "text-blue-600",
  },
  {
    icon: Users,
    text: "142 new accounts imported for 2027/2028 cycle",
    time: "1 day ago",
    color: "text-emerald-600",
  },
  {
    icon: Megaphone,
    text: "Announcement posted by Dr. Grace Asare",
    time: "2 days ago",
    color: "text-amber-600",
  },
  {
    icon: Calendar,
    text: "Academic year 2026/2027 marked as current",
    time: "3 days ago",
    color: "text-purple-600",
  },
  {
    icon: TrendingUp,
    text: "Coaching completion rate increased by 5%",
    time: "5 days ago",
    color: "text-[#A93C40]",
  },
];

const unitHealth = [
  {
    unit: "Coaching",
    rate: 68,
    trend: "+5%",
    color: "bg-emerald-500",
    label: "mandatory sessions completed",
  },
  {
    unit: "Counselling",
    rate: 42,
    trend: "+2%",
    color: "bg-blue-500",
    label: "engagement rate",
  },
  {
    unit: "Advising",
    rate: 55,
    trend: "+8%",
    color: "bg-amber-500",
    label: "sessions booked",
  },
  {
    unit: "Buddy Up",
    rate: 73,
    trend: "+12%",
    color: "bg-purple-500",
    label: "WhatsApp contact rate",
  },
];

export default function DashboardPage() {
  const totalUsers = mockUsers.length;
  const totalFreshers = mockCoachAssignments.length;
  const totalCoaches = mockUsers.filter((u) =>
    u.roles.includes("peer_coach"),
  ).length;
  const totalClubs = mockClubs.length;

  return (
    <AnimatedPage>
      {/* Hero Header */}
      <AnimatedSection className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1A2B4A] to-[#2d3e5c] p-8 mb-8 text-white">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#A93C40]/20 rounded-full blur-3xl -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#A93C40]/10 rounded-full blur-2xl -ml-10 -mb-10" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-1 w-8 rounded-full bg-[#A93C40]" />
            <span className="text-xs font-semibold text-[#A93C40] tracking-widest uppercase">
              Overview · 2026/2027 Cycle
            </span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">
            Platform Dashboard
          </h1>
          <p className="text-white/70 text-lg max-w-2xl">
            The aggregate view of Fresher Hub — nothing here is a name, only a
            number.
          </p>
          <div className="flex gap-3 mt-6">
            <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white text-sm font-semibold hover:bg-white/20 transition-colors cursor-pointer">
              <Download className="w-4 h-4" />
              Export
            </button>
            <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#A93C40] text-white text-sm font-semibold hover:bg-[#A93C40]/90 transition-colors shadow-lg cursor-pointer">
              <Plus className="w-4 h-4" />
              Quick action
            </button>
          </div>
        </div>
      </AnimatedSection>

      {/* Primary Stats */}
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 mb-8">
        <StatCard
          title="Active Users"
          value={totalUsers}
          description="Across all roles"
        />
        <StatCard
          title="Freshers"
          value={totalFreshers}
          description="This cycle"
        />
        <StatCard
          title="Peer Coaches"
          value={totalCoaches}
          description="Active"
        />
        <StatCard title="Clubs" value={totalClubs} description="Registered" />
        <StatCard
          title="Cycle"
          value="2026/27"
          description="Current academic year"
        />
      </div>

      {/* Content & Engagement */}
      <AnimatedSection className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Activity className="w-5 h-5 text-[#A93C40]" />
          <h2 className="text-lg font-semibold text-[#1A2B4A]">
            Content & Engagement
          </h2>
        </div>
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
          <StatCard title="Posts" value="24" description="Total published" />
          <StatCard title="Announcements" value="8" description="This cycle" />
          <StatCard
            title="Notifications"
            value="12"
            description="Sent this week"
          />
          <StatCard title="Events" value="5" description="Upcoming" />
          <StatCard title="Clubs" value={totalClubs} description="Active" />
          <StatCard title="Offices" value="4" description="In Help Center" />
        </div>
      </AnimatedSection>

      {/* Unit Health Snapshot */}
      <AnimatedSection className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-[#A93C40]" />
            <h2 className="text-lg font-semibold text-[#1A2B4A]">
              Unit health this cycle
            </h2>
          </div>
          <p className="text-xs text-[#9CA3AF]">Aggregated · updated nightly</p>
        </div>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {unitHealth.map((item) => (
            <motion.div
              key={item.unit}
              variants={itemVariants}
              whileHover={{ y: -3 }}
              className="rounded-2xl border bg-white p-6 shadow-sm hover:shadow-lg transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="font-semibold text-[#1A2B4A] text-base">
                    {item.unit}
                  </p>
                  <p className="text-xs text-[#6B7280] mt-0.5">{item.label}</p>
                </div>
                <span className="flex items-center gap-0.5 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  <ArrowUpRight className="w-3 h-3" />
                  {item.trend}
                </span>
              </div>
              <div className="flex items-end gap-3 mb-3">
                <p className="text-4xl font-bold text-[#1A2B4A]">
                  {item.rate}%
                </p>
              </div>
              <div className="w-full bg-[#f3f4f6] rounded-full h-2 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${item.rate}%` }}
                  transition={{ duration: 1.2, ease: [0.4, 0, 0.2, 1] }}
                  className={`h-2 rounded-full ${item.color}`}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </AnimatedSection>

      {/* Confidentiality Banner */}
      <AnimatedSection className="mb-8">
        <ConfidentialityBanner />
      </AnimatedSection>

      {/* Two-column: Activity + Quick Actions */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Activity */}
        <AnimatedSection className="lg:col-span-2 rounded-2xl border bg-white shadow-sm overflow-hidden">
          <div className="p-6 border-b border-[#f3f4f6]">
            <h2 className="text-lg font-semibold text-[#1A2B4A]">
              Recent platform activity
            </h2>
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
                <div className="w-10 h-10 rounded-xl bg-[#f8f4ef] flex items-center justify-center shrink-0">
                  <item.icon className={`w-5 h-5 ${item.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#1A2B4A] truncate">
                    {item.text}
                  </p>
                  <p className="text-xs text-[#9CA3AF] mt-0.5">{item.time}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </AnimatedSection>

        {/* Quick Actions */}
        <AnimatedSection className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-[#1A2B4A] mb-4">
            Quick actions
          </h2>
          <div className="space-y-2">
            {[
              {
                icon: Download,
                label: "Import new cohort",
                desc: "Upload admissions CSV",
              },
              {
                icon: Calendar,
                label: "Create academic year",
                desc: "Set up new cycle",
              },
              {
                icon: Megaphone,
                label: "Post announcement",
                desc: "Platform-wide notice",
              },
              {
                icon: BarChart3,
                label: "View analytics",
                desc: "Platform insights",
              },
            ].map((action) => (
              <button
                key={action.label}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-[#f8f4ef] transition-colors text-left cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-[#A93C40]/5 flex items-center justify-center shrink-0">
                  <action.icon className="w-5 h-5 text-[#A93C40]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[#1A2B4A]">
                    {action.label}
                  </p>
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
