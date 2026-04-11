'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState, useMemo } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import Link from 'next/link'

const C = { navy:'#1E0A3C', orange:'#F05537', muted:'#6F7287', border:'#DBDAE3' }

export default function MobileHomePage() {
  const sb = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), [])

  const [user, setUser]         = useState<any>(null)
  const [org,  setOrg]          = useState<any>(null)
  const [stats, setStats]       = useState({ events:0, regs:0, attended:0, revenue:0 })
  const [upcoming, setUpcoming] = useState<any[]>([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    async function load() {
      const { data:{ user:u } } = await sb.auth.getUser()
      setUser(u)
      if (!u) { setLoading(false); return }

      const { data: o } = await sb.from('organizations').select('id,name,logo_url,accent_color').eq('owner_id', u.id).single()
      setOrg(o)
      if (!o) { setLoading(false); return }

      const eventIds = (await sb.from('events').select('id').eq('org_id', o.id)).data?.map((e:any)=>e.id) || []

      const [
        { count: evCount },
        { count: regCount },
        { count: attCount },
        { data: upcomingEvs },
      ] = await Promise.all([
        sb.from('events').select('*',{count:'exact',head:true}).eq('org_id',o.id).eq('status','published'),
        sb.from('registrations').select('*',{count:'exact',head:true}).in('event_id',eventIds.length?eventIds:['x']).neq('status','cancelled'),
        sb.from('registrations').select('*',{count:'exact',head:true}).in('event_id',eventIds.length?eventIds:['x']).eq('status','attended'),
        sb.from('events').select('id,title,start_date,location,capacity,category_icon,price_from')
          .eq('org_id',o.id).eq('status','published')
          .gte('start_date',new Date().toISOString())
          .order('start_date').limit(3),
      ])

      const { data: paidEvs } = await sb.from('events').select('id,price_from').eq('org_id',o.id).gt('price_from',0)
      let rev = 0
      if (paidEvs?.length && regCount) {
        paidEvs.forEach((e:any) => { rev += Number(e.price_from||0) })
      }

      setStats({ events:evCount||0, regs:regCount||0, attended:attCount||0, revenue:rev })
      setUpcoming(upcomingEvs||[])
      setLoading(false)
    }
    load()
  }, [])

  const accent = org?.accent_color || C.orange
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'صباح الخير' : hour < 17 ? 'مساء الخير' : 'مساء النور'

  const QUICK_ACTIONS = [
    { href:'/events/new',  icon:'➕', label:'فعالية جديدة', bg:'#FEF0ED', color:C.orange },
    { href:'/scanner',     icon:'📷', label:'مسح QR',       bg:'#EAF7E0', color:'#166534' },
    { href:'/attendees',   icon:'👥', label:'الحضور',        bg:'#E6F1FB', color:'#185FA5' },
    { href:'/coupons',     icon:'🏷️', label:'كوبونات',      bg:'#EDE9F7', color:'#7B4FBF' },
  ]

  if (loading) return (
    <div style={{ minHeight:'100vh', background:C.navy, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:40, marginBottom:12 }}>🎪</div>
        <p style={{ color:'rgba(255,255,255,.6)', fontFamily:'Tajawal,sans-serif', fontSize:14 }}>جاري التحميل...</p>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight:'100vh', background:'#F5F4FA', direction:'rtl', fontFamily:'Tajawal,sans-serif' }}>

      {/* Hero header */}
      <div style={{
        background:`linear-gradient(135deg,${C.navy},#3D1A78)`,
        padding:'20px 20px 40px', position:'relative', overflow:'hidden'
      }}>
        <div style={{ position:'absolute', top:-40, left:-40, width:200, height:200, borderRadius:'50%', background:'rgba(255,255,255,.04)' }}/>
        <div style={{ position:'absolute', bottom:-60, right:-20, width:160, height:160, borderRadius:'50%', background:'rgba(255,255,255,.03)' }}/>

        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <div>
            <p style={{ color:'rgba(255,255,255,.6)', fontSize:13, margin:'0 0 4px' }}>{greeting} 👋</p>
            <h1 style={{ fontSize:20, fontWeight:800, color:'#fff', margin:0 }}>
              {org?.name || user?.email?.split('@')[0] || 'مدير'}
            </h1>
          </div>
          <div style={{ width:44, height:44, background:accent, borderRadius:12,
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:20, color:'#fff', fontWeight:800 }}>
            {org?.name?.[0] || 'E'}
          </div>
        </div>

        {/* Stats cards */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          {[
            { label:'الفعاليات النشطة', val:stats.events,   icon:'📅', color:'#C4B5FD' },
            { label:'إجمالي التسجيلات', val:stats.regs,     icon:'🎟',  color:'#86EFAC' },
            { label:'حضر فعلاً',         val:stats.attended, icon:'✅', color:'#6EE7B7' },
            { label:'معدل الحضور',        val:stats.regs>0?`${Math.round(stats.attended/stats.regs*100)}%`:'—', icon:'📊', color:'#FCA5A5' },
          ].map(s => (
            <div key={s.label} style={{ background:'rgba(255,255,255,.1)', borderRadius:14, padding:'14px 16px', backdropFilter:'blur(10px)' }}>
              <p style={{ fontSize:11, color:'rgba(255,255,255,.6)', margin:'0 0 6px', fontWeight:600 }}>{s.icon} {s.label}</p>
              <p style={{ fontSize:24, fontWeight:900, color:s.color, margin:0 }}>{s.val}</p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding:'16px', marginTop:-20 }}>

        {/* Quick actions */}
        <div style={{ background:'#fff', borderRadius:18, padding:'18px', marginBottom:16, boxShadow:'0 4px 20px rgba(0,0,0,.06)' }}>
          <h2 style={{ fontSize:14, fontWeight:700, color:C.navy, margin:'0 0 14px' }}>إجراءات سريعة</h2>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            {QUICK_ACTIONS.map(a => (
              <Link key={a.href} href={a.href} style={{
                display:'flex', alignItems:'center', gap:10, padding:'13px 14px',
                background:a.bg, borderRadius:12, textDecoration:'none'
              }}>
                <span style={{ fontSize:22 }}>{a.icon}</span>
                <span style={{ fontSize:13, fontWeight:700, color:a.color }}>{a.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Upcoming events */}
        {upcoming.length > 0 && (
          <div style={{ background:'#fff', borderRadius:18, padding:'18px', marginBottom:16, boxShadow:'0 4px 20px rgba(0,0,0,.06)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
              <h2 style={{ fontSize:14, fontWeight:700, color:C.navy, margin:0 }}>الفعاليات القادمة</h2>
              <Link href="/events" style={{ fontSize:12, color:C.orange, textDecoration:'none', fontWeight:600 }}>عرض الكل ←</Link>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {upcoming.map(ev => {
                const date = new Date(ev.start_date)
                const daysLeft = Math.ceil((date.getTime() - Date.now()) / 86400000)
                return (
                  <Link key={ev.id} href={`/events/${ev.id}`} style={{
                    display:'flex', gap:14, padding:'12px 14px',
                    background:'#F8F7FA', borderRadius:12, textDecoration:'none',
                    alignItems:'center'
                  }}>
                    <div style={{ width:48, height:48, background:`linear-gradient(135deg,${C.navy},#3D1A78)`,
                      borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center',
                      fontSize:22, flexShrink:0 }}>
                      {ev.category_icon || '🎪'}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ fontSize:13, fontWeight:700, color:C.navy, margin:'0 0 3px',
                        overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {ev.title}
                      </p>
                      <p style={{ fontSize:11, color:C.muted, margin:0 }}>
                        {date.toLocaleDateString('ar-SA',{month:'short',day:'numeric'})}
                        {ev.location && ` · ${ev.location.split('،')[0]}`}
                      </p>
                    </div>
                    <div style={{ textAlign:'center', flexShrink:0 }}>
                      <p style={{ fontSize:18, fontWeight:900, color:daysLeft<=3?'#DC2626':C.orange, margin:0 }}>
                        {daysLeft}
                      </p>
                      <p style={{ fontSize:10, color:C.muted, margin:0 }}>يوم</p>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {/* All features grid */}
        <div style={{ background:'#fff', borderRadius:18, padding:'18px', marginBottom:16, boxShadow:'0 4px 20px rgba(0,0,0,.06)' }}>
          <h2 style={{ fontSize:14, fontWeight:700, color:C.navy, margin:'0 0 14px' }}>جميع الميزات</h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10 }}>
            {[
              { href:'/events',        icon:'📅', label:'فعاليات' },
              { href:'/attendees',     icon:'👥', label:'الحضور'  },
              { href:'/scanner',       icon:'📷', label:'الماسح'  },
              { href:'/analytics',     icon:'📊', label:'تقارير'  },
              { href:'/coupons',       icon:'🏷️', label:'كوبونات' },
              { href:'/refunds',       icon:'↩️', label:'استرداد' },
              { href:'/reminders',     icon:'🔔', label:'تذكيرات' },
              { href:'/affiliate',     icon:'🔗', label:'إحالة'   },
              { href:'/staffing',      icon:'💼', label:'كوادر'   },
              { href:'/briefs',        icon:'📋', label:'حملات'   },
              { href:'/contracts',     icon:'📜', label:'عقود'    },
              { href:'/notifications', icon:'📱', label:'إشعارات' },
              { href:'/billing',       icon:'💳', label:'الاشتراك'},
              { href:'/settings',      icon:'⚙️', label:'إعدادات' },
            ].map(item => (
              <Link key={item.href} href={item.href} style={{
                display:'flex', flexDirection:'column', alignItems:'center',
                gap:6, padding:'12px 4px', background:'#F8F7FA',
                borderRadius:12, textDecoration:'none'
              }}>
                <span style={{ fontSize:24 }}>{item.icon}</span>
                <span style={{ fontSize:10, fontWeight:600, color:C.muted, textAlign:'center' }}>{item.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Bottom spacer for nav */}
        <div style={{ height:80 }}/>
      </div>
    </div>
  )
}
