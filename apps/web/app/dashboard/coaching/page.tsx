import { getCoachingSummaryAction, getCoachingCoachesAction } from "@/app/actions/units";
import { CoachingClient } from "@/components/dashboard/coaching/coaching-client";

export default async function CoachingPage() {
  try {
    const [summary, coaches] = await Promise.all([
      getCoachingSummaryAction(),
      getCoachingCoachesAction()
    ]);
    
    return <CoachingClient summary={summary} coaches={coaches} />;
  } catch (error: any) {
    console.error("Failed to fetch coaching unit data:", error);
    
    return (
      <div className="p-10 text-[#A93C40] font-bold bg-[#fcf2f2] rounded-2xl m-6 border border-[#f5d9d9]">
        <h2 className="text-xl mb-2">Error Loading Coaching Unit</h2>
        <p>Could not connect to the backend API or failed to load data.</p>
        <p className="text-sm mt-2 font-mono text-[#A93C40]/80">{error.message}</p>
      </div>
    );
  }
}