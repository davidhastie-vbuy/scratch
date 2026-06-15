import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { FileText } from "lucide-react";
import type { ProviderFormData } from "./ProviderSignupStepper";

interface Props {
  form: ProviderFormData;
  tradeCategories: { id: string; name: string; slug: string }[];
  agreements: { callback: boolean; terms: boolean };
  onAgreementsChange: (a: { callback: boolean; terms: boolean }) => void;
  errors: Record<string, string>;
}

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="space-y-2">
    <h3 className="text-sm font-semibold text-foreground">{title}</h3>
    <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm space-y-1">{children}</div>
  </div>
);

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between gap-2">
    <span className="text-muted-foreground">{label}</span>
    <span className="text-right font-medium">{value || "—"}</span>
  </div>
);

const StepReviewSubmit = ({ form, tradeCategories, agreements, onAgreementsChange, errors }: Props) => {
  const categoryName = tradeCategories.find((c) => c.slug === form.tradeCategory)?.name ?? form.tradeCategory;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Please review your details before submitting. You can go back to make changes.
      </p>

      <Section title="Personal & Business Details">
        <Row label="Email" value={form.email} />
        <Row label="Business Name" value={form.businessName} />
        <Row label="Contact" value={`${form.contactFirstName} ${form.contactLastName}`} />
        <Row label="Phone" value={form.phone} />
        <Row label="Address" value={form.businessAddress} />
        <Row label="Postcode" value={form.postcode} />
        {form.businessDescription && <Row label="Description" value={form.businessDescription} />}
      </Section>

      <Section title="Trade Details">
        <Row label="Trade Category" value={categoryName} />
        <Row label="Experience" value={form.yearsExperience} />
        <Row label="Qualifications" value={form.qualificationsCertifications} />
        <Row label="About Work" value={form.aboutWork} />
        {form.accreditations.length > 0 && (
          <div>
            <span className="text-muted-foreground">Accreditations</span>
            <div className="mt-1 flex flex-wrap gap-1">
              {form.accreditations.map((a) => (
                <Badge key={a} variant="outline" className="text-xs">{a}</Badge>
              ))}
            </div>
          </div>
        )}
        {form.supportingDocuments.length > 0 && (
          <div>
            <span className="text-muted-foreground">Documents ({form.supportingDocuments.length})</span>
            <div className="mt-1 space-y-1">
              {form.supportingDocuments.map((f, i) => (
                <div key={i} className="flex items-center gap-1 text-xs">
                  <FileText className="h-3 w-3" /> {f.name}
                </div>
              ))}
            </div>
          </div>
        )}
      </Section>

      <Section title="Operating Areas">
        <div className="flex flex-wrap gap-1">
          {form.operatingAreas.map((a) => (
            <Badge key={a} variant="secondary">{a}</Badge>
          ))}
        </div>
      </Section>

      {/* Agreement checkboxes */}
      <div className="space-y-3 border border-border p-4">
        <h3 className="text-sm font-semibold text-foreground">Agreements</h3>

        <div className="flex items-start gap-2">
          <Checkbox
            id="agree-callback"
            checked={agreements.callback}
            onCheckedChange={(checked) => onAgreementsChange({ ...agreements, callback: !!checked })}
          />
          <Label htmlFor="agree-callback" className="text-xs font-normal leading-tight cursor-pointer">
            I understand I must respond to callback requests within 24 hours if I accept them, and follow through on commitments.
          </Label>
        </div>

        <div className="flex items-start gap-2">
          <Checkbox
            id="agree-terms"
            checked={agreements.terms}
            onCheckedChange={(checked) => onAgreementsChange({ ...agreements, terms: !!checked })}
          />
          <Label htmlFor="agree-terms" className="text-xs font-normal leading-tight cursor-pointer">
            I agree to the{" "}
            <a href="/legal?audience=provider" target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">Terms & Conditions</a>, including the commission structure.
          </Label>
        </div>

        {errors.agreements && <p className="text-xs text-destructive">{errors.agreements}</p>}
      </div>
    </div>
  );
};

export default StepReviewSubmit;
