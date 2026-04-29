import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Lock } from "lucide-react";
import logo from "@/assets/bookatrade-logo-dark.jpeg";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    // The hash contains the recovery token; Supabase client picks it up automatically
    const hash = location.hash;
    if (hash.includes("type=recovery")) {
      setReady(true);
    } else {
      // Also check if user is already in a recovery session
      supabase.auth.getSession().then(({ data }) => {
        if (data.session) {
          setReady(true);
        }
      });
    }
  }, [location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({ title: "Passwords don't match", description: "Please make sure both passwords are the same.", variant: "destructive" });
      return;
    }

    if (password.length < 6) {
      toast({ title: "Password too short", description: "Password must be at least 6 characters.", variant: "destructive" });
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Password updated", description: "Your password has been reset. You can now sign in." });
      await supabase.auth.signOut();
      navigate("/login");
    }
    setLoading(false);
  };

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md shadow-lg border-0 ring-1 ring-border">
          <CardHeader>
            <CardTitle className="font-display">Invalid or expired link</CardTitle>
            <CardDescription>
              This password reset link is invalid or has expired. Please request a new one.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button variant="outline" className="w-full" onClick={() => navigate("/forgot-password")}>
              Request new reset link
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md animate-fade-in">
        <div className="mb-8 text-center">
          <img src={logo} alt="BookATrade logo" className="mx-auto h-16 w-16 mb-3" />
          <h1 className="font-display text-3xl font-extrabold text-foreground">
            Book<span className="text-primary">A</span>Trade
          </h1>
        </div>

        <Card className="shadow-lg border-0 ring-1 ring-border">
          <CardHeader>
            <CardTitle className="font-display">Set new password</CardTitle>
            <CardDescription>Enter your new password below.</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">New password</Label>
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
                    minLength={6}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm new password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 h-11"
                    required
                    minLength={6}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full h-11 font-bold shadow-md" disabled={loading}>
                {loading ? "Updating..." : "Update password"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword;
