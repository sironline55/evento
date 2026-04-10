import Sidebar from '@/components/layout/Sidebar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', direction: 'rtl' }}>
      <Sidebar />
      <main style={{ marginRight: 200, minHeight: '100vh', paddingBottom: 32 }}>
        {children}
      </main>
    </div>
  )
}
