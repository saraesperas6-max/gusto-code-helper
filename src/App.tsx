import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { DataProvider } from "./context/DataContext";
import { ThemeProvider } from "./context/ThemeContext";
import React, { Suspense } from "react";

const LoginPage = React.lazy(() => import("./pages/LoginPage"));
const CompleteProfilePage = React.lazy(() => import("./pages/CompleteProfilePage"));
const DashboardLayout = React.lazy(() => import("./layouts/DashboardLayout"));
const DashboardPage = React.lazy(() => import("./pages/DashboardPage"));
const RequestsPage = React.lazy(() => import("./pages/RequestsPage"));
const ResidentsPage = React.lazy(() => import("./pages/ResidentsPage"));
const ReportsPage = React.lazy(() => import("./pages/ReportsPage"));
const ResidentPortal = React.lazy(() => import("./pages/ResidentPortal"));
const NotFound = React.lazy(() => import("./pages/NotFound"));
const ResetPasswordPage = React.lazy(() => import("./pages/ResetPasswordPage"));

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <p className="text-muted-foreground">Loading...</p>
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Protected route component
const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRole: 'official' | 'resident' }> = ({ children, allowedRole }) => {
  const { user, userRole, isLoading } = useAuth();
  
  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-background"><p className="text-muted-foreground">Loading...</p></div>;
  
  if (!user) return <Navigate to="/" replace />;
  
  // Map DB roles to app roles
  const effectiveRole = userRole === 'admin' ? 'official' : 'resident';
  if (effectiveRole !== allowedRole) return <Navigate to="/" replace />;
  
  return <>{children}</>;
};

const isProfileIncomplete = (profile: any) => {
  if (!profile) return false;
  return !profile.age || !profile.address || !profile.contact || !profile.first_name || !profile.last_name;
};

const AppRoutes = () => {
  const { user, userRole, profile, isLoading } = useAuth();

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-background"><p className="text-muted-foreground">Loading...</p></div>;

  // Redirect residents with incomplete profiles to complete-profile page
  const needsProfileCompletion = user && userRole === 'resident' && profile && isProfileIncomplete(profile);

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={
          user ? (
            needsProfileCompletion ? (
              <Navigate to="/complete-profile" replace />
            ) : (
              <Navigate to={userRole === 'admin' ? '/dashboard' : '/portal'} replace />
            )
          ) : (
            <LoginPage />
          )
        } />
        <Route path="/dashboard" element={
          <ProtectedRoute allowedRole="official"><DashboardLayout /></ProtectedRoute>
        }>
          <Route index element={<DashboardPage />} />
          <Route path="requests" element={<RequestsPage />} />
          <Route path="residents" element={<ResidentsPage />} />
          <Route path="reports" element={<ReportsPage />} />
        </Route>
        <Route path="/portal" element={
          needsProfileCompletion ? (
            <Navigate to="/complete-profile" replace />
          ) : (
            <ProtectedRoute allowedRole="resident"><ResidentPortal /></ProtectedRoute>
          )
        } />
        <Route path="/complete-profile" element={
          user && needsProfileCompletion ? <CompleteProfilePage /> : <Navigate to="/" replace />
        } />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ThemeProvider>
        <AuthProvider>
          <DataProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </DataProvider>
        </AuthProvider>
      </ThemeProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
