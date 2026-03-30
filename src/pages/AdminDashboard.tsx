import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogOut, Shield, Users, Wrench, Tag, HelpCircle, UserPlus, Star, MessageSquareWarning, Banknote, FileText, LayoutGrid } from "lucide-react";
import NotificationBell from "@/components/NotificationBell";
import AdminCustomerList from "@/components/admin/AdminCustomerList";
import AdminProviderList from "@/components/admin/AdminProviderList";
import AdminCategoryList from "@/components/admin/AdminCategoryList";
import AdminSupportTickets from "@/components/admin/AdminSupportTickets";
import AdminCreateAdmin from "@/components/admin/AdminCreateAdmin";
import AdminRecommendations from "@/components/admin/AdminRecommendations";
import AdminDisputes from "@/components/admin/AdminDisputes";
import AdminPayouts from "@/components/admin/AdminPayouts";
import AdminLegalPages from "@/components/admin/AdminLegalPages";
import AdminProviderSlots from "@/components/admin/AdminProviderSlots";

const AdminDashboard = () => {
  const { signOut } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-sidebar text-sidebar-foreground">
        <div className="container flex h-14 sm:h-16 items-center justify-between px-3 sm:px-6">
          <div className="flex items-center gap-2 min-w-0">
            <Shield className="h-5 w-5 text-sidebar-primary shrink-0" />
            <h1 className="font-display text-base sm:text-xl font-bold truncate">Book A Trade Admin</h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <NotificationBell />
            <span className="hidden sm:inline-block rounded-full bg-sidebar-accent px-3 py-1 text-xs font-medium text-sidebar-accent-foreground">
              Admin
            </span>
            <Button variant="ghost" size="sm" className="text-sidebar-foreground hover:text-sidebar-primary-foreground" onClick={signOut}>
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline ml-2">Sign out</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-4 sm:py-8 px-3 sm:px-6">
        <div className="mb-4 sm:mb-6">
          <h2 className="font-display text-xl sm:text-2xl font-bold">Platform Management</h2>
          <p className="text-sm sm:text-base text-muted-foreground">Manage users, categories, and support</p>
        </div>

        <Tabs defaultValue="providers" className="space-y-4">
          <div className="overflow-x-auto scrollbar-hide -mx-3 px-3 sm:mx-0 sm:px-0">
            <TabsList className="inline-flex w-auto min-w-max">
              <TabsTrigger value="providers" className="gap-1 sm:gap-1.5 text-xs sm:text-sm px-2 sm:px-3">
                <Wrench className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Providers</span>
                <span className="sm:hidden">Prov</span>
              </TabsTrigger>
              <TabsTrigger value="customers" className="gap-1 sm:gap-1.5 text-xs sm:text-sm px-2 sm:px-3">
                <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Customers</span>
                <span className="sm:hidden">Cust</span>
              </TabsTrigger>
              <TabsTrigger value="categories" className="gap-1 sm:gap-1.5 text-xs sm:text-sm px-2 sm:px-3">
                <Tag className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Categories</span>
                <span className="sm:hidden">Cat</span>
              </TabsTrigger>
              <TabsTrigger value="support" className="gap-1 sm:gap-1.5 text-xs sm:text-sm px-2 sm:px-3">
                <HelpCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Support Tickets</span>
                <span className="sm:hidden">Support</span>
              </TabsTrigger>
              <TabsTrigger value="admins" className="gap-1 sm:gap-1.5 text-xs sm:text-sm px-2 sm:px-3">
                <UserPlus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Admins</span>
                <span className="sm:hidden">Admin</span>
              </TabsTrigger>
              <TabsTrigger value="recommendations" className="gap-1 sm:gap-1.5 text-xs sm:text-sm px-2 sm:px-3">
                <Star className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Recommendations</span>
                <span className="sm:hidden">Recs</span>
              </TabsTrigger>
              <TabsTrigger value="disputes" className="gap-1 sm:gap-1.5 text-xs sm:text-sm px-2 sm:px-3">
                <MessageSquareWarning className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Disputes</span>
                <span className="sm:hidden">Disp</span>
              </TabsTrigger>
              <TabsTrigger value="payouts" className="gap-1 sm:gap-1.5 text-xs sm:text-sm px-2 sm:px-3">
                <Banknote className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Payouts</span>
                <span className="sm:hidden">Pay</span>
              </TabsTrigger>
              <TabsTrigger value="legal" className="gap-1 sm:gap-1.5 text-xs sm:text-sm px-2 sm:px-3">
                <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Legal Pages</span>
                <span className="sm:hidden">Legal</span>
              </TabsTrigger>
              <TabsTrigger value="slots" className="gap-1 sm:gap-1.5 text-xs sm:text-sm px-2 sm:px-3">
                <LayoutGrid className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Provider Slots</span>
                <span className="sm:hidden">Slots</span>
              </TabsTrigger>
            </TabsList>
          </div>
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
          <TabsContent value="legal">
            <AdminLegalPages />
          </TabsContent>
          <TabsContent value="slots">
            <AdminProviderSlots />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;
