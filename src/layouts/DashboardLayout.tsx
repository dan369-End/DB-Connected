import React from 'react';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { DashboardHeader } from '@/components/DashboardHeader';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  return (
    <div className="dashboard-root">
      <DashboardSidebar />
      <div className="dashboard-main-area">
        <DashboardHeader />
        <main className="dashboard-content-container">
          {children}
        </main>
      </div>
    </div>
  );
};
