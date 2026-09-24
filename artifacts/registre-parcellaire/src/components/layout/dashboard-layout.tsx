import { ReactNode } from 'react';
import Sidebar from './sidebar';
import Topbar from './topbar';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="dashboard-shell fixed inset-0 flex overflow-hidden bg-background">
      <Sidebar />
      <div className="dashboard-content flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <Topbar />
        <main className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto bg-muted/30 p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
