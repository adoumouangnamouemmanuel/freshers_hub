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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  Download,
  Lightbulb,
  Calendar,
  ArrowUpRight,
} from "lucide-react";
import { mockAnalytics } from "@/lib/mock-data";
import {
  AnimatedPage,
  AnimatedSection,
} from "@/components/ui/animated-container";
import { PageHeader } from "@/components/ui/page-header";
import { MiniStatCard } from "@/components/ui/card";
import { AnalyticsConfidentialityBanner } from "@/components/ui/confidentiality-banner";

const tooltipStyle = {
  borderRadius: "12px",
  border: "1px solid #e5e7eb",
  background: "white",
  boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
};

/**
 * The same four-color unit system used on the Dashboard, Users, and
 * Clubs pages — carried through here so the whole portal reads as one
 * visual language rather than each screen inventing its own palette.
 * Figures match the Dashboard's Unit Health rings so the mock data
 * doesn't contradict itself across screens.
 */
const UNIT_METRICS = [
  { unit: "Coaching", rate: 68, trend: 5, reach: 34, accent: "#A93C40" },
  { unit: "Counselling", rate: 42, trend: 2, reach: 21, accent: "#1A2B4A" },
  { unit: "Advising", rate: 55, trend: 8, reach: 18, accent: "#C89B3C" },
  { unit: "Buddy Up", rate: 73, trend: 12, reach: 27, accent: "#3E7C6B" },
];

const CONTENT_ACCENT = "#64748B"; // neutral accent for non-unit content (clubs, general volume)

/** Radar needs every axis on the same 0–100 scale; momentum (a small
 *  +/- delta) is rescaled here purely for comparability on the chart —
 *  the real trend value is still shown as-is everywhere else. */
const radarData = ["Completion / engagement", "Session reach", "Momentum"].map(
  (axis, i) => {
    const point: Record<string, number | string> = { axis };
    UNIT_METRICS.forEach((u) => {
      point[u.unit] =
        i === 0 ? u.rate : i === 1 ? u.reach : Math.min(100, 50 + u.trend * 4);
    });
    return point;
  },
);

/** Cohort completion speed — the direct answer to "which class year
 *  finishes mandatory sessions fastest, and by how much." Derived from
 *  the existing completion-rate-by-year data as a stand-in for a real
 *  avg_days_to_complete field; swap in that field once it exists. */
function buildCohortSpeed() {
  return (mockAnalytics.completion_by_class_year ?? []).map((c: any) => ({
    year: c.year,
    days: Math.max(3, Math.round(30 - c.rate / 4)),
    rate: c.rate,
  }));
}

const TIME_RANGES = ["This term", "This year", "All time"] as const;

