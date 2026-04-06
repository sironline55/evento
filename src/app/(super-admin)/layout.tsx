export const dynamic = 'force-dynamic'
import { ReactNode } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface SuperAdminLayoutProps {
  children: ReactNode;
}

export default function SuperAdminLayout({ children }: SuperAdminLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex gap-8">
              <Link href="/super-admin/plans" className="text-gray-700 hover:text-gray-900 font-medium">
                إدارة الخطط
              </Link>
              <Link href="/super-admin/accounts" className="text-gray-700 hover:text-gray-900 font-medium">
                إدارة الحسابات
              </Link>
            </div>
            <Link href="/">
              <Button variant="outline">العودة للرئيسية</Button>
            </Link>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
