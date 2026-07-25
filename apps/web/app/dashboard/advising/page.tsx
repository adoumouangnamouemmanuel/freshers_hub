import { getAdvisingSummaryAction, getAdvisingAdvisorsAction } from "@/app/actions/units";
import { AdvisingClient } from "./advising-client";

export default async function AdvisingPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const academicYearId = typeof searchParams.academicYearId === 'string' ? searchParams.academicYearId : undefined;
  
  const [summary, advisors] = await Promise.all([
    getAdvisingSummaryAction(academicYearId),
    getAdvisingAdvisorsAction(academicYearId)
  ]);

  return (
    <AdvisingClient 
      initialSummary={summary} 
      initialAdvisors={advisors}
      currentAcademicYearId={academicYearId}
    />
  );
}