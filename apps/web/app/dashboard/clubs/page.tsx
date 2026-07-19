"use client";

import { useState } from "react";
import { Building2, Users, Plus, Edit3, Trash2 } from "lucide-react";
import { AnimatedPage, AnimatedSection } from "@/components/ui/animated-container";
import { PageHeader } from "@/components/ui/page-header";
import { SearchInput } from "@/components/ui/search-input";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { mockClubs } from "@/lib/mock-data";

export default function ClubsPage() {
  const [search, setSearch] = useState("");
  const filtered = mockClubs.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <AnimatedPage>
      <PageHeader title="Clubs" description="Manage student clubs and organizations" badge="Content" action={
        <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#A93C40] text-white text-sm font-semibold hover:bg-[#A93C40]/90 transition-colors shadow-md shadow-[#A93C40]/20 cursor-pointer">
          <Plus className="w-4 h-4" /> Create Club
        </button>
      } />

      <SearchInput value={search} onChange={setSearch} placeholder="Search clubs..." />

      <DataTable
        columns={[
          { key: "name", header: "Club", render: (c: any) => (
            <div>
              <p className="font-medium text-[#1A2B4A]">{c.name}</p>
              <p className="text-xs text-[#6B7280] line-clamp-1">{c.description}</p>
            </div>
          )},
          { key: "lead", header: "Club Lead", render: (c: any) => <span className="text-[#6B7280]">{c.lead_name}</span> },
          { key: "members", header: "Members", render: (c: any) => <span className="font-medium text-[#1A2B4A]">{c.member_count}</span> },
          { key: "status", header: "Status", render: (c: any) => <StatusBadge status="active" /> },
          { key: "actions", header: "", render: (c: any) => (
            <div className="flex gap-2">
              <button className="p-2 rounded-lg text-[#6B7280] hover:text-[#A93C40] hover:bg-[#A93C40]/5 transition-colors cursor-pointer"><Edit3 className="w-4 h-4" /></button>
              <button className="p-2 rounded-lg text-[#6B7280] hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"><Trash2 className="w-4 h-4" /></button>
            </div>
          )},
        ]}
        data={filtered}
        keyExtractor={(c: any) => c.id}
      />
    </AnimatedPage>
  );
}