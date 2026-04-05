'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import Link from 'next/link'

const sb = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const C = {
  navy:'#1E0A3C', orange:'#F05537', text:'#39364F',
  muted:'#6F7287', border:'#DBDAE3', bg:'#FAFAFA', card:'#FFFFFF'
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState({
    totalEvents:0, totalRegs:0, attended:0, pending:0, cancelled:0
  })
  const [recentEvents, setRecentEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      sb.from('events').select('*',{count:'exact',head:true}),
      sb.from('registrations').select('*',{count:'exact',head:true}),
      sb.from('registrations').select('*',{count:'exact',head:true}).eq('status','attended'),
      sb.from('registrations').select('*',{count:'exact',head:true}).eq('status','pending'),
      sb.from('registrations').select('*',{count:'exact',head:true}).eq('status','cancelled'),
      sb.from('events').select('id,title,start_date,status,capacity').order('created_at',{ascending:false}).limit(10),
    ]).then(([ev,reg,att,pend,canc,recent]) => {
      setStats({
        totalEvents: ev.count||0,
        totalRegs:   reg.count||0,
        attended:    att.count||0,
        pending:     pend.count||0,
        cancelled:   canc.count||0,
      })
      setRecentEvents(recent.data||[])
      setLoading(false)
    })
  },[])

  const attendRate = stats.totalRegs > 0
    ? Math.round((stats.attended / stats.totalRegs) * 100)
    : 0

  const cards = [
    { label:'إجمالي الفعاليات',  value:stats.totalEvents, icon:'📅', color:C.navy },
    { label:'إجمالي التسجيلات', value:stats.totalRegs,   icon:'🎟', color:C.orange },
    { label:'نسبة الحضور',       value:`${attendRate}%`,  icon:'✅', color:'#3A7D0A' },
    { label:'قيد الانتظار',      value:stats.pending,     icon:'⏳', color:'#B07000' },
  ]

  return (
    <div style={{minHeight:'100vh', background:C.bg, direction:'rtl'}}>
      <div style={{background:C.card, borderBottom:`1px solid ${C.border}`, padding:'24px 32px'}}>
        <h1 style={{fontSize:40, fontWeight:800, margin:0, color:C.navy, letterSpacing:'-1px'}}>التقارير</h1>
        <p style={{color:C.muted, fontSize:13, marginTop:4}}>إحصاءات شاملة عن فعالياتك</p>
      </div>

      <div style={{maxWidth:960, margin:'0 auto', padding:'28px 24px'}}>
        {/* Stat cards */}
        <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:28}}>
          {cards.map(({label,value,icon,color}) => (
            <div key={label} style={{background:C.card, border:`1px solid ${C.border}`, borderRadius:8, padding:'20px 22px'}}>
              <div style={{fontSize:24, marginBottom:10}}>{icon}</div>
              <p style={{fontSize:30, fontWeight:800, color, margin:'0 0 4px'}}>{loading?'—':value}</p>
              <p style={{fontSize:13, color:C.muted, margin:0}}>{label}</p>
            </div>
          ))}
        </div>

        {/* Attendance breakdown */}
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:24}}>
          {/* Status breakdown */}
          <div style={{background:C.card, border:`1px solid ${C.border}`, borderRadius:8, padding:22}}>
            <h2 style={{fontSize:16, fontWeight:700, color:C.navy, margin:'0 0 18px'}}>توزيع التسجيلات</h2>
            {[
              {label:'حضر',          value:stats.attended,   color:'#3A7D0A', bg:'#EAF7E0'},
              {label:'قيد الانتظار', value:stats.pending,    color:'#B07000', bg:'#FFF8E8'},
              {label:'ملغي',         value:stats.cancelled,  color:'#DC2626', bg:'#FEF2F2'},
            ].map(({label,value,color,bg}) => (
              <div key={label} style={{display:'flex', justifyContent:'space-between', alignItems:'center',
                padding:'10px 14px', borderRadius:8, background:bg, marginBottom:8}}>
                <span style={{fontSize:14, fontWeight:600, color}}>{label}</span>
                <span style={{fontSize:20, fontWeight:800, color}}>{loading?'—':value}</span>
              </div>
            ))}
          </div>

          {/* Attendance rate visual */}
          <div style={{background:C.card, border:`1px solid ${C.border}`, borderRadius:8, padding:22, textAlign:'center'}}>
            <h2 style={{fontSize:16, fontWeight:700, color:C.navy, margin:'0 0 18px'}}>معدل الحضور</h2>
            <div style={{position:'relative', width:140, height:140, margin:'0 auto'}}>
              <svg viewBox="0 0 140 140" style={{transform:'rotate(-90deg)'}}>
                <circle cx="70" cy="70" r="56" fill="none" stroke={C.border} strokeWidth="16"/>
                <circle cx="70" cy="70" r="56" fill="none" stroke={C.orange}
                  strokeWidth="16" strokeLinecap="round"
                  strokeDasharray={`${(attendRate/100)*351.86} 351.86`}/>
              </svg>
              <div style={{position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column'}}>
                <span style={{fontSize:28, fontWeight:800, color:C.navy}}>{loading?'—':`${attendRate}%`}</span>
                <span style={{fontSize:11, color:C.muted}}>حضور</span>
              </div>
            </div>
            <p style={{color:C.muted, fontSize:13, marginTop:16}}>
              {loading?'—':`${stats.attended} من ${stats.totalRegs} مسجّل`}
            </p>
          </div>
        </div>

        {/* Events table */}
        <div style={{background:C.card, border:`1px solid ${C.border}`, borderRadius:8, overflow:'hidden'}}>
          <div style={{padding:'14px 20px', borderBottom:`1px solid ${C.border}`, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            <h2 style={{fontSize:16, fontWeight:700, margin:0, color:C.navy}}>الفعاليات</h2>
            <Link href="/events" style={{fontSize:13, color:C.orange, textDecoration:'none', fontWeight:600}}>إدارة الفعاليات</Link>
          </div>
          {loading ? (
            <div style={{padding:'40px', textAlign:'center', color:C.muted}}>جاري التحميل...</div>
          ) : recentEvents.length === 0 ? (
            <div style={{padding:'40px', textAlign:'center', color:C.muted}}>
              <p style={{fontSize:36, margin:'0 0 8px'}}>📅</p>
              <p>لا توجد فعاليات بعد</p>
              <Link href="/events/new" style={{color:C.orange, fontWeight:600, fontSize:13}}>إنشاء فعالية ←</Link>
            </div>
          ) : (
            <>
              <div style={{display:'grid', gridTemplateColumns:'2fr 1fr 1fr 80px',
                padding:'8px 20px', fontSize:11, fontWeight:700, color:C.muted,
                letterSpacing:'0.06em', textTransform:'uppercase', background:'#F9F8F6'}}>
                <span>الفعالية</span><span>التاريخ</span><span>الطاقة</span><span>الحالة</span>
              </div>
              {recentEvents.map((ev,i) => {
                const statusStyle: Record<string,{label:string;color:string;bg:string}> = {
                  draft:     {label:'مسودة',  color:'#6F7287', bg:'#F8F7FA'},
                  published: {label:'نشط',   color:'#3A7D0A', bg:'#EAF7E0'},
                  active:    {label:'نشط',   color:'#3A7D0A', bg:'#EAF7E0'},
                  completed: {label:'منتهي', color:'#6F7287', bg:'#F8F7FA'},
                  cancelled: {label:'ملغي',  color:'#C6341A', bg:'#FDEDEA'},
                }
                const s = statusStyle[ev.status] || statusStyle.draft
                return (
                  <Link key={ev.id} href={`/events/${ev.id}`} style={{textDecoration:'none'}}>
                    <div style={{display:'grid', gridTemplateColumns:'2fr 1fr 1fr 80px',
                      padding:'12px 20px', alignItems:'center',
                      borderBottom:i<recentEvents.length-1?`1px solid ${C.border}`:'none',
                      transition:'background 0.12s'}}
                      onMouseEnter={e=>(e.currentTarget.style.background='#F8F7FA')}
                      onMouseLeave={e=>(e.currentTarget.style.background='transparent')}>
                      <p style={{fontWeight:700, fontSize:14, margin:0, color:C.navy}}>{ev.title}</p>
                      <p style={{fontSize:12, color:C.muted, margin:0}}>
                        {ev.start_date?new Date(ev.start_date).toLocaleDateString('ar-SA',{month:'short',day:'numeric'}):'—'}
                      </p>
                      <p style={{fontSize:12, color:C.text, margin:0}}>{ev.capacity??'غير محدود'}</p>
                      <span style={{display:'inline-block', padding:'3px 8px', borderRadius:4,
                        fontSize:11, fontWeight:600, background:s.bg, color:s.color}}>{s.label}</span>
                    </div>
                  </Link>
                )
              })}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
