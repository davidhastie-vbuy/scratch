import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import HomeRedirect from "@/components/HomeRedirect";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import NotFound from "./pages/NotFound";

// Customer
import CustomerDashboard from "@/pages/CustomerDashboard";
import CustomerHome from "@/pages/customer/CustomerHome";
import PostJob from "@/pages/customer/PostJob";
import MyJobs from "@/pages/customer/MyJobs";
import JobDetail from "@/pages/customer/JobDetail";
import CustomerMessages from "@/pages/customer/CustomerMessages";
import CustomerProfile from "@/pages/CustomerProfile";

// Provider
import ProviderDashboard from "@/pages/ProviderDashboard";
import ProviderHome from "@/pages/provider/ProviderHome";
import AvailableJobs from "@/pages/provider/AvailableJobs";
import ProviderJobDetail from "@/pages/provider/ProviderJobDetail";
import MyQuotes from "@/pages/provider/MyQuotes";
import ProviderMessages from "@/pages/provider/ProviderMessages";
import ProviderProfile from "@/pages/ProviderProfile";

// Shared
import SupportPage from "@/pages/shared/SupportPage";

// Admin
import AdminDashboard from "@/pages/AdminDashboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<HomeRedirect />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

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
              <Route path="support" element={<SupportPage />} />
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
              <Route path="messages" element={<ProviderMessages />} />
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
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
