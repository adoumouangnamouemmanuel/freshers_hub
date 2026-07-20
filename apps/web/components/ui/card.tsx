import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function StatCard({
  title,
  value,
  description,
  trend,
  className,
}: {
  title: string;
  value: string | number;
  description?: string;
  trend?: { value: string; positive: boolean };
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/20 dark:border-white/10 glass-panel p-5 shadow-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden group",
        className
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      <div className="relative z-10">
      <p className="text-xs font-medium text-[#6B7280] mb-2">
        {title}
      </p>
      <div>
        <p className="text-2xl font-bold text-[#1A2B4A] tracking-tight leading-none mb-1">{value}</p>
        {description && (
          <p className="text-xs text-[#9CA3AF]">{description}</p>
        )}
      </div>
      {trend && (
        <div className="mt-2 flex items-center gap-1 text-sm">
          <span
            className={`flex items-center gap-0.5 font-medium ${
              trend.positive ? "text-emerald-600" : "text-red-500"
            }`}
          >
            <svg
              className={`w-3.5 h-3.5 ${!trend.positive ? "rotate-90" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
            {trend.value}
          </span>
          <span className="text-[#9CA3AF]">vs last month</span>
        </div>
      )}
      </div>
    </div>
  );
}

export function MiniStatCard({
  icon: Icon,
  value,
  label,
  color = "text-[#A93C40]",
  className,
}: {
  icon?: any;
  value: string | number;
  label?: string;
  color?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-white p-4 shadow-sm hover:shadow-lg transition-all cursor-pointer",
        className
      )}
    >
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#A93C40]/10 to-[#d46a6e]/10 flex items-center justify-center shrink-0">
            <Icon className={cn("w-5 h-5", color)} />
          </div>
        )}
        <div>
          <p className="text-xl font-bold text-[#1A2B4A] tracking-tight leading-none">{value}</p>
          {label && <p className="text-xs text-[#6B7280] mt-1">{label}</p>}
        </div>
      </div>
    </div>
  );
}