import { useRef } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Upload, X, FileText } from "lucide-react";
import type { ProviderFormData } from "./ProviderSignupStepper";

interface Props {
  form: ProviderFormData;
  updateForm: (u: Partial<ProviderFormData>) => void;
  errors: Record<string, string>;
  tradeCategories: { id: string; name: string; slug: string }[];
}

const EXPERIENCE_OPTIONS = [
  "Less than 1 year",
  "1-3 years",
  "3-5 years",
  "5-10 years",
  "10-20 years",
  "20+ years",
];

const ACCREDITATION_OPTIONS = [
  "Public Liability Insurance",
  "Gas Safe Registered",
  "NICEIC / Electrical Certification",
];

const FieldError = ({ msg }: { msg?: string }) =>
  msg ? <p className="text-xs text-destructive">{msg}</p> : null;

const StepTradeDetails = ({ form, updateForm, errors, tradeCategories }: Props) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleAccreditation = (value: string) => {
    const current = form.accreditations;
    updateForm({
      accreditations: current.includes(value)
        ? current.filter((a) => a !== value)
        : [...current, value],
    });
  };

  const handleFileAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const valid = files.filter((f) => f.size <= 5 * 1024 * 1024);
    if (valid.length < files.length) {
      // silently skip oversized
    }
    updateForm({ supportingDocuments: [...form.supportingDocuments, ...valid] });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (index: number) => {
    updateForm({ supportingDocuments: form.supportingDocuments.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Primary Trade Category</Label>
        <Select value={form.tradeCategory} onValueChange={(v) => updateForm({ tradeCategory: v })}>
          <SelectTrigger>
            <SelectValue placeholder="Select your trade" />
          </SelectTrigger>
          <SelectContent>
            {tradeCategories.map((cat) => (
              <SelectItem key={cat.id} value={cat.slug}>{cat.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldError msg={errors.tradeCategory} />
      </div>

      <div className="space-y-2">
        <Label>Years of Experience</Label>
        <Select value={form.yearsExperience} onValueChange={(v) => updateForm({ yearsExperience: v })}>
          <SelectTrigger>
            <SelectValue placeholder="Select experience" />
          </SelectTrigger>
          <SelectContent>
            {EXPERIENCE_OPTIONS.map((opt) => (
              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldError msg={errors.yearsExperience} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="qualifications">Qualifications and Certifications</Label>
        <Textarea
          id="qualifications"
          placeholder="List your qualifications, e.g. NVQ Level 3, City & Guilds..."
          value={form.qualificationsCertifications}
          onChange={(e) => updateForm({ qualificationsCertifications: e.target.value })}
          maxLength={1000}
          rows={3}
        />
        <FieldError msg={errors.qualificationsCertifications} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="aboutWork">About Your Work</Label>
        <Textarea
          id="aboutWork"
          placeholder="Describe the type of work you do and what sets you apart..."
          value={form.aboutWork}
          onChange={(e) => updateForm({ aboutWork: e.target.value })}
          maxLength={1000}
          rows={3}
        />
        <FieldError msg={errors.aboutWork} />
      </div>

      <div className="space-y-3">
        <Label>Accreditations</Label>
        {ACCREDITATION_OPTIONS.map((opt) => (
          <div key={opt} className="flex items-center gap-2">
            <Checkbox
              id={`accred-${opt}`}
              checked={form.accreditations.includes(opt)}
              onCheckedChange={() => toggleAccreditation(opt)}
            />
            <Label htmlFor={`accred-${opt}`} className="text-sm font-normal cursor-pointer">{opt}</Label>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <Label>Supporting Documents (optional)</Label>
        <p className="text-xs text-muted-foreground">Upload qualifications, insurance certificates, etc. Max 5MB each.</p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
          className="hidden"
          onChange={handleFileAdd}
        />
        <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
          <Upload className="mr-2 h-4 w-4" />
          Upload files
        </Button>
        {form.supportingDocuments.length > 0 && (
          <div className="mt-2 space-y-1">
            {form.supportingDocuments.map((file, i) => (
              <div key={i} className="flex items-center gap-2 rounded border border-border bg-muted/50 px-3 py-1.5 text-sm">
                <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="flex-1 truncate">{file.name}</span>
                <button type="button" onClick={() => removeFile(i)} className="text-muted-foreground hover:text-destructive">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StepTradeDetails;
