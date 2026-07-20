import { cookies } from "next/headers";
import DashboardClient from "@/components/dashboard/dashboard-client";
import { redirect } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

async function fetchDashboardData() {
  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken")?.value;

  if (!token) {
    redirect("/login");
  }

  try {
    // We can fetch these in parallel for performance
    const [overviewRes, auditRes] = await Promise.all([
      fetch(`${API_URL}/admin/analytics/overview`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store", // Don't cache analytics data
      }),
      fetch(`${API_URL}/admin/audit-log`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      }),
    ]);

    if (!overviewRes.ok || !auditRes.ok) {
      if (overviewRes.status === 401 || overviewRes.status === 403) {
        redirect("/login");
      }
      throw new Error("Failed to fetch dashboard data");
    }

    const overview = await overviewRes.json();
    const auditLog = await auditRes.json();

    return { overview, auditLog };
  } catch (error: any) {
    if (error.message === "NEXT_REDIRECT") {
      throw error;
    }
    console.error("Dashboard fetch error:", error);
    // Return graceful empty data instead of crashing the whole page
    return { overview: null, auditLog: [] };
  }
}

export default async function DashboardPage() {
  const { overview, auditLog } = await fetchDashboardData();

  return (
    <DashboardClient overview={overview} auditLog={auditLog} />
  );
}
