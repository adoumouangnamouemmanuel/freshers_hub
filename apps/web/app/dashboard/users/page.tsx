"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  UserPlus,
  Upload,
  Edit3,
  Trash2,
  ShieldCheck,
  X,
  Users as UsersIcon,
  ChevronDown,
  Search,
  Filter,
  MoreVertical,
  Mail,
  Phone,
  GraduationCap,
} from "lucide-react";
import {
  AnimatedPage,
  AnimatedSection,
} from "@/components/ui/animated-container";
import { PageHeader } from "@/components/ui/page-header";
import { SearchInput, SelectFilter } from "@/components/ui/search-input";
import { DataTable } from "@/components/ui/data-table";
import { RoleBadge } from "@/components/ui/status-badge";
import { mockUsers } from "@/lib/mock-data";

const AVATAR_PALETTE = ["#A93C40", "#1A2B4A", "#C89B3C", "#3E7C6B"];

function avatarColor(seed: string) {
  const hash = Array.from(seed).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return (
    (parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "")
  ).toUpperCase();
}

export default function UsersPage() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);

  const allRoles = useMemo(
    () => Array.from(new Set(mockUsers.flatMap((u) => u.roles))).sort(),
    [],
  );

  const roleCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const role of allRoles)
      counts[role] = mockUsers.filter((u) => u.roles.includes(role)).length;
    return counts;
  }, [allRoles]);

  const filtered = mockUsers.filter((u) => {
    const q = search.toLowerCase();
    const matchesSearch =
      u.full_name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.school_id.toLowerCase().includes(q);
    const matchesRole = roleFilter === "all" || u.roles.includes(roleFilter);
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" ? u.is_active : !u.is_active);
    return matchesSearch && matchesRole && matchesStatus;
  });

  const allVisibleSelected =
    filtered.length > 0 && filtered.every((u) => selected.has(u.id));

  function toggleAll() {
    setSelected((prev) => {
      if (allVisibleSelected) return new Set();
      return new Set(filtered.map((u) => u.id));
    });
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const activeFiltersCount = [roleFilter !== "all", statusFilter !== "all"].filter(Boolean).length;

  return (
    <AnimatedPage>
      <PageHeader
        title="Users & Roles"
        description="Manage accounts, roles, and access across the platform"
        badge="Administration"
        action={
          <div className="flex gap-3">
            <button className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-[#e5e1d8] px-4 py-2.5 text-sm font-semibold text-[#6B7280] transition-colors hover:bg-[#f8f4ef]">
              <Upload className="h-4 w-4" /> Import cohort
            </button>
            <button className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#A93C40] px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#A93C40]/20 transition-colors hover:bg-[#8f3236]">
              <UserPlus className="h-4 w-4" /> Add user
            </button>
          </div>
        }
      />

      {/* Stats Overview */}
      <AnimatedSection className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-[#eee8df] bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-[#6B7280]">Total Users</p>
          <p className="text-2xl font-bold text-[#1A2B4A]">{mockUsers.length}</p>
        </div>
        <div className="rounded-xl border border-[#eee8df] bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-[#6B7280]">Active</p>
          <p className="text-2xl font-bold text-emerald-600">
            {mockUsers.filter((u) => u.is_active).length}
          </p>
        </div>
        <div className="rounded-xl border border-[#eee8df] bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-[#6B7280]">Inactive</p>
          <p className="text-2xl font-bold text-gray-600">
            {mockUsers.filter((u) => !u.is_active).length}
          </p>
        </div>
        <div className="rounded-xl border border-[#eee8df] bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-[#6B7280]">Roles</p>
          <p className="text-2xl font-bold text-[#A93C40]">{allRoles.length}</p>
        </div>
      </AnimatedSection>

      {/* Advanced Filters Bar */}
      <AnimatedSection className="mb-6 rounded-2xl border border-[#eee8df] bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, or school ID..."
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
            value={roleFilter}
            onChange={setRoleFilter}
            options={[
              { value: "all", label: "All roles" },
              ...allRoles.map((r) => ({ value: r, label: r.replace("_", " ") })),
            ]}
          />
          <SelectFilter
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: "all", label: "All statuses" },
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
            ]}
          />
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="mt-4 flex flex-wrap gap-2 border-t border-[#f3f4f6] pt-4">
            <p className="text-xs font-semibold text-[#6B7280]">Quick filters:</p>
            {allRoles.map((role) => (
              <button
                key={role}
                onClick={() => setRoleFilter(role === roleFilter ? "all" : role)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                  roleFilter === role
                    ? "border-[#A93C40] bg-[#A93C40]/5 text-[#A93C40]"
                    : "border-[#e5e1d8] text-[#6B7280] hover:bg-[#f8f4ef]"
                }`}
              >
                {role.replace("_", " ")} · {roleCounts[role]}
              </button>
            ))}
          </div>
        )}
      </AnimatedSection>

      {/* Results Count */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-[#6B7280]">
          Showing <span className="font-semibold text-[#1A2B4A]">{filtered.length}</span> of{" "}
          <span className="font-semibold text-[#1A2B4A]">{mockUsers.length}</span> accounts
        </p>
        {selected.size > 0 && (
          <p className="text-sm text-[#A93C40]">
            {selected.size} selected
          </p>
        )}
      </div>

      {/* Users Table */}
      {filtered.length === 0 ? (
        <AnimatedSection className="rounded-2xl border border-dashed border-[#e5e1d8] bg-white p-12 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#f8f4ef]">
            <UsersIcon className="h-5 w-5 text-[#A93C40]" />
          </div>
          <p className="font-semibold text-[#1A2B4A]">No accounts match these filters</p>
          <p className="mt-1 text-sm text-[#6B7280]">
            Try a different search term, or clear the role and status filters.
          </p>
        </AnimatedSection>
      ) : (
        <AnimatedSection className="rounded-2xl border border-[#eee8df] bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#f3f4f6] bg-[#f8f4ef]/50">
                  <th className="p-4 text-left">
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={toggleAll}
                      aria-label="Select all visible users"
                      className="h-4 w-4 cursor-pointer rounded border-[#d8d2c5] accent-[#A93C40]"
                    />
                  </th>
                  <th className="p-4 text-left text-xs font-semibold uppercase tracking-wider text-[#6B7280]">Name</th>
                  <th className="p-4 text-left text-xs font-semibold uppercase tracking-wider text-[#6B7280]">School ID</th>
                  <th className="p-4 text-left text-xs font-semibold uppercase tracking-wider text-[#6B7280]">Email</th>
                  <th className="p-4 text-left text-xs font-semibold uppercase tracking-wider text-[#6B7280]">Year</th>
                  <th className="p-4 text-left text-xs font-semibold uppercase tracking-wider text-[#6B7280]">Roles</th>
                  <th className="p-4 text-left text-xs font-semibold uppercase tracking-wider text-[#6B7280]">Status</th>
                  <th className="p-4 text-right text-xs font-semibold uppercase tracking-wider text-[#6B7280]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f3f4f6]">
                {filtered.map((u, i) => (
                  <motion.tr
                    key={u.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="group hover:bg-[#f8f4ef]/30 transition-colors"
                  >
                    <td className="p-4">
                      <input
                        type="checkbox"
                        checked={selected.has(u.id)}
                        onChange={() => toggleOne(u.id)}
                        aria-label={`Select ${u.full_name}`}
                        className="h-4 w-4 cursor-pointer rounded border-[#d8d2c5] accent-[#A93C40]"
                      />
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                          style={{ backgroundColor: avatarColor(u.id ?? u.full_name) }}
                        >
                          {initials(u.full_name)}
                        </div>
                        <div>
                          <p className="font-semibold text-[#1A2B4A]">{u.full_name}</p>
                          {u.phone && (
                            <p className="flex items-center gap-1 text-xs text-[#9CA3AF]">
                              <Phone className="h-3 w-3" />
                              {u.phone}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="font-mono text-xs text-[#6B7280]">{u.school_id}</span>
                    </td>
                    <td className="p-4">
                      <a href={`mailto:${u.email}`} className="flex items-center gap-1.5 text-[#6B7280] hover:text-[#A93C40]">
                        <Mail className="h-3.5 w-3.5" />
                        {u.email}
                      </a>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 text-[#1A2B4A]">
                        <GraduationCap className="h-4 w-4 text-[#9CA3AF]" />
                        {u.class_year || "—"}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1">
                        {u.roles.map((r: string) => (
                          <RoleBadge key={r} role={r} />
                        ))}
                      </div>
                    </td>
                    <td className="p-4">
                      {u.is_active ? (
                        <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-semibold text-gray-700">
                          <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          aria-label={`Edit ${u.full_name}`}
                          className="cursor-pointer rounded-lg p-2 text-[#6B7280] transition-colors hover:bg-[#A93C40]/5 hover:text-[#A93C40]"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          aria-label={`Deactivate ${u.full_name}`}
                          className="cursor-pointer rounded-lg p-2 text-[#6B7280] transition-colors hover:bg-red-50 hover:text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </AnimatedSection>
      )}

      {/* Floating bulk-action bar */}
      {selected.size > 0 && (
        <div className="pointer-events-none fixed inset-x-0 bottom-6 z-20 flex justify-center px-4">
          <div className="pointer-events-auto flex items-center gap-4 rounded-2xl border border-[#eee8df] bg-[#1A2B4A] px-5 py-3 text-white shadow-xl">
            <span className="text-sm font-medium">{selected.size} selected</span>
            <div className="h-4 w-px bg-white/20" />
            <button className="inline-flex cursor-pointer items-center gap-1.5 text-sm font-medium hover:text-[#C89B3C]">
              <ShieldCheck className="h-4 w-4" /> Assign role
            </button>
            <button className="inline-flex cursor-pointer items-center gap-1.5 text-sm font-medium hover:text-red-300">
              <Trash2 className="h-4 w-4" /> Deactivate
            </button>
            <button
              onClick={() => setSelected(new Set())}
              aria-label="Clear selection"
              className="ml-1 cursor-pointer rounded-lg p-1 hover:bg-white/10"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </AnimatedPage>
  );
}