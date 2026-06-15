import { MapPin, Phone, FileText } from "lucide-react";

interface JobSiteDetailsBannerProps {
  jobAddress?: string | null;
  jobPhone?: string | null;
  accessNotes?: string | null;
  jobStatus?: string;
  variant?: "provider" | "customer";
}

const ACCEPTED_STATUSES = ["accepted", "in_progress", "completed"];

const JobSiteDetailsBanner = ({
  jobAddress,
  jobPhone,
  accessNotes,
  jobStatus,
  variant = "provider",
}: JobSiteDetailsBannerProps) => {
  // Only show after acceptance, and only if there's address or phone data
  if (!jobStatus || !ACCEPTED_STATUSES.includes(jobStatus)) return null;
  if (!jobAddress && !jobPhone) return null;

  if (variant === "customer") {
    return (
      <div className="mx-3 my-2 flex items-center gap-2 border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-2 text-xs text-emerald-700 dark:text-emerald-400">
        <MapPin className="h-3.5 w-3.5 shrink-0" />
        <span>Your job address has been shared with the provider</span>
      </div>
    );
  }

  return (
    <div className="mx-3 my-2 border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 px-3 py-2.5 space-y-1.5">
      {jobAddress && (
        <div className="flex items-start gap-2 text-sm text-blue-900 dark:text-blue-100">
          <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0 text-blue-500 dark:text-blue-400" />
          <span>{jobAddress}</span>
        </div>
      )}
      {jobPhone && (
        <div className="flex items-center gap-2 text-sm">
          <Phone className="h-3.5 w-3.5 shrink-0 text-blue-500 dark:text-blue-400" />
          <a
            href={`tel:${jobPhone}`}
            className="text-blue-700 dark:text-blue-300 underline underline-offset-2 hover:text-blue-900 dark:hover:text-blue-100 transition-colors"
          >
            {jobPhone}
          </a>
        </div>
      )}
      {accessNotes && (
        <div className="flex items-start gap-2 text-xs text-blue-700 dark:text-blue-400">
          <FileText className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <span className="whitespace-pre-wrap">{accessNotes}</span>
        </div>
      )}
    </div>
  );
};

export default JobSiteDetailsBanner;
