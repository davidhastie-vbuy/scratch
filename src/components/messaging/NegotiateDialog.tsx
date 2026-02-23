import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, Send } from "lucide-react";

const URGENCY_OPTIONS = [
  { value: "asap", label: "ASAP" },
  { value: "within_a_week", label: "Within a week" },
  { value: "within_a_month", label: "Within a month" },
  { value: "within_3_months", label: "Within 3 months" },
  { value: "within_6_months", label: "Within 6 months" },
  { value: "within_12_months", label: "Within 12 months" },
];

interface Props {
  open: boolean;
  onClose: () => void;
  priceMin: number;
  priceMax: number;
  onSubmit: (data: { agreed_price: number; urgency: string; urgency_label: string }) => Promise<void>;
}

const NegotiateDialog = ({ open, onClose, priceMin, priceMax, onSubmit }: Props) => {
  const [price, setPrice] = useState(String(priceMin));
  const [urgency, setUrgency] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const parsedPrice = parseFloat(price);
  const priceValid = !isNaN(parsedPrice) && parsedPrice >= priceMin && parsedPrice <= priceMax;
  const isValid = priceValid && urgency;

  const handleSubmit = async () => {
    if (!isValid) return;
    const urgencyLabel = URGENCY_OPTIONS.find(o => o.value === urgency)?.label || urgency;
    setSubmitting(true);
    await onSubmit({
      agreed_price: parsedPrice,
      urgency,
      urgency_label: urgencyLabel,
    });
    setSubmitting(false);
    setPrice(String(priceMin));
    setUrgency("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Negotiate Terms</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">
            Propose a price and how soon you'd like the work done. The provider can accept or counter with their own terms.
          </p>

          {/* Price */}
          <div className="space-y-2">
            <Label>Proposed Price (£) *</Label>
            <Input
              type="number"
              value={price}
              onChange={e => setPrice(e.target.value)}
              min={priceMin}
              max={priceMax}
              step="0.01"
            />
            <p className="text-xs text-muted-foreground">
              Must be between £{priceMin.toFixed(0)} and £{priceMax.toFixed(0)} (provider's quoted range)
            </p>
            {price && !priceValid && (
              <p className="text-xs text-destructive">Price must be between £{priceMin.toFixed(0)} and £{priceMax.toFixed(0)}</p>
            )}
          </div>

          {/* Urgency */}
          <div className="space-y-3">
            <Label>How soon do you need this done? *</Label>
            <RadioGroup value={urgency} onValueChange={setUrgency} className="grid gap-2">
              {URGENCY_OPTIONS.map(opt => (
                <div key={opt.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={opt.value} id={`urgency-${opt.value}`} />
                  <Label htmlFor={`urgency-${opt.value}`} className="font-normal cursor-pointer">{opt.label}</Label>
                </div>
              ))}
            </RadioGroup>
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

export default NegotiateDialog;
