"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export interface Column<T> {
  key: string;
  header: string;
  render: (item: T) => ReactNode;
  className?: string;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  emptyMessage = "No data found.",
  onRowClick,
}: {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  emptyMessage?: string;
  onRowClick?: (item: T) => void;
}) {
  return (
    <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#f3f4f6] bg-[#f8f4ef]/50">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "text-left p-4 font-semibold text-[#6B7280] text-xs uppercase tracking-wider",
                    col.className
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item, i) => (
              <motion.tr
                key={keyExtractor(item)}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03, duration: 0.3 }}
                onClick={() => onRowClick?.(item)}
                className={cn(
                  "border-b border-[#f3f4f6] last:border-0 transition-colors",
                  onRowClick ? "cursor-pointer hover:bg-[#f8f4ef]/70" : "hover:bg-[#f8f4ef]/50"
                )}
              >
                {columns.map((col) => (
                  <td key={col.key} className={cn("p-4", col.className)}>
                    {col.render(item)}
                  </td>
                ))}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
      {data.length === 0 && (
        <div className="p-16 text-center text-[#6B7280]">{emptyMessage}</div>
      )}
    </div>
  );
}

export function CardGrid<T>({
  data,
  keyExtractor,
  renderCard,
  emptyMessage = "No items found.",
  columns = 3,
}: {
  data: T[];
  keyExtractor: (item: T) => string;
  renderCard: (item: T, index: number) => ReactNode;
  emptyMessage?: string;
  columns?: 1 | 2 | 3 | 4;
}) {
  const gridCols = {
    1: "grid-cols-1",
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  };

  return (
    <>
      <div className={cn("grid gap-6", gridCols[columns])}>
        {data.map((item, i) => (
          <motion.div
            key={keyExtractor(item)}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          >
            {renderCard(item, i)}
          </motion.div>
        ))}
      </div>
      {data.length === 0 && (
        <div className="p-16 text-center text-[#6B7280]">{emptyMessage}</div>
      )}
    </>
  );
}