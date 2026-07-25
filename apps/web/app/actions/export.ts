"use server";

import { cookies } from "next/headers";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:4000").replace("localhost", "127.0.0.1");

export async function exportAnalyticsAction(academicYearId?: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken")?.value;

  if (!token) {
    throw new Error("Unauthorized");
  }

  const query = academicYearId ? `?academicYearId=${academicYearId}` : "";
  const res = await fetch(`${API_URL}/admin/analytics/export${query}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "text/csv",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Export failed: ${res.status}`);
  }

  const text = await res.text();
  return text;
}
