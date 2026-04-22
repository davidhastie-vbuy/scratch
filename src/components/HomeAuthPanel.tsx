import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Mail, Lock, User, Phone, MapPin, Home, Wrench, ArrowRight } from "lucide-react";
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

  const handleRoleChange = (next: Role) => {
    setRole(next);
    if (next === "provider" && mode === "signup") {
      // Provider signup uses the multi-step flow
      navigate("/signup");
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
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin, data: metadata },
    });
    if (error) {
      toast({ title: "Signup failed", description: error.message, variant: "destructive" });
    } else {
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
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result?.error) {
      toast({ title: "Google sign-in failed", description: String(result.error), variant: "destructive" });
    }
  };

  return (
    <div className="w-full rounded-2xl border-2 border-primary-foreground/20 bg-card/95 backdrop-blur-md shadow-2xl shadow-foreground/40 p-5 sm:p-6">
      {/* Mode toggle */}
      <div className="mb-5 grid grid-cols-2 gap-1 rounded-xl bg-muted p-1">
        <button
          type="button"
          onClick={() => setMode("signup")}
          className={`rounded-lg py-2 text-sm font-bold transition-all ${
            mode === "signup" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Create account
        </button>
        <button
          type="button"
          onClick={() => setMode("signin")}
          className={`rounded-lg py-2 text-sm font-bold transition-all ${
            mode === "signin" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Sign in
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
                className={`flex items-center justify-center gap-2 rounded-xl border-2 p-3 text-sm font-bold transition-all ${
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
                className={`flex items-center justify-center gap-2 rounded-xl border-2 p-3 text-sm font-bold transition-all ${
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
                <Link to="/signup" className="font-bold text-primary hover:underline">
                  Continue to apply
                </Link>
              </p>
            )}
          </div>

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
              <Label htmlFor="ha-phone" className="text-xs">Phone number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input id="ha-phone" type="tel" placeholder="+44 7700 900000" value={phone} onChange={(e) => setPhone(e.target.value)} className="pl-9 h-10" required maxLength={20} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ha-addr" className="text-xs">Address line 1</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input id="ha-addr" placeholder="123 High Street" value={addressLine1} onChange={(e) => setAddressLine1(e.target.value)} className="pl-9 h-10" required maxLength={255} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label htmlFor="ha-city" className="text-xs">City</Label>
                <Input id="ha-city" placeholder="London" value={city} onChange={(e) => setCity(e.target.value)} className="h-10" required maxLength={100} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ha-pc" className="text-xs">Postcode</Label>
                <Input id="ha-pc" placeholder="SW1A 1AA" value={postcode} onChange={(e) => setPostcode(e.target.value)} className="h-10" required maxLength={10} />
              </div>
            </div>
            <Button type="submit" className="w-full h-11 font-bold shadow-md" disabled={loading || role === "provider"}>
              {loading ? "Creating account..." : "Create account"}
              {!loading && <ArrowRight className="h-4 w-4" />}
            </Button>
            <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
              By creating an account, you agree to our{" "}
              <a href="/legal?audience=customer" target="_blank" rel="noopener noreferrer" className="font-bold text-primary hover:underline">
                Terms &amp; Conditions
              </a>.
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
            {loading ? "Signing in..." : "Sign in"}
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
