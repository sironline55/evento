'use client'
import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useParams } from 'next/navigation'
import Link from 'next/link'

export default function EventDetailPage() {
  const { id } = useParams()
  const [event, setEvent] = useState<any>(null)
  const [attendees, setAttendees] = useState<any[]>([])
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

  useEffect(() => {
    Promise.all([
      sb.from('events').select('*').eq('id', id).single(),
      sb.from('attendees').select('id,full_name,email,phone,status,created_at').eq('event_id', id).order('created_at',{ascending:false}).limit(10),
      sb.from('attendees').select('*',{count:'exact',head:true}).eq('event_id', id)
    ]).then(([ev, att, c]) => {
      setEvent(ev.data); setAttendees(att.data||[]); setCount(c.count||0); setLoading(false)
    })
  }, [id])

  async function copyRegLink() {
    await navigator.clipboard.writeText(window.location.origin + '/r/' + id)
    alert('تم نسخ رابط التسجيل!')
  }

  if (loading) return <div style={{padding:40,textAlign:'center',color:'#666'}}>جاري التحميل...</div>
  if (!event) return <div style={{padding:40,textAlign:'center',color:'#666'}}>الفعالية غير موجودة</div>

  const statusColors: any = { draft:'#f3f4f6', published:'#dbeafe', active:'#dcfce7', completed:'#f3f4f6', cancelled:'#fef2f2' }
  const statusText: any = { draft:'#374151', published:'#1e40af', active:'#166534', completed:'#374151', cancelled:'#dc2626' }
  const statusLabels: any = { draft:'مسودة', published:'منشور', active:'نشط', completed:'مكتمل', cancelled:'ملغي' }

  return (
    <div style={{padding:24,direction:'rtl'}}>
      <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:20}}>
        <Link href="/events" style={{color:'#666',textDecoration:'none',fontSize:14}}>← الفعاليات</Link>
        <span style={{color:'#d1d5db'}}>/</span>
        <span style={{fontSize:14,fontWeight:500}}>{event.name}</span>
      </div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:24}}>
        <div>
          <h1 style={{fontSize:26,fontWeight:700,margin:0}}>{event.name}</h1>
          {event.venue_name && <p style={{color:'#666',marginTop:4,fontSize:14}}>📍 {event.venue_name}</p>}
        </div>
        <div style={{display:'flex',gap:10}}>
          <button onClick={copyRegLink} style={{padding:'10px 18px',background:'#f3f4f6',border:'none',borderRadius:10,cursor:'pointer',fontSize:13,fontWeight:500}}>📋 نسخ رابط التسجيل</button>
          <span style={{padding:'8px 16px',borderRadius:20,fontSize:13,background:statusColors[event.status],color:statusText[event.status],display:'flex',alignItems:'center'}}>{statusLabels[event.status]}</span>
        </div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14,marginBottom:24}}>
        {[{l:'الزوار المسجلون',v:count,i:'👥',c:'#2B6E64'},{l:'الطاقة الاستيعابية',v:event.max_capacity||'—',i:'🏟',c:'#0891b2'},{l:'نسبة الامتلاء',v:event.max_capacity?Math.round(count/event.max_capacity*100)+'%':'—',i:'📊',c:'#7c3aed'},{l:'تاريخ البداية',v:event.start_date?new Date(event.start_date).toLocaleDateString('ar-SA'):'—',i:'📅',c:'#d97706'}].map(s=>(
          <div key={s.l} style={{background:'#fff',borderRadius:16,padding:20,border:'1px solid #f0f0f0'}}>
            <div style={{fontSize:24,marginBottom:8}}>{s.i}</div>
            <div style={{fontSize:24,fontWeight:700,color:s.c}}>{s.v}</div>
            <div style={{fontSize:12,color:'#666',marginTop:4}}>{s.l}</div>
          </div>
        ))}
      </div>
      <div style={{background:'#fff',borderRadius:16,padding:24,border:'1px solid #f0f0f0'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
          <h2 style={{fontSize:18,fontWeight:700,margin:0}}>آخر الزوار المسجلين</h2>
          <Link href={`/events/${id}/attendees`} style={{color:'#2B6E64',textDecoration:'none',fontSize:13,fontWeight:600}}>عرض الكل ({count})</Link>
        </div>
        {attendees.length === 0 ? (
          <div style={{textAlign:'center',padding:'40px 0',color:'#999'}}>
            <p style={{fontSize:36,margin:'0 0 12px'}}>👥</p>
            <p style={{fontWeight:600,margin:'0 0 8px'}}>لا يوجد زوار مسجلون بعد</p>
            <p style={{fontSize:13,margin:0}}>شارك رابط التسجيل لبدء استقبال المسجلين</p>
          </div>
        ) : (
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {attendees.map(a => (
              <div key={a.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 14px',background:'#f9fafb',borderRadius:10}}>
                <div>
                  <p style={{fontWeight:600,margin:0,fontSize:14}}>{a.full_name}</p>
                  <p style={{color:'#666',margin:0,fontSize:12}}>{a.email || a.phone || '—'}</p>
                </div>
                <span style={{padding:'3px 10px',borderRadius:20,fontSize:11,background:a.status==='checked_in'?'#dcfce7':'#f3f4f6',color:a.status==='checked_in'?'#166534':'#374151'}}>
                  {a.status==='checked_in'?'تم الدخول':'مسجل'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
