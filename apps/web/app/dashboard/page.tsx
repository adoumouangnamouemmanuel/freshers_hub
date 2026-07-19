"use client";

import { motion } from "framer-motion";
import {
  Users,
  CheckCircle2,
  Clock,
  XCircle,
  TrendingUp,
  Building2,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";
import {
  mockAnalytics,
  mockCoachAssignments,
  mockSessions,
} from "@/lib/mock-data";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const easeOut = [0.4, 0, 0.2, 1] as const;
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: easeOut } },
};

function StatCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  delay = 0,
}: {
  title: string;
  value: string | number;
  icon: any;
  description?: string;
  trend?: { value: string; positive: boolean };
  delay?: number;
}) {
  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="rounded-2xl border bg-white p-6 shadow-sm hover:shadow-lg hover:shadow-[#A93C40]/5 transition-all duration-300 group"
    >
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <p className="text-sm font-medium text-[#6B7280] tracking-wide uppercase">{title}</p>
          <p className="text-3xl font-bold text-[#1A2B4A]">{value}</p>
          {description && (
            <p className="text-xs text-[#9CA3AF]">{description}</p>
          )}
        </div>
        <div className="w-12 h-12 rounded-xl bg-[#A93C40]/10 flex items-center justify-center group-hover:bg-[#A93C40]/15 transition-colors">
          <Icon className="w-6 h-6 text-[#A93C40]" />
        </div>
      </div>
      {trend && (
        <div className="mt-4 flex items-center gap-1.5 text-sm">
          <div className={`flex items-center gap-0.5 font-medium ${trend.positive ? 'text-emerald-600' : 'text-red-500'}`}>
            <ArrowUpRight className={`w-4 h-4 ${!trend.positive && 'rotate-90'}`} />
            {trend.value}
          </div>
          <span className="text-[#9CA3AF]">vs last month</span>
        </div>
      )}
    </motion.div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; border: string }> = {
    completed: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
    booked: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
    cancelled: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
    rescheduled: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
    no_show: { bg: "bg-gray-50", text: "text-gray-700", border: "border-gray-200" },
  };
  const c = config[status] || config.completed;
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold border ${c.bg} ${c.text} ${c.border}`}>
      {status.replace("_", " ")}
    </span>
  );
}

export default function DashboardPage() {
  const totalFreshers = mockCoachAssignments.length;
  const completedSessions = mockSessions.filter((s) => s.status === "completed").length;
  const overdueFreshers = mockCoachAssignments.filter((a) => a.sessions_completed < a.sessions_required).length;
  const upcomingSessions = mockSessions.filter((s) => s.status === "booked").length;

  const recentSessions = [...mockSessions]
    .sort((a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime())
    .slice(0, 5);

  const maxUnitCount = Math.max(...mockAnalytics.sessions_by_unit.map((s) => s.count));

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
          <p className="text-sm font-semibold text-[#A93C40] tracking-widest uppercase">Overview</p>
        </div>
        <h1 className="text-4xl font-bold text-[#1A2B4A] tracking-tight">
          Welcome back, <span className="gradient-text">Admin</span>
        </h1>
        <p className="text-[#6B7280] mt-2 text-lg">
          Here's what's happening across Fresher Hub today.
        </p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Freshers" value={totalFreshers} icon={Users} description="Assigned to peer coaches" trend={{ value: "12%", positive: true }} />
        <StatCard title="Completed Sessions" value={completedSessions} icon={CheckCircle2} description="Across all units" trend={{ value: "8%", positive: true }} />
        <StatCard title="Upcoming" value={upcomingSessions} icon={Clock} description="Scheduled sessions" />
        <StatCard title="Need Attention" value={overdueFreshers} icon={XCircle} description="Below required sessions" trend={{ value: "3%", positive: false }} />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Sessions by Unit */}
        <motion.div variants={itemVariants} className="rounded-2xl border bg-white p-6 shadow-sm hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-[#1A2B4A]">Sessions by Unit</h2>
            <Sparkles className="w-4 h-4 text-[#A93C40]" />
          </div>
          <div className="space-y-5">
            {mockAnalytics.sessions_by_unit.map((item, i) => (
              <motion.div
                key={item.unit}
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ delay: 0.3 + i * 0.1, duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
              >
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium text-[#1A2B4A]">{item.unit}</span>
                  <span className="text-[#6B7280] font-semibold">{item.count} sessions</span>
                </div>
                <div className="w-full bg-[#f3f4f6] rounded-full h-3 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(item.count / maxUnitCount) * 100}%` }}
                    transition={{ delay: 0.5 + i * 0.1, duration: 1, ease: [0.4, 0, 0.2, 1] }}
                    className="h-3 rounded-full bg-gradient-to-r from-[#A93C40] to-[#d46a6e]"
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Completion by Class Year */}
        <motion.div variants={itemVariants} className="rounded-2xl border bg-white p-6 shadow-sm hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-[#1A2B4A]">Completion Rate by Year</h2>
            <TrendingUp className="w-4 h-5 text-emerald-500" />
          </div>
          <div className="space-y-5">
            {mockAnalytics.completion_by_class_year.map((item, i) => (
              <motion.div
                key={item.year}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.15, duration: 0.5 }}
              >
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium text-[#1A2B4A]">Class of {item.year}</span>
                  <span className="text-emerald-600 font-bold">{item.rate}%</span>
                </div>
                <div className="w-full bg-[#f3f4f6] rounded-full h-3 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${item.rate}%` }}
                    transition={{ delay: 0.5 + i * 0.15, duration: 1.2, ease: [0.4, 0, 0.2, 1] }}
                    className="h-3 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 shadow-sm"
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Recent Sessions */}
      <motion.div variants={itemVariants} className="rounded-2xl border bg-white shadow-sm hover:shadow-lg transition-shadow overflow-hidden">
        <div className="p-6 border-b border-[#f3f4f6] flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#1A2B4A]">Recent Sessions</h2>
            <p className="text-sm text-[#6B7280] mt-0.5">Latest activity across all units</p>
          </div>
          <span className="text-xs text-[#A93C40] font-semibold bg-[#A93C40]/5 px-3 py-1.5 rounded-full">
            Live
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#f3f4f6] bg-[#f8f4ef]/50">
                {["Student", "Provider", "Unit", "Date", "Status"].map((h) => (
                  <th key={h} className="text-left p-4 font-semibold text-[#6B7280] text-xs uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentSessions.map((session, i) => (
                <motion.tr
                  key={session.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08, duration: 0.3 }}
                  className="border-b border-[#f3f4f6] last:border-0 hover:bg-[#f8f4ef]/50 transition-colors"
                >
                  <td className="p-4 font-medium text-[#1A2B4A]">{session.student_name}</td>
                  <td className="p-4 text-[#6B7280]">{session.provider_name}</td>
                  <td className="p-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#A93C40]/5 text-[#A93C40]">
                      {session.unit_name}
                    </span>
                  </td>
                  <td className="p-4 text-[#6B7280]">
                    {new Date(session.scheduled_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </td>
                  <td className="p-4"><StatusBadge status={session.status} /></td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Quick Stats Row */}
      <motion.div variants={itemVariants} className="grid gap-5 grid-cols-1 sm:grid-cols-3">
        {[
          { icon: TrendingUp, value: `${mockAnalytics.completion_rate}%`, label: "Overall completion rate", color: "text-emerald-600" },
          { icon: Users, value: String(mockAnalytics.active_coaches), label: "Active peer coaches", color: "text-blue-600" },
          { icon: Building2, value: String(mockAnalytics.active_clubs), label: "Active clubs", color: "text-amber-600" },
        ].map((item, i) => (
          <motion.div
            key={item.label}
            whileHover={{ y: -3, transition: { duration: 0.2 } }}
            className="rounded-2xl border bg-white p-6 shadow-sm hover:shadow-lg transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#A93C40]/10 to-[#d46a6e]/10 flex items-center justify-center">
                <item.icon className="w-5 h-5 text-[#A93C40]" />
              </div>
              <div>
                <p className={`text-2xl font-bold text-[#1A2B4A] ${item.color}`}>{item.value}</p>
                <p className="text-sm text-[#6B7280]">{item.label}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}