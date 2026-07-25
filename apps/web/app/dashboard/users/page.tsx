import UsersClient from "@/components/dashboard/users/users-client";
import { getUsersAction, getRolesAction } from "@/app/actions/users";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:4000").replace("localhost", "127.0.0.1");

async function fetchOverview() {
  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken")?.value;

  if (!token) return null;

  try {
    const res = await fetch(`${API_URL}/admin/analytics/overview`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function UsersPage() {
  try {
    const [initialUsers, roles, overview] = await Promise.all([
      getUsersAction(),
      getRolesAction(),
      fetchOverview(),
    ]);
    
    return (
      <UsersClient 
        initialData={initialUsers} 
        allRoles={roles} 
        overview={overview}
      />
    );
  } catch (error: any) {
    console.error("Failed to fetch initial users data:", error);
    
    return (
      <div className="p-10 text-red-500 font-bold bg-red-50 rounded-2xl m-6 border border-red-200">
        <h2 className="text-xl mb-2">Error Loading Users</h2>
        <p>Could not connect to the backend API. Please make sure the API is running.</p>
        <p className="text-sm mt-2 font-mono text-red-700">{error.message}</p>
      </div>
    );
  }
}