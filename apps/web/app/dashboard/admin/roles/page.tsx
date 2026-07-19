"use client";

import { useState } from "react";
import { Shield, UserPlus, Trash2, Edit3 } from "lucide-react";
import { AnimatedPage, AnimatedSection } from "@/components/ui/animated-container";
import { PageHeader } from "@/components/ui/page-header";
import { MiniStatCard } from "@/components/ui/card";
import { SearchInput } from "@/components/ui/search-input";
import { DataTable } from "@/components/ui/data-table";
import { RoleBadge } from "@/components/ui/status-badge";
import { mockUsers } from "@/lib/mock-data";

export default function RolesPage() {
  const [search, setSearch] = useState("");

  const allUsers = mockUsers.filter((u) =>
    u.full_name.toLowerCase().includes(search.toLowerCase())
  );

  const uniqueRoles = Array.from(new Set(mockUsers.flatMap((u) => u.roles)));

  const roleCounts = uniqueRoles.map((role) => ({
    role,
    count: mockUsers.filter((u) => u.roles.includes(role)).length,
  }));

  return (
    <AnimatedPage>
      <PageHeader
        title="Role Management"
        description="Manage user roles and permissions across the platform"
        badge="Super Admin"
      />

      <div className="grid gap-5 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
        {roleCounts.map((item) => (
          <MiniStatCard
            key={item.role}
            icon={Shield}
            value={item.count}
            label={item.role.replace("_", " ")}
          />
        ))}
      </div>

      <div className="flex gap-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search users to manage roles..."
          className="flex-1"
        />
        <button className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#A93C40] text-white text-sm font-semibold hover:bg-[#A93C40]/90 transition-colors shadow-md shadow-[#A93C40]/20 cursor-pointer">
          <UserPlus className="w-4 h-4" />
          Assign Role
        </button>
      </div>

      <DataTable
        columns={[
          { key: "name", header: "Name", render: (u: any) => <span className="font-semibold text-[#1A2B4A]">{u.full_name}</span> },
          { key: "email", header: "Email", render: (u: any) => <span className="text-[#6B7280]">{u.email}</span> },
          {
            key: "roles",
            header: "Roles",
            render: (u: any) => (
              <div className="flex flex-wrap gap-1">
                {u.roles.map((r: string) => (
                  <RoleBadge key={r} role={r} />
                ))}
              </div>
            ),
          },
          {
            key: "actions",
            header: "Actions",
            render: (u: any) => (
              <div className="flex gap-2">
                <button className="p-2 rounded-lg text-[#6B7280] hover:text-[#A93C40] hover:bg-[#A93C40]/5 transition-colors cursor-pointer">
                  <Edit3 className="w-4 h-4" />
                </button>
                <button className="p-2 rounded-lg text-[#6B7280] hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ),
          },
        ]}
        data={allUsers}
        keyExtractor={(u: any) => u.id}
      />
    </AnimatedPage>
  );
}