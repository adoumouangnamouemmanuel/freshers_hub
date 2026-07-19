"use client";

import { useState } from "react";
import { Search, User, Shield, Mail, Phone, Calendar } from "lucide-react";
import { mockUsers } from "@/lib/mock-data";

const roleColors: Record<string, string> = {
  student: "bg-blue-100 text-blue-700 border-blue-200",
  peer_coach: "bg-emerald-100 text-emerald-700 border-emerald-200",
  coach_admin: "bg-purple-100 text-purple-700 border-purple-200",
  counselling_head: "bg-rose-100 text-rose-700 border-rose-200",
  advisor: "bg-amber-100 text-amber-700 border-amber-200",
  odip_head: "bg-cyan-100 text-cyan-700 border-cyan-200",
  staff: "bg-gray-100 text-gray-700 border-gray-200",
  club_lead: "bg-indigo-100 text-indigo-700 border-indigo-200",
  platform_admin: "bg-red-100 text-red-700 border-red-200",
};

export default function UsersPage() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  const allRoles = Array.from(
    new Set(mockUsers.flatMap((u) => u.roles))
  ).sort();

  const filtered = mockUsers.filter((u) => {
    const matchesSearch =
      u.full_name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.school_id.toLowerCase().includes(search.toLowerCase());
    if (roleFilter === "all") return matchesSearch;
    return matchesSearch && u.roles.includes(roleFilter);
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Users</h1>
        <p className="text-muted-foreground mt-1">
          User management and role administration
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-4">
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Total Users</p>
          <p className="text-2xl font-bold mt-1">{mockUsers.length}</p>
        </div>
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Students</p>
          <p className="text-2xl font-bold mt-1">
            {mockUsers.filter((u) => u.roles.includes("student")).length}
          </p>
        </div>
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Staff</p>
          <p className="text-2xl font-bold mt-1">
            {mockUsers.filter((u) => u.roles.includes("staff")).length}
          </p>
        </div>
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Peer Coaches</p>
          <p className="text-2xl font-bold mt-1">
            {mockUsers.filter((u) => u.roles.includes("peer_coach")).length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name, email, or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-4 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="all">All Roles</option>
          {allRoles.map((role) => (
            <option key={role} value={role}>
              {role.replace("_", " ")}
            </option>
          ))}
        </select>
      </div>

      {/* Users Table */}
      <div className="rounded-xl border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-3 font-medium">Name</th>
                <th className="text-left p-3 font-medium">School ID</th>
                <th className="text-left p-3 font-medium">Email</th>
                <th className="text-left p-3 font-medium">Class Year</th>
                <th className="text-left p-3 font-medium">Major</th>
                <th className="text-left p-3 font-medium">Roles</th>
                <th className="text-left p-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr
                  key={u.id}
                  className="border-b last:border-0 hover:bg-muted/30"
                >
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-4 h-4 text-primary" />
                      </div>
                      <span className="font-medium">{u.full_name}</span>
                    </div>
                  </td>
                  <td className="p-3 text-muted-foreground font-mono text-xs">
                    {u.school_id}
                  </td>
                  <td className="p-3 text-muted-foreground">{u.email}</td>
                  <td className="p-3">
                    {u.class_year > 0 ? u.class_year : "—"}
                  </td>
                  <td className="p-3 text-muted-foreground">{u.major}</td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1">
                      {u.roles.map((role) => (
                        <span
                          key={role}
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
                            roleColors[role] || "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {role.replace("_", " ")}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="p-3">
                    {u.is_active ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 border border-emerald-200">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                        Inactive
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="p-12 text-center text-muted-foreground">
            No users found.
          </div>
        )}
      </div>
    </div>
  );
}