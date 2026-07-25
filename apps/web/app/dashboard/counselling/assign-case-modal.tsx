"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { assignCounsellingCaseAction } from "@/app/actions/units";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export function AssignCaseModal({ 
  isOpen, 
  onClose, 
  counsellors,
  academicYearId
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  counsellors: any[],
  academicYearId?: string
}) {
  const router = useRouter();
  const [studentId, setStudentId] = useState("");
  const [peerCounsellorId, setPeerCounsellorId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Simplified fetch for students, in a real app this would be a debounced search API
  // Using hardcoded ID input for now or a combobox would be better
  
  const handleAssign = async () => {
    if (!studentId || !peerCounsellorId) {
      toast.error("Please select a student and a peer counsellor");
      return;
    }

    try {
      setIsSubmitting(true);
      await assignCounsellingCaseAction({
        academicYearId: academicYearId ? parseInt(academicYearId) : 1, // Defaulting to 1 if not set
        studentId,
        peerCounsellorId
      });
      toast.success("Case assigned successfully");
      router.refresh();
      onClose();
      setStudentId("");
      setPeerCounsellorId("");
    } catch (e: any) {
      toast.error(e.message || "Failed to assign case");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md border-0 shadow-2xl rounded-3xl overflow-hidden">
        <DialogHeader className="bg-[#1A2B4A]/5 px-6 py-6 border-b">
          <DialogTitle className="text-xl font-bold text-[#1A2B4A]">Assign Case to Peer Counsellor</DialogTitle>
          <p className="text-sm text-gray-500 mt-1">Assign a student to a peer counsellor for temporary support.</p>
        </DialogHeader>

        <div className="p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Student ID (UUID)</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input 
                placeholder="Paste Student UUID..." 
                className="pl-9 h-11"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
              />
            </div>
            <p className="text-xs text-gray-500">In a full implementation, this would be a searchable dropdown.</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Select Peer Counsellor</label>
            <Select value={peerCounsellorId} onValueChange={setPeerCounsellorId}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Select a peer counsellor" />
              </SelectTrigger>
              <SelectContent>
                {counsellors.map(c => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.full_name} ({c.active_cases} active cases)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <Button variant="outline" onClick={onClose} className="rounded-full">Cancel</Button>
            <Button 
              onClick={handleAssign} 
              disabled={isSubmitting || !studentId || !peerCounsellorId}
              className="bg-[#A93C40] hover:bg-[#A93C40]/90 text-white rounded-full px-6"
            >
              {isSubmitting ? "Assigning..." : "Assign Case"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
