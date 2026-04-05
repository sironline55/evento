'use client'
import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter, usePathname } from 'next/navigation'

const sb = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
const C = { navy:'#1E0A3C', orange:'#F05537', text:'#39364F', muted:'#6F7287', border:'#DBDAE3', bg:'#FAFAFA', card:'#FFFFFF' }

const NAV = [
  { href:'/staff',          icon:'🏠', label:'لوحتي'     },
  { href:'/staff/schedule', icon:'📅', label:'جدول عملي'  },
  { href:'/staff/scanner',  icon:'📷', label:'الماسح'     },
  { href:'/staff/profile',  icon:'👤', label:'ملفي'       },
]

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter()
  const pathname = usePathname()
  const [worker, setWorker] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    sb.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push('/staff/login'); return }
      const { data: wp } = await sb.from('worker_profiles').select('*').eq('user_id', data.user.id).single()
      setWorker(wp)
      setLoading(false)
    })
  }, [])

  if (pathname === '/staff/login') return <>{children}</>
  if (loading) return <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:C.navy }}><div style={{ color:'#fff', fontSize:14 }}>جاري التحميل...</div></div>

  const active = (href: string) => href === '/staff' ? pathname === '/staff' : pathname.startsWith(href)
  const roleColor: Record<string,string> = { scanner:'#3A7D0A', receptionist:'#7B4FBF', crowd_manager:'#B07000', parking:'#0070B8', staff:C.orange }

  return (
    <div style={{ minHeight:'100vh', background:C.bg, direction:'rtl' }}>
      {/* Top bar */}
      <div style={{ background:C.navy, padding:'12px 20px', display:'flex', justifyContent:'space-between', alignItems:'center', position:'sticky', top:0, zIndex:40 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:32, height:32, background:C.orange, borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:800, fontSize:14 }}>E</div>
          <div>
            <p style={{ color:'#fff', fontWeight:700, fontSize:13, margin:0 }}>{worker?.full_name || 'الكادر'}</p>
            {worker && <p style={{ fontSize:10, margin:0, padding:'1px 6px', background:C.orange, borderRadius:10, color:'#fff', fontWeight:700, display:'inline-block' }}>
              {({ scanner:'ماسح تذاكر', receptionist:'استقبال', crowd_manager:'إدارة حشود', parking:'مواقف سيارات', staff:'كادر' } as any)[worker.skills?.[0]] || 'كادر'}
            </p>}
          </div>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          {worker?.rating > 0 && <span style={{ color:'#FFD700', fontSize:12 }}>⭐ {worker.rating}</span>}
          <button onClick={async()=>{ await sb.auth.signOut(); router.push('/staff/login') }} style={{ padding:'6px 12px', border:'1px solid rgba(255,255,255,0.3)', borderRadius:6, background:'transparent', color:'rgba(255,255,255,0.7)', fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>
            خروج
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ paddingBottom:72 }}>{children}</div>

      {/* Bottom nav */}
      <nav style={{ position:'fixed', bottom:0, left:0, right:0, background:C.card, borderTop:`1px solid ${C.border}`, display:'flex', zIndex:50, paddingBottom:'env(safe-area-inset-bottom,6px)' }}>
        {NAV.map(n => {
          const on = active(n.href)
          return (
            <a key={n.href} href={n.href} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'8px 4px 5px', textDecoration:'none', color: on ? C.orange : C.muted }}>
              <span style={{ fontSize:20 }}>{n.icon}</span>
              <span style={{ fontSize:9, fontWeight: on ? 700 : 400, marginTop:2 }}>{n.label}</span>
            </a>
          )
        })}
      </nav>
    </div>
  )
}
