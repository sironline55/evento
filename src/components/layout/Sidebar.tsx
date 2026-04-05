'use client'
import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import NotificationBell from '@/components/NotificationBell'

const NAV = [
  { href:'/',          key:'home',    label:'الرئيسية'  },
  { href:'/events',    key:'cal',     label:'الفعاليات' },
  { href:'/attendees', key:'orders',  label:'الزوار'    },
  { href:'/scanner',   key:'scan',    label:'الماسح'    },
  { href:'/staffing',  key:'promote', label:'الكوادر'   },
  { href:'/analytics', key:'chart',   label:'التقارير'  },
  { href:'/billing',   key:'finance', label:'المالية'   },
  { href:'/settings',  key:'gear',    label:'الإعدادات' },
]

const ICONS: Record<string, React.ReactElement> = {
  home:    <svg width="21" height="21" viewBox="0 0 24 24" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>,
  cal:     <svg width="21" height="21" viewBox="0 0 24 24" fill="currentColor"><path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11zM7 11h5v5H7z"/></svg>,
  orders:  <svg width="21" height="21" viewBox="0 0 24 24" fill="currentColor"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>,
  scan:    <svg width="21" height="21" viewBox="0 0 24 24" fill="currentColor"><path d="M9.5 6.5v3h-3v-3h3M11 5H5v6h6V5zm-1.5 9.5v3h-3v-3h3M11 13H5v6h6v-6zm6.5-6.5v3h-3v-3h3M20 5h-6v6h6V5zm-6 8h1.5v1.5H14V13zm1.5 1.5H17V16h-1.5v-1.5zM17 13h1.5v1.5H17V13zm-3 3h1.5v1.5H14V16zm1.5 1.5H17V19h-1.5v-1.5zM17 16h1.5v1.5H17V16zm1.5-1.5H20V16h-1.5v-1.5zm0 3H20V19h-1.5v-1.5zM22 7h-2V4h-3V2h5v5zm0 15v-5h-2v3h-3v2h5zM2 22h5v-2H4v-3H2v5zM2 2v5h2V4h3V2H2z"/></svg>,
  promote: <svg width="21" height="21" viewBox="0 0 24 24" fill="currentColor"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>,
  chart:   <svg width="21" height="21" viewBox="0 0 24 24" fill="currentColor"><path d="M5 9.2h3V19H5zM10.6 5h2.8v14h-2.8zm5.6 8H19v6h-2.8z"/></svg>,
  finance: <svg width="21" height="21" viewBox="0 0 24 24" fill="currentColor"><path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/></svg>,
  gear:    <svg width="21" height="21" viewBox="0 0 24 24" fill="currentColor"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg>,
  help:    <svg width="21" height="21" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/></svg>,
}

export default function Sidebar() {
  const pathname = usePathname()
  const active = (href: string) => href === '/' ? pathname === '/' : pathname.startsWith(href)

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex" style={{
        position: 'fixed', right: 0, top: 0, height: '100%', width: 56,
        background: '#FFFFFF', borderLeft: '1px solid #DBDAE3',
        flexDirection: 'column', alignItems: 'center', zIndex: 40, paddingTop: 12, gap: 2
      }}>
        <Link href="/" style={{
          width: 36, height: 36, background: '#F05537', borderRadius: 6,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 10, flexShrink: 0, color: '#fff', fontWeight: 800,
          fontSize: 13, textDecoration: 'none'
        }}>E</Link>

        {NAV.map(({ href, key, label }) => {
          const on = active(href)
          return (
            <Link key={key} href={href} title={label} style={{
              width: 40, height: 40, display: 'flex', alignItems: 'center',
              justifyContent: 'center', borderRadius: 6, flexShrink: 0,
              color: on ? '#F05537' : '#6F7287',
              background: on ? '#FEF0ED' : 'transparent',
              textDecoration: 'none', transition: 'all 0.15s'
            }}>
              {ICONS[key]}
            </Link>
          )
        })}

        <div style={{ marginTop: 'auto', paddingBottom: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          {/* Notification Bell */}
          <NotificationBell />
          <Link href="#" title="مساعدة" style={{
            width: 40, height: 40, display: 'flex', alignItems: 'center',
            justifyContent: 'center', color: '#6F7287', borderRadius: 6, textDecoration: 'none'
          }}>
            {ICONS.help}
          </Link>
        </div>
      </aside>

      {/* ── Mobile bottom nav ── */}
      <nav className="flex md:hidden" style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
        background: '#FFFFFF', borderTop: '1px solid #DBDAE3',
        paddingBottom: 'env(safe-area-inset-bottom, 6px)',
        justifyContent: 'space-around'
      }}>
        {NAV.slice(0, 4).map(({ href, key, label }) => {
          const on = active(href)
          return (
            <Link key={key} href={href} style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              padding: '8px 2px 5px', textDecoration: 'none', gap: 2,
              color: on ? '#F05537' : '#6F7287', minWidth: 0
            }}>
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{ICONS[key]}</span>
              <span style={{ fontSize: 9, fontWeight: on ? 700 : 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 52, color: on ? '#F05537' : '#6F7287' }}>{label}</span>
            </Link>
          )
        })}
        {/* Notification bell on mobile */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '8px 2px 5px' }}>
          <NotificationBell />
          <span style={{ fontSize: 9, color: '#6F7287', marginTop: 2 }}>إشعارات</span>
        </div>
      </nav>
    </>
  )
}
