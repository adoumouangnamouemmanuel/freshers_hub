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
  allRoles?: { id: string; name: string }[];
}

export function EditUserModal({ isOpen, onClose, onSuccess, user, allRoles = [] }: EditUserModalProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [isRolesOpen, setIsRolesOpen] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      const currentRoleIds = user.roles?.length 
        ? allRoles.filter(r => user.roles.includes(r.name)).map(r => r.id.toString()) 
        : [];
      setSelectedRoles(currentRoleIds);
    }
  }, [isOpen, user, allRoles]);

  function toggleRole(id: string) {
    setSelectedRoles(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  if (!isOpen || !user) return null;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data = {
      full_name: (formData.get("full_name") as string) || undefined,
      email: (formData.get("email") as string) || undefined,
      school_id: (formData.get("school_id") as string) || undefined,
      role_ids: formData.getAll("role_ids") as string[],
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
        await updateUserAction(user.id, data);
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
          className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl flex flex-col max-h-[90vh]"
        >
          <div className="flex items-center justify-between border-b border-[#f3f4f6] px-6 py-4">
            <h2 className="text-lg font-semibold text-[#1A2B4A]">Edit User</h2>
            <button onClick={onClose} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100">
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="mb-1 block text-sm font-medium text-[#1A2B4A]">Full Name *</label>
                <input defaultValue={user.full_name} required name="full_name" type="text" className="w-full rounded-xl border border-[#e5e1d8] px-4 py-2 focus:border-[#A93C40] focus:outline-none focus:ring-1 focus:ring-[#A93C40]" />
              </div>

              <div className="col-span-2 sm:col-span-1">
                <label className="mb-1 block text-sm font-medium text-[#1A2B4A]">Email *</label>
                <input defaultValue={user.email} required name="email" type="email" className="w-full rounded-xl border border-[#e5e1d8] px-4 py-2 focus:border-[#A93C40] focus:outline-none focus:ring-1 focus:ring-[#A93C40]" />
              </div>

              <div className="col-span-2 sm:col-span-1 relative">
                <label className="mb-1 block text-sm font-medium text-[#1A2B4A]">Roles</label>
                <div 
                  className="w-full rounded-xl border border-[#e5e1d8] px-4 py-2 bg-white cursor-pointer flex justify-between items-center"
                  onClick={() => setIsRolesOpen(!isRolesOpen)}
                >
                  <span className={selectedRoles.length ? "text-black" : "text-gray-400 text-sm"}>
                    {selectedRoles.length ? `${selectedRoles.length} selected` : "Select roles..."}
                  </span>
                  <span className="text-gray-400 text-xs">▼</span>
                </div>
                
                {isRolesOpen && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-[#e5e1d8] rounded-xl shadow-lg max-h-48 overflow-y-auto p-2">
                    {allRoles.length === 0 && <div className="p-2 text-sm text-gray-400">No roles available</div>}
                    {allRoles.map(r => (
                      <label key={r.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={selectedRoles.includes(r.id.toString())} 
                          onChange={() => toggleRole(r.id.toString())}
                          className="h-4 w-4 rounded border-[#d8d2c5] accent-[#A93C40]" 
                        />
                        <span className="text-sm font-medium text-[#1A2B4A]">{r.name}</span>
                      </label>
                    ))}
                  </div>
                )}
                {selectedRoles.map(id => (
                  <input key={id} type="hidden" name="role_ids" value={id} />
                ))}
              </div>

              <div className="col-span-2 sm:col-span-1">
                <label className="mb-1 block text-sm font-medium text-[#1A2B4A]">School ID</label>
                <input defaultValue={user.school_id} name="school_id" type="text" className="w-full rounded-xl border border-[#e5e1d8] px-4 py-2 focus:border-[#A93C40] focus:outline-none focus:ring-1 focus:ring-[#A93C40]" />
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
                className="cursor-pointer rounded-xl px-4 py-2 font-semibold text-[#6B7280] hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#A93C40] px-4 py-2 font-semibold text-white transition-colors hover:bg-[#8f3236] disabled:opacity-50"
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
