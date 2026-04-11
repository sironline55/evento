'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect, useMemo } from 'react'
import { createBrowserClient } from '@supabase/ssr'

const C = { navy:'#1E0A3C', orange:'#F05537', text:'#39364F', muted:'#6F7287', border:'#DBDAE3', bg:'#F4F3F8', card:'#FFFFFF', green:'#16a34a', red:'#DC2626', purple:'#7C3AED' }

export default function SuperAdminDashboard() {
  const sb = useMemo(() => createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!), [])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ orgs:0, users:0, events:0, registrations:0, coupons:0, couponUses:0, activeEvents:0, revenue:0 })
  const [recentEvents, setRecentEvents] = useState<any[]>([])
  const [recentOrgs, setRecentOrgs]     = useState<any[]>([])
  const [topCoupons, setTopCoupons]     = useState<any[]>([])

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const [
        { count: orgCount },
        { count: userCount },
        { count: eventCount },
        { count: regCount },
        { count: couponCount },
        { count: couponUseCount },
        { data: evData },
        { data: orgData },
        { data: cpData },
      ] = await Promise.all([
        sb.from('organizations').select('*', { count:'exact', head:true }),
        sb.from('profiles').select('*', { count:'exact', head:true }),
        sb.from('events').select('*', { count:'exact', head:true }),
        sb.from('registrations').select('*', { count:'exact', head:true }),
        sb.from('coupons').select('*', { count:'exact', head:true }),
        sb.from('coupon_uses').select('*', { count:'exact', head:true }),
        sb.from('events').select('id,title,status,start_date,created_at').order('created_at',{ascending:false}).limit(5),
        sb.from('organizations').select('id,name,status,created_at').order('created_at',{ascending:false}).limit(5),
        sb.from('coupons').select('id,code,used_count,max_uses,discount_type,discount_value').order('used_count',{ascending:false}).limit(5),
      ])
      setStats({ orgs:orgCount||0, users:userCount||0, events:eventCount||0, registrations:regCount||0, coupons:couponCount||0, couponUses:couponUseCount||0, activeEvents:0, revenue:0 })
      setRecentEvents(evData||[])
      setRecentOrgs(orgData||[])
      setTopCoupons(cpData||[])
    } finally { setLoading(false) }
  }

  const statCards = [
    { label:'المنظمات',    val:stats.orgs,          icon:'🏢', color:C.navy,   href:'/super-admin/organizations' },
    { label:'المستخدمون',  val:stats.users,         icon:'👥', color:C.purple, href:'/super-admin/users' },
    { label:'الفعاليات',   val:stats.events,        icon:'🎪', color:C.orange, href:'/super-admin/events' },
    { label:'التسجيلات',   val:stats.registrations, icon:'✅', color:C.green,  href:'/super-admin/events' },
    { label:'الكوبونات',   val:stats.coupons,       icon:'🏷️', color:'#0891B2', href:'/super-admin/coupons' },
    { label:'استخدام الكوبونات', val:stats.couponUses, icon:'🔢', color:'#D97706', href:'/super-admin/coupons' },
  ]

  if (loading) return (
    <div style={{ padding:40, display:'flex', alignItems:'center', justifyContent:'center', minHeight:'60vh' }}>
      <div style={{ textAlign:'center' }}><div style={{ fontSize:36, marginBottom:12 }}>⏳</div><p style={{ color:C.muted }}>جاري تحميل البيانات...</p></div>
    </div>
  )

  return (
    <div style={{ padding:'28px 32px', direction:'rtl' }}>
      {/* Header */}
      <div style={{ marginBottom:28 }}>
        <h1 style={{ fontSize:24, fontWeight:800, color:C.navy, margin:'0 0 4px' }}>📊 لوحة التحكم العامة</h1>
        <p style={{ color:C.muted, fontSize:13, margin:0 }}>نظرة شاملة على منصة EventVMS — {new Date().toLocaleDateString('ar-SA',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</p>
      </div>

      {/* Stats grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:28 }}>
        {statCards.map(({ label, val, icon, color, href }) => (
          <a key={label} href={href} style={{ textDecoration:'none' }}>
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:'20px 22px', cursor:'pointer', transition:'all 0.15s', borderTop:`3px solid ${color}` }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                <div>
                  <p style={{ fontSize:11, color:C.muted, margin:'0 0 6px', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.04em' }}>{label}</p>
                  <p style={{ fontSize:32, fontWeight:900, color, margin:0, lineHeight:1 }}>{val.toLocaleString('ar-SA')}</p>
                </div>
                <div style={{ fontSize:28, opacity:0.8 }}>{icon}</div>
              </div>
            </div>
          </a>
        ))}
      </div>

      {/* Recent data - 3 columns */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:18 }}>

        {/* Recent events */}
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14 }}>
          <div style={{ padding:'16px 18px', borderBottom:`1px solid ${C.border}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <h3 style={{ fontSize:14, fontWeight:700, color:C.navy, margin:0 }}>🎪 آخر الفعاليات</h3>
            <a href="/super-admin/events" style={{ fontSize:11, color:C.orange, textDecoration:'none', fontWeight:600 }}>عرض الكل</a>
          </div>
          {recentEvents.length === 0 ? (
            <div style={{ padding:'30px 18px', textAlign:'center', color:C.muted, fontSize:12 }}>لا توجد فعاليات</div>
          ) : recentEvents.map(ev => (
            <div key={ev.id} style={{ padding:'12px 18px', borderBottom:`1px solid ${C.border}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div style={{ minWidth:0, flex:1 }}>
                <p style={{ fontSize:13, fontWeight:600, color:C.text, margin:'0 0 2px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{ev.title}</p>
                <p style={{ fontSize:11, color:C.muted, margin:0 }}>{ev.start_date ? new Date(ev.start_date).toLocaleDateString('ar-SA') : '—'}</p>
              </div>
              <span style={{ fontSize:10, padding:'2px 8px', borderRadius:50, background: ev.status==='published'?'#DCFCE7':'#F3F4F6', color: ev.status==='published'?C.green:C.muted, fontWeight:600, flexShrink:0, marginRight:8 }}>
                {ev.status==='published'?'منشور':'مسودة'}
              </span>
            </div>
          ))}
        </div>

        {/* Recent orgs */}
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14 }}>
          <div style={{ padding:'16px 18px', borderBottom:`1px solid ${C.border}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <h3 style={{ fontSize:14, fontWeight:700, color:C.navy, margin:0 }}>🏢 آخر المنظمات</h3>
            <a href="/super-admin/organizations" style={{ fontSize:11, color:C.orange, textDecoration:'none', fontWeight:600 }}>عرض الكل</a>
          </div>
          {recentOrgs.length === 0 ? (
            <div style={{ padding:'30px 18px', textAlign:'center', color:C.muted, fontSize:12 }}>لا توجد منظمات</div>
          ) : recentOrgs.map(org => (
            <div key={org.id} style={{ padding:'12px 18px', borderBottom:`1px solid ${C.border}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div style={{ minWidth:0, flex:1 }}>
                <p style={{ fontSize:13, fontWeight:600, color:C.text, margin:'0 0 2px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{org.name}</p>
                <p style={{ fontSize:11, color:C.muted, margin:0 }}>{new Date(org.created_at).toLocaleDateString('ar-SA')}</p>
              </div>
              <span style={{ fontSize:10, padding:'2px 8px', borderRadius:50, background: org.status==='active'?'#DCFCE7':'#FEF3C7', color: org.status==='active'?C.green:'#92400E', fontWeight:600, flexShrink:0, marginRight:8 }}>
                {org.status==='active'?'نشط':'تجريبي'}
              </span>
            </div>
          ))}
        </div>

        {/* Top coupons */}
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14 }}>
          <div style={{ padding:'16px 18px', borderBottom:`1px solid ${C.border}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <h3 style={{ fontSize:14, fontWeight:700, color:C.navy, margin:0 }}>🏷️ أكثر الكوبونات استخداماً</h3>
            <a href="/super-admin/coupons" style={{ fontSize:11, color:C.orange, textDecoration:'none', fontWeight:600 }}>عرض الكل</a>
          </div>
          {topCoupons.length === 0 ? (
            <div style={{ padding:'30px 18px', textAlign:'center', color:C.muted, fontSize:12 }}>لا توجد كوبونات</div>
          ) : topCoupons.map(cp => (
            <div key={cp.id} style={{ padding:'12px 18px', borderBottom:`1px solid ${C.border}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <code style={{ fontSize:12, fontWeight:700, color:C.navy, background:'#F3F0F8', padding:'2px 7px', borderRadius:5 }}>{cp.code}</code>
                <p style={{ fontSize:11, color:C.muted, margin:'3px 0 0' }}>{cp.discount_type==='percentage'?`${cp.discount_value}%`:`${cp.discount_value} ر.س`}</p>
              </div>
              <div style={{ textAlign:'left' }}>
                <p style={{ fontSize:14, fontWeight:700, color:C.orange, margin:0 }}>{cp.used_count}</p>
                <p style={{ fontSize:10, color:C.muted, margin:0 }}>استخدام{cp.max_uses?` / ${cp.max_uses}`:''}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
