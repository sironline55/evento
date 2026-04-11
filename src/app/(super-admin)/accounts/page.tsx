'use client'
import { useEffect, useState, useMemo } from 'react'
import { createBrowserClient } from '@supabase/ssr'

const C = {
  navy:'#1E0A3C', orange:'#F05537', text:'#39364F',
  muted:'#6F7287', border:'#DBDAE3', bg:'#FAFAFA', card:'#FFFFFF',
  green:'#3A7D0A', red:'#DC2626'
}
const inp: React.CSSProperties = {
  width:'100%', padding:'9px 12px', border:`1px solid ${C.border}`, borderRadius:7,
  fontSize:13, outline:'none', fontFamily:'inherit', color:C.text,
  background:C.card, boxSizing:'border-box'
}
const lbl: React.CSSProperties = { fontSize:11, fontWeight:700, color:C.muted, display:'block', marginBottom:4, textTransform:'uppercase', letterSpacing:'.5px' }

// ── Plan definitions ──────────────────────────────────────────────────────────
const PLANS: Record<string, {
  label: string
  labelEn: string
  color: string
  bg: string
  price: string
  max_members: number|null
  max_events: number|null
  max_attendees: number|null
  features: Record<string, boolean>
}> = {
  free: {
    label:'مجاني', labelEn:'Free', color:'#6F7287', bg:'#F1F1F1', price:'0 ريال',
    max_members:5, max_events:3, max_attendees:100,
    features:{ org_identity:false, catalog:false, white_label:false, api_access:false, nafath:false }
  },
  gold: {
    label:'ذهبي', labelEn:'Gold', color:'#B07000', bg:'#FFFBEB', price:'149 ريال/شهر',
    max_members:10, max_events:20, max_attendees:500,
    features:{ org_identity:true, catalog:false, white_label:false, api_access:false, nafath:false }
  },
  platinum: {
    label:'بلاتيني', labelEn:'Platinum', color:'#5B3FA0', bg:'#F5F0FF', price:'399 ريال/شهر',
    max_members:25, max_events:100, max_attendees:2000,
    features:{ org_identity:true, catalog:true, white_label:false, api_access:false, nafath:true }
  },
  enterprise: {
    label:'مؤسسي', labelEn:'Enterprise', color:'#1E0A3C', bg:'#E8E4F0', price:'تواصل معنا',
    max_members:null, max_events:null, max_attendees:null,
    features:{ org_identity:true, catalog:true, white_label:true, api_access:true, nafath:true }
  }
}

const FEATURE_LABELS: Record<string, string> = {
  org_identity: '🪪 هوية المؤسسة',
  catalog:      '🌐 الكتالوج العام',
  white_label:  '🏷️ White Label',
  api_access:   '🔌 API Access',
  nafath:       '🔐 نفاذ',
}

type Org = {
  id: string
  name: string
  name_ar: string|null
  email: string|null
  plan: string|null
  status: string|null
  max_members: number|null
  max_events: number|null
  max_attendees_per_event: number|null
  features: Record<string,boolean>|null
  created_at: string
  owner_id: string|null
  member_count?: number
  event_count?: number
}

