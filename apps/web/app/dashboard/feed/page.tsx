"use client";

import { useMemo, useState } from "react";
import {
  Plus,
  Eye,
  Trash2,
  Users,
  Globe,
  GraduationCap,
  Megaphone,
  CalendarDays,
  Radio,
  FolderPlus,
} from "lucide-react";
import {
  AnimatedPage,
  AnimatedSection,
} from "@/components/ui/animated-container";
import { PageHeader } from "@/components/ui/page-header";
import { SearchInput, FilterButton } from "@/components/ui/search-input";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";

const posts = [
  {
    id: "1",
    title: "Welcome Week Schedule",
    type: "announcement",
    author: "Dr. Grace Asare",
    audience: "public",
    date: "2026-09-01",
    status: "active",
  },
  {
    id: "2",
    title: "Coaching Session Reminder",
    type: "announcement",
    author: "Coach Yvonne",
    audience: "targeted",
    date: "2026-09-15",
    status: "active",
  },
  {
    id: "3",
    title: "Tech Club Hackathon",
    type: "event",
    author: "Ama Owusu",
    audience: "public",
    date: "2026-10-01",
    status: "active",
  },
  {
    id: "4",
    title: "Library Hours Update",
    type: "campus_update",
    author: "Platform Admin",
    audience: "public",
    date: "2026-10-05",
    status: "active",
  },
  {
    id: "5",
    title: "Old Announcement",
    type: "announcement",
    author: "Prof. Kwesi Arthur",
    audience: "public",
    date: "2026-08-01",
    status: "archived",
  },
];

const groups = [
  { id: "g1", name: "Class of 2029", type: "class_year", members: 168 },
  { id: "g2", name: "Class of 2028", type: "class_year", members: 145 },
  { id: "g3", name: "International Students", type: "cohort", members: 34 },
  { id: "g4", name: "Peer Coaches", type: "cohort", members: 8 },
];

/** Same brand-derived accent system used across the portal — content
 *  type gets its own color the same way units do on the Dashboard. */
const TYPE_STYLES: Record<
  string,
  { color: string; bg: string; icon: typeof Megaphone }
> = {
  announcement: { color: "#A93C40", bg: "#A93C4014", icon: Megaphone },
  campus_update: { color: "#1A2B4A", bg: "#1A2B4A14", icon: Radio },
  event: { color: "#C89B3C", bg: "#C89B3C1A", icon: CalendarDays },
};

const GROUP_ICON: Record<string, typeof GraduationCap> = {
  class_year: GraduationCap,
  cohort: Users,
};

