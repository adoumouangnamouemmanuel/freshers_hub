"use client";

import { useMemo, useState } from "react";
import {
  UserPlus,
  Upload,
  Edit3,
  Trash2,
  ShieldCheck,
  X,
  Users as UsersIcon,
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

/**
 * Same four-color unit accent system used on the Dashboard, repurposed
 * here as a deterministic avatar palette so a person's initials always
 * render in the same color across the whole portal — one identity
 * system, not a new one per screen.
 */
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

      {/* Role distribution — an at-a-glance census, not decoration: it's the
          real shape of who's on the platform, and doubles as one-click filters. */}
      <AnimatedSection className="rounded-2xl border border-[#eee8df] bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <UsersIcon className="h-4 w-4 text-[#A93C40]" />
          <p className="text-sm font-semibold text-[#1A2B4A]">
            {mockUsers.length} accounts this cycle
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setRoleFilter("all")}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              roleFilter === "all"
                ? "border-[#A93C40] bg-[#A93C40]/5 text-[#A93C40]"
                : "border-[#e5e1d8] text-[#6B7280] hover:bg-[#f8f4ef]"
            }`}
          >
            All &middot; {mockUsers.length}
          </button>
          {allRoles.map((role) => (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                roleFilter === role
                  ? "border-[#A93C40] bg-[#A93C40]/5 text-[#A93C40]"
                  : "border-[#e5e1d8] text-[#6B7280] hover:bg-[#f8f4ef]"
              }`}
            >
              {role.replace("_", " ")} &middot; {roleCounts[role]}
            </button>
          ))}
        </div>
      </AnimatedSection>

      <div className="flex flex-col gap-4 sm:flex-row">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by name, email, or ID..."
          className="flex-1"
        />
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

      <p className="text-xs text-[#9CA3AF]">
        Showing {filtered.length} of {mockUsers.length} accounts
      </p>

      {filtered.length === 0 ? (
        <AnimatedSection className="rounded-2xl border border-dashed border-[#e5e1d8] bg-white p-12 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#f8f4ef]">
            <UsersIcon className="h-5 w-5 text-[#A93C40]" />
          </div>
          <p className="font-semibold text-[#1A2B4A]">
            No accounts match these filters
          </p>
          <p className="mt-1 text-sm text-[#6B7280]">
            Try a different search term, or clear the role and status filters.
          </p>
        </AnimatedSection>
      ) : (
        <DataTable
          columns={[
            {
              key: "select",
              header: (
                <input
                  type="checkbox"
                  checked={allVisibleSelected}
                  onChange={toggleAll}
                  aria-label="Select all visible users"
                  className="h-4 w-4 cursor-pointer rounded border-[#d8d2c5] accent-[#A93C40]"
                />
              ) as unknown as string,
              render: (u: any) => (
                <input
                  type="checkbox"
                  checked={selected.has(u.id)}
                  onChange={() => toggleOne(u.id)}
                  aria-label={`Select ${u.full_name}`}
                  className="h-4 w-4 cursor-pointer rounded border-[#d8d2c5] accent-[#A93C40]"
                />
              ),
            },
            {
              key: "name",
              header: "Name",
              render: (u: any) => (
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                    style={{
                      backgroundColor: avatarColor(u.id ?? u.full_name),
                    }}
                  >
                    {initials(u.full_name)}
                  </div>
                  <span className="font-semibold text-[#1A2B4A]">
                    {u.full_name}
                  </span>
                </div>
              ),
            },
            {
              key: "id",
              header: "School ID",
              render: (u: any) => (
                <span className="font-mono text-xs text-[#6B7280]">
                  {u.school_id}
                </span>
              ),
            },
            {
              key: "email",
              header: "Email",
              render: (u: any) => (
                <span className="text-[#6B7280]">{u.email}</span>
              ),
            },
            {
              key: "year",
              header: "Year",
              render: (u: any) => (
                <span className="text-[#1A2B4A]">{u.class_year || "—"}</span>
              ),
            },
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
              key: "status",
              header: "Status",
              render: (u: any) =>
                u.is_active ? (
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />{" "}
                    Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-semibold text-gray-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />{" "}
                    Inactive
                  </span>
                ),
            },
            {
              key: "actions",
              header: "",
              render: (u: any) => (
                <div className="flex gap-2">
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
              ),
            },
          ]}
          data={filtered}
          keyExtractor={(u: any) => u.id}
        />
      )}

      {/* Floating bulk-action bar — only appears once something is selected,
          so the default table stays quiet and this never competes for attention. */}
      {selected.size > 0 && (
        <div className="pointer-events-none fixed inset-x-0 bottom-6 z-20 flex justify-center px-4">
          <div className="pointer-events-auto flex items-center gap-4 rounded-2xl border border-[#eee8df] bg-[#1A2B4A] px-5 py-3 text-white shadow-xl">
            <span className="text-sm font-medium">
              {selected.size} selected
            </span>
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
