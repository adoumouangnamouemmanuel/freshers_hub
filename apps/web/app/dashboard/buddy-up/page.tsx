"use client";

import { useState } from "react";
import { Search, Users, RefreshCw, ExternalLink } from "lucide-react";
import { mockBuddyPairings, mockUsers } from "@/lib/mock-data";

export default function BuddyUpPage() {
  const [search, setSearch] = useState("");

  const filtered = mockBuddyPairings.filter((bp) => {
    const q = search.toLowerCase();
    return (
      bp.fresher_name.toLowerCase().includes(q) ||
      bp.buddy_name.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Buddy Up</h1>
        <p className="text-muted-foreground mt-1">
          ODIP-sourced buddy pairings between freshers and returning students
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-4">
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-primary" />
            <div>
              <p className="text-2xl font-bold">{mockBuddyPairings.length}</p>
              <p className="text-sm text-muted-foreground">Active Pairings</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Unique Freshers</p>
          <p className="text-2xl font-bold mt-1">
            {new Set(mockBuddyPairings.map((bp) => bp.fresher_id)).size}
          </p>
        </div>
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Unique Buddies</p>
          <p className="text-2xl font-bold mt-1">
            {new Set(mockBuddyPairings.map((bp) => bp.buddy_id)).size}
          </p>
        </div>
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Academic Year</p>
          <p className="text-2xl font-bold mt-1">2026/2027</p>
        </div>
      </div>

      {/* ODIP Sync Info */}
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <RefreshCw className="w-5 h-5 text-primary" />
            <div>
              <p className="font-medium">ODIP Sync Status</p>
              <p className="text-sm text-muted-foreground">
                Last synced: August 20, 2026 — All pairings up to date
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 border border-emerald-200">
            Synced
          </span>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search freshers or buddies..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Pairings Table */}
      <div className="rounded-xl border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-3 font-medium">Fresher</th>
                <th className="text-left p-3 font-medium">Buddy</th>
                <th className="text-left p-3 font-medium">ODIP Ref</th>
                <th className="text-left p-3 font-medium">Synced</th>
                <th className="text-left p-3 font-medium">Contact</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((bp) => (
                <tr
                  key={bp.id}
                  className="border-b last:border-0 hover:bg-muted/30"
                >
                  <td className="p-3 font-medium">{bp.fresher_name}</td>
                  <td className="p-3 text-muted-foreground">
                    {bp.buddy_name}
                  </td>
                  <td className="p-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700">
                      {bp.odip_ref_id}
                    </span>
                  </td>
                  <td className="p-3 text-muted-foreground">
                    {new Date(bp.synced_at).toLocaleDateString()}
                  </td>
                  <td className="p-3">
                    <button className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                      <ExternalLink className="w-3.5 h-3.5" />
                      WhatsApp
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="p-12 text-center text-muted-foreground">
            No buddy pairings found.
          </div>
        )}
      </div>
    </div>
  );
}