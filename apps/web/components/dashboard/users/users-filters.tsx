"use client";

import { Search, Filter } from "lucide-react";
import { SelectFilter } from "@/components/ui/search-input";

interface UsersFiltersProps {
  search: string;
  setSearch: (val: string) => void;
  roleFilter: string;
  setRoleFilter: (val: string) => void;
  statusFilter: string;
  setStatusFilter: (val: string) => void;
  classYearFilter: string;
  setClassYearFilter: (val: string) => void;
  allRoles: { id: string; name: string }[];
  showFilters: boolean;
  setShowFilters: (val: boolean) => void;
}

export function UsersFilters({
  search,
  setSearch,
  roleFilter,
  setRoleFilter,
  statusFilter,
  setStatusFilter,
  classYearFilter,
  setClassYearFilter,
  allRoles,
  showFilters,
  setShowFilters,
}: UsersFiltersProps) {
  const activeFiltersCount = [roleFilter !== "all", statusFilter !== "all", classYearFilter !== ""].filter(Boolean).length;

  const currentYear = new Date().getFullYear();
  const yearOptions = [
    { value: "", label: "All class years" },
    ...Array.from({ length: 6 }, (_, i) => {
      const year = currentYear + i - 1; // E.g. last year, this year, next 4 years
      return { value: String(year), label: `Class of ${year}` };
    })
  ];

  return (
    <div className="mb-6 rounded-2xl border border-[#eee8df] bg-white/70 p-4 shadow-sm backdrop-blur-md">
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
            ...allRoles.map((r) => ({ value: r.name, label: r.name.replace("_", " ") })),
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
        <SelectFilter
          value={classYearFilter}
          onChange={setClassYearFilter}
          options={yearOptions}
        />
      </div>

      {showFilters && (
        <div className="mt-4 flex flex-wrap gap-2 border-t border-[#f3f4f6] pt-4">
          <p className="text-xs font-semibold text-[#6B7280] flex items-center">Quick filters:</p>
          {allRoles.map((role) => (
            <button
              key={role.id}
              onClick={() => setRoleFilter(role.name === roleFilter ? "all" : role.name)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                roleFilter === role.name
                  ? "border-[#A93C40] bg-[#A93C40]/5 text-[#A93C40]"
                  : "border-[#e5e1d8] text-[#6B7280] hover:bg-[#f8f4ef]"
              }`}
            >
              {role.name.replace("_", " ")}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
