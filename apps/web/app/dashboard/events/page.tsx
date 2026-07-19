"use client";

import { useState } from "react";
import { CalendarDays, Search, Plus, Eye, Users, MapPin } from "lucide-react";
import { AnimatedPage, AnimatedSection } from "@/components/ui/animated-container";
import { PageHeader } from "@/components/ui/page-header";
import { SearchInput } from "@/components/ui/search-input";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";

const events = [
  { id: "1", title: "Welcome Week Mixer", date: "2026-09-05", time: "18:00", organizer: "SLE", location: "Student Center", visibility: "public", rsvps: 45, capacity: 100, status: "completed" },
  { id: "2", title: "Tech Club Hackathon", date: "2026-10-15", time: "09:00", organizer: "Tech Club", location: "CS Lab", visibility: "public", rsvps: 28, capacity: 40, status: "scheduled" },
  { id: "3", title: "Mental Health Workshop", date: "2026-10-20", time: "14:00", organizer: "Counselling Unit", location: "Counselling Office", visibility: "targeted", rsvps: 12, capacity: 20, status: "scheduled" },
  { id: "4", title: "Career Fair", date: "2026-11-01", time: "10:00", organizer: "ODIP", location: "Quad", visibility: "public", rsvps: 78, capacity: 200, status: "scheduled" },
  { id: "5", title: "Photography Exhibition", date: "2026-08-20", time: "16:00", organizer: "Photography Club", location: "Gallery", visibility: "public", rsvps: 34, capacity: 50, status: "completed" },
];

export default function EventsPage() {
  const [search, setSearch] = useState("");
  const filtered = events.filter((e) => e.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <AnimatedPage>
      <PageHeader
        title="Events"
        description="View and manage all platform events from a single dashboard"
        badge="Content"
        action={
          <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#A93C40] text-white text-sm font-semibold hover:bg-[#A93C40]/90 transition-colors shadow-md shadow-[#A93C40]/20 cursor-pointer">
            <Plus className="w-4 h-4" />
            Create Event
          </button>
        }
      />

      <SearchInput value={search} onChange={setSearch} placeholder="Search events..." />

      <DataTable
        columns={[
          { key: "title", header: "Event", render: (e: any) => (
            <div>
              <p className="font-medium text-[#1A2B4A]">{e.title}</p>
              <p className="text-xs text-[#6B7280]">{e.date} at {e.time}</p>
            </div>
          )},
          { key: "organizer", header: "Organizer", render: (e: any) => <span className="text-[#6B7280]">{e.organizer}</span> },
          { key: "location", header: "Location", render: (e: any) => (
            <span className="flex items-center gap-1.5 text-sm text-[#6B7280]"><MapPin className="w-3.5 h-3.5" />{e.location}</span>
          )},
          { key: "visibility", header: "Visibility", render: (e: any) => (
            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#A93C40]/5 text-[#A93C40]">{e.visibility}</span>
          )},
          { key: "rsvps", header: "RSVPs", render: (e: any) => (
            <div className="flex items-center gap-2">
              <span className="font-medium text-[#1A2B4A]">{e.rsvps}/{e.capacity}</span>
              <div className="w-16 bg-[#f3f4f6] rounded-full h-1.5 overflow-hidden">
                <div className="h-1.5 rounded-full bg-emerald-500" style={{ width: `${(e.rsvps / e.capacity) * 100}%` }} />
              </div>
            </div>
          )},
          { key: "status", header: "Status", render: (e: any) => <StatusBadge status={e.status} /> },
          { key: "actions", header: "", render: (e: any) => (
            <button className="p-2 rounded-lg text-[#6B7280] hover:text-[#A93C40] hover:bg-[#A93C40]/5 transition-colors cursor-pointer">
              <Eye className="w-4 h-4" />
            </button>
          )},
        ]}
        data={filtered}
        keyExtractor={(e: any) => e.id}
      />
    </AnimatedPage>
  );
}