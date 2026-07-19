"use client";

import {
  Users,
  CalendarCheck,
  TrendingUp,
  Building2,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import {
  mockAnalytics,
  mockCoachAssignments,
  mockSessions,
  mockClubs,
} from "@/lib/mock-data";

function StatCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
}: {
  title: string;
  value: string | number;
  icon: any;
  description?: string;
  trend?: { value: string; positive: boolean };
}) {
  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold">{value}</p>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="w-6 h-6 text-primary" />
        </div>
      </div>
      {trend && (
        <div className="mt-4 flex items-center gap-1 text-sm">
          <ArrowUpRight
            className={`w-4 h-4 ${
              trend.positive ? "text-emerald-500" : "text-red-500"
            }`}
          />
          <span
            className={
              trend.positive ? "text-emerald-500" : "text-red-500"
            }
          >
            {trend.value}
          </span>
          <span className="text-muted-foreground">vs last month</span>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    completed: "bg-emerald-100 text-emerald-700 border-emerald-200",
    booked: "bg-blue-100 text-blue-700 border-blue-200",
    cancelled: "bg-red-100 text-red-700 border-red-200",
    rescheduled: "bg-amber-100 text-amber-700 border-amber-200",
    no_show: "bg-gray-100 text-gray-700 border-gray-200",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
        colors[status] || "bg-gray-100 text-gray-700"
      }`}
    >
      {status.replace("_", " ")}
    </span>
  );
}

export default function DashboardPage() {
  const totalFreshers = mockCoachAssignments.length;
  const completedSessions = mockSessions.filter(
    (s) => s.status === "completed"
  ).length;
  const overdueFreshers = mockCoachAssignments.filter(
    (a) => a.sessions_completed < a.sessions_required
  ).length;
  const upcomingSessions = mockSessions.filter(
    (s) => s.status === "booked"
  ).length;

  const recentSessions = [...mockSessions]
    .sort(
      (a, b) =>
        new Date(b.scheduled_at).getTime() -
        new Date(a.scheduled_at).getTime()
    )
    .slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Overview of Fresher Hub activity and compliance
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Freshers"
          value={totalFreshers}
          icon={Users}
          description="Assigned to peer coaches"
          trend={{ value: "12%", positive: true }}
        />
        <StatCard
          title="Completed Sessions"
          value={completedSessions}
          icon={CheckCircle2}
          description="Across all units"
          trend={{ value: "8%", positive: true }}
        />
        <StatCard
          title="Upcoming Sessions"
          value={upcomingSessions}
          icon={Clock}
          description="Scheduled but not completed"
        />
        <StatCard
          title="Overdue Freshers"
          value={overdueFreshers}
          icon={XCircle}
          description="Below required sessions"
          trend={{ value: "3%", positive: false }}
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Sessions by Unit */}
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Sessions by Unit</h2>
          <div className="space-y-4">
            {mockAnalytics.sessions_by_unit.map((item) => {
              const max = Math.max(
                ...mockAnalytics.sessions_by_unit.map((s) => s.count)
              );
              const pct = (item.count / max) * 100;
              return (
                <div key={item.unit} className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{item.unit}</span>
                    <span className="text-muted-foreground">
                      {item.count} sessions
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2.5">
                    <div
                      className="bg-primary h-2.5 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Completion by Class Year */}
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">
            Completion Rate by Class Year
          </h2>
          <div className="space-y-4">
            {mockAnalytics.completion_by_class_year.map((item) => (
              <div key={item.year} className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Class of {item.year}</span>
                  <span className="text-muted-foreground">
                    {item.rate}%
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2.5">
                  <div
                    className="bg-emerald-500 h-2.5 rounded-full transition-all"
                    style={{ width: `${item.rate}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Sessions */}
      <div className="rounded-xl border bg-card shadow-sm">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold">Recent Sessions</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-3 font-medium">Student</th>
                <th className="text-left p-3 font-medium">Provider</th>
                <th className="text-left p-3 font-medium">Unit</th>
                <th className="text-left p-3 font-medium">Date</th>
                <th className="text-left p-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentSessions.map((session) => (
                <tr key={session.id} className="border-b last:border-0">
                  <td className="p-3 font-medium">{session.student_name}</td>
                  <td className="p-3 text-muted-foreground">
                    {session.provider_name}
                  </td>
                  <td className="p-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary">
                      {session.unit_name}
                    </span>
                  </td>
                  <td className="p-3 text-muted-foreground">
                    {new Date(session.scheduled_at).toLocaleDateString()}
                  </td>
                  <td className="p-3">
                    <StatusBadge status={session.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-primary" />
            <div>
              <p className="text-2xl font-bold">
                {mockAnalytics.completion_rate}%
              </p>
              <p className="text-sm text-muted-foreground">
                Overall completion rate
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-primary" />
            <div>
              <p className="text-2xl font-bold">
                {mockAnalytics.active_coaches}
              </p>
              <p className="text-sm text-muted-foreground">
                Active peer coaches
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <Building2 className="w-5 h-5 text-primary" />
            <div>
              <p className="text-2xl font-bold">
                {mockAnalytics.active_clubs}
              </p>
              <p className="text-sm text-muted-foreground">Active clubs</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}