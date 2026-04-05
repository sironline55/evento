'use client'
import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import * as XLSX from 'xlsx'

const sb = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const C = { navy:'#1E0A3C', orange:'#F05537', text:'#39364F', muted:'#6F7287', border:'#DBDAE3', bg:'#FAFAFA', card:'#FFFFFF', green:'#3A7D0A' }
const fs = { width:'100%', padding:'10px 14px', border:`1px solid ${C.border}`, borderRadius:6, fontSize:13, outline:'none', fontFamily:'inherit', color:C.text, background:C.card, boxSizing:'border-box' as const }

const TABS = ['🏢 الشركات', '📦 الباقات', '💰 المحاسبة', '⬇️ النسخ الاحتياطي']

const PLANS = [
  { key:'free',       label:'مجاني',     color:'#6F7287', bg:'#F8F7FA' },
  { key:'starter',    label:'مبتدئ',     color:'#0070B8', bg:'#EDF7FF' },
  { key:'pro',        label:'احترافي',   color:'#7B4FBF', bg:'#EDE9F7' },
  { key:'enterprise', label:'مؤسسي',    color:C.green,   bg:'#EAF7E0' },
]

export default function SuperAdminPage() {
  const router = useRouter()
  const [tab, setTab] = useState(0)
  const [orgs, setOrgs] = useState<any[]>([])
  const [plans, setPlans] = useState<any[]>([])
  const [stats, setStats] = useState({ orgs:0, active:0, revenue:0, events:0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [planFilter, setPlanFilter] = useState('all')
  // New org form
  const [newOrg, setNewOrg] = useState({ name:'', email:'', phone:'', city:'', plan:'free' })
  const [savingOrg, setSavingOrg] = useState(false)
  // Plan edit
  const [editPlan, setEditPlan] = useState<any>(null)
  const [savingPlan, setSavingPlan] = useState(false)

  useEffect(() => {
    sb.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push('/login'); return }
      const { data: prof } = await sb.from('profiles').select('role').eq('id', data.user.id).single()
      if (prof?.role !== 'super_admin') { router.push('/'); return }

      const [{ data:o }, { data:p }, { count:ev }] = await Promise.all([
        sb.from('organizations').select('*').order('created_at', { ascending:false }),
        sb.from('plans').select('*').order('sort_order'),
        sb.from('events').select('*', { count:'exact', head:true }),
      ])
      const allOrgs = o||[]
      setOrgs(allOrgs)
      setPlans(p||[])
      setStats({
        orgs: allOrgs.length,
        active: allOrgs.filter(x => x.status === 'active').length,
        revenue: 0,
        events: ev||0,
      })
      setLoading(false)
    })
  }, [])

  async function createOrg() {
    if (!newOrg.name || !newOrg.email) return
    setSavingOrg(true)
    const { data } = await sb.from('organizations').insert({
      name: newOrg.name, email: newOrg.email,
      phone: newOrg.phone||null, city: newOrg.city||null,
      plan: newOrg.plan, status:'active',
      trial_ends_at: new Date(Date.now() + 14*24*60*60*1000).toISOString(),
    }).select().single()
    if (data) setOrgs(o => [data, ...o])
    setNewOrg({ name:'', email:'', phone:'', city:'', plan:'free' })
    setSavingOrg(false)
  }

  async function toggleOrgStatus(orgId: string, current: string) {
    const next = current === 'active' ? 'suspended' : 'active'
    await sb.from('organizations').update({ status: next }).eq('id', orgId)
    setOrgs(o => o.map(x => x.id===orgId ? {...x, status:next} : x))
  }

  async function updateOrgPlan(orgId: string, plan: string) {
    await sb.from('organizations').update({ plan }).eq('id', orgId)
    setOrgs(o => o.map(x => x.id===orgId ? {...x, plan} : x))
  }

  async function savePlan() {
    if (!editPlan) return
    setSavingPlan(true)
    await sb.from('plans').update({
      name_ar: editPlan.name_ar,
      price_monthly: editPlan.price_monthly,
      price_yearly: editPlan.price_yearly,
      max_events: editPlan.max_events,
      max_members: editPlan.max_members,
      max_attendees: editPlan.max_attendees,
      max_staff: editPlan.max_staff,
    }).eq('id', editPlan.id)
    setPlans(p => p.map(x => x.id===editPlan.id ? editPlan : x))
    setEditPlan(null)
    setSavingPlan(false)
  }

  function exportOrgsExcel() {
    const rows = orgs.map(o => ({
      'اسم الشركة': o.name, 'البريد': o.email||'', 'الجوال': o.phone||'',
      'المدينة': o.city||'', 'الباقة': o.plan, 'الحالة': o.status,
      'تاريخ الإنشاء': new Date(o.created_at).toLocaleDateString('ar-SA'),
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    ws['!cols'] = [{wch:24},{wch:28},{wch:14},{wch:12},{wch:10},{wch:10},{wch:16}]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'الشركات')
    XLSX.writeFile(wb, `eventovms-companies-${new Date().toISOString().slice(0,10)}.xlsx`)
  }

  async function exportOrgData(orgId: string, orgName: string) {
    const [{ data:events }, { data:regs }] = await Promise.all([
      sb.from('events').select('*').eq('org_id', orgId),
      sb.from('registrations').select('*').in('event_id', (await sb.from('events').select('id').eq('org_id', orgId)).data?.map(e=>e.id)||[]),
    ])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(events||[]), 'الفعاليات')
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(regs||[]), 'التسجيلات')
    XLSX.writeFile(wb, `${orgName}-backup-${new Date().toISOString().slice(0,10)}.xlsx`)
  }

  const filtered = orgs.filter(o => {
    const q = search.toLowerCase()
    return (!q || (o.name||'').toLowerCase().includes(q) || (o.email||'').toLowerCase().includes(q))
      && (planFilter === 'all' || o.plan === planFilter)
  })

  const planMap = Object.fromEntries(PLANS.map(p => [p.key, p]))

  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:C.bg }}>
      <p style={{ color:C.muted }}>جاري التحميل...</p>
    </div>
  )

  return (
    <div style={{ minHeight:'100vh', background:C.bg, direction:'rtl' }}>

      {/* Top bar */}
      <div style={{ background:C.navy, padding:'14px 28px', display:'flex', justifyContent:'space-between', alignItems:'center', position:'sticky', top:0, zIndex:40 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:36, height:36, background:C.orange, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:800, fontSize:16 }}>E</div>
          <div>
            <p style={{ color:'#fff', fontWeight:800, fontSize:14, margin:0 }}>EventVMS</p>
            <p style={{ color:'rgba(255,255,255,0.5)', fontSize:10, margin:0 }}>لوحة تحكم المشغّل</p>
          </div>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <span style={{ background:'rgba(240,85,55,0.2)', color:C.orange, padding:'4px 12px', borderRadius:20, fontSize:11, fontWeight:700 }}>Super Admin</span>
          <button onClick={async()=>{ await sb.auth.signOut(); router.push('/login') }} style={{ background:'rgba(255,255,255,0.1)', border:'none', borderRadius:6, padding:'6px 14px', color:'rgba(255,255,255,0.7)', fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>خروج</button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ background:C.card, borderBottom:`1px solid ${C.border}`, padding:'16px 28px' }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14 }}>
          {[
            { l:'إجمالي الشركات', v:stats.orgs,   c:C.navy,   b:'#F0EDF7', icon:'🏢' },
            { l:'نشط',           v:stats.active,  c:C.green,  b:'#EAF7E0', icon:'✅' },
            { l:'موقوف',         v:stats.orgs-stats.active, c:'#DC2626', b:'#FEF2F2', icon:'⏸' },
            { l:'إجمالي الفعاليات', v:stats.events, c:C.orange, b:'#FEF0ED', icon:'📅' },
          ].map(s => (
            <div key={s.l} style={{ background:s.b, borderRadius:10, padding:'14px 16px', display:'flex', gap:12, alignItems:'center' }}>
              <span style={{ fontSize:24 }}>{s.icon}</span>
              <div>
                <p style={{ fontSize:22, fontWeight:800, color:s.c, margin:0 }}>{s.v}</p>
                <p style={{ fontSize:11, color:C.muted, margin:0 }}>{s.l}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background:C.card, borderBottom:`1px solid ${C.border}` }}>
        <div style={{ display:'flex', padding:'0 28px' }}>
          {TABS.map((t,i) => (
            <button key={i} onClick={()=>setTab(i)} style={{
              padding:'12px 20px', border:'none', background:'transparent', cursor:'pointer',
              fontWeight:tab===i?700:500, fontSize:13, fontFamily:'inherit',
              color:tab===i?C.orange:C.muted,
              borderBottom:tab===i?`3px solid ${C.orange}`:'3px solid transparent',
            }}>{t}</button>
          ))}
        </div>
      </div>

      <div style={{ padding:'20px 28px', maxWidth:1200, margin:'0 auto' }}>

        {/* TAB 0: الشركات */}
        {tab===0 && (
          <div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 320px', gap:20, alignItems:'start' }}>

              {/* List */}
              <div>
                <div style={{ display:'flex', gap:10, marginBottom:14, flexWrap:'wrap' }}>
                  <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="بحث باسم الشركة أو البريد..." style={{...fs, flex:1, minWidth:180, padding:'8px 12px'}}/>
                  <select value={planFilter} onChange={e=>setPlanFilter(e.target.value)} style={{...fs, width:'auto', padding:'8px 12px'}}>
                    <option value="all">كل الباقات</option>
                    {PLANS.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
                  </select>
                  <button onClick={exportOrgsExcel} style={{ padding:'8px 16px', background:'#EAF7E0', border:`1px solid #9DE07B`, borderRadius:6, color:C.green, fontWeight:700, fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>📊 Excel</button>
                </div>

                <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, overflow:'hidden' }}>
                  <div style={{ padding:'10px 16px', background:'#F8F7FA', borderBottom:`1px solid ${C.border}`, display:'grid', gridTemplateColumns:'1fr 100px 80px 150px', gap:8 }}>
                    {['الشركة','الباقة','الحالة','إجراء'].map(h=>(
                      <span key={h} style={{ fontSize:11, fontWeight:700, color:C.muted }}>{h}</span>
                    ))}
                  </div>
                  {filtered.length===0 ? (
                    <p style={{ padding:28, textAlign:'center', color:C.muted, fontSize:13 }}>لا توجد شركات</p>
                  ) : filtered.map((o,i) => {
                    const pl = planMap[o.plan]||planMap.free
                    const isActive = o.status==='active'
                    return (
                      <div key={o.id} style={{ display:'grid', gridTemplateColumns:'1fr 100px 80px 150px', gap:8, padding:'12px 16px', borderBottom:i<filtered.length-1?`1px solid ${C.border}`:'none', alignItems:'center' }}
                        onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background='#FAFAFA'}
                        onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background='transparent'}
                      >
                        <div style={{ minWidth:0 }}>
                          <p style={{ fontSize:13, fontWeight:700, color:C.navy, margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{o.name}</p>
                          <p style={{ fontSize:11, color:C.muted, margin:0 }}>{o.email}</p>
                        </div>
                        <select value={o.plan} onChange={e=>updateOrgPlan(o.id, e.target.value)} style={{ fontSize:11, fontWeight:700, color:pl.color, background:pl.bg, border:'none', borderRadius:10, padding:'3px 6px', cursor:'pointer', fontFamily:'inherit' }}>
                          {PLANS.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
                        </select>
                        <span style={{ fontSize:11, fontWeight:700, color:isActive?C.green:'#DC2626', background:isActive?'#EAF7E0':'#FEF2F2', padding:'3px 8px', borderRadius:10, textAlign:'center', display:'block' }}>
                          {isActive?'نشط':'موقوف'}
                        </span>
                        <div style={{ display:'flex', gap:6 }}>
                          <button onClick={()=>toggleOrgStatus(o.id, o.status)} style={{ padding:'5px 10px', border:`1px solid ${C.border}`, borderRadius:5, background:C.bg, color:isActive?'#DC2626':C.green, fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                            {isActive?'تعليق':'تفعيل'}
                          </button>
                          <button onClick={()=>exportOrgData(o.id, o.name)} style={{ padding:'5px 10px', border:`1px solid ${C.border}`, borderRadius:5, background:C.bg, color:C.muted, fontSize:11, cursor:'pointer', fontFamily:'inherit' }}>⬇️</button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Add new org */}
              <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:20 }}>
                <h3 style={{ fontSize:14, fontWeight:700, color:C.navy, margin:'0 0 16px' }}>🏢 إضافة شركة جديدة</h3>
                {[['اسم الشركة *','name','text'],['البريد الإلكتروني *','email','email'],['رقم الجوال','phone','tel'],['المدينة','city','text']].map(([l,k,t])=>(
                  <div key={k} style={{ marginBottom:10 }}>
                    <label style={{ fontSize:12, fontWeight:600, color:C.navy, display:'block', marginBottom:4 }}>{l}</label>
                    <input type={t} value={(newOrg as any)[k]||''} onChange={e=>setNewOrg(n=>({...n,[k]:e.target.value}))} style={{...fs, padding:'8px 12px'}}/>
                  </div>
                ))}
                <div style={{ marginBottom:14 }}>
                  <label style={{ fontSize:12, fontWeight:600, color:C.navy, display:'block', marginBottom:4 }}>الباقة</label>
                  <select value={newOrg.plan} onChange={e=>setNewOrg(n=>({...n,plan:e.target.value}))} style={{...fs, padding:'8px 12px'}}>
                    {PLANS.map(p=><option key={p.key} value={p.key}>{p.label}</option>)}
                  </select>
                </div>
                <button onClick={createOrg} disabled={savingOrg||!newOrg.name||!newOrg.email} style={{ width:'100%', padding:'10px', background:C.orange, border:'none', borderRadius:8, color:'#fff', fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit', opacity:savingOrg||!newOrg.name||!newOrg.email?0.5:1 }}>
                  {savingOrg?'...':'+ إنشاء شركة'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 1: الباقات */}
        {tab===1 && (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:16 }}>
            {plans.map(p => {
              const pl = planMap[p.name?.toLowerCase()]||planMap.free
              return (
                <div key={p.id} style={{ background:C.card, border:`2px solid ${pl.bg}`, borderRadius:12, overflow:'hidden' }}>
                  <div style={{ background:pl.bg, padding:'14px 20px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <div>
                      <h3 style={{ fontSize:16, fontWeight:800, color:pl.color, margin:0 }}>{p.name_ar}</h3>
                      <p style={{ fontSize:12, color:C.muted, margin:'2px 0 0' }}>{orgs.filter(o=>o.plan===p.name?.toLowerCase()).length} شركة مشتركة</p>
                    </div>
                    <div style={{ textAlign:'left' }}>
                      <p style={{ fontSize:18, fontWeight:800, color:pl.color, margin:0 }}>{p.price_monthly===0?'مجاني':`SAR ${p.price_monthly}`}</p>
                      {p.price_monthly>0&&<p style={{ fontSize:11, color:C.muted, margin:0 }}>/ شهر</p>}
                    </div>
                  </div>
                  <div style={{ padding:'16px 20px' }}>
                    {editPlan?.id===p.id ? (
                      <div>
                        {[['الاسم بالعربي','name_ar'],['السعر الشهري (SAR)','price_monthly'],['السعر السنوي (SAR)','price_yearly'],['أقصى فعاليات','max_events'],['أقصى أعضاء','max_members'],['أقصى حضور','max_attendees'],['أقصى كوادر','max_staff']].map(([l,k])=>(
                          <div key={k} style={{ marginBottom:8, display:'grid', gridTemplateColumns:'120px 1fr', gap:8, alignItems:'center' }}>
                            <span style={{ fontSize:12, color:C.muted }}>{l}</span>
                            <input value={(editPlan as any)[k]||''} onChange={e=>setEditPlan((ep:any)=>({...ep,[k]:e.target.value}))} style={{...fs, padding:'6px 10px'}}/>
                          </div>
                        ))}
                        <div style={{ display:'flex', gap:8, marginTop:12 }}>
                          <button onClick={savePlan} disabled={savingPlan} style={{ flex:1, padding:'8px', background:C.orange, border:'none', borderRadius:6, color:'#fff', fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>{savingPlan?'...':'💾 حفظ'}</button>
                          <button onClick={()=>setEditPlan(null)} style={{ padding:'8px 14px', border:`1px solid ${C.border}`, borderRadius:6, background:C.bg, color:C.muted, cursor:'pointer', fontFamily:'inherit' }}>إلغاء</button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        {[['أقصى فعاليات',p.max_events===999?'∞':p.max_events],['أقصى أعضاء',p.max_members===999?'∞':p.max_members],['أقصى حضور/فعالية',p.max_attendees===9999?'∞':p.max_attendees],['أقصى كوادر',p.max_staff||'—']].map(([l,v])=>(
                          <div key={l as string} style={{ display:'flex', justifyContent:'space-between', padding:'7px 0', borderBottom:`1px solid ${C.border}` }}>
                            <span style={{ fontSize:12, color:C.muted }}>{l}</span>
                            <span style={{ fontSize:13, fontWeight:700, color:C.navy }}>{v}</span>
                          </div>
                        ))}
                        <div style={{ display:'flex', justifyContent:'space-between', padding:'7px 0' }}>
                          <span style={{ fontSize:12, color:C.muted }}>السعر السنوي</span>
                          <span style={{ fontSize:13, fontWeight:700, color:C.navy }}>{p.price_yearly===0?'مجاني':`SAR ${p.price_yearly}`}</span>
                        </div>
                        <button onClick={()=>setEditPlan({...p})} style={{ width:'100%', marginTop:12, padding:'8px', border:`1px solid ${C.border}`, borderRadius:6, background:C.bg, color:C.text, fontWeight:600, fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>✏️ تعديل الباقة</button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* TAB 2: المحاسبة */}
        {tab===2 && (
          <div>
            <div style={{ background:'#FFF8E8', border:`1px solid #F5D56B`, borderRadius:10, padding:16, marginBottom:20, display:'flex', gap:12, alignItems:'center' }}>
              <span style={{ fontSize:24 }}>🚧</span>
              <div>
                <p style={{ fontSize:14, fontWeight:700, color:'#B07000', margin:0 }}>وحدة المحاسبة — قيد التطوير</p>
                <p style={{ fontSize:12, color:'#B07000', margin:'4px 0 0' }}>ستشمل: الفواتير، المدفوعات، تقارير الإيرادات، وبوابة الدفع</p>
              </div>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:20 }}>
              {[
                { l:'الشركات المدفوعة', v:orgs.filter(o=>o.plan!=='free').length, c:'#7B4FBF', b:'#EDE9F7' },
                { l:'الباقة المجانية',   v:orgs.filter(o=>o.plan==='free').length,   c:C.muted, b:'#F8F7FA' },
                { l:'الإيرادات المتوقعة', v:'—', c:C.green, b:'#EAF7E0' },
              ].map(s=>(
                <div key={s.l} style={{ background:s.b, borderRadius:10, padding:'16px 18px' }}>
                  <p style={{ fontSize:22, fontWeight:800, color:s.c, margin:0 }}>{s.v}</p>
                  <p style={{ fontSize:12, color:C.muted, margin:'4px 0 0' }}>{s.l}</p>
                </div>
              ))}
            </div>

            {/* Plan distribution */}
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:20 }}>
              <h3 style={{ fontSize:14, fontWeight:700, color:C.navy, margin:'0 0 16px' }}>توزيع الشركات حسب الباقة</h3>
              {PLANS.map(p => {
                const cnt = orgs.filter(o=>o.plan===p.key).length
                const pct = orgs.length>0 ? Math.round(cnt/orgs.length*100) : 0
                return (
                  <div key={p.key} style={{ marginBottom:12 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:4 }}>
                      <span style={{ fontWeight:700, color:p.color }}>{p.label}</span>
                      <span style={{ color:C.muted }}>{cnt} شركة ({pct}%)</span>
                    </div>
                    <div style={{ background:'#F0EDF7', borderRadius:20, height:8, overflow:'hidden' }}>
                      <div style={{ width:`${pct}%`, height:'100%', background:p.color, borderRadius:20, transition:'width 0.5s' }}/>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* TAB 3: النسخ الاحتياطي */}
        {tab===3 && (
          <div>
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:20, marginBottom:16 }}>
              <h3 style={{ fontSize:14, fontWeight:700, color:C.navy, margin:'0 0 6px' }}>⬇️ تحميل بيانات كل الشركات</h3>
              <p style={{ fontSize:13, color:C.muted, margin:'0 0 16px' }}>ملف Excel يحتوي على جميع الشركات المسجلة في المنصة</p>
              <button onClick={exportOrgsExcel} style={{ padding:'11px 24px', background:C.orange, border:'none', borderRadius:8, color:'#fff', fontWeight:700, fontSize:14, cursor:'pointer', fontFamily:'inherit' }}>
                📊 تحميل قائمة الشركات (Excel)
              </button>
            </div>

            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, overflow:'hidden' }}>
              <div style={{ padding:'14px 20px', borderBottom:`1px solid ${C.border}`, background:'#F8F7FA' }}>
                <h3 style={{ fontSize:14, fontWeight:700, color:C.navy, margin:0 }}>تحميل بيانات شركة محددة</h3>
                <p style={{ fontSize:12, color:C.muted, margin:'4px 0 0' }}>يشمل: الفعاليات، التسجيلات، الكوادر</p>
              </div>
              {orgs.map((o,i) => {
                const pl = planMap[o.plan]||planMap.free
                return (
                  <div key={o.id} style={{ padding:'12px 20px', borderBottom:i<orgs.length-1?`1px solid ${C.border}`:'none', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <div>
                      <p style={{ fontSize:13, fontWeight:700, color:C.navy, margin:0 }}>{o.name}</p>
                      <div style={{ display:'flex', gap:8, marginTop:3 }}>
                        <span style={{ fontSize:11, fontWeight:700, color:pl.color, background:pl.bg, padding:'2px 8px', borderRadius:10 }}>{pl.label}</span>
                        <span style={{ fontSize:11, color:C.muted }}>{o.email}</span>
                      </div>
                    </div>
                    <button onClick={()=>exportOrgData(o.id, o.name)} style={{ padding:'7px 16px', border:`1px solid ${C.border}`, borderRadius:6, background:C.bg, color:C.text, fontWeight:600, fontSize:12, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:6 }}>
                      ⬇️ تحميل
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
