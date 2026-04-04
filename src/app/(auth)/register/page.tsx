'use client'
import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  const [form, setForm] = useState({ name:'', email:'', password:'' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const router = useRouter()
  const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

  async function register(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const { data, error } = await sb.auth.signUp({ email: form.email, password: form.password, options: { data: { full_name: form.name } } })
    if (error) { setError(error.message); setLoading(false) }
    else if (data.user && !data.session) setDone(true)
    else router.push('/')
  }

  if (done) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'linear-gradient(135deg,#f0f9f6,#e8f4f0)'}} dir="rtl">
      <div style={{background:'#fff',borderRadius:20,padding:40,maxWidth:400,textAlign:'center',boxShadow:'0 8px 40px rgba(0,0,0,0.08)'}}>
        <div style={{fontSize:56,marginBottom:16}}>📧</div>
        <h2 style={{fontSize:22,fontWeight:700}}>تحقق من بريدك الإلكتروني</h2>
        <p style={{color:'#666',marginTop:8}}>أرسلنا رابط التحقق إلى {form.email}</p>
        <Link href="/login" style={{display:'block',marginTop:24,padding:'12px',background:'#2B6E64',color:'#fff',borderRadius:12,textDecoration:'none',fontWeight:600}}>العودة لتسجيل الدخول</Link>
      </div>
    </div>
  )

  return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'linear-gradient(135deg,#f0f9f6,#e8f4f0)'}} dir="rtl">
      <div style={{background:'#fff',borderRadius:20,padding:40,width:'100%',maxWidth:400,boxShadow:'0 8px 40px rgba(0,0,0,0.08)'}}>
        <div style={{textAlign:'center',marginBottom:32}}>
          <div style={{width:56,height:56,background:'#2B6E64',borderRadius:16,display:'inline-flex',alignItems:'center',justifyContent:'center',marginBottom:16,fontSize:24}}>🎪</div>
          <h1 style={{fontSize:24,fontWeight:700,margin:0}}>إنشاء حساب جديد</h1>
          <p style={{color:'#666',fontSize:14,marginTop:4}}>ابدأ مجاناً — لا بطاقة ائتمان</p>
        </div>
        {error && <div style={{background:'#fef2f2',border:'1px solid #fecaca',borderRadius:10,padding:'10px 14px',color:'#dc2626',fontSize:13,marginBottom:16}}>{error}</div>}
        <form onSubmit={register} style={{display:'flex',flexDirection:'column',gap:16}}>
          <div><label style={{fontSize:13,fontWeight:500,color:'#374151',display:'block',marginBottom:6}}>اسم الشركة أو الجهة</label>
            <input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required placeholder="شركة الفعاليات السعودية" style={{width:'100%',padding:'12px 14px',border:'1px solid #e5e7eb',borderRadius:10,fontSize:15,boxSizing:'border-box',outline:'none'}}/></div>
          <div><label style={{fontSize:13,fontWeight:500,color:'#374151',display:'block',marginBottom:6}}>البريد الإلكتروني</label>
            <input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} required placeholder="info@company.com" style={{width:'100%',padding:'12px 14px',border:'1px solid #e5e7eb',borderRadius:10,fontSize:15,boxSizing:'border-box',outline:'none'}}/></div>
          <div><label style={{fontSize:13,fontWeight:500,color:'#374151',display:'block',marginBottom:6}}>كلمة المرور</label>
            <input type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} required placeholder="8 أحرف على الأقل" minLength={8} style={{width:'100%',padding:'12px 14px',border:'1px solid #e5e7eb',borderRadius:10,fontSize:15,boxSizing:'border-box',outline:'none'}}/></div>
          <button type="submit" disabled={loading} style={{background:'#2B6E64',color:'#fff',padding:'14px',borderRadius:12,border:'none',fontSize:16,fontWeight:600,cursor:'pointer',marginTop:4,opacity:loading?0.7:1}}>
            {loading ? 'جاري الإنشاء...' : 'إنشاء الحساب مجاناً'}
          </button>
        </form>
        <p style={{textAlign:'center',marginTop:20,fontSize:14,color:'#666'}}>لديك حساب بالفعل؟ <Link href="/login" style={{color:'#2B6E64',fontWeight:600}}>سجّل الدخول</Link></p>
      </div>
    </div>
  )
}
