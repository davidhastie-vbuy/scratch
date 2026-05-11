import { useState, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Mail, Lock, User, MapPin, Camera, X, Home, Wrench } from "lucide-react";
import { formatPostcode } from "@/lib/format-postcode";
import ProviderSignupStepper from "@/components/provider-signup/ProviderSignupStepper";
import logo from "@/assets/bookatrade-logo.png";

const Signup = () => {
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get("role") === "provider" ? "provider" : "customer";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"customer" | "provider">(initialRole);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Customer fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [postcode, setPostcode] = useState("");

  // Optional recommendation
  const [recommendation, setRecommendation] = useState("");
  const [recPhotos, setRecPhotos] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isCustomer = role === "customer";

  const handleAddPhotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).slice(0, 5 - recPhotos.length);
      setRecPhotos((prev) => [...prev, ...newFiles].slice(0, 5));
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemovePhoto = (index: number) => {
    setRecPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const submitRecommendation = async (userId: string, userEmail: string) => {
    if (!recommendation.trim() && recPhotos.length === 0) return;
    try {
      const formData = new FormData();
      formData.append("user_id", userId);
      formData.append("user_email", userEmail);
      formData.append("customer_name", `${firstName} ${lastName}`.trim());
      formData.append("customer_postcode", postcode);
      if (recommendation.trim()) formData.append("message", recommendation.trim());
      recPhotos.forEach((photo) => formData.append("photos", photo));

      await supabase.functions.invoke("submit-recommendation", {
        body: formData,
      });
    } catch (err) {
      console.error("Failed to submit recommendation:", err);
    }
  };

  const handleCustomerSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const metadata = {
      role: "customer",
      full_name: `${firstName} ${lastName}`.trim(),
      first_name: firstName,
      last_name: lastName,
      postcode: formatPostcode(postcode),
    };

    const { data: signUpData, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin, data: metadata },
    });

    if (error) {
      toast({ title: "Signup failed", description: error.message, variant: "destructive" });
    } else {
      if (signUpData.user?.id) {
        submitRecommendation(signUpData.user.id, email);
      }
      toast({ title: "Check your email", description: "We've sent you a confirmation link to verify your account." });
      navigate("/login");
    }
    setLoading(false);
  };

  const handleGoogle = async () => {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result?.error) {
      toast({ title: "Google sign-in failed", description: String(result.error), variant: "destructive" });
    }
  };

  if (role === "provider") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
        <ProviderSignupStepper />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:w-5/12 bg-foreground text-primary-foreground relative overflow-hidden items-center justify-center">
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 20px, hsl(25 95% 53% / 0.15) 20px, hsl(25 95% 53% / 0.15) 21px)' }} />
        <div className="relative z-10 text-center p-12 max-w-md">
          <img src={logo} alt="BookATrade logo" className="mx-auto h-28 w-28 mb-8 animate-float rounded-full" />
          <h2 className="font-display text-3xl font-extrabold mb-4">
            Join Book<span className="text-primary">A</span>Trade
          </h2>
          <p className="text-primary-foreground/60 leading-relaxed text-2xl font-bold whitespace-pre-line">
            {"Stop Guessing.\nStart hiring with confidence.\nNo spam calls. No chasing.\nNever feel let down again."}
          </p>
          <div className="mt-8 flex justify-center gap-3">
            {["Vetted Providers Only", "No Hidden Costs", "You Stay In Control"].map((tag) => (
              <span key={tag} className="rounded-full border border-primary/40 bg-primary/10 px-4 py-1.5 text-xs font-bold text-primary">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center bg-background px-4 py-8 overflow-auto">
        <div className="w-full max-w-md animate-fade-in">
          <div className="mb-8 text-center lg:hidden">
            <img src={logo} alt="BookATrade logo" className="mx-auto h-16 w-16 mb-3" />
            <h1 className="font-display text-3xl font-extrabold text-foreground">
              Book<span className="text-primary">A</span>Trade
            </h1>
            <p className="mt-2 text-muted-foreground">Create your account</p>
          </div>
          <div className="hidden lg:block mb-8">
            <h1 className="font-display text-2xl font-extrabold text-foreground">Create your account</h1>
            <p className="mt-1 text-muted-foreground">Choose your role and fill in your details.</p>
          </div>

          <Card className="shadow-lg border-0 ring-1 ring-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-display">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <UserPlus className="h-4 w-4 text-primary" />
                </div>
                Get started
              </CardTitle>
              <CardDescription>Choose your role and fill in your details</CardDescription>
            </CardHeader>
            <form onSubmit={handleCustomerSignup}>
              <CardContent className="space-y-4">
                {/* Role selector */}
                <div className="space-y-3">
                  <Label>I am a...</Label>
                  <RadioGroup value={role} onValueChange={(v) => setRole(v as "customer" | "provider")} className="flex gap-4">
                    <div className="flex-1">
                      <RadioGroupItem value="customer" id="customer" className="peer sr-only" />
                      <Label
                        htmlFor="customer"
                        className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-muted p-4 transition-all duration-200 hover:bg-accent hover:border-primary/30 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 peer-data-[state=checked]:shadow-md"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent">
                          <Home className="h-5 w-5 text-primary" />
                        </div>
                        <span className="font-bold">Customer</span>
                        <span className="text-xs text-muted-foreground">I need work done</span>
                      </Label>
                    </div>
                    <div className="flex-1">
                      <RadioGroupItem value="provider" id="provider" className="peer sr-only" />
                      <Label
                        htmlFor="provider"
                        className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-muted p-4 transition-all duration-200 hover:bg-accent hover:border-primary/30 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 peer-data-[state=checked]:shadow-md"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent">
                          <Wrench className="h-5 w-5 text-primary" />
                        </div>
                        <span className="font-bold">Provider</span>
                        <span className="text-xs text-muted-foreground">I offer services</span>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <p className="text-center text-sm font-bold text-primary">No flooded inbox. No repeated phone calls.</p>

                {/* Email & password */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10 h-11" required maxLength={255} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input id="password" type="password" placeholder="Min. 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 h-11" minLength={6} required />
                  </div>
                </div>

                {/* Customer fields */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input id="firstName" placeholder="John" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="pl-10 h-11" required maxLength={100} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last name</Label>
                    <Input id="lastName" placeholder="Smith" value={lastName} onChange={(e) => setLastName(e.target.value)} className="h-11" required maxLength={100} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postcode">Postcode</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input id="postcode" placeholder="SW1A 1AA" value={postcode} onChange={(e) => setPostcode(e.target.value)} className="pl-10 h-11" required maxLength={10} />
                  </div>
                  <p className="text-xs text-muted-foreground">Used to match you with local tradespeople. You can add your full address and phone number later.</p>
                </div>

                {/* Optional recommendation */}
                <div className="space-y-2 rounded-xl border border-dashed border-primary/20 bg-accent/30 p-4">
                  <Label htmlFor="recommendation" className="text-sm leading-relaxed font-normal text-muted-foreground">
                    If you would like to recommend a tradesperson you have hired in the past, please tell us about your experience and the work they completed for you. You can also attach photos. <span className="italic">(Optional)</span>
                  </Label>
                  <Textarea
                    id="recommendation"
                    placeholder="e.g. I hired John from ABC Plumbing to fix a leak. He was professional, on time, and did a great job..."
                    value={recommendation}
                    onChange={(e) => setRecommendation(e.target.value)}
                    maxLength={2000}
                    className="min-h-[100px]"
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    {recPhotos.map((photo, i) => (
                      <div key={i} className="relative group">
                        <img
                          src={URL.createObjectURL(photo)}
                          alt={`Photo ${i + 1}`}
                          className="h-16 w-16 rounded-lg object-cover border"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(i)}
                          className="absolute -top-1.5 -right-1.5 rounded-full bg-destructive text-destructive-foreground p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    {recPhotos.length < 5 && (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex h-16 w-16 items-center justify-center rounded-lg border-2 border-dashed border-primary/30 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                      >
                        <Camera className="h-5 w-5" />
                      </button>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleAddPhotos}
                      className="hidden"
                    />
                  </div>
                  {recPhotos.length > 0 && (
                    <p className="text-xs text-muted-foreground">{recPhotos.length}/5 photos attached</p>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-3">
                <p className="text-xs text-muted-foreground text-center">
                  By creating an account, you agree to our{" "}
                  <a href="/legal?audience=customer" target="_blank" rel="noopener noreferrer" className="font-bold text-primary hover:underline">Terms & Conditions</a>.
                </p>
                <Button type="submit" className="w-full h-11 font-bold shadow-md" disabled={loading}>
                  {loading ? "Creating account..." : "Create account"}
                </Button>
                <div className="relative w-full">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">or</span>
                  </div>
                </div>
                <Button type="button" variant="outline" className="w-full h-11" onClick={handleGoogle}>
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Sign up with Google
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <Link to="/login" className="font-bold text-primary hover:underline">Sign in</Link>
                </p>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Signup;
