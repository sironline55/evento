'use client'
import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function NewEventPage() {
  const [form, setForm] = useState({ name:'', name_ar:'', description:'', start_date:'', end_date:'', venue_name:'', venue_address:'', max_capacity:'', status:'draft' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

  const inp: React.CSSProperties = { width:'100%', padding:'11px 14px', border:'1px solid #e5e7eb', borderRadius:10, fontSize:14, boxSizing:'border-box', outline:'none', background:'#fafafa', fontFamily:'inherit' }

  async function create(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setError('')
    const { data: { user } } = await sb.auth.getUser()
    if (!user) { setError('يجب تسجيل الدخول أولاً'); setLoading(false); return }

    const { data: account } = await sb.from('accounts').select('id').eq('email', user.email!).single()
    let accountId = account?.id
    if (!accountId) {
      const { data: newAcc } = await sb.from('accounts').insert({ name: user.user_metadata?.full_name || user.email, email: user.email!, plan: 'free' }).select('id').single()
      accountId = newAcc?.id
    }

    const { data, error: err } = await sb.from('events').insert({
      account_id: accountId,
      name: form.name,
      name_ar: form.name_ar || null,
      description: form.description || null,
      start_date: form.start_date,
      end_date: form.end_date || null,
      venue_name: form.venue_name || null,
      venue_address: form.venue_address || null,
      max_capacity: form.max_capacity ? parseInt(form.max_capacity) : null,
      status: form.status,
      created_by: user.id,
    }).select('id').single()

    if (err) { setError(err.message); setLoading(false) }
    else router.push(`/events/${data!.id}`)
  }

  return (
    <div style={{padding:24,direction:'rtl',maxWidth:680}}>
      <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:24}}>
        <Link href="/events" style={{color:'#666',textDecoration:'none',fontSize:14}}>← الفعاليات</Link>
        <span style={{color:'#d1d5db'}}>/</span>
        <span style={{fontSize:14,fontWeight:500}}>فعالية جديدة</span>
      </div>
      <h1 style={{fontSize:24,fontWeight:700,marginBottom:24}}>إنشاء فعالية جديدة</h1>
      {error && <div style={{background:'#fef2f2',border:'1px solid #fecaca',borderRadius:10,padding:'10px 14px',color:'#dc2626',fontSize:13,marginBottom:16}}>{error}</div>}
      <form onSubmit={create}>
        <div style={{background:'#fff',borderRadius:16,padding:24,border:'1px solid #f0f0f0',display:'flex',flexDirection:'column',gap:16}}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
            <div><label style={{fontSize:13,fontWeight:500,display:'block',marginBottom:6}}>اسم الفعالية (عربي) *</label><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required placeholder="معرض الفعاليات السعودية 2025" style={inp}/></div>
            <div><label style={{fontSize:13,fontWeight:500,display:'block',marginBottom:6}}>اسم الفعالية (إنجليزي)</label><input value={form.name_ar} onChange={e=>setForm({...form,name_ar:e.target.value})} placeholder="Saudi Events Expo 2025" style={inp}/></div>
          </div>
          <div><label style={{fontSize:13,fontWeight:500,display:'block',marginBottom:6}}>وصف الفعالية</label><textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="وصف مختصر عن الفعالية..." rows={3} style={{...inp,height:'auto',resize:'vertical'}}/></div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
            <div><label style={{fontSize:13,fontWeight:500,display:'block',marginBottom:6}}>تاريخ البداية *</label><input type="datetime-local" value={form.start_date} onChange={e=>setForm({...form,start_date:e.target.value})} required style={inp}/></div>
            <div><label style={{fontSize:13,fontWeight:500,display:'block',marginBottom:6}}>تاريخ النهاية</label><input type="datetime-local" value={form.end_date} onChange={e=>setForm({...form,end_date:e.target.value})} style={inp}/></div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
            <div><label style={{fontSize:13,fontWeight:500,display:'block',marginBottom:6}}>اسم المكان</label><input value={form.venue_name} onChange={e=>setForm({...form,venue_name:e.target.value})} placeholder="مركز الرياض للمؤتمرات" style={inp}/></div>
            <div><label style={{fontSize:13,fontWeight:500,display:'block',marginBottom:6}}>الطاقة الاستيعابية</label><input type="number" value={form.max_capacity} onChange={e=>setForm({...form,max_capacity:e.target.value})} placeholder="500" style={inp}/></div>
          </div>
          <div><label style={{fontSize:13,fontWeight:500,display:'block',marginBottom:6}}>عنوان المكان</label><input value={form.venue_address} onChange={e=>setForm({...form,venue_address:e.target.value})} placeholder="الرياض، طريق الملك فهد" style={inp}/></div>
          <div><label style={{fontSize:13,fontWeight:500,display:'block',marginBottom:6}}>الحالة</label>
            <select value={form.status} onChange={e=>setForm({...form,status:e.target.value})} style={inp}>
              <option value="draft">مسودة</option>
              <option value="published">منشور</option>
              <option value="active">نشط</option>
            </select>
          </div>
        </div>
        <div style={{display:'flex',gap:12,marginTop:16}}>
          <Link href="/events" style={{flex:1,padding:'13px',background:'#f3f4f6',borderRadius:12,textDecoration:'none',textAlign:'center',color:'#374151',fontWeight:600}}>إلغاء</Link>
          <button type="submit" disabled={loading} style={{flex:2,padding:'13px',background:'#2B6E64',color:'#fff',border:'none',borderRadius:12,fontWeight:600,fontSize:15,cursor:'pointer',opacity:loading?0.7:1}}>
            {loading ? 'جاري الإنشاء...' : 'إنشاء الفعالية'}
          </button>
        </div>
      </form>
    </div>
  )
}
