'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState, useMemo } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'

const C = { navy:'#1E0A3C', orange:'#F05537', border:'rgba(255,255,255,0.08)', muted:'rgba(255,255,255,0.45)' }

const NAV = [
  { href:'/super-admin',              label:'لوحة التحكم',  icon:'📊', exact:true },
  { href:'/super-admin/organizations', label:'الشركات',      icon:'🏢' },
  { href:'/super-admin/users',         label:'المستخدمون',   icon:'👥' },
  { href:'/super-admin/events',        label:'الفعاليات',    icon:'🎪' },
  { href:'/super-admin/coupons',       label:'الكوبونات',    icon:'🏷️' },
  { href:'/super-admin/plans',         label:'الباقات',      icon:'💎' },
]

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const sb = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), [])
  const [loading, setLoading]       = useState(true)
  const [authorized, setAuthorized] = useState(false)
  const [adminEmail, setAdminEmail] = useState('')
  const router   = useRouter()
  const pathname = usePathname()
  const isLoginPage = pathname === '/super-admin/login'

  useEffect(() => { if (!isLoginPage) checkAuth() }, [])

  async function checkAuth() {
    const { data:{ user } } = await sb.auth.getUser()
    if (!user) { router.push('/super-admin/login'); return }
    const { data: profile } = await sb.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'super_admin') { router.push('/super-admin/login'); return }
    setAdminEmail(user.email || '')
    setAuthorized(true)
    setLoading(false)
  }

  async function handleLogout() {
    await sb.auth.signOut()
    window.location.href = '/super-admin/login'
  }

  if (isLoginPage) return <>{children}</>

  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
      background:`linear-gradient(135deg,${C.navy},#3D1278)` }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:36, marginBottom:12 }}>⏳</div>
        <p style={{ color:'rgba(255,255,255,0.5)', fontFamily:"'Tajawal',sans-serif" }}>جاري التحقق من الصلاحيات...</p>
      </div>
    </div>
  )

  if (!authorized) return null

  const isActive = (href: string, exact?: boolean) => exact ? pathname === href : pathname.startsWith(href)

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'#F4F3F8', direction:'rtl', fontFamily:"'Tajawal',sans-serif" }}>
      <aside style={{
        position:'fixed', right:0, top:0, height:'100%', width:220,
        background:C.navy, display:'flex', flexDirection:'column', zIndex:40,
        boxShadow:'-4px 0 32px rgba(0,0,0,0.2)',
      }}>
        <Link href="/super-admin" style={{ padding:'20px 16px 16px', borderBottom:`1px solid ${C.border}`, textDecoration:'none', display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:36, height:36, background:C.orange, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>🎪</div>
          <div>
            <p style={{ fontSize:13, fontWeight:800, color:'#fff', margin:0 }}>EventVMS</p>
            <p style={{ fontSize:10, color:'rgba(255,255,255,0.35)', margin:'1px 0 0' }}>Super Admin</p>
          </div>
        </Link>

        <div style={{ margin:'10px 10px 4px', padding:'7px 12px', background:'rgba(240,85,55,0.15)', borderRadius:8, border:'1px solid rgba(240,85,55,0.25)' }}>
          <p style={{ fontSize:10, color:C.orange, margin:0, fontWeight:700 }}>🔐 لوحة المالك</p>
          <p style={{ fontSize:10, color:'rgba(255,255,255,0.35)', margin:'2px 0 0', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{adminEmail}</p>
        </div>

        <nav style={{ padding:'8px 10px', flex:1, display:'flex', flexDirection:'column', gap:2 }}>
          {NAV.map(({ href, label, icon, exact }) => {
            const active = isActive(href, exact)
            return (
              <Link key={href} href={href} style={{
                display:'flex', alignItems:'center', gap:10,
                padding:'10px 13px', borderRadius:10, textDecoration:'none',
                background: active ? C.orange : 'transparent',
                color: active ? '#fff' : C.muted,
                fontWeight: active ? 700 : 400, fontSize:13, transition:'all 0.15s',
              }}>
                <span style={{ fontSize:16 }}>{icon}</span>{label}
              </Link>
            )
          })}
        </nav>

        <div style={{ padding:'10px 10px 14px', borderTop:`1px solid ${C.border}`, display:'flex', flexDirection:'column', gap:4 }}>
          <Link href="/events" style={{ display:'flex', alignItems:'center', gap:8, padding:'9px 13px', borderRadius:10, textDecoration:'none', color:C.muted, fontSize:12 }}>
            <span>←</span> العودة للتطبيق
          </Link>
          <button onClick={handleLogout} style={{ display:'flex', alignItems:'center', gap:8, padding:'9px 13px', borderRadius:10, background:'none', border:'none', cursor:'pointer', color:'rgba(220,38,38,0.7)', fontSize:12, fontFamily:'inherit', width:'100%' }}>
            <span>🚪</span> تسجيل الخروج
          </button>
        </div>
        <div style={{ padding:'6px 14px 10px', textAlign:'center', fontSize:10, color:'rgba(255,255,255,0.2)' }}>v1.0.177 BETA</div>
      </aside>
      <main style={{ flex:1, marginRight:220, minHeight:'100vh' }}>{children}</main>
    </div>
  )
}
