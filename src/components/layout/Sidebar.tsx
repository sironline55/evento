'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  { href:'/',          key:'home',    label:'الرئيسية',  emoji:'🏠' },
  { href:'/events',    key:'cal',     label:'الفعاليات', emoji:'📅' },
  { href:'/attendees', key:'orders',  label:'الزوار',    emoji:'👥' },
  { href:'/scanner',   key:'scanner', label:'الماسح',    emoji:'📷' },
  { href:'/analytics', key:'chart',   label:'التقارير',  emoji:'📊' },
  { href:'/billing',   key:'finance', label:'المالية',   emoji:'💳' },
  { href:'/settings',  key:'gear',    label:'الإعدادات', emoji:'⚙️' },
  { href:'/staffing',  key:'staff',   label:'الكوادر',   emoji:'👷' },
]

const ICONS: Record<string,string> = {
  home:    'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z',
  cal:     'M19 4h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11zM7 11h5v5H7z',
  orders:  'M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z',
  scanner: 'M9.5 6.5v3h-3v-3h3M11 5H5v6h6V5zm-1.5 9.5v3h-3v-3h3M11 13H5v6h6v-6zm6.5-6.5v3h-3v-3h3M19 5h-6v6h6V5zm-6 8h1.5v1.5H13V13zm1.5 1.5H16V16h-1.5v-1.5zM16 13h1.5v1.5H16V13zm-3 3h1.5v1.5H13V16zm1.5 1.5H16V19h-1.5v-1.5zM16 16h1.5v1.5H16V16zm1.5-1.5H19V16h-1.5v-1.5zm0 3H19V19h-1.5v-1.5zM22 7h-2V4h-3V2h5v5zm0 15v-5h-2v3h-3v2h5zM2 22h5v-2H4v-3H2v5zM2 2v5h2V4h3V2H2z',
  chart:   'M5 9.2h3V19H5zM10.6 5h2.8v14h-2.8zm5.6 8H19v6h-2.8z',
  finance: 'M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z',
  gear:    'M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z',
  staff:   'M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z',
  help:    'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z',
}

function Icon({ name }: { name: string }) {
  const d = ICONS[name]
  if (!d) return null
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
      <path d={d}/>
    </svg>
  )
}

// Bottom nav items for mobile (most important 5)
const MOBILE_NAV = [
  { href:'/',          key:'home',    label:'الرئيسية' },
  { href:'/events',    key:'cal',     label:'الفعاليات' },
  { href:'/attendees', key:'orders',  label:'الزوار' },
  { href:'/scanner',   key:'scanner', label:'الماسح' },
  { href:'/analytics', key:'chart',   label:'التقارير' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  return (
    <>
      {/* ═══ DESKTOP: icon-only right sidebar ═══ */}
      <aside
        style={{
          position: 'fixed', right: 0, top: 0, height: '100%', width: 58,
          background: '#FFFFFF', borderLeft: '1px solid #DBDAE3',
          flexDirection: 'column', alignItems: 'center', zIndex: 40,
          paddingTop: 10, gap: 2, display: 'flex',
        }}
        className="hidden md:flex"
      >
        {/* Logo */}
        <Link href="/" style={{ textDecoration: 'none' }}>
          <div style={{
            width: 38, height: 38, background: '#F05537', borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 12, flexShrink: 0, color: '#fff',
            fontWeight: 900, fontSize: 15, letterSpacing: '-0.5px',
          }}>E</div>
        </Link>

        {NAV.map(({ href, key, label }) => {
          const on = isActive(href)
          return (
            <Link key={key} href={href} title={label} style={{
              width: 42, height: 42, display: 'flex', alignItems: 'center',
              justifyContent: 'center', borderRadius: 8, flexShrink: 0,
              color: on ? '#F05537' : '#6F7287',
              background: on ? '#FEF0ED' : 'transparent',
              textDecoration: 'none', transition: 'all 0.15s',
            }}>
              <Icon name={key} />
            </Link>
          )
        })}

        {/* Help */}
        <div style={{ marginTop: 'auto', paddingBottom: 14 }}>
          <Link href="/settings" title="الإعدادات" style={{
            width: 42, height: 42, display: 'flex', alignItems: 'center',
            justifyContent: 'center', color: '#6F7287', borderRadius: 8, textDecoration: 'none',
          }}>
            <Icon name="help" />
          </Link>
        </div>
      </aside>

      {/* ═══ MOBILE: bottom navigation bar ═══ */}
      <nav
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
          background: '#FFFFFF', borderTop: '2px solid #DBDAE3',
          display: 'flex', alignItems: 'stretch',
          paddingBottom: 'env(safe-area-inset-bottom, 4px)',
          boxShadow: '0 -2px 12px rgba(0,0,0,0.08)',
        }}
        className="flex md:hidden"
      >
        {MOBILE_NAV.map(({ href, key, label }) => {
          const on = isActive(href)
          return (
            <Link key={key} href={href} style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '10px 2px 8px',
              textDecoration: 'none',
              gap: 4,
              color: on ? '#F05537' : '#6F7287',
              background: on ? '#FEF0ED' : 'transparent',
              borderTop: on ? '2px solid #F05537' : '2px solid transparent',
              minHeight: 58,
            }}>
              <Icon name={key} />
              <span style={{
                fontSize: 10,
                fontWeight: on ? 700 : 500,
                color: on ? '#F05537' : '#6F7287',
                lineHeight: 1,
              }}>{label}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
