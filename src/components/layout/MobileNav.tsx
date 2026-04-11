'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

// Flat line SVG icons — white, 24px
const Icons = {
  events: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8"  y1="2" x2="8"  y2="6"/>
      <line x1="3"  y1="10" x2="21" y2="10"/>
      <line x1="8"  y1="15" x2="8"  y2="15" strokeWidth="2.5"/>
      <line x1="12" y1="15" x2="12" y2="15" strokeWidth="2.5"/>
      <line x1="16" y1="15" x2="16" y2="15" strokeWidth="2.5"/>
    </svg>
  ),
  attendees: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9"  cy="7"  r="4"/>
      <circle cx="17" cy="8"  r="3"/>
      <path d="M1 21v-1a7 7 0 0 1 14 0v1"/>
      <path d="M16 15a4 4 0 0 1 6 0v1h-6"/>
    </svg>
  ),
  scanner: (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="4 8 4 4 8 4"/>
      <polyline points="16 4 20 4 20 8"/>
      <polyline points="20 16 20 20 16 20"/>
      <polyline points="8 20 4 20 4 16"/>
      <rect x="9" y="9" width="6" height="6" rx="1"/>
      <line x1="3" y1="12" x2="21" y2="12" strokeWidth="1.2" strokeDasharray="2 2"/>
    </svg>
  ),
  analytics: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/>
      <line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6"  y1="20" x2="6"  y2="14"/>
      <line x1="2"  y1="20" x2="22" y2="20"/>
    </svg>
  ),
  settings: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
}

const TABS = [
  { href:'/events',    icon: Icons.events,    label:'فعاليات',  key:'events'    },
  { href:'/attendees', icon: Icons.attendees, label:'الحضور',   key:'attendees' },
  { href:'/scanner',   icon: Icons.scanner,   label:'مسح',      key:'scanner'   },
  { href:'/analytics', icon: Icons.analytics, label:'تقارير',   key:'analytics' },
  { href:'/settings',  icon: Icons.settings,  label:'إعدادات',  key:'settings'  },
]

export default function MobileNav() {
  const path = usePathname()

  return (
    <>
      {/* Bottom spacer so content doesn't hide behind nav */}
      <div style={{ height: 72 }} />

      <nav
          style={{
          position:   'fixed',
          bottom:     0,
          left:       0,
          right:      0,
          zIndex:     100,
          background: '#F05537',
          display:    'flex',
          alignItems: 'stretch',
          height:     60,
          paddingBottom: 'env(safe-area-inset-bottom)',
          boxShadow:  '0 -4px 20px rgba(240,85,55,0.35)',
        }}
      >
        {TABS.map(tab => {
          const active = path.startsWith(tab.href)
          const isScanner = tab.key === 'scanner'

          return (
            <Link
              key={tab.href}
              href={tab.href}
              style={{
                flex:           1,
                display:        'flex',
                flexDirection:  'column',
                alignItems:     'center',
                justifyContent: 'center',
                gap:            3,
                textDecoration: 'none',
                padding:        '4px 0',
                position:       'relative',
                background:     isScanner && active ? 'rgba(255,255,255,.18)' : 'transparent',
                transition:     'background .15s',
              }}
            >
              {/* Active top bar */}
              {active && !isScanner && (
                <div style={{
                  position:     'absolute',
                  top:          0,
                  left:         '20%',
                  right:        '20%',
                  height:       3,
                  background:   '#fff',
                  borderRadius: '0 0 4px 4px',
                }}/>
              )}

              {/* Scanner gets a raised white circle background */}
              {isScanner ? (
                <div style={{
                  width:        46,
                  height:       46,
                  borderRadius: '50%',
                  background:   active ? 'rgba(255,255,255,.25)' : 'rgba(255,255,255,.15)',
                  border:       '1.5px solid rgba(255,255,255,.5)',
                  display:      'flex',
                  alignItems:   'center',
                  justifyContent:'center',
                  marginTop:    -14,
                  color:        '#fff',
                  boxShadow:    active ? '0 4px 16px rgba(0,0,0,.2)' : 'none',
                  transition:   'all .2s',
                }}>
                  {tab.icon}
                </div>
              ) : (
                <span style={{
                  color:    '#fff',
                  opacity:  active ? 1 : 0.65,
                  display:  'flex',
                  transition: 'opacity .15s',
                }}>
                  {tab.icon}
                </span>
              )}

              <span style={{
                fontSize:   10,
                fontWeight: active ? 700 : 500,
                color:      '#fff',
                opacity:    active ? 1 : 0.65,
                fontFamily: 'Tajawal,sans-serif',
                lineHeight: 1,
                transition: 'opacity .15s',
              }}>
                {tab.label}
              </span>
            </Link>
          )
        })}
      </nav>
    </>
    </div>
    </div>
  )
}
