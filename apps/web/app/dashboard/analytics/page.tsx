"use client";

import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { mockAnalytics } from "@/lib/mock-data";
import { Sparkles, TrendingUp, Download } from "lucide-react";
import { AnimatedPage, AnimatedSection } from "@/components/ui/animated-container";
import { PageHeader } from "@/components/ui/page-header";
import { MiniStatCard } from "@/components/ui/card";
import { AnalyticsConfidentialityBanner } from "@/components/ui/confidentiality-banner";

const tooltipStyle = { borderRadius: "12px", border: "1px solid #e5e7eb", background: "white", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" };

export default function AnalyticsPage() {
  return (
    <AnimatedPage>
      <PageHeader title="Analytics & Reports" description="Aggregate, anonymized platform analytics — no individual records displayed" badge="Insights" action={
        <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#e5e7eb] text-sm font-semibold text-[#6B7280] hover:bg-[#f8f4ef] transition-colors cursor-pointer">
          <Download className="w-4 h-4" /> Export
        </button>
      } />

      <AnalyticsConfidentialityBanner />

      <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Students", value: mockAnalytics.total_students, sub: "Active this year" },
          { label: "Total Sessions", value: mockAnalytics.total_sessions, sub: "Across all units" },
          { label: "Completion Rate", value: `${mockAnalytics.completion_rate}%`, sub: "Mandatory sessions", color: "text-emerald-600" },
          { label: "Engagement Rate", value: `${mockAnalytics.engagement_rate}%`, sub: "Overall platform", color: "text-blue-600" },
        ].map((item, i) => (
          <MiniStatCard key={item.label} icon={TrendingUp} value={item.value} label={item.label} color={item.color || "text-[#1A2B4A]"} />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <AnimatedSection className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6"><h2 className="text-lg font-semibold text-[#1A2B4A]">Sessions by Unit</h2><Sparkles className="w-4 h-4 text-[#A93C40]" /></div>
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
        </AnimatedSection>

        <AnimatedSection className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6"><h2 className="text-lg font-semibold text-[#1A2B4A]">Completion Rate by Year</h2><TrendingUp className="w-4 h-5 text-emerald-500" /></div>
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
        </AnimatedSection>

        <AnimatedSection className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6"><h2 className="text-lg font-semibold text-[#1A2B4A]">Monthly Sessions</h2><Sparkles className="w-4 h-4 text-[#A93C40]" /></div>
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
        </AnimatedSection>

        <AnimatedSection className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6"><h2 className="text-lg font-semibold text-[#1A2B4A]">Top Clubs by Members</h2><Sparkles className="w-4 h-4 text-[#A93C40]" /></div>
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
        </AnimatedSection>
      </div>
    </AnimatedPage>
  );
}