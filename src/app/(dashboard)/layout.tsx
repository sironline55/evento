'use client'
import React from 'react'
import Sidebar from '@/components/layout/Sidebar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#FAFAFA' }} dir="rtl">
      <Sidebar />
      <main
        className="md:mr-[56px] mr-0 pb-[62px] md:pb-0"
        style={{ flex: 1, minHeight: '100vh' }}
      >
        {children}
      </main>
    </div>
  )
}
