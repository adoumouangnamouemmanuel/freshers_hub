"use client";

import { useMemo, useState, useTransition } from "react";
import { motion } from "framer-motion";
import {
  Plus, Edit3, Trash2, LayoutGrid, List, Flame, TrendingUp, Users as UsersIcon,
  Search, Filter, Star, Calendar, MapPin, ExternalLink, Building2
} from "lucide-react";
import { AnimatedPage, AnimatedSection } from "@/components/ui/animated-container";
import { PageHeader } from "@/components/ui/page-header";
import { SearchInput } from "@/components/ui/search-input";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { useRouter } from "next/navigation";
import { AddClubModal } from "./add-club-modal";
import { EditClubModal } from "./edit-club-modal";
import { ClubDetailsDrawer } from "./club-details-drawer";
import { LineChart, Line, ResponsiveContainer } from "recharts";

const CATEGORIES = ["Sports", "Culture", "Academic", "Faith", "Hobby", "Technology", "Arts"] as const;
const PALETTE: [string, string][] = [
  ["#A93C40", "#c96468"], ["#1A2B4A", "#33507f"], ["#C89B3C", "#e0bd6f"],
  ["#3E7C6B", "#5fa38f"], ["#6366f1", "#818cf8"], ["#ec4899", "#f472b6"],
];

function hash(seed: string) { return Array.from(seed).reduce((acc, ch) => acc + ch.charCodeAt(0), 0); }
function categoryFor(seed: string) { return CATEGORIES[hash(seed) % CATEGORIES.length]; }
function growthFor(seed: string) { return (hash(seed) % 23) - 4; }
function coverGradient(seed: string) {
  const [a, b] = PALETTE[hash(seed) % PALETTE.length];
  return `linear-gradient(135deg, ${a}, ${b})`;
}
function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "")).toUpperCase();
}

const resolveImageUrl = (url: string | null | undefined) => {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
  return `${baseUrl}${url}`;
};

