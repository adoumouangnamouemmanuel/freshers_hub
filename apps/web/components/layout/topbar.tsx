"use client";

import { useState } from "react";
import { Search, Bell, ChevronDown, User, GraduationCapIcon, LogOut, Settings, Command } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Topbar() {
  const [academicYear, setAcademicYear] = useState("2026/2027");
  const [open, setOpen] = useState(false);

  return (
    <header className="h-[76px] glass-panel rounded-[var(--radius-xl)] flex items-center justify-between px-6 shrink-0 w-full relative z-30">
      {/* Left: Command Palette Trigger */}
      <div className="relative w-96 group">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center text-muted-foreground group-focus-within:text-primary transition-colors">
          <Search className="w-[18px] h-[18px]" />
        </div>
        
        <input
          type="text"
          placeholder="Search for students, clubs, or reports..."
          className="w-full pl-12 pr-16 py-3 rounded-[14px] bg-secondary/50 border border-transparent text-[14px] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-background transition-all placeholder:text-muted-foreground font-medium"
        />
        
        {/* Keyboard shortcut hint */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
          <kbd className="inline-flex items-center justify-center h-6 px-1.5 rounded-md bg-background border border-border text-[10px] font-semibold text-muted-foreground">
            <Command className="w-3 h-3 mr-0.5" /> K
          </kbd>
        </div>
      </div>

      {/* Right: Actions & Profile */}
      <div className="flex items-center gap-5">
        {/* Academic Year Selector (Premium Pill) */}
        <DropdownMenu>
          <DropdownMenuTrigger render={
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-secondary/80 border border-border text-sm transition-colors hover:bg-secondary cursor-pointer outline-none"
            />
          }>
            <GraduationCapIcon className="w-4 h-4 text-primary" />
            <span className="text-[13px] font-bold text-foreground tracking-wide">{academicYear}</span>
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground ml-0.5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-40 rounded-[20px] glass-dropdown bg-white/85 dark:bg-slate-900/85 border-white/20 dark:border-white/10 p-2 shadow-xl" align="start" sideOffset={8}>
            <DropdownMenuGroup className="space-y-1">
              {["2025/2026", "2026/2027", "2027/2028"].map((year) => (
                <DropdownMenuItem 
                  key={year}
                  onClick={() => setAcademicYear(year)}
                  className={cn(
                    "flex items-center justify-between px-3 py-2.5 rounded-[12px] text-[13px] font-medium cursor-pointer transition-all duration-200",
                    academicYear === year 
                      ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20" 
                      : "text-muted-foreground hover:bg-primary/10 hover:text-primary focus:bg-primary/10 focus:text-primary"
                  )}
                >
                  {year}
                  {academicYear === year && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-1.5 h-1.5 rounded-full bg-current" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Notifications */}
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative p-2.5 rounded-full bg-secondary/80 border border-border hover:bg-secondary hover:text-foreground text-muted-foreground transition-colors cursor-pointer"
        >
          <Bell className="w-[18px] h-[18px]" />
          {/* Active notification indicator */}
          <span className="absolute top-[7px] right-[8px] w-2 h-2 rounded-full bg-primary border-2 border-card" />
        </motion.button>

        <div className="w-[1px] h-8 bg-border mx-1" />

        {/* Reusable Radix Dropdown Menu */}
        <DropdownMenu open={open} onOpenChange={setOpen}>
          <DropdownMenuTrigger render={
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "flex items-center gap-3 p-1.5 pr-4 rounded-full border transition-all cursor-pointer outline-none",
                open ? "bg-secondary border-border" : "bg-transparent border-transparent hover:bg-secondary/50"
              )}
            />
          }>
            <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white text-[13px] font-bold shadow-sm glow-primary">
              PA
            </div>
            <div className="flex flex-col items-start hidden sm:flex">
              <span className="text-[13px] font-bold text-foreground leading-tight">Platform Admin</span>
              <span className="text-[11px] font-medium text-muted-foreground leading-tight">Super User</span>
            </div>
            <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronDown className="w-4 h-4 text-muted-foreground ml-1" />
            </motion.div>
          </DropdownMenuTrigger>

          {/* We apply the global glass-dropdown class here for the floating aesthetic */}
          <DropdownMenuContent className="w-[280px] rounded-[24px] glass-dropdown bg-white/85 dark:bg-slate-900/85 border-white/20 dark:border-white/10 p-2.5 shadow-xl" align="end" sideOffset={12}>
            <DropdownMenuLabel className="p-3">
              <p className="font-heading font-bold text-foreground text-base">Platform Admin</p>
              <p className="text-[13px] font-medium text-muted-foreground mt-0.5">admin@ashesi.edu.gh</p>
            </DropdownMenuLabel>
            
            <DropdownMenuSeparator className="bg-border" />
            
            <DropdownMenuGroup className="space-y-1 mt-2">
              <DropdownMenuItem className="flex items-center gap-3 px-3 py-3 rounded-[14px] text-[13.5px] font-medium text-muted-foreground hover:text-primary hover:bg-primary/10 focus:bg-primary/10 focus:text-primary cursor-pointer transition-all duration-200 group">
                <User className="w-[18px] h-[18px] group-hover:scale-110 transition-transform duration-200" />
                My Profile
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-center gap-3 px-3 py-3 rounded-[14px] text-[13.5px] font-medium text-muted-foreground hover:text-primary hover:bg-primary/10 focus:bg-primary/10 focus:text-primary cursor-pointer transition-all duration-200 group">
                <Settings className="w-[18px] h-[18px] group-hover:rotate-45 transition-transform duration-200" />
                Account Settings
              </DropdownMenuItem>
            </DropdownMenuGroup>
            
            <DropdownMenuSeparator className="bg-border/60 my-2" />
            
            <DropdownMenuItem className="flex items-center gap-3 px-3 py-3 rounded-[14px] text-[13.5px] font-bold text-destructive hover:bg-destructive/15 focus:bg-destructive/15 focus:text-destructive cursor-pointer transition-all duration-200 group">
              <LogOut className="w-[18px] h-[18px] group-hover:-translate-x-1 transition-transform duration-200" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}