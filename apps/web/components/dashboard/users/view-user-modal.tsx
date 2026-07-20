"use client";

import { X, Mail, Phone, GraduationCap, MapPin, Calendar, Briefcase, Layers } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { RoleBadge } from "@/components/ui/status-badge";

interface ViewUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
}

const AVATAR_PALETTE = ["#A93C40", "#1A2B4A", "#C89B3C", "#3E7C6B"];

function avatarColor(seed: string) {
  const hash = Array.from(seed).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "")).toUpperCase();
}

export function ViewUserModal({ isOpen, onClose, user }: ViewUserModalProps) {
  if (!isOpen || !user) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A2B4A]/20 p-4 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
        >
          <div className="flex items-center justify-between border-b border-[#f3f4f6] px-6 py-4">
            <h2 className="text-lg font-semibold text-[#1A2B4A]">User Details</h2>
            <button onClick={onClose} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-6">
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-[#f3f4f6]">
              <div
                className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-xl font-bold text-white shadow-sm"
                style={{ backgroundColor: avatarColor(user.id ?? user.full_name) }}
              >
                {initials(user.full_name)}
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#1A2B4A]">{user.full_name}</h3>
                <div className="mt-1 flex items-center gap-2">
                  {user.is_active ? (
                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs font-semibold text-gray-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
                      Inactive
                    </span>
                  )}
                  {user.roles?.map((r: string) => (
                    <RoleBadge key={r} role={r} />
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-y-6 gap-x-4">
              <div>
                <p className="flex items-center gap-1.5 text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-1">
                  <Mail className="h-3.5 w-3.5" />
                  Email
                </p>
                <p className="text-sm font-medium text-[#1A2B4A] truncate">
                  {user.email || "—"}
                </p>
              </div>

              <div>
                <p className="flex items-center gap-1.5 text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-1">
                  <Phone className="h-3.5 w-3.5" />
                  Phone
                </p>
                <p className="text-sm font-medium text-[#1A2B4A]">
                  {user.phone || "—"}
                </p>
              </div>

              <div>
                <p className="flex items-center gap-1.5 text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-1">
                  <GraduationCap className="h-3.5 w-3.5" />
                  Class Year
                </p>
                <p className="text-sm font-medium text-[#1A2B4A]">
                  {user.class_year || "—"}
                </p>
              </div>

              <div>
                <p className="flex items-center gap-1.5 text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-1">
                  <Briefcase className="h-3.5 w-3.5" />
                  Major
                </p>
                <p className="text-sm font-medium text-[#1A2B4A]">
                  {user.major || "—"}
                </p>
              </div>

              <div>
                <p className="flex items-center gap-1.5 text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-1">
                  <MapPin className="h-3.5 w-3.5" />
                  Country
                </p>
                <p className="text-sm font-medium text-[#1A2B4A]">
                  {user.country || "—"}
                </p>
              </div>

              <div>
                <p className="flex items-center gap-1.5 text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-1">
                  <Layers className="h-3.5 w-3.5" />
                  Units
                </p>
                <div className="flex flex-wrap gap-1">
                  {user.units?.length > 0 ? (
                    user.units.map((unit: string, idx: number) => (
                      <span key={idx} className="inline-block rounded-md bg-[#f3f4f6] px-2 py-0.5 text-xs font-medium text-[#4B5563]">
                        {unit}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm font-medium text-[#9CA3AF]">None</span>
                  )}
                </div>
              </div>
              
              <div className="col-span-2">
                <p className="flex items-center gap-1.5 text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-1">
                  <Calendar className="h-3.5 w-3.5" />
                  Joined Date
                </p>
                <p className="text-sm font-medium text-[#1A2B4A]">
                  {user.created_at ? new Date(user.created_at).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }) : "—"}
                </p>
              </div>
            </div>
          </div>
          <div className="border-t border-[#f3f4f6] bg-[#f8f4ef]/50 px-6 py-4 flex justify-end">
            <button
              onClick={onClose}
              className="rounded-xl border border-[#e5e1d8] bg-white px-5 py-2 text-sm font-semibold text-[#6B7280] shadow-sm transition-colors hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
