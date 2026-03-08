import { ReactNode } from 'react';
import { AppSidebar } from './AppSidebar';
import { NotificationBell } from './NotificationBell';

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <main className="flex-1 lg:ml-[240px] transition-all duration-200">
        <div className="fixed top-4 right-4 z-50">
          <NotificationBell />
        </div>
        <div className="max-w-7xl mx-auto p-4 pt-16 lg:pt-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
