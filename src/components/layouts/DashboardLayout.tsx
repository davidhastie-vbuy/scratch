import { ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut, Home, Wrench, Shield } from "lucide-react";
import NotificationBell from "@/components/NotificationBell";
import { NavLink, useNavigate, Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import logo from "@/assets/bookatrade-logo.png";
import logoDark from "@/assets/bookatrade-logo-dark.jpeg";

interface NavItem {
  label: string;
  path: string;
  icon: ReactNode;
  badge?: number;
}

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
  navItems: NavItem[];
  roleBadge: string;
  statusBadge?: ReactNode;
}

const DashboardLayout = ({ children, title, navItems, roleBadge, statusBadge }: DashboardLayoutProps) => {
  const { signOut } = useAuth();
  const audience = roleBadge.toLowerCase() === "provider" ? "provider" : "customer";
  const dashboardPath = audience === "provider" ? "/provider" : "/dashboard";
  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="hidden md:flex w-60 flex-col bg-foreground text-primary-foreground">
        <Link to={dashboardPath} className="flex h-16 items-center gap-2.5 border-b border-primary-foreground/10 px-4 hover:opacity-80 transition-opacity">
          <img src={logoDark} alt="BookATrade logo" className="h-9 w-9 rounded-full" />
          <span className="font-display text-lg font-extrabold">
            Book<span className="text-primary">A</span>Trade
          </span>
        </Link>
        <nav className="flex-1 space-y-1 p-3">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-primary-foreground/60 hover:bg-primary-foreground/10 hover:text-primary-foreground"
                )
              }
            >
              {item.icon}
              {item.label}
              {item.badge != null && item.badge > 0 && (
                <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-bold text-destructive-foreground">
                  {item.badge > 9 ? "9+" : item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-primary-foreground/10 p-3">
          <Button variant="ghost" size="sm" className="w-full justify-start text-primary-foreground/60 hover:text-primary-foreground hover:bg-primary-foreground/10" onClick={signOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </Button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="border-b bg-card shadow-sm">
          <div className="flex h-16 items-center justify-between px-4 md:px-6">
            <div className="flex items-center gap-3">
              <Link to={dashboardPath} className="md:hidden flex items-center gap-2 mr-2 hover:opacity-80 transition-opacity">
                <img src={logo} alt="BookATrade logo" className="h-7 w-7" />
              </Link>
              <h1 className="font-display text-xl font-extrabold truncate">{title}</h1>
            </div>
            <div className="flex items-center gap-2">
              <NotificationBell />
              {statusBadge}
              <Badge variant="secondary" className="font-bold">{roleBadge}</Badge>
              <Button variant="ghost" size="sm" className="md:hidden" onClick={signOut}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
          {/* Mobile nav */}
          <div className="flex md:hidden overflow-x-auto border-t px-1 gap-0.5 bg-card scrollbar-hide">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end
                className={({ isActive }) =>
                  cn(
                    "flex flex-col items-center gap-0.5 whitespace-nowrap px-2 py-2 text-[10px] font-semibold border-b-2 transition-colors min-w-[3.5rem]",
                    isActive
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground"
                  )
                }
              >
                {item.icon}
                <span className="truncate max-w-[4rem]">{item.label}</span>
                {item.badge != null && item.badge > 0 && (
                  <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[8px] font-bold text-destructive-foreground -mt-0.5">
                    {item.badge > 9 ? "9+" : item.badge}
                  </span>
                )}
              </NavLink>
            ))}
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          {children}
        </main>
        <footer className="border-t bg-card px-4 py-3 text-center text-xs text-muted-foreground flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
          <a href={`/legal?audience=${audience}`} target="_blank" rel="noopener noreferrer" className="hover:text-foreground hover:underline">Terms & Conditions</a>
          <span className="hidden sm:inline">·</span>
          <a href={`/legal/privacy-policy?audience=${audience}`} target="_blank" rel="noopener noreferrer" className="hover:text-foreground hover:underline">Privacy Policy</a>
        </footer>
      </div>
    </div>
  );
};

export default DashboardLayout;
