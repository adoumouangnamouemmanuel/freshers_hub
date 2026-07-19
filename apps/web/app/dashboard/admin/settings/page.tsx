"use client";

import { useState } from "react";
import { Settings, Save, Calendar, Bell, Shield, Globe, Palette } from "lucide-react";
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
        description="Configure platform-wide settings and preferences"
        badge="Super Admin"
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Academic Settings */}
        <AnimatedSection className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-[#A93C40]/10 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-[#A93C40]" />
            </div>
            <h2 className="text-lg font-semibold text-[#1A2B4A]">Academic Settings</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#6B7280] mb-1.5">Current Academic Year</label>
              <select
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-[#e5e7eb] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#A93C40]/20 focus:border-[#A93C40] transition-all cursor-pointer"
              >
                <option>2025/2026</option>
                <option>2026/2027</option>
                <option>2027/2028</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#6B7280] mb-1.5">Required Coaching Sessions</label>
              <input type="number" defaultValue={3} className="w-full px-4 py-3 rounded-xl border border-[#e5e7eb] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#A93C40]/20 focus:border-[#A93C40] transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#6B7280] mb-1.5">Session Reminder Timing</label>
              <select className="w-full px-4 py-3 rounded-xl border border-[#e5e7eb] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#A93C40]/20 focus:border-[#A93C40] transition-all cursor-pointer">
                <option>24 hours before</option>
                <option>12 hours before</option>
                <option>2 hours before</option>
              </select>
            </div>
          </div>
        </AnimatedSection>

        {/* Notification Settings */}
        <AnimatedSection className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-[#A93C40]/10 flex items-center justify-center">
              <Bell className="w-5 h-5 text-[#A93C40]" />
            </div>
            <h2 className="text-lg font-semibold text-[#1A2B4A]">Notification Defaults</h2>
          </div>
          <div className="space-y-4">
            {[
              { label: "Session Reminders", desc: "Push notifications for upcoming sessions", checked: sessionReminders, onChange: setSessionReminders },
              { label: "Compliance Alerts", desc: "Warnings when sessions are overdue", checked: complianceAlerts, onChange: setComplianceAlerts },
              { label: "ODIP Auto-Sync", desc: "Nightly sync with ODIP buddy system", checked: autoSync, onChange: setAutoSync },
            ].map((item) => (
              <label key={item.label} className="flex items-center justify-between p-4 rounded-xl hover:bg-[#f8f4ef] transition-colors cursor-pointer">
                <div>
                  <p className="font-medium text-[#1A2B4A] text-sm">{item.label}</p>
                  <p className="text-xs text-[#6B7280]">{item.desc}</p>
                </div>
                <div
                  onClick={() => item.onChange(!item.checked)}
                  className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${
                    item.checked ? "bg-[#A93C40]" : "bg-[#e5e7eb]"
                  }`}
                >
                  <div
                    className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                      item.checked ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </div>
              </label>
            ))}
          </div>
        </AnimatedSection>

        {/* Security */}
        <AnimatedSection className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-[#A93C40]/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-[#A93C40]" />
            </div>
            <h2 className="text-lg font-semibold text-[#1A2B4A]">Security</h2>
          </div>
          <div className="space-y-4">
            <label className="flex items-center justify-between p-4 rounded-xl hover:bg-[#f8f4ef] transition-colors cursor-pointer">
              <div>
                <p className="font-medium text-[#1A2B4A] text-sm">Maintenance Mode</p>
                <p className="text-xs text-[#6B7280]">Block user access during maintenance</p>
              </div>
              <div
                onClick={() => setMaintenanceMode(!maintenanceMode)}
                className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${
                  maintenanceMode ? "bg-red-500" : "bg-[#e5e7eb]"
                }`}
              >
                <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${maintenanceMode ? "translate-x-5" : "translate-x-0"}`} />
              </div>
            </label>
            <div>
              <label className="block text-sm font-medium text-[#6B7280] mb-1.5">Session Timeout (minutes)</label>
              <input type="number" defaultValue={60} className="w-full px-4 py-3 rounded-xl border border-[#e5e7eb] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#A93C40]/20 focus:border-[#A93C40] transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#6B7280] mb-1.5">Max Login Attempts</label>
              <input type="number" defaultValue={5} className="w-full px-4 py-3 rounded-xl border border-[#e5e7eb] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#A93C40]/20 focus:border-[#A93C40] transition-all" />
            </div>
          </div>
        </AnimatedSection>

        {/* Appearance */}
        <AnimatedSection className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-[#A93C40]/10 flex items-center justify-center">
              <Palette className="w-5 h-5 text-[#A93C40]" />
            </div>
            <h2 className="text-lg font-semibold text-[#1A2B4A]">Appearance</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#6B7280] mb-1.5">Theme</label>
              <select className="w-full px-4 py-3 rounded-xl border border-[#e5e7eb] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#A93C40]/20 focus:border-[#A93C40] transition-all cursor-pointer">
                <option>Light</option>
                <option>Dark</option>
                <option>System</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#6B7280] mb-1.5">Language</label>
              <select className="w-full px-4 py-3 rounded-xl border border-[#e5e7eb] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#A93C40]/20 focus:border-[#A93C40] transition-all cursor-pointer">
                <option>English</option>
                <option>French</option>
                <option>Twi</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#6B7280] mb-1.5">Date Format</label>
              <select className="w-full px-4 py-3 rounded-xl border border-[#e5e7eb] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#A93C40]/20 focus:border-[#A93C40] transition-all cursor-pointer">
                <option>DD/MM/YYYY</option>
                <option>MM/DD/YYYY</option>
                <option>YYYY-MM-DD</option>
              </select>
            </div>
          </div>
        </AnimatedSection>
      </div>

      {/* Save Button */}
      <AnimatedSection className="flex justify-end">
        <button className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#A93C40] text-white text-sm font-semibold hover:bg-[#A93C40]/90 transition-colors shadow-md shadow-[#A93C40]/20 cursor-pointer">
          <Save className="w-4 h-4" />
          Save All Settings
        </button>
      </AnimatedSection>
    </AnimatedPage>
  );
}