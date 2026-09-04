import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AuthPage } from '@/pages/AuthPage';
import { Dashboard } from '@/pages/Dashboard';
import { Navbar } from '@/components/layout/Navbar';
import { CompleteProfileModal } from '@/components/modals/CompleteProfileModal';
import { Spin } from 'antd';

export const App: React.FC = () => {
  const { user, isAuthenticated, isProfileComplete, isLoading } = useAuth();

  // Only show loading screen if loading AND we have no user in memory
  if (isLoading && !user) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-center space-y-3">
          <Spin size="large" />
          <p className="text-xs font-bold text-slate-600 font-mono tracking-wider">
            MEMUAT KELOMPOKIN...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <AuthPage />;
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col">
      <Navbar />

      <main className="flex-1">
        <Dashboard />
      </main>

      {/* Mandatory Profile Completion Modal for users missing identifier */}
      <CompleteProfileModal open={!isProfileComplete} />
    </div>
  );
};
