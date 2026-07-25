"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Bell, ChevronDown, User, GraduationCapIcon, LogOut, Settings, Command } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { logoutAction } from "@/app/actions/auth";
import { getAcademicYearsAction } from "@/app/actions/academicYears";
import { globalSearchAction } from "@/app/actions/search";

export default function Topbar({ user }: { user?: any }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // Academic Year State
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [selectedYearId, setSelectedYearId] = useState<string | null>(searchParams.get("academicYearId"));
  
  // Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any>(null);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);

  // Helper to get initials
  const getInitials = (name?: string, email?: string) => {
    if (name) {
      const parts = name.split(" ");
      if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      return name.substring(0, 2).toUpperCase();
    }
    if (email) return email.substring(0, 2).toUpperCase();
    return "PA";
  };

  const displayName = user?.fullName || "Platform Admin";
  const displayEmail = user?.email || "admin@ashesi.edu.gh";
  const initials = getInitials(user?.fullName, user?.email);
  const roleName = typeof user?.roles?.[0] === 'string' ? user.roles[0] : user?.roles?.[0]?.name;
  const roleDisplay = roleName?.replace("_", " ").replace(/\b\w/g, (c: string) => c.toUpperCase()) || "Super User";

  // Fetch Academic Years on mount
  useEffect(() => {
    getAcademicYearsAction().then(years => {
      setAcademicYears(years);
      if (!selectedYearId) {
        const currentYear = years.find((y: any) => y.is_current);
        if (currentYear) {
          setSelectedYearId(currentYear.id);
        }
      }
    }).catch(console.error);
  }, []);

  // Update URL when Academic Year changes
  const handleYearChange = (yearId: string) => {
    setSelectedYearId(yearId);
    const params = new URLSearchParams(searchParams.toString());
    params.set("academicYearId", yearId);
    router.push(`${pathname}?${params.toString()}`);
  };

  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle Search logic with debounce
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      setIsSearching(false);
      return;
    }
    
    setIsSearching(true);
    const timeoutId = setTimeout(async () => {
      try {
        const res = await globalSearchAction(searchQuery);
        setSearchResults(res.results);
      } catch (e) {
        console.error("Search failed", e);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Handle clicking outside search results
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedYearObj = academicYears.find(y => y.id === selectedYearId) || academicYears[0];
  const displayYear = selectedYearObj ? selectedYearObj.label : "Loading...";

  return (
    <header className="h-[76px] glass-panel rounded-[var(--radius-xl)] flex items-center justify-between px-6 shrink-0 w-full relative z-30">
      {/* Left: Command Palette Trigger */}
      <div className="relative w-96 group" ref={searchContainerRef}>
        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center text-muted-foreground group-focus-within:text-primary transition-colors">
          <Search className="w-[18px] h-[18px]" />
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setShowSearchResults(true)}
          placeholder="Search for students, clubs, or reports..."
          className="w-full pl-12 pr-16 py-3 rounded-[14px] bg-secondary/50 border border-transparent text-[14px] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-background transition-all placeholder:text-muted-foreground font-medium"
        />
        
        {/* Keyboard shortcut hint */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {isSearching ? (
             <span className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          ) : (
            <kbd className="inline-flex items-center justify-center h-6 px-1.5 rounded-md bg-background border border-border text-[10px] font-semibold text-muted-foreground">
              <Command className="w-3 h-3 mr-0.5" /> K
            </kbd>
          )}
        </div>

        {/* Search Results Dropdown */}
        <AnimatePresence>
          {showSearchResults && searchQuery.trim() && searchResults && (
            <motion.div 
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              className="absolute top-[calc(100%+8px)] left-0 w-full max-h-[400px] overflow-y-auto rounded-2xl glass-dropdown bg-white/95 dark:bg-slate-900/95 border border-white/20 dark:border-white/10 p-2 shadow-xl z-50"
            >
              {Object.entries(searchResults).map(([category, items]: [string, any]) => {
                if (!items || items.length === 0) return null;
                return (
                  <div key={category} className="mb-3 last:mb-0">
                    <h4 className="px-3 py-1.5 text-xs font-bold text-muted-foreground uppercase tracking-wider">{category}</h4>
                    <div className="space-y-1">
                      {items.map((item: any) => (
                        <button
                          key={item.id}
                          onClick={() => {
                            setShowSearchResults(false);
                            if (category === 'users') {
                              router.push(`/dashboard/users/${item.id}`);
                            } else if (category === 'clubs' || category === 'groups') {
                               router.push(`/dashboard/clubs/${item.id}`);
                            } else {
                               // Fallback
                               console.log("Clicked", item);
                            }
                          }}
                          className="w-full text-left px-3 py-2 rounded-xl text-sm font-medium hover:bg-primary/10 hover:text-primary transition-colors flex flex-col"
                        >
                          <span className="text-foreground">{item.full_name || item.name || item.title || "Result"}</span>
                          {(item.email || item.major) && (
                            <span className="text-xs text-muted-foreground font-normal">{item.email} {item.major && `• ${item.major}`}</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
              {Object.values(searchResults).every((items: any) => !items || items.length === 0) && (
                <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                  No results found for "{searchQuery}"
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
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
            <span className="text-[13px] font-bold text-foreground tracking-wide">{displayYear}</span>
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground ml-0.5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-40 rounded-[20px] glass-dropdown bg-white/85 dark:bg-slate-900/85 border-white/20 dark:border-white/10 p-2 shadow-xl" align="start" sideOffset={8}>
            <DropdownMenuGroup className="space-y-1">
              {academicYears.map((year) => (
                <DropdownMenuItem 
                  key={year.id}
                  onClick={() => handleYearChange(year.id)}
                  className={cn(
                    "flex items-center justify-between px-3 py-2.5 rounded-[12px] text-[13px] font-medium cursor-pointer transition-all duration-200",
                    selectedYearId === year.id 
                      ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20" 
                      : "text-muted-foreground hover:bg-primary/10 hover:text-primary focus:bg-primary/10 focus:text-primary"
                  )}
                >
                  {year.label}
                  {selectedYearId === year.id && (
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
              {initials}
            </div>
            <div className="flex flex-col items-start hidden sm:flex">
              <span className="text-[13px] font-bold text-foreground leading-tight truncate max-w-[120px]">{displayName}</span>
              <span className="text-[11px] font-medium text-muted-foreground leading-tight">{roleDisplay}</span>
            </div>
            <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronDown className="w-4 h-4 text-muted-foreground ml-1" />
            </motion.div>
          </DropdownMenuTrigger>

          {/* We apply the global glass-dropdown class here for the floating aesthetic */}
          <DropdownMenuContent className="w-[280px] rounded-[24px] glass-dropdown bg-white/85 dark:bg-slate-900/85 border-white/20 dark:border-white/10 p-2.5 shadow-xl" align="end" sideOffset={12}>
            <DropdownMenuGroup>
              <DropdownMenuLabel className="p-3">
                <p className="font-heading font-bold text-foreground text-base truncate">{displayName}</p>
                <p className="text-[13px] font-medium text-muted-foreground mt-0.5 truncate">{displayEmail}</p>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            
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
            
            <form action={logoutAction} className="w-full">
              <button type="submit" className="w-full flex items-center gap-3 px-3 py-3 rounded-[14px] text-[13.5px] font-bold text-destructive hover:bg-destructive/15 focus:bg-destructive/15 focus:text-destructive cursor-pointer transition-all duration-200 group outline-none">
                <LogOut className="w-[18px] h-[18px] group-hover:-translate-x-1 transition-transform duration-200" />
                Sign Out
              </button>
            </form>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}