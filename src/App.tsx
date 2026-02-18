import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { DataProvider } from "./context/DataContext";
import { ThemeProvider } from "./context/ThemeContext";
import LoginPage from "./pages/LoginPage";
import DashboardLayout from "./layouts/DashboardLayout";
import DashboardPage from "./pages/DashboardPage";
import RequestsPage from "./pages/RequestsPage";
import ResidentsPage from "./pages/ResidentsPage";
import ReportsPage from "./pages/ReportsPage";
import ResidentPortal from "./pages/ResidentPortal";
import NotFound from "./pages/NotFound";
import ResetPasswordPage from "./pages/ResetPasswordPage";

const queryClient = new QueryClient();

// Protected route component
const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRole: 'official' | 'resident' }> = ({ children, allowedRole }) => {
  const { currentUser, userRole, isLoading } = useAuth();
  
  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-background"><p className="text-muted-foreground">Loading...</p></div>;
  if (!currentUser || userRole !== allowedRole) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const AppRoutes = () => {
  const { currentUser, userRole, isLoading } = useAuth();

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-background"><p className="text-muted-foreground">Loading...</p></div>;

  return (
    <Routes>
      <Route path="/" element={
        currentUser ? (
          <Navigate to={userRole === 'official' ? '/dashboard' : '/portal'} replace />
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
        <ProtectedRoute allowedRole="resident"><ResidentPortal /></ProtectedRoute>
      } />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
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
