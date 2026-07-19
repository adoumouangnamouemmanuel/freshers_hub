"use client";

import { GraduationCap, Users, TrendingUp } from "lucide-react";
import { AnimatedPage, AnimatedSection } from "@/components/ui/animated-container";
import { PageHeader } from "@/components/ui/page-header";
import { MiniStatCard } from "@/components/ui/card";
import { ConfidentialityBanner } from "@/components/ui/confidentiality-banner";

export default function AdvisingPage() {
  return (
    <AnimatedPage>
      <PageHeader title="Advising" description="Aggregate advising metrics — individual session data is unit-confidential" badge="Support Unit" />
      <ConfidentialityBanner unit="advising" />
      <div className="grid gap-5 grid-cols-1 sm:grid-cols-4">
        <MiniStatCard icon={Users} value="2" label="Advisors" />
        <MiniStatCard icon={Users} value="8" label="Sessions This Cycle" />
        <MiniStatCard icon={TrendingUp} value="55%" label="Booking Rate" color="text-blue-600" />
        <MiniStatCard icon={GraduationCap} value="6" label="Unique Students" />
      </div>
      <AnimatedSection className="rounded-2xl border bg-white p-8 shadow-sm text-center">
        <GraduationCap className="w-12 h-12 text-[#A93C40]/30 mx-auto mb-4" />
        <p className="text-lg font-semibold text-[#1A2B4A]">No Individual Booking Data Available</p>
        <p className="text-sm text-[#6B7280] mt-2 max-w-md mx-auto">Advising sessions are confidential between students and advisors. Aggregate metrics only are shown here.</p>
      </AnimatedSection>
    </AnimatedPage>
  );
}