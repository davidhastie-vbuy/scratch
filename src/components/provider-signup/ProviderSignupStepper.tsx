import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, Link } from "react-router-dom";
import { useTradeCategories } from "@/hooks/use-trade-categories";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserPlus, ArrowLeft, ArrowRight, Check, CheckCircle2, Mail } from "lucide-react";
import StepBusinessDetails from "./StepBusinessDetails";
import StepTradeDetails from "./StepTradeDetails";
import StepOperatingAreas from "./StepOperatingAreas";
import StepReviewSubmit from "./StepReviewSubmit";

export interface ProviderFormData {
  email: string;
  password: string;
  businessName: string;
  contactFirstName: string;
  contactLastName: string;
  phone: string;
  businessAddress: string;
  postcode: string;
  tradeCategory: string;
  businessDescription: string;
  yearsExperience: string;
  qualificationsCertifications: string;
  aboutWork: string;
  accreditations: string[];
  supportingDocuments: File[];
  operatingAreas: string[];
}

const STEPS = ["Business Details", "Trade Details", "Areas You Operate", "Review & Submit"];

const ProviderSignupStepper = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { categories: tradeCategories } = useTradeCategories(true);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [agreements, setAgreements] = useState({ callback: false, terms: false });

  const [form, setForm] = useState<ProviderFormData>({
    email: "",
    password: "",
    businessName: "",
    contactFirstName: "",
    contactLastName: "",
    phone: "",
    businessAddress: "",
    postcode: "",
    tradeCategory: "",
    businessDescription: "",
    yearsExperience: "",
    qualificationsCertifications: "",
    aboutWork: "",
    accreditations: [],
    supportingDocuments: [],
    operatingAreas: [],
  });

  const updateForm = (updates: Partial<ProviderFormData>) => {
    setForm((prev) => ({ ...prev, ...updates }));
  };

  const validateStep = (s: number): boolean => {
    const errs: Record<string, string> = {};

    if (s === 0) {
      if (!form.email.trim()) errs.email = "Email is required";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "Invalid email";
      if (!form.password || form.password.length < 6) errs.password = "Min 6 characters";
      if (!form.businessName.trim()) errs.businessName = "Business name is required";
      if (!form.contactFirstName.trim()) errs.contactFirstName = "First name is required";
      if (!form.contactLastName.trim()) errs.contactLastName = "Last name is required";
      if (!form.phone.trim()) errs.phone = "Phone is required";
      if (!form.businessAddress.trim()) errs.businessAddress = "Address is required";
      if (!form.postcode.trim()) errs.postcode = "Postcode is required";
    }

    if (s === 1) {
      if (!form.tradeCategory) errs.tradeCategory = "Select a trade category";
      if (!form.yearsExperience) errs.yearsExperience = "Select years of experience";
      if (!form.qualificationsCertifications.trim()) errs.qualificationsCertifications = "This field is required";
      if (!form.aboutWork.trim()) errs.aboutWork = "This field is required";
    }

    if (s === 2) {
      if (form.operatingAreas.length === 0) errs.operatingAreas = "Add at least one area";
    }

    if (s === 3) {
      if (!agreements.callback || !agreements.terms) {
        errs.agreements = "You must agree to both statements before submitting.";
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep((s) => s + 1);
    }
  };

  const handleBack = () => setStep((s) => s - 1);

  const handleSubmit = async () => {
    if (!validateStep(3)) return;
    setLoading(true);

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          role: "provider",
          full_name: `${form.contactFirstName} ${form.contactLastName}`.trim(),
          first_name: form.contactFirstName,
          last_name: form.contactLastName,
          business_name: form.businessName,
          phone: form.phone,
          business_address: form.businessAddress,
          postcode: form.postcode,
          trade_category: form.tradeCategory,
          business_description: form.businessDescription,
        },
      },
    });

    if (signUpError) {
      toast({ title: "Signup failed", description: signUpError.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    const userId = signUpData.user?.id;
    if (userId) {
      // Update provider profile with extra fields and set status to pending_review
      const { data: profileData } = await supabase
        .from("provider_profiles")
        .update({
          years_experience: form.yearsExperience,
          qualifications_certifications: form.qualificationsCertifications,
          about_work: form.aboutWork,
          accreditations: form.accreditations,
          operating_areas: form.operatingAreas,
          status: "pending_review",
        } as any)
        .eq("user_id", userId)
        .select("id")
        .single();

      const profileId = profileData?.id;

      // Upload supporting documents
      if (profileId && form.supportingDocuments.length > 0) {
        for (const file of form.supportingDocuments) {
          const storagePath = `${userId}/${Date.now()}-${file.name}`;
          const { error: uploadErr } = await supabase.storage
            .from("provider-documents")
            .upload(storagePath, file);

          if (!uploadErr) {
            await supabase.from("provider_documents").insert({
              provider_profile_id: profileId,
              user_id: userId,
              file_url: storagePath,
              file_name: file.name,
              file_type: file.type,
              file_size: file.size,
            } as any);
          }
        }
      }
    }

    setSubmitted(true);
    setLoading(false);
  };

  // Success screen
  if (submitted) {
    return (
      <div className="w-full max-w-lg">
        <Card className="text-center">
          <CardContent className="pt-8 pb-8 space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle2 className="h-8 w-8 text-primary" />
            </div>
            <h2 className="font-display text-2xl font-bold text-foreground">Application Submitted!</h2>
            <p className="text-muted-foreground">
              Thank you for applying to join TradeTrust. Your application is now under review.
            </p>
            <div className="rounded-lg border border-border bg-muted/30 p-4 text-left space-y-2">
              <h3 className="font-semibold text-sm text-foreground">What happens next?</h3>
              <div className="space-y-1.5 text-sm text-muted-foreground">
                <div className="flex items-start gap-2">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>Check your email and verify your account by clicking the confirmation link.</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>An admin will review your application. This usually takes 1–2 business days.</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>Once approved, you'll be able to log in and start quoting on jobs in your area.</span>
                </div>
              </div>
            </div>
            <Button onClick={() => navigate("/login")} className="mt-4">
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg">
      <div className="mb-8 text-center">
        <h1 className="font-display text-3xl font-bold text-foreground">TradeTrust</h1>
        <p className="mt-2 text-muted-foreground">Provider Application</p>
      </div>

      {/* Stepper */}
      <div className="mb-6 flex items-center justify-between">
        {STEPS.map((label, i) => (
          <div key={label} className="flex flex-1 items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                  i < step
                    ? "bg-primary text-primary-foreground"
                    : i === step
                    ? "border-2 border-primary bg-background text-primary"
                    : "border-2 border-muted text-muted-foreground"
                }`}
              >
                {i < step ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <span className="hidden text-[10px] text-muted-foreground sm:block">{label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`mx-1 h-0.5 flex-1 ${i < step ? "bg-primary" : "bg-muted"}`} />
            )}
          </div>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            {STEPS[step]}
          </CardTitle>
          <CardDescription>
            {step === 0 && "Your business and contact information"}
            {step === 1 && "Tell us about your trade and experience"}
            {step === 2 && "Where do you offer your services?"}
            {step === 3 && "Review your application before submitting"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 0 && <StepBusinessDetails form={form} updateForm={updateForm} errors={errors} />}
          {step === 1 && <StepTradeDetails form={form} updateForm={updateForm} errors={errors} tradeCategories={tradeCategories} />}
          {step === 2 && <StepOperatingAreas form={form} updateForm={updateForm} errors={errors} />}
          {step === 3 && (
            <StepReviewSubmit
              form={form}
              tradeCategories={tradeCategories}
              agreements={agreements}
              onAgreementsChange={setAgreements}
              errors={errors}
            />
          )}
        </CardContent>
        <CardFooter className="flex justify-between gap-3">
          {step > 0 ? (
            <Button type="button" variant="outline" onClick={handleBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          ) : (
            <div />
          )}
          {step < STEPS.length - 1 ? (
            <Button type="button" onClick={handleNext}>
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button type="button" onClick={handleSubmit} disabled={loading}>
              {loading ? "Submitting..." : "Submit Application"}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default ProviderSignupStepper;
