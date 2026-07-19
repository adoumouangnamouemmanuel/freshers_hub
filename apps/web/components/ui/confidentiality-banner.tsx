import { Shield } from "lucide-react";

export function ConfidentialityBanner({ unit }: { unit?: string }) {
  const message = unit
    ? `Individual ${unit} session records are managed exclusively by the ${unit} unit head and are not accessible from this portal.`
    : "Individual coaching, counselling, advising, and buddy session data is confidential to each unit and not visible in this portal.";

  return (
    <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200 text-sm">
      <Shield className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
      <div>
        <p className="font-medium text-amber-800">Confidentiality Notice</p>
        <p className="text-amber-700 mt-0.5 text-xs leading-relaxed">{message}</p>
      </div>
    </div>
  );
}

export function AnalyticsConfidentialityBanner() {
  return (
    <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 border border-blue-200 text-sm">
      <Shield className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
      <div>
        <p className="font-medium text-blue-800">Anonymized Data</p>
        <p className="text-blue-700 mt-0.5 text-xs leading-relaxed">
          All data shown here is aggregated and anonymized. No individual student, coach, or counsellor records are displayed.
        </p>
      </div>
    </div>
  );
}