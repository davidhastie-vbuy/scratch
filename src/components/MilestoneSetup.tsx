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
import { Checkbox } from "@/components/ui/checkbox";

interface MilestoneSetupProps {
  jobId: string;
  agreedPrice: number;
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

const MilestoneSetup = ({ jobId, agreedPrice, onConfirmed }: MilestoneSetupProps) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [milestones, setMilestones] = useState<MilestoneItem[]>([]);
  const [noMilestones, setNoMilestones] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const canSkipMilestones = agreedPrice < 500;

  const totalAllocated = milestones.reduce((sum, m) => sum + (parseFloat(m.amount) || 0), 0);
  const remaining = agreedPrice - totalAllocated;

  const addMilestone = () => {
    setMilestones(prev => [
      ...prev,
      { id: nextId(), title: "", description: "", amount: "" },
    ]);
  };

  const removeMilestone = (id: string) => {
    setMilestones(prev => prev.filter(m => m.id !== id));
  };

  const updateMilestone = (id: string, field: keyof MilestoneItem, value: string) => {
    setMilestones(prev =>
      prev.map(m => (m.id === id ? { ...m, [field]: value } : m))
    );
  };

  const handleConfirm = async () => {
    if (!noMilestones && milestones.length === 0) {
      toast({ title: "Add at least one milestone", variant: "destructive" });
      return;
    }

    if (!noMilestones) {
      // Validate all milestones have title and amount
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
      if (noMilestones) {
        // Single full-payment milestone
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
        // Insert each milestone
        const inserts = milestones.map((m, i) => ({
          job_id: jobId,
          title: m.title.trim(),
          sort_order: i + 1,
          created_by: user!.id,
          payment_amount: parseFloat(m.amount),
          is_auto: false,
        }));

        // If there's remaining balance, add a final milestone
        if (remaining > 0.01) {
          inserts.push({
            job_id: jobId,
            title: "Final Payment",
            sort_order: milestones.length + 1,
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
          {milestones.length > 0 && (
            <>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Allocated to Milestones</span>
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

        <p className="text-sm text-muted-foreground">
          Define the milestones for this job. Each milestone should describe what will be completed and the payment due at that point.
          The final payment will automatically cover any remaining balance.
        </p>

        {/* Skip milestones for jobs under £500 */}
        {canSkipMilestones && (
          <div className="flex items-start gap-3 rounded-lg border p-3">
            <Checkbox
              id="no-milestones"
              checked={noMilestones}
              onCheckedChange={(c) => {
                setNoMilestones(!!c);
                if (c) setMilestones([]);
              }}
            />
            <div>
              <Label htmlFor="no-milestones" className="text-sm font-medium cursor-pointer">
                No additional milestones — full payment upfront
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                For jobs under £500, you can request full payment before starting.
              </p>
            </div>
          </div>
        )}

        {/* Milestone list */}
        {!noMilestones && (
          <div className="space-y-3">
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

            <Button variant="outline" size="sm" onClick={addMilestone}>
              <Plus className="mr-1 h-3 w-3" /> Add Milestone
            </Button>
          </div>
        )}

        <Button
          onClick={handleConfirm}
          disabled={confirming || (!noMilestones && milestones.length === 0) || totalAllocated > agreedPrice}
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
