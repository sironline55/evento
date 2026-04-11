'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const ORANGE = '#F05537'
const WHITE  = '#FFFFFF'
const DIM    = 'rgba(255,255,255,0.55)'

/* ── Crisp flat SVG icons ── */
function IcoEvents({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke={active ? WHITE : DIM} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8"  y1="2" x2="8"  y2="6"/>
      <line x1="3"  y1="10" x2="21" y2="10"/>
    </svg>
  )
}

function IcoAttendees({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke={active ? WHITE : DIM} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  )
}

function IcoScanner({ active }: { active: boolean }) {
  const c = active ? WHITE : DIM
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
      stroke={c} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      {/* corner frames */}
      <path d="M3 9V5a2 2 0 0 1 2-2h4"/>
      <path d="M15 3h4a2 2 0 0 1 2 2v4"/>
      <path d="M21 15v4a2 2 0 0 1-2 2h-4"/>
      <path d="M9 21H5a2 2 0 0 1-2-2v-4"/>
      {/* scan line */}
      <line x1="3" y1="12" x2="21" y2="12" strokeDasharray="3 2" strokeWidth="1.5"/>
    </svg>
  )
}

function IcoAnalytics({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke={active ? WHITE : DIM} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/>
      <line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6"  y1="20" x2="6"  y2="14"/>
      <line x1="2"  y1="20" x2="22" y2="20"/>
    </svg>
  )
}

function IcoSettings({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke={active ? WHITE : DIM} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33
        1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33
        l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4
        h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06
        A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51
        1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9
        a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  )
}

const TABS = [
  { href: '/events',    label: 'فعاليات', Icon: IcoEvents    },
  { href: '/attendees', label: 'الحضور',  Icon: IcoAttendees },
  { href: '/scanner',   label: 'مسح',     Icon: IcoScanner   },
  { href: '/analytics', label: 'تقارير',  Icon: IcoAnalytics },
  { href: '/settings',  label: 'إعدادات', Icon: IcoSettings  },
]

const NAV_H  = 58   // px — nav bar height
const BUMP_H = 64   // px — scanner button height

export default function MobileNav() {
  const path = usePathname()

  return (
    <>
      {/* Spacer so page content isn't hidden behind nav */}
      <div style={{ height: NAV_H + 16 }} />

      <nav style={{
        position:   'fixed',
        bottom:     0,
        left:       0,
        right:      0,
        zIndex:     999,
        background: ORANGE,
        height:     NAV_H,
        display:    'flex',
        alignItems: 'stretch',
        /* iOS safe area */
        paddingBottom: 'env(safe-area-inset-bottom)',
        boxShadow:  '0 -2px 16px rgba(240,85,55,0.30)',
      }}>

        {TABS.map((tab) => {
          const active  = path === tab.href || path.startsWith(tab.href + '/')
          const isCenter = tab.href === '/scanner'

          return (
            <Link
              key={tab.href}
              href={tab.href}
              style={{
                flex:            1,
                display:         'flex',
                flexDirection:   'column',
                alignItems:      'center',
                justifyContent:  isCenter ? 'flex-start' : 'center',
                gap:             4,
                textDecoration:  'none',
                padding:         isCenter ? '0' : '10px 4px',
                position:        'relative',
                /* prevent clipping */
                overflow:        'visible',
                minWidth:        0,
              }}
            >
              {/* Active indicator — top bar */}
              {active && !isCenter && (
                <span style={{
                  position:     'absolute',
                  top:          0,
                  left:         '50%',
                  transform:    'translateX(-50%)',
                  width:        28,
                  height:       3,
                  background:   WHITE,
                  borderRadius: '0 0 3px 3px',
                  display:      'block',
                }}/>
              )}

              {isCenter ? (
                /* ── Center scanner button — raised circle ── */
                <span style={{
                  display:         'flex',
                  alignItems:      'center',
                  justifyContent:  'center',
                  width:           BUMP_H,
                  height:          BUMP_H,
                  borderRadius:    '50%',
                  background:      active
                                     ? 'rgba(255,255,255,0.28)'
                                     : 'rgba(255,255,255,0.18)',
                  border:          `2px solid rgba(255,255,255,${active ? '0.7' : '0.45'})`,
                  marginTop:       -(BUMP_H / 2 + 4),
                  boxShadow:       active
                                     ? '0 4px 20px rgba(0,0,0,0.18)'
                                     : '0 2px 12px rgba(0,0,0,0.12)',
                  flexShrink:      0,
                  transition:      'all 0.2s ease',
                }}>
                  <tab.Icon active={active}/>
                </span>
              ) : (
                <tab.Icon active={active}/>
              )}

              <span style={{
                fontSize:    10,
                lineHeight:  1,
                fontWeight:  active ? 700 : 500,
                color:       active ? WHITE : DIM,
                fontFamily:  'Tajawal, sans-serif',
                letterSpacing: 0,
                marginTop:   isCenter ? 6 : 0,
              }}>
                {tab.label}
              </span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
