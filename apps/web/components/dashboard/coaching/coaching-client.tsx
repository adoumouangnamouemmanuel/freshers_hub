"use client";

import { motion } from "framer-motion";
import { GraduationCap, Users, TrendingUp, BadgeCheck, CheckCircle2, ChevronRight, Activity } from "lucide-react";
import { AnimatedPage, AnimatedSection } from "@/components/ui/animated-container";
import { PageHeader } from "@/components/ui/page-header";
import { ConfidentialityBanner } from "@/components/ui/confidentiality-banner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine
} from "recharts";

interface CoachingSummary {
  academic_year_id: string;
  total_peer_coaches: number;
  total_freshers: number;
  completed_sessions: number;
  completion_rate: number;
}

interface CoachStat {
  id: string;
  full_name: string;
  avatar_url: string;
  assigned_freshers: number;
  completed_sessions: number;
  completion_rate_pct: number;
}

interface CoachingClientProps {
  summary: CoachingSummary | null;
  coaches: CoachStat[];
}

const AVATAR_PALETTE = ["#A93C40", "#1A2B4A", "#C89B3C", "#3E7C6B"];

function avatarColor(seed: string) {
  const hash = Array.from(seed).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "")).toUpperCase();
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/90 backdrop-blur-md p-4 rounded-xl shadow-xl border border-white/20">
        <p className="font-semibold text-[#1A2B4A] mb-2">{label}</p>
        <p className="text-sm flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#1A2B4A]"></span>
          <span className="text-[#6B7280]">Completion:</span>
          <span className="font-bold text-[#1A2B4A]">{payload[0].value}%</span>
        </p>
      </div>
    );
  }
  return null;
};

