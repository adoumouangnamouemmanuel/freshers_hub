import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function StatCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  className,
}: {
  title: string;
  value: string | number;
  icon?: any;
  description?: string;
  trend?: { value: string; positive: boolean };
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border bg-white p-6 shadow-sm hover:shadow-lg hover:shadow-[#A93C40]/5 transition-all duration-300 group cursor-pointer",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <p className="text-sm font-medium text-[#6B7280] tracking-wide uppercase">
            {title}
          </p>
          <p className="text-3xl font-bold text-[#1A2B4A]">{value}</p>
          {description && (
            <p className="text-xs text-[#9CA3AF]">{description}</p>
          )}
        </div>
        {Icon && (
          <div className="w-12 h-12 rounded-xl bg-[#A93C40]/10 flex items-center justify-center group-hover:bg-[#A93C40]/15 transition-colors">
            <Icon className="w-6 h-6 text-[#A93C40]" />
          </div>
        )}
      </div>
      {trend && (
        <div className="mt-4 flex items-center gap-1.5 text-sm">
          <span
            className={`flex items-center gap-0.5 font-medium ${
              trend.positive ? "text-emerald-600" : "text-red-500"
            }`}
          >
            <svg
              className={`w-4 h-4 ${!trend.positive ? "rotate-90" : ""}`}
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
  label: string;
  color?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border bg-white p-5 shadow-sm hover:shadow-lg transition-all cursor-pointer",
        className
      )}
    >
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#A93C40]/10 to-[#d46a6e]/10 flex items-center justify-center shrink-0">
            <Icon className={cn("w-5 h-5", color)} />
          </div>
        )}
        <div>
          <p className="text-2xl font-bold text-[#1A2B4A]">{value}</p>
          <p className="text-sm text-[#6B7280]">{label}</p>
        </div>
      </div>
    </div>
  );
}