export default function FeedPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [tab, setTab] = useState<"posts" | "groups">("posts");

  const filtered = posts.filter((p) => {
    const ms = p.title.toLowerCase().includes(search.toLowerCase());
    if (filter === "all") return ms;
    return ms && p.type === filter;
  });

  const stats = useMemo(
    () => ({
      total: posts.length,
      active: posts.filter((p) => p.status === "active").length,
      archived: posts.filter((p) => p.status === "archived").length,
      targeted: posts.filter((p) => p.audience === "targeted").length,
    }),
    [],
  );

  const maxMembers = Math.max(...groups.map((g) => g.members));

  return (
    <AnimatedPage>
      <PageHeader
        title="Feed & Announcements"
        description="Moderate platform-wide content and manage targeting groups"
        badge="Content"
        action={
          <button className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#A93C40] px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#A93C40]/20 transition-colors hover:bg-[#8f3236]">
            <Plus className="h-4 w-4" />
            New post
          </button>
        }
      />

      {/* Summary strip — the actual shape of what's on the Feed right now */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Total posts", value: stats.total },
          { label: "Active", value: stats.active },
          { label: "Archived", value: stats.archived },
          { label: "Targeted reach", value: stats.targeted },
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

      {/* Tabs */}
      <div className="flex w-fit gap-1 rounded-xl bg-[#f3f4f6] p-1">
        {(["posts", "groups"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`cursor-pointer rounded-lg px-5 py-2 text-sm font-semibold transition-all ${
              tab === t
                ? "bg-white text-[#1A2B4A] shadow-sm"
                : "text-[#6B7280] hover:text-[#1A2B4A]"
            }`}
          >
            {t === "posts" ? "Posts" : "Targeting groups"}
          </button>
        ))}
      </div>

      {tab === "posts" ? (
        <>
          <div className="flex flex-col gap-4 sm:flex-row">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search posts..."
              className="flex-1"
            />
            <div className="flex flex-wrap gap-2">
              {["all", "announcement", "campus_update", "event"].map((f) => (
                <FilterButton
                  key={f}
                  label={f === "all" ? "All" : f.replace("_", " ")}
                  active={filter === f}
                  onClick={() => setFilter(f)}
                />
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <AnimatedSection className="rounded-2xl border border-dashed border-[#e5e1d8] bg-white p-12 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#f8f4ef]">
                <Megaphone className="h-5 w-5 text-[#A93C40]" />
              </div>
              <p className="font-semibold text-[#1A2B4A]">
                No posts match this view
              </p>
              <p className="mt-1 text-sm text-[#6B7280]">
                Try a different search term, or clear the type filter above.
              </p>
            </AnimatedSection>
          ) : (
            <DataTable
              columns={[
                {
                  key: "title",
                  header: "Title",
                  render: (p: any) => (
                    <span className="font-medium text-[#1A2B4A]">
                      {p.title}
                    </span>
                  ),
                },
                {
                  key: "type",
                  header: "Type",
                  render: (p: any) => {
                    const style = TYPE_STYLES[p.type];
                    const Icon = style.icon;
                    return (
                      <span
                        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold"
                        style={{
                          color: style.color,
                          backgroundColor: style.bg,
                        }}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {p.type.replace("_", " ")}
                      </span>
                    );
                  },
                },
                {
                  key: "author",
                  header: "Author",
                  render: (p: any) => (
                    <span className="text-[#6B7280]">{p.author}</span>
                  ),
                },
                {
                  key: "audience",
                  header: "Audience",
                  render: (p: any) => (
                    <span className="flex items-center gap-1.5 text-sm text-[#6B7280]">
                      {p.audience === "public" ? (
                        <Globe className="h-3.5 w-3.5" />
                      ) : (
                        <Users className="h-3.5 w-3.5" />
                      )}
                      {p.audience}
                    </span>
                  ),
                },
                {
                  key: "date",
                  header: "Date",
                  render: (p: any) => (
                    <span className="text-[#6B7280]">{p.date}</span>
                  ),
                },
                {
                  key: "status",
                  header: "Status",
                  render: (p: any) => <StatusBadge status={p.status} />,
                },
                {
                  key: "actions",
                  header: "",
                  render: (p: any) => (
                    <div className="flex gap-2">
                      <button
                        aria-label={`View ${p.title}`}
                        className="cursor-pointer rounded-lg p-2 text-[#6B7280] transition-colors hover:bg-[#A93C40]/5 hover:text-[#A93C40]"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        aria-label={`Remove ${p.title}`}
                        className="cursor-pointer rounded-lg p-2 text-[#6B7280] transition-colors hover:bg-red-50 hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ),
                },
              ]}
              data={filtered}
              keyExtractor={(p: any) => p.id}
            />
          )}
        </>
      ) : (
        <>
          <div className="flex justify-end">
            <button className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-[#e5e1d8] px-4 py-2.5 text-sm font-semibold text-[#6B7280] transition-colors hover:bg-[#f8f4ef]">
              <FolderPlus className="h-4 w-4" />
              Create group
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {groups.map((g) => {
              const Icon = GROUP_ICON[g.type] ?? Users;
              const proportion = Math.round((g.members / maxMembers) * 100);
              return (
                <AnimatedSection
                  key={g.id}
                  className="rounded-2xl border border-[#eee8df] bg-white p-5 shadow-sm transition-all hover:shadow-lg"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#A93C40]/5">
                      <Icon className="h-4 w-4 text-[#A93C40]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-[#1A2B4A]">{g.name}</p>
                      <p className="text-xs capitalize text-[#9CA3AF]">
                        {g.type.replace("_", " ")}
                      </p>
                    </div>
                    <span className="shrink-0 text-lg font-bold text-[#1A2B4A] tabular-nums">
                      {g.members}
                    </span>
                  </div>
                  <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-[#f3f0ea]">
                    <div
                      className="h-1.5 rounded-full bg-[#A93C40]"
                      style={{ width: `${proportion}%` }}
                    />
                  </div>
                </AnimatedSection>
              );
            })}
          </div>
        </>
      )}
    </AnimatedPage>
  );
}
