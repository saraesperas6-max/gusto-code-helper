import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '@/components/Sidebar';

const DashboardLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-muted/30">
      <Sidebar />
      <main className="ml-64 p-6">
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout;
