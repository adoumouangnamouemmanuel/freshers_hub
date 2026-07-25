"use client";

import { useState } from "react";
import { GraduationCap, Users, TrendingUp, BadgeCheck, CheckCircle2, ChevronRight, Activity, BookOpen, Clock, CalendarDays } from "lucide-react";
import { AnimatedPage, AnimatedSection } from "@/components/ui/animated-container";
import { PageHeader } from "@/components/ui/page-header";
import { ConfidentialityBanner } from "@/components/ui/confidentiality-banner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";

export function AdvisingClient({ 
  initialSummary,
  initialAdvisors,
  currentAcademicYearId
}: { 
  initialSummary: any,
  initialAdvisors: any[],
  currentAcademicYearId?: string
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const summary = initialSummary || {
    total_students_seen: 0,
    total_sessions: 0,
    completed_sessions: 0,
    completion_rate: 0
  };
  const advisors = initialAdvisors || [];

  return (
    <AnimatedPage className="space-y-8 max-w-7xl mx-auto pb-12">
      <PageHeader 
        title="Academic Advising" 
        description="Monitor unit-wide advising sessions and professional advisor capacity" 
        badge="Professional Unit" 
      />
      
      <ConfidentialityBanner unit="advising" />

      {/* Hero Stats Section */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Students Seen */}
        <AnimatedSection delay={0.1} className="relative overflow-hidden rounded-3xl bg-white p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
          <div className="absolute -right-6 -top-6 text-indigo-50 group-hover:text-indigo-100 transition-colors duration-500">
            <Users className="w-32 h-32" />
          </div>
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div>
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 mb-4 shadow-inner">
                <Users className="h-5 w-5" />
              </div>
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Students Seen</p>
            </div>
            <div className="mt-4">
              <p className="text-4xl font-black text-gray-900 tracking-tight">{summary.total_students_seen}</p>
              <p className="text-sm font-medium text-indigo-600 mt-1 flex items-center">
                <Activity className="w-3.5 h-3.5 mr-1" /> Active Engagements
              </p>
            </div>
          </div>
        </AnimatedSection>

        {/* Total Sessions */}
        <AnimatedSection delay={0.2} className="relative overflow-hidden rounded-3xl bg-white p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
          <div className="absolute -right-6 -top-6 text-emerald-50 group-hover:text-emerald-100 transition-colors duration-500">
            <CalendarDays className="w-32 h-32" />
          </div>
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div>
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 mb-4 shadow-inner">
                <CalendarDays className="h-5 w-5" />
              </div>
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Total Sessions</p>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <p className="text-4xl font-black text-gray-900 tracking-tight">{summary.total_sessions}</p>
              <span className="text-sm font-semibold text-gray-400">booked</span>
            </div>
          </div>
        </AnimatedSection>

        {/* Completed Sessions */}
        <AnimatedSection delay={0.3} className="relative overflow-hidden rounded-3xl bg-white p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
          <div className="absolute -right-6 -top-6 text-amber-50 group-hover:text-amber-100 transition-colors duration-500">
            <CheckCircle2 className="w-32 h-32" />
          </div>
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div>
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600 mb-4 shadow-inner">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Completed</p>
            </div>
            <div className="mt-4">
              <p className="text-4xl font-black text-gray-900 tracking-tight">{summary.completed_sessions}</p>
              <p className="text-sm font-medium text-amber-600 mt-1 flex items-center">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Logged sessions
              </p>
            </div>
          </div>
        </AnimatedSection>

        {/* Completion Rate */}
        <AnimatedSection delay={0.4} className="relative overflow-hidden rounded-3xl bg-white p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
          <div className="absolute -right-6 -top-6 text-[#1A2B4A]/5 group-hover:text-[#1A2B4A]/10 transition-colors duration-500">
            <TrendingUp className="w-32 h-32" />
          </div>
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div>
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#1A2B4A]/10 text-[#1A2B4A] mb-4 shadow-inner">
                <TrendingUp className="h-5 w-5" />
              </div>
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Completion Rate</p>
            </div>
            <div className="mt-4 flex items-end justify-between">
              <div>
                <p className="text-4xl font-black text-[#1A2B4A] tracking-tight">{summary.completion_rate}%</p>
              </div>
              <div className="mb-2 h-2 w-16 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-[#A93C40] rounded-full" style={{ width: `${summary.completion_rate}%` }} />
              </div>
            </div>
          </div>
        </AnimatedSection>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Professional Advisors Directory */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-[#1A2B4A] flex items-center">
              <BookOpen className="w-5 h-5 mr-2 text-[#A93C40]" />
              Academic Advisors
            </h2>
            <Badge variant="outline" className="bg-white border-gray-200 text-gray-600">
              {advisors.length} {advisors.length === 1 ? 'Advisor' : 'Advisors'}
            </Badge>
          </div>

          <AnimatedSection delay={0.5}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {advisors.length === 0 ? (
                <div className="col-span-2 p-12 text-center bg-gray-50 rounded-3xl border border-gray-100">
                  <BadgeCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No advisors found for this period.</p>
                </div>
              ) : (
                advisors.map((advisor, i) => (
                  <div key={advisor.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all group flex items-start gap-4">
                    <Avatar className="h-14 w-14 ring-2 ring-gray-50 group-hover:ring-indigo-50 transition-all shadow-sm">
                      <AvatarImage src={advisor.avatar_url} />
                      <AvatarFallback className="bg-gradient-to-br from-indigo-50 to-indigo-100 text-indigo-700 font-bold">
                        {advisor.full_name?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="font-semibold text-gray-900 truncate">{advisor.full_name}</h3>
                        <span title="Professional Advisor" className="flex-shrink-0 flex items-center justify-center">
                          <BadgeCheck className="w-4 h-4 text-[#A93C40]" />
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mb-3 truncate">{advisor.email}</p>
                      
                      <div className="grid grid-cols-2 gap-2 mt-auto">
                        <div className="bg-gray-50 rounded-lg p-2 border border-gray-100/50">
                          <p className="text-[10px] uppercase font-semibold text-gray-400 tracking-wider mb-0.5">Students</p>
                          <p className="font-bold text-gray-700">{advisor.total_students_seen}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-2 border border-gray-100/50">
                          <p className="text-[10px] uppercase font-semibold text-gray-400 tracking-wider mb-0.5">Sessions</p>
                          <p className="font-bold text-indigo-700">{advisor.total_sessions}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </AnimatedSection>
        </div>

        {/* Context Sidebar */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-[#1A2B4A] flex items-center">
              <Clock className="w-5 h-5 mr-2 text-indigo-500" />
              Information
            </h2>
          </div>
          
          <AnimatedSection delay={0.6} className="bg-gradient-to-br from-[#1A2B4A] to-[#2a4577] p-8 rounded-3xl shadow-lg relative overflow-hidden text-white">
            <div className="absolute top-0 right-0 p-6 opacity-10">
              <BookOpen className="w-32 h-32" />
            </div>
            
            <div className="relative z-10">
              <Badge className="bg-white/10 hover:bg-white/20 text-white border-white/20 mb-6">Voluntary Booking</Badge>
              
              <h3 className="text-lg font-bold mb-3">Independent Advising</h3>
              <p className="text-blue-100/80 text-sm leading-relaxed mb-6">
                Unlike the Coaching unit, Academic Advising sessions are not mandatory. Students book directly with professional advisors when they need degree planning, academic recovery, or major exploration support.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-1.5 rounded-full bg-white/10 mt-0.5">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  </div>
                  <p className="text-sm text-blue-50/90 font-medium">No peer advisors used</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-1.5 rounded-full bg-white/10 mt-0.5">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  </div>
                  <p className="text-sm text-blue-50/90 font-medium">Voluntary student engagement</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-1.5 rounded-full bg-white/10 mt-0.5">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  </div>
                  <p className="text-sm text-blue-50/90 font-medium">Confidential session notes</p>
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </AnimatedPage>
  );
}
