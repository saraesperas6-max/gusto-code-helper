import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  BarChart3, 
  LogOut 
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import logo from '@/assets/logo.png';
import { cn } from '@/lib/utils';

interface SidebarProps {
  className?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ className }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/dashboard/requests', icon: FileText, label: 'Requests' },
    { path: '/dashboard/residents', icon: Users, label: 'Residents' },
    { path: '/dashboard/reports', icon: BarChart3, label: 'Reports' },
  ];

  return (
    <aside className={cn(
      "w-64 bg-secondary text-secondary-foreground h-screen fixed left-0 top-0 flex flex-col",
      className
    )}>
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
          <h1 className="text-lg font-semibold">Palma-Urbano</h1>
        </div>

        {/* Navigation */}
        <nav className="px-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left",
                  isActive 
                    ? "bg-primary text-primary-foreground" 
                    : "hover:bg-sidebar-accent"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left text-warning hover:bg-destructive hover:text-destructive-foreground mt-4"
          >
            <LogOut className="h-5 w-5" />
            <span className="font-medium">Logout</span>
          </button>
        </nav>
      </div>

      {/* Footer */}
      <div className="text-center py-6 text-sm opacity-60">
        © 2026 All Rights Reserved.
      </div>
    </aside>
  );
};

export default Sidebar;
