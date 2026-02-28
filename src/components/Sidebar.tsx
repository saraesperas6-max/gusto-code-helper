import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  BarChart3, 
  LogOut,
  Menu,
  X
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
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

interface SidebarProps {
  className?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ className }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [open, setOpen] = useState(false);

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

  const handleNavigate = (path: string) => {
    navigate(path);
    setOpen(false);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="flex-1">
        {/* Logo Section */}
        <div className="flex items-center gap-3 px-6 py-8">
          <div className="w-14 h-14 rounded-full border-2 border-white/30 overflow-hidden bg-white/10 flex items-center justify-center">
            <img 
              src={logo} 
              alt="Barangay Logo" 
              className="w-full h-full object-cover"
            />
          </div>
          <h1 className="text-lg font-semibold text-white">Palma-Urbano</h1>
        </div>

        {/* Navigation */}
        <nav className="px-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => handleNavigate(item.path)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left",
                  isActive 
                    ? "bg-primary text-primary-foreground" 
                    : "text-white/80 hover:bg-white/10 hover:text-white"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}

          {/* Logout */}
          <button
            onClick={() => {
              setOpen(false);
              setShowLogoutDialog(true);
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left text-red-400 hover:bg-red-500/20 hover:text-red-300 mt-4"
          >
            <LogOut className="h-5 w-5" />
            <span className="font-medium">Logout</span>
          </button>
        </nav>
      </div>

      {/* Footer */}
      <div className="text-center py-6 text-sm text-white/40">
        © 2026 All Rights Reserved.
      </div>
    </div>
  );

  return (
    <>
      {/* Hamburger trigger button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        className="fixed top-4 left-4 z-50 bg-sidebar/90 backdrop-blur-sm text-white hover:bg-sidebar hover:text-white shadow-lg rounded-lg h-10 w-10"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Slide-in Sheet sidebar */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent 
          side="left" 
          className={cn(
            "w-64 p-0 border-r-0 bg-sidebar text-white",
            className
          )}
        >
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
          {sidebarContent}
        </SheetContent>
      </Sheet>

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

export default Sidebar;