export function CoachingClient({ summary, coaches }: CoachingClientProps) {
  const totalCoaches = Number(summary?.total_peer_coaches || 0);
  const totalFreshers = Number(summary?.total_freshers || 0);
  const totalSessions = Number(summary?.completed_sessions || 0);
  const completionRate = Number(summary?.completion_rate || 0);
  
  const chartData = coaches.map(coach => ({
    name: coach.full_name,
    "Completion": Number(coach.completion_rate_pct || 0),
  })).sort((a, b) => b.Completion - a.Completion).slice(0, 6);

  const statCards = [
    { label: "Total Coaches", value: totalCoaches, icon: Users, color: "bg-blue-500", shadow: "shadow-blue-500/20" },
    { label: "Assigned Freshers", value: totalFreshers, icon: GraduationCap, color: "bg-indigo-500", shadow: "shadow-indigo-500/20" },
    { label: "Completed Sessions", value: totalSessions, icon: CheckCircle2, color: "bg-emerald-500", shadow: "shadow-emerald-500/20" },
  ];

  return (
    <AnimatedPage className="pb-12">
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-[#f8f4ef] to-transparent -z-10" />
      <div className="absolute top-20 right-20 w-96 h-96 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob" />
      <div className="absolute top-40 left-20 w-72 h-72 bg-emerald-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000" />
      <div className="absolute -top-20 left-1/2 w-96 h-96 bg-amber-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-4000" />

      <PageHeader 
        title="Coaching Overview" 
        description="Aggregate performance and engagement metrics for the Peer Coaching program." 
        badge="Support Unit" 
      />

      <ConfidentialityBanner unit="coaching" />

      {/* Main KPI Section */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        {/* Large Completion Card */}
        <AnimatedSection className="lg:col-span-2 relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1A2B4A] to-[#2a4577] p-8 shadow-2xl text-white">
          <div className="absolute top-0 right-0 p-8 opacity-20">
            <TrendingUp className="w-48 h-48" />
          </div>
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div>
              <p className="text-blue-200 text-sm font-semibold tracking-wider uppercase mb-2">Overall Completion</p>
              <div className="flex items-baseline gap-2">
                <span className="text-6xl font-black tracking-tighter">{completionRate}</span>
                <span className="text-2xl font-bold text-blue-300">%</span>
              </div>
            </div>
            
            <div className="mt-8">
              <div className="flex justify-between text-sm text-blue-200 mb-2 font-medium">
                <span>Progress to 100%</span>
                <span>{totalSessions} / {totalFreshers * 3} Expected</span>
              </div>
              <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${completionRate}%` }}
                  transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
                  className="h-full bg-gradient-to-r from-blue-400 to-emerald-400 rounded-full relative"
                >
                  <div className="absolute top-0 right-0 w-4 h-full bg-white/30 blur-sm" />
                </motion.div>
              </div>
            </div>
          </div>
        </AnimatedSection>

        {/* Mini Stats */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {statCards.map((stat, i) => (
            <AnimatedSection key={stat.label} className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 border border-white/40 shadow-xl shadow-black/5 flex flex-col justify-between group hover:-translate-y-1 transition-transform duration-300">
              <div className={`w-12 h-12 rounded-2xl ${stat.color} ${stat.shadow} flex items-center justify-center text-white mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div>
                <motion.p 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * i }}
                  className="text-4xl font-bold text-[#1A2B4A]"
                >
                  {stat.value}
                </motion.p>
                <p className="text-sm font-medium text-[#6B7280] mt-1">{stat.label}</p>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Chart Section */}
        <AnimatedSection className="lg:col-span-2 rounded-3xl bg-white/80 backdrop-blur-xl border border-white/40 p-8 shadow-xl shadow-black/5">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl font-bold text-[#1A2B4A]">Top Performers</h2>
              <p className="text-sm font-medium text-[#6B7280]">Coaches with the highest session completion rates</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-100 to-amber-50 text-amber-500 shadow-sm border border-amber-200/50">
              <BadgeCheck className="h-6 w-6" />
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#6B7280', fontSize: 13, fontWeight: 500 }} 
                  dy={15} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#6B7280', fontSize: 13, fontWeight: 500 }} 
                  dx={-10}
                />
                <Tooltip cursor={{ fill: 'rgba(0,0,0,0.02)' }} content={<CustomTooltip />} />
                <Bar dataKey="Completion" radius={[8, 8, 0, 0]} maxBarSize={50} animationDuration={1500}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? 'url(#goldGradient)' : 'url(#blueGradient)'} />
                  ))}
                </Bar>
                <defs>
                  <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#F59E0B" />
                    <stop offset="100%" stopColor="#D97706" />
                  </linearGradient>
                  <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3B82F6" />
                    <stop offset="100%" stopColor="#1D4ED8" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </AnimatedSection>

        {/* Quick Insights */}
        <AnimatedSection className="rounded-3xl bg-white/80 backdrop-blur-xl border border-white/40 p-8 shadow-xl shadow-black/5 flex flex-col justify-center relative overflow-hidden group">
          <div className="absolute -right-12 -top-12 bg-emerald-500/10 w-48 h-48 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition-colors" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-emerald-100 rounded-xl text-emerald-600">
                <Activity className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-[#1A2B4A]">Insights</h2>
            </div>
            
            <div className="space-y-8">
              <div>
                <p className="text-[#6B7280] text-sm font-semibold uppercase tracking-wider mb-2">Average Load</p>
                <p className="text-4xl font-bold text-[#1A2B4A] flex items-baseline gap-2">
                  {totalCoaches > 0 ? (totalFreshers / totalCoaches).toFixed(1) : 0} 
                  <span className="text-lg font-medium text-[#6B7280]">freshers / coach</span>
                </p>
              </div>
              <div className="h-px bg-gradient-to-r from-gray-200 to-transparent w-full" />
              <div>
                <p className="text-[#6B7280] text-sm font-semibold uppercase tracking-wider mb-2">Session Velocity</p>
                <p className="text-4xl font-bold text-[#1A2B4A] flex items-baseline gap-2">
                  {totalFreshers > 0 ? (totalSessions / totalFreshers).toFixed(1) : 0} 
                  <span className="text-lg font-medium text-[#6B7280]">sessions / fresher</span>
                </p>
              </div>
            </div>
          </div>
        </AnimatedSection>
      </div>

      {/* Peer Coach List */}
      <AnimatedSection className="rounded-3xl bg-white/80 backdrop-blur-xl border border-white/40 shadow-xl shadow-black/5 overflow-hidden">
        <div className="p-8 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-[#1A2B4A]">Peer Coaches Directory</h2>
            <p className="text-sm font-medium text-[#6B7280] mt-1">Detailed breakdown of individual coach performance</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="text-left p-6 font-bold text-[#6B7280] text-xs uppercase tracking-wider w-1/3">Coach</th>
                <th className="text-left p-6 font-bold text-[#6B7280] text-xs uppercase tracking-wider">Assigned</th>
                <th className="text-left p-6 font-bold text-[#6B7280] text-xs uppercase tracking-wider">Completed</th>
                <th className="text-left p-6 font-bold text-[#6B7280] text-xs uppercase tracking-wider w-1/3">Completion Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {coaches.map((pc, i) => {
                const pct = Number(pc.completion_rate_pct || 0);
                const barColor = pct >= 80 ? 'bg-emerald-500' : pct >= 40 ? 'bg-amber-400' : 'bg-red-500';
                
                return (
                  <motion.tr 
                    key={pc.id} 
                    initial={{ opacity: 0, y: 10 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    transition={{ delay: i * 0.05 }}
                    className="hover:bg-blue-50/50 transition-colors group cursor-default"
                  >
                    <td className="p-6">
                      <div className="flex items-center gap-4">
                        <div
                          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-sm font-bold text-white shadow-md group-hover:scale-105 transition-transform"
                          style={{ backgroundColor: avatarColor(pc.id ?? pc.full_name) }}
                        >
                          {initials(pc.full_name)}
                        </div>
                        <div>
                          <p className="font-bold text-[#1A2B4A]">{pc.full_name}</p>
                          <p className="text-xs font-medium text-[#6B7280] mt-0.5 group-hover:text-blue-600 transition-colors">View Details <ChevronRight className="inline w-3 h-3" /></p>
                        </div>
                      </div>
                    </td>
                    <td className="p-6 font-semibold text-[#1A2B4A]">{Number(pc.assigned_freshers || 0)}</td>
                    <td className="p-6 font-semibold text-[#1A2B4A]">{Number(pc.completed_sessions || 0)}</td>
                    <td className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 1, delay: 0.3 + (i * 0.05) }}
                            className={`h-full rounded-full ${barColor} relative`} 
                          >
                            <div className="absolute top-0 right-0 w-2 h-full bg-white/40 blur-[1px]" />
                          </motion.div>
                        </div>
                        <span className="text-sm font-bold text-[#1A2B4A] w-12 text-right">{pct}%</span>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
              {coaches.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-12 text-center text-[#6B7280] font-medium">
                    No coaches found for this unit.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </AnimatedSection>
    </AnimatedPage>
  );
}
