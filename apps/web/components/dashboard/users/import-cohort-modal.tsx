"use client";

import { useState, useTransition } from "react";
import { X, Loader2, UserPlus, UploadCloud, FileText } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { importUsersAction } from "@/app/actions/users";

interface ImportCohortModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ImportCohortModal({ isOpen, onClose, onSuccess }: ImportCohortModalProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<any>(null);

  if (!isOpen) return null;

  async function handleImport(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;

    setError("");
    setResult(null);

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("file", file);
        const res = await importUsersAction(formData);
        setResult(res);
      } catch (err: any) {
        setError(err.message || "Failed to import CSV");
      }
    });
  }

  function closeAndReset() {
    setFile(null);
    setResult(null);
    setError("");
    if (result) onSuccess(); // Only refresh list if something was imported
    onClose();
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A2B4A]/20 p-4 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
        >
          <div className="flex items-center justify-between border-b border-[#f3f4f6] px-6 py-4">
            <h2 className="text-lg font-semibold text-[#1A2B4A]">Import Cohort</h2>
            <button onClick={closeAndReset} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-6">
            {result ? (
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <UserPlus className="h-8 w-8" />
                </div>
                <h3 className="mb-2 text-xl font-bold text-[#1A2B4A]">Import Successful</h3>
                <p className="text-[#6B7280]">
                  Inserted: <span className="font-semibold text-emerald-600">{result.inserted}</span><br/>
                  Updated: <span className="font-semibold text-blue-600">{result.updated}</span><br/>
                  Errors: <span className="font-semibold text-red-600">{result.errors?.length || 0}</span>
                </p>
                {result.errors?.length > 0 && (
                  <div className="mt-4 max-h-32 overflow-y-auto rounded-lg bg-red-50 p-3 text-left text-xs text-red-600 border border-red-100">
                    {result.errors.map((e: any, i: number) => (
                      <div key={i} className="mb-1 border-b border-red-100 pb-1 last:border-0 last:pb-0">
                        <span className="font-semibold">Row {e.row}:</span> {e.reason}
                      </div>
                    ))}
                  </div>
                )}
                <button
                  onClick={closeAndReset}
                  className="mt-6 w-full cursor-pointer rounded-xl bg-[#A93C40] px-4 py-3 font-semibold text-white transition-colors hover:bg-[#8f3236]"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleImport}>
                <div className="mb-6">
                  <label className="mb-2 block text-sm font-medium text-[#1A2B4A]">
                    Upload CSV File
                  </label>
                  <p className="mb-4 text-xs text-[#6B7280]">
                    File must contain headers: <code>school_id</code>, <code>email</code>, <code>full_name</code>, <code>class_year</code>, <code>country</code>, <code>major</code>.
                  </p>
                  <div className="flex w-full items-center justify-center">
                    <label className="dark:hover:bg-bray-800 flex h-48 w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#e5e1d8] bg-[#f8f4ef]/50 hover:bg-[#f8f4ef]">
                      <div className="flex flex-col items-center justify-center pb-6 pt-5">
                        {file ? (
                          <FileText className="mb-3 h-8 w-8 text-[#A93C40]" />
                        ) : (
                          <UploadCloud className="mb-3 h-8 w-8 text-[#9CA3AF]" />
                        )}
                        <p className="mb-2 text-sm text-[#6B7280]">
                          {file ? (
                            <span className="font-semibold text-[#1A2B4A]">{file.name}</span>
                          ) : (
                            <><span className="font-semibold">Click to upload</span> or drag and drop</>
                          )}
                        </p>
                        {!file && <p className="text-xs text-[#9CA3AF]">CSV up to 5MB</p>}
                      </div>
                      <input 
                        type="file" 
                        accept=".csv"
                        className="hidden" 
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                      />
                    </label>
                  </div>
                </div>

                {error && <p className="mb-4 text-sm text-red-500">{error}</p>}

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={closeAndReset}
                    className="cursor-pointer rounded-xl px-4 py-2 font-semibold text-[#6B7280] hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isPending || !file}
                    className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#A93C40] px-4 py-2 font-semibold text-white transition-colors hover:bg-[#8f3236] disabled:opacity-50"
                  >
                    {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Import"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
