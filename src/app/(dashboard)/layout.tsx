'use client'
import Sidebar from '@/components/layout/Sidebar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f9fafb' }} dir="rtl">
      <Sidebar />
      <main style={{ flex: 1, marginRight: 240, padding: 0, minHeight: '100vh' }} className="md:mr-60">
        {children}
      </main>
    </div>
  )
}
