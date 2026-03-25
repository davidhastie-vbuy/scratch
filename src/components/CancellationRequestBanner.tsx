import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Loader2, XCircle } from "lucide-react";

interface Props {
  jobId: string;
  role: "customer" | "provider";
  onResolved?: () => void;
}

const CancellationRequestBanner = ({ jobId, role, onResolved }: Props) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [request, setRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);

  useEffect(() => {
    if (!jobId || !user) return;
    fetchRequest();
  }, [jobId, user]);

  const fetchRequest = async () => {
    // Find conversation for this job involving the current user
    const { data: convs } = await supabase
      .from("conversations")
      .select("id")
      .eq("job_id", jobId);

    if (!convs || convs.length === 0) {
      setLoading(false);
      return;
    }

    const convIds = convs.map(c => c.id);

    // Find any pending cancellation_request message in these conversations
    const { data: msgs } = await supabase
      .from("messages")
      .select("*")
      .in("conversation_id", convIds)
      .eq("message_type", "cancellation_request")
      .order("created_at", { ascending: false })
      .limit(1);

    const pending = msgs?.find(m => (m as any).metadata?.status === "pending");
    setRequest(pending ?? null);
    setLoading(false);
  };

  if (loading || !request) return null;

  const meta = (request as any).metadata;
  const isProviderInitiated = meta?.initiated_by === "provider";
  const requestedByMe = meta?.requested_by === user?.id;

  // Determine if the current user needs to act
  const canAct = !requestedByMe;

  const handleConfirm = async () => {
    setActing(true);
    await supabase.from("messages").update({
      metadata: { ...meta, status: "accepted" },
    } as any).eq("id", request.id);

    await supabase.from("jobs").update({ status: "cancelled" } as any).eq("id", jobId);

    await supabase.from("messages").insert({
      conversation_id: request.conversation_id,
      sender_user_id: user!.id,
      body: `✅ Cancellation confirmed by the ${role}. The job has been cancelled.`,
      message_type: "system",
    } as any);

    toast({ title: "Job cancelled", description: "Both parties agreed to cancel." });
    setRequest(null);
    setActing(false);
    onResolved?.();
  };

  const handleDecline = async () => {
    setActing(true);
    await supabase.from("messages").update({
      metadata: { ...meta, status: "rejected" },
    } as any).eq("id", request.id);

    await supabase.from("messages").insert({
      conversation_id: request.conversation_id,
      sender_user_id: user!.id,
      body: `❌ The ${role} has declined the cancellation request. The job will continue as planned.`,
      message_type: "system",
    } as any);

    toast({ title: "Cancellation declined" });
    setRequest(null);
    setActing(false);
    onResolved?.();
  };

  return (
    <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
      <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
      <div className="flex-1 space-y-2">
        <p className="font-semibold text-sm text-destructive">Cancellation Request</p>
        <p className="text-sm text-muted-foreground">
          {requestedByMe
            ? `You have requested to cancel this job. Waiting for the ${isProviderInitiated ? "customer" : "provider"} to respond.`
            : `The ${isProviderInitiated ? "provider" : "customer"} has requested to cancel this job. Please confirm or decline.`}
        </p>
        {canAct && (
          <div className="flex gap-2 pt-1">
            <Button size="sm" variant="destructive" onClick={handleConfirm} disabled={acting}>
              {acting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm Cancel
            </Button>
            <Button size="sm" variant="outline" onClick={handleDecline} disabled={acting}>
              Decline
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CancellationRequestBanner;
