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

export async function getUsersAction(params: {
  search?: string;
  role?: string;
  status?: string;
  classYear?: string;
  page?: number;
  pageSize?: number;
} = {}) {
  const searchParams = new URLSearchParams();
  if (params.search) searchParams.set("search", params.search);
  if (params.role && params.role !== "all") searchParams.set("role", params.role);
  if (params.status && params.status !== "all") searchParams.set("status", params.status);
  if (params.classYear) searchParams.set("classYear", params.classYear);
  if (params.page) searchParams.set("page", params.page.toString());
  if (params.pageSize) searchParams.set("pageSize", params.pageSize.toString());

  const queryString = searchParams.toString();
  const endpoint = `/admin/users${queryString ? `?${queryString}` : ""}`;
  
  return fetchWithAuth(endpoint, { cache: "no-store" });
}

export async function getRolesAction() {
  return fetchWithAuth("/admin/roles", { cache: "no-store" });
}

export async function getUserByIdAction(id: string) {
  return fetchWithAuth(`/admin/users/${id}`, { cache: "no-store" });
}

export async function deactivateUsersAction(userIds: string[]) {
  return fetchWithAuth("/admin/users/bulk-deactivate", {
    method: "POST",
    body: JSON.stringify({ userIds }),
  });
}
export async function createUserAction(data: any) {
  const res = await fetchWithAuth("/admin/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res;
}

export async function updateUserAction(id: string, data: any) {
  const res = await fetchWithAuth(`/admin/users/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res;
}

export async function importUsersAction(formData: FormData) {
  // We need the raw token for FormData
  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken")?.value;
  
  if (!token) {
    throw new Error("Unauthorized");
  }

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users/import`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      // Do NOT set Content-Type; let the browser/fetch set it with the boundary automatically
    },
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `API error: ${res.status}`);
  }

  return res.json();
}
export async function assignRolesAction(userIds: string[], roleId: string) {
  return fetchWithAuth("/admin/users/bulk-roles", {
    method: "POST",
    body: JSON.stringify({ userIds, roleId }),
  });
}
