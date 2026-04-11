import Sidebar from '@/components/layout/Sidebar'
import MobileNav from '@/components/layout/MobileNav'
import PWAInstaller from '@/components/pwa/PWAInstaller'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', background: '#F9F8FC', direction: 'rtl' }}>

      {/* Desktop sidebar — hidden on mobile */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Main content */}
      <main style={{ minHeight: '100vh', paddingBottom: 32 }} className="md:mr-[200px]">
        {children}
      </main>

      {/* Mobile bottom nav — hidden on desktop */}
      <MobileNav />

      {/* PWA install prompt */}
      <PWAInstaller />
    </div>
  )
}
