import { useEffect, useState } from "react";
import { getSiteUrl } from "@/lib/site-url";
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

  // Helper to get job + other party info for notifications/emails
  const getJobAndOtherParty = async () => {
    const { data: job } = await supabase.from("jobs").select("title, category, postcode_district, customer_user_id, provider_id").eq("id", jobId).single();
    if (!job) return null;

    const otherUserId = role === "customer" ? job.provider_id : job.customer_user_id;
    if (!otherUserId) return null;

    const { data: otherProfile } = await supabase.from("profiles").select("email, first_name").eq("id", otherUserId).single();

    let emailEnabled = true;
    let otherName = otherProfile?.first_name || "there";
    if (role === "customer") {
      // Other party is provider
      const { data: pp } = await supabase.from("provider_profiles").select("email_notifications_enabled, contact_first_name, business_name").eq("user_id", otherUserId).single();
      if (pp?.email_notifications_enabled === false) emailEnabled = false;
      otherName = pp?.contact_first_name || otherProfile?.first_name || "there";
    }

    return { job, otherUserId, otherEmail: otherProfile?.email, otherName, emailEnabled };
  };

  const sendCancellationEmail = async (
    to: string,
    recipientName: string,
    jobTitle: string,
    category: string,
    postcode: string,
    subject: string,
    bodyText: string,
    ctaUrl: string,
    ctaLabel: string,
  ) => {
    const catLabel = category ? category.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()) : "N/A";
    const html = `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;background:#ffffff;">
      <div style="text-align:center;padding-bottom:16px;border-bottom:2px solid #1a1a2e;"><h1 style="margin:0;font-size:22px;color:#1a1a2e;">BookATrade</h1></div>
      <div style="padding:24px 0;">
        <p style="font-size:15px;color:#333;">Hi ${recipientName},</p>
        <p style="font-size:15px;color:#333;">${bodyText}</p>
        <div style="background:#f4f4f8;border-left:4px solid #1a1a2e;padding:16px;margin:16px 0;border-radius:4px;">
          <p style="margin:0 0 6px;font-size:14px;color:#555;"><strong>Job:</strong> ${jobTitle}</p>
          <p style="margin:0 0 6px;font-size:14px;color:#555;"><strong>Category:</strong> ${catLabel}</p>
          <p style="margin:0;font-size:14px;color:#555;"><strong>Area:</strong> ${postcode}</p>
        </div>
        <div style="text-align:center;padding:16px 0;">
          <a href="${ctaUrl}" style="display:inline-block;background:#1a1a2e;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:6px;font-size:15px;font-weight:bold;">${ctaLabel}</a>
        </div>
      </div>
      <div style="text-align:center;padding-top:16px;border-top:1px solid #eee;"><p style="font-size:12px;color:#aaa;margin:0;">&copy; BookATrade. All rights reserved.</p></div>
    </div>`;
    await supabase.functions.invoke("send-provider-email", {
      body: { to, subject, html },
    });
  };

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

    // Notify the other party
    try {
      const info = await getJobAndOtherParty();
      if (info && info.otherEmail && info.emailEnabled) {
        const otherRole = role === "customer" ? "provider" : "customer";
        const ctaUrl = otherRole === "provider"
          ? `${getSiteUrl()}/provider/jobs/${jobId}`
          : `${getSiteUrl()}/dashboard/jobs/${jobId}`;
        await sendCancellationEmail(
          info.otherEmail,
          info.otherName,
          info.job.title,
          info.job.category,
          info.job.postcode_district,
          `BookATrade: Cancellation confirmed for "${info.job.title}"`,
          `The ${role} has confirmed the cancellation request. The job "${info.job.title}" has been cancelled.`,
          ctaUrl,
          "View Job",
        );
      }
    } catch (e) { console.error("Failed to send cancellation confirm email:", e); }

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

    // Notify the other party
    try {
      const info = await getJobAndOtherParty();
      if (info && info.otherEmail && info.emailEnabled) {
        const otherRole = role === "customer" ? "provider" : "customer";
        const ctaUrl = otherRole === "provider"
          ? `${getSiteUrl()}/provider/jobs/${jobId}`
          : `${getSiteUrl()}/dashboard/jobs/${jobId}`;
        await sendCancellationEmail(
          info.otherEmail,
          info.otherName,
          info.job.title,
          info.job.category,
          info.job.postcode_district,
          `BookATrade: Cancellation declined for "${info.job.title}"`,
          `The ${role} has declined the cancellation request. The job "${info.job.title}" will continue as planned.`,
          ctaUrl,
          "View Job",
        );
      }
    } catch (e) { console.error("Failed to send cancellation decline email:", e); }

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
