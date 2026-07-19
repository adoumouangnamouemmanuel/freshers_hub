"use client";

import { useState } from "react";
import { UserPlus, Edit3, Trash2, User } from "lucide-react";
import { AnimatedPage, AnimatedSection } from "@/components/ui/animated-container";
import { PageHeader } from "@/components/ui/page-header";
import { SearchInput, SelectFilter } from "@/components/ui/search-input";
import { DataTable } from "@/components/ui/data-table";
import { RoleBadge } from "@/components/ui/status-badge";
import { mockUsers } from "@/lib/mock-data";

export default function UsersPage() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const allRoles = Array.from(new Set(mockUsers.flatMap((u) => u.roles))).sort();

  const filtered = mockUsers.filter((u) => {
    const ms = u.full_name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()) || u.school_id.toLowerCase().includes(search.toLowerCase());
    if (roleFilter === "all") return ms;
    return ms && u.roles.includes(roleFilter);
  });

  return (
    <AnimatedPage>
      <PageHeader title="Users & Roles" description="Manage accounts, roles, and access across the platform" badge="Administration" action={
        <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#A93C40] text-white text-sm font-semibold hover:bg-[#A93C40]/90 transition-colors shadow-md shadow-[#A93C40]/20 cursor-pointer">
          <UserPlus className="w-4 h-4" /> Add User
        </button>
      } />

      <div className="flex flex-col sm:flex-row gap-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Search by name, email, or ID..." className="flex-1" />
        <SelectFilter value={roleFilter} onChange={setRoleFilter} options={[{ value: "all", label: "All Roles" }, ...allRoles.map(r => ({ value: r, label: r.replace("_", " ") }))]} />
      </div>

      <DataTable
        columns={[
          { key: "name", header: "Name", render: (u: any) => (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#A93C40]/10 to-[#d46a6e]/10 flex items-center justify-center"><User className="w-4 h-4 text-[#A93C40]" /></div>
              <span className="font-semibold text-[#1A2B4A]">{u.full_name}</span>
            </div>
          )},
          { key: "id", header: "School ID", render: (u: any) => <span className="text-[#6B7280] font-mono text-xs">{u.school_id}</span> },
          { key: "email", header: "Email", render: (u: any) => <span className="text-[#6B7280]">{u.email}</span> },
          { key: "year", header: "Year", render: (u: any) => <span className="text-[#1A2B4A]">{u.class_year || "—"}</span> },
          { key: "roles", header: "Roles", render: (u: any) => (
            <div className="flex flex-wrap gap-1">{u.roles.map((r: string) => <RoleBadge key={r} role={r} />)}</div>
          )},
          { key: "status", header: "Status", render: (u: any) => u.is_active ?
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active</span> :
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-gray-50 text-gray-700 border border-gray-200"><span className="w-1.5 h-1.5 rounded-full bg-gray-400" /> Inactive</span>
          },
          { key: "actions", header: "", render: (u: any) => (
            <div className="flex gap-2">
              <button className="p-2 rounded-lg text-[#6B7280] hover:text-[#A93C40] hover:bg-[#A93C40]/5 transition-colors cursor-pointer"><Edit3 className="w-4 h-4" /></button>
              <button className="p-2 rounded-lg text-[#6B7280] hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"><Trash2 className="w-4 h-4" /></button>
            </div>
          )},
        ]}
        data={filtered}
        keyExtractor={(u: any) => u.id}
      />
    </AnimatedPage>
  );
}