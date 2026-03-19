import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Plus, Trash2, Loader2, CheckCircle2, PoundSterling, AlertTriangle,
} from "lucide-react";


interface MilestoneSetupProps {
  jobId: string;
  agreedPrice: number;
  scheduledStart?: string | null;
  scheduledEnd?: string | null;
  onConfirmed: () => void;
}

interface MilestoneItem {
  id: string;
  title: string;
  description: string;
  amount: string;
}

let tempId = 0;
const nextId = () => `temp-${++tempId}`;

const getDepositInfo = (price: number) => {
  if (price < 200) return { depositPercent: 100, depositAmount: price, noMilestonesRequired: true };
  if (price < 2000) return { depositPercent: 20, depositAmount: Math.round(price * 0.2 * 100) / 100, noMilestonesRequired: false };
  return { depositPercent: 10, depositAmount: Math.round(price * 0.1 * 100) / 100, noMilestonesRequired: false };
};

const generateSuggestedMilestones = (
  agreedPrice: number,
  depositAmount: number,
  scheduledStart?: string | null,
  scheduledEnd?: string | null,
): MilestoneItem[] => {
  const remaining = agreedPrice - depositAmount;
  if (remaining <= 0) return [];

  // Calculate duration in weeks (minimum 1)
  let durationWeeks = 1;
  if (scheduledStart && scheduledEnd) {
    const start = new Date(scheduledStart);
    const end = new Date(scheduledEnd);
    const diffMs = end.getTime() - start.getTime();
    durationWeeks = Math.max(1, Math.round(diffMs / (7 * 24 * 60 * 60 * 1000)));
  }

  // For a job of N weeks: deposit + N intermediate milestones + completion = N+2 total
  // The intermediate milestones = durationWeeks (one per week)
  // But the last one is the "Completion" milestone, so intermediate = durationWeeks - 1
  // Total pattern: Deposit, (durationWeeks - 1) mid milestones, Completion
  // e.g. 1 week = deposit + midway + completion = 3 milestones
  // e.g. 2 weeks = deposit + milestone + milestone + completion = 4 milestones
  const midCount = durationWeeks; // one per week (includes the midway for 1-week jobs)

  // Split remaining evenly across mid milestones + completion
  // Mid milestones share the remaining equally with the completion payment
  const totalMilestoneCount = midCount; // mid milestones (completion is added automatically as "Final Payment")
  const perMilestone = Math.round((remaining / (totalMilestoneCount + 1)) * 100) / 100;

  const suggestions: MilestoneItem[] = [];
  for (let i = 0; i < midCount; i++) {
    const weekNum = i + 1;
    let title: string;
    if (midCount === 1) {
      title = "Midway checkpoint";
    } else {
      title = `Week ${weekNum} checkpoint`;
    }
    suggestions.push({
      id: nextId(),
      title,
      description: "",
      amount: String(perMilestone),
    });
  }

  return suggestions;
};

