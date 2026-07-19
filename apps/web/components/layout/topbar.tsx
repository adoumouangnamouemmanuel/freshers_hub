"use client";

import { useState } from "react";
import { Search, Bell, ChevronDown, User, GraduationCapIcon, LogOut, Settings } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Topbar() {
  const [showProfile, setShowProfile] = useState(false);
  const [academicYear, setAcademicYear] = useState("2026/2027");

  return (
    <header className="h-16 border-b bg-white flex items-center justify-between px-6 shrink-0">
      {/* Left: Search */}
      <div className="relative w-80">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF] pointer-events-none" />
        <input
          type="text"
          placeholder="Search users, clubs, offices..."
          className="w-full pl-10 pr-4 py-2 rounded-xl border border-[#e5e7eb] bg-[#f8f4ef]/50 text-sm focus:outline-none focus:ring-2 focus:ring-[#A93C40]/20 focus:border-[#A93C40] focus:bg-white transition-all placeholder:text-[#9CA3AF]"
        />
      </div>

      {/* Right: Year selector, Notifications, Profile */}
      <div className="flex items-center gap-4">
        {/* Academic Year Selector */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#f8f4ef] border border-[#e5e7eb] text-sm">
          <GraduationCapIcon className="w-4 h-4 text-[#A93C40]" />
          <select
            value={academicYear}
            onChange={(e) => setAcademicYear(e.target.value)}
            className="bg-transparent border-none text-sm font-medium text-[#1A2B4A] focus:outline-none cursor-pointer"
          >
            <option>2025/2026</option>
            <option>2026/2027</option>
            <option>2027/2028</option>
          </select>
        </div>

        {/* Notifications */}
        <button className="relative p-2 rounded-xl hover:bg-[#f8f4ef] transition-colors cursor-pointer">
          <Bell className="w-5 h-5 text-[#6B7280]" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#A93C40]" />
        </button>

        {/* Profile */}
        <div className="relative">
          <button
            onClick={() => setShowProfile(!showProfile)}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-[#f8f4ef] transition-colors cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#A93C40] to-[#d46a6e] flex items-center justify-center text-white text-sm font-bold">
              PA
            </div>
            <span className="text-sm font-medium text-[#1A2B4A] hidden sm:block">Platform Admin</span>
            <ChevronDown className="w-4 h-4 text-[#6B7280]" />
          </button>

          <AnimatePresence>
            {showProfile && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-56 rounded-2xl border bg-white shadow-xl z-50 overflow-hidden"
              >
                <div className="p-4 border-b border-[#f3f4f6]">
                  <p className="font-semibold text-[#1A2B4A] text-sm">Platform Admin</p>
                  <p className="text-xs text-[#6B7280]">admin@ashesi.edu.gh</p>
                </div>
                <div className="p-2">
                  {[
                    { icon: User, label: "My Profile" },
                    { icon: Settings, label: "Account Settings" },
                    { icon: LogOut, label: "Sign Out", danger: true },
                  ].map((item) => (
                    <button
                      key={item.label}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                        item.danger
                          ? "text-red-600 hover:bg-red-50"
                          : "text-[#1A2B4A] hover:bg-[#f8f4ef]"
                      }`}
                    >
                      <item.icon className="w-4 h-4" />
                      {item.label}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}