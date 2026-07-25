"use server";

import { cookies } from "next/headers";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:4000").replace("localhost", "127.0.0.1");

async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken")?.value;

  if (!token) {
    throw new Error("Unauthorized");
  }

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `API error: ${res.status}`);
  }

  return res.json();
}

export async function getCoachingSummaryAction(academicYearId?: string) {
  const params = academicYearId ? `?academicYearId=${academicYearId}` : "";
  return fetchWithAuth(`/admin/units/coaching/summary${params}`, { cache: "no-store" });
}

export async function getCoachingCoachesAction(academicYearId?: string) {
  const params = academicYearId ? `?academicYearId=${academicYearId}` : "";
  return fetchWithAuth(`/admin/units/coaching/coaches${params}`, { cache: "no-store" });
}

export async function getCounsellingSummaryAction(academicYearId?: string) {
  const params = academicYearId ? `?academicYearId=${academicYearId}` : "";
  return fetchWithAuth(`/admin/units/counselling/summary${params}`, { cache: "no-store" });
}

export async function getCounsellingCasesAction(academicYearId?: string, status: 'active' | 'resolved' = 'active') {
  const yearParam = academicYearId ? `academicYearId=${academicYearId}&` : "";
  return fetchWithAuth(`/admin/units/counselling/cases?${yearParam}status=${status}`, { cache: "no-store" });
}

export async function getCounsellorsAction(academicYearId?: string) {
  const params = academicYearId ? `?academicYearId=${academicYearId}` : "";
  return fetchWithAuth(`/admin/units/counselling/counsellors${params}`, { cache: "no-store" });
}

export async function assignCounsellingCaseAction(data: { academicYearId: number; studentSchoolId: string; peerCounsellorId: string; notes?: string }) {
  return fetchWithAuth(`/admin/units/counselling/cases`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function resolveCounsellingCaseAction(assignmentId: string) {
  return fetchWithAuth(`/admin/units/counselling/cases/${assignmentId}/resolve`, {
    method: "PATCH",
  });
}
