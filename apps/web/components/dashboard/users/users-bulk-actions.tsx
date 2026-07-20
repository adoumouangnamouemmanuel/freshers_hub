"use client";

import { useState, useTransition } from "react";
import { ShieldCheck, Trash2, X, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { assignRolesAction, deactivateUsersAction } from "@/app/actions/users";
import { ConfirmModal } from "./confirm-modal";

interface UsersBulkActionsProps {
  selectedUserIds: Set<string>;
  onClearSelection: () => void;
  onSuccess: () => void;
  allRoles: { id: string | number; name: string }[];
}

export function UsersBulkActions({
  selectedUserIds,
  onClearSelection,
  onSuccess,
  allRoles,
}: UsersBulkActionsProps) {
  const [isPending, startTransition] = useTransition();
  const [showRoleSelect, setShowRoleSelect] = useState(false);
  const [selectedRole, setSelectedRole] = useState("");
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: "danger" | "warning" | "info" | "success";
    title: string;
    description: string;
    isAlert: boolean;
    onConfirm?: () => void;
  }>({ isOpen: false, type: "warning", title: "", description: "", isAlert: false });

  const selectedCount = selectedUserIds.size;

  if (selectedCount === 0) return null;

  const closeConfirm = () => setConfirmModal((prev) => ({ ...prev, isOpen: false }));

  function handleDeactivate() {
    setConfirmModal({
      isOpen: true,
      type: "danger",
      title: "Deactivate Users",
      description: `Are you sure you want to deactivate ${selectedCount} selected users? They will lose access to the platform.`,
      isAlert: false,
      onConfirm: executeDeactivate,
    });
  }

  function executeDeactivate() {
    startTransition(async () => {
      try {
        await deactivateUsersAction(Array.from(selectedUserIds));
        onSuccess();
        onClearSelection();
        closeConfirm();
      } catch (err: any) {
        setConfirmModal({
          isOpen: true,
          type: "danger",
          title: "Error",
          description: err.message || "Failed to deactivate users",
          isAlert: true,
        });
      }
    });
  }

  function handleAssignRole() {
    if (!selectedRole) return;
    executeAssignRole();
  }

  function executeAssignRole() {
    startTransition(async () => {
      try {
        await assignRolesAction(Array.from(selectedUserIds), selectedRole);
        onSuccess();
        onClearSelection();
        setSelectedRole("");
        setShowRoleSelect(false);
        closeConfirm();
      } catch (err: any) {
        setConfirmModal({
          isOpen: true,
          type: "danger",
          title: "Error",
          description: err.message || "Failed to assign role",
          isAlert: true,
        });
      }
    });
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
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              disabled={isPending}
            >
              <option value="" className="text-black">Select a role...</option>
              {allRoles.map((r) => (
                <option key={r.id} value={r.id} className="text-black">
                  {r.name}
                </option>
              ))}
            </select>
            <button
              onClick={handleAssignRole}
              disabled={!selectedRole || isPending}
              className="ml-2 rounded bg-white px-3 py-1 text-xs font-medium text-[#1A2B4A] hover:bg-gray-100 disabled:opacity-50 cursor-pointer"
            >
              {isPending ? "Saving..." : "Apply"}
            </button>
            <button
              onClick={() => {
                setShowRoleSelect(false);
                setSelectedRole("");
              }}
              className="ml-2 text-white/60 hover:text-white cursor-pointer"
            >
              Cancel
            </button>
          </div>
        ) : (
          <>
            <button
              onClick={() => setShowRoleSelect(true)}
              disabled={isPending}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors hover:bg-white/10 hover:text-[#C89B3C]"
            >
              <ShieldCheck className="h-4 w-4" /> Assign role
            </button>
            <button
              onClick={handleDeactivate}
              disabled={isPending}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors hover:bg-white/10 hover:text-red-300"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Deactivate
            </button>
          </>
        )}

        <button
          onClick={onClearSelection}
          aria-label="Clear selection"
          className="ml-2 cursor-pointer rounded-full p-1.5 transition-colors hover:bg-white/10"
        >
          <X className="h-4 w-4" />
        </button>
      </motion.div>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        description={confirmModal.description}
        type={confirmModal.type}
        isAlert={confirmModal.isAlert}
        isLoading={isPending}
        onConfirm={confirmModal.onConfirm}
        onCancel={closeConfirm}
      />
    </div>
  );
}
