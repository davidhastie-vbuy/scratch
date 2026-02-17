import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Loader2, Send } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { agreed_price: number; start_date: string; start_time: string; duration: string }) => Promise<void>;
}

const ProposeTermsDialog = ({ open, onClose, onSubmit }: Props) => {
  const [price, setPrice] = useState("");
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [startTime, setStartTime] = useState("09:00");
  const [duration, setDuration] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!price || !startDate || !duration) return;
    setSubmitting(true);
    await onSubmit({
      agreed_price: parseFloat(price),
      start_date: startDate.toISOString(),
      start_time: startTime,
      duration,
    });
    setSubmitting(false);
    setPrice("");
    setStartDate(undefined);
    setStartTime("09:00");
    setDuration("");
    onClose();
  };

  const isValid = price && parseFloat(price) > 0 && startDate && duration.trim();

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
          <div className="space-y-2">
            <Label>Agreed Price (£) *</Label>
            <Input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="e.g. 500" min="1" />
          </div>
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
          <div className="space-y-2">
            <Label>Start Time</Label>
            <Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Estimated Duration *</Label>
            <Input value={duration} onChange={e => setDuration(e.target.value)} placeholder="e.g. 3 days, 1 week" />
          </div>
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
