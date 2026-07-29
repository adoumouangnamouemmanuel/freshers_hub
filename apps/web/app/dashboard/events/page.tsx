"use client";

import { useMemo, useState } from "react";
import { Plus, Eye, MapPin, Globe, Users, CalendarDays, RefreshCw, CheckCircle, XCircle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AnimatedPage,
  AnimatedSection,
} from "@/components/ui/animated-container";
import { PageHeader } from "@/components/ui/page-header";
import { SearchInput, FilterButton } from "@/components/ui/search-input";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

async function fetchAdminEvents(status: string, search: string) {
  const params = new URLSearchParams({ page: "1", pageSize: "50" });
  if (status && status !== "all") params.set("status", status);
  if (search) params.set("search", search);
  const res = await fetch(`${API_URL}/admin/events?${params.toString()}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to load events");
  return res.json();
}

async function patchEventStatus(id: string, status: string) {
  const res = await fetch(`${API_URL}/admin/events/${id}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error("Failed to update event");
  return res.json();
}

/** Relative-day framing so "in 12 weeks" is more readable than a raw date. */
function relativeLabel(dateStr: string) {
  if (!dateStr) return "";
  const diffMs = new Date(dateStr).getTime() - Date.now();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays > 0) {
    if (diffDays < 14) return `in ${diffDays} day${diffDays === 1 ? "" : "s"}`;
    return `in ${Math.round(diffDays / 7)} weeks`;
  }
  const past = Math.abs(diffDays);
  if (past < 14) return `${past} day${past === 1 ? "" : "s"} ago`;
  return `${Math.round(past / 7)} weeks ago`;
}

