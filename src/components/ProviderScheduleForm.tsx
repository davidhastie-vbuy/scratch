import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { CalendarIcon, Loader2, Send, ChevronDown } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Props {
  jobId: string;
  currentStart?: string | null;
  currentEnd?: string | null;
  onRequested: () => void;
}

const ProviderScheduleForm = ({ jobId, currentStart, currentEnd, onRequested }: Props) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [startDate, setStartDate] = useState<Date | undefined>(currentStart ? new Date(currentStart) : undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(currentEnd ? new Date(currentEnd) : undefined);
  const [startTime, setStartTime] = useState(currentStart ? format(new Date(currentStart), "HH:mm") : "09:00");
  const [endTime, setEndTime] = useState(currentEnd ? format(new Date(currentEnd), "HH:mm") : "17:00");
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);

  const handleSubmit = async () => {
    if (!startDate || !endDate) {
      toast({ title: "Please select both start and end dates", variant: "destructive" });
      return;
    }

    const [sh, sm] = startTime.split(":").map(Number);
    const [eh, em] = endTime.split(":").map(Number);
    const proposedStart = new Date(startDate);
    proposedStart.setHours(sh, sm, 0, 0);
    const proposedEnd = new Date(endDate);
    proposedEnd.setHours(eh, em, 0, 0);

    if (proposedEnd <= proposedStart) {
      toast({ title: "End must be after start", variant: "destructive" });
      return;
    }

    setSaving(true);
    const { error } = await supabase
      .from("schedule_change_requests")
      .insert({
        job_id: jobId,
        requested_by: user!.id,
        proposed_start: proposedStart.toISOString(),
        proposed_end: proposedEnd.toISOString(),
      } as any);

    if (error) {
      toast({ title: "Failed to request schedule change", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Schedule change requested", description: "The customer will need to approve this change." });
      onRequested();
    }
    setSaving(false);
  };

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex items-center gap-2 w-full text-sm text-muted-foreground hover:text-foreground transition-colors py-1">
        <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
        <span>Propose a new schedule. The customer must approve the change before it takes effect.</span>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-4 pt-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Start Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !startDate && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={startDate} onSelect={setStartDate} className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-2">
            <Label>Start Time</Label>
            <Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>End Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !endDate && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={endDate} onSelect={setEndDate} className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-2">
            <Label>End Time</Label>
            <Input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} />
          </div>
        </div>
        <Button onClick={handleSubmit} disabled={saving}>
          {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting…</> : <><Send className="mr-2 h-4 w-4" /> Request Schedule Change</>}
        </Button>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default ProviderScheduleForm;
