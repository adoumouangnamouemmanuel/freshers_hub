import { motion, AnimatePresence } from "framer-motion";
import { X, Users, MapPin, Calendar, ExternalLink, Mail, Trash2, Edit3, ShieldAlert, BadgeCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { getClubMembersAction } from "@/app/actions/clubs";

interface ClubDetailsDrawerProps {
  club: any;
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
}

export function ClubDetailsDrawer({ club, isOpen, onClose, onEdit }: ClubDetailsDrawerProps) {
  const [members, setMembers] = useState<any[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  useEffect(() => {
    if (isOpen && club?.id) {
      setLoadingMembers(true);
      getClubMembersAction(club.id, { pageSize: 5 })
        .then(res => setMembers(res.data || []))
        .catch(console.error)
        .finally(() => setLoadingMembers(false));
    }
  }, [isOpen, club?.id]);

  if (!isOpen || !club) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/30 backdrop-blur-sm cursor-pointer"
          onClick={onClose}
        />

        {/* Drawer */}
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="relative w-full max-w-md bg-[#fdfbf7] h-full shadow-2xl flex flex-col border-l border-[#e5e1d8]"
        >
          {/* Header Image/Cover */}
          <div className="h-48 relative shrink-0">
            {club.cover_image ? (
              <img src={club.cover_image} alt="Cover" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[#1A2B4A] to-[#A93C40]" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-md transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="absolute -bottom-10 left-6">
              <div className="w-20 h-20 rounded-2xl bg-white p-1 shadow-lg border border-gray-100">
                {club.image_url ? (
                  <img src={club.image_url} alt="Logo" className="w-full h-full rounded-xl object-cover" />
                ) : (
                  <div className="w-full h-full rounded-xl bg-gradient-to-br from-[#1A2B4A] to-[#33507f] flex items-center justify-center text-2xl font-bold text-white shadow-inner">
                    {club.name?.substring(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto pt-14 pb-8 px-6 no-scrollbar">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-[#1A2B4A] mb-1">{club.name}</h2>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 bg-[#A93C40]/10 text-[#A93C40] text-xs font-semibold uppercase tracking-wider rounded-lg">
                    {club.category || "General"}
                  </span>
                  {club.is_active ? (
                    <span className="flex items-center gap-1 text-xs font-medium text-green-600">
                      <BadgeCheck className="w-3.5 h-3.5" /> Active
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-medium text-gray-500">
                      <ShieldAlert className="w-3.5 h-3.5" /> Inactive
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={onEdit}
                className="p-2 text-gray-400 hover:text-[#A93C40] hover:bg-[#A93C40]/10 rounded-xl transition-colors cursor-pointer"
              >
                <Edit3 className="w-5 h-5" />
              </button>
            </div>

            <p className="text-gray-600 text-sm leading-relaxed mb-8">
              {club.description || "No description provided for this club. Add a description to help students understand what this club is about."}
            </p>

            <div className="space-y-6">
              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white p-4 rounded-2xl border border-[#e5e1d8] shadow-sm flex flex-col items-center justify-center text-center">
                  <Users className="w-5 h-5 text-blue-500 mb-2" />
                  <p className="text-2xl font-bold text-[#1A2B4A]">{club.memberCount || 0}</p>
                  <p className="text-xs text-gray-500 font-medium mt-1">Members</p>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-[#e5e1d8] shadow-sm flex flex-col items-center justify-center text-center">
                  <Calendar className="w-5 h-5 text-orange-500 mb-2" />
                  <p className="text-2xl font-bold text-[#1A2B4A]">{club.eventCount || 0}</p>
                  <p className="text-xs text-gray-500 font-medium mt-1">Events</p>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-[#e5e1d8] shadow-sm flex flex-col items-center justify-center text-center">
                  <Mail className="w-5 h-5 text-purple-500 mb-2" />
                  <p className="text-2xl font-bold text-[#1A2B4A]">{club.postCount || 0}</p>
                  <p className="text-xs text-gray-500 font-medium mt-1">Posts</p>
                </div>
              </div>

              {/* Leadership */}
              <div>
                <h3 className="text-sm font-bold text-[#1A2B4A] uppercase tracking-wider mb-3">Leadership</h3>
                <div className="bg-white p-4 rounded-2xl border border-[#e5e1d8] shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-500">
                      {club.lead_name ? club.lead_name.charAt(0) : "?"}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{club.lead_name || "Unassigned"}</p>
                      <p className="text-xs text-gray-500">Club President / Lead</p>
                    </div>
                  </div>
                  {club.lead_name && (
                    <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors cursor-pointer">
                      <Mail className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Members Preview */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-bold text-[#1A2B4A] uppercase tracking-wider">Recent Members</h3>
                  <button className="text-xs font-medium text-blue-600 hover:underline cursor-pointer">View All</button>
                </div>
                <div className="bg-white rounded-2xl border border-[#e5e1d8] shadow-sm overflow-hidden divide-y divide-[#e5e1d8]">
                  {loadingMembers ? (
                    <div className="p-3 text-center text-sm text-gray-500">Loading members...</div>
                  ) : members.length > 0 ? (
                    members.map((m: any, i: number) => (
                      <div key={i} className="p-3 flex items-center gap-3">
                        {m.avatar_url ? (
                          <img src={m.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">
                            {m.full_name?.charAt(0)}
                          </div>
                        )}
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{m.full_name}</p>
                          <p className="text-xs text-gray-500">{m.role}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 text-center bg-gray-50 text-xs text-gray-500 font-medium">
                      No members found
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 bg-white border-t border-[#e5e1d8] flex gap-3 shrink-0">
            <button className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-xl transition-colors flex items-center justify-center gap-2">
              <ExternalLink className="w-4 h-4" /> View Public Page
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
