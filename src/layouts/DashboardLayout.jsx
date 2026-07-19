import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/dashboard/Sidebar";
import TopNav from "../components/dashboard/TopNav";
import { DashboardProvider, useDashboardContext } from "../context/DashboardContext";

/**
 * Inner layout that consumes dashboard context.
 * Separated so the Provider wraps the entire tree including Outlet children.
 */
const DashboardLayoutInner = () => {
  const { data, loading, error } = useDashboardContext();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center surface-subtle">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-4 border-violet-600 border-t-transparent animate-spin" />
          <p className="text-sm text-app-muted font-medium">Loading your dashboard…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center surface-subtle">
        <div className="text-center">
          <p className="text-app-2 font-semibold mb-1">Something went wrong</p>
          <p className="text-xs text-slate-400">{error}</p>
        </div>
      </div>
    );
  }

  const { user, dailyGoal, notifications } = data;

  return (
    <div className="flex min-h-screen surface-subtle font-inter relative">
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-30 lg:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Fixed Sidebar */}
      <div className={`fixed left-0 top-0 z-40 h-screen w-64 transform transition-transform duration-300 lg:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar user={user} dailyGoal={dailyGoal} onMenuClose={() => setIsMobileMenuOpen(false)} />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-64 w-full transition-all duration-300">
        {/* Top Navigation */}
        <TopNav user={user} notifications={notifications} onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />

        {/* Scrollable Page Content */}
        <main className="flex-1 overflow-x-hidden p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

/**
 * DashboardLayout
 *
 * Wraps all protected dashboard routes with the DashboardProvider,
 * making data available to the layout and every nested page.
 */
const DashboardLayout = () => (
  <DashboardProvider>
    <DashboardLayoutInner />
  </DashboardProvider>
);

export default DashboardLayout;
