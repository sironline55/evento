'use client'
import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import Link from 'next/link'

export default function DashboardPage() {
  const [stats, setStats] = useState({ events:0, attendees:0, workers:0, checkins:0 })
  const [recentEvents, setRecentEvents] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)
  const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

  useEffect(() => {
    sb.auth.getUser().then(({data}) => setUser(data.user))
    loadStats()
  }, [])

  async function loadStats() {
    try {
      const [ev, att, wk] = await Promise.all([
        sb.from('events').select('*',{count:'exact',head:true}),
        sb.from('attendees').select('*',{count:'exact',head:true}),
        sb.from('worker_profiles').select('*',{count:'exact',head:true})
      ])
      const evData = await sb.from('events').select('id,name,start_date,status').order('created_at',{ascending:false}).limit(5)
      setStats({ events: ev.count||0, attendees: att.count||0, workers: wk.count||0, checkins: 0 })
      setRecentEvents(evData.data||[])
    } catch(e) {}
  }

  const cards = [
    { label:'الفعاليات', value: stats.events, icon:'📅', href:'/events', color:'#2B6E64' },
    { label:'الزوار المسجلون', value: stats.attendees, icon:'👥', href:'/attendees', color:'#0891b2' },
    { label:'الكوادر البشرية', value: stats.workers, icon:'🤝', href:'/staffing', color:'#7c3aed' },
    { label:'تسجيل العمال', value:'رابط مباشر', icon:'🔗', href:'/workers/register', color:'#d97706', external:true },
  ]

  return (
    <div style={{padding:24,direction:'rtl'}}>
      <div style={{marginBottom:28}}>
        <h1 style={{fontSize:26,fontWeight:700,margin:0}}>مرحباً 👋</h1>
        <p style={{color:'#666',marginTop:4,fontSize:14}}>{user?.email} — لوحة التحكم الرئيسية</p>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:16,marginBottom:32}}>
        {cards.map(c => (
          <Link key={c.label} href={c.href} target={c.external?'_blank':undefined} style={{textDecoration:'none'}}>
            <div style={{background:'#fff',borderRadius:16,padding:20,border:'1px solid #f0f0f0',cursor:'pointer',transition:'all 0.2s',display:'flex',flexDirection:'column',gap:8}}>
              <div style={{fontSize:28}}>{c.icon}</div>
              <div style={{fontSize:28,fontWeight:700,color:c.color}}>{typeof c.value==='number'?c.value.toLocaleString('ar'):c.value}</div>
              <div style={{fontSize:13,color:'#666'}}>{c.label}</div>
            </div>
          </Link>
        ))}
      </div>
      <div style={{background:'#fff',borderRadius:16,padding:24,border:'1px solid #f0f0f0'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
          <h2 style={{fontSize:18,fontWeight:700,margin:0}}>آخر الفعاليات</h2>
          <Link href="/events/new" style={{background:'#2B6E64',color:'#fff',padding:'8px 16px',borderRadius:10,textDecoration:'none',fontSize:13,fontWeight:600}}>+ فعالية جديدة</Link>
        </div>
        {recentEvents.length === 0 ? (
          <div style={{textAlign:'center',padding:'40px 0',color:'#999'}}>
            <p style={{fontSize:40,margin:'0 0 12px'}}>📅</p>
            <p style={{fontWeight:600,fontSize:16,margin:'0 0 8px'}}>لا توجد فعاليات بعد</p>
            <p style={{fontSize:13,margin:'0 0 20px'}}>ابدأ بإنشاء أول فعالية الآن</p>
            <Link href="/events/new" style={{background:'#2B6E64',color:'#fff',padding:'10px 24px',borderRadius:12,textDecoration:'none',fontWeight:600}}>إنشاء فعالية</Link>
          </div>
        ) : (
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {recentEvents.map(ev => (
              <Link key={ev.id} href={`/events/${ev.id}`} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 16px',background:'#f9fafb',borderRadius:12,textDecoration:'none',color:'inherit'}}>
                <span style={{fontWeight:500}}>{ev.name}</span>
                <div style={{display:'flex',alignItems:'center',gap:10}}>
                  <span style={{fontSize:12,color:'#666'}}>{ev.start_date ? new Date(ev.start_date).toLocaleDateString('ar-SA') : ''}</span>
                  <span style={{padding:'3px 10px',borderRadius:20,fontSize:11,background: ev.status==='active'?'#dcfce7': ev.status==='published'?'#dbeafe':'#f3f4f6', color: ev.status==='active'?'#166534': ev.status==='published'?'#1e40af':'#374151'}}>{ev.status==='active'?'نشط':ev.status==='published'?'منشور':'مسودة'}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
