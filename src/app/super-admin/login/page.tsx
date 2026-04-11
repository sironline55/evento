'use client'
export const dynamic = 'force-dynamic'
import { useState, useMemo } from 'react'
import { createBrowserClient } from '@supabase/ssr'

const C = { navy:'#1E0A3C', orange:'#F05537', muted:'#6F7287', border:'#DBDAE3', error:'#DC2626' }

export default function SuperAdminLoginPage() {
  const sb = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), [])

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [showPass, setShowPass] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const { data, error: authErr } = await sb.auth.signInWithPassword({ email, password })
      if (authErr || !data.user) throw new Error(authErr?.message || 'فشل تسجيل الدخول')

      // Verify super_admin role
      const { data: profile } = await sb
        .from('profiles').select('role').eq('id', data.user.id).single()

      if (profile?.role !== 'super_admin') {
        await sb.auth.signOut()
        throw new Error('ليس لديك صلاحية الوصول للوحة الإدارة العليا')
      }

      // Log session
      await sb.from('super_admin_sessions').insert({
        user_id:    data.user.id,
        user_agent: navigator.userAgent,
      }).catch(() => {})

      window.location.href = '/super-admin'
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const inp: React.CSSProperties = {
    width:'100%', padding:'12px 14px', border:`1.5px solid ${C.border}`,
    borderRadius:10, fontSize:14, outline:'none', fontFamily:'inherit',
    color:'#111', background:'#fff', boxSizing:'border-box', direction:'rtl',
  }

  return (
    <div style={{
      minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
      background:`linear-gradient(135deg, ${C.navy} 0%, #3D1278 50%, #1E0A3C 100%)`,
      direction:'rtl', fontFamily:"'Tajawal', sans-serif", padding:16,
    }}>
      {/* Background pattern */}
      <div style={{ position:'fixed', inset:0, backgroundImage:'radial-gradient(circle at 20% 80%, rgba(240,85,55,0.15) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(240,85,55,0.08) 0%, transparent 50%)', pointerEvents:'none' }}/>

      <div style={{ width:'100%', maxWidth:400, position:'relative' }}>
        {/* Logo + badge */}
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <div style={{
            width:64, height:64, borderRadius:18, background:C.orange,
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:30, margin:'0 auto 14px', boxShadow:'0 8px 24px rgba(240,85,55,0.4)',
          }}>🎪</div>
          <h1 style={{ color:'#fff', fontSize:22, fontWeight:800, margin:'0 0 6px' }}>EventVMS</h1>
          <div style={{
            display:'inline-flex', alignItems:'center', gap:6,
            background:'rgba(240,85,55,0.2)', border:'1px solid rgba(240,85,55,0.4)',
            borderRadius:50, padding:'4px 14px',
          }}>
            <span style={{ fontSize:10 }}>🔐</span>
            <span style={{ fontSize:12, color:C.orange, fontWeight:700 }}>لوحة الإدارة العليا</span>
          </div>
        </div>

        {/* Card */}
        <div style={{
          background:'rgba(255,255,255,0.97)', borderRadius:20, padding:'32px 28px',
          boxShadow:'0 24px 80px rgba(0,0,0,0.4)',
        }}>
          <h2 style={{ fontSize:18, fontWeight:800, color:C.navy, margin:'0 0 4px' }}>تسجيل دخول المشرف</h2>
          <p style={{ fontSize:13, color:C.muted, margin:'0 0 24px' }}>
            هذه اللوحة مخصصة لمدراء المنصة فقط
          </p>

          <form onSubmit={handleLogin} style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:'#374151', display:'block', marginBottom:6 }}>
                البريد الإلكتروني
              </label>
              <input
                type="email" value={email} onChange={e=>setEmail(e.target.value)}
                required placeholder="admin@eventoapp.com"
                style={inp} autoComplete="email"
              />
            </div>

            <div>
              <label style={{ fontSize:12, fontWeight:600, color:'#374151', display:'block', marginBottom:6 }}>
                كلمة المرور
              </label>
              <div style={{ position:'relative' }}>
                <input
                  type={showPass?'text':'password'} value={password}
                  onChange={e=>setPassword(e.target.value)}
                  required placeholder="••••••••"
                  style={{ ...inp, paddingLeft:44 }} autoComplete="current-password"
                />
                <button type="button" onClick={()=>setShowPass(p=>!p)} style={{
                  position:'absolute', left:12, top:'50%', transform:'translateY(-50%)',
                  background:'none', border:'none', cursor:'pointer', color:C.muted, fontSize:16,
                }}>
                  {showPass ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            {error && (
              <div style={{
                padding:'10px 14px', background:'#FEF2F2', borderRadius:10,
                border:'1px solid #FCA5A5', fontSize:13, color:C.error, fontWeight:500,
              }}>
                ⚠️ {error}
              </div>
            )}

            <button type="submit" disabled={loading} style={{
              padding:'13px', background:loading?C.muted:C.navy, color:'#fff',
              border:'none', borderRadius:12, fontSize:15, fontWeight:700,
              cursor:loading?'wait':'pointer', fontFamily:'inherit',
              transition:'all 0.2s', marginTop:4,
              boxShadow: loading ? 'none' : '0 4px 16px rgba(30,10,60,0.3)',
            }}>
              {loading ? '⏳ جاري التحقق...' : '🔐 دخول لوحة الإدارة'}
            </button>
          </form>

          <div style={{ marginTop:20, paddingTop:16, borderTop:`1px solid ${C.border}`, textAlign:'center' }}>
            <a href="/login" style={{ fontSize:12, color:C.muted, textDecoration:'none' }}>
              ← العودة لتسجيل الدخول العادي
            </a>
          </div>
        </div>

        <p style={{ textAlign:'center', color:'rgba(255,255,255,0.3)', fontSize:11, marginTop:20 }}>
          EventVMS Super Admin · v1.0.177
        </p>
      </div>
    </div>
  )
}
