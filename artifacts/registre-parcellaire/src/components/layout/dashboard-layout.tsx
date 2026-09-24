import { ReactNode } from 'react';
import Sidebar from './sidebar';
import Topbar from './topbar';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="dashboard-shell flex h-[100dvh] w-full overflow-hidden bg-background">
      <Sidebar />
      <div className="dashboard-content flex flex-1 flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-auto bg-muted/30 p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
