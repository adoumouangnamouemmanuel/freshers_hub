"use client";

import { motion } from "framer-motion";
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  Building2,
  Calendar,
  Download,
  Megaphone,
  Plus,
  TrendingUp,
  Users,
  ShieldAlert,
  Edit3,
  Trash2,
  CheckCircle,
  UserPlus
} from "lucide-react";
import Link from "next/link";
import { StatCard } from "@/components/ui/card";
import { ConfidentialityBanner } from "@/components/ui/confidentiality-banner";
import {
  AnimatedPage,
  AnimatedSection,
} from "@/components/ui/animated-container";
import { AreaChart, Area, ResponsiveContainer, YAxis } from "recharts";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] as const },
  },
};

const getGreeting = (name?: string) => {
  const hour = new Date().getHours();
  let timeOfDay = "Good evening";
  if (hour < 12) timeOfDay = "Good morning";
  else if (hour < 17) timeOfDay = "Good afternoon";

  const firstName = name ? name.split(" ")[0] : "Admin";
  return `${timeOfDay}, ${firstName}`;
};

const getAuditIcon = (actionStr: string) => {
  const a = actionStr.toLowerCase();
  if (a.includes("delete") || a.includes("remove") || a.includes("revoke")) {
    return <Trash2 className="w-4 h-4 text-red-500" />;
  }
  if (a.includes("update") || a.includes("edit")) {
    return <Edit3 className="w-4 h-4 text-blue-500" />;
  }
  if (a.includes("create") || a.includes("add") || a.includes("grant")) {
    return <Plus className="w-4 h-4 text-emerald-500" />;
  }
  if (a.includes("activate")) {
    return <CheckCircle className="w-4 h-4 text-emerald-500" />;
  }
  return <ShieldAlert className="w-4 h-4 text-muted-foreground" />;
};

