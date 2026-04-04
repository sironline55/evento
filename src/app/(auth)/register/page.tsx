'use client'
import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import Link from 'next/link'

const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
)

export default function RegisterPage() {
  const [form, setForm] = useState({ name:'', email:'', password:'' })
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function register(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setError('')
    const { error } = await sb.auth.signUp({ email: form.email, password: form.password, options: { data: { full_name: form.name } } })
    if (error) { setError(error.message); setLoading(false) } else setSuccess(true)
  }

  async function registerWithGoogle() {
    setGoogleLoading(true); setError('')
    const { error } = await sb.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin + '/' } })
    if (error) { setError(error.message); setGoogleLoading(false) }
  }

  const inp: React.CSSProperties = { width:'100%', padding:'12px 14px', border:'1px solid #e5e7eb', borderRadius:10, fontSize:15, boxSizing:'border-box', outline:'none', fontFamily:'inherit', background:'#fafafa' }

  if (success) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'linear-gradient(135deg,#FBF8F5,#F3F0F8)'}} dir="rtl">
      <div style={{background:'#fff',borderRadius:20,padding:40,maxWidth:400,width:'100%',textAlign:'center',boxShadow:'0 8px 40px rgba(0,0,0,0.08)'}}>
        <div style={{fontSize:56,marginBottom:16}}>📧</div>
        <h2 style={{fontSize:22,fontWeight:700,margin:'0 0 8px'}}>تحقق من بريدك الإلكتروني</h2>
        <p style={{color:'#666',marginBottom:24}}>أرسلنا رابط التأكيد إلى <strong>{form.email}</strong></p>
        <Link href="/login" style={{background:'#F05537',color:'#fff',padding:'12px 28px',borderRadius:12,textDecoration:'none',fontWeight:600}}>الذهاب لتسجيل الدخول</Link>
      </div>
    </div>
  )

  return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'linear-gradient(135deg,#FBF8F5,#F3F0F8)'}} dir="rtl">
      <div style={{background:'#fff',borderRadius:20,padding:40,width:'100%',maxWidth:400,boxShadow:'0 8px 40px rgba(0,0,0,0.08)'}}>
        <div style={{textAlign:'center',marginBottom:32}}>
          <div style={{width:56,height:56,background:'#F05537',borderRadius:16,display:'inline-flex',alignItems:'center',justifyContent:'center',marginBottom:16,fontSize:24}}>🎪</div>
          <h1 style={{fontSize:24,fontWeight:700,margin:0}}>إنشاء حساب جديد</h1>
          <p style={{color:'#666',fontSize:13,marginTop:4}}>ابدأ مجاناً — لا بطاقة ائتمان</p>
        </div>
        {error && <div style={{background:'#fef2f2',border:'1px solid #fecaca',borderRadius:10,padding:'10px 14px',color:'#dc2626',fontSize:13,marginBottom:16}}>{error}</div>}
        <button onClick={registerWithGoogle} disabled={googleLoading||loading} style={{width:'100%',padding:'13px',background:'#fff',border:'1.5px solid #e5e7eb',borderRadius:12,fontSize:15,fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:10,marginBottom:20,color:'#374151',opacity:googleLoading?0.7:1}}>
          <GoogleIcon />{googleLoading?'جاري التحويل...':'التسجيل بحساب Google'}
        </button>
        <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:20}}>
          <div style={{flex:1,height:1,background:'#e5e7eb'}}/>
          <span style={{fontSize:13,color:'#9ca3af'}}>أو بالبريد الإلكتروني</span>
          <div style={{flex:1,height:1,background:'#e5e7eb'}}/>
        </div>
        <form onSubmit={register} style={{display:'flex',flexDirection:'column',gap:16}}>
          <div><label style={{fontSize:13,fontWeight:500,display:'block',marginBottom:6}}>الاسم أو اسم الجهة</label><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required placeholder="شركة الفعاليات" style={inp}/></div>
          <div><label style={{fontSize:13,fontWeight:500,display:'block',marginBottom:6}}>البريد الإلكتروني</label><input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} required placeholder="example@email.com" style={inp}/></div>
          <div><label style={{fontSize:13,fontWeight:500,display:'block',marginBottom:6}}>كلمة المرور</label><input type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} required minLength={6} placeholder="••••••••" style={inp}/></div>
          <button type="submit" disabled={loading||googleLoading} style={{background:'#F05537',color:'#fff',padding:'14px',borderRadius:12,border:'none',fontSize:16,fontWeight:600,cursor:'pointer',opacity:loading?0.7:1}}>{loading?'جاري إنشاء الحساب...':'إنشاء الحساب مجاناً'}</button>
        </form>
        <p style={{textAlign:'center',marginTop:20,fontSize:14,color:'#666'}}>لديك حساب؟ <Link href="/login" style={{color:'#F05537',fontWeight:600}}>سجّل الدخول</Link></p>
      </div>
    </div>
  )
}
