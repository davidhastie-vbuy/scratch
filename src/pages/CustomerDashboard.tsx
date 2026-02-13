import { useAuth } from "@/contexts/AuthContext";
import { Outlet } from "react-router-dom";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Home, PlusCircle, Briefcase, MessageSquare, HelpCircle, User, Users } from "lucide-react";

const navItems = [
  { label: "Dashboard", path: "/dashboard", icon: <Home className="h-4 w-4" /> },
  { label: "Post a Job", path: "/dashboard/post-job", icon: <PlusCircle className="h-4 w-4" /> },
  { label: "My Jobs", path: "/dashboard/jobs", icon: <Briefcase className="h-4 w-4" /> },
  { label: "Messages", path: "/dashboard/messages", icon: <MessageSquare className="h-4 w-4" /> },
  { label: "Local Trades", path: "/dashboard/providers", icon: <Users className="h-4 w-4" /> },
  { label: "Support", path: "/dashboard/support", icon: <HelpCircle className="h-4 w-4" /> },
  { label: "Profile", path: "/dashboard/profile", icon: <User className="h-4 w-4" /> },
];

const CustomerDashboard = () => {
  return (
    <DashboardLayout title="Customer Dashboard" navItems={navItems} roleBadge="Customer">
      <Outlet />
    </DashboardLayout>
  );
};

export default CustomerDashboard;
