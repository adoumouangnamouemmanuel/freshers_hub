"use client";

import { useState, useEffect } from "react";
import { X, Loader2, Edit3, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { updateClubAction, deleteClubAction } from "@/app/actions/clubs";

interface EditClubModalProps {
  club: any;
  isOpen: boolean;
  onClose: () => void;
  allUsers: any[];
  onSuccess: () => void;
}

export function EditClubModal({ club, isOpen, onClose, allUsers, onSuccess }: EditClubModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [leadUserId, setLeadUserId] = useState("");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (club) {
      setName(club.name || "");
      setDescription(club.description || "");
      setCategory(club.category || "");
      setLeadUserId(club.lead_id || club.lead_user_id || "");
      setIsActive(club.is_active ?? true);
      setError("");
    }
  }, [club]);

  if (!isOpen || !club) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await updateClubAction(club.id, {
        name,
        description,
        category: category || undefined,
        leadUserId: leadUserId || undefined,
        is_active: isActive,
      });
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Failed to update club");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to deactivate/delete this club?")) return;
    
    setError("");
    setIsDeleting(true);

    try {
      await deleteClubAction(club.id);
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Failed to delete club");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-[#e5e1d8]"
        >
          <div className="px-6 py-4 border-b border-[#e5e1d8] flex justify-between items-center bg-gray-50/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                <Edit3 className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-[#1A2B4A]">Edit Club</h2>
            </div>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            {error && (
              <div className="mb-6 p-3 bg-red-50 text-red-600 text-sm font-medium rounded-xl border border-red-100">
                {error}
              </div>
            )}

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Club Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-[#e5e1d8] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#A93C40]/20 focus:border-[#A93C40] transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-[#e5e1d8] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#A93C40]/20 focus:border-[#A93C40] transition-all"
                >
                  <option value="">Select a category</option>
                  <option value="Sports">Sports</option>
                  <option value="Culture">Culture</option>
                  <option value="Academic">Academic</option>
                  <option value="Faith">Faith</option>
                  <option value="Hobby">Hobby</option>
                  <option value="Technology">Technology</option>
                  <option value="Arts">Arts</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lead User</label>
                <select
                  value={leadUserId}
                  onChange={(e) => setLeadUserId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-[#e5e1d8] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#A93C40]/20 focus:border-[#A93C40] transition-all"
                >
                  <option value="">None (Unassigned)</option>
                  {allUsers.map((u: any) => (
                    <option key={u.id} value={u.id}>{u.full_name} ({u.email})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-[#e5e1d8] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#A93C40]/20 focus:border-[#A93C40] transition-all resize-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 text-[#A93C40] border-gray-300 rounded focus:ring-[#A93C40]"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700">Active Club</label>
              </div>
            </div>

            <div className="mt-8 flex justify-between items-center">
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting || isSubmitting}
                className="cursor-pointer p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors disabled:opacity-50"
                title="Delete Club"
              >
                {isDeleting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
              </button>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="cursor-pointer px-5 py-2.5 text-sm font-medium text-gray-600 bg-white border border-[#e5e1d8] rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || isDeleting}
                  className="cursor-pointer px-5 py-2.5 text-sm font-medium text-white bg-[#A93C40] rounded-xl hover:bg-[#8B3135] transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center min-w-[120px]"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
                </button>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
