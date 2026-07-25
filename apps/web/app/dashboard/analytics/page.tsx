import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AnalyticsClient from "@/components/dashboard/analytics/analytics-client";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:4000").replace("localhost", "127.0.0.1");

async function fetchAnalyticsData() {
  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken")?.value;

  if (!token) {
    redirect("/login");
  }

  try {
    const [overviewRes, unitComparisonRes, cohortSpeedRes, monthlySessionsRes, topClubsRes] = await Promise.all([
      fetch(`${API_URL}/admin/analytics/overview`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      }),
      fetch(`${API_URL}/admin/analytics/unit-comparison`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      }),
      fetch(`${API_URL}/admin/analytics/cohort-speed?unit=coaching`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      }),
      fetch(`${API_URL}/admin/analytics/monthly-sessions`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      }),
      fetch(`${API_URL}/admin/analytics/top-clubs`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      }),
    ]);

    if (!overviewRes.ok || !unitComparisonRes.ok || !cohortSpeedRes.ok || !monthlySessionsRes.ok || !topClubsRes.ok) {
      if (overviewRes.status === 401 || overviewRes.status === 403) {
        redirect("/login");
      }
      throw new Error("Failed to fetch analytics data");
    }

    const [overview, unitComparison, cohortSpeedData, monthlySessions, topClubs] = await Promise.all([
      overviewRes.json(),
      unitComparisonRes.json(),
      cohortSpeedRes.json(),
      monthlySessionsRes.json(),
      topClubsRes.json(),
    ]);

    return { overview, unitComparison, cohortSpeedData, monthlySessions, topClubs, token };
  } catch (error: any) {
    if (error.message === "NEXT_REDIRECT") {
      throw error;
    }
    console.error("Analytics fetch error:", error);
    return { error: error.message };
  }
}

export default async function AnalyticsPage() {
  const data = await fetchAnalyticsData();

  if (data.error) {
    return (
      <div className="p-10 text-red-500 font-bold">
        Failed to load analytics data: {data.error}
      </div>
    );
  }

  const exportUrl = `${API_URL}/admin/analytics/export?format=csv`;

  return (
    <AnalyticsClient 
      overview={data.overview}
      unitComparison={data.unitComparison}
      cohortSpeedData={data.cohortSpeedData}
      monthlySessions={data.monthlySessions}
      topClubs={data.topClubs}
      exportUrl={exportUrl}
      token={data.token || ""} // We will pass token for fetch-based download
    />
  );
}
