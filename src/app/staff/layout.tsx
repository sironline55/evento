'use client'
import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

const sb = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
const C = { navy:'#1E0A3C', orange:'#F05537', muted:'#6F7287', border:'#DBDAE3', card:'#FFFFFF', bg:'#FAFAFA' }

const NAV = [
  { href:'/staff',          label:'الرئيسية',    icon:'🏠', key:'home' },
  { href:'/staff/scanner',  label:'الماسح',      icon:'📷', key:'scan' },
  { href:'/staff/checkin',  label:'الاستقبال',   icon:'👋', key:'check' },
  { href:'/staff/crowd',    label:'الحشود',      icon:'👥', key:'crowd' },
  { href:'/staff/parking',  label:'الباركينغ',  icon:'🚗', key:'park' },
  { href:'/staff/profile',  label:'ملفي',        icon:'👤', key:'prof' },
]

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [worker, setWorker] = useState<any>(null)

  useEffect(() => {
    sb.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push('/staff/login'); return }
      const { data: w } = await sb.from('worker_profiles').select('*').eq('user_id', data.user.id).single()
      if (!w) { router.push('/staff/login'); return }
      setWorker(w)
    })
  }, [])

  if (pathname === '/staff/login') return <>{children}</>

  const active = (href: string) => href === '/staff' ? pathname === '/staff' : pathname.startsWith(href)

  return (
    <div style={{ minHeight:'100vh', background:C.bg, direction:'rtl' }}>
      {/* Top bar */}
      <div style={{ background:C.navy, padding:'10px 20px', display:'flex', justifyContent:'space-between', alignItems:'center', position:'sticky', top:0, zIndex:40 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:32, height:32, background:C.orange, borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:800, fontSize:14 }}>E</div>
          <div>
            <p style={{ color:'#fff', fontWeight:700, fontSize:13, margin:0 }}>EventVMS</p>
            <p style={{ color:'rgba(255,255,255,0.5)', fontSize:10, margin:0 }}>بوابة الكوادر</p>
          </div>
        </div>
        {worker && (
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ textAlign:'right' }}>
              <p style={{ color:'#fff', fontSize:12, fontWeight:700, margin:0 }}>{worker.full_name}</p>
              <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                {'★★★★★'.slice(0, Math.round(worker.rating_avg||worker.rating||0)).split('').map((_,i)=>(
                  <span key={i} style={{ color:'#FFD700', fontSize:10 }}>★</span>
                ))}
                <span style={{ color:'rgba(255,255,255,0.5)', fontSize:10 }}>{worker.rating_avg||worker.rating||0}</span>
              </div>
            </div>
            {worker.profile_photo||worker.photo_url ? (
              <img src={worker.profile_photo||worker.photo_url} alt="" style={{ width:34, height:34, borderRadius:'50%', objectFit:'cover', border:'2px solid rgba(255,255,255,0.2)' }}/>
            ) : (
              <div style={{ width:34, height:34, background:C.orange, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:800, fontSize:14 }}>{worker.full_name?.[0]||'?'}</div>
            )}
          </div>
        )}
      </div>

      {/* Main content */}
      <main style={{ paddingBottom: 70 }}>{children}</main>

      {/* Bottom nav */}
      <nav style={{ position:'fixed', bottom:0, left:0, right:0, background:C.card, borderTop:`1px solid ${C.border}`, display:'flex', zIndex:50, paddingBottom:'env(safe-area-inset-bottom,4px)' }}>
        {NAV.map(n => {
          const on = active(n.href)
          return (
            <Link key={n.key} href={n.href} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'8px 2px 5px', textDecoration:'none', gap:2, color: on ? C.orange : C.muted }}>
              <span style={{ fontSize:18 }}>{n.icon}</span>
              <span style={{ fontSize:9, fontWeight: on ? 700 : 400, whiteSpace:'nowrap' }}>{n.label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