export default function ClubsClient({ initialData, allUsers }: { initialData: any, allUsers: any[] }) {
  const router = useRouter();
  
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [sortBy, setSortBy] = useState<"name" | "members" | "newest">("name");
  const [view, setView] = useState<"grid" | "table">("grid");
  const [showFilters, setShowFilters] = useState(false);
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingClub, setEditingClub] = useState<any>(null);
  const [selectedClub, setSelectedClub] = useState<any>(null);

  // Pagination logic mock (client side appending could be done here)
  const [rawClubs, setRawClubs] = useState(initialData.data || []);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const enriched = useMemo(() =>
    rawClubs.map((c: any) => ({
      ...c,
      category: c.category ?? categoryFor(c.name),
      growth: growthFor(c.id ?? c.name),
      featured: hash(c.id ?? c.name) % 5 === 0,
      memberCount: parseInt(c.member_count || '0', 10),
      eventCount: parseInt(c.event_count || '0', 10),
      postCount: parseInt(c.post_count || '0', 10),
      status: c.is_active ? "active" : "inactive"
    })),
    [rawClubs]
  );

  const filtered = useMemo(() => {
    let result = enriched.filter((c: any) => {
      const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = category === "all" || c.category.toLowerCase() === category;
      return matchesSearch && matchesCategory;
    });

    result.sort((a: any, b: any) => {
      if (sortBy === "members") return b.memberCount - a.memberCount;
      if (sortBy === "newest") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      return a.name.localeCompare(b.name);
    });

    return result;
  }, [enriched, search, category, sortBy]);

  const trending = useMemo(() => [...enriched].sort((a, b) => b.growth - a.growth).slice(0, 3), [enriched]);

  // Generate fake sparkline data
  const generateSparklineData = (growth: number) => {
    let base = 50;
    const trend = growth > 0 ? 1 : -1;
    return Array.from({ length: 10 }).map((_, i) => {
      base = base + (Math.random() * 10 - 3) + trend * 2;
      return { value: base };
    });
  };

  const stats = useMemo(() => {
    const totalMembers = enriched.reduce((sum: number, c: any) => sum + (c.memberCount ?? 0), 0);
    const activeClubs = enriched.filter((c: any) => c.status === "active").length;
    return { totalMembers, activeClubs };
  }, [enriched]);

  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center p-16 text-center border border-[#e5e1d8] rounded-3xl bg-white shadow-sm my-8">
      <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mb-6 border-8 border-red-50/50">
        <Building2 className="w-10 h-10 text-[#A93C40]" />
      </div>
      <h3 className="text-xl font-bold text-[#1A2B4A] mb-2">No clubs found</h3>
      <p className="text-gray-500 max-w-sm mb-8 leading-relaxed">
        We couldn't find any clubs matching your current filters. Try adjusting your search or create a new club.
      </p>
      <div className="flex gap-3">
        <button 
          onClick={() => { setSearch(""); setCategory("all"); }}
          className="cursor-pointer px-5 py-2.5 text-sm font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
        >
          Clear filters
        </button>
        <button 
          onClick={() => setIsAddOpen(true)}
          className="cursor-pointer px-5 py-2.5 text-sm font-medium text-white bg-[#A93C40] hover:bg-[#8B3135] rounded-xl transition-colors shadow-sm"
        >
          Create Club
        </button>
      </div>
    </div>
  );

  return (
    <AnimatedPage>
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <PageHeader
          title="Clubs Directory"
          description="Manage student organizations, track engagement, and oversee club leadership."
          badge="Campus Life"
        />
        <div className="flex gap-2">
          <button 
            onClick={() => setIsAddOpen(true)}
            className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-[#A93C40] text-white text-sm font-medium rounded-xl hover:bg-[#8B3135] transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> Add Club
          </button>
        </div>
      </div>

      <AnimatedSection delay={0.1}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="col-span-1 lg:col-span-2 bg-gradient-to-br from-[#1A2B4A] to-[#2c4370] rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/3 -translate-x-1/4 blur-2xl pointer-events-none" />
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div>
                <h3 className="text-lg font-medium text-white/80 mb-2 flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-400" /> Campus Engagement
                </h3>
                <p className="text-4xl font-bold mb-4">{stats.totalMembers.toLocaleString()} <span className="text-xl font-normal text-white/60">active members</span></p>
              </div>
              <div className="flex items-center gap-8">
                <div>
                  <p className="text-white/60 text-sm mb-1">Active Clubs</p>
                  <p className="text-2xl font-bold">{stats.activeClubs}</p>
                </div>
                <div className="w-px h-10 bg-white/20" />
                <div>
                  <p className="text-white/60 text-sm mb-1">Categories</p>
                  <p className="text-2xl font-bold">{CATEGORIES.length}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-3xl p-6 border border-[#e5e1d8] shadow-sm flex flex-col relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-400 to-pink-500" />
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-[#1A2B4A] flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-500" /> Trending Now
              </h3>
            </div>
            <div className="space-y-5 flex-1">
              {trending.map((c, i) => (
                <div key={c.id} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white shadow-sm shrink-0" style={{ background: coverGradient(c.name) }}>
                    {resolveImageUrl(c.image_url) ? (
                      <img src={resolveImageUrl(c.image_url)!} alt={c.name} className="w-full h-full object-cover rounded-xl" />
                    ) : (
                      initials(c.name)
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-[#1A2B4A] truncate">{c.name}</p>
                    <p className="text-xs text-gray-500 truncate">{c.memberCount} members</p>
                  </div>
                  <div className="w-16 h-8 shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={generateSparklineData(c.growth)}>
                        <Line type="monotone" dataKey="value" stroke={c.growth > 0 ? "#10b981" : "#f43f5e"} strokeWidth={2} dot={false} isAnimationActive={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg shrink-0 ${c.growth > 0 ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'}`}>
                    {c.growth > 0 ? '+' : ''}{c.growth}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </AnimatedSection>

      {/* Toolbar */}
      <AnimatedSection delay={0.3} className="py-4 mb-6 border-b border-[#e5e1d8]/50">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex w-full sm:w-auto items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search clubs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-[#e5e1d8] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#A93C40]/20 focus:border-[#A93C40] transition-all shadow-sm"
              />
            </div>
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`cursor-pointer p-2 rounded-xl border transition-colors ${showFilters ? 'bg-[#A93C40] text-white border-[#A93C40]' : 'bg-white text-gray-600 border-[#e5e1d8] hover:bg-gray-50'} shadow-sm`}
            >
              <Filter className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-2 bg-white border border-[#e5e1d8] rounded-xl text-sm font-medium text-[#1A2B4A] focus:outline-none focus:ring-2 focus:ring-[#A93C40]/20 shadow-sm"
            >
              <option value="name">Sort by Name</option>
              <option value="members">Sort by Members</option>
              <option value="newest">Sort by Newest</option>
            </select>
            <div className="flex bg-white rounded-xl border border-[#e5e1d8] p-1 shadow-sm">
              <button
                onClick={() => setView("grid")}
                className={`cursor-pointer p-1.5 rounded-lg transition-colors ${view === "grid" ? "bg-gray-100 text-[#1A2B4A]" : "text-gray-400 hover:text-gray-600"}`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setView("table")}
                className={`cursor-pointer p-1.5 rounded-lg transition-colors ${view === "table" ? "bg-gray-100 text-[#1A2B4A]" : "text-gray-400 hover:text-gray-600"}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {showFilters && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            className="mt-4 pt-4 border-t border-[#e5e1d8] flex flex-wrap gap-2 overflow-hidden"
          >
            {["all", ...CATEGORIES].map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat.toLowerCase())}
                className={`cursor-pointer px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                  category === cat.toLowerCase() 
                    ? 'bg-[#1A2B4A] text-white border-[#1A2B4A]' 
                    : 'bg-white text-gray-600 border-[#e5e1d8] hover:border-gray-300'
                }`}
              >
                {cat === 'all' ? 'All Categories' : cat}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatedSection>

      <AnimatedSection delay={0.4}>
        {filtered.length === 0 ? (
          <EmptyState />
        ) : view === "grid" ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
              {filtered.map((club: any, i: number) => (
              <motion.div
                key={club.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => setSelectedClub(club)}
                className="group flex flex-col bg-white rounded-2xl border border-[#e5e1d8] overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer"
              >
                <div className="h-24 w-full relative shrink-0" style={{ background: coverGradient(club.name) }}>
                  {resolveImageUrl(club.cover_image) && (
                    <img src={resolveImageUrl(club.cover_image)!} alt={club.name} className="absolute inset-0 w-full h-full object-cover" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setEditingClub(club); }}
                      className="cursor-pointer p-1.5 bg-white/20 backdrop-blur-md rounded-lg text-white hover:bg-white hover:text-[#1A2B4A] transition-colors shadow-sm"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="absolute -bottom-8 left-6">
                    <div className="w-16 h-16 rounded-2xl bg-white p-1 shadow-lg border border-gray-100">
                      {resolveImageUrl(club.image_url) ? (
                        <img src={resolveImageUrl(club.image_url)!} alt="Logo" className="w-full h-full rounded-xl object-cover" />
                      ) : (
                        <div className="w-full h-full rounded-xl flex items-center justify-center text-xl font-bold text-white shadow-inner" style={{ background: coverGradient(club.name) }}>
                          {initials(club.name)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-10 p-6 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg group-hover:text-[#A93C40] transition-colors line-clamp-1">{club.name}</h3>
                      <span className="text-xs font-medium text-[#A93C40] uppercase tracking-wider">{club.category}</span>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-500 mb-6 flex-1 line-clamp-2 leading-relaxed">
                    {club.description || "No description provided."}
                  </p>

                  <div className="pt-4 border-t border-[#e5e1d8] mt-auto">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1.5 text-gray-600 font-medium">
                        <UsersIcon className="w-4 h-4 text-gray-400" />
                        {club.memberCount} <span className="text-gray-400 font-normal text-xs">members</span>
                        <StatusBadge status={club.status} />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
              ))}
            </div>
            
            {initialData.page * initialData.pageSize < initialData.total && (
              <div className="mt-8 flex justify-center">
                <button 
                  onClick={async () => {
                    setIsLoadingMore(true);
                    try {
                      const nextPage = Math.floor(rawClubs.length / initialData.pageSize) + 1;
                      const res = await import("@/app/actions/clubs").then(m => m.getClubsAction({ page: nextPage, pageSize: initialData.pageSize }));
                      setRawClubs((prev: any) => [...prev, ...res.data]);
                    } catch (e) {
                      console.error("Failed to load more", e);
                    }
                    setIsLoadingMore(false);
                  }}
                  disabled={isLoadingMore}
                  className="cursor-pointer px-6 py-3 bg-white border border-[#e5e1d8] rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
                >
                  {isLoadingMore ? "Loading..." : "Load More"}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="bg-white rounded-2xl border border-[#e5e1d8] overflow-hidden shadow-sm">
            <DataTable
              columns={[
                {
                  key: "name",
                  header: "Club Name",
                  render: (club: any) => (
                    <div className="flex items-center gap-3 py-2 cursor-pointer" onClick={() => setSelectedClub(club)}>
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white shadow-sm overflow-hidden" style={{ background: coverGradient(club.name) }}>
                        {resolveImageUrl(club.image_url) ? (
                          <img src={resolveImageUrl(club.image_url)!} alt="Logo" className="w-full h-full object-cover" />
                        ) : (
                          initials(club.name)
                        )}
                      </div>
                      <div>
                        <span className="font-semibold text-gray-900 block hover:text-[#A93C40] transition-colors">{club.name}</span>
                        <span className="text-xs text-gray-500">{club.category}</span>
                      </div>
                    </div>
                  ),
                },
                {
                  key: "members",
                  header: "Members",
                  render: (club: any) => (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-600 ml-2">{club.memberCount}</span>
                    </div>
                  ),
                },
                {
                  key: "lead_name",
                  header: "Lead",
                  render: (club: any) => <span className="text-sm text-gray-600">{club.lead_name || 'None'}</span>,
                },
                {
                  key: "status",
                  header: "Status",
                  render: (club: any) => <StatusBadge status={club.status} />,
                },
                {
                  key: "actions",
                  header: "",
                  render: (club: any) => (
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => setEditingClub(club)}
                        className="cursor-pointer p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    </div>
                  ),
                },
              ]}
              data={filtered}
              keyExtractor={(club: any) => club.id}
            />
          </div>
        )}
      </AnimatedSection>

      <AddClubModal 
        isOpen={isAddOpen} 
        onClose={() => setIsAddOpen(false)} 
        allUsers={allUsers}
        onSuccess={() => {
          setIsAddOpen(false);
          router.refresh();
        }}
      />

      <EditClubModal 
        club={editingClub} 
        isOpen={!!editingClub} 
        onClose={() => setEditingClub(null)} 
        allUsers={allUsers}
        onSuccess={() => {
          setEditingClub(null);
          setSelectedClub(null);
          router.refresh();
        }}
      />

      <ClubDetailsDrawer
        club={selectedClub}
        isOpen={!!selectedClub}
        onClose={() => setSelectedClub(null)}
        onEdit={() => setEditingClub(selectedClub)}
      />
    </AnimatedPage>
  );
}
