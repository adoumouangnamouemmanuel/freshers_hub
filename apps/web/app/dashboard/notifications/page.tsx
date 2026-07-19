"use client";

import { Bell, Send, Eye, TrendingUp, Settings } from "lucide-react";
import { AnimatedPage, AnimatedSection } from "@/components/ui/animated-container";
import { PageHeader } from "@/components/ui/page-header";
import { MiniStatCard } from "@/components/ui/card";

const categories = [
  { name: "Session Reminders", sent: 1248, opened: 892, rate: "71%", enabled: true },
  { name: "Announcements", sent: 456, opened: 378, rate: "83%", enabled: true },
  { name: "Club Activity", sent: 234, opened: 156, rate: "67%", enabled: true },
  { name: "Compliance Nudges", sent: 89, opened: 72, rate: "81%", enabled: true },
  { name: "Buddy Up", sent: 167, opened: 98, rate: "59%", enabled: false },
];

export default function NotificationsPage() {
  return (
    <AnimatedPage>
      <PageHeader
        title="Notifications"
        description="Platform-level notification management and delivery analytics"
        badge="System"
      />

      <div className="grid gap-5 grid-cols-1 sm:grid-cols-4">
        <MiniStatCard icon={Send} value="2,194" label="Total Sent" color="text-blue-600" />
        <MiniStatCard icon={Eye} value="1,596" label="Total Opened" color="text-emerald-600" />
        <MiniStatCard icon={TrendingUp} value="73%" label="Avg Open Rate" color="text-amber-600" />
        <MiniStatCard icon={Bell} value="5" label="Categories" color="text-purple-600" />
      </div>

      <AnimatedSection className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <div className="p-6 border-b border-[#f3f4f6]">
          <h2 className="text-lg font-semibold text-[#1A2B4A]">Notification Categories</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#f3f4f6] bg-[#f8f4ef]/50">
                {["Category", "Sent", "Opened", "Open Rate", "Status"].map((h) => (
                  <th key={h} className="text-left p-4 font-semibold text-[#6B7280] text-xs uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {categories.map((cat, i) => (
                <tr key={cat.name} className="border-b last:border-0 hover:bg-[#f8f4ef]/50 transition-colors">
                  <td className="p-4 font-medium text-[#1A2B4A]">{cat.name}</td>
                  <td className="p-4 text-[#6B7280]">{cat.sent.toLocaleString()}</td>
                  <td className="p-4 text-[#6B7280]">{cat.opened.toLocaleString()}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-[#f3f4f6] rounded-full h-1.5 overflow-hidden">
                        <div className="h-1.5 rounded-full bg-emerald-500" style={{ width: cat.rate }} />
                      </div>
                      <span className="font-medium text-emerald-600 text-xs">{cat.rate}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked={cat.enabled} className="sr-only peer" />
                      <div className="w-9 h-5 bg-[#e5e7eb] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#A93C40]" />
                    </label>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AnimatedSection>
    </AnimatedPage>
  );
}