"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { assignCounsellingCaseAction } from "@/app/actions/units";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Search, HeartHandshake, UserPlus, Users, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

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
  const [studentSchoolId, setStudentSchoolId] = useState("");
  const [peerCounsellorId, setPeerCounsellorId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleAssign = async () => {
    if (!studentSchoolId || !peerCounsellorId) {
      toast.error("Please select a student and a peer counsellor");
      return;
    }

    try {
      setIsSubmitting(true);
      await assignCounsellingCaseAction({
        academicYearId: academicYearId ? parseInt(academicYearId) : 1, // Defaulting to 1 if not set
        studentSchoolId,
        peerCounsellorId
      });
      toast.success("Case assigned successfully");
      router.refresh();
      onClose();
      setStudentSchoolId("");
      setPeerCounsellorId("");
    } catch (e: any) {
      toast.error(e.message || "Failed to assign case");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md p-0 border-0 shadow-2xl rounded-3xl overflow-hidden bg-white">
        
        {/* Header with gradient background */}
        <div className="relative bg-gradient-to-br from-[#1A2B4A] to-[#2a4577] px-6 py-8 overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <HeartHandshake className="w-32 h-32" />
          </div>
          
          <div className="relative z-10">
            <div className="bg-white/10 w-12 h-12 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-sm border border-white/20 shadow-inner">
              <UserPlus className="w-6 h-6 text-white" />
            </div>
            <DialogTitle className="text-2xl font-bold text-white mb-2">Assign Student Case</DialogTitle>
            <DialogDescription className="text-blue-100 text-sm">
              Pair a student with a peer counsellor for dedicated wellbeing support.
            </DialogDescription>
          </div>
        </div>

        {/* Content area */}
        <div className="p-6 space-y-6">
          <div className="space-y-3">
            <label className="text-sm font-semibold text-gray-700 flex items-center">
              Student School ID
              <Badge variant="outline" className="ml-2 text-[10px] uppercase bg-gray-50 border-gray-200 text-gray-500">Required</Badge>
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-[#1A2B4A] transition-colors">
                <Search className="w-4 h-4" />
              </div>
              <Input 
                placeholder="Enter School ID (e.g., 20261234)..." 
                className="pl-9 h-12 rounded-xl bg-gray-50 border-gray-200 focus-visible:ring-[#1A2B4A]/20 transition-all text-sm"
                value={studentSchoolId}
                onChange={(e) => setStudentSchoolId(e.target.value)}
              />
            </div>
            <p className="text-xs text-gray-400 ml-1">Paste the exact School ID of the student requiring support.</p>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-semibold text-gray-700 flex items-center">
              Peer Counsellor
              <Badge variant="outline" className="ml-2 text-[10px] uppercase bg-gray-50 border-gray-200 text-gray-500">Required</Badge>
            </label>
            <Select 
              value={peerCounsellorId} 
              onValueChange={(val) => setPeerCounsellorId(val || "")}
            >
              <SelectTrigger className="h-14 rounded-xl bg-gray-50 border-gray-200 focus:ring-[#1A2B4A]/20 transition-all">
                <SelectValue placeholder="Select an available peer counsellor" />
              </SelectTrigger>
              <SelectContent className="max-h-[280px] rounded-xl border-gray-100 shadow-xl">
                {counsellors.map(c => (
                  <SelectItem key={c.id} value={c.id} className="p-3 cursor-pointer focus:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8 ring-1 ring-gray-200">
                        <AvatarImage src={c.avatar_url} />
                        <AvatarFallback className="bg-rose-50 text-rose-700 font-semibold text-xs">
                          {c.full_name?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col text-left">
                        <span className="font-semibold text-gray-900">{c.full_name}</span>
                        <span className="text-xs text-gray-500 flex items-center">
                          <Users className="w-3 h-3 mr-1 text-emerald-500" />
                          {c.active_cases || 0} active {c.active_cases === 1 ? 'case' : 'cases'}
                        </span>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-6 pt-2 pb-6 flex justify-end gap-3 bg-gray-50/50 border-t border-gray-100 mt-2">
          <Button 
            variant="outline" 
            onClick={onClose} 
            className="rounded-full px-6 h-11 border-gray-200 text-gray-600 hover:bg-gray-100 cursor-pointer font-medium"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleAssign} 
            disabled={isSubmitting || !studentSchoolId || !peerCounsellorId}
            className="bg-[#A93C40] hover:bg-[#8B2D31] text-white rounded-full px-8 h-11 cursor-pointer font-semibold shadow-lg shadow-[#A93C40]/20 transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:hover:translate-y-0"
          >
            {isSubmitting ? (
              <span className="flex items-center">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                Assigning...
              </span>
            ) : (
              "Confirm Assignment"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
