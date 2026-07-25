import { getCounsellingSummaryAction, getCounsellingCasesAction, getCounsellorsAction } from "@/app/actions/units";
import { CounsellingClient } from "./counselling-client";

export default async function CounsellingPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const academicYearId = typeof searchParams.academicYearId === 'string' ? searchParams.academicYearId : undefined;

  // Fetch all required data in parallel
  const [summary, activeCases, resolvedCases, counsellors] = await Promise.all([
    getCounsellingSummaryAction(academicYearId).catch(() => ({})),
    getCounsellingCasesAction(academicYearId, 'active').catch(() => []),
    getCounsellingCasesAction(academicYearId, 'resolved').catch(() => []),
    getCounsellorsAction(academicYearId).catch(() => []),
  ]);

  return (
    <CounsellingClient 
      summary={summary}
      activeCases={activeCases}
      resolvedCases={resolvedCases}
      counsellors={counsellors}
      academicYearId={academicYearId}
    />
  );
}