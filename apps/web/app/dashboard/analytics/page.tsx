"use client";

import { motion } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line,
} from "recharts";
import { mockAnalytics } from "@/lib/mock-data";
import { Sparkles, TrendingUp } from "lucide-react";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] as const } },
};

const tooltipStyle = {
  borderRadius: "12px",
  border: "1px solid #e5e7eb",
  background: "white",
  boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
};

export default function AnalyticsPage() {
  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8">
      <motion.div variants={itemVariants}>
        <div className="flex items-center gap-3 mb-1">
          <div className="h-8 w-1 rounded-full bg-[#A93C40]" />
          <p className="text-sm font-semibold text-[#A93C40] tracking-widest uppercase">Insights</p>
        </div>
        <h1 className="text-4xl font-bold text-[#1A2B4A] tracking-tight">Analytics</h1>
        <p className="text-[#6B7280] mt-2 text-lg">Aggregate and anonymized platform analytics</p>
      </motion.div>

      <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Students", value: mockAnalytics.total_students, sub: "Active this year" },
          { label: "Total Sessions", value: mockAnalytics.total_sessions, sub: "Across all units" },
          { label: "Completion Rate", value: `${mockAnalytics.completion_rate}%`, sub: "Mandatory sessions", color: "text-emerald-600" },
          { label: "Engagement Rate", value: `${mockAnalytics.engagement_rate}%`, sub: "Overall platform", color: "text-blue-600" },
        ].map((item, i) => (
          <motion.div key={item.label} variants={itemVariants} className="rounded-2xl border bg-white p-6 shadow-sm">
            <p className="text-sm text-[#6B7280]">{item.label}</p>
            <p className={`text-3xl font-bold mt-1 ${item.color || "text-[#1A2B4A]"}`}>{item.value}</p>
            <p className="text-xs text-[#9CA3AF] mt-1">{item.sub}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div variants={itemVariants} className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-[#1A2B4A]">Sessions by Unit</h2>
            <Sparkles className="w-4 h-4 text-[#A93C40]" />
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockAnalytics.sessions_by_unit}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="unit" tick={{ fill: '#6B7280', fontSize: 12 }} />
                <YAxis tick={{ fill: '#6B7280', fontSize: 12 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" fill="#A93C40" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-[#1A2B4A]">Completion Rate by Year</h2>
            <TrendingUp className="w-4 h-5 text-emerald-500" />
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockAnalytics.completion_by_class_year}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="year" tickFormatter={(v) => `'${v.toString().slice(2)}`} tick={{ fill: '#6B7280', fontSize: 12 }} />
                <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fill: '#6B7280', fontSize: 12 }} />
                <Tooltip formatter={(value: any) => [`${value}%`, "Completion Rate"]} contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="rate" stroke="#10b981" strokeWidth={3} dot={{ fill: "#10b981", r: 5, strokeWidth: 2, stroke: "white" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-[#1A2B4A]">Monthly Sessions</h2>
            <Sparkles className="w-4 h-4 text-[#A93C40]" />
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockAnalytics.monthly_sessions}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="month" tick={{ fill: '#6B7280', fontSize: 12 }} />
                <YAxis tick={{ fill: '#6B7280', fontSize: 12 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-[#1A2B4A]">Top Clubs by Members</h2>
            <Sparkles className="w-4 h-4 text-[#A93C40]" />
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockAnalytics.top_clubs} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis type="number" tick={{ fill: '#6B7280', fontSize: 12 }} />
                <YAxis type="category" dataKey="name" width={140} tick={{ fill: '#6B7280', fontSize: 12 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="members" fill="#f59e0b" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      <motion.div variants={itemVariants} className="rounded-2xl border bg-white shadow-sm">
        <div className="p-6 border-b border-[#f3f4f6]">
          <h2 className="text-lg font-semibold text-[#1A2B4A]">Platform Summary</h2>
        </div>
        <div className="p-6">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { label: "Active Coaches", value: mockAnalytics.active_coaches },
              { label: "Active Clubs", value: mockAnalytics.active_clubs },
              { label: "Support Units", value: 3 },
              { label: "Coaching Sessions", value: mockAnalytics.sessions_by_unit.find((s) => s.unit === "Coaching")?.count || 0 },
              { label: "Counselling Sessions", value: mockAnalytics.sessions_by_unit.find((s) => s.unit === "Counselling")?.count || 0 },
              { label: "Advising Sessions", value: mockAnalytics.sessions_by_unit.find((s) => s.unit === "Advising")?.count || 0 },
            ].map((item) => (
              <div key={item.label} className="space-y-1">
                <p className="text-sm text-[#6B7280]">{item.label}</p>
                <p className="text-2xl font-bold text-[#1A2B4A]">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}