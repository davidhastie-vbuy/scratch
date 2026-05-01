import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import HomeRedirect from "@/components/HomeRedirect";
import Analytics from "@/components/Analytics";
import ScrollToTop from "@/components/ScrollToTop";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import NotFound from "./pages/NotFound";

// Customer
import CustomerDashboard from "@/pages/CustomerDashboard";
import CustomerHome from "@/pages/customer/CustomerHome";
import PostJob from "@/pages/customer/PostJob";
import MyJobs from "@/pages/customer/MyJobs";
import JobDetail from "@/pages/customer/JobDetail";
import CustomerMessages from "@/pages/customer/CustomerMessages";
import CustomerProfile from "@/pages/CustomerProfile";
import Favourites from "@/pages/customer/Favourites";

// Provider
import ProviderDashboard from "@/pages/ProviderDashboard";
import ProviderHome from "@/pages/provider/ProviderHome";
import AvailableJobs from "@/pages/provider/AvailableJobs";
import ProviderJobDetail from "@/pages/provider/ProviderJobDetail";
import MyQuotes from "@/pages/provider/MyQuotes";
import ProviderMyJobs from "@/pages/provider/ProviderMyJobs";
import ProviderMessages from "@/pages/provider/ProviderMessages";
import ProviderProfile from "@/pages/ProviderProfile";
import ProviderPortfolio from "@/pages/provider/ProviderPortfolio";
import ProviderCalendar from "@/pages/provider/ProviderCalendar";
import ProviderAccount from "@/pages/provider/ProviderAccount";

// Customer provider views
import ProviderDirectory from "@/pages/customer/ProviderDirectory";
import ProviderPublicPage from "@/pages/customer/ProviderPublicPage";

// Shared
import SupportPage from "@/pages/shared/SupportPage";

// Admin
import AdminDashboard from "@/pages/AdminDashboard";
import LegalPage from "@/pages/LegalPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <Analytics />
          <Routes>
            <Route path="/" element={<HomeRedirect />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Customer routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute allowedRoles={["customer"]}>
                  <CustomerDashboard />
                </ProtectedRoute>
              }
            >
              <Route index element={<CustomerHome />} />
              <Route path="post-job" element={<PostJob />} />
              <Route path="jobs" element={<MyJobs />} />
              <Route path="jobs/:jobId" element={<JobDetail />} />
              <Route path="messages" element={<CustomerMessages />} />
              <Route path="providers" element={<ProviderDirectory />} />
              <Route path="providers/:providerId" element={<ProviderPublicPage />} />
              <Route path="support" element={<SupportPage />} />
              <Route path="favourites" element={<Favourites />} />
              <Route path="profile" element={<CustomerProfile />} />
            </Route>

            {/* Provider routes */}
            <Route
              path="/provider"
              element={
                <ProtectedRoute allowedRoles={["provider"]}>
                  <ProviderDashboard />
                </ProtectedRoute>
              }
            >
              <Route index element={<ProviderHome />} />
              <Route path="jobs" element={<AvailableJobs />} />
              <Route path="jobs/:jobId" element={<ProviderJobDetail />} />
              <Route path="quotes" element={<MyQuotes />} />
              <Route path="my-jobs" element={<ProviderMyJobs />} />
              <Route path="calendar" element={<ProviderCalendar />} />
              <Route path="messages" element={<ProviderMessages />} />
              <Route path="portfolio" element={<ProviderPortfolio />} />
              <Route path="account" element={<ProviderAccount />} />
              <Route path="support" element={<SupportPage />} />
              <Route path="profile" element={<ProviderProfile />} />
            </Route>

            {/* Admin */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route path="/legal" element={<LegalPage />} />
            <Route path="/legal/:slug" element={<LegalPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
