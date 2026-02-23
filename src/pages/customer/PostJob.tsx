import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useTradeCategories } from "@/hooks/use-trade-categories";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, ArrowRight, Upload, X, CheckCircle2, Loader2 } from "lucide-react";

const TIMELINES = ["ASAP", "Within 1 week", "Within 2 weeks", "Within 1 month", "Flexible"];


const PostJob = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { categories } = useTradeCategories(true);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [form, setForm] = useState({
    title: "",
    category: "",
    postcodeDistrict: "",
    description: "",
    timeline: "",
    additionalNotes: "",
  });

  useEffect(() => {
    if (user) {
      supabase.from("profiles").select("postcode").eq("id", user.id).single().then(({ data }) => {
        if (data?.postcode) {
          const district = data.postcode.trim().split(" ")[0].toUpperCase();
          setForm(f => f.postcodeDistrict ? f : { ...f, postcodeDistrict: district });
        }
      });
    }
  }, [user]);
  const [files, setFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (s: number) => {
    const errs: Record<string, string> = {};
    if (s === 0) {
      if (!form.title.trim()) errs.title = "Title is required";
      if (!form.category) errs.category = "Select a category";
      if (!form.postcodeDistrict.trim()) errs.postcodeDistrict = "Postcode district is required (e.g. CW2)";
      if (!form.description.trim()) errs.description = "Description is required";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const addFiles = (newFiles: FileList | null) => {
    if (!newFiles) return;
    const allowed = ["image/png", "image/jpeg", "video/mp4"];
    const maxSize = 10 * 1024 * 1024;
    const toAdd: File[] = [];
    for (const f of Array.from(newFiles)) {
      if (!allowed.includes(f.type)) {
        toast({ title: "Invalid file type", description: `${f.name} must be PNG, JPG, or MP4`, variant: "destructive" });
        continue;
      }
      if (f.size > maxSize) {
        toast({ title: "File too large", description: `${f.name} exceeds 10MB`, variant: "destructive" });
        continue;
      }
      toAdd.push(f);
    }
    const combined = [...files, ...toAdd].slice(0, 10);
    if (files.length + toAdd.length > 10) {
      toast({ title: "Max 10 files", description: "Only the first 10 files will be kept", variant: "destructive" });
    }
    setFiles(combined);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Create job
      const { data: job, error: jobErr } = await supabase
        .from("jobs")
        .insert({
          customer_user_id: user!.id,
          title: form.title.trim(),
          description: form.description.trim() + (form.additionalNotes ? `\n\nAdditional notes: ${form.additionalNotes.trim()}` : ""),
          category: form.category,
          postcode_district: form.postcodeDistrict.trim().toUpperCase(),
          timeline: form.timeline || null,
        } as any)
        .select("id")
        .single();

      if (jobErr) throw jobErr;

      // Upload files
      if (job && files.length > 0) {
        for (const file of files) {
          const path = `${user!.id}/${job.id}/${Date.now()}-${file.name}`;
          const { error: upErr } = await supabase.storage.from("job-media").upload(path, file);
          if (!upErr) {
            await supabase.from("job_media").insert({
              job_id: job.id,
              user_id: user!.id,
              file_url: path,
              file_name: file.name,
              file_type: file.type,
              file_size: file.size,
            } as any);
          }
        }
      }

      setSubmitted(true);
    } catch (err: any) {
      toast({ title: "Failed to post job", description: err.message, variant: "destructive" });
    }
    setLoading(false);
  };

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto">
        <Card className="text-center">
          <CardContent className="pt-8 pb-8 space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle2 className="h-8 w-8 text-primary" />
            </div>
            <h2 className="font-display text-2xl font-bold">Job Posted!</h2>
            <p className="text-muted-foreground">
              Your job is now live. Matching tradespeople in your area will be able to submit quotes. You'll receive up to 3 quotes.
            </p>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => navigate("/dashboard/jobs")}>View My Jobs</Button>
              <Button variant="outline" onClick={() => { setSubmitted(false); setStep(0); setForm({ title: "", category: "", postcodeDistrict: "", description: "", timeline: "", additionalNotes: "" }); setFiles([]); }}>
                Post Another
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      {/* Step indicator */}
      <div className="mb-6 flex items-center justify-between">
        {["Job Details", "Extra Details", "Photos & Submit"].map((label, i) => (
          <div key={label} className="flex flex-1 items-center">
            <div className="flex flex-col items-center gap-1">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${i < step ? "bg-primary text-primary-foreground" : i === step ? "border-2 border-primary text-primary" : "border-2 border-muted text-muted-foreground"}`}>
                {i < step ? "✓" : i + 1}
              </div>
              <span className="hidden sm:block text-[10px] text-muted-foreground">{label}</span>
            </div>
            {i < 2 && <div className={`mx-1 h-0.5 flex-1 ${i < step ? "bg-primary" : "bg-muted"}`} />}
          </div>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{["Job Details", "Extra Details", "Photos & Submit"][step]}</CardTitle>
          <CardDescription>
            {step === 0 && "Tell us what you need done"}
            {step === 1 && "Any additional details or preferences"}
            {step === 2 && "Add photos or videos and submit"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === 0 && (
            <>
              <div className="space-y-2">
                <Label>Job title *</Label>
                <Input value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} maxLength={200} placeholder="e.g. Fix leaking kitchen tap" />
                {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
              </div>
              <div className="space-y-2">
                <Label>Category *</Label>
                <Select value={form.category} onValueChange={(v) => setForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select a trade" /></SelectTrigger>
                  <SelectContent>
                    {categories.map(c => <SelectItem key={c.id} value={c.slug}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                {errors.category && <p className="text-sm text-destructive">{errors.category}</p>}
              </div>
              <div className="space-y-2">
                <Label>Postcode district * <span className="text-muted-foreground text-xs">(e.g. CW2, SW1)</span></Label>
                <Input value={form.postcodeDistrict} onChange={(e) => setForm(f => ({ ...f, postcodeDistrict: e.target.value }))} maxLength={10} placeholder="CW2" />
                {errors.postcodeDistrict && <p className="text-sm text-destructive">{errors.postcodeDistrict}</p>}
              </div>
              <div className="space-y-2">
                <Label>Description *</Label>
                <Textarea value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} maxLength={2000} rows={4} placeholder="Describe the job in detail…" />
                {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
              </div>
              <div className="space-y-2">
                <Label>Timeline</Label>
                <Select value={form.timeline} onValueChange={(v) => setForm(f => ({ ...f, timeline: v }))}>
                  <SelectTrigger><SelectValue placeholder="When?" /></SelectTrigger>
                  <SelectContent>
                    {TIMELINES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <div className="space-y-2">
                <Label>Additional notes (optional)</Label>
                <Textarea value={form.additionalNotes} onChange={(e) => setForm(f => ({ ...f, additionalNotes: e.target.value }))} maxLength={1000} rows={4} placeholder="Any access details, parking info, pet considerations…" />
              </div>
              <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2">
                <h4 className="font-semibold text-sm">Review your details</h4>
                <div className="text-sm space-y-1 text-muted-foreground">
                  <p><strong>Title:</strong> {form.title}</p>
                  <p><strong>Category:</strong> {categories.find(c => c.slug === form.category)?.name}</p>
                  <p><strong>Location:</strong> {form.postcodeDistrict.toUpperCase()}</p>
                  <p><strong>Timeline:</strong> {form.timeline || "Not specified"}</p>
                </div>
                <p className="text-xs text-muted-foreground">You can go back to edit before submitting.</p>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="space-y-2">
                <Label>Upload photos/videos <span className="text-muted-foreground text-xs">(PNG, JPG, MP4 — max 10MB each, up to 10 files)</span></Label>
                <div
                  className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => document.getElementById("file-input")?.click()}
                >
                  <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Click to upload or drag files here</p>
                  <input id="file-input" type="file" multiple accept="image/png,image/jpeg,video/mp4" className="hidden" onChange={(e) => addFiles(e.target.files)} />
                </div>
              </div>
              {files.length > 0 && (
                <div className="space-y-2">
                  {files.map((f, i) => (
                    <div key={i} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                      <span className="truncate">{f.name} <span className="text-muted-foreground">({(f.size / 1024 / 1024).toFixed(1)}MB)</span></span>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setFiles(files.filter((_, j) => j !== i))}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  <p className="text-xs text-muted-foreground">{files.length}/10 files</p>
                </div>
              )}
            </>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          {step > 0 ? (
            <Button variant="outline" onClick={() => setStep(s => s - 1)}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
          ) : <div />}
          {step < 2 ? (
            <Button onClick={() => { if (validate(step)) setStep(s => s + 1); }}>
              Next <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Posting...</> : "Post Job"}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default PostJob;
