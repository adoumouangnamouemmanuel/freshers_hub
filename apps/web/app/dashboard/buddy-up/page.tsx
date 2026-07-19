"use client";

import { Handshake, Users, RefreshCw, TrendingUp } from "lucide-react";
import { AnimatedPage, AnimatedSection } from "@/components/ui/animated-container";
import { PageHeader } from "@/components/ui/page-header";
import { MiniStatCard } from "@/components/ui/card";
import { ConfidentialityBanner } from "@/components/ui/confidentiality-banner";

export default function BuddyUpPage() {
  return (
    <AnimatedPage>
      <PageHeader title="Buddy Up" description="Aggregate ODIP buddy pairing metrics — individual pair data is unit-confidential" badge="Support Unit" />
      <ConfidentialityBanner unit="buddy up" />
      <div className="grid gap-5 grid-cols-1 sm:grid-cols-4">
        <MiniStatCard icon={Users} value="10" label="Active Pairings" />
        <MiniStatCard icon={Users} value="10" label="Unique Freshers" />
        <MiniStatCard icon={TrendingUp} value="73%" label="WhatsApp Contact Rate" color="text-emerald-600" />
        <MiniStatCard icon={RefreshCw} value="2 days ago" label="Last Sync" color="text-blue-600" />
      </div>
      <AnimatedSection className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-[#1A2B4A]">ODIP Sync Status</p>
            <p className="text-sm text-[#6B7280]">Last synced: August 20, 2026 — All pairings up to date</p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500" /> Synced
          </span>
        </div>
      </AnimatedSection>
    </AnimatedPage>
  );
}