import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Lock, User, Phone, MapPin, Briefcase } from "lucide-react";
import type { ProviderFormData } from "./ProviderSignupStepper";

interface Props {
  form: ProviderFormData;
  updateForm: (u: Partial<ProviderFormData>) => void;
  errors: Record<string, string>;
}

const FieldError = ({ msg }: { msg?: string }) =>
  msg ? <p className="text-xs text-destructive">{msg}</p> : null;

const StepBusinessDetails = ({ form, updateForm, errors }: Props) => (
  <div className="space-y-4">
    <div className="space-y-2">
      <Label htmlFor="email">Email</Label>
      <div className="relative">
        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input id="email" type="email" placeholder="you@example.com" value={form.email} onChange={(e) => updateForm({ email: e.target.value })} className="pl-10" maxLength={255} />
      </div>
      <FieldError msg={errors.email} />
    </div>

    <div className="space-y-2">
      <Label htmlFor="password">Password</Label>
      <div className="relative">
        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input id="password" type="password" placeholder="Min. 6 characters" value={form.password} onChange={(e) => updateForm({ password: e.target.value })} className="pl-10" />
      </div>
      <FieldError msg={errors.password} />
    </div>

    <div className="space-y-2">
      <Label htmlFor="businessName">Business name</Label>
      <div className="relative">
        <Briefcase className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input id="businessName" placeholder="Smith's Plumbing" value={form.businessName} onChange={(e) => updateForm({ businessName: e.target.value })} className="pl-10" maxLength={200} />
      </div>
      <FieldError msg={errors.businessName} />
    </div>

    <div className="grid grid-cols-2 gap-3">
      <div className="space-y-2">
        <Label htmlFor="contactFirst">First name</Label>
        <div className="relative">
          <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input id="contactFirst" placeholder="John" value={form.contactFirstName} onChange={(e) => updateForm({ contactFirstName: e.target.value })} className="pl-10" maxLength={100} />
        </div>
        <FieldError msg={errors.contactFirstName} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="contactLast">Last name</Label>
        <Input id="contactLast" placeholder="Smith" value={form.contactLastName} onChange={(e) => updateForm({ contactLastName: e.target.value })} maxLength={100} />
        <FieldError msg={errors.contactLastName} />
      </div>
    </div>

    <div className="space-y-2">
      <Label htmlFor="providerPhone">Phone number</Label>
      <div className="relative">
        <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input id="providerPhone" type="tel" placeholder="+44 7700 900000" value={form.phone} onChange={(e) => updateForm({ phone: e.target.value })} className="pl-10" maxLength={20} />
      </div>
      <FieldError msg={errors.phone} />
    </div>

    <div className="space-y-2">
      <Label htmlFor="businessAddr">Business address</Label>
      <div className="relative">
        <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input id="businessAddr" placeholder="123 Trade Lane" value={form.businessAddress} onChange={(e) => updateForm({ businessAddress: e.target.value })} className="pl-10" maxLength={255} />
      </div>
      <FieldError msg={errors.businessAddress} />
    </div>

    <div className="space-y-2">
      <Label htmlFor="provPostcode">Postcode</Label>
      <Input id="provPostcode" placeholder="SW1A 1AA" value={form.postcode} onChange={(e) => updateForm({ postcode: e.target.value })} maxLength={10} />
      <FieldError msg={errors.postcode} />
    </div>

    <div className="space-y-2">
      <Label htmlFor="bizDesc">Short description (optional)</Label>
      <Textarea id="bizDesc" placeholder="Tell us about your business..." value={form.businessDescription} onChange={(e) => updateForm({ businessDescription: e.target.value })} maxLength={300} rows={3} />
      <p className="text-xs text-muted-foreground">{form.businessDescription.length}/300 characters</p>
    </div>
  </div>
);

export default StepBusinessDetails;
