import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { AppProvider, useApp } from "@/contexts/AppContext";
import { useNativeInit } from "@/hooks/useNativeInit";
import AdminRoute from "@/routes/AdminRoute";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import MyListPage from "./pages/MyListPage";
import PremiumPage from "./pages/PremiumPage";
import ProfilePage from "./pages/ProfilePage";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import TermsOfUsePage from "./pages/TermsOfUsePage";
import AboutPage from "./pages/AboutPage";
import FAQPage from "./pages/FAQPage";
import CancelSubscriptionPage from "./pages/CancelSubscriptionPage";
import StoryDetailPage from "./pages/StoryDetailPage";
import StoryReaderPage from "./pages/StoryReaderPage";
import AdminLoginPage from "./pages/AdminLoginPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import StoriesListPage from "./pages/admin/StoriesListPage";
import StoryEditPage from "./pages/admin/StoryEditPage";
import StoryPreviewPage from "./pages/admin/StoryPreviewPage";
import UsersListPage from "./pages/admin/UsersListPage";
import StoryViewsPage from "./pages/admin/StoryViewsPage";
import SubscribersPage from "./pages/admin/SubscribersPage";
import OfflineIndicator from "./components/OfflineIndicator";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

// Protected route wrapper - requires authentication
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  // MUDANÇA: Usamos isLoggedIn em vez de session
  const { authReady, isLoggedIn } = useApp();

  // Wait for auth to fully initialize before making routing decisions
  if (!authReady) {
    return (
      <div className="mobile-container min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // No session after auth is ready = not logged in
  if (!isLoggedIn) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

// Auth route - redirect to home if already logged in
const AuthRoute = ({ children }: { children: React.ReactNode }) => {
  // MUDANÇA: Usamos isLoggedIn em vez de session
  const { authReady, isLoggedIn, isAdmin, adminReady } = useApp();

  // Wait for auth to fully initialize
  if (!authReady) {
    return (
      <div className="mobile-container min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If logged in, redirect appropriately
  if (isLoggedIn) {
    // Admins go to admin dashboard, regular users go to home
    if (adminReady && isAdmin) {
      return <Navigate to="/admin/dashboard" replace />;
    }
    return <Navigate to="/home" replace />;
  }

  return <>{children}</>;
};

const AppRoutes = () => {
  const isNativeApp = Capacitor.isNativePlatform();
  
  // Initialize native app (status bar, splash screen, etc.)
  useNativeInit();

  return (
    <Routes>
      <Route
        path="/"
        element={
          <AuthRoute>
            <LoginPage />
          </AuthRoute>
        }
      />
      <Route
        path="/home"
        element={
          <HomePage />
        }
      />
      <Route
        path="/my-list"
        element={
          <ProtectedRoute>
            <MyListPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/premium"
        element={
          <ProtectedRoute>
            <PremiumPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/story/:id"
        element={
          <StoryDetailPage />
        }
      />
      <Route
        path="/story/:id/read"
        element={
          <StoryReaderPage />
        }
      />
      {/* Info Pages */}
      <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
      <Route path="/terms-of-use" element={<TermsOfUsePage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/faq" element={<FAQPage />} />
      <Route path="/cancel-subscription" element={<CancelSubscriptionPage />} />
      
      {/* Admin Routes - only available on web, hidden on native mobile apps */}
      {!isNativeApp && (
        <>
          <Route path="/admin" element={<AdminLoginPage />} />
          <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboardPage /></AdminRoute>} />
          <Route path="/admin/stories" element={<AdminRoute><StoriesListPage /></AdminRoute>} />
          <Route path="/admin/stories/:id/edit" element={<AdminRoute><StoryEditPage /></AdminRoute>} />
          <Route path="/admin/stories/:id/preview" element={<AdminRoute><StoryPreviewPage /></AdminRoute>} />
          <Route path="/admin/users" element={<AdminRoute><UsersListPage /></AdminRoute>} />
          <Route path="/admin/views" element={<AdminRoute><StoryViewsPage /></AdminRoute>} />
          <Route path="/admin/subscribers" element={<AdminRoute><SubscribersPage /></AdminRoute>} />
        </>
      )}
      
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AppProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <OfflineIndicator />
          <AppRoutes />
        </BrowserRouter>
      </AppProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;