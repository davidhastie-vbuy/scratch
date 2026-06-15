import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Mail, Lock, User, MapPin, Home, Wrench, ArrowRight, ThumbsUp, ChevronDown, Camera, X } from "lucide-react";
import { formatPostcode } from "@/lib/format-postcode";

type Mode = "signup" | "signin";
type Role = "customer" | "provider";

const HomeAuthPanel = () => {
  const [mode, setMode] = useState<Mode>("signup");
  const [role, setRole] = useState<Role>("customer");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Shared
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Customer signup fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [postcode, setPostcode] = useState("");

  // Optional recommendation
  const [recOpen, setRecOpen] = useState(false);
  const [recommendation, setRecommendation] = useState("");
  const [recPhotos, setRecPhotos] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddPhotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const allowedTypes = ["image/png", "image/jpeg", "image/webp"];
      const maxSize = 5 * 1024 * 1024;
      const incoming = Array.from(e.target.files);
      const valid: File[] = [];
      for (const file of incoming) {
        if (!allowedTypes.includes(file.type)) {
          toast({ title: "Invalid file type", description: `${file.name} is not a supported image format (PNG, JPG, WebP).`, variant: "destructive" });
          continue;
        }
        if (file.size > maxSize) {
          toast({ title: "File too large", description: `${file.name} exceeds the 5MB limit.`, variant: "destructive" });
          continue;
        }
        valid.push(file);
      }
      const newFiles = valid.slice(0, 5 - recPhotos.length);
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
      formData.append("customer_postcode", formatPostcode(postcode));
      if (recommendation.trim()) formData.append("message", recommendation.trim());
      recPhotos.forEach((photo) => formData.append("photos", photo));
      await supabase.functions.invoke("submit-recommendation", { body: formData });
    } catch (err) {
      console.error("Failed to submit recommendation:", err);
    }
  };

  const handleRoleChange = (next: Role) => {
    setRole(next);
    if (next === "provider" && mode === "signup") {
      // Provider signup uses the multi-step flow
      navigate("/signup?role=provider");
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
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

  const handleSignin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast({ title: "Login failed", description: error.message, variant: "destructive" });
    } else {
      navigate("/");
    }
    setLoading(false);
  };

  const handleGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (error) {
      toast({ title: "Google sign-in failed", description: error.message, variant: "destructive" });
    }
  };

  return (
    <div className="w-full border-2 border-primary-foreground/20 bg-card/95 backdrop-blur-md shadow-2xl shadow-foreground/40 p-5 sm:p-6">
      {/* Mode toggle */}
      <div className="mb-5 grid grid-cols-2 gap-1 bg-muted p-1">
        <button
          type="button"
          onClick={() => setMode("signup")}
          className={`py-2 text-sm font-bold transition-all ${
            mode === "signup" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Unlock Dashboard
        </button>
        <button
          type="button"
          onClick={() => setMode("signin")}
          className={`py-2 text-sm font-bold transition-all ${
            mode === "signin" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Sign In
        </button>
      </div>

      {mode === "signup" ? (
        <>
          {/* Role toggle */}
          <div className="mb-4">
            <Label className="text-xs font-semibold text-muted-foreground">I am a...</Label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleRoleChange("customer")}
                className={`flex items-center justify-center gap-2 border-2 p-3 text-sm font-bold transition-all ${
                  role === "customer"
                    ? "border-primary bg-primary/5 text-foreground shadow-sm"
                    : "border-muted bg-card text-muted-foreground hover:border-primary/30"
                }`}
              >
                <Home className="h-4 w-4 text-primary" />
                Customer
              </button>
              <button
                type="button"
                onClick={() => handleRoleChange("provider")}
                className={`flex items-center justify-center gap-2 border-2 p-3 text-sm font-bold transition-all ${
                  role === "provider"
                    ? "border-primary bg-primary/5 text-foreground shadow-sm"
                    : "border-muted bg-card text-muted-foreground hover:border-primary/30"
                }`}
              >
                <Wrench className="h-4 w-4 text-primary" />
                Provider
              </button>
            </div>
            {role === "provider" && (
              <p className="mt-2 text-xs text-muted-foreground">
                Provider signup uses our full application form.{" "}
                <Link to="/signup?role=provider" className="font-bold text-primary hover:underline">
                  Continue to apply
                </Link>
              </p>
            )}
          </div>

          {role === "customer" && (
            <p className="text-center text-sm font-bold text-primary">No flooded inbox. No repeated phone calls.</p>
          )}

          <form onSubmit={handleSignup} className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label htmlFor="ha-first" className="text-xs">First name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input id="ha-first" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="pl-9 h-10" required maxLength={100} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ha-last" className="text-xs">Last name</Label>
                <Input id="ha-last" value={lastName} onChange={(e) => setLastName(e.target.value)} className="h-10" required maxLength={100} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ha-email" className="text-xs">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input id="ha-email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-9 h-10" required maxLength={255} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ha-pw" className="text-xs">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input id="ha-pw" type="password" placeholder="Min. 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-9 h-10" minLength={6} required />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ha-pc" className="text-xs">Postcode</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input id="ha-pc" placeholder="SW1A 1AA" value={postcode} onChange={(e) => setPostcode(e.target.value)} className="pl-9 h-10" required maxLength={10} />
              </div>
              <p className="text-[11px] text-muted-foreground">Used to match you with local tradespeople.</p>
            </div>

            {/* Optional recommendation dropdown */}
            <div className="border border-dashed border-primary/30 bg-accent/30">
              <button
                type="button"
                onClick={() => setRecOpen((v) => !v)}
                className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left"
                aria-expanded={recOpen}
              >
                <span className="flex items-center gap-2 text-sm font-bold text-foreground">
                  <ThumbsUp className="h-4 w-4 text-primary" />
                  Recommend a Provider <span className="text-[11px] font-normal text-muted-foreground">(Optional)</span>
                </span>
                <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${recOpen ? "rotate-180" : ""}`} />
              </button>
              {recOpen && (
                <div className="space-y-2 px-3 pb-3">
                  <Label htmlFor="ha-rec" className="text-[11px] leading-relaxed font-normal text-muted-foreground">
                    Know a great tradesperson you've hired in the past? Tell us about your experience and the work they completed. You can also attach photos.
                  </Label>
                  <Textarea
                    id="ha-rec"
                    placeholder="e.g. I hired John from ABC Plumbing to fix a leak. He was professional, on time, and did a great job..."
                    value={recommendation}
                    onChange={(e) => setRecommendation(e.target.value)}
                    maxLength={2000}
                    className="min-h-[90px] text-sm"
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    {recPhotos.map((photo, i) => (
                      <div key={i} className="relative group">
                        <img
                          src={URL.createObjectURL(photo)}
                          alt={`Photo ${i + 1}`}
                          className="h-14 w-14 object-cover border"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(i)}
                          className="absolute -top-1.5 -right-1.5 rounded-full bg-destructive text-destructive-foreground p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    {recPhotos.length < 5 && (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex h-14 w-14 items-center justify-center border-2 border-dashed border-primary/30 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
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
                    <p className="text-[11px] text-muted-foreground">{recPhotos.length}/5 photos attached</p>
                  )}
                  <p className="text-[11px] text-muted-foreground">Submitted with your account when you create it.</p>
                </div>
              )}
            </div>
            <Button type="submit" className="w-full h-11 font-bold shadow-md" disabled={loading || role === "provider"}>
              {loading ? "Creating account..." : "Unlock Dashboard"}
              {!loading && <ArrowRight className="h-4 w-4" />}
            </Button>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">or</span>
              </div>
            </div>
            <Button type="button" variant="outline" className="w-full h-11" onClick={handleGoogle} disabled={role === "provider"}>
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Sign up with Google
            </Button>
            <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
              By creating an account, you agree to our{" "}
              <a href="/legal?audience=customer" target="_blank" rel="noopener noreferrer" className="font-bold text-primary hover:underline">
                Terms &amp; Conditions
              </a>. You can add your address and phone number later.
            </p>
          </form>
        </>
      ) : (
        <form onSubmit={handleSignin} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="hi-email" className="text-xs">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input id="hi-email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-9 h-10" required />
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="hi-pw" className="text-xs">Password</Label>
              <Link to="/forgot-password" className="text-[11px] text-primary hover:underline font-semibold">
                Forgotten password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input id="hi-pw" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-9 h-10" required />
            </div>
          </div>
          <Button type="submit" className="w-full h-11 font-bold shadow-md" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </Button>
          <div className="relative">
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
            Continue with Google
          </Button>
        </form>
      )}
    </div>
  );
};

export default HomeAuthPanel;
