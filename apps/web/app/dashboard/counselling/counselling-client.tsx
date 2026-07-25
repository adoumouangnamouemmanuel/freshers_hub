"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { HeartHandshake, Users, Award, ShieldCheck, UserPlus, CheckCircle2, Search, Activity, Heart } from "lucide-react";
import { AnimatedPage, AnimatedSection } from "@/components/ui/animated-container";
import { PageHeader } from "@/components/ui/page-header";
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

  const statCards = [
    { label: "Active Cases", value: activeCases.length, icon: Activity, color: "bg-[#A93C40]", shadow: "shadow-[#A93C40]/20" },
    { label: "Resolved Cases", value: resolvedCases.length, icon: CheckCircle2, color: "bg-emerald-500", shadow: "shadow-emerald-500/20" },
    { label: "Peer Counsellors", value: totalPeerCounsellors, icon: Users, color: "bg-blue-500", shadow: "shadow-blue-500/20" },
  ];

  return (
    <AnimatedPage className="pb-12">
      {/* Dynamic Background Elements for Premium Look */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-[#fdf2f2] to-transparent -z-10" />
      <div className="absolute top-20 right-20 w-96 h-96 bg-rose-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob" />
      <div className="absolute top-40 left-20 w-72 h-72 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000" />
      <div className="absolute -top-20 left-1/2 w-96 h-96 bg-purple-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-4000" />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <PageHeader 
          title="Counselling Unit" 
          description="Manage peer counsellor assignments and track student wellbeing cases." 
          badge="Support Unit" 
        />
        <Button 
          onClick={() => setIsAssignModalOpen(true)} 
          className="bg-[#A93C40] hover:bg-[#8B2D31] text-white rounded-full shadow-lg shadow-[#A93C40]/30 transition-all hover:scale-105 cursor-pointer"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Assign New Case
        </Button>
      </div>

      <ConfidentialityBanner unit="counselling" />

      {/* Main KPI Section */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8 mt-6">
        {/* Large Strategic Case Card */}
        <AnimatedSection className="lg:col-span-2 relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1A2B4A] to-[#2a4577] p-8 shadow-2xl text-white">
          <div className="absolute top-0 right-0 p-8 opacity-20">
            <HeartHandshake className="w-48 h-48" />
          </div>
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div>
              <p className="text-blue-200 text-sm font-semibold tracking-wider uppercase mb-2">Total Managed Cases</p>
              <div className="flex items-baseline gap-2">
                <span className="text-6xl font-black tracking-tighter">{activeCases.length + resolvedCases.length}</span>
                <span className="text-2xl font-bold text-blue-300">students</span>
              </div>
            </div>
            
            <div className="mt-8">
              <div className="flex justify-between text-sm text-blue-200 mb-2 font-medium">
                <span>Active vs Resolved Ratio</span>
                <span>{resolvedCases.length} Resolved</span>
              </div>
              <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden flex">
                {activeCases.length + resolvedCases.length > 0 && (
                  <>
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(activeCases.length / (activeCases.length + resolvedCases.length)) * 100}%` }}
                      transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
                      className="h-full bg-gradient-to-r from-rose-400 to-[#A93C40] relative border-r border-white/20"
                    />
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(resolvedCases.length / (activeCases.length + resolvedCases.length)) * 100}%` }}
                      transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
                      className="h-full bg-gradient-to-r from-emerald-400 to-green-500 relative"
                    />
                  </>
                )}
              </div>
            </div>
          </div>
        </AnimatedSection>

        {/* Mini Stats */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {statCards.map((stat, i) => (
            <AnimatedSection key={stat.label} className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 border border-white/40 shadow-xl shadow-black/5 flex flex-col justify-between group hover:-translate-y-1 transition-transform duration-300 cursor-default">
              <div className={`w-12 h-12 rounded-2xl ${stat.color} ${stat.shadow} flex items-center justify-center text-white mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div>
                <motion.p 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * i }}
                  className="text-4xl font-bold text-[#1A2B4A]"
                >
                  {stat.value}
                </motion.p>
                <p className="text-sm font-medium text-gray-500 mt-1">{stat.label}</p>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>

      <Tabs defaultValue="cases" className="mt-8">
        <TabsList className="bg-white/60 backdrop-blur-md border border-white/40 rounded-full p-1.5 shadow-sm mb-8 inline-flex">
          <TabsTrigger value="cases" className="rounded-full px-6 py-2 cursor-pointer data-[state=active]:bg-[#1A2B4A] data-[state=active]:text-white transition-all duration-300">
            Active Cases
            <Badge variant="secondary" className="ml-2 bg-white/20 text-current border-0">{activeCases.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="counsellors" className="rounded-full px-6 py-2 cursor-pointer data-[state=active]:bg-[#1A2B4A] data-[state=active]:text-white transition-all duration-300">
            Counsellors Directory
          </TabsTrigger>
        </TabsList>

        {/* ACTIVE CASES TAB */}
        <TabsContent value="cases">
          <AnimatedSection className="rounded-3xl border border-white/40 bg-white/80 backdrop-blur-xl shadow-xl shadow-black/5 overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50/50 to-transparent">
              <h2 className="text-lg font-bold text-[#1A2B4A] flex items-center">
                <Heart className="w-5 h-5 mr-2 text-[#A93C40]" />
                Students Requiring Support
              </h2>
              <div className="relative w-72">
                <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input 
                  placeholder="Search student or counsellor..." 
                  className="pl-11 h-10 rounded-full bg-white/50 border-gray-200 focus-visible:ring-[#1A2B4A]/20 transition-all" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50/80 text-gray-500 uppercase text-xs font-semibold tracking-wider">
                  <tr>
                    <th className="px-6 py-4 rounded-tl-lg">Student</th>
                    <th className="px-6 py-4">Assigned To (Peer Counsellor)</th>
                    <th className="px-6 py-4">Assigned By</th>
                    <th className="px-6 py-4">Duration</th>
                    <th className="px-6 py-4 text-right rounded-tr-lg">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100/50 bg-white/40">
                  {filteredCases.map((c, i) => (
                    <motion.tr 
                      key={c.assignment_id} 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="hover:bg-gray-50/80 transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 ring-2 ring-white shadow-sm">
                            <AvatarImage src={c.student_avatar} />
                            <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold">{c.student_name?.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span className="font-semibold text-gray-900">{c.student_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3 text-gray-700 bg-gray-50/50 p-2 rounded-full pr-4 w-max">
                          <Avatar className="h-7 w-7 shadow-sm">
                            <AvatarImage src={c.peer_counsellor_avatar} />
                            <AvatarFallback className="bg-rose-100 text-rose-700">{c.peer_counsellor_name?.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{c.peer_counsellor_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-500 font-medium">
                        {c.assigned_by_name || "System"}
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                          {formatDistanceToNow(new Date(c.created_at))} active
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-full font-semibold transition-all cursor-pointer opacity-80 group-hover:opacity-100"
                          onClick={() => handleResolveCase(c.assignment_id)}
                          disabled={resolvingId === c.assignment_id}
                        >
                          <CheckCircle2 className="w-4 h-4 mr-1.5" />
                          {resolvingId === c.assignment_id ? "Resolving..." : "Mark Resolved"}
                        </Button>
                      </td>
                    </motion.tr>
                  ))}
                  {filteredCases.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center justify-center text-gray-400">
                          <CheckCircle2 className="w-12 h-12 mb-3 text-gray-300" />
                          <p className="text-lg font-medium text-gray-500">No active cases found.</p>
                          <p className="text-sm mt-1">All students are doing great!</p>
                        </div>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {counsellors.map((c, i) => (
              <AnimatedSection 
                key={c.id} 
                className="bg-white/80 backdrop-blur-xl border border-white/40 rounded-3xl p-6 shadow-xl shadow-black/5 hover:-translate-y-1 transition-all duration-300 group"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="relative mb-4">
                    <Avatar className="h-20 w-20 border-4 border-white shadow-md ring-1 ring-gray-100 transition-transform duration-300 group-hover:scale-105">
                      <AvatarImage src={c.avatar_url} />
                      <AvatarFallback className="text-2xl bg-gradient-to-br from-gray-100 to-gray-200 text-gray-600 font-bold">
                        {c.full_name?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    {c.role_name === 'counsellor' && (
                      <div className="absolute -bottom-1 -right-1 bg-[#1A2B4A] text-white p-1.5 rounded-full ring-2 ring-white shadow-sm" title="Professional Staff">
                        <Award className="w-3 h-3" />
                      </div>
                    )}
                  </div>
                  
                  <h3 className="font-bold text-gray-900 text-lg mb-1">{c.full_name}</h3>
                  <Badge variant="outline" className={`mb-4 px-3 py-1 text-xs font-semibold rounded-full border ${c.role_name === 'counsellor' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                    {c.role_name === 'counsellor' ? 'Professional Counsellor' : 'Peer Counsellor'}
                  </Badge>
                  
                  {c.role_name === 'peer_counsellor' ? (
                    <div className="w-full flex items-center justify-center gap-6 mt-2 pt-4 border-t border-gray-100/80">
                      <div className="flex flex-col items-center">
                        <span className="text-3xl font-black text-[#A93C40] leading-none mb-1">{c.active_cases || 0}</span>
                        <span className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Active</span>
                      </div>
                      <div className="w-px h-8 bg-gray-200" />
                      <div className="flex flex-col items-center">
                        <span className="text-3xl font-black text-emerald-500 leading-none mb-1">{c.resolved_cases || 0}</span>
                        <span className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Resolved</span>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full flex items-center justify-center mt-2 pt-4 border-t border-gray-100/80">
                      <span className="text-sm font-medium text-gray-500 flex items-center">
                        <ShieldCheck className="w-4 h-4 mr-2 text-amber-500" />
                        Unit Administration
                      </span>
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
