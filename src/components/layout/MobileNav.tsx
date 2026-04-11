'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const ORANGE = '#F05537'
const W = '#fff'
const D = 'rgba(255,255,255,0.5)'

/* Flat SVG icons — 24×24 viewport, 1.8 stroke */
const IcoCalendar = (c: string) => (
  <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
    <line x1="8"  y1="2"  x2="8"  y2="6"/>
    <line x1="16" y1="2"  x2="16" y2="6"/>
  </svg>
)

const IcoPeople = (c: string) => (
  <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="7" r="4"/>
    <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    <path d="M21 21v-2a4 4 0 0 0-3-3.85"/>
  </svg>
)

const IcoScan = (c: string) => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="4 8 4 4 8 4"/>
    <polyline points="16 4 20 4 20 8"/>
    <polyline points="20 16 20 20 16 20"/>
    <polyline points="8 20 4 20 4 16"/>
    <line x1="4" y1="12" x2="20" y2="12"/>
  </svg>
)

const IcoChart = (c: string) => (
  <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"/>
    <line x1="12" y1="20" x2="12" y2="4"/>
    <line x1="6"  y1="20" x2="6"  y2="14"/>
    <line x1="2"  y1="20" x2="22" y2="20"/>
  </svg>
)

const IcoGear = (c: string) => (
  <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M12 2v2m0 16v2M4.22 4.22l1.42 1.42m12.72 12.72 1.42 1.42M2 12h2m16 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
  </svg>
)

const TABS = [
  { href: '/events',    label: 'فعاليات', icon: IcoCalendar, center: false },
  { href: '/attendees', label: 'الحضور',  icon: IcoPeople,   center: false },
  { href: '/scanner',   label: 'مسح',     icon: IcoScan,     center: true  },
  { href: '/analytics', label: 'تقارير',  icon: IcoChart,    center: false },
  { href: '/settings',  label: 'إعدادات', icon: IcoGear,     center: false },
]

export default function MobileNav() {
  const path = usePathname()

  return (
    <>
      {/* Reserve space at bottom of page so content isn't hidden */}
      <div style={{ height: 64 }} />

      {/* ── Nav bar ── */}
      <div style={{
        position: 'fixed',
        bottom: 0, left: 0, right: 0,
        zIndex: 1000,
        /* orange bar */
        background: ORANGE,
        height: 56,
        /* extra padding for iOS home indicator */
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        /* subtle shadow upward */
        boxShadow: '0 -2px 12px rgba(200,60,20,0.25)',
      }}>

        {/* ── Row of 5 tabs ── */}
        <div style={{
          display: 'flex',
          height: 56,
          alignItems: 'center',
        }}>
          {TABS.map((tab) => {
            const active = path === tab.href || (tab.href !== '/' && path.startsWith(tab.href + '/'))

            if (tab.center) {
              /* ─── CENTRE SCANNER BUTTON ─── */
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    /* push circle up by 18 px above nav top */
                    justifyContent: 'flex-start',
                    paddingTop: 0,
                    textDecoration: 'none',
                    position: 'relative',
                  }}
                >
                  {/* Raised circle */}
                  <div style={{
                    marginTop: -18,          /* half of (circle - bar overlap) */
                    width: 52,
                    height: 52,
                    borderRadius: '50%',
                    background: active
                      ? 'rgba(255,255,255,0.28)'
                      : 'rgba(255,255,255,0.18)',
                    border: `2px solid rgba(255,255,255,${active ? 0.75 : 0.45})`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 3px 10px rgba(0,0,0,0.18)',
                    flexShrink: 0,
                  }}>
                    {tab.icon(active ? W : D)}
                  </div>
                  {/* Label below circle inside bar */}
                  <span style={{
                    fontSize: 9,
                    fontWeight: active ? 700 : 500,
                    color: active ? W : D,
                    fontFamily: 'Tajawal, sans-serif',
                    marginTop: 2,
                    lineHeight: 1,
                  }}>
                    {tab.label}
                  </span>
                </Link>
              )
            }

            /* ─── REGULAR TAB ─── */
            return (
              <Link
                key={tab.href}
                href={tab.href}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 3,
                  textDecoration: 'none',
                  height: '100%',
                  position: 'relative',
                }}
              >
                {/* Active top-line indicator */}
                {active && (
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    width: 24,
                    height: 3,
                    background: W,
                    borderRadius: '0 0 4px 4px',
                  }} />
                )}

                {tab.icon(active ? W : D)}

                <span style={{
                  fontSize: 10,
                  fontWeight: active ? 700 : 500,
                  color: active ? W : D,
                  fontFamily: 'Tajawal, sans-serif',
                  lineHeight: 1,
                }}>
                  {tab.label}
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </>
  )
}
