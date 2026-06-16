import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/bookatrade-logo-black.png";

const AuthConfirm = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const confirmEmail = async () => {
      const tokenHash = searchParams.get("token_hash");
      const type = searchParams.get("type") as any;

      if (!tokenHash || !type) {
        setStatus("error");
        setErrorMessage("Invalid confirmation link. Please check your email and try again.");
        return;
      }

      try {
        // Sign out any existing session first to prevent wrong-account issues
        await supabase.auth.signOut();

        const { error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type,
        });

        if (error) {
          setStatus("error");
          setErrorMessage(error.message);
          return;
        }

        // Sign out again after verification so user can log in fresh
        await supabase.auth.signOut();
        setStatus("success");

        // Redirect to login after a short delay
        setTimeout(() => {
          navigate("/login#type=signup", { replace: true });
        }, 2500);
      } catch (err: any) {
        setStatus("error");
        setErrorMessage(err?.message || "An unexpected error occurred.");
      }
    };

    confirmEmail();
  }, [searchParams, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md text-center animate-fade-in">
        <img src={logo} alt="BOOKaTRADE" className="h-12 mx-auto mb-6" />

        {status === "loading" && (
          <div className="mt-8 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground">Confirming your email address…</p>
          </div>
        )}

        {status === "success" && (
          <div className="mt-8 border border-primary/30 bg-primary/5 p-6 space-y-3 animate-scale-in">
            <CheckCircle2 className="h-10 w-10 text-primary mx-auto" />
            <h2 className="text-lg font-semibold text-foreground">Email confirmed!</h2>
            <p className="text-sm text-muted-foreground">
              Your account has been verified. Redirecting you to sign in…
            </p>
          </div>
        )}

        {status === "error" && (
          <div className="mt-8 border border-destructive/30 bg-destructive/5 p-6 space-y-3 animate-scale-in">
            <XCircle className="h-10 w-10 text-destructive mx-auto" />
            <h2 className="text-lg font-semibold text-foreground">Confirmation failed</h2>
            <p className="text-sm text-muted-foreground">{errorMessage}</p>
            <div className="flex gap-3 justify-center pt-2">
              <Button variant="outline" onClick={() => navigate("/login")}>
                Go to Sign In
              </Button>
              <Button onClick={() => navigate("/signup")}>
                Sign Up Again
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthConfirm;
