import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield, Users, Wrench, ArrowRight } from "lucide-react";

const Index = () => {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b bg-card">
        <div className="container flex h-16 items-center justify-between">
          <h1 className="font-display text-xl font-bold text-foreground">TradeConnect</h1>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link to="/login">Sign in</Link>
            </Button>
            <Button asChild>
              <Link to="/signup">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-4">
        <div className="max-w-2xl text-center">
          <h2 className="font-display text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
            Connect with trusted
            <span className="text-primary"> tradespeople</span>
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-lg text-muted-foreground">
            Find reliable local professionals for your home projects. Quality work, fair prices, real reviews.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button size="lg" asChild>
              <Link to="/signup">
                Get started free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/login">Sign in</Link>
            </Button>
          </div>
        </div>

        <div className="mt-16 grid max-w-3xl gap-8 sm:grid-cols-3">
          <div className="text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-accent">
              <Users className="h-6 w-6 text-accent-foreground" />
            </div>
            <h3 className="font-display font-semibold text-foreground">Customers</h3>
            <p className="mt-1 text-sm text-muted-foreground">Post jobs and find the right tradesperson</p>
          </div>
          <div className="text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-accent">
              <Wrench className="h-6 w-6 text-accent-foreground" />
            </div>
            <h3 className="font-display font-semibold text-foreground">Providers</h3>
            <p className="mt-1 text-sm text-muted-foreground">Grow your business with local leads</p>
          </div>
          <div className="text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-accent">
              <Shield className="h-6 w-6 text-accent-foreground" />
            </div>
            <h3 className="font-display font-semibold text-foreground">Trusted</h3>
            <p className="mt-1 text-sm text-muted-foreground">Verified reviews and secure payments</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
