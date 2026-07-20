"use client";

import { useState } from "react";
import { ShieldCheck, Trash2, X, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface UsersBulkActionsProps {
  selectedCount: number;
  onClear: () => void;
  onDeactivate: () => Promise<void>;
  onAssignRole: (roleId: string) => Promise<void>;
  allRoles: { id: string; name: string }[];
}

export function UsersBulkActions({
  selectedCount,
  onClear,
  onDeactivate,
  onAssignRole,
  allRoles,
}: UsersBulkActionsProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showRoleSelect, setShowRoleSelect] = useState(false);

  if (selectedCount === 0) return null;

  async function handleDeactivate() {
    if (!confirm(`Are you sure you want to deactivate ${selectedCount} users?`)) return;
    setIsProcessing(true);
    await onDeactivate();
    setIsProcessing(false);
    onClear();
  }

  async function handleAssign(roleId: string) {
    setIsProcessing(true);
    await onAssignRole(roleId);
    setIsProcessing(false);
    setShowRoleSelect(false);
    onClear();
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        className="pointer-events-auto flex items-center gap-4 rounded-2xl border border-white/10 bg-[#1A2B4A]/95 p-2 px-5 text-white shadow-2xl backdrop-blur-xl"
      >
        <span className="text-sm font-semibold">{selectedCount} selected</span>
        <div className="h-4 w-px bg-white/20" />

        {showRoleSelect ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/60">Assign to:</span>
            <select
              className="rounded-lg bg-white/10 px-2 py-1 text-sm outline-none border border-white/10 focus:border-white/30"
              onChange={(e) => {
                if (e.target.value) handleAssign(e.target.value);
              }}
              disabled={isProcessing}
            >
              <option value="">Select a role...</option>
              {allRoles.map((r) => (
                <option key={r.id} value={r.id} className="text-black">
                  {r.name}
                </option>
              ))}
            </select>
            <button
              onClick={() => setShowRoleSelect(false)}
              className="ml-2 text-white/60 hover:text-white"
            >
              Cancel
            </button>
          </div>
        ) : (
          <>
            <button
              onClick={() => setShowRoleSelect(true)}
              disabled={isProcessing}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors hover:bg-white/10 hover:text-[#C89B3C]"
            >
              <ShieldCheck className="h-4 w-4" /> Assign role
            </button>
            <button
              onClick={handleDeactivate}
              disabled={isProcessing}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors hover:bg-white/10 hover:text-red-300"
            >
              {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Deactivate
            </button>
          </>
        )}

        <button
          onClick={onClear}
          aria-label="Clear selection"
          className="ml-2 cursor-pointer rounded-full p-1.5 transition-colors hover:bg-white/10"
        >
          <X className="h-4 w-4" />
        </button>
      </motion.div>
    </div>
  );
}
