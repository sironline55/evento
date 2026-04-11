'use client'
import { useEffect, useState } from 'react'
import Sidebar from '@/components/layout/Sidebar'
import MobileNav from '@/components/layout/MobileNav'
import PWAInstaller from '@/components/pwa/PWAInstaller'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: '#F9F8FC', direction: 'rtl' }}>

      {/* Desktop sidebar */}
      {!isMobile && <Sidebar />}

      {/* Main content */}
      <main style={{
        minHeight: '100vh',
        paddingBottom: 32,
        marginRight: isMobile ? 0 : 200,
        transition: 'margin-right .2s'
      }}>
        {children}
      </main>

      {/* Mobile bottom nav */}
      {isMobile && <MobileNav />}

      {/* PWA install prompt */}
      <PWAInstaller />
    </div>
  )
}
