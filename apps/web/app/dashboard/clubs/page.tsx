"use client";

import { useMemo, useState } from "react";
import {
  Plus,
  Edit3,
  Trash2,
  LayoutGrid,
  List,
  Flame,
  TrendingUp,
  Users as UsersIcon,
} from "lucide-react";
import {
  AnimatedPage,
  AnimatedSection,
} from "@/components/ui/animated-container";
import { PageHeader } from "@/components/ui/page-header";
import { SearchInput, FilterButton } from "@/components/ui/search-input";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { mockClubs } from "@/lib/mock-data";

/**
 * The rest of the portal is table-first because it's managing records.
 * Clubs are different — they're community identity, not just rows —
 * so this page leads with a visual gallery and offers the table as a
 * secondary, power-user view rather than the default.
 */

const CATEGORIES = ["Sports", "Culture", "Academic", "Faith", "Hobby"] as const;
const PALETTE: [string, string][] = [
  ["#A93C40", "#c96468"],
  ["#1A2B4A", "#33507f"],
  ["#C89B3C", "#e0bd6f"],
  ["#3E7C6B", "#5fa38f"],
];

function hash(seed: string) {
  return Array.from(seed).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
}

/** These three helpers stand in for fields the real club record should
 *  eventually carry (category, monthly growth, active-post count).
 *  Swap for real data as soon as the schema exposes them — kept
 *  deterministic here so the mock UI doesn't visually flicker on re-render. */
function categoryFor(seed: string) {
  return CATEGORIES[hash(seed) % CATEGORIES.length];
}
function growthFor(seed: string) {
  return (hash(seed) % 23) - 4; // roughly -4% to +18%, deterministic
}
function coverGradient(seed: string) {
  const [a, b] = PALETTE[hash(seed) % PALETTE.length];
  return `linear-gradient(135deg, ${a}, ${b})`;
}
function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return (
    (parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "")
  ).toUpperCase();
}

