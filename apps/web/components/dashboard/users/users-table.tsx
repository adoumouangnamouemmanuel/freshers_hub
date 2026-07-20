"use client";

import { motion } from "framer-motion";
import { Users as UsersIcon, Mail, Phone, GraduationCap, Edit3, Trash2, Eye } from "lucide-react";
import { RoleBadge } from "@/components/ui/status-badge";
import { AnimatedSection } from "@/components/ui/animated-container";

const AVATAR_PALETTE = ["#A93C40", "#1A2B4A", "#C89B3C", "#3E7C6B"];

function avatarColor(seed: string) {
  const hash = Array.from(seed).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "")).toUpperCase();
}

interface UsersTableProps {
  users: any[];
  selected: Set<string>;
  toggleOne: (id: string) => void;
  toggleAll: () => void;
  allVisibleSelected: boolean;
  onDeactivateUser: (id: string) => void;
  onEditUser: (user: any) => void;
  onViewUser: (user: any) => void;
}

export function UsersTable({
  users,
  selected,
  toggleOne,
  toggleAll,
  allVisibleSelected,
  onDeactivateUser,
  onEditUser,
  onViewUser,
}: UsersTableProps) {
  if (users.length === 0) {
    return (
      <AnimatedSection className="rounded-2xl border border-dashed border-[#e5e1d8] bg-white p-12 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#f8f4ef]">
          <UsersIcon className="h-5 w-5 text-[#A93C40]" />
        </div>
        <p className="font-semibold text-[#1A2B4A]">No accounts found</p>
        <p className="mt-1 text-sm text-[#6B7280]">
          Try a different search term, or clear your filters.
        </p>
      </AnimatedSection>
    );
  }

  return (
    <AnimatedSection className="rounded-2xl border border-[#eee8df] bg-white/70 shadow-sm overflow-hidden backdrop-blur-md">
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
              <th className="p-4 text-left text-xs font-semibold uppercase tracking-wider text-[#6B7280]">Email</th>
              <th className="p-4 text-left text-xs font-semibold uppercase tracking-wider text-[#6B7280]">Year</th>
              <th className="p-4 text-left text-xs font-semibold uppercase tracking-wider text-[#6B7280]">Roles</th>
              <th className="p-4 text-left text-xs font-semibold uppercase tracking-wider text-[#6B7280]">Status</th>
              <th className="p-4 text-right text-xs font-semibold uppercase tracking-wider text-[#6B7280]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f3f4f6]">
            {users.map((u, i) => (
              <motion.tr
                key={u.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="group hover:bg-[#f8f4ef]/50 transition-colors"
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
                    {u.roles?.length ? (
                      u.roles.map((r: string) => (
                        <RoleBadge key={r} role={r} />
                      ))
                    ) : (
                      <span className="text-xs text-gray-400">None</span>
                    )}
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
                      onClick={() => onViewUser(u)}
                      aria-label={`View ${u.full_name}`}
                      className="cursor-pointer rounded-lg p-2 text-[#6B7280] transition-colors hover:bg-blue-50 hover:text-blue-600"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onEditUser(u)}
                      aria-label={`Edit ${u.full_name}`}
                      className="cursor-pointer rounded-lg p-2 text-[#6B7280] transition-colors hover:bg-[#A93C40]/5 hover:text-[#A93C40]"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onDeactivateUser(u.id)}
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
  );
}
