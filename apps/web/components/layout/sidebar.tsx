"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  Calendar,
  GraduationCap,
  HeartHandshake,
  Handshake,
  Building2,
  LifeBuoy,
  Megaphone,
  CalendarDays,
  BarChart3,
  Bell,
  FileText,
  Settings,
  ChevronLeft,
  GraduationCapIcon,
  ChevronDown,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const navGroups = [
  {
    label: "Overview",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "Administration",
    items: [
      { href: "/dashboard/users", label: "Users & Roles", icon: Users },
      { href: "/dashboard/academic-years", label: "Academic Years", icon: Calendar },
    ],
  },
  {
    label: "Support Units",
    items: [
      { href: "/dashboard/coaching", label: "Coaching", icon: GraduationCap },
      { href: "/dashboard/counselling", label: "Counselling", icon: HeartHandshake },
      { href: "/dashboard/advising", label: "Advising", icon: GraduationCap },
      { href: "/dashboard/buddy-up", label: "Buddy Up", icon: Handshake },
    ],
  },
  {
    label: "Content",
    items: [
      { href: "/dashboard/clubs", label: "Clubs", icon: Building2 },
      { href: "/dashboard/help-center", label: "Help Center", icon: LifeBuoy },
      { href: "/dashboard/feed", label: "Feed & Announcements", icon: Megaphone },
      { href: "/dashboard/events", label: "Events", icon: CalendarDays },
    ],
  },
  {
    label: "Insights",
    items: [
      { href: "/dashboard/analytics", label: "Analytics & Reports", icon: BarChart3 },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/dashboard/notifications", label: "Notifications", icon: Bell },
      { href: "/dashboard/audit-log", label: "Audit Log", icon: FileText },
      { href: "/dashboard/settings", label: "Settings", icon: Settings },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <motion.aside
      initial={false}
      animate={collapsed ? { width: 64 } : { width: 256 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="h-screen sticky top-0 flex flex-col border-r bg-white shadow-sm z-40 overflow-hidden"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b shrink-0">
        <motion.div
          whileHover={{ scale: 1.05, rotate: -5 }}
          className="w-9 h-9 rounded-xl bg-[#A93C40] flex items-center justify-center shrink-0 shadow-md shadow-[#A93C40]/20"
        >
          <GraduationCapIcon className="w-5 h-5 text-white" />
        </motion.div>
        <motion.span
          animate={{ opacity: collapsed ? 0 : 1, x: collapsed ? -10 : 0 }}
          transition={{ duration: 0.2 }}
          className="font-bold text-lg text-[#1A2B4A] truncate"
        >
          Fresher Hub
        </motion.span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-5">
        {navGroups.map((group) => (
          <div key={group.label}>
            {!collapsed && (
              <p className="px-3 text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider mb-1.5">
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative group",
                      isActive
                        ? "text-white"
                        : "text-[#6B7280] hover:text-[#1A2B4A] hover:bg-[#f8f4ef]"
                    )}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeNav"
                        className="absolute inset-0 bg-[#A93C40] rounded-xl shadow-md shadow-[#A93C40]/20"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    )}
                    <item.icon className="w-5 h-5 shrink-0 relative z-10" />
                    {!collapsed && (
                      <span className="relative z-10 font-semibold tracking-tight">
                        {item.label}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Collapse toggle */}
      <div className="p-3 border-t border-[#f3f4f6]">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center w-full py-2.5 rounded-xl text-[#6B7280] hover:text-[#1A2B4A] hover:bg-[#f8f4ef] transition-colors cursor-pointer"
        >
          <motion.div animate={{ rotate: collapsed ? 180 : 0 }} transition={{ duration: 0.3 }}>
            <ChevronLeft className="w-5 h-5" />
          </motion.div>
        </motion.button>
      </div>
    </motion.aside>
  );
}