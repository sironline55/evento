'use client'
import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import Link from 'next/link'

const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
const C = { navy:'#1C1C3B', primary:'#F47D31', teal:'#7EC8C8', lavender:'#9B8EC4', card:'#FFFFFF', border:'#F0EDE8', muted:'#8B8FA8' }

const PLAN_COLORS:Record<string,string> = { free:'#8B8FA8', starter:'#7EC8C8', pro:'#F47D31', enterprise:'#9B8EC4' }
const PLAN_LABELS:Record<string,string> = { free:'مجاني', starter:'ستارتر', pro:'برو', enterprise:'إنتربرايز' }
const STATUS_CFG:Record<string,any> = {
  trial:{label:'تجريبي',bg:'#FFF8E8',color:'#B07000'},
  active:{label:'نشط',bg:'#E8F8F0',color:'#1A7A4A'},
  suspended:{label:'معلق',bg:'#FEF2F2',color:'#DC2626'},
  cancelled:{label:'ملغي',bg:'#F3F4F6',color:'#6B7280'},
}

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState({ total:0, active:0, trial:0, suspended:0 })
  const [recent, setRecent] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    try {
      const { data: orgs } = await sb.from('organizations').select('id,name,plan,status,created_at,email,trial_ends_at').order('created_at', { ascending:false })
      const list = orgs || []
      setStats({ total:list.length, active:list.filter(o=>o.status==='active').length, trial:list.filter(o=>o.status==='trial').length, suspended:list.filter(o=>o.status==='suspended').length })
      setRecent(list.slice(0,6))
    } catch(e){ console.error(e) } finally { setLoading(false) }
  }

  const cards = [
    { label:'إجمالي الشركات', value:stats.total, icon:'🏢', color:C.navy },
    { label:'الشركات النشطة', value:stats.active, icon:'✅', color:'#1A7A4A' },
    { label:'التجريبية', value:stats.trial, icon:'⏳', color:'#B07000' },
    { label:'المعلقة', value:stats.suspended, icon:'⛔', color:'#DC2626' },
  ]

  return (
    <div style={{ padding:'28px 24px', direction:'rtl', maxWidth:960, margin:'0 auto' }}>
      <div style={{ marginBottom:28 }}>
        <h1 style={{ fontSize:26, fontWeight:700, margin:0, color:C.navy }}>لوحة تحكم المالك</h1>
        <p style={{ color:C.muted, fontSize:13, marginTop:4 }}>نظرة عامة على المنصة</p>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:28 }}>
        {cards.map(({label,value,icon,color})=>(
          <div key={label} style={{ background:C.card, borderRadius:20, padding:'20px 18px', border:`1px solid ${C.border}`, boxShadow:'0 2px 12px rgba(28,28,59,0.05)' }}>
            <div style={{ fontSize:26, marginBottom:10 }}>{icon}</div>
            <p style={{ fontSize:30, fontWeight:700, color, margin:0 }}>{loading?'—':value}</p>
            <p style={{ fontSize:12, color:C.muted, margin:'4px 0 0', fontWeight:500 }}>{label}</p>
          </div>
        ))}
      </div>

      <div style={{ background:C.card, borderRadius:24, padding:'22px 24px', border:`1px solid ${C.border}` }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
          <h2 style={{ fontSize:17, fontWeight:700, margin:0, color:C.navy }}>آخر الشركات المسجلة</h2>
          <Link href="/super-admin/organizations" style={{ fontSize:13, color:C.primary, textDecoration:'none', fontWeight:600, padding:'6px 14px', background:'#FFF3EC', borderRadius:50 }}>عرض الكل ←</Link>
        </div>
        {loading ? <div style={{ textAlign:'center', padding:'32px 0', color:C.muted }}>جاري التحميل...</div>
        : recent.length===0 ? (
          <div style={{ textAlign:'center', padding:'40px 0', color:C.muted }}>
            <p style={{ fontSize:36, margin:'0 0 12px' }}>🏢</p>
            <p style={{ fontWeight:600 }}>لا توجد شركات مسجلة بعد</p>
            <Link href="/super-admin/organizations/new" style={{ display:'inline-block', marginTop:12, background:C.primary, color:'#fff', padding:'10px 22px', borderRadius:50, textDecoration:'none', fontWeight:700, fontSize:13 }}>＋ أضف أول شركة</Link>
          </div>
        ) : (
          <>
            <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr 1fr', padding:'8px 12px', background:'#F9F8F6', borderRadius:10, marginBottom:4, fontSize:11, fontWeight:600, color:C.muted }}>
              <span>الشركة</span><span>الباقة</span><span>الحالة</span><span>تنتهي التجربة</span><span>إجراءات</span>
            </div>
            {recent.map((org,i)=>{
              const s=STATUS_CFG[org.status]||STATUS_CFG.trial
              return (
                <div key={org.id} style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr 1fr', padding:'14px 12px', alignItems:'center', borderBottom:i<recent.length-1?`1px solid ${C.border}`:'none' }}>
                  <div>
                    <p style={{ fontWeight:600, fontSize:14, margin:0, color:C.navy }}>{org.name}</p>
                    {org.email&&<p style={{ fontSize:11, color:C.muted, margin:'2px 0 0' }}>{org.email}</p>}
                  </div>
                  <span style={{ fontSize:12, fontWeight:600, color:PLAN_COLORS[org.plan]||C.muted }}>{PLAN_LABELS[org.plan]||org.plan}</span>
                  <span style={{ display:'inline-block', padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:600, background:s.bg, color:s.color }}>{s.label}</span>
                  <span style={{ fontSize:12, color:C.muted }}>{org.trial_ends_at?new Date(org.trial_ends_at).toLocaleDateString('ar-SA'):'—'}</span>
                  <Link href={`/super-admin/organizations/${org.id}`} style={{ fontSize:12, color:C.primary, textDecoration:'none', fontWeight:600, padding:'5px 12px', background:'#FFF3EC', borderRadius:50, display:'inline-block' }}>إدارة →</Link>
                </div>
              )
            })}
          </>
        )}
      </div>
    </div>
  )
}
