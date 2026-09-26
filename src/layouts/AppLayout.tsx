import { useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Header } from '../components/Header';
import { Sidebar } from '../components/Sidebar';
import { useWorkspace } from '../hooks/useWorkspace';

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { activeWorkspace, loading } = useWorkspace();
  const location = useLocation();

  if (!loading && activeWorkspace && !activeWorkspace.onboardingComplete && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  return (
    <div className="min-h-screen lg:flex">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="min-w-0 flex-1">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="mx-auto w-full max-w-7xl px-4 py-6 print:max-w-none print:p-0 md:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
