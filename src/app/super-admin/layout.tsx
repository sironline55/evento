'use client'
import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'

const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
const C = { navy:'#1C1C3B', primary:'#F47D31', cream:'#FBF8F5', muted:'rgba(255,255,255,0.45)', border:'rgba(255,255,255,0.07)' }
const nav = [
  { href:'/super-admin', label:'لوحة التحكم', icon:'📊', exact:true },
  { href:'/super-admin/organizations', label:'الشركات', icon:'🏢' },
  { href:'/super-admin/plans', label:'الباقات', icon:'💎' },
]

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => { checkAuth() }, [])

  async function checkAuth() {
    const { data: { user } } = await sb.auth.getUser()
    if (!user) { router.push('/login'); return }
    const { data: profile } = await sb.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'super_admin') { router.push('/events'); return }
    setAuthorized(true); setLoading(false)
  }

  const isActive = (href: string, exact?: boolean) => exact ? pathname === href : pathname.startsWith(href)

  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:C.cream }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:32, marginBottom:12 }}>⏳</div>
        <p style={{ color:'#8B8FA8' }}>جاري التحقق من الصلاحيات...</p>
      </div>
    </div>
  )

  if (!authorized) return null

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:C.cream }} dir="rtl">
      <aside style={{ position:'fixed', right:0, top:0, height:'100%', width:220, background:C.navy, display:'flex', flexDirection:'column', zIndex:40, boxShadow:'-4px 0 32px rgba(0,0,0,0.15)' }}>
        <div style={{ padding:'24px 18px 20px', borderBottom:`1px solid ${C.border}` }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:36, height:36, background:C.primary, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>🎪</div>
            <div>
              <p style={{ fontSize:13, fontWeight:700, color:'#fff', margin:0 }}>EventVMS</p>
              <p style={{ fontSize:10, color:'rgba(255,255,255,0.35)', margin:'2px 0 0' }}>Super Admin</p>
            </div>
          </div>
        </div>
        <div style={{ margin:'12px 12px 4px', padding:'6px 12px', background:'rgba(244,125,49,0.15)', borderRadius:8, border:'1px solid rgba(244,125,49,0.25)' }}>
          <p style={{ fontSize:11, color:C.primary, margin:0, fontWeight:600 }}>🔐 لوحة المالك</p>
        </div>
        <nav style={{ padding:'8px 10px', flex:1, display:'flex', flexDirection:'column', gap:2 }}>
          {nav.map(({ href, label, icon, exact }) => {
            const active = isActive(href, exact)
            return (
              <Link key={href} href={href} style={{ display:'flex', alignItems:'center', gap:11, padding:'11px 13px', borderRadius:12, textDecoration:'none', background:active?C.primary:'transparent', color:active?'#fff':C.muted, fontWeight:active?600:400, fontSize:14 }}>
                <span style={{ fontSize:17 }}>{icon}</span>{label}
              </Link>
            )
          })}
        </nav>
        <div style={{ padding:'14px 10px', borderTop:`1px solid ${C.border}` }}>
          <Link href="/events" style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 13px', borderRadius:12, textDecoration:'none', color:'rgba(255,255,255,0.35)', fontSize:13 }}>← العودة للتطبيق</Link>
        </div>
      </aside>
      <main style={{ flex:1, marginRight:220, minHeight:'100vh' }}>{children}</main>
    </div>
  )
}
