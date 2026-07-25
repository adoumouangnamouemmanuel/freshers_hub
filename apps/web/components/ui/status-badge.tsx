import { cn } from "@/lib/utils";

const statusConfig: Record<string, { bg: string; text: string; border: string; dot?: string }> = {
  completed: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500" },
  booked: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", dot: "bg-blue-500" },
  cancelled: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", dot: "bg-red-500" },
  rescheduled: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", dot: "bg-amber-500" },
  no_show: { bg: "bg-gray-50", text: "text-gray-700", border: "border-gray-200", dot: "bg-gray-400" },
  active: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500" },
  inactive: { bg: "bg-gray-50", text: "text-gray-700", border: "border-gray-200", dot: "bg-gray-400" },
  synced: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500" },
  pending: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", dot: "bg-amber-500" },
  error: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", dot: "bg-red-500" },
  warning: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", dot: "bg-amber-500" },
  success: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500" },
};

export function StatusBadge({
  status,
  showDot = true,
  className,
}: {
  status: string;
  showDot?: boolean;
  className?: string;
}) {
  const config = statusConfig[status] || { bg: "bg-gray-50", text: "text-gray-700", border: "border-gray-200", dot: "bg-gray-400" };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border",
        config.bg,
        config.text,
        config.border,
        className
      )}
    >
      {showDot && <span className={cn("w-1.5 h-1.5 rounded-full", config.dot)} />}
      {status.replace("_", " ")}
    </span>
  );
}

export function RoleBadge({
  role,
  className,
}: {
  role: string;
  className?: string;
}) {
  const roleColors: Record<string, string> = {
    student: "bg-blue-50 text-blue-700 border-blue-200",
    peer_coach: "bg-emerald-50 text-emerald-700 border-emerald-200",
    coach_admin: "bg-purple-50 text-purple-700 border-purple-200",
    counselling_head: "bg-rose-50 text-rose-700 border-rose-200",
    advisor: "bg-amber-50 text-amber-700 border-amber-200",
    odip_head: "bg-cyan-50 text-cyan-700 border-cyan-200",
    staff: "bg-gray-50 text-gray-700 border-gray-200",
    club_lead: "bg-indigo-50 text-indigo-700 border-indigo-200",
    platform_admin: "bg-red-50 text-red-700 border-red-200",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-semibold border",
        roleColors[role.toLowerCase()] || "bg-gray-50 text-gray-700 border-gray-200",
        className
      )}
    >
      {role.replace("_", " ")}
    </span>
  );
}