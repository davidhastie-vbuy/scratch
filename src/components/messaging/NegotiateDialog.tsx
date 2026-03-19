import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Send } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  priceMin: number;
  priceMax: number;
  onSubmit: (data: { agreed_price: number }) => Promise<void>;
}

const NegotiateDialog = ({ open, onClose, priceMin, priceMax, onSubmit }: Props) => {
  const [price, setPrice] = useState(String(priceMin));
  const [submitting, setSubmitting] = useState(false);

  const parsedPrice = parseFloat(price);
  const priceValid = !isNaN(parsedPrice) && parsedPrice >= priceMin && parsedPrice <= priceMax;

  const handleSubmit = async () => {
    if (!priceValid) return;
    setSubmitting(true);
    await onSubmit({ agreed_price: parsedPrice });
    setSubmitting(false);
    setPrice(String(priceMin));
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
            Propose a price. The provider can accept or counter with their own terms.
          </p>

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

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={!priceValid || submitting}>
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
