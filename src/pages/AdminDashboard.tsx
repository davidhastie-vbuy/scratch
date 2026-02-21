import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogOut, Shield, Users, Wrench, Tag, HelpCircle, UserPlus, Star, MessageSquareWarning, Banknote } from "lucide-react";
import NotificationBell from "@/components/NotificationBell";
import AdminCustomerList from "@/components/admin/AdminCustomerList";
import AdminProviderList from "@/components/admin/AdminProviderList";
import AdminCategoryList from "@/components/admin/AdminCategoryList";
import AdminSupportTickets from "@/components/admin/AdminSupportTickets";
import AdminCreateAdmin from "@/components/admin/AdminCreateAdmin";
import AdminRecommendations from "@/components/admin/AdminRecommendations";
import AdminDisputes from "@/components/admin/AdminDisputes";
import AdminPayouts from "@/components/admin/AdminPayouts";

const AdminDashboard = () => {
  const { signOut } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-sidebar text-sidebar-foreground">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-sidebar-primary" />
            <h1 className="font-display text-xl font-bold">BookATrade Admin</h1>
          </div>
          <div className="flex items-center gap-4">
            <NotificationBell />
            <span className="rounded-full bg-sidebar-accent px-3 py-1 text-xs font-medium text-sidebar-accent-foreground">
              Admin
            </span>
            <Button variant="ghost" size="sm" className="text-sidebar-foreground hover:text-sidebar-primary-foreground" onClick={signOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-8">
        <div className="mb-6">
          <h2 className="font-display text-2xl font-bold">Platform Management</h2>
          <p className="text-muted-foreground">Manage users, categories, and support</p>
        </div>

        <Tabs defaultValue="providers" className="space-y-4">
          <TabsList>
            <TabsTrigger value="providers" className="gap-1.5">
              <Wrench className="h-4 w-4" />
              Providers
            </TabsTrigger>
            <TabsTrigger value="customers" className="gap-1.5">
              <Users className="h-4 w-4" />
              Customers
            </TabsTrigger>
            <TabsTrigger value="categories" className="gap-1.5">
              <Tag className="h-4 w-4" />
              Categories
            </TabsTrigger>
            <TabsTrigger value="support" className="gap-1.5">
              <HelpCircle className="h-4 w-4" />
              Support Tickets
            </TabsTrigger>
            <TabsTrigger value="admins" className="gap-1.5">
              <UserPlus className="h-4 w-4" />
              Admins
            </TabsTrigger>
            <TabsTrigger value="recommendations" className="gap-1.5">
              <Star className="h-4 w-4" />
              Recommendations
            </TabsTrigger>
            <TabsTrigger value="disputes" className="gap-1.5">
              <MessageSquareWarning className="h-4 w-4" />
              Disputes
            </TabsTrigger>
            <TabsTrigger value="payouts" className="gap-1.5">
              <Banknote className="h-4 w-4" />
              Payouts
            </TabsTrigger>
          </TabsList>
          <TabsContent value="providers">
            <AdminProviderList />
          </TabsContent>
          <TabsContent value="customers">
            <AdminCustomerList />
          </TabsContent>
          <TabsContent value="categories">
            <AdminCategoryList />
          </TabsContent>
          <TabsContent value="support">
            <AdminSupportTickets />
          </TabsContent>
          <TabsContent value="admins">
            <AdminCreateAdmin />
          </TabsContent>
          <TabsContent value="recommendations">
            <AdminRecommendations />
          </TabsContent>
          <TabsContent value="disputes">
            <AdminDisputes />
          </TabsContent>
          <TabsContent value="payouts">
            <AdminPayouts />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;
