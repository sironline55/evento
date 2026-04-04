'use client'
import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

  async function login(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const { error } = await sb.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false) }
    else router.push('/')
  }

  return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'linear-gradient(135deg,#f0f9f6,#e8f4f0)'}} dir="rtl">
      <div style={{background:'#fff',borderRadius:20,padding:40,width:'100%',maxWidth:400,boxShadow:'0 8px 40px rgba(0,0,0,0.08)'}}>
        <div style={{textAlign:'center',marginBottom:32}}>
          <div style={{width:56,height:56,background:'#2B6E64',borderRadius:16,display:'inline-flex',alignItems:'center',justifyContent:'center',marginBottom:16,fontSize:24}}>🎪</div>
          <h1 style={{fontSize:24,fontWeight:700,margin:0}}>EventVMS</h1>
          <p style={{color:'#666',fontSize:14,marginTop:4}}>تسجيل الدخول لحسابك</p>
        </div>
        {error && <div style={{background:'#fef2f2',border:'1px solid #fecaca',borderRadius:10,padding:'10px 14px',color:'#dc2626',fontSize:13,marginBottom:16}}>{error}</div>}
        <form onSubmit={login} style={{display:'flex',flexDirection:'column',gap:16}}>
          <div>
            <label style={{fontSize:13,fontWeight:500,color:'#374151',display:'block',marginBottom:6}}>البريد الإلكتروني</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required placeholder="example@email.com" style={{width:'100%',padding:'12px 14px',border:'1px solid #e5e7eb',borderRadius:10,fontSize:15,boxSizing:'border-box',outline:'none'}}/>
          </div>
          <div>
            <label style={{fontSize:13,fontWeight:500,color:'#374151',display:'block',marginBottom:6}}>كلمة المرور</label>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required placeholder="••••••••" style={{width:'100%',padding:'12px 14px',border:'1px solid #e5e7eb',borderRadius:10,fontSize:15,boxSizing:'border-box',outline:'none'}}/>
          </div>
          <button type="submit" disabled={loading} style={{background:'#2B6E64',color:'#fff',padding:'14px',borderRadius:12,border:'none',fontSize:16,fontWeight:600,cursor:'pointer',marginTop:4,opacity:loading?0.7:1}}>
            {loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
          </button>
        </form>
        <p style={{textAlign:'center',marginTop:20,fontSize:14,color:'#666'}}>
          ليس لديك حساب؟ <Link href="/register" style={{color:'#2B6E64',fontWeight:600}}>سجّل الآن</Link>
        </p>
        <div style={{marginTop:24,padding:16,background:'#f0f9f6',borderRadius:12,fontSize:12,color:'#065f46'}}>
          <p style={{fontWeight:600,margin:'0 0 4px'}}>للتجربة السريعة:</p>
          <p style={{margin:0}}>سجّل حساباً جديداً أو استخدم بريدك الإلكتروني</p>
        </div>
      </div>
    </div>
  )
}
