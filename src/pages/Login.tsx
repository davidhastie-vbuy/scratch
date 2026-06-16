import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { LogIn, Mail, Lock } from "lucide-react";
import logo from "@/assets/bookatrade-logo-black.png";
import heroScrewdriver from "@/assets/hero-screwdriver.jpg";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailConfirmed, setEmailConfirmed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const hash = location.hash;
    if (hash.includes("type=signup") || hash.includes("type=email")) {
      setEmailConfirmed(true);
    }
  }, [location]);

  const handleLogin = async (e: React.FormEvent) => {
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

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (error) {
      toast({ title: "Google login failed", description: error.message, variant: "destructive" });
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-end">
        <img src={heroScrewdriver} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/40 to-foreground/20" />
        <div className="relative z-10 p-12 pb-16 max-w-md">
          <img src={logo} alt="BOOKaTRADE" className="h-10 brightness-0 invert mb-5" />
          <h2 className="font-display text-3xl text-white mb-3">Welcome Back</h2>
          <p className="text-white/60 text-sm leading-relaxed">
            Vetted tradespeople. Guaranteed payments. Peace of mind for every job.
          </p>
          <div className="mt-6 flex gap-3">
            {["Vetted", "Trusted", "Guaranteed"].map((tag) => (
              <span key={tag} className="border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-bold text-white uppercase tracking-wider">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center bg-background px-4 py-8">
        <div className="w-full max-w-md animate-fade-in">
          <div className="mb-8 text-center lg:hidden">
            <img src={logo} alt="BOOKaTRADE" className="h-10 mx-auto mb-3" />
            <p className="mt-2 text-muted-foreground">Sign In to your account</p>
          </div>
          <div className="hidden lg:block mb-8">
            <h1 className="font-display text-2xl font-extrabold text-foreground">Sign In to your account</h1>
            <p className="mt-1 text-muted-foreground">Welcome back! Enter your credentials below.</p>
          </div>

          {emailConfirmed && (
            <div className="mb-6 border border-primary/30 bg-primary/5 p-5 text-center animate-scale-in">
              <div className="mb-2 text-3xl">✅</div>
              <h2 className="text-lg font-semibold text-foreground">Email confirmed — thank you!</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Your account has been verified. You can now sign in below.
              </p>
            </div>
          )}

          <Card className="shadow-lg border-0 ring-1 ring-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-display">
                <div className="flex h-8 w-8 items-center justify-center bg-primary/10">
                  <LogIn className="h-4 w-4 text-primary" />
                </div>
                Welcome back
              </CardTitle>
              <CardDescription>Enter your credentials to continue</CardDescription>
            </CardHeader>
            <form onSubmit={handleLogin}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-11"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <Link to="/forgot-password" className="text-xs text-primary hover:underline">
                      Forgotten password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 h-11"
                      required
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-3">
                <Button type="submit" className="w-full h-11 font-bold shadow-md" disabled={loading}>
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
                <div className="relative w-full">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">or</span>
                  </div>
                </div>
                <Button type="button" variant="outline" className="w-full h-11" onClick={handleGoogleLogin}>
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Continue with Google
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  Don't have an account?{" "}
                  <Link to="/signup" className="font-bold text-primary hover:underline">
                    Sign up
                  </Link>
                </p>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Login;
