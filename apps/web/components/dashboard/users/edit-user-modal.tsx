"use client";

import { useState, useTransition, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { updateUserAction } from "@/app/actions/users";

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user: any;
}

export function EditUserModal({ isOpen, onClose, onSuccess, user }: EditUserModalProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  if (!isOpen || !user) return null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    const formData = new FormData(e.currentTarget);
    const data = {
      full_name: formData.get("full_name") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      major: formData.get("major") as string,
      class_year: formData.get("class_year") ? parseInt(formData.get("class_year") as string) : null,
      country: formData.get("country") as string,
      is_active: formData.get("is_active") === "on",
    };

    startTransition(async () => {
      try {
        const res = await updateUserAction(user.id, data);
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || "Failed to update user");
        }
        onSuccess();
        onClose();
      } catch (err: any) {
        setError(err.message || "Failed to update user");
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
            <h2 className="text-lg font-semibold text-[#1A2B4A]">Edit User</h2>
            <button onClick={onClose} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100">
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="mb-1 block text-sm font-medium text-[#1A2B4A]">Full Name *</label>
                <input defaultValue={user.full_name} required name="full_name" type="text" className="w-full rounded-xl border border-[#e5e1d8] px-4 py-2 focus:border-[#A93C40] focus:outline-none focus:ring-1 focus:ring-[#A93C40]" />
              </div>

              <div className="col-span-2 sm:col-span-1">
                <label className="mb-1 block text-sm font-medium text-[#1A2B4A]">Email</label>
                <input defaultValue={user.email} name="email" type="email" className="w-full rounded-xl border border-[#e5e1d8] px-4 py-2 focus:border-[#A93C40] focus:outline-none focus:ring-1 focus:ring-[#A93C40]" />
              </div>

              <div className="col-span-2 sm:col-span-1">
                <label className="mb-1 block text-sm font-medium text-[#1A2B4A]">Phone</label>
                <input defaultValue={user.phone} name="phone" type="text" className="w-full rounded-xl border border-[#e5e1d8] px-4 py-2 focus:border-[#A93C40] focus:outline-none focus:ring-1 focus:ring-[#A93C40]" />
              </div>

              <div className="col-span-2 sm:col-span-1">
                <label className="mb-1 block text-sm font-medium text-[#1A2B4A]">Major</label>
                <input defaultValue={user.major} name="major" type="text" className="w-full rounded-xl border border-[#e5e1d8] px-4 py-2 focus:border-[#A93C40] focus:outline-none focus:ring-1 focus:ring-[#A93C40]" />
              </div>

              <div className="col-span-2 sm:col-span-1">
                <label className="mb-1 block text-sm font-medium text-[#1A2B4A]">Class Year</label>
                <input defaultValue={user.class_year} name="class_year" type="number" className="w-full rounded-xl border border-[#e5e1d8] px-4 py-2 focus:border-[#A93C40] focus:outline-none focus:ring-1 focus:ring-[#A93C40]" />
              </div>

              <div className="col-span-2">
                <label className="mb-1 block text-sm font-medium text-[#1A2B4A]">Country</label>
                <input defaultValue={user.country} name="country" type="text" className="w-full rounded-xl border border-[#e5e1d8] px-4 py-2 focus:border-[#A93C40] focus:outline-none focus:ring-1 focus:ring-[#A93C40]" />
              </div>

              <div className="col-span-2 mt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input defaultChecked={user.is_active} name="is_active" type="checkbox" className="h-4 w-4 rounded border-[#d8d2c5] accent-[#A93C40]" />
                  <span className="text-sm font-medium text-[#1A2B4A]">Active Account</span>
                </label>
              </div>
            </div>

            {error && <p className="mt-4 text-sm text-red-500">{error}</p>}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl px-4 py-2 font-semibold text-[#6B7280] hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#A93C40] px-4 py-2 font-semibold text-white transition-colors hover:bg-[#8f3236] disabled:opacity-50"
              >
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
