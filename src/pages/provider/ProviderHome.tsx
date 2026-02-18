import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Briefcase, FileText, MessageSquare, Clock, AlertTriangle, XCircle, MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ProviderHome = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState("pending");
  const [businessName, setBusinessName] = useState("");
  const [adminNote, setAdminNote] = useState("");

  useEffect(() => {
    if (user) {
      supabase
        .from("provider_profiles")
        .select("status, business_name, admin_note")
        .eq("user_id", user.id)
        .single()
        .then(({ data }) => {
          if (data) {
            setStatus(data.status as string);
            setBusinessName(data.business_name);
            setAdminNote((data as any).admin_note ?? "");
          }
        });
    }
  }, [user]);

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-display text-2xl font-bold">{businessName || "Welcome"}</h2>
        <p className="text-muted-foreground">Manage your trade services</p>
      </div>

      {(status === "pending" || status === "pending_review") && (
        <Card className="mb-6 border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30">
          <CardContent className="flex items-start gap-3 pt-6">
            <Clock className="mt-0.5 h-5 w-5 text-amber-600" />
            <div>
              <p className="font-medium text-amber-800 dark:text-amber-200">Your application is under review</p>
              <p className="text-sm text-amber-700 dark:text-amber-300">An admin will review and approve your account. You can update your profile in the meantime.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {status === "changes_requested" && (
        <Card className="mb-6 border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30">
          <CardContent className="flex items-start gap-3 pt-6">
            <MessageCircle className="mt-0.5 h-5 w-5 text-amber-600" />
            <div>
              <p className="font-medium text-amber-800 dark:text-amber-200">Changes requested by admin</p>
              {adminNote && <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">{adminNote}</p>}
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">Please visit your profile page, update your details and click Save, and/or upload the requested documents.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {status === "denied" && (
        <Card className="mb-6 border-destructive/50 bg-destructive/10">
          <CardContent className="flex items-start gap-3 pt-6">
            <XCircle className="mt-0.5 h-5 w-5 text-destructive" />
            <div>
              <p className="font-medium text-destructive">Application denied</p>
              {adminNote && <p className="text-sm text-muted-foreground mt-1">{adminNote}</p>}
            </div>
          </CardContent>
        </Card>
      )}

      {status === "suspended" && (
        <Card className="mb-6 border-destructive/50 bg-destructive/10">
          <CardContent className="flex items-start gap-3 pt-6">
            <AlertTriangle className="mt-0.5 h-5 w-5 text-destructive" />
            <div>
              <p className="font-medium text-destructive">Account suspended</p>
              <p className="text-sm text-muted-foreground">Please contact support for more information.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {status === "active" && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="cursor-pointer hover:bg-accent/30 transition-colors" onClick={() => navigate("/provider/jobs")}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Briefcase className="h-5 w-5 text-primary" />
                Available Jobs
              </CardTitle>
              <CardDescription>Browse and quote on matching jobs</CardDescription>
            </CardHeader>
          </Card>
          <Card className="cursor-pointer hover:bg-accent/30 transition-colors" onClick={() => navigate("/provider/quotes")}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5 text-primary" />
                My Quotes
              </CardTitle>
              <CardDescription>Track your submitted quotes</CardDescription>
            </CardHeader>
          </Card>
          <Card className="cursor-pointer hover:bg-accent/30 transition-colors" onClick={() => navigate("/provider/messages")}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <MessageSquare className="h-5 w-5 text-primary" />
                Messages
              </CardTitle>
              <CardDescription>Chat with customers</CardDescription>
            </CardHeader>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ProviderHome;
