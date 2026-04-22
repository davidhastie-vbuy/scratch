import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface AcceptanceDetails {
  job_address: string;
  job_phone: string;
  access_notes: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobId?: string | null;
  /** Title shown in dialog header */
  title?: string;
  /** CTA label on the confirm button */
  confirmLabel?: string;
  submitting?: boolean;
  onConfirm: (details: AcceptanceDetails) => void | Promise<void>;
}

export default function AcceptanceDetailsDialog({
  open,
  onOpenChange,
  jobId,
  title = "Confirm job site details",
  confirmLabel = "Confirm & accept",
  submitting,
  onConfirm,
}: Props) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<{ address?: string; phone?: string }>({});

  useEffect(() => {
    if (!open || !user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      // Prefer existing job-level values; fall back to profile.
      let jobAddress: string | null = null;
      let jobPhone: string | null = null;
      let jobNotes: string | null = null;
      if (jobId) {
        const { data: job } = await supabase
          .from("jobs")
          .select("job_address, job_phone, access_notes")
          .eq("id", jobId)
          .maybeSingle();
        jobAddress = (job as any)?.job_address ?? null;
        jobPhone = (job as any)?.job_phone ?? null;
        jobNotes = (job as any)?.access_notes ?? null;
      }

      let profileAddress = "";
      let profilePhone = "";
      if (!jobAddress || !jobPhone) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("address_line_1, city, postcode, phone")
          .eq("id", user.id)
          .maybeSingle();
        if (profile) {
          profileAddress = [profile.address_line_1, profile.city, profile.postcode]
            .filter(Boolean)
            .join(", ");
          profilePhone = profile.phone ?? "";
        }
      }

      if (cancelled) return;
      setAddress(jobAddress ?? profileAddress);
      setPhone(jobPhone ?? profilePhone);
      setNotes(jobNotes ?? "");
      setErrors({});
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [open, user, jobId]);

  const handleConfirm = async () => {
    const trimmedAddress = address.trim();
    const trimmedPhone = phone.trim();
    const next: typeof errors = {};
    if (trimmedAddress.length < 5) next.address = "Please enter the full job address.";
    if (trimmedPhone.length < 7) next.phone = "Please enter a valid phone number.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    await onConfirm({
      job_address: trimmedAddress,
      job_phone: trimmedPhone,
      access_notes: notes.trim(),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-4 w-4" /> {title}
          </DialogTitle>
          <DialogDescription>
            Share the full address and a contact number so your provider knows exactly where to go. These details are only visible to your selected provider.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="job-address">Full job address *</Label>
              <Textarea
                id="job-address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. 12 High Street, Crewe, CW2 6RW"
                rows={3}
                maxLength={300}
              />
              {errors.address && <p className="text-xs text-destructive">{errors.address}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="job-phone">Contact phone number *</Label>
              <Input
                id="job-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 07123 456789"
                maxLength={30}
              />
              {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="access-notes">Access restrictions or notes</Label>
              <Textarea
                id="access-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Park on driveway, side gate code 1234, dog in back garden, please call on arrival."
                rows={3}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground">Optional. Helpful for parking, gate codes, pets, working hours, etc.</p>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={submitting || loading}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
