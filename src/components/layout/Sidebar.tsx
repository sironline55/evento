'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  { href:'/events', key:'home',     label:'الرئيسية' },
  { href:'/events', key:'cal',      label:'الفعاليات' },
  { href:'/attendees', key:'orders', label:'الزوار' },
  { href:'/staffing',  key:'promote',label:'الكوادر' },
  { href:'/analytics', key:'chart',  label:'التقارير' },
  { href:'/billing',   key:'finance', label:'المالية' },
  { href:'/settings',  key:'gear',    label:'الإعدادات' },
]

function Icon({ name }: { name: string }) {
  const icons: Record<string,string> = {
    home:    'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z',
    cal:     'M19 4h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11zM7 11h5v5H7z',
    orders:  'M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11zM8 15h8v2H8zm0-4h8v2H8z',
    promote: 'M3.5 18.5l6-6 4 4L22 6.92 20.59 5.5l-7.09 8.58-4-4L2 17z',
    chart:   'M5 9.2h3V19H5zM10.6 5h2.8v14h-2.8zm5.6 8H19v6h-2.8z',
    finance: 'M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z',
    gear:    'M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z',
    help:    'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z',
  }
  const d = icons[name]
  return d ? (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d={d}/>
    </svg>
  ) : null
}

export default function Sidebar() {
  const pathname = usePathname()
  const active = (href: string) =>
    href !== '/' && pathname.startsWith(href)

  return (
    <>
      {/* Desktop: icon-only sidebar, Eventbrite-style */}
      <aside className="hidden md:flex" style={{
        position: 'fixed', right: 0, top: 0, height: '100%', width: 56,
        background: '#FFFFFF', borderLeft: '1px solid #DBDAE3',
        flexDirection: 'column', alignItems: 'center', zIndex: 40,
        paddingTop: 12, gap: 2
      }}>
        {/* Logo */}
        <div style={{
          width: 36, height: 36, background: '#F05537', borderRadius: 6,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, marginBottom: 14, flexShrink: 0, color: '#fff',
          fontWeight: 800, fontSize: 13
        }}>E</div>

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
              <Icon name={key} />
            </Link>
          )
        })}

        {/* Bottom help */}
        <div style={{ marginTop: 'auto', paddingBottom: 12 }}>
          <Link href="#" title="مساعدة" style={{
            width: 40, height: 40, display: 'flex', alignItems: 'center',
            justifyContent: 'center', color: '#6F7287', borderRadius: 6, textDecoration: 'none'
          }}>
            <Icon name="help" />
          </Link>
        </div>
      </aside>

      {/* Mobile: bottom nav */}
      <nav className="flex md:hidden" style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
        background: '#FFFFFF', borderTop: '1px solid #DBDAE3',
        paddingBottom: 'env(safe-area-inset-bottom,6px)'
      }}>
        {NAV.slice(0, 5).map(({ href, key, label }) => {
          const on = active(href)
          return (
            <Link key={key} href={href} style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              padding: '8px 4px 5px', textDecoration: 'none', gap: 3,
              color: on ? '#F05537' : '#6F7287'
            }}>
              <Icon name={key} />
              <span style={{ fontSize: 9, fontWeight: on ? 700 : 400 }}>{label}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
