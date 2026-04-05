'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

const sb = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
const C = { navy:'#1E0A3C', orange:'#F05537', muted:'#6F7287', border:'#DBDAE3', card:'#FFFFFF' }
const NAV = [
  { href:'/staff',         label:'الرئيسية',   icon:'🏠' },
  { href:'/staff/scanner', label:'الماسح',     icon:'📷' },
  { href:'/staff/checkin', label:'الاستقبال',  icon:'👋' },
  { href:'/staff/crowd',   label:'الحشود',     icon:'👥' },
  { href:'/staff/parking', label:'الباركينغ', icon:'🚗' },
  { href:'/staff/profile', label:'ملفي',       icon:'👤' },
]

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [worker, setWorker] = useState<any>(null)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    if (pathname === '/staff/login') { setChecked(true); return }
    sb.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push('/staff/login'); return }
      const { data: w } = await sb.from('worker_profiles').select('*').eq('user_id', data.user.id).single()
      if (!w) { router.push('/staff/login'); return }
      setWorker(w)
      setChecked(true)
    })
  }, [pathname])

  if (pathname === '/staff/login') return <>{children}</>
  if (!checked) return <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', color:C.muted }}>...</div>

  const active = (href: string) => href === '/staff' ? pathname === '/staff' : pathname.startsWith(href)

  return (
    <div style={{ minHeight:'100vh', background:'#FAFAFA', direction:'rtl' }}>
      <div style={{ background:C.navy, padding:'10px 16px', display:'flex', justifyContent:'space-between', alignItems:'center', position:'sticky', top:0, zIndex:40 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:30, height:30, background:C.orange, borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:800, fontSize:13 }}>E</div>
          <p style={{ color:'rgba(255,255,255,0.8)', fontWeight:700, fontSize:12, margin:0 }}>EventVMS — بوابة الكوادر</p>
        </div>
        {worker && (
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <p style={{ color:'rgba(255,255,255,0.8)', fontSize:12, margin:0 }}>{worker.full_name}</p>
            <div style={{ width:28, height:28, background:C.orange, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:800, fontSize:12 }}>
              {worker.full_name?.[0]||'?'}
            </div>
          </div>
        )}
      </div>

      <main style={{ paddingBottom:70 }}>{children}</main>

      <nav style={{ position:'fixed', bottom:0, left:0, right:0, background:C.card, borderTop:`1px solid ${C.border}`, display:'flex', zIndex:50, paddingBottom:'env(safe-area-inset-bottom,4px)' }}>
        {NAV.map(n => {
          const on = active(n.href)
          return (
            <Link key={n.href} href={n.href} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'8px 2px 5px', textDecoration:'none', gap:2, color:on?C.orange:C.muted }}>
              <span style={{ fontSize:18 }}>{n.icon}</span>
              <span style={{ fontSize:9, fontWeight:on?700:400, whiteSpace:'nowrap' }}>{n.label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
