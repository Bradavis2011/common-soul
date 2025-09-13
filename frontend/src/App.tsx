import { Suspense, lazy, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { ProtectedRoute } from "./components/ProtectedRoute";
import ErrorBoundary, { setupGlobalErrorHandling } from "@/components/ErrorBoundary";
import { analytics, trackPageView } from "@/services/analytics";
import PerformanceDashboard from "@/components/PerformanceDashboard";

// Lazy load pages for better performance
const Index = lazy(() => import("./pages/Index"));
const Login = lazy(() => import("./pages/Login"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Booking = lazy(() => import("./pages/Booking"));
const Messages = lazy(() => import("./pages/Messages"));
const HealerProfile = lazy(() => import("./pages/HealerProfile"));
const HealerManagement = lazy(() => import("./pages/HealerManagement"));
const VideoSession = lazy(() => import("./pages/VideoSession"));
const AdminReportManagement = lazy(() => import("./pages/AdminReportManagement"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const Support = lazy(() => import("./pages/Support"));
const FAQ = lazy(() => import("./pages/FAQ"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));
const HealerSearch = lazy(() => import("./pages/HealerSearch"));
const Forum = lazy(() => import("./pages/Forum"));
const Settings = lazy(() => import("./pages/Settings"));
const DemoAccounts = lazy(() => import("./pages/DemoAccounts"));
const HealerOnboarding = lazy(() => import("./pages/HealerOnboarding"));
const CredentialVerification = lazy(() => import("./pages/CredentialVerification"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Loading component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-[200px]">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

const queryClient = new QueryClient();

// Analytics page tracking component
const AnalyticsTracker = () => {
  const location = useLocation();

  useEffect(() => {
    // Initialize analytics and global error handling on app start
    analytics.initialize();
    setupGlobalErrorHandling();
    analytics.trackSessionStart();
  }, []);

  useEffect(() => {
    // Track page views on route changes
    trackPageView(location.pathname, document.title);
  }, [location]);

  return null;
};

const AppContent = () => {
  const { isAuthenticated, user } = useAuth();
  
  return (
    <ErrorBoundary>
      <AnalyticsTracker />
      <div className="min-h-screen bg-background flex flex-col">
        <Navigation isAuthenticated={isAuthenticated} userType={user?.userType || 'seeker'} />
        <main className="flex-1">
          <Suspense fallback={<LoadingSpinner />}>
          <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={
            <ProtectedRoute requireHealerOnboarding={true}>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/booking" element={<Booking />} />
          <Route path="/booking/:bookingId/payment" element={<Booking />} />
          <Route path="/sessions" element={
            <ProtectedRoute requireHealerOnboarding={true}>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/messages" element={
            <ProtectedRoute requireHealerOnboarding={true}>
              <Messages />
            </ProtectedRoute>
          } />
          <Route path="/healer/:id" element={<HealerProfile />} />
          <Route path="/my-profile" element={
            <ProtectedRoute requireHealerOnboarding={true}>
              <HealerProfile />
            </ProtectedRoute>
          } />
          <Route path="/healer-management" element={
            <ProtectedRoute requireHealerOnboarding={true}>
              <HealerManagement />
            </ProtectedRoute>
          } />
          <Route path="/admin/reports" element={<AdminReportManagement />} />
          <Route path="/session/:sessionId" element={<VideoSession />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/support" element={<Support />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/healers" element={<HealerSearch />} />
          <Route path="/forum" element={<Forum />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/demo-accounts" element={<DemoAccounts />} />
          <Route path="/healer-onboarding" element={<HealerOnboarding />} />
          <Route path="/credentials" element={
            <ProtectedRoute requireHealerOnboarding={true}>
              <CredentialVerification />
            </ProtectedRoute>
          } />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
    </div>
    <PerformanceDashboard />
    </ErrorBoundary>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
