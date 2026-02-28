import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '@/components/Sidebar';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

const DashboardLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useIsMobile();

  const sidebarWidth = sidebarOpen ? (isMobile ? '14rem' : '16rem') : '0';

  return (
    <div className="min-h-screen bg-muted/30">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(prev => !prev)} />

      {/* Main content that shifts when sidebar opens */}
      <div
        className="transition-all duration-300 ease-in-out min-h-screen"
        style={{ marginLeft: sidebarWidth }}
      >
        {/* Top bar with hamburger */}
        <header className="sticky top-0 z-20 flex items-center h-12 sm:h-14 px-3 sm:px-4 bg-sidebar backdrop-blur-sm border-b border-sidebar-border">
          {!sidebarOpen && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(true)}
              className="text-sidebar-foreground hover:bg-sidebar-accent h-8 w-8 sm:h-9 sm:w-9"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
        </header>

        <main className="p-3 sm:p-6 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