export default function SuperAdminAccounts() {
  const sb = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), [])

  const [orgs, setOrgs] = useState<Org[]>([])
  const [loading, setLoading] = useState(true)
  const [changing, setChanging] = useState<string|null>(null) // org id being updated
  const [toast, setToast]   = useState<{msg:string; ok:boolean}|null>(null)
  const [search, setSearch] = useState('')
  const [filterPlan, setFilterPlan] = useState('all')
  const [selected, setSelected] = useState<Org|null>(null) // detail modal

  const showToast = (msg: string, ok=true) => {
    setToast({msg, ok})
    setTimeout(() => setToast(null), 3000)
  }

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    const { data: orgsData } = await sb.from('organizations').select('*').order('created_at', { ascending:false })
    if (!orgsData) { setLoading(false); return }

    // Enrich with counts
    const enriched: Org[] = await Promise.all(orgsData.map(async o => {
      const [{ count: mc }, { count: ec }] = await Promise.all([
        sb.from('org_members').select('id', { count:'exact', head:true }).eq('org_id', o.id).eq('status','active'),
        sb.from('events').select('id', { count:'exact', head:true }).eq('org_id', o.id),
      ])
      return { ...o, member_count: mc||0, event_count: ec||0 }
    }))
    setOrgs(enriched)
    setLoading(false)
  }

  async function changePlan(org: Org, newPlan: string) {
    const def = PLANS[newPlan]
    if (!def) return
    setChanging(org.id)
    const { error } = await sb.from('organizations').update({
      plan:                    newPlan,
      max_members:             def.max_members,
      max_events:              def.max_events,
      max_attendees_per_event: def.max_attendees,
      features:                def.features,
      updated_at:              new Date().toISOString(),
    }).eq('id', org.id)

    if (!error) {
      setOrgs(prev => prev.map(o => o.id===org.id
        ? { ...o, plan:newPlan, max_members:def.max_members, max_events:def.max_events,
            max_attendees_per_event:def.max_attendees, features:def.features }
        : o
      ))
      if (selected?.id === org.id) setSelected(s => s ? {...s, plan:newPlan, features:def.features} : null)
      showToast(`✅ تمت الترقية إلى باقة ${def.label}`)
    } else {
      showToast(`❌ خطأ: ${error.message}`, false)
    }
    setChanging(null)
  }

  async function toggleFeature(org: Org, feat: string) {
    const current = org.features || {}
    const updated = { ...current, [feat]: !current[feat] }
    setChanging(org.id)
    const { error } = await sb.from('organizations').update({ features: updated }).eq('id', org.id)
    if (!error) {
      setOrgs(prev => prev.map(o => o.id===org.id ? {...o, features: updated} : o))
      if (selected?.id === org.id) setSelected(s => s ? {...s, features: updated} : null)
      showToast(`✅ تم تحديث الميزة`)
    } else {
      showToast(`❌ ${error.message}`, false)
    }
    setChanging(null)
  }

  const filtered = orgs.filter(o => {
    const matchSearch = !search || (o.name+o.name_ar+o.email).toLowerCase().includes(search.toLowerCase())
    const matchPlan   = filterPlan==='all' || o.plan===filterPlan
    return matchSearch && matchPlan
  })

  const stats = {
    total:      orgs.length,
    active:     orgs.filter(o=>o.status==='active').length,
    enterprise: orgs.filter(o=>o.plan==='enterprise').length,
    paid:       orgs.filter(o=>o.plan&&o.plan!=='free').length,
  }

  if (loading) return <div style={{padding:60,textAlign:'center',color:C.muted,direction:'rtl'}}>⏳ جاري تحميل المنظمات...</div>

  return (
    <div style={{padding:'28px 24px',direction:'rtl',minHeight:'100vh',background:C.bg,fontFamily:'inherit'}}>

      {/* Toast */}
      {toast && (
        <div style={{
          position:'fixed', top:20, left:'50%', transform:'translateX(-50%)',
          background: toast.ok ? C.navy : C.red, color:'#fff',
          padding:'10px 22px', borderRadius:8, fontWeight:700, fontSize:14, zIndex:9999,
          boxShadow:'0 4px 20px rgba(0,0,0,.2)', transition:'all .3s'
        }}>{toast.msg}</div>
      )}

      {/* Header */}
      <div style={{marginBottom:24}}>
        <h1 style={{fontSize:24,fontWeight:800,color:C.navy,margin:'0 0 4px'}}>🏢 إدارة المنظمات</h1>
        <p style={{fontSize:13,color:C.muted,margin:0}}>رفع وتخفيض الباقات · تفعيل الميزات · مراقبة الحسابات</p>
      </div>

      {/* Stats */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:20}}>
        {[
          {icon:'🏢', label:'إجمالي المنظمات', value:stats.total,      color:C.navy},
          {icon:'✅', label:'نشطة',             value:stats.active,     color:C.green},
          {icon:'💰', label:'مدفوعة',           value:stats.paid,       color:'#B07000'},
          {icon:'⭐', label:'مؤسسي',            value:stats.enterprise, color:'#5B3FA0'},
        ].map(s=>(
          <div key={s.label} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:'14px 16px'}}>
            <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:3}}>
              <span>{s.icon}</span>
              <span style={{fontSize:22,fontWeight:800,color:s.color}}>{s.value}</span>
            </div>
            <p style={{fontSize:11,color:C.muted,margin:0}}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{display:'flex',gap:10,marginBottom:16,alignItems:'center',flexWrap:'wrap'}}>
        <input
          value={search} onChange={e=>setSearch(e.target.value)}
          placeholder="🔍 بحث باسم المنظمة أو البريد..."
          style={{...inp, width:280}}
        />
        <select value={filterPlan} onChange={e=>setFilterPlan(e.target.value)} style={{...inp, width:'auto', minWidth:140}}>
          <option value="all">كل الباقات</option>
          {Object.entries(PLANS).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
        </select>
        <button onClick={load} style={{padding:'9px 16px',background:C.navy,border:'none',borderRadius:7,color:'#fff',fontWeight:700,fontSize:13,cursor:'pointer',fontFamily:'inherit'}}>
          🔄 تحديث
        </button>
        <span style={{fontSize:12,color:C.muted,marginRight:'auto'}}>{filtered.length} منظمة</span>
      </div>

      {/* Table */}
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,overflow:'hidden'}}>
        {/* Table header */}
        <div style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr 1fr 1fr 1.5fr',gap:0,
          padding:'10px 16px',background:'#F8F7FA',borderBottom:`1px solid ${C.border}`}}>
          {['المنظمة','الباقة','الأعضاء','الفعاليات','الحالة','تغيير الباقة'].map(h=>(
            <span key={h} style={{fontSize:11,fontWeight:700,color:C.muted,textTransform:'uppercase',letterSpacing:'.5px'}}>{h}</span>
          ))}
        </div>

        {filtered.length===0 && (
          <div style={{padding:40,textAlign:'center',color:C.muted}}>لا توجد منظمات</div>
        )}

        {filtered.map((org,i) => {
          const planDef = PLANS[org.plan||'free'] || PLANS.free
          const isChanging = changing===org.id
          return (
            <div key={org.id} style={{
              display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr 1fr 1.5fr', gap:0,
              padding:'14px 16px', borderBottom: i<filtered.length-1 ? `1px solid ${C.border}` : 'none',
              alignItems:'center', background: isChanging?'#FAFAFA':C.card, transition:'background .2s'
            }}>
              {/* Name */}
              <div>
                <button onClick={()=>setSelected(org)} style={{background:'none',border:'none',cursor:'pointer',padding:0,textAlign:'right'}}>
                  <p style={{fontWeight:700,color:C.navy,margin:0,fontSize:13}}>{org.name_ar||org.name}</p>
                  <p style={{fontSize:11,color:C.muted,margin:'2px 0 0'}}>{org.email||'—'}</p>
                </button>
              </div>

              {/* Plan badge */}
              <div>
                <span style={{
                  fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:20,
                  background:planDef.bg, color:planDef.color, display:'inline-block'
                }}>{planDef.label}</span>
              </div>

              {/* Members */}
              <span style={{fontSize:13,color:C.text,fontWeight:600}}>
                {org.member_count}
                {org.max_members ? <span style={{color:C.muted}}>/{org.max_members}</span> : <span style={{color:C.muted}}>/∞</span>}
              </span>

              {/* Events */}
              <span style={{fontSize:13,color:C.text,fontWeight:600}}>
                {org.event_count}
                {org.max_events ? <span style={{color:C.muted}}>/{org.max_events}</span> : <span style={{color:C.muted}}>/∞</span>}
              </span>

              {/* Status */}
              <span style={{
                fontSize:11, fontWeight:700, padding:'3px 9px', borderRadius:20, display:'inline-block',
                background: org.status==='active' ? '#EAF7E0' : '#FEF2F2',
                color: org.status==='active' ? C.green : C.red
              }}>{org.status==='active'?'نشط':'معلّق'}</span>

              {/* Plan selector */}
              <div style={{display:'flex',gap:6,alignItems:'center'}}>
                <select
                  value={org.plan||'free'}
                  onChange={e=>changePlan(org, e.target.value)}
                  disabled={isChanging}
                  style={{...inp, fontSize:12, padding:'6px 10px', cursor:'pointer', flex:1,
                    borderColor: isChanging?C.border:C.orange, opacity: isChanging?.6:1
                  }}
                >
                  {Object.entries(PLANS).map(([k,v])=>(
                    <option key={k} value={k}>{v.label} — {v.price}</option>
                  ))}
                </select>
                <button onClick={()=>setSelected(org)} title="تفاصيل" style={{
                  padding:'6px 10px', background:'#F8F7FA', border:`1px solid ${C.border}`,
                  borderRadius:6, cursor:'pointer', fontSize:13, flexShrink:0
                }}>⚙️</button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Detail Modal */}
      {selected && (
        <div onClick={e=>{if(e.target===e.currentTarget)setSelected(null)}} style={{
          position:'fixed', inset:0, background:'rgba(0,0,0,.45)', zIndex:1000,
          display:'flex', alignItems:'center', justifyContent:'center', padding:20
        }}>
          <div style={{background:C.card, borderRadius:16, padding:28, width:'100%', maxWidth:520,
            maxHeight:'85vh', overflowY:'auto', direction:'rtl', boxShadow:'0 20px 60px rgba(0,0,0,.3)'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:20}}>
              <div>
                <h2 style={{fontSize:18,fontWeight:800,color:C.navy,margin:'0 0 4px'}}>{selected.name_ar||selected.name}</h2>
                <p style={{fontSize:12,color:C.muted,margin:0}}>{selected.id}</p>
              </div>
              <button onClick={()=>setSelected(null)} style={{background:'none',border:'none',fontSize:20,cursor:'pointer',color:C.muted,padding:4}}>✕</button>
            </div>

            {/* Current plan */}
            <div style={{background:'#F8F7FA',borderRadius:10,padding:14,marginBottom:16}}>
              <p style={{...lbl,marginBottom:8}}>الباقة الحالية</p>
              <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:8}}>
                {Object.entries(PLANS).map(([k,v])=>{
                  const isActive = (selected.plan||'free')===k
                  return (
                    <button key={k} onClick={()=>changePlan(selected,k)} disabled={changing===selected.id} style={{
                      padding:'10px 14px', borderRadius:8, cursor:'pointer', fontFamily:'inherit',
                      border: isActive ? `2px solid ${v.color}` : `1px solid ${C.border}`,
                      background: isActive ? v.bg : C.card,
                      textAlign:'right', opacity: changing===selected.id?.6:1, transition:'all .2s'
                    }}>
                      <p style={{fontWeight:800,color:v.color,margin:'0 0 2px',fontSize:13}}>{v.label}</p>
                      <p style={{fontSize:11,color:C.muted,margin:0}}>{v.price}</p>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Features toggles */}
            <div style={{background:'#F8F7FA',borderRadius:10,padding:14,marginBottom:16}}>
              <p style={{...lbl,marginBottom:10}}>الميزات المفعّلة</p>
              <div style={{display:'grid',gap:8}}>
                {Object.entries(FEATURE_LABELS).map(([feat,label])=>{
                  const enabled = !!(selected.features?.[feat])
                  return (
                    <div key={feat} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 10px',background:enabled?'#EAF7E0':'#fff',border:`1px solid ${enabled?'#C3E6C3':C.border}`,borderRadius:8,transition:'all .2s'}}>
                      <span style={{fontSize:13,fontWeight:600,color:C.text}}>{label}</span>
                      <div onClick={()=>toggleFeature(selected,feat)} style={{
                        width:42,height:23,borderRadius:50,cursor:'pointer',position:'relative',
                        background:enabled?C.green:'#DBDAE3',transition:'background 0.2s',flexShrink:0
                      }}>
                        <div style={{
                          position:'absolute',top:2,width:19,height:19,borderRadius:'50%',background:'#fff',
                          transition:'right .2s, left .2s', boxShadow:'0 1px 4px rgba(0,0,0,.2)',
                          right:enabled?2:'auto', left:enabled?'auto':2
                        }}/>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Limits */}
            <div style={{background:'#F8F7FA',borderRadius:10,padding:14}}>
              <p style={{...lbl,marginBottom:8}}>الحدود الحالية</p>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8}}>
                {[
                  ['👥','الأعضاء', selected.max_members],
                  ['📅','الفعاليات', selected.max_events],
                  ['🎟','الحضور/فعالية', selected.max_attendees_per_event],
                ].map(([icon,label,val])=>(
                  <div key={label as string} style={{background:C.card,borderRadius:8,padding:'10px 12px',textAlign:'center',border:`1px solid ${C.border}`}}>
                    <span style={{fontSize:16}}>{icon}</span>
                    <p style={{fontSize:16,fontWeight:800,color:C.navy,margin:'3px 0 2px'}}>{val||'∞'}</p>
                    <p style={{fontSize:10,color:C.muted,margin:0}}>{label as string}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
