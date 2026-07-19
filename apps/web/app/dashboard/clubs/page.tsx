"use client";

import { useState } from "react";
import { Search, Users, Calendar, User, Building2 } from "lucide-react";
import { mockClubs, mockUsers } from "@/lib/mock-data";

export default function ClubsPage() {
  const [search, setSearch] = useState("");

  const filtered = mockClubs.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalMembers = mockClubs.reduce((sum, c) => sum + c.member_count, 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Clubs</h1>
        <p className="text-muted-foreground mt-1">
          Student clubs and organizations management
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-4">
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <Building2 className="w-5 h-5 text-primary" />
            <div>
              <p className="text-2xl font-bold">{mockClubs.length}</p>
              <p className="text-sm text-muted-foreground">Total Clubs</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-primary" />
            <div>
              <p className="text-2xl font-bold">{totalMembers}</p>
              <p className="text-sm text-muted-foreground">Total Members</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Avg Members/Club</p>
          <p className="text-2xl font-bold mt-1">
            {Math.round(totalMembers / mockClubs.length)}
          </p>
        </div>
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Largest Club</p>
          <p className="text-2xl font-bold mt-1">
            {Math.max(...mockClubs.map((c) => c.member_count))}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search clubs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Clubs Grid */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((club) => (
          <div
            key={club.id}
            className="rounded-xl border bg-card shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="h-32 rounded-t-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <Building2 className="w-12 h-12 text-primary/40" />
            </div>
            <div className="p-5 space-y-3">
              <h3 className="font-semibold text-lg">{club.name}</h3>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {club.description}
              </p>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Users className="w-4 h-4" />
                  {club.member_count} members
                </span>
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <User className="w-4 h-4" />
                  {club.lead_name}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
      {filtered.length === 0 && (
        <div className="p-12 text-center text-muted-foreground">
          No clubs found.
        </div>
      )}
    </div>
  );
}