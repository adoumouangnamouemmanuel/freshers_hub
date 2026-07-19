"use client";

import { useState } from "react";
import { Send, Users, Bell, Megaphone, Eye } from "lucide-react";
import { AnimatedPage, AnimatedSection } from "@/components/ui/animated-container";
import { PageHeader } from "@/components/ui/page-header";

const targetGroups = [
  { id: "all", label: "All Users", count: 22 },
  { id: "students", label: "All Students", count: 15 },
  { id: "peer_coaches", label: "Peer Coaches", count: 4 },
  { id: "staff", label: "Staff / Unit Heads", count: 5 },
  { id: "club_leads", label: "Club Leads", count: 2 },
  { id: "class_2029", label: "Class of 2029", count: 15 },
];

const templates = [
  { id: "1", title: "Session Reminder", body: "This is a reminder that you have an upcoming session scheduled..." },
  { id: "2", title: "Compliance Warning", body: "You have not completed the required number of sessions for this semester..." },
  { id: "3", title: "Welcome Message", body: "Welcome to Fresher Hub! We're excited to have you on board..." },
];

export default function BroadcastPage() {
  const [selectedTarget, setSelectedTarget] = useState("all");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  return (
    <AnimatedPage>
      <PageHeader
        title="Broadcast"
        description="Send notifications and announcements to targeted user groups"
        badge="Super Admin"
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Compose */}
        <AnimatedSection className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-[#1A2B4A] mb-4">Compose Message</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#6B7280] mb-1.5">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Notification title..."
                  className="w-full px-4 py-3 rounded-xl border border-[#e5e7eb] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#A93C40]/20 focus:border-[#A93C40] transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#6B7280] mb-1.5">Message</label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Write your message..."
                  rows={6}
                  className="w-full px-4 py-3 rounded-xl border border-[#e5e7eb] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#A93C40]/20 focus:border-[#A93C40] transition-all resize-none"
                />
              </div>
              <div className="flex items-center justify-between pt-2">
                <span className="text-sm text-[#6B7280]">Preview: <span className="font-semibold">{body.length}</span> characters</span>
                <div className="flex gap-3">
                  <button className="px-5 py-2.5 rounded-xl border border-[#e5e7eb] text-[#6B7280] text-sm font-semibold hover:bg-[#f8f4ef] transition-colors cursor-pointer">
                    Save as Template
                  </button>
                  <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#A93C40] text-white text-sm font-semibold hover:bg-[#A93C40]/90 transition-colors shadow-md shadow-[#A93C40]/20 cursor-pointer">
                    <Send className="w-4 h-4" />
                    Send Broadcast
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Templates */}
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-[#1A2B4A] mb-4">Message Templates</h2>
            <div className="space-y-3">
              {templates.map((t) => (
                <div
                  key={t.id}
                  className="p-4 rounded-xl border border-[#e5e7eb] hover:bg-[#f8f4ef] transition-colors cursor-pointer"
                  onClick={() => { setTitle(t.title); setBody(t.body); }}
                >
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-[#1A2B4A]">{t.title}</p>
                    <Eye className="w-4 h-4 text-[#6B7280]" />
                  </div>
                  <p className="text-sm text-[#6B7280] mt-1 line-clamp-1">{t.body}</p>
                </div>
              ))}
            </div>
          </div>
        </AnimatedSection>

        {/* Target Selection */}
        <AnimatedSection className="space-y-6">
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <Users className="w-5 h-5 text-[#A93C40]" />
              <h2 className="text-lg font-semibold text-[#1A2B4A]">Target Audience</h2>
            </div>
            <div className="space-y-2">
              {targetGroups.map((group) => (
                <button
                  key={group.id}
                  onClick={() => setSelectedTarget(group.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl text-sm transition-all cursor-pointer ${
                    selectedTarget === group.id
                      ? "bg-[#A93C40]/5 text-[#A93C40] border border-[#A93C40]/20"
                      : "hover:bg-[#f8f4ef] text-[#1A2B4A] border border-transparent"
                  }`}
                >
                  <span className="font-medium">{group.label}</span>
                  <span className="text-xs bg-[#f3f4f6] px-2 py-0.5 rounded-full font-semibold">
                    {group.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <Bell className="w-5 h-5 text-[#A93C40]" />
              <h2 className="text-lg font-semibold text-[#1A2B4A]">Notification Type</h2>
            </div>
            <div className="space-y-2">
              {[
                { id: "push", label: "Push Notification", icon: Bell },
                { id: "inapp", label: "In-App Alert", icon: Bell },
                { id: "email", label: "Email", icon: Send },
              ].map((type) => (
                <label
                  key={type.id}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#f8f4ef] transition-colors cursor-pointer"
                >
                  <input type="radio" name="notif-type" defaultChecked={type.id === "push"} className="accent-[#A93C40]" />
                  <span className="text-sm font-medium text-[#1A2B4A]">{type.label}</span>
                </label>
              ))}
            </div>
          </div>
        </AnimatedSection>
      </div>
    </AnimatedPage>
  );
}