import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Outlet } from "react-router-dom";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Home, PlusCircle, Briefcase, MessageSquare, HelpCircle, User, Users, Heart } from "lucide-react";

const allNavItems = [
  { label: "Dashboard", path: "/dashboard", icon: <Home className="h-4 w-4" /> },
  { label: "Post a Job", path: "/dashboard/post-job", icon: <PlusCircle className="h-4 w-4" /> },
  { label: "My Jobs", path: "/dashboard/jobs", icon: <Briefcase className="h-4 w-4" /> },
  { label: "Messages", path: "/dashboard/messages", icon: <MessageSquare className="h-4 w-4" /> },
  { label: "Local Trades", path: "/dashboard/providers", icon: <Users className="h-4 w-4" /> },
  { label: "Support", path: "/dashboard/support", icon: <HelpCircle className="h-4 w-4" /> },
  { label: "Profile", path: "/dashboard/profile", icon: <User className="h-4 w-4" /> },
];

const CustomerDashboard = () => {
  const { user } = useAuth();
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    if (!user) return;

    const fetchUnread = async () => {
      const { data: convs } = await supabase
        .from("conversations")
        .select("id")
        .eq("customer_user_id", user.id);
      if (!convs || convs.length === 0) { setUnreadMessages(0); return; }
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

    const channel = supabase
      .channel("customer-unread-messages")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, () => fetchUnread())
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "messages" }, () => fetchUnread())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const navItems = allNavItems.map(item =>
    item.label === "Messages" ? { ...item, badge: unreadMessages } : item
  );

  return (
    <DashboardLayout title="Customer Dashboard" navItems={navItems} roleBadge="Customer">
      <Outlet />
    </DashboardLayout>
  );
};

export default CustomerDashboard;
