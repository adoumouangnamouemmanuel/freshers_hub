import { getAuditLogsAction } from "@/app/actions/audit";
import AuditLogClient from "@/components/dashboard/audit-log/audit-log-client";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

export default async function AuditLogPage() {
  const initialData = await getAuditLogsAction({ page: 1, pageSize: 20 });

  return (
    <Suspense fallback={
      <div className="flex justify-center items-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-[#A93C40]" />
      </div>
    }>
      <AuditLogClient initialData={initialData} />
    </Suspense>
  );
}