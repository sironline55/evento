'use client'
import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const sb = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
const C = { navy:'#1E0A3C', orange:'#F05537', text:'#39364F', muted:'#6F7287', border:'#DBDAE3', bg:'#FAFAFA', card:'#FFFFFF' }

export default function StaffLogin() {
  const router = useRouter()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const { error: err } = await sb.auth.signInWithPassword({ email, password })
    if (err) { setError('بيانات الدخول غير صحيحة'); setLoading(false); return }
    router.push('/staff')
  }

  const fs = { width:'100%', padding:'12px 16px', border:`1px solid ${C.border}`, borderRadius:8, fontSize:14, outline:'none', fontFamily:'inherit', color:C.text, background:C.bg, boxSizing:'border-box' as const }

  return (
    <div style={{ minHeight:'100vh', background:`linear-gradient(135deg, #1E0A3C 0%, #3D1A78 100%)`, display:'flex', alignItems:'center', justifyContent:'center', padding:16, direction:'rtl' }}>
      <div style={{ width:'100%', maxWidth:400 }}>
        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{ width:56, height:56, background:C.orange, borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px', fontSize:24, fontWeight:800, color:'#fff' }}>E</div>
          <h1 style={{ color:'#fff', fontSize:22, fontWeight:800, margin:0 }}>EventVMS</h1>
          <p style={{ color:'rgba(255,255,255,0.6)', fontSize:13, margin:'4px 0 0' }}>بوابة الكوادر والموظفين</p>
        </div>

        {/* Card */}
        <div style={{ background:C.card, borderRadius:16, padding:32, boxShadow:'0 20px 60px rgba(0,0,0,0.3)' }}>
          <h2 style={{ fontSize:18, fontWeight:800, color:C.navy, margin:'0 0 6px' }}>تسجيل الدخول</h2>
          <p style={{ fontSize:13, color:C.muted, margin:'0 0 24px' }}>أدخل بيانات حسابك للوصول للوحة الكوادر</p>

          {error && (
            <div style={{ background:'#FEF2F2', border:'1px solid #FCA5A5', borderRadius:8, padding:'10px 14px', marginBottom:16 }}>
              <p style={{ color:'#B91C1C', fontSize:13, margin:0 }}>❌ {error}</p>
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom:14 }}>
              <label style={{ fontSize:12, fontWeight:700, color:C.navy, display:'block', marginBottom:6 }}>البريد الإلكتروني</label>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} style={fs} placeholder="your@email.com" required/>
            </div>
            <div style={{ marginBottom:20 }}>
              <label style={{ fontSize:12, fontWeight:700, color:C.navy, display:'block', marginBottom:6 }}>كلمة المرور</label>
              <input type="password" value={password} onChange={e=>setPassword(e.target.value)} style={fs} placeholder="••••••••" required/>
            </div>
            <button type="submit" disabled={loading} style={{ width:'100%', padding:'13px', background:loading?'#ccc':C.orange, border:'none', borderRadius:8, color:'#fff', fontWeight:800, fontSize:15, cursor:loading?'not-allowed':'pointer', fontFamily:'inherit' }}>
              {loading ? 'جاري الدخول...' : 'دخول'}
            </button>
          </form>

          <div style={{ marginTop:20, padding:'14px', background:'#F8F7FA', borderRadius:8, textAlign:'center' }}>
            <p style={{ fontSize:12, color:C.muted, margin:'0 0 8px' }}>لست مسجلاً كموظف بعد؟</p>
            <Link href="/workers/register" style={{ fontSize:13, color:C.orange, fontWeight:700, textDecoration:'none' }}>سجّل كموظف جديد ←</Link>
          </div>

          <div style={{ marginTop:12, textAlign:'center' }}>
            <Link href="/login" style={{ fontSize:12, color:C.muted, textDecoration:'none' }}>دخول كمنظم فعاليات</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
