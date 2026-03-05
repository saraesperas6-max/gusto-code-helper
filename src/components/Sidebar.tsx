import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  BarChart3, 
  LogOut,
  Menu,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import logo from '@/assets/logo.png';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

interface SidebarProps {
  className?: string;
  isOpen: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ className, isOpen, onToggle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/dashboard/requests', icon: FileText, label: 'Requests' },
    { path: '/dashboard/residents', icon: Users, label: 'Residents' },
    { path: '/dashboard/reports', icon: BarChart3, label: 'Reports' },
  ];

  return (
    <>
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-screen bg-sidebar text-sidebar-foreground flex flex-col transition-all duration-300 ease-in-out",
          isOpen ? "w-56 sm:w-64" : "w-0 overflow-hidden",
          className
        )}
      >
        {/* Header with logo & close toggle */}
        <div className="flex items-center gap-2 px-4 py-4 sm:px-6 sm:py-6 min-w-[14rem] sm:min-w-[16rem]">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="text-sidebar-foreground hover:bg-sidebar-accent h-8 w-8 sm:h-9 sm:w-9 shrink-0"
          >
            <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
          <div className="flex items-center gap-2 sm:gap-3 overflow-hidden">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-white/30 overflow-hidden bg-white/10 flex items-center justify-center shrink-0">
              <img src={logo} alt="Barangay Logo" className="w-full h-full object-cover" />
            </div>
            <h1 className="text-sm sm:text-base font-semibold whitespace-nowrap">Palma-Urbano</h1>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 sm:px-4 space-y-0.5 sm:space-y-1 min-w-[14rem] sm:min-w-[16rem]">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={cn(
                  "w-full flex items-center gap-2.5 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg transition-colors text-left",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}
              >
                <item.icon className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                <span className="text-xs sm:text-sm font-medium whitespace-nowrap">{item.label}</span>
              </button>
            );
          })}

          {/* Logout */}
          <button
            onClick={() => setShowLogoutDialog(true)}
            className="w-full flex items-center gap-2.5 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg transition-colors text-left text-red-400 hover:bg-red-500/20 hover:text-red-300 mt-3 sm:mt-4"
          >
            <LogOut className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
            <span className="text-xs sm:text-sm font-medium whitespace-nowrap">Logout</span>
          </button>
        </nav>

        {/* Footer */}
        <div className="text-center py-4 sm:py-6 text-[10px] sm:text-sm text-sidebar-foreground/40 min-w-[14rem] sm:min-w-[16rem]">
          © 2026 All Rights Reserved.
        </div>
      </aside>

      {/* Mobile overlay backdrop - does NOT close sidebar, only dims background */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden pointer-events-none"
        />
      )}

      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to log out? You will need to sign in again to access the dashboard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout}>Logout</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default React.memo(Sidebar);
