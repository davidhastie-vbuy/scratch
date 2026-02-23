import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Outlet, useLocation, Navigate } from "react-router-dom";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Home, Briefcase, FileText, MessageSquare, HelpCircle, User, Clock, Wrench, AlertTriangle, XCircle, ImageIcon, CalendarDays, Wallet, ClipboardList } from "lucide-react";

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: typeof Clock }> = {
  pending: { label: "Pending Approval", variant: "secondary", icon: Clock },
  pending_review: { label: "Pending Review", variant: "secondary", icon: Clock },
  active: { label: "Active", variant: "default", icon: Wrench },
  suspended: { label: "Suspended", variant: "destructive", icon: AlertTriangle },
  denied: { label: "Denied", variant: "destructive", icon: XCircle },
  changes_requested: { label: "Changes Requested", variant: "outline", icon: Clock },
};

const allNavItems = [
  { label: "Dashboard", path: "/provider", icon: <Home className="h-4 w-4" />, alwaysVisible: true },
  { label: "Available Jobs", path: "/provider/jobs", icon: <Briefcase className="h-4 w-4" />, alwaysVisible: false },
  { label: "My Quotes", path: "/provider/quotes", icon: <FileText className="h-4 w-4" />, alwaysVisible: false },
  { label: "My Jobs", path: "/provider/my-jobs", icon: <ClipboardList className="h-4 w-4" />, alwaysVisible: false },
  { label: "Calendar", path: "/provider/calendar", icon: <CalendarDays className="h-4 w-4" />, alwaysVisible: false },
  { label: "Messages", path: "/provider/messages", icon: <MessageSquare className="h-4 w-4" />, alwaysVisible: false },
  { label: "Portfolio", path: "/provider/portfolio", icon: <ImageIcon className="h-4 w-4" />, alwaysVisible: false },
  { label: "Account", path: "/provider/account", icon: <Wallet className="h-4 w-4" />, alwaysVisible: false },
  { label: "Support", path: "/provider/support", icon: <HelpCircle className="h-4 w-4" />, alwaysVisible: true },
  { label: "Profile", path: "/provider/profile", icon: <User className="h-4 w-4" />, alwaysVisible: true },
];

// Routes that non-active providers can access
const UNRESTRICTED_PATHS = ["/provider", "/provider/support", "/provider/profile"];

const ProviderDashboard = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [status, setStatus] = useState<string | null>(null);
  const [unreadMessages, setUnreadMessages] = useState(0);

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

      // Fetch unread message count
      const fetchUnread = async () => {
        // Get conversations where this provider is involved
        const { data: convs } = await supabase
          .from("conversations")
          .select("id")
          .eq("provider_user_id", user.id);
        if (!convs || convs.length === 0) return;
        const convIds = convs.map(c => c.id);
        const { count } = await supabase
          .from("messages")
          .select("id", { count: "exact", head: true })
          .in("conversation_id", convIds)
          .neq("sender_user_id", user.id)
          .is("read_at", null);
        setUnreadMessages(count ?? 0);
      };
      fetchUnread();

      // Realtime for new messages
      const channel = supabase
        .channel("provider-unread-messages")
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, () => {
          fetchUnread();
        })
        .on("postgres_changes", { event: "UPDATE", schema: "public", table: "messages" }, () => {
          fetchUnread();
        })
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    }
  }, [user]);

  const isActive = status === "active";
  const navItems = allNavItems
    .filter(item => isActive || item.alwaysVisible)
    .map(item => item.label === "Messages" ? { ...item, badge: unreadMessages } : item);

  // Redirect non-active providers away from restricted routes
  if (status && !isActive) {
    const currentPath = location.pathname;
    const isAllowed = UNRESTRICTED_PATHS.some(p =>
      p === currentPath || (p === "/provider" && currentPath === "/provider")
    );
    if (!isAllowed) {
      return <Navigate to="/provider" replace />;
    }
  }

  const cfg = STATUS_CONFIG[status ?? "pending"] ?? STATUS_CONFIG.pending;
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
