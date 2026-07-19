"use client";

import { useState } from "react";
import { Search, Calendar, User, Phone } from "lucide-react";
import { mockSessions, mockUsers } from "@/lib/mock-data";

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

export default function CounsellingPage() {
  const [search, setSearch] = useState("");

  const counsellingSessions = mockSessions.filter(
    (s) => s.unit_name === "Counselling"
  );
  const counsellingHead = mockUsers.find((u) =>
    u.roles.includes("counselling_head")
  );

  const filtered = counsellingSessions.filter((s) =>
    s.student_name.toLowerCase().includes(search.toLowerCase())
  );

  const completed = counsellingSessions.filter(
    (s) => s.status === "completed"
  ).length;
  const booked = counsellingSessions.filter(
    (s) => s.status === "booked"
  ).length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Counselling</h1>
        <p className="text-muted-foreground mt-1">
          Counselling sessions managed by Dr. Grace Asare
        </p>
      </div>

      {/* Counselling Head Info */}
      {counsellingHead && (
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">
                {counsellingHead.full_name}
              </h2>
              <p className="text-sm text-muted-foreground">
                Counselling Unit Head
              </p>
              <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5" />
                  {counsellingHead.phone}
                </span>
                <span>{counsellingHead.email}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Total Sessions</p>
          <p className="text-2xl font-bold mt-1">
            {counsellingSessions.length}
          </p>
        </div>
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Completed</p>
          <p className="text-2xl font-bold mt-1 text-emerald-600">
            {completed}
          </p>
        </div>
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Upcoming</p>
          <p className="text-2xl font-bold mt-1 text-blue-600">{booked}</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search students..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Sessions Table */}
      <div className="rounded-xl border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-3 font-medium">Student</th>
                <th className="text-left p-3 font-medium">Counsellor</th>
                <th className="text-left p-3 font-medium">Date</th>
                <th className="text-left p-3 font-medium">Location</th>
                <th className="text-left p-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="p-3 font-medium">{s.student_name}</td>
                  <td className="p-3 text-muted-foreground">
                    {s.provider_name}
                  </td>
                  <td className="p-3 text-muted-foreground">
                    {new Date(s.scheduled_at).toLocaleDateString()}
                  </td>
                  <td className="p-3 text-muted-foreground">{s.location}</td>
                  <td className="p-3">
                    <StatusBadge status={s.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="p-12 text-center text-muted-foreground">
            No counselling sessions found.
          </div>
        )}
      </div>
    </div>
  );
}