export default function EventsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const queryClient = useQueryClient();

  // BUG-13 fix: Replace hardcoded mock data with real API call
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin-events", statusFilter, search],
    queryFn: () => fetchAdminEvents(statusFilter, search),
    staleTime: 1000 * 30,
  });

  const events: any[] = data?.data || [];
  const total: number = data?.total || 0;

  const cancelMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      patchEventStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-events"] });
    },
  });

  const stats = useMemo(() => {
    const scheduled = events.filter((e) => e.status === "scheduled").length;
    const completed = events.filter((e) => e.status === "completed").length;
    const cancelled = events.filter((e) => e.status === "cancelled").length;
    const totalRsvps = events.reduce((sum: number, e: any) => sum + (e.going_count || 0), 0);
    return { total, scheduled, completed, cancelled, totalRsvps };
  }, [events, total]);

  return (
    <AnimatedPage>
      <PageHeader
        title="Events"
        description="View and manage all platform events from a single dashboard"
        badge="Content"
        action={
          <button
            id="create-event-btn"
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#A93C40] px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#A93C40]/20 transition-colors hover:bg-[#8f3236]"
            onClick={() => alert("Event creation via admin panel coming soon. Use the mobile app to create events.")}
          >
            <Plus className="h-4 w-4" />
            Create event
          </button>
        }
      />

      {/* Summary strip */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        {[
          { label: "Total events", value: stats.total },
          { label: "Scheduled", value: stats.scheduled },
          { label: "Completed", value: stats.completed },
          { label: "Cancelled", value: stats.cancelled },
          { label: "Total RSVPs", value: stats.totalRsvps },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-[#eee8df] bg-white p-4 shadow-sm"
          >
            <p className="text-2xl font-bold text-[#1A2B4A] tabular-nums">
              {s.value}
            </p>
            <p className="mt-0.5 text-xs text-[#6B7280]">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search events..."
          className="flex-1"
        />
        <div className="flex flex-wrap gap-2">
          {["all", "scheduled", "completed", "cancelled"].map((f) => (
            <FilterButton
              key={f}
              label={f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
              active={statusFilter === f}
              onClick={() => setStatusFilter(f)}
            />
          ))}
        </div>
        <button
          id="refresh-events-btn"
          onClick={() => refetch()}
          className="inline-flex items-center gap-1.5 rounded-xl border border-[#eee8df] bg-white px-3 py-2 text-sm text-[#6B7280] hover:bg-[#f8f4ef]"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </button>
      </div>

      {isLoading && (
        <AnimatedSection className="rounded-2xl border border-dashed border-[#e5e1d8] bg-white p-12 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#f8f4ef]">
            <CalendarDays className="h-5 w-5 animate-pulse text-[#A93C40]" />
          </div>
          <p className="text-sm text-[#6B7280]">Loading events…</p>
        </AnimatedSection>
      )}

      {isError && (
        <AnimatedSection className="rounded-2xl border border-red-100 bg-red-50 p-12 text-center">
          <p className="font-semibold text-red-700">Failed to load events</p>
          <p className="mt-1 text-sm text-red-500">
            Check your connection or try refreshing.
          </p>
        </AnimatedSection>
      )}

      {!isLoading && !isError && events.length === 0 && (
        <AnimatedSection className="rounded-2xl border border-dashed border-[#e5e1d8] bg-white p-12 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#f8f4ef]">
            <CalendarDays className="h-5 w-5 text-[#A93C40]" />
          </div>
          <p className="font-semibold text-[#1A2B4A]">No events match this view</p>
          <p className="mt-1 text-sm text-[#6B7280]">
            Try a different search term, or clear the status filter above.
          </p>
        </AnimatedSection>
      )}

      {!isLoading && !isError && events.length > 0 && (
        <DataTable
          columns={[
            {
              key: "title",
              header: "Event",
              render: (e: any) => (
                <div>
                  <p className="font-medium text-[#1A2B4A]">{e.title}</p>
                  <p className="text-xs text-[#6B7280]">
                    {e.event_date} at {e.event_time?.substring(0, 5)} &middot;{" "}
                    <span className="text-[#A93C40]">
                      {relativeLabel(e.event_date)}
                    </span>
                  </p>
                </div>
              ),
            },
            {
              key: "author_name",
              header: "Organizer",
              render: (e: any) => (
                <span className="text-[#6B7280]">{e.organizer || e.author_name}</span>
              ),
            },
            {
              key: "location",
              header: "Location",
              render: (e: any) =>
                e.is_online ? (
                  <span className="flex items-center gap-1.5 text-sm text-[#6B7280]">
                    <Globe className="h-3.5 w-3.5" />
                    Online
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-sm text-[#6B7280]">
                    <MapPin className="h-3.5 w-3.5" />
                    {e.location || "—"}
                  </span>
                ),
            },
            {
              key: "visibility",
              header: "Visibility",
              render: (e: any) => (
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#A93C40]/5 px-2.5 py-1 text-xs font-semibold text-[#A93C40]">
                  {e.visibility === "public" ? (
                    <Globe className="h-3.5 w-3.5" />
                  ) : (
                    <Users className="h-3.5 w-3.5" />
                  )}
                  {e.visibility}
                </span>
              ),
            },
            {
              key: "going_count",
              header: "RSVPs",
              render: (e: any) => {
                const count = e.going_count || 0;
                const cap = e.capacity;
                const pct = cap ? (count / cap) * 100 : 0;
                const nearCapacity = cap && pct >= 90;
                return (
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-[#1A2B4A] tabular-nums">
                      {count}{cap ? `/${cap}` : ""}
                    </span>
                    {cap && (
                      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-[#f3f4f6]">
                        <div
                          className={`h-1.5 rounded-full ${nearCapacity ? "bg-[#C89B3C]" : "bg-emerald-500"}`}
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                    )}
                    {nearCapacity && (
                      <span className="text-xs font-medium text-[#C89B3C]">
                        Nearly full
                      </span>
                    )}
                  </div>
                );
              },
            },
            {
              key: "status",
              header: "Status",
              render: (e: any) => <StatusBadge status={e.status} />,
            },
            {
              key: "actions",
              header: "",
              render: (e: any) => (
                <div className="flex items-center gap-1">
                  {e.status === "scheduled" && (
                    <button
                      id={`cancel-event-${e.id}`}
                      aria-label={`Cancel ${e.title}`}
                      onClick={() =>
                        cancelMutation.mutate({ id: e.id, status: "cancelled" })
                      }
                      className="cursor-pointer rounded-lg p-2 text-[#6B7280] transition-colors hover:bg-red-50 hover:text-red-500"
                      title="Cancel event"
                    >
                      <XCircle className="h-4 w-4" />
                    </button>
                  )}
                  {e.status === "cancelled" && (
                    <button
                      id={`restore-event-${e.id}`}
                      aria-label={`Restore ${e.title}`}
                      onClick={() =>
                        cancelMutation.mutate({ id: e.id, status: "scheduled" })
                      }
                      className="cursor-pointer rounded-lg p-2 text-[#6B7280] transition-colors hover:bg-green-50 hover:text-green-600"
                      title="Restore event"
                    >
                      <CheckCircle className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    id={`view-event-${e.id}`}
                    aria-label={`View ${e.title}`}
                    className="cursor-pointer rounded-lg p-2 text-[#6B7280] transition-colors hover:bg-[#A93C40]/5 hover:text-[#A93C40]"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                </div>
              ),
            },
          ]}
          data={events}
          keyExtractor={(e: any) => e.id}
        />
      )}
    </AnimatedPage>
  );
}
