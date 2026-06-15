import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
      <div className="text-center max-w-md">
        <p className="text-[11px] tracking-[0.22em] uppercase text-primary font-semibold mb-4">Page Not Found</p>
        <h1 className="font-display text-7xl sm:text-8xl font-extrabold text-foreground tracking-tight leading-none mb-6">404</h1>
        <p className="text-base text-foreground/55 leading-relaxed mb-10">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          to="/"
          className="inline-block bg-foreground text-background px-8 py-3.5 text-[11px] tracking-[0.14em] uppercase font-bold hover:bg-primary transition-colors"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
