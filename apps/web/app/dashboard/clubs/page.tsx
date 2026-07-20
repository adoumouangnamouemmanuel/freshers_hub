import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import ClubsClient from "@/components/dashboard/clubs/clubs-client";
import { getClubsAction, listUsersAction } from "@/app/actions/clubs";

export default async function ClubsPage() {
  const [initialData, usersRes] = await Promise.all([
    getClubsAction({ page: 1, pageSize: 20 }),
    listUsersAction()
  ]);

  return (
    <Suspense fallback={
      <div className="flex justify-center items-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-[#A93C40]" />
      </div>
    }>
      <ClubsClient initialData={initialData} allUsers={usersRes.data || []} />
    </Suspense>
  );
}