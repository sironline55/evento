'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const C = { primary:'#F47D31', navy:'#1C1C3B', muted:'rgba(255,255,255,0.45)', activeMuted:'rgba(255,255,255,0.9)', border:'rgba(255,255,255,0.07)' }

const nav = [
  { href:'/events', label:'الفعاليات', icon:'📅' },
  { href:'/attendees', label:'الزوار', icon:'👥' },
  { href:'/scanner', label:'الماسح', icon:'📷' },
  { href:'/staffing', label:'الكوادر', icon:'🤝' },
  { href:'/settings', label:'الإعدادات', icon:'⚙️' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const active = (href: string) => href !== '/' && pathname.startsWith(href)

  return (
    <>
      {/* ====== Desktop Sidebar ====== */}
      <aside style={{
        position:'fixed', right:0, top:0, height:'100%', width:220,
        background:C.navy, zIndex:40, direction:'rtl',
        display:'flex', flexDirection:'column',
        boxShadow:'-4px 0 32px rgba(0,0,0,0.15)'
      }} className="hidden md:flex">

        {/* Logo */}
        <div style={{ padding:'24px 18px 20px', borderBottom:`1px solid ${C.border}` }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:38, height:38, background:C.primary, borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>🎪</div>
            <div>
              <p style={{ fontSize:15, fontWeight:700, color:'#fff', margin:0, lineHeight:1.2 }}>EventVMS</p>
              <p style={{ fontSize:10, color:'rgba(255,255,255,0.35)', margin:'3px 0 0' }}>نظام إدارة الفعاليات</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ padding:'10px 10px', flex:1, display:'flex', flexDirection:'column', gap:2 }}>
          {nav.map(({ href, label, icon }) => {
            const isActive = active(href)
            return (
              <Link key={href} href={href} style={{
                display:'flex', alignItems:'center', gap:11,
                padding:'11px 13px', borderRadius:12, textDecoration:'none',
                background: isActive ? C.primary : 'transparent',
                color: isActive ? '#fff' : C.muted,
                fontWeight: isActive ? 600 : 400, fontSize:14,
                transition:'all 0.2s'
              }}>
                <span style={{ fontSize:18 }}>{icon}</span>
                {label}
              </Link>
            )
          })}
        </nav>

        {/* CTA */}
        <div style={{ padding:'14px 10px' }}>
          <Link href="/events/new" style={{
            display:'flex', alignItems:'center', justifyContent:'center', gap:6,
            padding:'12px', borderRadius:50, textDecoration:'none',
            background:C.primary, color:'#fff', fontWeight:700, fontSize:14,
            boxShadow:'0 4px 16px rgba(244,125,49,0.4)'
          }}>＋ فعالية جديدة</Link>
        </div>
      </aside>

      {/* ====== Mobile Bottom Navigation ====== */}
      <nav style={{
        position:'fixed', bottom:0, left:0, right:0, zIndex:50,
        background:'#fff', borderTop:'1px solid #F0EDE8',
        display:'flex', direction:'rtl',
        paddingBottom:'env(safe-area-inset-bottom,6px)',
        boxShadow:'0 -4px 20px rgba(0,0,0,0.07)'
      }} className="flex md:hidden">
        {nav.map(({ href, label, icon }) => {
          const isActive = active(href)
          return (
            <Link key={href} href={href} style={{
              flex:1, display:'flex', flexDirection:'column',
              alignItems:'center', justifyContent:'center',
              padding:'9px 4px 6px', textDecoration:'none', gap:2
            }}>
              {href === '/scanner' ? (
                <div style={{
                  width:48, height:48, borderRadius:50,
                  background: isActive ? '#1C1C3B' : C.primary,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:22, marginTop:-20,
                  boxShadow:'0 4px 16px rgba(244,125,49,0.4)'
                }}>{icon}</div>
              ) : (
                <span style={{ fontSize:22, lineHeight:1 }}>{icon}</span>
              )}
              {href !== '/scanner' && (
                <span style={{ fontSize:10, fontWeight:isActive?700:400, color:isActive?C.primary:'#8B8FA8' }}>{label}</span>
              )}
              {isActive && href !== '/scanner' && (
                <div style={{ width:4, height:4, borderRadius:'50%', background:C.primary }} />
              )}
            </Link>
          )
        })}
      </nav>
    </>
  )
}
