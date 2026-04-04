'use client'
import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import Link from 'next/link'

const sb = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const C = {
  navy:'#1E0A3C', orange:'#F05537', text:'#39364F',
  muted:'#6F7287', border:'#DBDAE3', bg:'#FAFAFA', card:'#FFFFFF', green:'#3A7D0A'
}

const STATUS: Record<string,{label:string;color:string;bg:string}> = {
  draft:     {label:'مسودة',  color:'#6F7287', bg:'#F8F7FA'},
  published: {label:'نشط',   color:'#3A7D0A', bg:'#EAF7E0'},
  active:    {label:'نشط',   color:'#3A7D0A', bg:'#EAF7E0'},
  completed: {label:'منتهي', color:'#6F7287', bg:'#F8F7FA'},
  cancelled: {label:'ملغي',  color:'#C6341A', bg:'#FDEDEA'},
}

export default function DashboardPage() {
  const [user, setUser]     = useState<any>(null)
  const [stats, setStats]   = useState({ events:0, registrations:0, attended:0 })
  const [recent, setRecent] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    sb.auth.getUser().then(({data}) => setUser(data.user))
    Promise.all([
      sb.from('events').select('*',{count:'exact',head:true}),
      sb.from('registrations').select('*',{count:'exact',head:true}),
      sb.from('registrations').select('*',{count:'exact',head:true}).eq('status','attended'),
      sb.from('events').select('id,title,start_date,status,location').order('created_at',{ascending:false}).limit(5)
    ]).then(([ev,reg,att,rec])=>{
      setStats({events:ev.count||0, registrations:reg.count||0, attended:att.count||0})
      setRecent(rec.data||[])
      setLoading(false)
    })
  },[])

  const name = user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'مرحباً'

  return (
    <div style={{minHeight:'100vh', background:C.bg, direction:'rtl'}}>

      {/* ── Header (Eventbrite-style big bold welcome) ── */}
      <div style={{background:C.card, borderBottom:`1px solid ${C.border}`, padding:'32px 32px 28px'}}>
        <h1 style={{fontSize:40, fontWeight:800, margin:0, color:C.navy, letterSpacing:'-1px'}}>
          أهلاً، {name}
        </h1>
        <p style={{color:C.muted, fontSize:13, marginTop:6}}>
          {new Date().toLocaleDateString('ar-SA',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}
        </p>
      </div>

      <div style={{padding:'28px 32px'}}>

        {/* ── Stats row ── */}
        <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:28}}>
          {[
            {label:'إجمالي الفعاليات',  value:stats.events,        icon:'📅', href:'/events'},
            {label:'إجمالي التسجيلات', value:stats.registrations,  icon:'🎟', href:'/attendees'},
            {label:'حضروا الفعاليات',  value:stats.attended,       icon:'✅', href:'/attendees'},
          ].map(({label,value,icon,href})=>(
            <Link key={label} href={href} style={{textDecoration:'none'}}>
              <div style={{background:C.card, border:`1px solid ${C.border}`, borderRadius:8, padding:'20px 22px',
                transition:'border-color 0.15s, box-shadow 0.15s', cursor:'pointer'}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor='#B4A7D6';e.currentTarget.style.boxShadow='0 2px 12px rgba(0,0,0,0.07)'}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.boxShadow='none'}}>
                <div style={{fontSize:22, marginBottom:12}}>{icon}</div>
                <p style={{fontSize:32, fontWeight:800, color:C.navy, margin:'0 0 4px'}}>{loading?'—':value.toLocaleString('ar-SA')}</p>
                <p style={{fontSize:13, color:C.muted, margin:0}}>{label}</p>
              </div>
            </Link>
          ))}
        </div>

        <div style={{display:'grid', gridTemplateColumns:'1fr 300px', gap:24, alignItems:'start'}}>

          {/* ── Left: Create cards + recent events ── */}
          <div>
            {/* Create cards */}
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:24}}>
              {[
                {title:'إنشاء من الصفر', desc:'أضف تفاصيل فعالتك وأنشئ التذاكر يدوياً', icon:'✏️', href:'/events/new'},
                {title:'استعراض الفعاليات', desc:'راجع فعالياتك وتتبع التسجيلات', icon:'📋', href:'/events'},
              ].map(card=>(
                <Link key={card.title} href={card.href} style={{textDecoration:'none'}}>
                  <div style={{background:C.card, border:`1px solid ${C.border}`, borderRadius:8, padding:'28px 22px',
                    textAlign:'center', cursor:'pointer', transition:'border-color 0.15s, box-shadow 0.15s'}}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor='#B4A7D6';e.currentTarget.style.boxShadow='0 2px 12px rgba(0,0,0,0.08)'}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.boxShadow='none'}}>
                    <div style={{fontSize:36, marginBottom:16}}>{card.icon}</div>
                    <h3 style={{fontSize:15, fontWeight:600, color:C.text, margin:'0 0 8px'}}>{card.title}</h3>
                    <p style={{fontSize:13, color:C.muted, margin:'0 0 20px', lineHeight:1.5}}>{card.desc}</p>
                    <span style={{padding:'8px 18px', border:`1px solid ${C.border}`, borderRadius:6, fontSize:13, fontWeight:600, color:C.text}}>
                      {card.title.includes('إنشاء') ? 'إنشاء فعالية' : 'عرض الفعاليات'}
                    </span>
                  </div>
                </Link>
              ))}
            </div>

            {/* Recent events */}
            {recent.length > 0 && (
              <div style={{background:C.card, border:`1px solid ${C.border}`, borderRadius:8, overflow:'hidden'}}>
                <div style={{padding:'14px 20px', borderBottom:`1px solid ${C.border}`, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                  <h2 style={{fontSize:16, fontWeight:700, margin:0, color:C.navy}}>آخر الفعاليات</h2>
                  <Link href="/events" style={{fontSize:13, color:C.orange, textDecoration:'none', fontWeight:600}}>عرض الكل</Link>
                </div>
                {/* Table header */}
                <div style={{display:'grid', gridTemplateColumns:'3fr 1fr 1fr', padding:'8px 20px', fontSize:11, fontWeight:700, color:C.muted, letterSpacing:'0.06em', textTransform:'uppercase', background:'#F9F8F6'}}>
                  <span>الفعالية</span><span>التاريخ</span><span>الحالة</span>
                </div>
                {recent.map((ev,i)=>{
                  const s = STATUS[ev.status] || STATUS.draft
                  const mo = ev.start_date ? new Date(ev.start_date).toLocaleDateString('ar-SA',{month:'short'}).toUpperCase() : ''
                  const day = ev.start_date ? new Date(ev.start_date).getDate() : ''
                  return (
                    <Link key={ev.id} href={`/events/${ev.id}`} style={{textDecoration:'none'}}>
                      <div style={{display:'grid', gridTemplateColumns:'3fr 1fr 1fr', padding:'13px 20px', alignItems:'center',
                        borderBottom:i<recent.length-1?`1px solid ${C.border}`:'none', transition:'background 0.12s'}}
                        onMouseEnter={e=>(e.currentTarget.style.background='#F8F7FA')}
                        onMouseLeave={e=>(e.currentTarget.style.background='transparent')}>
                        <div style={{display:'flex', alignItems:'center', gap:14}}>
                          <div style={{width:44, textAlign:'center', flexShrink:0}}>
                            <div style={{fontSize:9, fontWeight:800, color:C.orange, letterSpacing:'0.1em'}}>{mo}</div>
                            <div style={{fontSize:22, fontWeight:800, color:C.navy, lineHeight:1}}>{day||'—'}</div>
                          </div>
                          <p style={{fontWeight:700, fontSize:14, margin:0, color:C.navy}}>{ev.title}</p>
                        </div>
                        <div style={{fontSize:12, color:C.muted}}>
                          {ev.start_date?new Date(ev.start_date).toLocaleDateString('ar-SA',{month:'short',day:'numeric'}):'—'}
                        </div>
                        <span style={{display:'inline-block', padding:'3px 10px', borderRadius:4, fontSize:11, fontWeight:600, background:s.bg, color:s.color}}>
                          {s.label}
                        </span>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}

            {recent.length === 0 && !loading && (
              <div style={{background:C.card, border:`1px solid ${C.border}`, borderRadius:8, padding:'48px 24px', textAlign:'center'}}>
                <div style={{fontSize:56, marginBottom:16}}>📅</div>
                <h2 style={{fontSize:20, fontWeight:700, color:C.navy, margin:'0 0 8px'}}>لا توجد فعاليات بعد</h2>
                <p style={{color:C.muted, margin:'0 0 20px'}}>ابدأ بإنشاء أول فعالية الآن</p>
                <Link href="/events/new" style={{display:'inline-block', background:C.orange, color:'#fff', padding:'11px 24px', borderRadius:6, textDecoration:'none', fontWeight:700, fontSize:14}}>
                  + إنشاء فعالية
                </Link>
              </div>
            )}
          </div>

          {/* ── Right: Organizer profile panel ── */}
          <div style={{background:C.card, border:`1px solid ${C.border}`, borderRadius:8, padding:20, position:'sticky', top:20}}>
            <div style={{width:60, height:60, background:'#E8E8ED', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:12, fontSize:28}}>
              🎪
            </div>
            <h3 style={{fontSize:17, fontWeight:700, color:C.navy, margin:'0 0 4px'}}>{name}</h3>
            <div style={{display:'flex', gap:12, marginBottom:16}}>
              <Link href="/settings" style={{background:'none', border:'none', color:C.orange, cursor:'pointer', fontWeight:600, fontSize:13, textDecoration:'none'}}>عرض</Link>
              <Link href="/settings" style={{background:'none', border:'none', color:C.orange, cursor:'pointer', fontWeight:600, fontSize:13, textDecoration:'none'}}>تعديل</Link>
            </div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, paddingTop:16, borderTop:`1px solid ${C.border}`}}>
              <div>
                <div style={{fontSize:22, fontWeight:800, color:C.navy}}>{loading?'—':stats.events}</div>
                <div style={{fontSize:12, color:C.muted}}>الفعاليات</div>
              </div>
              <div>
                <div style={{fontSize:22, fontWeight:800, color:C.navy}}>{loading?'—':stats.registrations}</div>
                <div style={{fontSize:12, color:C.muted}}>التسجيلات</div>
              </div>
            </div>
            <div style={{marginTop:16, paddingTop:16, borderTop:`1px solid ${C.border}`}}>
              <Link href="/events/new" style={{display:'block', textAlign:'center', background:C.orange, color:'#fff', padding:'10px', borderRadius:6, textDecoration:'none', fontWeight:700, fontSize:14}}>
                + إنشاء فعالية
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
