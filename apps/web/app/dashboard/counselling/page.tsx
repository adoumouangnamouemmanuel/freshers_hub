"use client";

import { HeartHandshake, Users, TrendingUp, Sparkles } from "lucide-react";
import { AnimatedPage, AnimatedSection } from "@/components/ui/animated-container";
import { PageHeader } from "@/components/ui/page-header";
import { MiniStatCard } from "@/components/ui/card";
import { ConfidentialityBanner } from "@/components/ui/confidentiality-banner";
import { ConfidentialityBanner as CBNote } from "@/components/ui/confidentiality-banner";

export default function CounsellingPage() {
  return (
    <AnimatedPage>
      <PageHeader title="Counselling" description="Aggregate counselling metrics — individual session data is unit-confidential" badge="Support Unit" />
      <ConfidentialityBanner unit="counselling" />
      <div className="grid gap-5 grid-cols-1 sm:grid-cols-4">
        <MiniStatCard icon={Users} value="1" label="Counselling Head" />
        <MiniStatCard icon={Users} value="3" label="Sessions This Cycle" />
        <MiniStatCard icon={TrendingUp} value="42%" label="Engagement Rate" color="text-blue-600" />
        <MiniStatCard icon={HeartHandshake} value="2" label="Unique Students" />
      </div>
      <AnimatedSection className="rounded-2xl border bg-white p-8 shadow-sm text-center">
        <HeartHandshake className="w-12 h-12 text-[#A93C40]/30 mx-auto mb-4" />
        <p className="text-lg font-semibold text-[#1A2B4A]">No Individual Booking Data Available</p>
        <p className="text-sm text-[#6B7280] mt-2 max-w-md mx-auto">Counselling sessions are confidential between students and the counselling head. Aggregate metrics only are shown here.</p>
      </AnimatedSection>
    </AnimatedPage>
  );
}