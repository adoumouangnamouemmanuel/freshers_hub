"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
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
      animate={{ width: collapsed ? 80 : 280 }}
      transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
      className="h-full flex flex-col glass-panel rounded-[var(--radius-xl)] overflow-hidden"
    >
      {/* Brand Header */}
      <div className="flex items-center gap-3.5 px-5 h-[76px] border-b border-border shrink-0">
        <motion.div
          whileHover={{ scale: 1.05, rotate: -10 }}
          className="w-10 h-10 rounded-[14px] bg-primary flex items-center justify-center shrink-0 glow-primary"
        >
          <GraduationCapIcon className="w-5 h-5 text-white" />
        </motion.div>
        
        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden whitespace-nowrap"
            >
              <h1 className="font-heading font-bold text-xl text-foreground">
                Fresher <span className="text-primary">Hub</span>
              </h1>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-6">
        {navGroups.map((group) => (
          <div key={group.label} className="relative">
            {/* Group Label */}
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="px-3 mb-2"
              >
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                  {group.label}
                </p>
              </motion.div>
            )}

            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3.5 px-3 py-3 rounded-[14px] font-medium transition-colors relative group outline-none focus-visible:ring-2",
                      isActive 
                        ? "text-primary-foreground" 
                        : "text-muted-foreground hover:text-foreground",
                      collapsed && "justify-center"
                    )}
                    title={collapsed ? item.label : undefined}
                  >
                    {/* Active State Pill Background using Framer layoutId for fluid animation between routes */}
                    {isActive && (
                      <motion.div
                        layoutId="activeNavIndicator"
                        className="absolute inset-0 bg-primary rounded-[14px] glow-primary"
                        transition={{ type: "spring", stiffness: 350, damping: 30 }}
                      />
                    )}

                    <item.icon 
                      className={cn(
                        "w-5 h-5 shrink-0 relative z-10 transition-transform group-hover:scale-110",
                        !isActive && "opacity-80"
                      )} 
                    />

                    <AnimatePresence initial={false}>
                      {!collapsed && (
                        <motion.span
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: "auto" }}
                          exit={{ opacity: 0, width: 0 }}
                          className="relative z-10 text-[14px] tracking-wide whitespace-nowrap overflow-hidden"
                        >
                          {item.label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer / Toggle */}
      <div className="p-4 border-t border-border shrink-0">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "flex items-center w-full py-3 rounded-[14px] text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors cursor-pointer",
            collapsed ? "justify-center" : "px-4 gap-3"
          )}
        >
          <motion.div animate={{ rotate: collapsed ? 180 : 0 }} transition={{ duration: 0.3 }}>
            <ChevronLeft className="w-5 h-5" />
          </motion.div>
          
          <AnimatePresence initial={false}>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                className="text-[14px] font-medium whitespace-nowrap"
              >
                Collapse menu
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </motion.aside>
  );
}