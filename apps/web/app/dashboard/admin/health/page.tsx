"use client";

import { Activity, Database, Server, Wifi, Clock, HardDrive, RefreshCw, CheckCircle2, AlertTriangle } from "lucide-react";
import { AnimatedPage, AnimatedSection } from "@/components/ui/animated-container";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";

const services = [
  { name: "PostgreSQL Database", icon: Database, status: "operational", uptime: "99.97%", latency: "2ms" },
  { name: "Backend API", icon: Server, status: "operational", uptime: "99.99%", latency: "45ms" },
  { name: "ODIP Sync Service", icon: RefreshCw, status: "operational", uptime: "99.85%", latency: "1.2s" },
  { name: "Push Notifications", icon: Wifi, status: "operational", uptime: "99.95%", latency: "150ms" },
  { name: "Object Storage", icon: HardDrive, status: "degraded", uptime: "98.50%", latency: "320ms" },
  { name: "Background Jobs", icon: Clock, status: "operational", uptime: "99.90%", latency: "—" },
];

const recentIncidents = [
  { id: "1", title: "Storage Latency Spike", date: "2026-10-14", duration: "12 min", status: "resolved" },
  { id: "2", title: "ODIP Sync Timeout", date: "2026-10-10", duration: "4 min", status: "resolved" },
  { id: "3", title: "API Response Degradation", date: "2026-10-05", duration: "8 min", status: "resolved" },
];

export default function HealthPage() {
  return (
    <AnimatedPage>
      <PageHeader
        title="System Health"
        description="Monitor platform services, uptime, and incident history"
        badge="Super Admin"
      />

      {/* Overall Status */}
      <AnimatedSection className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-emerald-50 flex items-center justify-center">
              <Activity className="w-7 h-7 text-emerald-600" />
            </div>
            <div>
              <p className="text-lg font-semibold text-[#1A2B4A]">All Systems Operational</p>
              <p className="text-sm text-[#6B7280]">99.9% uptime over the last 30 days</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-sm font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Operational
          </span>
        </div>
      </AnimatedSection>

      {/* Services Grid */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((service, i) => (
          <AnimatedSection key={service.name}>
            <div className="rounded-2xl border bg-white p-5 shadow-sm hover:shadow-lg transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    service.status === "operational" ? "bg-emerald-50" : "bg-amber-50"
                  }`}>
                    <service.icon className={`w-5 h-5 ${
                      service.status === "operational" ? "text-emerald-600" : "text-amber-600"
                    }`} />
                  </div>
                  <div>
                    <p className="font-semibold text-[#1A2B4A] text-sm">{service.name}</p>
                    <p className="text-xs text-[#6B7280]">Uptime: {service.uptime}</p>
                  </div>
                </div>
                <StatusBadge
                  status={service.status === "operational" ? "active" : "warning"}
                  showDot
                />
              </div>
              <div className="flex items-center justify-between text-xs text-[#6B7280] pt-3 border-t border-[#f3f4f6]">
                <span>Latency: {service.latency}</span>
                <span className="font-medium text-[#1A2B4A]">{service.uptime} uptime</span>
              </div>
            </div>
          </AnimatedSection>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-4">
        {[
          { label: "API Requests (24h)", value: "12,847", icon: Activity },
          { label: "Active Users", value: "156", icon: Server },
          { label: "Avg Response Time", value: "42ms", icon: Clock },
          { label: "Error Rate", value: "0.02%", icon: AlertTriangle },
        ].map((item) => (
          <AnimatedSection key={item.label}>
            <div className="rounded-2xl border bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#A93C40]/10 flex items-center justify-center">
                  <item.icon className="w-5 h-5 text-[#A93C40]" />
                </div>
                <div>
                  <p className="text-lg font-bold text-[#1A2B4A]">{item.value}</p>
                  <p className="text-xs text-[#6B7280]">{item.label}</p>
                </div>
              </div>
            </div>
          </AnimatedSection>
        ))}
      </div>

      {/* Incidents */}
      <AnimatedSection className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <div className="p-6 border-b border-[#f3f4f6]">
          <h2 className="text-lg font-semibold text-[#1A2B4A]">Recent Incidents</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#f3f4f6] bg-[#f8f4ef]/50">
                {["Incident", "Date", "Duration", "Status"].map((h) => (
                  <th key={h} className="text-left p-4 font-semibold text-[#6B7280] text-xs uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentIncidents.map((inc) => (
                <tr key={inc.id} className="border-b last:border-0 hover:bg-[#f8f4ef]/50 transition-colors">
                  <td className="p-4 font-medium text-[#1A2B4A]">{inc.title}</td>
                  <td className="p-4 text-[#6B7280]">{inc.date}</td>
                  <td className="p-4 text-[#6B7280]">{inc.duration}</td>
                  <td className="p-4"><StatusBadge status="success" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AnimatedSection>
    </AnimatedPage>
  );
}