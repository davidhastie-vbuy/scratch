import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Outlet } from "react-router-dom";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Home, Briefcase, FileText, MessageSquare, HelpCircle, User, Clock, Wrench, AlertTriangle, XCircle } from "lucide-react";

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: typeof Clock }> = {
  pending: { label: "Pending Approval", variant: "secondary", icon: Clock },
  pending_review: { label: "Pending Review", variant: "secondary", icon: Clock },
  active: { label: "Active", variant: "default", icon: Wrench },
  suspended: { label: "Suspended", variant: "destructive", icon: AlertTriangle },
  denied: { label: "Denied", variant: "destructive", icon: XCircle },
  changes_requested: { label: "Changes Requested", variant: "outline", icon: Clock },
};

const navItems = [
  { label: "Dashboard", path: "/provider", icon: <Home className="h-4 w-4" /> },
  { label: "Available Jobs", path: "/provider/jobs", icon: <Briefcase className="h-4 w-4" /> },
  { label: "My Quotes", path: "/provider/quotes", icon: <FileText className="h-4 w-4" /> },
  { label: "Messages", path: "/provider/messages", icon: <MessageSquare className="h-4 w-4" /> },
  { label: "Support", path: "/provider/support", icon: <HelpCircle className="h-4 w-4" /> },
  { label: "Profile", path: "/provider/profile", icon: <User className="h-4 w-4" /> },
];

const ProviderDashboard = () => {
  const { user } = useAuth();
  const [status, setStatus] = useState("pending");

  useEffect(() => {
    if (user) {
      supabase
        .from("provider_profiles")
        .select("status")
        .eq("user_id", user.id)
        .single()
        .then(({ data }) => {
          if (data) setStatus(data.status as string);
        });
    }
  }, [user]);

  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  const StatusIcon = cfg.icon;

  const statusBadge = (
    <Badge variant={cfg.variant} className="gap-1">
      <StatusIcon className="h-3 w-3" />
      {cfg.label}
    </Badge>
  );

  return (
    <DashboardLayout title="Provider Dashboard" navItems={navItems} roleBadge="Provider" statusBadge={statusBadge}>
      <Outlet />
    </DashboardLayout>
  );
};

export default ProviderDashboard;
