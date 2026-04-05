'use client'
import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
const C = { navy:'#1E0A3C', orange:'#F05537', blue:'#0070B8', border:'#DBDAE3', muted:'#6F7287', text:'#39364F', bg:'#FAFAFA', card:'#FFFFFF' }
const fs = { width:'100%', padding:'12px 16px', border:`1px solid ${C.border}`, borderRadius:8, fontSize:14, outline:'none', fontFamily:'inherit', color:C.text, background:C.bg, boxSizing:'border-box' as const }

export default function StaffLoginPage() {
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

  return (
    <div style={{ minHeight:'100vh', background:`linear-gradient(135deg, #0070B8, #005A94)`, display:'flex', alignItems:'center', justifyContent:'center', padding:16, direction:'rtl' }}>
      <div style={{ width:'100%', maxWidth:400 }}>
        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{ width:56, height:56, background:'#F05537', borderRadius:12, display:'inline-flex', alignItems:'center', justifyContent:'center', marginBottom:12 }}>
            <span style={{ color:'#fff', fontWeight:800, fontSize:24 }}>E</span>
          </div>
          <h1 style={{ color:'#fff', fontSize:22, fontWeight:800, margin:0 }}>بوابة الكادر</h1>
          <p style={{ color:'rgba(255,255,255,0.7)', fontSize:13, margin:'4px 0 0' }}>Staff Portal — EventVMS</p>
        </div>

        <div style={{ background:C.card, borderRadius:16, padding:32, boxShadow:'0 20px 60px rgba(0,0,0,0.2)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:24, padding:'12px 14px', background:'#EDF7FF', borderRadius:8, border:'1px solid #B3DFF7' }}>
            <span style={{ fontSize:24 }}>👷</span>
            <div>
              <p style={{ fontSize:13, fontWeight:700, color:C.blue, margin:0 }}>دخول الكوادر والموظفين</p>
              <p style={{ fontSize:11, color:C.blue, margin:0, opacity:0.8 }}>ستُوجَّه حسب دورك في الفعالية</p>
            </div>
          </div>

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom:14 }}>
              <label style={{ fontSize:13, fontWeight:600, color:C.navy, display:'block', marginBottom:6 }}>البريد الإلكتروني</label>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required style={fs} placeholder="staff@example.com"
                onFocus={e=>(e.target.style.borderColor=C.blue)} onBlur={e=>(e.target.style.borderColor=C.border)}/>
            </div>
            <div style={{ marginBottom:20 }}>
              <label style={{ fontSize:13, fontWeight:600, color:C.navy, display:'block', marginBottom:6 }}>كلمة المرور</label>
              <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required style={fs} placeholder="••••••••"
                onFocus={e=>(e.target.style.borderColor=C.blue)} onBlur={e=>(e.target.style.borderColor=C.border)}/>
            </div>

            {error && <div style={{ background:'#FEF2F2', border:'1px solid #FCA5A5', borderRadius:8, padding:'10px 14px', marginBottom:16 }}>
              <p style={{ color:'#B91C1C', fontSize:13, margin:0 }}>⚠️ {error}</p>
            </div>}

            <button type="submit" disabled={loading} style={{
              width:'100%', padding:'13px', border:'none', borderRadius:8,
              background:loading?'#ccc':C.blue, color:'#fff', fontWeight:800,
              fontSize:15, cursor:loading?'not-allowed':'pointer', fontFamily:'inherit'
            }}>
              {loading ? 'جاري الدخول...' : '🔐 دخول الكادر'}
            </button>
          </form>

          <div style={{ marginTop:20, padding:'14px', background:'#F8F7FA', borderRadius:8 }}>
            <p style={{ fontSize:12, color:C.muted, margin:'0 0 8px', fontWeight:600 }}>الأدوار المتاحة:</p>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
              {['📷 قارئ تذاكر','🤝 مستقبل ضيوف','👥 منظم حشود','🚗 باركينغ','🛡 أمن','🎯 منسق'].map(r=>(
                <span key={r} style={{ fontSize:11, background:C.card, border:`1px solid ${C.border}`, borderRadius:20, padding:'3px 10px', color:C.text }}>{r}</span>
              ))}
            </div>
          </div>
        </div>

        <div style={{ textAlign:'center', marginTop:20, display:'flex', justifyContent:'center', gap:16 }}>
          <Link href="/portal" style={{ color:'rgba(255,255,255,0.7)', fontSize:12, textDecoration:'none' }}>← بوابات الدخول</Link>
          <Link href="/workers/register" style={{ color:'rgba(255,255,255,0.7)', fontSize:12, textDecoration:'none' }}>تسجيل كادر جديد</Link>
        </div>
      </div>
    </div>
  )
}
