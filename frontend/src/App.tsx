import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Booking from "./pages/Booking";
import Messages from "./pages/Messages";
import HealerProfile from "./pages/HealerProfile";
import HealerManagement from "./pages/HealerManagement";
import VideoSession from "./pages/VideoSession";
import AdminReportManagement from "./pages/AdminReportManagement";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Support from "./pages/Support";
import FAQ from "./pages/FAQ";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import HealerSearch from "./pages/HealerSearch";
import Forum from "./pages/Forum";
import Settings from "./pages/Settings";
import DemoAccounts from "./pages/DemoAccounts";
import HealerOnboarding from "./pages/HealerOnboarding";
import CredentialVerification from "./pages/CredentialVerification";
import NotFound from "./pages/NotFound";
import { ProtectedRoute } from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const AppContent = () => {
  const { isAuthenticated, user } = useAuth();
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation isAuthenticated={isAuthenticated} userType={user?.userType || 'seeker'} />
      <main className="flex-1">
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
      </main>
      <Footer />
    </div>
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
