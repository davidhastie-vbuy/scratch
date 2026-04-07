import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Loader2, PoundSterling, CheckCircle2, Circle, RefreshCw } from "lucide-react";

interface MilestonePaymentSectionProps {
  jobId: string;
  agreedPrice: number;
  escrowPayments: any[];
  onPaymentComplete: () => void;
}

const MilestonePaymentSection = ({ jobId, agreedPrice, escrowPayments, onPaymentComplete }: MilestonePaymentSectionProps) => {
  const { toast } = useToast();
  const [milestones, setMilestones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);

  useEffect(() => {
    fetchMilestones();
  }, [jobId]);

  const fetchMilestones = async () => {
    const { data } = await supabase
      .from("job_milestones")
      .select("*")
      .eq("job_id", jobId)
      .order("sort_order");
    setMilestones(data ?? []);
    setLoading(false);
  };

  const getPaymentForMilestone = (milestoneId: string) => {
    return escrowPayments.find(p => p.milestone_id === milestoneId && (p.status === "held" || p.status === "released"));
  };

  const getPendingPaymentForMilestone = (milestoneId: string) => {
    return escrowPayments.find(p => p.milestone_id === milestoneId && p.status === "pending");
  };

  const payMilestone = async (milestoneId: string, amount: number) => {
    setProcessingPayment(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-escrow-payment", {
        body: { job_id: jobId, amount, milestone_id: milestoneId },
      });
      if (error) {
        // Try to extract the actual error message from the response
        let errorMsg = error.message;
        try {
          if (error.context) {
            const body = await error.context.json();
            if (body?.error) errorMsg = body.error;
          }
        } catch {}
        toast({ title: "Payment failed", description: errorMsg, variant: "destructive" });
      } else if (data?.url) {
        window.location.href = data.url;
      } else {
        toast({ title: "Payment failed", description: "No checkout URL returned. Please try again.", variant: "destructive" });
      }
    } catch (err: any) {
      console.error("Payment error:", err);
      toast({ title: "Payment failed", description: "An unexpected error occurred. Please try again.", variant: "destructive" });
    }
    setProcessingPayment(false);
  };

  if (loading) return <Loader2 className="h-4 w-4 animate-spin text-primary" />;

  if (milestones.length === 0) {
    return <p className="text-sm text-muted-foreground">No milestones set up yet.</p>;
  }

  // Find the next unpaid milestone — pending (abandoned) payments should NOT block retry
  const nextUnpaid = milestones.find(m => !getPaymentForMilestone(m.id));

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Pay each milestone before that stage of work begins. Funds are held securely and released as milestones are accepted.
      </p>
      <div className="space-y-2">
        {milestones.map((m) => {
          const paid = getPaymentForMilestone(m.id);
          const pending = getPendingPaymentForMilestone(m.id);
          const isNext = nextUnpaid?.id === m.id;

          return (
            <div key={m.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
              <div className="flex items-center gap-2">
                {paid ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                ) : (
                  <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
                )}
                <div>
                  <p className="font-medium">{m.title}</p>
                  {m.payment_amount && (
                    <p className="text-xs text-muted-foreground">£{Number(m.payment_amount).toFixed(2)}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {paid && (
                  <Badge variant="default" className="text-xs">
                    {paid.status === "released" ? "Released" : "Paid"}
                  </Badge>
                )}
                {pending && !paid && (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">Pending confirmation</Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        const { data, error } = await supabase.functions.invoke("confirm-escrow-payment", {
                          body: { job_id: jobId },
                        });
                        if (!error && data?.confirmed > 0) {
                          toast({ title: "Payment confirmed!" });
                          onPaymentComplete();
                        } else if (!error && data?.expired > 0) {
                          toast({ title: "Payment not completed", description: "The checkout session expired. Please try paying again." });
                          onPaymentComplete(); // refresh to show Pay button again
                        } else if (!error) {
                          toast({ title: "Still processing", description: "Payment not yet confirmed. Please try again shortly." });
                        } else {
                          toast({ title: "Not yet confirmed", description: "Please try again shortly.", variant: "destructive" });
                        }
                      }}
                    >
                      <RefreshCw className="mr-1 h-3 w-3" /> Check Status
                    </Button>
                  </div>
                )}
                {isNext && !paid && m.payment_amount && (
                  <Button
                    size="sm"
                    onClick={() => payMilestone(m.id, Number(m.payment_amount))}
                    disabled={processingPayment}
                  >
                    {processingPayment ? (
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    ) : (
                      <PoundSterling className="mr-1 h-3 w-3" />
                    )}
                    Pay £{Number(m.payment_amount).toFixed(2)}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MilestonePaymentSection;
