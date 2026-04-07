import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Briefcase, FileText, MessageSquare, Clock, AlertTriangle, XCircle,
  MessageCircle, ClipboardList, ArrowRight, CheckCircle2, Wallet, CalendarDays, ImageIcon, PoundSterling
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
};

const ProviderHome = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState("pending");
  const [businessName, setBusinessName] = useState("");
  const [adminNote, setAdminNote] = useState("");
  const [stats, setStats] = useState({ activeJobs: 0, pendingQuotes: 0, completedJobs: 0, totalEarnings: 0 });

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      const [profileRes, jobsRes, quotesRes, earningsRes] = await Promise.all([
        supabase.from("provider_profiles").select("status, business_name, admin_note").eq("user_id", user.id).single(),
        supabase.from("jobs").select("status").eq("provider_id", user.id),
        supabase.from("quotes").select("status").eq("provider_user_id", user.id),
        supabase.from("provider_transactions").select("amount").eq("provider_user_id", user.id).eq("type", "earning"),
      ]);

      if (profileRes.data) {
        setStatus(profileRes.data.status as string);
        setBusinessName(profileRes.data.business_name);
        setAdminNote((profileRes.data as any).admin_note ?? "");
      }

      const jobs = jobsRes.data ?? [];
      const activeJobs = jobs.filter(j => ["accepted", "in_progress"].includes(j.status)).length;
      const completedJobs = jobs.filter(j => j.status === "completed").length;

      const quotes = quotesRes.data ?? [];
      const pendingQuotes = quotes.filter(q => q.status === "pending").length;

      const totalEarnings = (earningsRes.data ?? []).reduce((sum, t) => sum + Number(t.amount), 0);

      setStats({ activeJobs, pendingQuotes, completedJobs, totalEarnings });
    };

    fetchData();
  }, [user]);

  const statCards = [
    { label: "Active Jobs", value: stats.activeJobs, icon: Briefcase, color: "text-primary", format: "number" as const },
    { label: "Pending Quotes", value: stats.pendingQuotes, icon: Clock, color: "text-warning", format: "number" as const },
    { label: "Completed", value: stats.completedJobs, icon: CheckCircle2, color: "text-success", format: "number" as const },
    { label: "Earnings to Date", value: stats.totalEarnings, icon: PoundSterling, color: "text-primary", format: "currency" as const },
  ];

  const quickActions = [
    { label: "Available Jobs", desc: "Browse and quote on matching jobs", icon: Briefcase, path: "/provider/jobs" },
    { label: "My Jobs", desc: "Track your awarded and active jobs", icon: ClipboardList, path: "/provider/my-jobs" },
    { label: "My Quotes", desc: "Track your submitted quotes", icon: FileText, path: "/provider/quotes" },
    { label: "Messages", desc: "Chat with customers", icon: MessageSquare, path: "/provider/messages" },
    { label: "Calendar", desc: "View your upcoming schedule", icon: CalendarDays, path: "/provider/calendar" },
    { label: "Portfolio", desc: "Showcase your previous work", icon: ImageIcon, path: "/provider/portfolio" },
  ];

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h2 className="font-display text-2xl sm:text-3xl font-extrabold">
          {getGreeting()}{businessName ? `, ${businessName}` : ""} 👋
        </h2>
        <p className="text-muted-foreground mt-1">
          {status === "active" ? "Here's an overview of your activity" : "Manage your trade services"}
        </p>
      </div>

      {/* Status alerts */}
      {(status === "pending" || status === "pending_review") && (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30">
          <CardContent className="flex items-start gap-3 pt-6">
            <Clock className="mt-0.5 h-5 w-5 text-amber-600 shrink-0" />
            <div>
              <p className="font-medium text-amber-800 dark:text-amber-200">Your application is under review</p>
              <p className="text-sm text-amber-700 dark:text-amber-300">An admin will review and approve your account. You can update your profile in the meantime.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {status === "changes_requested" && (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30">
          <CardContent className="flex items-start gap-3 pt-6">
            <MessageCircle className="mt-0.5 h-5 w-5 text-amber-600 shrink-0" />
            <div>
              <p className="font-medium text-amber-800 dark:text-amber-200">Changes requested by admin</p>
              {adminNote && <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">{adminNote}</p>}
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">Please visit your profile page, update your details and click Save, and/or upload the requested documents.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {status === "denied" && (
        <Card className="border-destructive/50 bg-destructive/10">
          <CardContent className="flex items-start gap-3 pt-6">
            <XCircle className="mt-0.5 h-5 w-5 text-destructive shrink-0" />
            <div>
              <p className="font-medium text-destructive">Application denied</p>
              {adminNote && <p className="text-sm text-muted-foreground mt-1">{adminNote}</p>}
            </div>
          </CardContent>
        </Card>
      )}

      {status === "suspended" && (
        <Card className="border-destructive/50 bg-destructive/10">
          <CardContent className="flex items-start gap-3 pt-6">
            <AlertTriangle className="mt-0.5 h-5 w-5 text-destructive shrink-0" />
            <div>
              <p className="font-medium text-destructive">Account suspended</p>
              <p className="text-sm text-muted-foreground">Please contact support for more information.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats + Quick actions only for active providers */}
      {status === "active" && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {statCards.map(s => {
              const Icon = s.icon;
              return (
                <Card key={s.label} className="relative overflow-hidden">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent ${s.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-2xl font-extrabold leading-none">
                        {s.format === "currency" ? `£${s.value.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : s.value}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{s.label}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div>
            <h3 className="font-display text-lg font-bold mb-3">Quick Actions</h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {quickActions.map(a => {
                const Icon = a.icon;
                return (
                  <Card
                    key={a.label}
                    className="group cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
                    onClick={() => navigate(a.path)}
                  >
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2.5 text-base">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent text-primary">
                          <Icon className="h-4.5 w-4.5" />
                        </div>
                        <span className="flex-1">{a.label}</span>
                        <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 pb-4">
                      <p className="text-sm text-muted-foreground pl-11">{a.desc}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ProviderHome;
