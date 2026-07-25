"use client";

import { useState } from "react";
import { X, Loader2, Building2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClubAction } from "@/app/actions/clubs";

interface AddClubModalProps {
  isOpen: boolean;
  onClose: () => void;
  allUsers: any[];
  onSuccess: () => void;
}

export function AddClubModal({ isOpen, onClose, allUsers, onSuccess }: AddClubModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [leadUserId, setLeadUserId] = useState("");

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      let image_url = "";
      let cover_image = "";

      if (logoFile) {
        const logoData = new FormData();
        logoData.append("image", logoFile);
        logoData.append("type", "logo");
        // We need to import uploadClubImageAction at the top
        const logoRes = await import("@/app/actions/clubs").then(m => m.uploadClubImageAction(logoData));
        // Store relative path so mobile can prefix with its own API base URL
        image_url = logoRes.path || logoRes.url;
      }

      if (coverFile) {
        const coverData = new FormData();
        coverData.append("image", coverFile);
        coverData.append("type", "cover");
        const coverRes = await import("@/app/actions/clubs").then(m => m.uploadClubImageAction(coverData));
        // Store relative path so mobile can prefix with its own API base URL
        cover_image = coverRes.path || coverRes.url;
      }

      await createClubAction({
        name,
        description,
        category: category || undefined,
        leadUserId: leadUserId || undefined,
        image_url: image_url || undefined,
        cover_image: cover_image || undefined,
      });
      onSuccess();
      setName("");
      setDescription("");
      setCategory("");
      setLeadUserId("");
      setLogoFile(null);
      setCoverFile(null);
    } catch (err: any) {
      setError(err.message || "Failed to create club");
    } finally {
      setIsSubmitting(false);
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
              <div className="w-10 h-10 rounded-xl bg-[#A93C40]/10 flex items-center justify-center text-[#A93C40]">
                <Building2 className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-[#1A2B4A]">Add New Club</h2>
            </div>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 max-h-[75vh] overflow-y-auto">
            {error && (
              <div className="mb-6 p-3 bg-red-50 text-red-600 text-sm font-medium rounded-xl border border-red-100">
                {error}
              </div>
            )}

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Club Logo (Square)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-[#A93C40]/10 file:text-[#A93C40] hover:file:bg-[#A93C40]/20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cover Image (Wide Banner)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-[#A93C40]/10 file:text-[#A93C40] hover:file:bg-[#A93C40]/20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Club Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-[#e5e1d8] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#A93C40]/20 focus:border-[#A93C40] transition-all"
                  placeholder="e.g. Debate Club"
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
                  placeholder="Describe the club's purpose and activities..."
                />
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-[#e5e1d8]">
              <button
                type="button"
                onClick={onClose}
                className="cursor-pointer px-5 py-2.5 text-sm font-medium text-gray-600 bg-white border border-[#e5e1d8] rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="cursor-pointer px-5 py-2.5 text-sm font-medium text-white bg-[#A93C40] rounded-xl hover:bg-[#8B3135] transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center min-w-[120px]"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Club"}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
