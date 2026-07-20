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
    throw new Error(errorData.message || "An error occurred");
  }

  return res.json();
}

export async function getClubsAction(query?: any) {
  const qs = new URLSearchParams(query || {}).toString();
  return fetchWithAuth(`/admin/clubs?${qs}`, {
    next: { tags: ['clubs'] }
  });
}

export async function createClubAction(data: { name: string; description?: string; category?: string; leadUserId?: string }) {
  return fetchWithAuth("/admin/clubs", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateClubAction(id: string, data: { name?: string; description?: string; category?: string; leadUserId?: string; is_active?: boolean }) {
  return fetchWithAuth(`/admin/clubs/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteClubAction(id: string) {
  return fetchWithAuth(`/admin/clubs/${id}`, {
    method: "DELETE",
  });
}

export async function listUsersAction() {
  return fetchWithAuth("/admin/users?pageSize=1000", {
    next: { tags: ['users'] }
  });
}
