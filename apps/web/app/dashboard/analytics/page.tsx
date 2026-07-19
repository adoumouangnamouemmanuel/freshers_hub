"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from "recharts";
import { mockAnalytics } from "@/lib/mock-data";

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

export default function AnalyticsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground mt-1">
          Aggregate and anonymized platform analytics
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <p className="text-sm text-muted-foreground">Total Students</p>
          <p className="text-3xl font-bold mt-1">
            {mockAnalytics.total_students}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Active this year</p>
        </div>
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <p className="text-sm text-muted-foreground">Total Sessions</p>
          <p className="text-3xl font-bold mt-1">
            {mockAnalytics.total_sessions}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Across all units</p>
        </div>
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <p className="text-sm text-muted-foreground">Completion Rate</p>
          <p className="text-3xl font-bold mt-1 text-emerald-600">
            {mockAnalytics.completion_rate}%
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Mandatory sessions
          </p>
        </div>
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <p className="text-sm text-muted-foreground">Engagement Rate</p>
          <p className="text-3xl font-bold mt-1 text-blue-600">
            {mockAnalytics.engagement_rate}%
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Overall platform
          </p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Sessions by Unit - Bar Chart */}
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Sessions by Unit</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockAnalytics.sessions_by_unit}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="unit"
                  className="text-xs text-muted-foreground"
                />
                <YAxis className="text-xs text-muted-foreground" />
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid hsl(var(--border))",
                    background: "hsl(var(--card))",
                  }}
                />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Completion by Class Year - Line Chart */}
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">
            Completion Rate by Class Year
          </h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockAnalytics.completion_by_class_year}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="year"
                  tickFormatter={(v) => `'${v.toString().slice(2)}`}
                  className="text-xs text-muted-foreground"
                />
                <YAxis
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                  className="text-xs text-muted-foreground"
                />
                <Tooltip
                  formatter={(value) => [`${value}%`, "Completion Rate"]}
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid hsl(var(--border))",
                    background: "hsl(var(--card))",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="rate"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ fill: "#10b981", r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Sessions - Bar Chart */}
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Monthly Sessions</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockAnalytics.monthly_sessions}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="month"
                  className="text-xs text-muted-foreground"
                />
                <YAxis className="text-xs text-muted-foreground" />
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid hsl(var(--border))",
                    background: "hsl(var(--card))",
                  }}
                />
                <Bar
                  dataKey="count"
                  fill="#8b5cf6"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Clubs - Horizontal Bar */}
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Top Clubs by Members</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={mockAnalytics.top_clubs}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" className="text-xs text-muted-foreground" />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={140}
                  className="text-xs text-muted-foreground"
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid hsl(var(--border))",
                    background: "hsl(var(--card))",
                  }}
                />
                <Bar
                  dataKey="members"
                  fill="#f59e0b"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Summary Table */}
      <div className="rounded-xl border bg-card shadow-sm">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold">Platform Summary</h2>
        </div>
        <div className="p-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                Active Coaches
              </p>
              <p className="text-2xl font-bold">
                {mockAnalytics.active_coaches}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                Active Clubs
              </p>
              <p className="text-2xl font-bold">
                {mockAnalytics.active_clubs}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                Support Units
              </p>
              <p className="text-2xl font-bold">3</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                Coaching Sessions
              </p>
              <p className="text-2xl font-bold">
                {mockAnalytics.sessions_by_unit.find((s) => s.unit === "Coaching")?.count || 0}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                Counselling Sessions
              </p>
              <p className="text-2xl font-bold">
                {mockAnalytics.sessions_by_unit.find((s) => s.unit === "Counselling")?.count || 0}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                Advising Sessions
              </p>
              <p className="text-2xl font-bold">
                {mockAnalytics.sessions_by_unit.find((s) => s.unit === "Advising")?.count || 0}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}