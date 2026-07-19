"use client";

import { useState } from "react";
import { Megaphone, Plus, Eye, Trash2, Users, Globe } from "lucide-react";
import { AnimatedPage, AnimatedSection } from "@/components/ui/animated-container";
import { PageHeader } from "@/components/ui/page-header";
import { SearchInput, FilterButton } from "@/components/ui/search-input";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";

const posts = [
  { id: "1", title: "Welcome Week Schedule", type: "announcement", author: "Dr. Grace Asare", audience: "public", date: "2026-09-01", status: "active" },
  { id: "2", title: "Coaching Session Reminder", type: "announcement", author: "Coach Yvonne", audience: "targeted", date: "2026-09-15", status: "active" },
  { id: "3", title: "Tech Club Hackathon", type: "event", author: "Ama Owusu", audience: "public", date: "2026-10-01", status: "active" },
  { id: "4", title: "Library Hours Update", type: "campus_update", author: "Platform Admin", audience: "public", date: "2026-10-05", status: "active" },
  { id: "5", title: "Old Announcement", type: "announcement", author: "Prof. Kwesi Arthur", audience: "public", date: "2026-08-01", status: "archived" },
];

const groups = [
  { id: "g1", name: "Class of 2029", type: "class_year", members: 168 },
  { id: "g2", name: "Class of 2028", type: "class_year", members: 145 },
  { id: "g3", name: "International Students", type: "cohort", members: 34 },
  { id: "g4", name: "Peer Coaches", type: "cohort", members: 8 },
];

export default function FeedPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [tab, setTab] = useState<"posts" | "groups">("posts");

  const filtered = posts.filter((p) => {
    const ms = p.title.toLowerCase().includes(search.toLowerCase());
    if (filter === "all") return ms;
    return ms && p.type === filter;
  });

  return (
    <AnimatedPage>
      <PageHeader
        title="Feed & Announcements"
        description="Moderate platform-wide content and manage targeting groups"
        badge="Content"
        action={
          <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#A93C40] text-white text-sm font-semibold hover:bg-[#A93C40]/90 transition-colors shadow-md shadow-[#A93C40]/20 cursor-pointer">
            <Plus className="w-4 h-4" />
            New Post
          </button>
        }
      />

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-[#f3f4f6] w-fit">
        {["posts", "groups"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t as any)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
              tab === t ? "bg-white text-[#1A2B4A] shadow-sm" : "text-[#6B7280] hover:text-[#1A2B4A]"
            }`}
          >
            {t === "posts" ? "Posts" : "Targeting Groups"}
          </button>
        ))}
      </div>

      {tab === "posts" ? (
        <>
          <div className="flex flex-col sm:flex-row gap-4">
            <SearchInput value={search} onChange={setSearch} placeholder="Search posts..." className="flex-1" />
            <div className="flex gap-2">
              {["all", "announcement", "campus_update", "event"].map((f) => (
                <FilterButton key={f} label={f === "all" ? "All" : f.replace("_", " ")} active={filter === f} onClick={() => setFilter(f)} />
              ))}
            </div>
          </div>

          <DataTable
            columns={[
              { key: "title", header: "Title", render: (p: any) => <span className="font-medium text-[#1A2B4A]">{p.title}</span> },
              { key: "type", header: "Type", render: (p: any) => (
                <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#A93C40]/5 text-[#A93C40] border border-[#A93C40]/10">
                  {p.type.replace("_", " ")}
                </span>
              )},
              { key: "author", header: "Author", render: (p: any) => <span className="text-[#6B7280]">{p.author}</span> },
              { key: "audience", header: "Audience", render: (p: any) => (
                <span className="flex items-center gap-1.5 text-sm text-[#6B7280]">
                  {p.audience === "public" ? <Globe className="w-3.5 h-3.5" /> : <Users className="w-3.5 h-3.5" />}
                  {p.audience}
                </span>
              )},
              { key: "date", header: "Date", render: (p: any) => <span className="text-[#6B7280]">{p.date}</span> },
              { key: "status", header: "Status", render: (p: any) => <StatusBadge status={p.status} /> },
              { key: "actions", header: "", render: (p: any) => (
                <div className="flex gap-2">
                  <button className="p-2 rounded-lg text-[#6B7280] hover:text-[#A93C40] hover:bg-[#A93C40]/5 transition-colors cursor-pointer"><Eye className="w-4 h-4" /></button>
                  <button className="p-2 rounded-lg text-[#6B7280] hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                </div>
              )},
            ]}
            data={filtered}
            keyExtractor={(p: any) => p.id}
          />
        </>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
          {groups.map((g) => (
            <div key={g.id} className="rounded-2xl border bg-white p-5 shadow-sm hover:shadow-lg transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-[#1A2B4A]">{g.name}</p>
                  <p className="text-xs text-[#6B7280] capitalize">{g.type} · {g.members} members</p>
                </div>
                <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#A93C40]/5 text-[#A93C40]">
                  {g.members}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </AnimatedPage>
  );
}