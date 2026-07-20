"use client";

import { X, AlertTriangle, Info, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel: () => void;
  type?: "danger" | "warning" | "info" | "success";
  isLoading?: boolean;
  isAlert?: boolean; // If true, only shows the confirm button (as an "OK" button)
}

export function ConfirmModal({
  isOpen,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  type = "warning",
  isLoading = false,
  isAlert = false,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const iconMap = {
    danger: <XCircle className="h-8 w-8 text-red-600" />,
    warning: <AlertTriangle className="h-8 w-8 text-amber-500" />,
    info: <Info className="h-8 w-8 text-blue-500" />,
    success: <CheckCircle className="h-8 w-8 text-emerald-500" />,
  };

  const bgMap = {
    danger: "bg-red-100",
    warning: "bg-amber-100",
    info: "bg-blue-100",
    success: "bg-emerald-100",
  };

  const btnMap = {
    danger: "bg-red-600 hover:bg-red-700 focus:ring-red-500",
    warning: "bg-amber-500 hover:bg-amber-600 focus:ring-amber-500",
    info: "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500",
    success: "bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500",
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onCancel}
          className="absolute inset-0 bg-[#1A2B4A]/40 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl"
        >
          <div className="p-6">
            <div className="flex flex-col items-center text-center">
              <div className={`mb-4 flex h-16 w-16 items-center justify-center rounded-full ${bgMap[type]}`}>
                {iconMap[type]}
              </div>
              
              <h3 className="mb-2 text-xl font-bold text-[#1A2B4A]">{title}</h3>
              <p className="mb-6 text-sm text-[#6B7280]">{description}</p>
            </div>

            <div className={`flex w-full ${isAlert ? "justify-center" : "gap-3"}`}>
              {!isAlert && (
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={onCancel}
                  className="flex-1 cursor-pointer rounded-xl border border-gray-200 px-4 py-2.5 font-semibold text-[#6B7280] transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 focus:ring-offset-2 disabled:opacity-50"
                >
                  {cancelText}
                </button>
              )}
              
              <button
                type="button"
                disabled={isLoading}
                onClick={onConfirm || onCancel}
                className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-2.5 font-semibold text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 ${btnMap[type]}`}
              >
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                {isAlert ? "OK" : confirmText}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