export default function ClubsPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [view, setView] = useState<"grid" | "table">("grid");

  const enriched = useMemo(
    () =>
      mockClubs.map((c: any) => ({
        ...c,
        category: c.category ?? categoryFor(c.name),
        growth: c.growth ?? growthFor(c.id ?? c.name),
      })),
    [],
  );

  const filtered = enriched.filter((c: any) => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === "all" || c.category === category;
    return matchesSearch && matchesCategory;
  });

  const trending = useMemo(
    () => [...enriched].sort((a, b) => b.growth - a.growth).slice(0, 3),
    [enriched],
  );

  const stats = useMemo(() => {
    const totalMembers = enriched.reduce(
      (sum: number, c: any) => sum + (c.member_count ?? 0),
      0,
    );
    return {
      total: enriched.length,
      totalMembers,
      avgMembers: enriched.length
        ? Math.round(totalMembers / enriched.length)
        : 0,
      categories: new Set(enriched.map((c: any) => c.category)).size,
    };
  }, [enriched]);

  return (
    <AnimatedPage>
      <PageHeader
        title="Clubs"
        description="Manage student clubs and organizations"
        badge="Content"
        action={
          <button className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#A93C40] px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#A93C40]/20 transition-colors hover:bg-[#8f3236]">
            <Plus className="h-4 w-4" /> Create club
          </button>
        }
      />

      {/* Summary strip */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Total clubs", value: stats.total },
          { label: "Total members", value: stats.totalMembers },
          { label: "Avg. members/club", value: stats.avgMembers },
          { label: "Categories", value: stats.categories },
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

      {/* Trending spotlight — the signature element for this page: clubs
          are a living community, and growth is the thing an admin actually
          wants to notice first, not just an alphabetical list. */}
      <AnimatedSection>
        <div className="mb-3 flex items-center gap-2">
          <Flame className="h-4 w-4 text-[#A93C40]" />
          <h2 className="text-sm font-semibold text-[#1A2B4A]">
            Trending this month
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {trending.map((c: any) => (
            <div
              key={c.id}
              className="flex items-center gap-3 rounded-2xl border border-[#eee8df] bg-white p-4 shadow-sm"
            >
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white"
                style={{ background: coverGradient(c.name) }}
              >
                {initials(c.name)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-[#1A2B4A]">
                  {c.name}
                </p>
                <p className="text-xs text-[#6B7280]">
                  {c.member_count} members
                </p>
              </div>
              <span
                className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                  c.growth >= 0
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-red-50 text-red-600"
                }`}
              >
                <TrendingUp className="h-3 w-3" />
                {c.growth >= 0 ? "+" : ""}
                {c.growth}%
              </span>
            </div>
          ))}
        </div>
      </AnimatedSection>

      {/* Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-4 sm:flex-row">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search clubs..."
            className="flex-1"
          />
          <div className="flex flex-wrap gap-2">
            <FilterButton
              label="All"
              active={category === "all"}
              onClick={() => setCategory("all")}
            />
            {CATEGORIES.map((cat) => (
              <FilterButton
                key={cat}
                label={cat}
                active={category === cat}
                onClick={() => setCategory(cat)}
              />
            ))}
          </div>
        </div>
        <div className="flex shrink-0 gap-1 rounded-xl bg-[#f3f4f6] p-1">
          <button
            onClick={() => setView("grid")}
            aria-label="Grid view"
            className={`cursor-pointer rounded-lg p-2 transition-colors ${
              view === "grid"
                ? "bg-white text-[#A93C40] shadow-sm"
                : "text-[#6B7280] hover:text-[#1A2B4A]"
            }`}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setView("table")}
            aria-label="Table view"
            className={`cursor-pointer rounded-lg p-2 transition-colors ${
              view === "table"
                ? "bg-white text-[#A93C40] shadow-sm"
                : "text-[#6B7280] hover:text-[#1A2B4A]"
            }`}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <AnimatedSection className="rounded-2xl border border-dashed border-[#e5e1d8] bg-white p-12 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#f8f4ef]">
            <UsersIcon className="h-5 w-5 text-[#A93C40]" />
          </div>
          <p className="font-semibold text-[#1A2B4A]">
            No clubs match this view
          </p>
          <p className="mt-1 text-sm text-[#6B7280]">
            Try a different search term, or clear the category filter.
          </p>
        </AnimatedSection>
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c: any) => (
            <AnimatedSection
              key={c.id}
              className="group overflow-hidden rounded-2xl border border-[#eee8df] bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
            >
              {/* Cover */}
              <div
                className="relative flex h-24 items-end p-4"
                style={{ background: coverGradient(c.name) }}
              >
                <span className="rounded-full bg-white/20 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                  {c.category}
                </span>
                <div className="absolute right-3 top-3 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    aria-label={`Edit ${c.name}`}
                    className="cursor-pointer rounded-lg bg-white/20 p-1.5 text-white backdrop-blur-sm hover:bg-white/30"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    aria-label={`Remove ${c.name}`}
                    className="cursor-pointer rounded-lg bg-white/20 p-1.5 text-white backdrop-blur-sm hover:bg-red-500/60"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-[#1A2B4A]">{c.name}</p>
                  <StatusBadge status="active" />
                </div>
                <p className="mt-1 line-clamp-2 text-xs text-[#6B7280]">
                  {c.description}
                </p>

                <div className="mt-4 flex items-center justify-between border-t border-[#f3f0ea] pt-3">
                  <div className="flex items-center gap-2">
                    <div
                      className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white"
                      style={{
                        background: coverGradient(c.lead_name ?? c.name),
                      }}
                    >
                      {initials(c.lead_name ?? "?")}
                    </div>
                    <span className="text-xs text-[#6B7280]">
                      {c.lead_name}
                    </span>
                  </div>
                  <span className="flex items-center gap-1 text-xs font-medium text-[#1A2B4A]">
                    <UsersIcon className="h-3 w-3" />
                    {c.member_count}
                  </span>
                </div>
              </div>
            </AnimatedSection>
          ))}
        </div>
      ) : (
        <DataTable
          columns={[
            {
              key: "name",
              header: "Club",
              render: (c: any) => (
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
                    style={{ background: coverGradient(c.name) }}
                  >
                    {initials(c.name)}
                  </div>
                  <div>
                    <p className="font-medium text-[#1A2B4A]">{c.name}</p>
                    <p className="line-clamp-1 text-xs text-[#6B7280]">
                      {c.description}
                    </p>
                  </div>
                </div>
              ),
            },
            {
              key: "category",
              header: "Category",
              render: (c: any) => (
                <span className="inline-flex items-center rounded-lg bg-[#A93C40]/5 px-2.5 py-1 text-xs font-semibold text-[#A93C40]">
                  {c.category}
                </span>
              ),
            },
            {
              key: "lead",
              header: "Club lead",
              render: (c: any) => (
                <span className="text-[#6B7280]">{c.lead_name}</span>
              ),
            },
            {
              key: "members",
              header: "Members",
              render: (c: any) => (
                <span className="font-medium text-[#1A2B4A] tabular-nums">
                  {c.member_count}
                </span>
              ),
            },
            {
              key: "growth",
              header: "This month",
              render: (c: any) => (
                <span
                  className={`inline-flex items-center gap-1 text-xs font-semibold ${c.growth >= 0 ? "text-emerald-600" : "text-red-500"}`}
                >
                  <TrendingUp className="h-3 w-3" />
                  {c.growth >= 0 ? "+" : ""}
                  {c.growth}%
                </span>
              ),
            },
            {
              key: "status",
              header: "Status",
              render: () => <StatusBadge status="active" />,
            },
            {
              key: "actions",
              header: "",
              render: (c: any) => (
                <div className="flex gap-2">
                  <button
                    aria-label={`Edit ${c.name}`}
                    className="cursor-pointer rounded-lg p-2 text-[#6B7280] transition-colors hover:bg-[#A93C40]/5 hover:text-[#A93C40]"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button
                    aria-label={`Remove ${c.name}`}
                    className="cursor-pointer rounded-lg p-2 text-[#6B7280] transition-colors hover:bg-red-50 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ),
            },
          ]}
          data={filtered}
          keyExtractor={(c: any) => c.id}
        />
      )}
    </AnimatedPage>
  );
}
