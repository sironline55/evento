'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
  { href:'/events',    icon:'📅', label:'فعاليات' },
  { href:'/attendees', icon:'👥', label:'الحضور'  },
  { href:'/scanner',   icon:'📷', label:'مسح'     },
  { href:'/analytics', icon:'📊', label:'تقارير'  },
  { href:'/settings',  icon:'⚙️', label:'الإعدادات'},
]

export default function MobileNav() {
  const path = usePathname()

  return (
    <>
      {/* Safe area spacer */}
      <div style={{ height: 70 }} className="md:hidden"/>

      <nav style={{
        position:'fixed', bottom:0, left:0, right:0, zIndex:100,
        background:'rgba(30,10,60,0.97)',
        backdropFilter:'blur(16px)',
        borderTop:'1px solid rgba(255,255,255,.12)',
        display:'flex', alignItems:'stretch',
        paddingBottom:'env(safe-area-inset-bottom)',
        height: 60,
      }} className="md:hidden">
        {TABS.map(tab => {
          const active = path.startsWith(tab.href)
          return (
            <Link key={tab.href} href={tab.href} style={{
              flex:1, display:'flex', flexDirection:'column',
              alignItems:'center', justifyContent:'center',
              gap:3, textDecoration:'none', padding:'4px 0',
              position:'relative',
            }}>
              {active && (
                <div style={{
                  position:'absolute', top:0, left:'25%', right:'25%',
                  height:3, background:'#F05537', borderRadius:'0 0 3px 3px'
                }}/>
              )}
              <span style={{
                fontSize: tab.href==='/scanner' ? 26 : 22,
                filter: active ? 'none' : 'grayscale(0.4) brightness(0.6)',
                transition:'all .2s'
              }}>
                {tab.href === '/scanner'
                  ? <ScannerIcon active={active}/>
                  : tab.icon
                }
              </span>
              <span style={{
                fontSize:10, fontWeight: active ? 700 : 400,
                color: active ? '#F05537' : 'rgba(255,255,255,.5)',
                fontFamily:'Tajawal,sans-serif', lineHeight:1
              }}>{tab.label}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}

function ScannerIcon({ active }: { active: boolean }) {
  return (
    <div style={{
      width:48, height:48, borderRadius:'50%',
      background: active ? '#F05537' : 'rgba(240,85,55,0.25)',
      border:'2px solid ' + (active ? '#F05537' : 'rgba(240,85,55,0.5)'),
      display:'flex', alignItems:'center', justifyContent:'center',
      marginTop:-14, boxShadow: active ? '0 4px 16px rgba(240,85,55,0.4)' : 'none',
      transition:'all .2s', fontSize:22
    }}>📷</div>
  )
}
