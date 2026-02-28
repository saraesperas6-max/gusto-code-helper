import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '@/components/Sidebar';

const DashboardLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-muted/30">
      <Sidebar />
      <main className="p-6 pt-16">
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout;
