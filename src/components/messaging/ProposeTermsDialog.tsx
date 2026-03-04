import { useState, useMemo, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Loader2, Send } from "lucide-react";
import { format, addDays, addHours } from "date-fns";
import { cn } from "@/lib/utils";

interface ProposalDefaults {
  agreed_price?: number;
  start_date?: string;
  start_time?: string;
  duration?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { agreed_price: number; start_date: string; start_time: string; duration: string; end_date: string }) => Promise<void>;
  defaults?: ProposalDefaults;
}

const parseDuration = (dur?: string): { days: number; hours: number } => {
  if (!dur) return { days: 1, hours: 0 };
  const dayMatch = dur.match(/(\d+)\s*day/i);
  const hourMatch = dur.match(/(\d+)\s*hour/i);
  return {
    days: dayMatch ? parseInt(dayMatch[1]) : 0,
    hours: hourMatch ? parseInt(hourMatch[1]) : 0,
  };
};

const ProposeTermsDialog = ({ open, onClose, onSubmit, defaults }: Props) => {
  const [price, setPrice] = useState("");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [startTime, setStartTime] = useState("09:00");
  const [durationDays, setDurationDays] = useState("1");
  const [durationHours, setDurationHours] = useState("0");
  const [submitting, setSubmitting] = useState(false);

  // Re-sync form state when defaults change or dialog opens
  useEffect(() => {
    if (open) {
      const parsed = parseDuration(defaults?.duration);
      setPrice(defaults?.agreed_price ? String(defaults.agreed_price) : "");
      setStartDate(defaults?.start_date ? new Date(defaults.start_date) : undefined);
      setStartTime(defaults?.start_time || "09:00");
      setDurationDays(String(parsed.days || 1));
      setDurationHours(String(parsed.hours || 0));
    }
  }, [open, defaults]);

  const parsedPrice = parseFloat(price);
  const parsedDays = parseInt(durationDays) || 0;
  const parsedHours = parseInt(durationHours) || 0;

  const endDate = useMemo(() => {
    if (!startDate || (parsedDays === 0 && parsedHours === 0)) return null;
    const [h, m] = startTime.split(":").map(Number);
    const start = new Date(startDate);
    start.setHours(h || 0, m || 0, 0, 0);
    return addHours(addDays(start, parsedDays), parsedHours);
  }, [startDate, startTime, parsedDays, parsedHours]);

  const durationValid = parsedDays > 0 || parsedHours > 0;
  const isValid = !isNaN(parsedPrice) && parsedPrice > 0 && startDate && durationValid;

  const durationLabel = [
    parsedDays > 0 ? `${parsedDays} day${parsedDays !== 1 ? "s" : ""}` : "",
    parsedHours > 0 ? `${parsedHours} hour${parsedHours !== 1 ? "s" : ""}` : "",
  ].filter(Boolean).join(", ");

  const handleSubmit = async () => {
    if (!isValid || !endDate) return;
    setSubmitting(true);
    await onSubmit({
      agreed_price: parsedPrice,
      start_date: startDate!.toISOString(),
      start_time: startTime,
      duration: durationLabel,
      end_date: endDate.toISOString(),
    });
    setSubmitting(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Propose Final Terms</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">
            Propose the agreed price, start date and estimated duration. The customer will be asked to confirm these terms.
          </p>

          {/* Price */}
          <div className="space-y-2">
            <Label>Agreed Price (£) *</Label>
            <Input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="e.g. 500" min="1" step="0.01" />
          </div>

          {/* Start Date */}
          <div className="space-y-2">
            <Label>Start Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !startDate && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  disabled={(date) => date < new Date()}
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Start Time */}
          <div className="space-y-2">
            <Label>Start Time</Label>
            <Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label>Estimated Duration *</Label>
            <div className="flex gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Input type="number" value={durationDays} onChange={e => setDurationDays(e.target.value)} min="0" className="w-full" />
                  <span className="text-sm text-muted-foreground whitespace-nowrap">days</span>
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Input type="number" value={durationHours} onChange={e => setDurationHours(e.target.value)} min="0" max="23" className="w-full" />
                  <span className="text-sm text-muted-foreground whitespace-nowrap">hours</span>
                </div>
              </div>
            </div>
          </div>

          {/* Calculated End Date */}
          {endDate && (
            <div className="rounded-md bg-muted/50 p-3 text-sm">
              <span className="text-muted-foreground">Estimated end: </span>
              <span className="font-medium">{format(endDate, "PPP 'at' h:mm a")}</span>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={!isValid || submitting}>
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Send Proposal
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProposeTermsDialog;
