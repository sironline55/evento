'use client'
import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import Link from 'next/link'

const STATUS_MAP: any = { draft:{label:'مسودة',color:'#f3f4f6',text:'#374151'}, published:{label:'منشور',color:'#dbeafe',text:'#1e40af'}, active:{label:'نشط',color:'#dcfce7',text:'#166534'}, completed:{label:'مكتمل',color:'#f3f4f6',text:'#374151'}, cancelled:{label:'ملغي',color:'#fef2f2',text:'#dc2626'} }

export default function EventsPage() {
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

  useEffect(() => {
    sb.from('events').select('id,name,start_date,end_date,status,venue_name,max_capacity').order('created_at',{ascending:false})
      .then(({data}) => { setEvents(data||[]); setLoading(false) })
  }, [])

  return (
    <div style={{padding:24,direction:'rtl'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24}}>
        <div><h1 style={{fontSize:24,fontWeight:700,margin:0}}>الفعاليات</h1><p style={{color:'#666',fontSize:14,marginTop:4}}>إدارة جميع فعالياتك</p></div>
        <Link href="/events/new" style={{background:'#2B6E64',color:'#fff',padding:'12px 24px',borderRadius:12,textDecoration:'none',fontWeight:600}}>+ فعالية جديدة</Link>
      </div>
      {loading ? <div style={{textAlign:'center',padding:60,color:'#666'}}>جاري التحميل...</div>
      : events.length === 0 ? (
        <div style={{textAlign:'center',padding:'80px 0',background:'#fff',borderRadius:16,border:'1px solid #f0f0f0'}}>
          <p style={{fontSize:56,margin:'0 0 16px'}}>📅</p>
          <p style={{fontWeight:700,fontSize:20,margin:'0 0 8px'}}>لا توجد فعاليات</p>
          <p style={{color:'#666',margin:'0 0 24px'}}>أنشئ أول فعالية وابدأ تسجيل الزوار</p>
          <Link href="/events/new" style={{background:'#2B6E64',color:'#fff',padding:'12px 28px',borderRadius:12,textDecoration:'none',fontWeight:600}}>إنشاء فعالية</Link>
        </div>
      ) : (
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))',gap:16}}>
          {events.map(ev => {
            const s = STATUS_MAP[ev.status] || STATUS_MAP.draft
            return (
              <Link key={ev.id} href={`/events/${ev.id}`} style={{background:'#fff',borderRadius:16,padding:20,border:'1px solid #f0f0f0',textDecoration:'none',color:'inherit',display:'block'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12}}>
                  <h3 style={{fontWeight:700,fontSize:17,margin:0,flex:1}}>{ev.name}</h3>
                  <span style={{padding:'4px 12px',borderRadius:20,fontSize:11,background:s.color,color:s.text,marginRight:8,whiteSpace:'nowrap'}}>{s.label}</span>
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:6,fontSize:13,color:'#666'}}>
                  {ev.venue_name && <span>📍 {ev.venue_name}</span>}
                  {ev.start_date && <span>📅 {new Date(ev.start_date).toLocaleDateString('ar-SA')}</span>}
                  {ev.max_capacity && <span>👥 الطاقة الاستيعابية: {ev.max_capacity.toLocaleString('ar')}</span>}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
