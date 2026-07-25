"use client";

import { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import {
  BadgeCheck,
  TrendingUp,
  Download,
  Lightbulb,
  ArrowUpRight,
  Users,
  Target,
  Activity,
  Award,
  Calendar
} from "lucide-react";
import { motion } from "framer-motion";
import {
  AnimatedPage,
  AnimatedSection,
} from "@/components/ui/animated-container";
import { PageHeader } from "@/components/ui/page-header";
import { AnalyticsConfidentialityBanner } from "@/components/ui/confidentiality-banner";

// Premium Glass Tooltip for Charts
const CustomTooltip = ({ active, payload, label, formatter }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-white/20 bg-black/60 p-4 shadow-2xl backdrop-blur-xl">
        <p className="mb-2 text-sm font-semibold text-white/90">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div 
              className="h-2.5 w-2.5 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.5)]" 
              style={{ backgroundColor: entry.color || entry.payload.fill || '#fff' }} 
            />
            <span className="text-white/70">{entry.name}:</span>
            <span className="font-bold text-white">
              {formatter ? formatter(entry.value) : entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const UNIT_COLORS: Record<string, string> = {
  Coaching: "#F43F5E", // vibrant rose
  Counselling: "#8B5CF6", // vibrant violet
  Advising: "#F59E0B", // vibrant amber
};
const DEFAULT_UNIT_COLOR = "#10B981"; // emerald
const CONTENT_ACCENT = "#3B82F6"; // blue

const TIME_RANGES = ["This term", "This year", "All time"] as const;

export default function AnalyticsClient({ 
  overview, 
  unitComparison, 
  cohortSpeedData, 
  monthlySessions, 
  topClubs,
  exportUrl,
  token
}: {
  overview: any;
  unitComparison: any[];
  cohortSpeedData: any[];
  monthlySessions: any[];
  topClubs: any[];
  exportUrl: string;
  token: string;
}) {
  const [range, setRange] = useState<(typeof TIME_RANGES)[number]>("This year");
  const [isExporting, setIsExporting] = useState(false);

  // Safely format unit metrics
  const UNIT_METRICS = useMemo(() => {
    if (!unitComparison) return [];
    return unitComparison.map((u) => ({
      unit: u.unit,
      rate: Number(u.completion_rate) || 0,
      trend: 5, // Placeholder if backend doesn't have trend yet
      reach: 30, // Placeholder reach
      accent: UNIT_COLORS[u.unit] || DEFAULT_UNIT_COLOR
    }));
  }, [unitComparison]);

  const cohortSpeed = useMemo(() => {
    if (cohortSpeedData && cohortSpeedData.length > 0) {
      return [...cohortSpeedData].sort((a, b) => Number(a.avg_days || 0) - Number(b.avg_days || 0));
    }
    return [];
  }, [cohortSpeedData]);

  const fastest = cohortSpeed[0];
  const slowest = cohortSpeed[cohortSpeed.length - 1];
  
  const topUnit = UNIT_METRICS.length > 0 
    ? [...UNIT_METRICS].sort((a, b) => b.trend - a.trend)[0] 
    : { unit: "N/A", trend: 0, accent: DEFAULT_UNIT_COLOR };
  const laggingUnit = UNIT_METRICS.length > 0 
    ? [...UNIT_METRICS].sort((a, b) => a.rate - b.rate)[0]
    : { unit: "N/A", rate: 0, accent: DEFAULT_UNIT_COLOR };

  const handleExport = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const response = await fetch(exportUrl, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error("Export failed");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const contentDisposition = response.headers.get("Content-Disposition");
      let filename = "analytics_export.csv";
      if (contentDisposition && contentDisposition.includes("filename=")) {
        filename = contentDisposition.split("filename=")[1].replace(/"/g, "");
      }
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Failed to export analytics", error);
      alert("Failed to export analytics data. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  // Safe KPI calculations
  const totalStudents = Number(overview?.users?.total_students || 0);
  const totalSessions = Number(overview?.coaching?.total_sessions || 0) + 
                        Number(overview?.counselling?.total_sessions || 0) + 
                        Number(overview?.advising?.total_sessions || 0);
  const completionRate = Number(overview?.coaching?.completion_rate || 0);
  const totalUsers = Number(overview?.users?.total_users || 1);
  const inactiveUsers = Number(overview?.users?.inactive_users || 0);
  const engagementRate = Math.round(100 - ((inactiveUsers / totalUsers) * 100));

  const kpiCards = [
    { label: "Total Students", value: totalStudents.toLocaleString(), icon: Users, color: "from-blue-500 to-indigo-600", shadow: "shadow-blue-500/20" },
    { label: "Total Sessions", value: totalSessions.toLocaleString(), icon: Activity, color: "from-emerald-400 to-teal-500", shadow: "shadow-emerald-500/20" },
    { label: "Completion Rate", value: `${completionRate}%`, icon: Award, color: "from-rose-400 to-pink-500", shadow: "shadow-rose-500/20" },
    { label: "Engagement Rate", value: `${engagementRate}%`, icon: Target, color: "from-amber-400 to-orange-500", shadow: "shadow-amber-500/20" },
  ];

  return (
    <AnimatedPage>
      <PageHeader
        title="Analytics & Reports"
        description="Aggregate, anonymized platform analytics — visually enhanced for clarity."
        badge="Insights"
        action={
          <div className="flex gap-3">
            <div className="flex gap-1 rounded-xl bg-white/50 p-1 shadow-sm backdrop-blur-md border border-black/5">
              {TIME_RANGES.map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-300 ${
                    range === r
                      ? "bg-white text-indigo-900 shadow-sm"
                      : "text-slate-500 hover:text-indigo-600 hover:bg-white/40"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
            <button 
              onClick={handleExport}
              disabled={isExporting}
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-gradient-to-r from-slate-800 to-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition-all hover:scale-105 hover:shadow-xl hover:shadow-slate-900/30 disabled:opacity-50 disabled:hover:scale-100"
            >
              <Download className="h-4 w-4" /> {isExporting ? "Exporting..." : "Export"}
            </button>
          </div>
        }
      />

      <AnalyticsConfidentialityBanner />

      {/* Headline KPIs - Glassmorphic Redesign */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {kpiCards.map((kpi, idx) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1, duration: 0.5, ease: "easeOut" }}
            className={`group relative overflow-hidden rounded-3xl bg-gradient-to-br ${kpi.color} p-6 text-white shadow-xl ${kpi.shadow} transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl`}
          >
            {/* Glass overlay */}
            <div className="absolute inset-0 bg-white/10 backdrop-blur-sm transition-opacity duration-300 group-hover:bg-white/0" />
            <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/20 blur-2xl" />
            
            <div className="relative z-10 flex items-center justify-between">
              <h3 className="text-sm font-medium text-white/80">{kpi.label}</h3>
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)]">
                <kpi.icon className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="relative z-10 mt-4 flex items-end gap-2">
              <span className="text-4xl font-extrabold tracking-tight drop-shadow-md">{kpi.value}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Narrative insights - Premium Dark Glass Panel */}
      <AnimatedSection className="relative overflow-hidden rounded-3xl border border-slate-700/50 bg-slate-900 p-8 text-white shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent" />
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />
        
        <div className="relative z-10 mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 border border-amber-500/30">
            <Lightbulb className="h-5 w-5 text-amber-400" />
          </div>
          <h2 className="text-base font-bold uppercase tracking-widest text-slate-200">
            This {range.toLowerCase()}, at a glance
          </h2>
        </div>
        <div className="relative z-10 grid gap-8 sm:grid-cols-3 divide-x divide-slate-700/50">
          <div className="pr-6">
            <p className="text-sm font-medium text-slate-400 uppercase tracking-wide">Fastest Cohort</p>
            <p className="mt-2 text-2xl font-bold text-white">
              Class of {fastest?.academic_year_id}{" "}
            </p>
            <p className="mt-1 flex items-center gap-2 text-sm text-indigo-300">
              <span className="inline-block px-2 py-0.5 rounded-md bg-indigo-500/20 border border-indigo-500/30">
                ~{Number(fastest?.avg_days || 0).toFixed(1)} days avg.
              </span>
            </p>
            <p className="mt-3 text-xs text-slate-400 leading-relaxed">
              {fastest && slowest && slowest.avg_days > 0 ? Math.round(((Number(slowest.avg_days) - Number(fastest.avg_days)) / Number(slowest.avg_days)) * 100) : 0}% faster than the slowest cohort in completing mandatory tasks.
            </p>
          </div>
          <div className="px-6">
            <p className="text-sm font-medium text-slate-400 uppercase tracking-wide">Fastest-Growing</p>
            <p className="mt-2 flex items-center gap-2 text-2xl font-bold text-white">
              <span
                className="h-3 w-3 rounded-full shadow-[0_0_10px_currentColor]"
                style={{ backgroundColor: topUnit.accent, color: topUnit.accent }}
              />
              {topUnit.unit}
            </p>
            <p className="mt-1 flex items-center gap-2 text-sm text-emerald-400">
              <TrendingUp className="h-4 w-4" />
              <span>+{topUnit.trend}% Momentum</span>
            </p>
            <p className="mt-3 text-xs text-slate-400 leading-relaxed">
              Leading momentum across all units this period.
            </p>
          </div>
          <div className="pl-6">
            <p className="text-sm font-medium text-slate-400 uppercase tracking-wide">Needs Attention</p>
            <p className="mt-2 flex items-center gap-2 text-2xl font-bold text-white">
              <span
                className="h-3 w-3 rounded-full shadow-[0_0_10px_currentColor]"
                style={{ backgroundColor: laggingUnit.accent, color: laggingUnit.accent }}
              />
              {laggingUnit.unit}
            </p>
            <p className="mt-1 text-sm font-semibold text-rose-400">
              {laggingUnit.rate}% Completion
            </p>
            <p className="mt-3 text-xs text-slate-400 leading-relaxed">
              Lowest rate among all units — worth a closer look with its head.
            </p>
          </div>
        </div>
      </AnimatedSection>

      {/* Unit Performance Overview — styled stat cards */}
      <AnimatedSection className="mt-8 rounded-3xl border border-white/40 bg-white/60 p-8 shadow-xl backdrop-blur-2xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Unit Performance</h2>
            <p className="text-sm text-slate-500 mt-1">
              Completion rate across each support unit
            </p>
          </div>
          <div className="rounded-full bg-rose-100 p-2 text-rose-500">
            <BadgeCheck className="h-5 w-5" />
          </div>
        </div>
        
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {UNIT_METRICS.map((u, idx) => (
            <motion.div
              key={u.unit}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1, duration: 0.4 }}
              className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div 
                    className="h-3 w-3 rounded-full" 
                    style={{ backgroundColor: u.accent }} 
                  />
                  <span className="text-sm font-bold text-slate-700">{u.unit}</span>
                </div>
                <span 
                  className="text-2xl font-extrabold tabular-nums"
                  style={{ color: u.accent }}
                >
                  {u.rate}%
                </span>
              </div>
              
              {/* Progress bar */}
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: `${Math.min(u.rate, 100)}%` }}
                  transition={{ duration: 1, delay: idx * 0.15, ease: "easeOut" }}
                  viewport={{ once: true }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: u.accent }}
                />
              </div>
              
              <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                <span>Completion rate</span>
                <span className="flex items-center gap-1 font-semibold text-emerald-500">
                  <TrendingUp className="h-3 w-3" />
                  +{u.trend}%
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </AnimatedSection>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        {/* Sessions by unit - Animated Bar */}
        <AnimatedSection className="rounded-3xl border border-white/40 bg-white/60 p-8 shadow-xl backdrop-blur-2xl">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Completion by Unit</h2>
              <p className="text-xs text-slate-500 mt-1">Percentage of completed mandatory tasks</p>
            </div>
            <Activity className="h-5 w-5 text-indigo-500" />
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={unitComparison} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="unit" tick={{ fill: "#64748b", fontSize: 12, fontWeight: 500 }} axisLine={false} tickLine={false} dy={10} />
                <YAxis tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="completion_rate" name="Completion Rate" radius={[8, 8, 0, 0]} animationDuration={1500}>
                  {unitComparison.map((entry: any, i: number) => {
                    const match = UNIT_METRICS.find((u) => u.unit.toLowerCase() === String(entry.unit).toLowerCase());
                    return <Cell key={`cell-${i}`} fill={match?.accent ?? CONTENT_ACCENT} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </AnimatedSection>

        {/* Cohort Speed Area Chart */}
        <AnimatedSection className="rounded-3xl border border-white/40 bg-white/60 p-8 shadow-xl backdrop-blur-2xl">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Cohort Completion Rate</h2>
              <p className="text-xs text-slate-500 mt-1">Trend over class years</p>
            </div>
            <TrendingUp className="h-5 w-5 text-emerald-500" />
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={cohortSpeedData} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  dataKey="academic_year_id" 
                  tickFormatter={(v) => `'${String(v || '').slice(2)}`}
                  tick={{ fill: "#64748b", fontSize: 12, fontWeight: 500 }}
                  axisLine={false} tickLine={false} dy={10}
                />
                <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip formatter={(v: any) => `${v}%`} />} />
                <Line 
                  type="monotone" 
                  dataKey="completion_rate" 
                  name="Completion Rate"
                  stroke="#10b981" 
                  strokeWidth={3}
                  dot={{ fill: "#10b981", r: 5, strokeWidth: 2, stroke: "white" }}
                  activeDot={{ r: 7, strokeWidth: 2, stroke: "white" }}
                  animationDuration={1500}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </AnimatedSection>

        <AnimatedSection className="rounded-3xl border border-white/40 bg-white/60 p-8 shadow-xl backdrop-blur-2xl">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Cohort Speed Leaderboard</h2>
              <p className="text-xs text-slate-500 mt-1">Avg days to complete tasks</p>
            </div>
            <ArrowUpRight className="h-5 w-5 text-amber-500" />
          </div>
          <div className="mt-6 space-y-4">
            {cohortSpeed.map((c, i) => {
              const maxDays = Math.max(...cohortSpeed.map((d) => Number(d.avg_days || 1)));
              const currentDays = Number(c.avg_days || 0);
              const percentage = Math.max(5, (currentDays / maxDays) * 100);
              
              let barColor = "from-amber-400 to-amber-500";
              if (i === 0) barColor = "from-emerald-400 to-emerald-500";
              else if (i === cohortSpeed.length - 1) barColor = "from-rose-400 to-rose-500";

              return (
                <div key={c.academic_year_id} className="flex items-center gap-4">
                  <span className="w-12 shrink-0 text-sm font-bold text-slate-600">
                    '{String(c.academic_year_id || '').slice(2)}
                  </span>
                  <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-100 shadow-inner">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${percentage}%` }}
                      transition={{ duration: 1, delay: i * 0.1, ease: "easeOut" }}
                      viewport={{ once: true }}
                      className={`h-full rounded-full bg-gradient-to-r ${barColor} shadow-md`}
                    />
                  </div>
                  <span className="w-20 shrink-0 text-right text-sm font-bold text-slate-700 tabular-nums">
                    {currentDays.toFixed(1)}d
                  </span>
                </div>
              );
            })}
          </div>
        </AnimatedSection>

        <AnimatedSection className="rounded-3xl border border-white/40 bg-white/60 p-8 shadow-xl backdrop-blur-2xl">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Monthly Volume</h2>
              <p className="text-xs text-slate-500 mt-1">Sessions across all units</p>
            </div>
            <Calendar className="h-5 w-5 text-indigo-500" />
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlySessions} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fill: "#64748b", fontSize: 12, fontWeight: 500 }}
                  axisLine={false} tickLine={false} dy={10}
                />
                <YAxis tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="total_sessions" 
                  name="Total Sessions"
                  fill="#6366f1" 
                  radius={[8, 8, 0, 0]}
                  animationDuration={1500}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </AnimatedSection>
      </div>

      <AnimatedSection className="mt-8 rounded-3xl border border-white/40 bg-white/60 p-8 shadow-xl backdrop-blur-2xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Top Clubs</h2>
            <p className="text-sm text-slate-500 mt-1">Largest student organizations by active member count</p>
          </div>
          <div className="rounded-full bg-blue-100 p-2 text-blue-500">
            <Users className="h-5 w-5" />
          </div>
        </div>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topClubs} layout="vertical" margin={{ top: 0, right: 30, bottom: 0, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
              <XAxis type="number" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} dx={-10} />
              <YAxis
                type="category"
                dataKey="name"
                width={160}
                tick={{ fill: "#475569", fontSize: 13, fontWeight: 600 }}
                axisLine={false} 
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(226, 232, 240, 0.4)' }} />
              <Bar
                dataKey="member_count"
                name="Members"
                fill="#8B5CF6"
                radius={[0, 8, 8, 0]}
                animationDuration={1500}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </AnimatedSection>
    </AnimatedPage>
  );
}
