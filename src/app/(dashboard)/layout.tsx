import { ReactNode } from 'react';
import { Sidebar, MobileNav } from '@/components/Sidebar';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <MobileNav />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-4 md:ml-64">
          {children}
        </main>
      </div>
    </div>
  );
}