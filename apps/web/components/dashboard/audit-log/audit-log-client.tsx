"use client";

import { useState, useEffect, useTransition } from "react";
import { AnimatedPage } from "@/components/ui/animated-container";
import { PageHeader } from "@/components/ui/page-header";
import { AuditLogFilters } from "./audit-log-filters";
import { AuditLogTable } from "./audit-log-table";
import { getAuditLogsAction } from "@/app/actions/audit";
import { useRouter } from "next/navigation";

interface AuditLogClientProps {
  initialData: {
    data: any[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

export default function AuditLogClient({ initialData }: AuditLogClientProps) {
  const router = useRouter();
  
  const [logs, setLogs] = useState(initialData.data);
  const [total, setTotal] = useState(initialData.total);
  const [page, setPage] = useState(initialData.page);
  const [totalPages, setTotalPages] = useState(initialData.totalPages);
  
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [entityTypeFilter, setEntityTypeFilter] = useState("all");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  
  const [isPending, startTransition] = useTransition();

  async function refetch(currentPage: number = 1) {
    const res = await getAuditLogsAction({
      search,
      action: actionFilter,
      entity_type: entityTypeFilter,
      startDate: dateRange.start,
      endDate: dateRange.end,
      page: currentPage,
      pageSize: 20
    });
    
    setLogs(res.data || []);
    setTotal(res.total || 0);
    setPage(res.page || 1);
    setTotalPages(res.totalPages || 1);
    router.refresh();
  }

  // Debounce search and refetch
  useEffect(() => {
    const timer = setTimeout(() => {
      startTransition(async () => {
        try {
          await refetch(1); // reset to page 1 on filter change
        } catch (error) {
          console.error("Failed to fetch audit logs", error);
        }
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [search, actionFilter, entityTypeFilter, dateRange]);

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    startTransition(async () => {
      await refetch(newPage);
    });
  };

  return (
    <AnimatedPage>
      <PageHeader
        title="Audit Log"
        description="Chronological, filterable log of all administrative actions — the accountability layer"
        badge="System"
      />

      <AuditLogFilters 
        search={search}
        setSearch={setSearch}
        actionFilter={actionFilter}
        setActionFilter={setActionFilter}
        entityTypeFilter={entityTypeFilter}
        setEntityTypeFilter={setEntityTypeFilter}
        dateRange={dateRange}
        setDateRange={setDateRange}
      />

      <div className={`transition-opacity duration-200 ${isPending ? 'opacity-50' : 'opacity-100'}`}>
        <AuditLogTable 
          data={logs} 
          page={page}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          total={total}
        />
      </div>
    </AnimatedPage>
  );
}
