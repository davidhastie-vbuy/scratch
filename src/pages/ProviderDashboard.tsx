import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LogOut, User, Wrench, ChevronRight, Clock, AlertTriangle, XCircle, MessageSquare, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

type ProviderStatus = string;

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: typeof Clock }> = {
  pending: { label: "Pending Approval", variant: "secondary", icon: Clock },
  pending_review: { label: "Pending Review", variant: "secondary", icon: Clock },
  active: { label: "Active", variant: "default", icon: Wrench },
  suspended: { label: "Suspended", variant: "destructive", icon: AlertTriangle },
  denied: { label: "Denied", variant: "destructive", icon: XCircle },
  changes_requested: { label: "Changes Requested", variant: "outline", icon: MessageSquare },
};

const ProviderDashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState<ProviderStatus>("pending");
  const [businessName, setBusinessName] = useState("");
  const [adminNote, setAdminNote] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchStatus();
  }, [user]);

  const fetchStatus = async () => {
    const { data } = await supabase
      .from("provider_profiles")
      .select("status, business_name, admin_note")
      .eq("user_id", user!.id)
      .single();

    if (data) {
      setStatus(data.status as string);
      setBusinessName(data.business_name);
      setAdminNote((data as any).admin_note ?? "");
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const statusInfo = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  const StatusIcon = statusInfo.icon;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-primary" />
            <h1 className="font-display text-xl font-bold">TradeTrust</h1>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant={statusInfo.variant}>
              <StatusIcon className="mr-1 h-3 w-3" />
              {statusInfo.label}
            </Badge>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-8">
        <div className="mb-8">
          <h2 className="font-display text-2xl font-bold">
            {businessName || "Provider Dashboard"}
          </h2>
          <p className="text-muted-foreground">Manage your trade services</p>
        </div>

        {(status === "pending" || status === "pending_review") && (
          <Card className="mb-6 border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30">
            <CardContent className="flex items-start gap-3 pt-6">
              <Clock className="mt-0.5 h-5 w-5 text-amber-600" />
              <div>
                <p className="font-medium text-amber-800 dark:text-amber-200">
                  Your application is under review
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  An admin will review and approve your account. You can update your profile in the meantime.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {status === "changes_requested" && (
          <Card className="mb-6 border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30">
            <CardContent className="flex items-start gap-3 pt-6">
              <MessageSquare className="mt-0.5 h-5 w-5 text-amber-600" />
              <div>
                <p className="font-medium text-amber-800 dark:text-amber-200">
                  Changes requested by admin
                </p>
                {adminNote && (
                  <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                    {adminNote}
                  </p>
                )}
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                  Please update your profile and resubmit.
                </p>
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
                {adminNote && (
                  <p className="text-sm text-muted-foreground mt-1">{adminNote}</p>
                )}
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
                <p className="text-sm text-muted-foreground">
                  Your account has been suspended. Please contact support for more information.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card
            className="cursor-pointer transition-colors hover:bg-accent/50"
            onClick={() => navigate("/provider/profile")}
          >
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-lg">
                <span className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Profile
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </CardTitle>
              <CardDescription>Your business information</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Member since {new Date(user?.created_at ?? "").toLocaleDateString()}
              </p>
            </CardContent>
          </Card>

          <Card className="border-dashed">
            <CardHeader>
              <CardTitle className="text-lg text-muted-foreground">Job Leads</CardTitle>
              <CardDescription>Coming soon</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Browse and bid on local jobs.</p>
            </CardContent>
          </Card>

          <Card className="border-dashed">
            <CardHeader>
              <CardTitle className="text-lg text-muted-foreground">Reviews</CardTitle>
              <CardDescription>Coming soon</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Manage your reputation and reviews.</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default ProviderDashboard;
