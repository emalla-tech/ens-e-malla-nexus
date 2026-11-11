import { useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Header } from '../components/Header';
import { Sidebar } from '../components/Sidebar';
import { useWorkspace } from '../hooks/useWorkspace';
import { canViewModule, pathModule } from '../utils/permissions';
import { planIncludesModule } from '../data/planCatalog';

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { activeWorkspace, loading } = useWorkspace();
  const location = useLocation();

  if (!loading && activeWorkspace && !activeWorkspace.onboardingComplete && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }
  const routeModule = pathModule[location.pathname.split('/')[1]];
  if (!loading && activeWorkspace && routeModule && !canViewModule(activeWorkspace.role, routeModule)) {
    return <Navigate to="/" replace />;
  }
  const planIndependentModules = ['Dashboard', 'Notifications', 'Team', 'Settings', 'Billing'];
  if (!loading && activeWorkspace && routeModule && !planIndependentModules.includes(routeModule) && !planIncludesModule(activeWorkspace.plan, routeModule)) {
    return <Navigate to="/billing" replace />;
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
