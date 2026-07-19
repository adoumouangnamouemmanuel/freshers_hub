"use client";

import { useState } from "react";
import { Save, Calendar, Bell, Shield, Palette, Globe, Key, Wifi } from "lucide-react";
import { AnimatedPage, AnimatedSection } from "@/components/ui/animated-container";
import { PageHeader } from "@/components/ui/page-header";

export default function SettingsPage() {
  const [academicYear, setAcademicYear] = useState("2026/2027");
  const [sessionReminders, setSessionReminders] = useState(true);
  const [complianceAlerts, setComplianceAlerts] = useState(true);
  const [autoSync, setAutoSync] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  return (
    <AnimatedPage>
      <PageHeader
        title="Settings"
        description="Platform-wide configuration — branding, integrations, and admin management"
        badge="System"
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Academic Settings */}
        <AnimatedSection className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-[#A93C40]/10 flex items-center justify-center"><Calendar className="w-5 h-5 text-[#A93C40]" /></div>
            <h2 className="text-lg font-semibold text-[#1A2B4A]">Academic Settings</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#6B7280] mb-1.5">Current Academic Year</label>
              <select value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-[#e5e7eb] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#A93C40]/20 focus:border-[#A93C40] transition-all cursor-pointer">
                <option>2025/2026</option><option>2026/2027</option><option>2027/2028</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#6B7280] mb-1.5">Required Coaching Sessions</label>
              <input type="number" defaultValue={3} className="w-full px-4 py-3 rounded-xl border border-[#e5e7eb] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#A93C40]/20 focus:border-[#A93C40] transition-all" />
            </div>
          </div>
        </AnimatedSection>

        {/* Integrations */}
        <AnimatedSection className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-[#A93C40]/10 flex items-center justify-center"><Wifi className="w-5 h-5 text-[#A93C40]" /></div>
            <h2 className="text-lg font-semibold text-[#1A2B4A]">Integrations</h2>
          </div>
          <div className="space-y-4">
            {[
              { label: "WhatsApp Redirect", desc: "wa.me link tracking enabled", status: "operational" },
              { label: "Push Notification Service", desc: "Expo push service connected", status: "operational" },
              { label: "ODIP API", desc: "Buddy matching system", status: "operational", key: "sk-odip-••••••••" },
              { label: "Map Provider", desc: "Mapbox / Google Maps", status: "operational" },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between p-3 rounded-xl hover:bg-[#f8f4ef] transition-colors">
                <div>
                  <p className="text-sm font-medium text-[#1A2B4A]">{item.label}</p>
                  <p className="text-xs text-[#6B7280]">{item.desc}</p>
                  {item.key && <p className="text-xs font-mono text-[#9CA3AF] mt-0.5">{item.key}</p>}
                </div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> {item.status}
                </span>
              </div>
            ))}
          </div>
        </AnimatedSection>

        {/* Notification Defaults */}
        <AnimatedSection className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-[#A93C40]/10 flex items-center justify-center"><Bell className="w-5 h-5 text-[#A93C40]" /></div>
            <h2 className="text-lg font-semibold text-[#1A2B4A]">Notification Defaults</h2>
          </div>
          <div className="space-y-3">
            {[
              { label: "Session Reminders", desc: "Push notifications for upcoming sessions", checked: sessionReminders, onChange: setSessionReminders },
              { label: "Compliance Alerts", desc: "Warnings when sessions are overdue", checked: complianceAlerts, onChange: setComplianceAlerts },
              { label: "ODIP Auto-Sync", desc: "Nightly sync with ODIP buddy system", checked: autoSync, onChange: setAutoSync },
            ].map((item) => (
              <label key={item.label} className="flex items-center justify-between p-3 rounded-xl hover:bg-[#f8f4ef] transition-colors cursor-pointer">
                <div>
                  <p className="text-sm font-medium text-[#1A2B4A]">{item.label}</p>
                  <p className="text-xs text-[#6B7280]">{item.desc}</p>
                </div>
                <div onClick={() => item.onChange(!item.checked)} className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${item.checked ? "bg-[#A93C40]" : "bg-[#e5e7eb]"}`}>
                  <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${item.checked ? "translate-x-5" : "translate-x-0"}`} />
                </div>
              </label>
            ))}
          </div>
        </AnimatedSection>

        {/* Security & Admin */}
        <AnimatedSection className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-[#A93C40]/10 flex items-center justify-center"><Shield className="w-5 h-5 text-[#A93C40]" /></div>
            <h2 className="text-lg font-semibold text-[#1A2B4A]">Security & Admin</h2>
          </div>
          <div className="space-y-4">
            <label className="flex items-center justify-between p-3 rounded-xl hover:bg-[#f8f4ef] transition-colors cursor-pointer">
              <div>
                <p className="text-sm font-medium text-[#1A2B4A]">Maintenance Mode</p>
                <p className="text-xs text-[#6B7280]">Block user access during maintenance</p>
              </div>
              <div onClick={() => setMaintenanceMode(!maintenanceMode)} className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${maintenanceMode ? "bg-red-500" : "bg-[#e5e7eb]"}`}>
                <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${maintenanceMode ? "translate-x-5" : "translate-x-0"}`} />
              </div>
            </label>
            <div>
              <label className="block text-sm font-medium text-[#6B7280] mb-1.5">Session Timeout (minutes)</label>
              <input type="number" defaultValue={60} className="w-full px-4 py-3 rounded-xl border border-[#e5e7eb] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#A93C40]/20 focus:border-[#A93C40] transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#6B7280] mb-1.5">Other Platform Admins</label>
              <div className="flex items-center gap-2 p-3 rounded-xl bg-[#f8f4ef]">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#A93C40] to-[#d46a6e] flex items-center justify-center text-white text-xs font-bold">PA</div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-[#1A2B4A]">Platform Admin</p>
                  <p className="text-xs text-[#6B7280]">admin@ashesi.edu.gh</p>
                </div>
                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">You</span>
              </div>
            </div>
          </div>
        </AnimatedSection>
      </div>

      <AnimatedSection className="flex justify-end">
        <button className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#A93C40] text-white text-sm font-semibold hover:bg-[#A93C40]/90 transition-colors shadow-md shadow-[#A93C40]/20 cursor-pointer">
          <Save className="w-4 h-4" /> Save All Settings
        </button>
      </AnimatedSection>
    </AnimatedPage>
  );
}