export default function AnalyticsPage() {
  const [range, setRange] = useState<(typeof TIME_RANGES)[number]>("This year");

  const cohortSpeed = useMemo(() => {
    const data = buildCohortSpeed();
    return [...data].sort((a, b) => a.days - b.days);
  }, []);

  const fastest = cohortSpeed[0];
  const slowest = cohortSpeed[cohortSpeed.length - 1];
  const topUnit = [...UNIT_METRICS].sort((a, b) => b.trend - a.trend)[0];
  const laggingUnit = [...UNIT_METRICS].sort((a, b) => a.rate - b.rate)[0];

  return (
    <AnimatedPage>
      <PageHeader
        title="Analytics & Reports"
        description="Aggregate, anonymized platform analytics — no individual records displayed"
        badge="Insights"
        action={
          <div className="flex gap-3">
            <div className="flex gap-1 rounded-xl bg-[#f3f4f6] p-1">
              {TIME_RANGES.map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                    range === r
                      ? "bg-white text-[#1A2B4A] shadow-sm"
                      : "text-[#6B7280] hover:text-[#1A2B4A]"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
            <button className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-[#e5e7eb] px-4 py-2.5 text-sm font-semibold text-[#6B7280] transition-colors hover:bg-[#f8f4ef]">
              <Download className="h-4 w-4" /> Export
            </button>
          </div>
        }
      />

      <AnalyticsConfidentialityBanner />

      {/* Headline KPIs */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Total students",
            value: mockAnalytics.total_students,
            sub: "Active this year",
          },
          {
            label: "Total sessions",
            value: mockAnalytics.total_sessions,
            sub: "Across all units",
          },
          {
            label: "Completion rate",
            value: `${mockAnalytics.completion_rate}%`,
            sub: "Mandatory sessions",
            color: "text-emerald-600",
          },
          {
            label: "Engagement rate",
            value: `${mockAnalytics.engagement_rate}%`,
            sub: "Overall platform",
            color: "text-[#1A2B4A]",
          },
        ].map((item) => (
          <MiniStatCard
            key={item.label}
            icon={TrendingUp}
            value={item.value}
            label={item.label}
            color={item.color || "text-[#1A2B4A]"}
          />
        ))}
      </div>

      {/* Narrative insights — turns the charts below into plain-language
          findings, the thing an admin actually wants before digging in. */}
      <AnimatedSection className="rounded-2xl border border-[#eee8df] bg-gradient-to-br from-[#1A2B4A] to-[#24365c] p-6 text-white shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-[#C89B3C]" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-white/80">
            This {range.toLowerCase()}, at a glance
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-sm text-white/70">Fastest cohort</p>
            <p className="mt-1 text-lg font-bold">
              Class of {fastest?.year}{" "}
              <span className="font-normal text-white/60 text-sm">
                &middot; ~{fastest?.days} days avg.
              </span>
            </p>
            <p className="mt-1 text-xs text-white/60">
              {Math.round(
                ((slowest?.days - fastest?.days) / slowest?.days) * 100,
              )}
              % faster than the slowest cohort
            </p>
          </div>
          <div>
            <p className="text-sm text-white/70">Fastest-growing unit</p>
            <p className="mt-1 flex items-center gap-1.5 text-lg font-bold">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: topUnit.accent }}
              />
              {topUnit.unit}{" "}
              <span className="font-normal text-white/60 text-sm">
                &middot; +{topUnit.trend}%
              </span>
            </p>
            <p className="mt-1 text-xs text-white/60">
              Leading momentum across all four units this period
            </p>
          </div>
          <div>
            <p className="text-sm text-white/70">Needs attention</p>
            <p className="mt-1 flex items-center gap-1.5 text-lg font-bold">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: laggingUnit.accent }}
              />
              {laggingUnit.unit}{" "}
              <span className="font-normal text-white/60 text-sm">
                &middot; {laggingUnit.rate}%
              </span>
            </p>
            <p className="mt-1 text-xs text-white/60">
              Lowest rate among all units — worth a closer look with its head
            </p>
          </div>
        </div>
      </AnimatedSection>

      {/* Unit comparison radar — the page's signature element: puts all
          four units on one shape instead of four separate bar charts,
          so an admin can see the whole support system's balance at once. */}
      <AnimatedSection className="rounded-2xl border border-[#eee8df] bg-white p-6 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#1A2B4A]">
            Unit comparison
          </h2>
          <Sparkles className="h-4 w-4 text-[#A93C40]" />
        </div>
        <p className="mb-4 text-xs text-[#9CA3AF]">
          Completion/engagement rate, share of total session volume, and
          momentum — normalized for comparison
        </p>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData}>
              <PolarGrid stroke="#f0ece3" />
              <PolarAngleAxis
                dataKey="axis"
                tick={{ fill: "#6B7280", fontSize: 12 }}
              />
              <PolarRadiusAxis
                domain={[0, 100]}
                tick={{ fill: "#c9c3b6", fontSize: 10 }}
              />
              {UNIT_METRICS.map((u) => (
                <Radar
                  key={u.unit}
                  name={u.unit}
                  dataKey={u.unit}
                  stroke={u.accent}
                  fill={u.accent}
                  fillOpacity={0.12}
                  strokeWidth={2}
                />
              ))}
              <Tooltip contentStyle={tooltipStyle} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 flex flex-wrap justify-center gap-4">
          {UNIT_METRICS.map((u) => (
            <span
              key={u.unit}
              className="flex items-center gap-1.5 text-xs font-medium text-[#6B7280]"
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: u.accent }}
              />
              {u.unit}
            </span>
          ))}
        </div>
      </AnimatedSection>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Sessions by unit — now colored per unit instead of one flat bar color */}
        <AnimatedSection className="rounded-2xl border border-[#eee8df] bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#1A2B4A]">
              Sessions by unit
            </h2>
            <Sparkles className="h-4 w-4 text-[#A93C40]" />
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockAnalytics.sessions_by_unit}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis
                  dataKey="unit"
                  tick={{ fill: "#6B7280", fontSize: 12 }}
                />
                <YAxis tick={{ fill: "#6B7280", fontSize: 12 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {(mockAnalytics.sessions_by_unit ?? []).map(
                    (entry: any, i: number) => {
                      const match = UNIT_METRICS.find(
                        (u) =>
                          u.unit.toLowerCase() ===
                          String(entry.unit).toLowerCase(),
                      );
                      return (
                        <Cell key={i} fill={match?.accent ?? CONTENT_ACCENT} />
                      );
                    },
                  )}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </AnimatedSection>

        {/* Completion rate by year */}
        <AnimatedSection className="rounded-2xl border border-[#eee8df] bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#1A2B4A]">
              Completion rate by class year
            </h2>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockAnalytics.completion_by_class_year}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis
                  dataKey="year"
                  tickFormatter={(v) => `'${v.toString().slice(2)}`}
                  tick={{ fill: "#6B7280", fontSize: 12 }}
                />
                <YAxis
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                  tick={{ fill: "#6B7280", fontSize: 12 }}
                />
                <Tooltip
                  formatter={(value: any) => [`${value}%`, "Completion rate"]}
                  contentStyle={tooltipStyle}
                />
                <Line
                  type="monotone"
                  dataKey="rate"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{
                    fill: "#10b981",
                    r: 5,
                    strokeWidth: 2,
                    stroke: "white",
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </AnimatedSection>

        {/* Cohort completion speed — ranked, fastest first, directly
            answers "which year group completes sessions fastest." */}
        <AnimatedSection className="rounded-2xl border border-[#eee8df] bg-white p-6 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#1A2B4A]">
              Cohort completion speed
            </h2>
            <ArrowUpRight className="h-4 w-4 text-[#A93C40]" />
          </div>
          <p className="mb-4 text-xs text-[#9CA3AF]">
            Average days to complete mandatory coaching sessions, fastest first
          </p>
          <div className="space-y-3">
            {cohortSpeed.map((c, i) => {
              const maxDays = Math.max(...cohortSpeed.map((d) => d.days));
              return (
                <div key={c.year} className="flex items-center gap-3">
                  <span className="w-14 shrink-0 text-xs font-semibold text-[#6B7280]">
                    '{String(c.year).slice(2)}
                  </span>
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-[#f3f0ea]">
                    <div
                      className="h-2.5 rounded-full"
                      style={{
                        width: `${(c.days / maxDays) * 100}%`,
                        backgroundColor:
                          i === 0
                            ? "#3E7C6B"
                            : i === cohortSpeed.length - 1
                              ? "#A93C40"
                              : "#C89B3C",
                      }}
                    />
                  </div>
                  <span className="w-16 shrink-0 text-right text-xs font-medium text-[#1A2B4A] tabular-nums">
                    {c.days}d avg.
                  </span>
                </div>
              );
            })}
          </div>
        </AnimatedSection>

        {/* Monthly sessions — recolored to a neutral institutional tone
            instead of an off-brand purple */}
        <AnimatedSection className="rounded-2xl border border-[#eee8df] bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#1A2B4A]">
              Monthly sessions
            </h2>
            <Sparkles className="h-4 w-4 text-[#A93C40]" />
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockAnalytics.monthly_sessions}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis
                  dataKey="month"
                  tick={{ fill: "#6B7280", fontSize: 12 }}
                />
                <YAxis tick={{ fill: "#6B7280", fontSize: 12 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" fill="#1A2B4A" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </AnimatedSection>
      </div>

      {/* Top Clubs — full width, recolored to the neutral content accent
          since clubs aren't a confidential unit and shouldn't borrow a
          unit's color */}
      <AnimatedSection className="rounded-2xl border border-[#eee8df] bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#1A2B4A]">
            Top clubs by members
          </h2>
          <Sparkles className="h-4 w-4 text-[#A93C40]" />
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={mockAnalytics.top_clubs} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis type="number" tick={{ fill: "#6B7280", fontSize: 12 }} />
              <YAxis
                type="category"
                dataKey="name"
                width={140}
                tick={{ fill: "#6B7280", fontSize: 12 }}
              />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar
                dataKey="members"
                fill={CONTENT_ACCENT}
                radius={[0, 6, 6, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </AnimatedSection>
    </AnimatedPage>
  );
}
