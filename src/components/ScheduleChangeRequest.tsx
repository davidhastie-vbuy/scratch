import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Loader2 } from "lucide-react";
import { format } from "date-fns";

interface Props {
  jobId: string;
  role: "customer" | "provider";
  onResolved: () => void;
}

const ScheduleChangeRequest = ({ jobId, role, onResolved }: Props) => {
  const { toast } = useToast();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, [jobId]);

  const fetchRequests = async () => {
    const { data } = await supabase
      .from("schedule_change_requests")
      .select("*")
      .eq("job_id", jobId)
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    setRequests(data ?? []);
    setLoading(false);
  };

  const handleDecision = async (requestId: string, decision: "accepted" | "rejected", proposedStart?: string, proposedEnd?: string) => {
    setProcessing(true);

    // Update the request status
    await supabase
      .from("schedule_change_requests")
      .update({ status: decision, resolved_at: new Date().toISOString() } as any)
      .eq("id", requestId);

    if (decision === "accepted" && proposedStart && proposedEnd) {
      // Update the job schedule
      await supabase
        .from("jobs")
        .update({ scheduled_start: proposedStart, scheduled_end: proposedEnd } as any)
        .eq("id", jobId);
      toast({ title: "Schedule updated", description: "The new schedule has been applied." });
    } else {
      toast({ title: "Schedule change rejected", description: "The job schedule remains unchanged." });
    }

    setProcessing(false);
    fetchRequests();
    onResolved();
  };

  if (loading || requests.length === 0) return null;

  return (
    <div className="space-y-3">
      {requests.map(req => (
        <div key={req.id} className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">
              {role === "customer" ? "Provider requested a schedule change" : "Schedule change pending approval"}
            </p>
            <Badge variant="outline" className="text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700">Pending</Badge>
          </div>
          <div className="grid gap-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Proposed Start</span>
              <span>{format(new Date(req.proposed_start), "PPP 'at' h:mm a")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Proposed End</span>
              <span>{format(new Date(req.proposed_end), "PPP 'at' h:mm a")}</span>
            </div>
          </div>
          {role === "customer" && (
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => handleDecision(req.id, "accepted", req.proposed_start, req.proposed_end)}
                disabled={processing}
              >
                {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                Accept
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDecision(req.id, "rejected")}
                disabled={processing}
              >
                <X className="mr-2 h-4 w-4" /> Reject
              </Button>
            </div>
          )}
          {role === "provider" && (
            <p className="text-xs text-muted-foreground">Waiting for the customer to approve or reject this change.</p>
          )}
        </div>
      ))}
    </div>
  );
};

export default ScheduleChangeRequest;
