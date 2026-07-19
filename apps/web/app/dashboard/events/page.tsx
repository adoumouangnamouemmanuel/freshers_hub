"use client";

import { useMemo, useState } from "react";
import { Plus, Eye, MapPin, Globe, Users, CalendarDays } from "lucide-react";
import {
  AnimatedPage,
  AnimatedSection,
} from "@/components/ui/animated-container";
import { PageHeader } from "@/components/ui/page-header";
import { SearchInput, FilterButton } from "@/components/ui/search-input";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";

const events = [
  {
    id: "1",
    title: "Welcome Week Mixer",
    date: "2026-09-05",
    time: "18:00",
    organizer: "SLE",
    location: "Student Center",
    visibility: "public",
    rsvps: 45,
    capacity: 100,
    status: "completed",
  },
  {
    id: "2",
    title: "Tech Club Hackathon",
    date: "2026-10-15",
    time: "09:00",
    organizer: "Tech Club",
    location: "CS Lab",
    visibility: "public",
    rsvps: 28,
    capacity: 40,
    status: "scheduled",
  },
  {
    id: "3",
    title: "Mental Health Workshop",
    date: "2026-10-20",
    time: "14:00",
    organizer: "Counselling Unit",
    location: "Counselling Office",
    visibility: "targeted",
    rsvps: 12,
    capacity: 20,
    status: "scheduled",
  },
  {
    id: "4",
    title: "Career Fair",
    date: "2026-11-01",
    time: "10:00",
    organizer: "ODIP",
    location: "Quad",
    visibility: "public",
    rsvps: 78,
    capacity: 200,
    status: "scheduled",
  },
  {
    id: "5",
    title: "Photography Exhibition",
    date: "2026-08-20",
    time: "16:00",
    organizer: "Photography Club",
    location: "Gallery",
    visibility: "public",
    rsvps: 34,
    capacity: 50,
    status: "completed",
  },
];

/** Relative-day framing, since a raw ISO date asks the reader to do the
 *  math themselves — "in 12 weeks" or "3 days ago" is what actually
 *  answers "is this coming up soon?" at a glance. */
function relativeLabel(dateStr: string) {
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

  const filtered = events.filter((e) => {
    const matchesSearch = e.title.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || e.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = useMemo(() => {
    const totalRsvps = events.reduce((sum, e) => sum + e.rsvps, 0);
    return {
      total: events.length,
      scheduled: events.filter((e) => e.status === "scheduled").length,
      completed: events.filter((e) => e.status === "completed").length,
      totalRsvps,
    };
  }, []);

  return (
    <AnimatedPage>
      <PageHeader
        title="Events"
        description="View and manage all platform events from a single dashboard"
        badge="Content"
        action={
          <button className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#A93C40] px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#A93C40]/20 transition-colors hover:bg-[#8f3236]">
            <Plus className="h-4 w-4" />
            Create event
          </button>
        }
      />

      {/* Summary strip — same census pattern as Users and Feed, so the
          portal reads as one system rather than five separate screens. */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Total events", value: stats.total },
          { label: "Scheduled", value: stats.scheduled },
          { label: "Completed", value: stats.completed },
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
              label={
                f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)
              }
              active={statusFilter === f}
              onClick={() => setStatusFilter(f)}
            />
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <AnimatedSection className="rounded-2xl border border-dashed border-[#e5e1d8] bg-white p-12 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#f8f4ef]">
            <CalendarDays className="h-5 w-5 text-[#A93C40]" />
          </div>
          <p className="font-semibold text-[#1A2B4A]">
            No events match this view
          </p>
          <p className="mt-1 text-sm text-[#6B7280]">
            Try a different search term, or clear the status filter above.
          </p>
        </AnimatedSection>
      ) : (
        <DataTable
          columns={[
            {
              key: "title",
              header: "Event",
              render: (e: any) => (
                <div>
                  <p className="font-medium text-[#1A2B4A]">{e.title}</p>
                  <p className="text-xs text-[#6B7280]">
                    {e.date} at {e.time} &middot;{" "}
                    <span className="text-[#A93C40]">
                      {relativeLabel(e.date)}
                    </span>
                  </p>
                </div>
              ),
            },
            {
              key: "organizer",
              header: "Organizer",
              render: (e: any) => (
                <span className="text-[#6B7280]">{e.organizer}</span>
              ),
            },
            {
              key: "location",
              header: "Location",
              render: (e: any) => (
                <span className="flex items-center gap-1.5 text-sm text-[#6B7280]">
                  <MapPin className="h-3.5 w-3.5" />
                  {e.location}
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
              key: "rsvps",
              header: "RSVPs",
              render: (e: any) => {
                const pct = (e.rsvps / e.capacity) * 100;
                const nearCapacity = pct >= 90;
                return (
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-[#1A2B4A] tabular-nums">
                      {e.rsvps}/{e.capacity}
                    </span>
                    <div className="h-1.5 w-16 overflow-hidden rounded-full bg-[#f3f4f6]">
                      <div
                        className={`h-1.5 rounded-full ${nearCapacity ? "bg-[#C89B3C]" : "bg-emerald-500"}`}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
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
                <button
                  aria-label={`View ${e.title}`}
                  className="cursor-pointer rounded-lg p-2 text-[#6B7280] transition-colors hover:bg-[#A93C40]/5 hover:text-[#A93C40]"
                >
                  <Eye className="h-4 w-4" />
                </button>
              ),
            },
          ]}
          data={filtered}
          keyExtractor={(e: any) => e.id}
        />
      )}
    </AnimatedPage>
  );
}
