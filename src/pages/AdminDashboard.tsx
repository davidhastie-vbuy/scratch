import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogOut, Shield, Users, Wrench } from "lucide-react";
import AdminCustomerList from "@/components/admin/AdminCustomerList";
import AdminProviderList from "@/components/admin/AdminProviderList";

const AdminDashboard = () => {
  const { signOut } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-sidebar text-sidebar-foreground">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-sidebar-primary" />
            <h1 className="font-display text-xl font-bold">TradeConnect Admin</h1>
          </div>
          <div className="flex items-center gap-4">
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
          <h2 className="font-display text-2xl font-bold">User Management</h2>
          <p className="text-muted-foreground">View and manage all platform users</p>
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
          </TabsList>
          <TabsContent value="providers">
            <AdminProviderList />
          </TabsContent>
          <TabsContent value="customers">
            <AdminCustomerList />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;
