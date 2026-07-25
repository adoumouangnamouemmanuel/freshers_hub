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

export async function getAcademicYearsAction() {
  return fetchWithAuth("/admin/academic-years", { cache: "no-store" });
}

export async function createAcademicYearAction(data: { label: string; start_date: string; end_date: string }) {
  return fetchWithAuth("/admin/academic-years", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateAcademicYearAction(id: string, data: { label?: string; start_date?: string; end_date?: string }) {
  return fetchWithAuth(`/admin/academic-years/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function activateAcademicYearAction(id: string) {
  return fetchWithAuth(`/admin/academic-years/${id}/activate`, {
    method: "PATCH",
  });
}
