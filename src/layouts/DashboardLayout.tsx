import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '@/components/Sidebar';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';

const DashboardLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-muted/30">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(prev => !prev)} />

      {/* Main content that shifts when sidebar opens */}
      <div
        className="transition-all duration-300 ease-in-out min-h-screen"
        style={{ marginLeft: sidebarOpen ? '16rem' : '0' }}
      >
        {/* Top bar with hamburger */}
        <header className="sticky top-0 z-20 flex items-center h-14 px-4 bg-sidebar backdrop-blur-sm border-b border-sidebar-border">
          {!sidebarOpen && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(true)}
              className="text-sidebar-foreground hover:bg-sidebar-accent h-9 w-9"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
        </header>

        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
