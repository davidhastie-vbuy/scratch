import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, User, Wrench } from "lucide-react";

const ProviderDashboard = () => {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-primary" />
            <h1 className="font-display text-xl font-bold">TradeConnect</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              Provider
            </span>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-8">
        <div className="mb-8">
          <h2 className="font-display text-2xl font-bold">Provider Dashboard</h2>
          <p className="text-muted-foreground">Manage your trade services</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5 text-primary" />
                Profile
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
              <CardDescription>Coming in Stage 2</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Browse and bid on local jobs.</p>
            </CardContent>
          </Card>

          <Card className="border-dashed">
            <CardHeader>
              <CardTitle className="text-lg text-muted-foreground">Reviews</CardTitle>
              <CardDescription>Coming in Stage 2</CardDescription>
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
