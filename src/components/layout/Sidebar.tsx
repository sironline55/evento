'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  { href:'/events', key:'home', label:'الرئيسية' },
  { href:'/events', key:'cal', label:'الفعاليات' },
  { href:'/attendees', key:'orders', label:'الزوار' },
  { href:'/staffing', key:'promote', label:'الكوادر' },
  { href:'/analytics', key:'analytics', label:'التقارير' },
  { href:'/billing', key:'finance', label:'المالية' },
  { href:'/settings', key:'settings', label:'الإعدادات' },
]

const ICONS: Record<string,string> = {
  home:     '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
  cal:      '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
  orders:   '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',
  promote:  '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>',
  analytics:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
  finance:  '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
  settings: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
  help:     '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
}

function NavIcon({ k, svg }: { k: string; svg: string }) {
  return <span dangerouslySetInnerHTML={{ __html: svg }} style={{ display:'flex', alignItems:'center', justifyContent:'center' }} />
}

export default function Sidebar() {
  const pathname = usePathname()
  const active = (href: string) => pathname === href || (href !== '/' && pathname.startsWith(href))

  return (
    <>
      {/* Desktop — icon only sidebar, 56px wide */}
      <aside className="hidden md:flex" style={{ position:'fixed', right:0, top:0, height:'100%', width:56, background:'#FFFFFF', borderLeft:'1px solid #DBDAE3', flexDirection:'column', alignItems:'center', zIndex:40, paddingTop:12 }}>
        {/* Logo */}
        <div style={{ width:36, height:36, background:'#F05537', borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, marginBottom:16, flexShrink:0 }}>🎪</div>

        {NAV.map(({ href, key, label }) => {
          const on = active(href)
          return (
            <Link key={key+href} href={href} title={label} style={{ width:40, height:40, display:'flex', alignItems:'center', justifyContent:'center', borderRadius:6, marginBottom:2, color: on ? '#F05537' : '#6F7287', background: on ? '#FEF0ED' : 'transparent', textDecoration:'none', transition:'all 0.15s', flexShrink:0 }}>
              <NavIcon k={key} svg={ICONS[key] || ICONS.home} />
            </Link>
          )
        })}

        <div style={{ marginTop:'auto', paddingBottom:16, display:'flex', flexDirection:'column', gap:2 }}>
          <Link href="#" title="مساعدة" style={{ width:40, height:40, display:'flex', alignItems:'center', justifyContent:'center', color:'#6F7287', borderRadius:6, textDecoration:'none' }}>
            <NavIcon k="help" svg={ICONS.help} />
          </Link>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="flex md:hidden" style={{ position:'fixed', bottom:0, left:0, right:0, zIndex:50, background:'#FFFFFF', borderTop:'1px solid #DBDAE3', paddingBottom:'env(safe-area-inset-bottom,6px)' }}>
        {NAV.slice(0,5).map(({ href, key, label }) => {
          const on = active(href)
          return (
            <Link key={key} href={href} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'8px 4px 6px', textDecoration:'none', gap:3, color: on ? '#F05537' : '#6F7287' }}>
              <NavIcon k={key} svg={ICONS[key]} />
              <span style={{ fontSize:9, fontWeight: on ? 600 : 400 }}>{label}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
