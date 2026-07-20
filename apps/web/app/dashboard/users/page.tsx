import UsersClient from "@/components/dashboard/users/users-client";
import { getUsersAction, getRolesAction } from "@/app/actions/users";

export default async function UsersPage() {
  try {
    const [initialUsers, roles] = await Promise.all([
      getUsersAction(),
      getRolesAction()
    ]);
    
    return (
      <UsersClient 
        initialData={initialUsers} 
        allRoles={roles} 
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