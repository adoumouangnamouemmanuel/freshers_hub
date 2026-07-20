"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Edit3,
  Trash2,
  LayoutGrid,
  List,
  Flame,
  TrendingUp,
  Users as UsersIcon,
  Search,
  Filter,
  Star,
  Calendar,
  MapPin,
  ExternalLink,
  Building2,
} from "lucide-react";
import {
  AnimatedPage,
  AnimatedSection,
} from "@/components/ui/animated-container";
import { PageHeader } from "@/components/ui/page-header";
import { SearchInput, SelectFilter } from "@/components/ui/search-input";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { mockClubs } from "@/lib/mock-data";

const CATEGORIES = ["Sports", "Culture", "Academic", "Faith", "Hobby", "Technology", "Arts"] as const;
const PALETTE: [string, string][] = [
  ["#A93C40", "#c96468"],
  ["#1A2B4A", "#33507f"],
  ["#C89B3C", "#e0bd6f"],
  ["#3E7C6B", "#5fa38f"],
  ["#6366f1", "#818cf8"],
  ["#ec4899", "#f472b6"],
];

function hash(seed: string) {
  return Array.from(seed).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
}

function categoryFor(seed: string) {
  return CATEGORIES[hash(seed) % CATEGORIES.length];
}

function growthFor(seed: string) {
  return (hash(seed) % 23) - 4;
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
  const [showFilters, setShowFilters] = useState(false);

  const enriched = useMemo(
    () =>
      mockClubs.map((c: any) => ({
        ...c,
        category: c.category ?? categoryFor(c.name),
        growth: c.growth ?? growthFor(c.id ?? c.name),
        featured: hash(c.id ?? c.name) % 5 === 0,
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

  const featured = useMemo(
    () => enriched.filter((c: any) => c.featured).slice(0, 2),
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

  const activeFiltersCount = category !== "all" ? 1 : 0;

  return (
    <AnimatedPage>
      <PageHeader
        title="Clubs & Organizations"
        description="Discover and manage student clubs across campus"
        badge="Content"
        action={
          <button className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#A93C40] px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#A93C40]/20 transition-colors hover:bg-[#8f3236]">
            <Plus className="h-4 w-4" /> Create club
          </button>
        }
      />

      {/* Stats Overview */}
      <AnimatedSection className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-[#eee8df] bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-[#A93C40]/10 flex items-center justify-center">
              <Building2 className="h-4 w-4 text-[#A93C40]" />
            </div>
            <p className="text-xs font-medium text-[#6B7280]">Total Clubs</p>
          </div>
          <p className="text-2xl font-bold text-[#1A2B4A]">{stats.total}</p>
        </div>
        <div className="rounded-xl border border-[#eee8df] bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <UsersIcon className="h-4 w-4 text-blue-600" />
            </div>
            <p className="text-xs font-medium text-[#6B7280]">Total Members</p>
          </div>
          <p className="text-2xl font-bold text-[#1A2B4A]">{stats.totalMembers}</p>
        </div>
        <div className="rounded-xl border border-[#eee8df] bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
            </div>
            <p className="text-xs font-medium text-[#6B7280]">Avg. Members</p>
          </div>
          <p className="text-2xl font-bold text-[#1A2B4A]">{stats.avgMembers}</p>
        </div>
        <div className="rounded-xl border border-[#eee8df] bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
              <Star className="h-4 w-4 text-amber-600" />
            </div>
            <p className="text-xs font-medium text-[#6B7280]">Categories</p>
          </div>
          <p className="text-2xl font-bold text-[#1A2B4A]">{stats.categories}</p>
        </div>
      </AnimatedSection>

      {/* Featured Clubs */}
      {featured.length > 0 && (
        <AnimatedSection className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Star className="h-5 w-5 text-[#C89B3C]" />
            <h2 className="text-lg font-semibold text-[#1A2B4A]">Featured Clubs</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {featured.map((club: any) => (
              <motion.div
                key={club.id}
                whileHover={{ y: -2 }}
                className="relative overflow-hidden rounded-2xl border border-[#eee8df] bg-white shadow-sm transition-all hover:shadow-lg"
              >
                <div
                  className="relative h-32 p-6"
                  style={{ background: coverGradient(club.name) }}
                >
                  <div className="relative z-10 flex items-start justify-between">
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm text-xl font-bold text-white">
                      {initials(club.name)}
                    </div>
                    <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                      {club.category}
                    </span>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-semibold text-[#1A2B4A] mb-1">{club.name}</h3>
                  <p className="text-sm text-[#6B7280] mb-4 line-clamp-2">{club.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-xs text-[#6B7280]">
                      <span className="flex items-center gap-1">
                        <UsersIcon className="h-3.5 w-3.5" />
                        {club.member_count} members
                      </span>
                      <span className="flex items-center gap-1 text-emerald-600 font-medium">
                        <TrendingUp className="h-3.5 w-3.5" />
                        +{club.growth}%
                      </span>
                    </div>
                    <button className="text-xs font-semibold text-[#A93C40] hover:underline">
                      View details
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </AnimatedSection>
      )}

      {/* Trending Spotlight */}
      <AnimatedSection className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Flame className="h-4 w-4 text-[#A93C40]" />
          <h2 className="text-sm font-semibold text-[#1A2B4A]">Trending this month</h2>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {trending.map((c: any) => (
            <div
              key={c.id}
              className="flex items-center gap-3 rounded-xl border border-[#eee8df] bg-white p-4 shadow-sm hover:shadow-md transition-all"
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

      {/* Advanced Filters */}
      <AnimatedSection className="mb-6 rounded-2xl border border-[#eee8df] bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search clubs by name..."
              className="w-full rounded-xl border border-[#e5e1d8] bg-white py-2.5 pl-10 pr-4 text-sm transition-colors focus:border-[#A93C40] focus:outline-none focus:ring-2 focus:ring-[#A93C40]/10"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors ${
              showFilters || activeFiltersCount > 0
                ? "border-[#A93C40] bg-[#A93C40]/5 text-[#A93C40]"
                : "border-[#e5e1d8] text-[#6B7280] hover:bg-[#f8f4ef]"
            }`}
          >
            <Filter className="h-4 w-4" />
            Filters
            {activeFiltersCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#A93C40] text-xs text-white">
                {activeFiltersCount}
              </span>
            )}
          </button>
          <SelectFilter
            value={category}
            onChange={setCategory}
            options={[
              { value: "all", label: "All categories" },
              ...CATEGORIES.map((cat) => ({ value: cat, label: cat })),
            ]}
          />
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="mt-4 flex flex-wrap gap-2 border-t border-[#f3f4f6] pt-4">
            <p className="text-xs font-semibold text-[#6B7280]">Quick filters:</p>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat === category ? "all" : cat)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                  category === cat
                    ? "border-[#A93C40] bg-[#A93C40]/5 text-[#A93C40]"
                    : "border-[#e5e1d8] text-[#6B7280] hover:bg-[#f8f4ef]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </AnimatedSection>

      {/* Results Count + View Toggle */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-[#6B7280]">
          Showing <span className="font-semibold text-[#1A2B4A]">{filtered.length}</span> of{" "}
          <span className="font-semibold text-[#1A2B4A]">{enriched.length}</span> clubs
        </p>
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

      {/* Clubs Grid View */}
      {filtered.length === 0 ? (
        <AnimatedSection className="rounded-2xl border border-dashed border-[#e5e1d8] bg-white p-12 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#f8f4ef]">
            <UsersIcon className="h-5 w-5 text-[#A93C40]" />
          </div>
          <p className="font-semibold text-[#1A2B4A]">No clubs match this view</p>
          <p className="mt-1 text-sm text-[#6B7280]">
            Try a different search term, or clear the category filter.
          </p>
        </AnimatedSection>
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c: any, i: number) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.4 }}
              className="group overflow-hidden rounded-2xl border border-[#eee8df] bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
            >
              {/* Cover */}
              <div
                className="relative flex h-28 items-end p-4"
                style={{ background: coverGradient(c.name) }}
              >
                <span className="rounded-full bg-white/20 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                  {c.category}
                </span>
                <div className="absolute right-3 top-3 flex gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
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
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-semibold text-[#1A2B4A] leading-tight">{c.name}</h3>
                  <StatusBadge status="active" />
                </div>
                <p className="mb-4 line-clamp-2 text-xs text-[#6B7280]">
                  {c.description}
                </p>

                <div className="flex items-center justify-between border-t border-[#f3f0ea] pt-3">
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
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
                      <TrendingUp className="h-3 w-3" />
                      +{c.growth}%
                    </span>
                    <span className="flex items-center gap-1 text-xs text-[#1A2B4A]">
                      <UsersIcon className="h-3 w-3" />
                      {c.member_count}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
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
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
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
              header: "Club Lead",
              render: (c: any) => (
                <div className="flex items-center gap-2">
                  <div
                    className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white"
                    style={{ background: coverGradient(c.lead_name ?? c.name) }}
                  >
                    {initials(c.lead_name ?? "?")}
                  </div>
                  <span className="text-[#6B7280]">{c.lead_name}</span>
                </div>
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
              header: "Growth",
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