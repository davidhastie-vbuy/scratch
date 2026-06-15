import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { UNREAD_MESSAGE_TYPES } from "@/lib/message-unread";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PlusCircle, Briefcase, MessageSquare, Users, Heart, HelpCircle, ArrowRight, ClipboardList, CheckCircle2, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import RecommendProvider from "@/components/RecommendProvider";

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
};

const CustomerHome = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState("");
  const [stats, setStats] = useState({ activeJobs: 0, openJobs: 0, completedJobs: 0, unreadMessages: 0 });

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      const [profileRes, jobsRes, msgsRes] = await Promise.all([
        supabase.from("profiles").select("first_name").eq("id", user.id).single(),
        supabase.from("jobs").select("status").eq("customer_user_id", user.id),
        supabase.from("conversations").select("id").eq("customer_user_id", user.id),
      ]);

      if (profileRes.data?.first_name) setFirstName(profileRes.data.first_name);

      const jobs = jobsRes.data ?? [];
      const activeJobs = jobs.filter(j => ["accepted", "in_progress"].includes(j.status)).length;
      const openJobs = jobs.filter(j => ["open", "quoted", "quotes_closed"].includes(j.status)).length;
      const completedJobs = jobs.filter(j => j.status === "completed").length;

      let unreadMessages = 0;
      if (msgsRes.data && msgsRes.data.length > 0) {
        const convIds = msgsRes.data.map(c => c.id);
        const { count } = await supabase
          .from("messages")
          .select("id", { count: "exact", head: true })
          .in("conversation_id", convIds)
          .neq("sender_user_id", user.id)
          .is("read_at", null)
          .in("message_type", UNREAD_MESSAGE_TYPES);
        unreadMessages = count ?? 0;
      }

      setStats({ activeJobs, openJobs, completedJobs, unreadMessages });
    };

    fetchData();
  }, [user]);

  const statCards = [
    { label: "Active Jobs", value: stats.activeJobs, icon: Briefcase, color: "text-primary" },
    { label: "Open Jobs", value: stats.openJobs, icon: Clock, color: "text-warning" },
    { label: "Completed", value: stats.completedJobs, icon: CheckCircle2, color: "text-success" },
    { label: "Unread Messages", value: stats.unreadMessages, icon: MessageSquare, color: "text-primary" },
  ];

  const quickActions = [
    { label: "Post a Job", desc: "Get up to 3 quotes from local tradespeople", icon: PlusCircle, path: "/dashboard/post-job", accent: true },
    { label: "My Jobs", desc: "View your posted jobs and quotes", icon: ClipboardList, path: "/dashboard/jobs" },
    { label: "Messages", desc: "Chat with your tradespeople", icon: MessageSquare, path: "/dashboard/messages", badge: stats.unreadMessages },
    { label: "Find Local Trades", desc: "Browse vetted tradespeople near you", icon: Users, path: "/dashboard/providers" },
    { label: "Favourites", desc: "Your saved tradespeople", icon: Heart, path: "/dashboard/favourites" },
    { label: "Support", desc: "Get help with your account or jobs", icon: HelpCircle, path: "/dashboard/support" },
  ];

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h2 className="font-display text-2xl sm:text-3xl font-extrabold">
          {getGreeting()}{firstName ? `, ${firstName}` : ""} 👋
        </h2>
        <p className="text-muted-foreground mt-1">Here's an overview of your activity</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map(s => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="relative overflow-hidden">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center bg-accent ${s.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-2xl font-extrabold leading-none">{s.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick actions */}
      <div>
        <h3 className="font-display text-lg font-bold mb-3">Quick Actions</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {quickActions.map(a => {
            const Icon = a.icon;
            return (
              <Card
                key={a.label}
                className={`group cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${a.accent ? "border-primary/30 bg-primary/5" : ""}`}
                onClick={() => navigate(a.path)}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2.5 text-base">
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center ${a.accent ? "bg-primary text-primary-foreground" : "bg-accent text-primary"}`}>
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                    <span className="flex-1">{a.label}</span>
                    {a.badge != null && a.badge > 0 && (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-bold text-destructive-foreground">
                        {a.badge > 9 ? "9+" : a.badge}
                      </span>
                    )}
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

      {/* Recommend a Provider */}
      <RecommendProvider />
    </div>
  );
};

export default CustomerHome;
