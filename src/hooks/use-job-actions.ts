import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface JobAction {
  jobId: string;
  label: string;
  type: "payment" | "review" | "setup" | "complete";
}

/**
 * Computes action-required alerts for a list of jobs.
 * Provider role: "Set up milestones", "Complete milestone" (when escrow held on pending milestone)
 * Customer role: "Review milestone" (completed awaiting acceptance), "Payment required" (pending milestone, no escrow held)
 */
export function useJobActions(
  jobIds: string[],
  role: "customer" | "provider",
  userId: string | undefined,
  refreshKey?: number
) {
  const [actions, setActions] = useState<Record<string, JobAction[]>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId || jobIds.length === 0) {
      setActions({});
      return;
    }
    fetchActions();
  }, [jobIds.join(","), role, userId, refreshKey]);

  const fetchActions = async () => {
    setLoading(true);

    // Fetch milestones for all jobs
    const { data: milestones } = await supabase
      .from("job_milestones")
      .select("id, job_id, status, sort_order, payment_amount")
      .in("job_id", jobIds);

    // Fetch escrow payments for all jobs
    const { data: escrows } = await supabase
      .from("escrow_payments")
      .select("id, job_id, milestone_id, status")
      .in("job_id", jobIds);

    // Fetch job milestones_confirmed status
    const { data: jobData } = await supabase
      .from("jobs")
      .select("id, milestones_confirmed, status")
      .in("id", jobIds);

    const milestonesByJob: Record<string, any[]> = {};
    for (const m of milestones ?? []) {
      if (!milestonesByJob[m.job_id]) milestonesByJob[m.job_id] = [];
      milestonesByJob[m.job_id].push(m);
    }

    const escrowByMilestone: Record<string, string> = {};
    for (const e of escrows ?? []) {
      if (e.milestone_id) {
        // Keep the "best" status: held > released > pending
        const existing = escrowByMilestone[e.milestone_id];
        if (!existing || e.status === "held" || (e.status === "released" && existing === "pending")) {
          escrowByMilestone[e.milestone_id] = e.status;
        }
      }
    }

    const jobMap: Record<string, any> = {};
    for (const j of jobData ?? []) {
      jobMap[j.id] = j;
    }

    const result: Record<string, JobAction[]> = {};

    for (const jobId of jobIds) {
      const jobActions: JobAction[] = [];
      const job = jobMap[jobId];
      const ms = milestonesByJob[jobId] ?? [];

      if (!job || ["completed", "cancelled"].includes(job.status)) {
        result[jobId] = [];
        continue;
      }

      if (role === "provider") {
        // Action: Set up milestones
        if (!job.milestones_confirmed && ["accepted"].includes(job.status)) {
          jobActions.push({ jobId, label: "Set up milestones", type: "setup" });
        }

        // Action: Complete milestone (pending milestone with escrow held)
        for (const m of ms) {
          if (m.status === "pending") {
            const escrowStatus = escrowByMilestone[m.id];
            if (escrowStatus === "held" || escrowStatus === "released") {
              jobActions.push({ jobId, label: "Mark milestone as complete", type: "complete" });
              break; // one alert per job is enough
            }
          }
        }
      }

      if (role === "customer") {
        // Action: Review completed milestone
        const hasCompletedMilestone = ms.some(m => m.status === "completed");
        if (hasCompletedMilestone) {
          jobActions.push({ jobId, label: "Review completed milestone", type: "review" });
        }

        // Action: Payment required (pending milestone, no escrow held, milestones confirmed)
        if (job.milestones_confirmed) {
          // Find the first pending milestone by sort_order that needs payment
          const sorted = [...ms].sort((a, b) => a.sort_order - b.sort_order);
          for (const m of sorted) {
            if (m.status === "pending") {
              const escrowStatus = escrowByMilestone[m.id];
              if (!escrowStatus || escrowStatus === "pending") {
                // Only flag if no earlier milestone is also pending payment (one at a time)
                jobActions.push({ jobId, label: "Payment required", type: "payment" });
                break;
              }
              break; // stop at first pending milestone
            }
          }
        }
      }

      result[jobId] = jobActions;
    }

    setActions(result);
    setLoading(false);
  };

  const totalActionCount = Object.values(actions).reduce((sum, a) => sum + (a.length > 0 ? 1 : 0), 0);

  return { actions, totalActionCount, loading };
}
