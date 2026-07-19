"use client";

import { useState } from "react";
import {
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  UserCheck,
} from "lucide-react";
import { mockCoachAssignments, mockSessions } from "@/lib/mock-data";

function ProgressBar({ completed, required }: { completed: number; required: number }) {
  const pct = Math.min((completed / required) * 100, 100);
  const color =
    pct >= 100
      ? "bg-emerald-500"
      : pct >= 66
      ? "bg-blue-500"
      : pct >= 33
      ? "bg-amber-500"
      : "bg-red-500";
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 bg-muted rounded-full h-2.5">
        <div
          className={`${color} h-2.5 rounded-full transition-all`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-sm font-medium w-16 text-right">
        {completed}/{required}
      </span>
    </div>
  );
}

export default function CoachingPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");

  const assignments = mockCoachAssignments.filter((a) => {
    const matchesSearch = a.fresher_name
      .toLowerCase()
      .includes(search.toLowerCase());
    if (filter === "all") return matchesSearch;
    if (filter === "complete")
      return matchesSearch && a.sessions_completed >= a.sessions_required;
    if (filter === "incomplete")
      return matchesSearch && a.sessions_completed < a.sessions_required;
    if (filter === "none")
      return matchesSearch && a.sessions_completed === 0;
    return matchesSearch;
  });

  const totalComplete = assignments.filter(
    (a) => a.sessions_completed >= a.sessions_required
  ).length;
  const totalIncomplete = assignments.filter(
    (a) => a.sessions_completed < a.sessions_required
  ).length;
  const totalNone = assignments.filter(
    (a) => a.sessions_completed === 0
  ).length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Coaching</h1>
        <p className="text-muted-foreground mt-1">
          Peer coaching assignments and compliance tracking
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-4">
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <UserCheck className="w-5 h-5 text-primary" />
            <div>
              <p className="text-2xl font-bold">{assignments.length}</p>
              <p className="text-sm text-muted-foreground">Total Assigned</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            <div>
              <p className="text-2xl font-bold">{totalComplete}</p>
              <p className="text-sm text-muted-foreground">Complete</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            <div>
              <p className="text-2xl font-bold">{totalIncomplete}</p>
              <p className="text-sm text-muted-foreground">In Progress</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-red-500" />
            <div>
              <p className="text-2xl font-bold">{totalNone}</p>
              <p className="text-sm text-muted-foreground">No Sessions Yet</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search freshers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="flex gap-2">
          {["all", "complete", "incomplete", "none"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                filter === f
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground hover:bg-accent"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Assignments Table */}
      <div className="rounded-xl border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-3 font-medium">Fresher</th>
                <th className="text-left p-3 font-medium">Peer Coach</th>
                <th className="text-left p-3 font-medium">Academic Year</th>
                <th className="text-left p-3 font-medium">Progress</th>
                <th className="text-left p-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map((a) => {
                const isComplete =
                  a.sessions_completed >= a.sessions_required;
                return (
                  <tr key={a.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="p-3 font-medium">{a.fresher_name}</td>
                    <td className="p-3 text-muted-foreground">
                      {a.peer_coach_name}
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {a.academic_year}
                    </td>
                    <td className="p-3">
                      <ProgressBar
                        completed={a.sessions_completed}
                        required={a.sessions_required}
                      />
                    </td>
                    <td className="p-3">
                      {isComplete ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          Complete
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 border border-amber-200">
                          <AlertCircle className="w-3 h-3" />
                          In Progress
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {assignments.length === 0 && (
          <div className="p-12 text-center text-muted-foreground">
            No assignments found matching your search.
          </div>
        )}
      </div>
    </div>
  );
}