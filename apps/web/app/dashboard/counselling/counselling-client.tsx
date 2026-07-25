"use client";

import { useState } from "react";
import { HeartHandshake, Users, TrendingUp, Sparkles, UserPlus, CheckCircle2, Search, ArrowRight } from "lucide-react";
import { AnimatedPage, AnimatedSection } from "@/components/ui/animated-container";
import { PageHeader } from "@/components/ui/page-header";
import { MiniStatCard } from "@/components/ui/card";
import { ConfidentialityBanner } from "@/components/ui/confidentiality-banner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { resolveCounsellingCaseAction } from "@/app/actions/units";
import { toast } from "sonner";
import { AssignCaseModal } from "./assign-case-modal";
import { formatDistanceToNow } from "date-fns";

export function CounsellingClient({ 
  summary, 
  activeCases,
  resolvedCases,
  counsellors,
  academicYearId
}: { 
  summary: any, 
  activeCases: any[],
  resolvedCases: any[],
  counsellors: any[],
  academicYearId?: string
}) {
  const router = useRouter();
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const totalPeerCounsellors = counsellors.filter(c => c.role_name === 'peer_counsellor').length;
  const totalProfessional = counsellors.filter(c => c.role_name === 'counsellor').length;

  const filteredCases = activeCases.filter(c => 
    c.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.peer_counsellor_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleResolveCase = async (assignmentId: string) => {
    try {
      setResolvingId(assignmentId);
      await resolveCounsellingCaseAction(assignmentId);
      toast.success("Case marked as resolved");
      router.refresh();
    } catch (e: any) {
      toast.error(e.message || "Failed to resolve case");
    } finally {
      setResolvingId(null);
    }
  };

  return (
    <AnimatedPage>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <PageHeader 
          title="Counselling" 
          description="Manage peer counsellor assignments and track student wellbeing cases." 
          badge="Support Unit" 
        />
        <Button onClick={() => setIsAssignModalOpen(true)} className="bg-[#1A2B4A] hover:bg-[#1A2B4A]/90 text-white rounded-full">
          <UserPlus className="w-4 h-4 mr-2" />
          Assign New Case
        </Button>
      </div>

      <ConfidentialityBanner unit="counselling" />

      <Tabs defaultValue="overview" className="mt-6">
        <TabsList className="bg-white border rounded-full p-1 shadow-sm mb-6 inline-flex">
          <TabsTrigger value="overview" className="rounded-full px-6 data-[state=active]:bg-[#F9FAFB] data-[state=active]:shadow-sm">Overview</TabsTrigger>
          <TabsTrigger value="cases" className="rounded-full px-6 data-[state=active]:bg-[#F9FAFB] data-[state=active]:shadow-sm">
            Active Cases
            <Badge variant="secondary" className="ml-2 bg-[#A93C40]/10 text-[#A93C40]">{activeCases.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="counsellors" className="rounded-full px-6 data-[state=active]:bg-[#F9FAFB] data-[state=active]:shadow-sm">Directory</TabsTrigger>
        </TabsList>

        {/* OVERVIEW TAB */}
        <TabsContent value="overview">
          <div className="grid gap-5 grid-cols-1 sm:grid-cols-4 mb-6">
            <MiniStatCard icon={HeartHandshake} value={activeCases.length.toString()} label="Active Cases" color="text-[#A93C40]" />
            <MiniStatCard icon={CheckCircle2} value={resolvedCases.length.toString()} label="Resolved Cases" color="text-green-600" />
            <MiniStatCard icon={Users} value={totalPeerCounsellors.toString()} label="Peer Counsellors" />
            <MiniStatCard icon={Sparkles} value={totalProfessional.toString()} label="Professional Staff" />
          </div>

          <AnimatedSection className="rounded-2xl border bg-white p-8 shadow-sm text-center">
            <HeartHandshake className="w-12 h-12 text-[#A93C40]/30 mx-auto mb-4" />
            <p className="text-lg font-semibold text-[#1A2B4A]">Strategic Case Management</p>
            <p className="text-sm text-[#6B7280] mt-2 max-w-md mx-auto">
              Unlike coaching which is mandatory for all freshmen, counselling cases are assigned ad-hoc. 
              Students are paired with peer counsellors for informal support until their case is resolved.
            </p>
          </AnimatedSection>
        </TabsContent>

        {/* ACTIVE CASES TAB */}
        <TabsContent value="cases">
          <AnimatedSection className="rounded-2xl border bg-white shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 border-b flex items-center justify-between bg-gray-50/50">
              <h2 className="font-semibold text-[#1A2B4A]">Currently Assigned Students</h2>
              <div className="relative w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input 
                  placeholder="Search student or counsellor..." 
                  className="pl-9 h-9 rounded-full bg-white" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50/50 text-gray-500 uppercase text-xs font-medium border-b">
                  <tr>
                    <th className="px-6 py-4">Student</th>
                    <th className="px-6 py-4">Assigned To (Peer Counsellor)</th>
                    <th className="px-6 py-4">Assigned By</th>
                    <th className="px-6 py-4">Duration</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredCases.map((c) => (
                    <tr key={c.assignment_id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={c.student_avatar} />
                            <AvatarFallback>{c.student_name?.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-gray-900">{c.student_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-gray-700">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={c.peer_counsellor_avatar} />
                            <AvatarFallback>{c.peer_counsellor_name?.charAt(0)}</AvatarFallback>
                          </Avatar>
                          {c.peer_counsellor_name}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        {c.assigned_by_name || "System"}
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        {formatDistanceToNow(new Date(c.created_at))} active
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          onClick={() => handleResolveCase(c.assignment_id)}
                          disabled={resolvingId === c.assignment_id}
                        >
                          <CheckCircle2 className="w-4 h-4 mr-1" />
                          {resolvingId === c.assignment_id ? "Resolving..." : "Mark Resolved"}
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {filteredCases.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                        No active cases found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </AnimatedSection>
        </TabsContent>

        {/* COUNSELLORS DIRECTORY */}
        <TabsContent value="counsellors">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {counsellors.map(c => (
              <AnimatedSection key={c.id} className="border bg-white rounded-2xl p-5 flex items-start gap-4 hover:border-[#1A2B4A]/20 transition-all hover:shadow-md">
                <Avatar className="h-12 w-12 border-2 border-white shadow-sm ring-1 ring-gray-100">
                  <AvatarImage src={c.avatar_url} />
                  <AvatarFallback>{c.full_name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{c.full_name}</h3>
                  <Badge variant="outline" className={`mt-1 mb-2 ${c.role_name === 'counsellor' ? 'bg-[#1A2B4A]/5 text-[#1A2B4A]' : 'bg-[#A93C40]/5 text-[#A93C40]'}`}>
                    {c.role_name === 'counsellor' ? 'Professional Counsellor' : 'Peer Counsellor'}
                  </Badge>
                  
                  {c.role_name === 'peer_counsellor' && (
                    <div className="flex items-center gap-4 text-sm mt-3 pt-3 border-t">
                      <div className="flex flex-col">
                        <span className="text-gray-500 text-xs">Active Cases</span>
                        <span className="font-medium text-[#A93C40]">{c.active_cases || 0}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-gray-500 text-xs">Resolved</span>
                        <span className="font-medium text-green-600">{c.resolved_cases || 0}</span>
                      </div>
                    </div>
                  )}
                </div>
              </AnimatedSection>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <AssignCaseModal 
        isOpen={isAssignModalOpen} 
        onClose={() => setIsAssignModalOpen(false)} 
        counsellors={counsellors.filter(c => c.role_name === 'peer_counsellor')}
        academicYearId={academicYearId}
      />
    </AnimatedPage>
  );
}
