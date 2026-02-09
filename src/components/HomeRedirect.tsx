import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Index from "@/pages/Index";

const HomeRedirect = () => {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) return <Index />;

  switch (role) {
    case "admin":
      return <Navigate to="/admin" replace />;
    case "provider":
      return <Navigate to="/provider" replace />;
    case "customer":
    default:
      return <Navigate to="/dashboard" replace />;
  }
};

export default HomeRedirect;