const MilestoneSetup = ({ jobId, agreedPrice, scheduledStart, scheduledEnd, onConfirmed }: MilestoneSetupProps) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const depositInfo = getDepositInfo(agreedPrice);
  const [milestones, setMilestones] = useState<MilestoneItem[]>(() => {
    if (depositInfo.noMilestonesRequired) return [];
    return generateSuggestedMilestones(agreedPrice, depositInfo.depositAmount, scheduledStart, scheduledEnd);
  });
  const [noMilestones, setNoMilestones] = useState(depositInfo.noMilestonesRequired);
  const [confirming, setConfirming] = useState(false);

  const totalAllocated = depositInfo.depositAmount + milestones.reduce((sum, m) => sum + (parseFloat(m.amount) || 0), 0);
  const remaining = agreedPrice - totalAllocated;

  const addMilestone = () => {
    if (remaining <= 0) return;
    setMilestones(prev => [
      ...prev,
      { id: nextId(), title: "", description: "", amount: "" },
    ]);
  };

  const removeMilestone = (id: string) => {
    setMilestones(prev => prev.filter(m => m.id !== id));
  };

  const updateMilestone = (id: string, field: keyof MilestoneItem, value: string) => {
    if (field === "amount") {
      const numVal = parseFloat(value);
      if (!isNaN(numVal)) {
        // Calculate max allowed for this milestone: current remaining + this milestone's current value
        const currentMilestoneAmount = parseFloat(milestones.find(m => m.id === id)?.amount || "0") || 0;
        const maxAllowed = remaining + currentMilestoneAmount;
        if (numVal > maxAllowed) {
          value = String(Math.round(maxAllowed * 100) / 100);
        }
      }
    }
    setMilestones(prev =>
      prev.map(m => (m.id === id ? { ...m, [field]: value } : m))
    );
  };

  const handleConfirm = async () => {
    if (!depositInfo.noMilestonesRequired && !noMilestones) {
      // Validate additional milestones have title and amount
      for (const m of milestones) {
        if (!m.title.trim()) {
          toast({ title: "All milestones need a title", variant: "destructive" });
          return;
        }
        const amt = parseFloat(m.amount);
        if (!amt || amt <= 0) {
          toast({ title: `Enter a valid amount for "${m.title}"`, variant: "destructive" });
          return;
        }
      }

      // Validate total doesn't exceed agreed price
      if (totalAllocated > agreedPrice) {
        toast({ title: "Milestone totals exceed agreed price", variant: "destructive" });
        return;
      }
    }

    setConfirming(true);

    try {
      // Remove any previously saved (non-auto) milestones to prevent duplicates
      await supabase.from("job_milestones").delete().eq("job_id", jobId).eq("is_auto", false);

      if (depositInfo.noMilestonesRequired) {
        // Under £200: single full payment
        const { error } = await supabase.from("job_milestones").insert({
          job_id: jobId,
          title: "Full Payment",
          sort_order: 0,
          created_by: user!.id,
          payment_amount: agreedPrice,
          is_auto: false,
        } as any);
        if (error) throw error;
      } else {
        // First milestone is the mandatory deposit
        const inserts: any[] = [{
          job_id: jobId,
          title: "Deposit",
          sort_order: 0,
          created_by: user!.id,
          payment_amount: depositInfo.depositAmount,
          is_auto: false,
        }];

        // Add provider's additional milestones
        milestones.forEach((m, i) => {
          inserts.push({
            job_id: jobId,
            title: m.title.trim(),
            sort_order: i + 1,
            created_by: user!.id,
            payment_amount: parseFloat(m.amount),
            is_auto: false,
          });
        });

        // If there's remaining balance, add a final milestone
        if (remaining > 0.01) {
          inserts.push({
            job_id: jobId,
            title: "Final Payment",
            sort_order: inserts.length,
            created_by: user!.id,
            payment_amount: Math.round(remaining * 100) / 100,
            is_auto: false,
          });
        }

        const { error } = await supabase.from("job_milestones").insert(inserts as any);
        if (error) throw error;
      }

      // Mark milestones as confirmed
      const { error: updateError } = await supabase
        .from("jobs")
        .update({ milestones_confirmed: true } as any)
        .eq("id", jobId);
      if (updateError) throw updateError;

      toast({ title: "Milestones confirmed!", description: "The customer will now be asked to make the first payment." });
      onConfirmed();
    } catch (err: any) {
      toast({ title: "Failed to confirm milestones", description: err.message, variant: "destructive" });
    }

    setConfirming(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" /> Set Up Milestones
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border bg-muted/30 p-3 text-sm space-y-1">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Agreed Price</span>
            <span className="font-semibold">£{agreedPrice.toFixed(2)}</span>
          </div>
          {!depositInfo.noMilestonesRequired && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Mandatory Deposit ({depositInfo.depositPercent}%)</span>
              <span className="font-semibold">£{depositInfo.depositAmount.toFixed(2)}</span>
            </div>
          )}
          {(milestones.length > 0 || !depositInfo.noMilestonesRequired) && (
            <>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Allocated</span>
                <span className={totalAllocated > agreedPrice ? "text-destructive font-semibold" : ""}>
                  £{totalAllocated.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Remaining (Final Payment)</span>
                <span className={remaining < 0 ? "text-destructive font-semibold" : "font-semibold"}>
                  £{remaining.toFixed(2)}
                </span>
              </div>
            </>
          )}
        </div>

        {totalAllocated > agreedPrice && (
          <div className="flex items-start gap-2 text-sm text-destructive">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            <p>Milestone totals exceed the agreed price. Please adjust the amounts.</p>
          </div>
        )}

        {depositInfo.noMilestonesRequired ? (
          <p className="text-sm text-muted-foreground">
            This job is under £200, so the customer will pay the full amount upfront. No milestones are needed.
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            A {depositInfo.depositPercent}% deposit (£{depositInfo.depositAmount.toFixed(2)}) will be collected as the first milestone.
            You can add additional milestones below. The final payment will automatically cover any remaining balance.
          </p>
        )}

        {/* Additional milestones for jobs £200+ */}
        {!depositInfo.noMilestonesRequired && (
          <div className="space-y-3">
            {milestones.length > 0 && (
              <p className="text-xs text-muted-foreground italic">
                These milestones have been suggested based on the job duration and cost. You can edit, remove, or add more as needed.
              </p>
            )}
            {milestones.map((m, i) => (
              <div key={m.id} className="rounded-lg border p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs">Milestone {i + 1}</Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => removeMilestone(m.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
                <div className="space-y-2">
                  <Input
                    placeholder="Milestone title (e.g. Foundation work complete)"
                    value={m.title}
                    onChange={e => updateMilestone(m.id, "title", e.target.value)}
                  />
                  <Textarea
                    placeholder="What will be completed by this milestone…"
                    value={m.description}
                    onChange={e => updateMilestone(m.id, "description", e.target.value)}
                    rows={2}
                  />
                  <div className="flex items-center gap-2">
                    <PoundSterling className="h-4 w-4 text-muted-foreground" />
                    <Input
                      type="number"
                      placeholder="Amount due"
                      value={m.amount}
                      onChange={e => updateMilestone(m.id, "amount", e.target.value)}
                      className="w-32"
                    />
                  </div>
                </div>
              </div>
            ))}

            <Button variant="outline" size="sm" onClick={addMilestone} disabled={remaining <= 0}>
              <Plus className="mr-1 h-3 w-3" /> Add Milestone
            </Button>
            {remaining <= 0 && milestones.length > 0 && (
              <p className="text-xs text-muted-foreground">
                The full agreed price has been allocated. Remove or reduce existing milestones to add more.
              </p>
            )}
          </div>
        )}

        <Button
          onClick={handleConfirm}
          disabled={confirming || totalAllocated > agreedPrice}
          className="w-full"
        >
          {confirming ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Confirming…</>
          ) : (
            <><CheckCircle2 className="mr-2 h-4 w-4" /> Confirm Milestones</>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default MilestoneSetup;
