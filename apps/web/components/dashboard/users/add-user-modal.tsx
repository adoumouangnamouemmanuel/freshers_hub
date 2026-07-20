"use client";

import { useState, useTransition } from "react";
import { X, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createUserAction } from "@/app/actions/users";

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  allRoles?: { id: string; name: string }[];
}

export function AddUserModal({ isOpen, onClose, onSuccess, allRoles = [] }: AddUserModalProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data = {
      full_name: (formData.get("full_name") as string) || undefined,
      email: (formData.get("email") as string) || undefined,
      school_id: (formData.get("school_id") as string) || undefined,
      role_id: (formData.get("role_id") as string) || undefined,
      phone: (formData.get("phone") as string) || undefined,
      major: (formData.get("major") as string) || undefined,
      class_year: formData.get("class_year") ? parseInt(formData.get("class_year") as string) : undefined,
      country: (formData.get("country") as string) || undefined,
      is_active: formData.get("is_active") === "on",
    };

    // Remove undefined fields
    Object.keys(data).forEach(key => (data as any)[key] === undefined && delete (data as any)[key]);

    startTransition(async () => {
      try {
        await createUserAction(data);
        onSuccess();
        onClose();
      } catch (err: any) {
        setError(err.message || "Failed to create user");
      }
    });
  }

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
            <h2 className="text-lg font-semibold text-[#1A2B4A]">Add New User</h2>
            <button onClick={onClose} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100">
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="mb-1 block text-sm font-medium text-[#1A2B4A]">Full Name *</label>
                <input required name="full_name" type="text" className="w-full rounded-xl border border-[#e5e1d8] px-4 py-2 focus:border-[#A93C40] focus:outline-none focus:ring-1 focus:ring-[#A93C40]" />
              </div>

              <div className="col-span-2 sm:col-span-1">
                <label className="mb-1 block text-sm font-medium text-[#1A2B4A]">Email *</label>
                <input required name="email" type="email" className="w-full rounded-xl border border-[#e5e1d8] px-4 py-2 focus:border-[#A93C40] focus:outline-none focus:ring-1 focus:ring-[#A93C40]" />
              </div>

              <div className="col-span-2 sm:col-span-1">
                <label className="mb-1 block text-sm font-medium text-[#1A2B4A]">Role</label>
                <select name="role_id" className="w-full rounded-xl border border-[#e5e1d8] px-4 py-2 focus:border-[#A93C40] focus:outline-none focus:ring-1 focus:ring-[#A93C40]">
                  <option value="">None / Student</option>
                  {allRoles.map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>

              <div className="col-span-2 sm:col-span-1">
                <label className="mb-1 block text-sm font-medium text-[#1A2B4A]">School ID</label>
                <input name="school_id" type="text" className="w-full rounded-xl border border-[#e5e1d8] px-4 py-2 focus:border-[#A93C40] focus:outline-none focus:ring-1 focus:ring-[#A93C40]" />
              </div>

              <div className="col-span-2 sm:col-span-1">
                <label className="mb-1 block text-sm font-medium text-[#1A2B4A]">Phone</label>
                <input name="phone" type="text" className="w-full rounded-xl border border-[#e5e1d8] px-4 py-2 focus:border-[#A93C40] focus:outline-none focus:ring-1 focus:ring-[#A93C40]" />
              </div>

              <div className="col-span-2 sm:col-span-1">
                <label className="mb-1 block text-sm font-medium text-[#1A2B4A]">Major</label>
                <input name="major" type="text" className="w-full rounded-xl border border-[#e5e1d8] px-4 py-2 focus:border-[#A93C40] focus:outline-none focus:ring-1 focus:ring-[#A93C40]" />
              </div>

              <div className="col-span-2 sm:col-span-1">
                <label className="mb-1 block text-sm font-medium text-[#1A2B4A]">Class Year</label>
                <input name="class_year" type="number" className="w-full rounded-xl border border-[#e5e1d8] px-4 py-2 focus:border-[#A93C40] focus:outline-none focus:ring-1 focus:ring-[#A93C40]" />
              </div>

              <div className="col-span-2">
                <label className="mb-1 block text-sm font-medium text-[#1A2B4A]">Country</label>
                <input name="country" type="text" className="w-full rounded-xl border border-[#e5e1d8] px-4 py-2 focus:border-[#A93C40] focus:outline-none focus:ring-1 focus:ring-[#A93C40]" />
              </div>

              <div className="col-span-2 mt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input defaultChecked name="is_active" type="checkbox" className="h-4 w-4 rounded border-[#d8d2c5] accent-[#A93C40]" />
                  <span className="text-sm font-medium text-[#1A2B4A]">Active Account</span>
                </label>
              </div>
            </div>

            {error && <p className="mt-4 text-sm text-red-500">{error}</p>}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="cursor-pointer rounded-xl px-4 py-2 font-semibold text-[#6B7280] hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#A93C40] px-4 py-2 font-semibold text-white transition-colors hover:bg-[#8f3236] disabled:opacity-50"
              >
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create User"}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