export default function DashboardClient({
  overview,
  auditLog,
  user,
}: {
  overview: any;
  auditLog: any[];
  user?: any;
}) {
  const searchParams = useSearchParams();
  const [greeting, setGreeting] = useState("Welcome back");
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    setGreeting(getGreeting(user?.fullName));
  }, [user]);

  const handleExport = () => {
    try {
      setIsExporting(true);
      const ayId = searchParams.get("academicYearId") || "";
      const query = ayId ? `?academicYearId=${ayId}` : "";
      
      // Navigate to our API route which proxies the streaming download natively
      window.location.href = `/api/export${query}`;
      
      // The browser handles the download without leaving the page. 
      // Stop the loading spinner after 2 seconds since we can't easily track native download completion
      setTimeout(() => setIsExporting(false), 2000);
    } catch (e) {
      console.error("Failed to export", e);
      alert("Failed to export data");
      setIsExporting(false);
    }
  };

  const users = overview?.users || {
    total_users: 0,
    total_students: 0,
    total_coaches: 0,
    inactive_users: 0,
  };
  
  const clubs = overview?.clubs || { total_clubs: 0 };

  const unitHealth = [
    {
      unit: "Coaching",
      rate: overview?.coaching?.completion_rate || 0,
      trend: overview?.coaching?.trend || "+0%",
      history: overview?.coaching?.history || [],
      color: "emerald",
      bgClass: "bg-emerald-500",
      textClass: "text-emerald-500",
      stroke: "#10b981",
      fill: "url(#colorEmerald)",
      label: "mandatory sessions completed",
    },
    {
      unit: "Counselling",
      rate: overview?.counselling?.completion_rate || 0,
      trend: overview?.counselling?.trend || "+0%",
      history: overview?.counselling?.history || [],
      color: "blue",
      bgClass: "bg-blue-500",
      textClass: "text-blue-500",
      stroke: "#3b82f6",
      fill: "url(#colorBlue)",
      label: "engagement rate",
    },
    {
      unit: "Advising",
      rate: overview?.advising?.completion_rate || 0,
      trend: overview?.advising?.trend || "+0%",
      history: overview?.advising?.history || [],
      color: "amber",
      bgClass: "bg-amber-500",
      textClass: "text-amber-500",
      stroke: "#f59e0b",
      fill: "url(#colorAmber)",
      label: "sessions booked",
    },
  ];

  return (
    <AnimatedPage>
      {/* Hero Header */}
      <AnimatedSection className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-[#1A2B4A] to-slate-800 p-8 sm:p-10 mb-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-[80px] pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/10 rounded-full blur-[60px] pointer-events-none -ml-10 -mb-10" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-1.5 w-10 rounded-full bg-primary glow-primary" />
            <span className="text-xs font-bold text-primary tracking-widest uppercase">
              Overview · Current Cycle
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-heading font-extrabold tracking-tight mb-3 text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70">
            {greeting}
          </h1>
          <p className="text-white/70 text-lg max-w-2xl font-medium leading-relaxed">
            The aggregate view of Fresher Hub — nothing here is a name, only a
            number. Your platform insights at a glance.
          </p>
          <div className="flex flex-wrap gap-3 mt-8">
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleExport}
              disabled={isExporting}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white text-sm font-semibold hover:bg-white/20 transition-colors shadow-sm cursor-pointer disabled:opacity-50"
            >
              {isExporting ? <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> : <Download className="w-4 h-4" />}
              {isExporting ? "Exporting..." : "Export Data"}
            </motion.button>
            <Link href="/dashboard/users">
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors shadow-lg glow-primary cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                Invite Users
              </motion.button>
            </Link>
          </div>
        </div>
      </AnimatedSection>

      {/* Primary Stats */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-5 mb-8">
        <StatCard 
          title="Total Users" 
          value={users.total_users || 0} 
          description="Across all roles" 
        />
        <StatCard
          title="Active Students"
          value={users.total_students || 0}
          description="Registered on platform"
        />
        <StatCard
          title="Peer Coaches"
          value={users.total_coaches || 0}
          description="Assigned this cycle"
        />
        <StatCard
          title="Active Clubs"
          value={clubs.total_clubs || 0}
          description="Approved organizations"
        />
        <StatCard
          title="Inactive Accounts"
          value={users.inactive_users || 0}
          description="Pending activation"
        />
      </div>

      {/* Unit Health Snapshot */}
      <AnimatedSection className="mb-8">
        <div className="flex items-center justify-between mb-5 px-1">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-primary" />
            </div>
            <h2 className="text-xl font-heading font-bold text-foreground">
              Unit Health
            </h2>
          </div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider bg-secondary px-3 py-1 rounded-full">Aggregated nightly</p>
        </div>
        
        {unitHealth.every(u => u.rate === 0 || u.rate === null) ? (
          <div className="glass-panel rounded-2xl p-8 border border-dashed border-border/60 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mb-3">
              <BarChart3 className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="font-semibold text-foreground text-lg mb-1">No unit data available yet</p>
            <p className="text-sm text-muted-foreground max-w-sm">Once students begin engaging with Coaching, Counselling, and Advising, the completion rates will appear here.</p>
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
            {unitHealth.map((item) => (
              <motion.div
                key={item.unit}
                variants={itemVariants}
                whileHover={{ y: -3 }}
                className="rounded-2xl border border-border/50 glass-panel p-6 shadow-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden group flex flex-col"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <div className="relative z-10 flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-heading font-bold text-foreground text-lg">
                        {item.unit}
                      </p>
                      <p className="text-xs font-medium text-muted-foreground mt-0.5">{item.label}</p>
                    </div>
                    {item.trend && (
                      <span className={`flex items-center gap-0.5 text-xs font-bold ${item.textClass} bg-${item.color}-500/10 px-2.5 py-1 rounded-full`}>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                        {item.trend}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-end gap-3 mb-2">
                    <p className="text-4xl font-extrabold tracking-tight text-foreground">
                      {item.rate}%
                    </p>
                  </div>
                </div>

                {/* Sparkline Chart */}
                <div className="h-16 w-full -mx-1 relative z-0 mt-auto">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={item.history.length ? item.history : [{rate: 0}, {rate: item.rate}]}>
                      <defs>
                        <linearGradient id={`color${item.unit}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={item.stroke} stopOpacity={0.3}/>
                          <stop offset="95%" stopColor={item.stroke} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <YAxis domain={[0, 100]} hide />
                      <Area 
                        type="monotone" 
                        dataKey="rate" 
                        stroke={item.stroke} 
                        strokeWidth={3}
                        fillOpacity={1} 
                        fill={`url(#color${item.unit})`} 
                        isAnimationActive={true}
                        animationDuration={1500}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatedSection>

      {/* Confidentiality Banner */}
      <AnimatedSection className="mb-8">
        <ConfidentialityBanner />
      </AnimatedSection>

      {/* Two-column: Activity + Quick Actions */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Activity */}
        <AnimatedSection className="lg:col-span-2 rounded-2xl border border-border/50 glass-panel shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-border/50 bg-background/50 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Activity className="w-4 h-4 text-primary" />
            </div>
            <h2 className="text-lg font-heading font-bold text-foreground">
              Recent Platform Activity
            </h2>
          </div>
          
          <div className="divide-y divide-border/50 flex-1">
            {auditLog && auditLog.length > 0 ? (
              auditLog.slice(0, 5).map((log, i) => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="flex items-center gap-4 p-5 hover:bg-secondary/50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center shrink-0 border border-border/50 shadow-sm">
                    {getAuditIcon(log.action)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      <span className="capitalize">{log.action.replace(/_/g, " ")}</span> 
                      <span className="text-muted-foreground font-normal"> by {log.actor_name || "System"}</span>
                    </p>
                    <p className="text-xs font-medium text-muted-foreground mt-1">
                      {new Date(log.created_at).toLocaleString()}
                    </p>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="p-10 flex flex-col items-center justify-center text-center h-full">
                <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mb-3">
                  <Activity className="w-5 h-5 text-muted-foreground" />
                </div>
                <p className="font-semibold text-foreground">No recent activity</p>
                <p className="text-sm text-muted-foreground mt-1 max-w-[250px]">Audit logs will appear here when admins make changes to the platform.</p>
              </div>
            )}
          </div>
        </AnimatedSection>

        {/* Quick Actions */}
        <AnimatedSection className="rounded-2xl border border-border/50 glass-panel p-6 shadow-sm flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-primary" />
            </div>
            <h2 className="text-lg font-heading font-bold text-foreground">
              Management
            </h2>
          </div>
          
          <div className="space-y-3 flex-1 flex flex-col justify-center">
            {[
              {
                icon: Download,
                label: "Import new cohort",
                desc: "Upload admissions CSV",
                href: "/dashboard/users", // Would ideally be /dashboard/users/import
              },
              {
                icon: Calendar,
                label: "Create academic year",
                desc: "Set up new cycle",
                href: "/dashboard/academic-years",
              },
              {
                icon: Megaphone,
                label: "Post announcement",
                desc: "Platform-wide notice",
                href: "/dashboard", // Target page not fully scoped, fallback to /dashboard
              },
              {
                icon: BarChart3,
                label: "View analytics",
                desc: "Platform insights",
                href: "/dashboard/analytics",
              },
            ].map((action) => (
              <Link href={action.href} key={action.label}>
                <motion.button
                  whileHover={{ scale: 1.01, x: 4 }}
                  whileTap={{ scale: 0.99 }}
                  className="w-full flex items-center gap-4 p-3.5 rounded-xl hover:bg-secondary border border-transparent hover:border-border/50 transition-all text-left cursor-pointer group shadow-sm"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                    <action.icon className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                      {action.label}
                    </p>
                    <p className="text-xs font-medium text-muted-foreground mt-0.5">{action.desc}</p>
                  </div>
                </motion.button>
              </Link>
            ))}
          </div>
        </AnimatedSection>
      </div>
    </AnimatedPage>
  );
}
