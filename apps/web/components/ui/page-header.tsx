import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  badge,
  action,
  className,
}: {
  title: string;
  description?: string;
  badge?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start justify-between", className)}>
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="h-8 w-1 rounded-full bg-[#A93C40]" />
          {badge && (
            <p className="text-sm font-semibold text-[#A93C40] tracking-widest uppercase">
              {badge}
            </p>
          )}
        </div>
        <h1 className="text-4xl font-bold text-[#1A2B4A] tracking-tight">
          {title}
        </h1>
        {description && (
          <p className="text-[#6B7280] mt-2 text-lg">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}