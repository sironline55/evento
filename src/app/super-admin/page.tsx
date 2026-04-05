'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import * as XLSX from 'xlsx'

const sb = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
const C = { navy:'#1E0A3C', orange:'#F05537', text:'#39364F', muted:'#6F7287', border:'#DBDAE3', bg:'#F4F3F8', card:'#FFFFFF', green:'#3A7D0A' }
const fs = { width:'100%',padding:'10px 14px',border:`2px solid ${C.border}`,borderRadius:8,fontSize:13,outline:'none',fontFamily:'inherit',color:C.text,background:C.card,boxSizing:'border-box' as const }
const TABS = ['لوحة التحكم','الشركات','الباقات','المحاسبة','النسخ الاحتياطي']

export default function SuperAdminPage() {
  const router = useRouter()
  const [tab, setTab]   = useState(0)
  const [stats, setStats] = useState({ orgs:0, active:0, trial:0, revenue:0 })
  const [orgs, setOrgs]   = useState<any[]>([])
  const [plans, setPlans] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [newOrg, setNewOrg] = useState({ name:'', email:'', phone:'', plan:'free', city:'', owner_email:'' })
  const [newPlan, setNewPlan] = useState({ name:'', name_ar:'', price_monthly:'', price_yearly:'', max_events:'', max_members:'', max_staff:'', max_attendees:'' })
  const [savingOrg, setSavingOrg] = useState(false)
  const [savingPlan, setSavingPlan] = useState(false)
  const [backupLoading, setBackupLoading] = useState<string|null>(null)

  useEffect(() => {
    // Verify super admin
    sb.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push('/login'); return }
      const { data: p } = await sb.from('profiles').select('role').eq('id', data.user.id).single()
      if (p?.role !== 'super_admin') { router.push('/'); return }
    })
    loadData()
  }, [])

  async function loadData() {
    const [{ data: o }, { data: pl }] = await Promise.all([
      sb.from('organizations').select('*').order('created_at', { ascending:false }),
      sb.from('plans').select('*').order('sort_order'),
    ])
    const orgList = o||[]
    setOrgs(orgList)
    setPlans(pl||[])
    setStats({
      orgs: orgList.length,
      active: orgList.filter(x=>x.status==='active').length,
      trial: orgList.filter(x=>x.status==='trial').length,
      revenue: 0, // TODO: from billing table
    })
    setLoading(false)
  }

  async function createOrg() {
    setSavingOrg(true)
    const { error } = await sb.from('organizations').insert({
      name: newOrg.name, email: newOrg.email, phone: newOrg.phone||null,
      city: newOrg.city||null, plan: newOrg.plan, status:'trial',
      trial_ends_at: new Date(Date.now()+14*24*60*60*1000).toISOString()
    })
    if (!error) { setNewOrg({name:'',email:'',phone:'',plan:'free',city:'',owner_email:''}); await loadData() }
    setSavingOrg(false)
  }

  async function toggleOrgStatus(id:string, status:string) {
    const next = status==='active'?'suspended':status==='suspended'?'active':'active'
    await sb.from('organizations').update({ status:next }).eq('id',id)
    setOrgs(o => o.map(x=>x.id===id?{...x,status:next}:x))
  }

  async function changePlan(id:string, plan:string) {
    await sb.from('organizations').update({ plan }).eq('id',id)
    setOrgs(o => o.map(x=>x.id===id?{...x,plan}:x))
  }

  async function createPlan() {
    setSavingPlan(true)
    await sb.from('plans').insert({
      name: newPlan.name, name_ar: newPlan.name_ar,
      price_monthly: Number(newPlan.price_monthly)||0,
      price_yearly: Number(newPlan.price_yearly)||0,
      max_events: Number(newPlan.max_events)||5,
      max_members: Number(newPlan.max_members)||5,
      max_staff: Number(newPlan.max_staff)||10,
      max_attendees: Number(newPlan.max_attendees)||500,
    })
    setNewPlan({name:'',name_ar:'',price_monthly:'',price_yearly:'',max_events:'',max_members:'',max_staff:'',max_attendees:''})
    setSavingPlan(false)
    await loadData()
  }

  async function downloadBackup(orgId:string, orgName:string) {
    setBackupLoading(orgId)
    try {
      const [{ data:events },{ data:regs },{ data:members }] = await Promise.all([
        sb.from('events').select('*').eq('org_id',orgId),
        sb.from('registrations').select('*').eq('org_id',orgId),
        sb.from('org_members').select('*').eq('org_id',orgId),
      ])
      const wb = XLSX.utils.book_new()
      if(events?.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(events), 'الفعاليات')
      if(regs?.length)   XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(regs),   'التسجيلات')
      if(members?.length)XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(members),'الأعضاء')
      XLSX.writeFile(wb, `backup-${orgName}-${new Date().toISOString().slice(0,10)}.xlsx`)
    } finally { setBackupLoading(null) }
  }

  async function downloadAllBackup() {
    setBackupLoading('all')
    try {
      const [{ data:o },{ data:e },{ data:r }] = await Promise.all([
        sb.from('organizations').select('*'),
        sb.from('events').select('*'),
        sb.from('registrations').select('*'),
      ])
      const wb = XLSX.utils.book_new()
      if(o?.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(o), 'الشركات')
      if(e?.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(e), 'الفعاليات')
      if(r?.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(r), 'التسجيلات')
      XLSX.writeFile(wb, `full-backup-${new Date().toISOString().slice(0,10)}.xlsx`)
    } finally { setBackupLoading(null) }
  }

  const STATUS_STYLE: any = {
    active:    {l:'نشط',     c:C.green,   b:'#EAF7E0'},
    trial:     {l:'تجريبي',  c:'#B07000', b:'#FFF8E8'},
    suspended: {l:'موقوف',   c:'#DC2626', b:'#FEF2F2'},
    cancelled: {l:'ملغي',    c:'#6F7287', b:'#F8F7FA'},
  }
  const PLAN_COLOR: any = { free:{c:'#6F7287',b:'#F8F7FA'}, starter:{c:'#0070B8',b:'#EDF7FF'}, pro:{c:'#7B4FBF',b:'#EDE9F7'}, enterprise:{c:C.orange,b:'#FEF0ED'} }

  return (
    <div style={{ minHeight:'100vh', background:C.bg, direction:'rtl' }}>
      {/* Header */}
      <div style={{ background:C.navy, padding:'14px 24px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:36, height:36, background:C.orange, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:800, fontSize:16 }}>E</div>
          <div>
            <p style={{ color:'#fff', fontWeight:800, fontSize:14, margin:0 }}>EventVMS</p>
            <p style={{ color:'rgba(255,255,255,0.5)', fontSize:10, margin:0 }}>لوحة تحكم المنصة</p>
          </div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <Link href="/" style={{ padding:'7px 14px', background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:6, color:'rgba(255,255,255,0.7)', fontSize:12, textDecoration:'none', fontWeight:600 }}>
            الداشبورد العام
          </Link>
          <button onClick={async()=>{ await sb.auth.signOut(); router.push('/login') }} style={{ padding:'7px 14px', border:'1px solid rgba(255,255,255,0.2)', borderRadius:6, color:'rgba(255,255,255,0.7)', background:'transparent', fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>
            خروج
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background:C.card, borderBottom:`1px solid ${C.border}`, overflowX:'auto' }}>
        <div style={{ display:'flex', minWidth:'max-content' }}>
          {TABS.map((t,i)=>(
            <button key={i} onClick={()=>setTab(i)} style={{ padding:'12px 20px', border:'none', background:'transparent', cursor:'pointer', fontWeight:tab===i?700:500, fontSize:13, fontFamily:'inherit', color:tab===i?C.orange:C.muted, borderBottom:tab===i?`3px solid ${C.orange}`:'3px solid transparent', whiteSpace:'nowrap' }}>{t}</button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth:1100, margin:'0 auto', padding:'20px 16px' }}>

        {/* TAB 0: لوحة التحكم */}
        {tab===0&&(
          <div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:20 }}>
              {[
                {l:'إجمالي الشركات', v:stats.orgs,  c:C.navy,  b:'#F0EDF7', icon:'🏢'},
                {l:'اشتراكات نشطة',  v:stats.active, c:C.green, b:'#EAF7E0', icon:'✅'},
                {l:'حسابات تجريبية', v:stats.trial,  c:'#B07000',b:'#FFF8E8',icon:'⏳'},
                {l:'إجمالي الفعاليات',v:'—',          c:C.orange,b:'#FEF0ED',icon:'📅'},
              ].map(s=>(
                <div key={s.l} style={{ background:s.b, borderRadius:10, padding:'16px 18px' }}>
                  <p style={{ fontSize:26, margin:'0 0 4px' }}>{s.icon}</p>
                  <p style={{ fontSize:26, fontWeight:800, color:s.c, margin:0 }}>{loading?'—':s.v}</p>
                  <p style={{ fontSize:12, color:C.muted, margin:0 }}>{s.l}</p>
                </div>
              ))}
            </div>

            {/* Recent orgs */}
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, overflow:'hidden' }}>
              <div style={{ padding:'14px 18px', borderBottom:`1px solid ${C.border}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ fontWeight:700, color:C.navy, fontSize:14 }}>آخر الشركات المشتركة</span>
                <button onClick={()=>setTab(1)} style={{ fontSize:12, color:C.orange, background:'none', border:'none', cursor:'pointer', fontFamily:'inherit', fontWeight:700 }}>عرض الكل ←</button>
              </div>
              {orgs.slice(0,5).map((o,i)=>{
                const st = STATUS_STYLE[o.status]||STATUS_STYLE.trial
                const pl = PLAN_COLOR[o.plan]||PLAN_COLOR.free
                return (
                  <div key={o.id} style={{ padding:'12px 18px', borderBottom:i<4?`1px solid ${C.border}`:'none', display:'flex', alignItems:'center', gap:12 }}>
                    <div style={{ width:36, height:36, background:'#EDE9F7', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, color:'#7B4FBF', flexShrink:0 }}>{o.name?.[0]||'?'}</div>
                    <div style={{ flex:1 }}>
                      <p style={{ fontSize:13, fontWeight:700, color:C.navy, margin:0 }}>{o.name}</p>
                      <p style={{ fontSize:11, color:C.muted, margin:0 }}>{o.email||'—'} · {o.city||'—'}</p>
                    </div>
                    <span style={{ padding:'3px 8px', borderRadius:20, fontSize:10, fontWeight:700, color:pl.c, background:pl.b }}>{o.plan}</span>
                    <span style={{ padding:'3px 8px', borderRadius:20, fontSize:10, fontWeight:700, color:st.c, background:st.b }}>{st.l}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* TAB 1: الشركات */}
        {tab===1&&(
          <div style={{ display:'grid', gridTemplateColumns:'1fr 340px', gap:16, alignItems:'start' }}>
            {/* Companies list */}
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, overflow:'hidden' }}>
              <div style={{ padding:'14px 18px', borderBottom:`1px solid ${C.border}` }}>
                <span style={{ fontWeight:700, color:C.navy, fontSize:14 }}>الشركات ({orgs.length})</span>
              </div>
              {orgs.map((o,i)=>{
                const st = STATUS_STYLE[o.status]||STATUS_STYLE.trial
                return (
                  <div key={o.id} style={{ padding:'14px 18px', borderBottom:i<orgs.length-1?`1px solid ${C.border}`:'none' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                      <div>
                        <p style={{ fontSize:14, fontWeight:700, color:C.navy, margin:0 }}>{o.name}</p>
                        <p style={{ fontSize:12, color:C.muted, margin:'2px 0 0' }}>{o.email||'—'} · {o.city||'—'}</p>
                        <p style={{ fontSize:11, color:C.muted, margin:'2px 0 0' }}>تسجيل: {new Date(o.created_at).toLocaleDateString('ar-SA')}</p>
                      </div>
                      <div style={{ display:'flex', gap:6, flexDirection:'column', alignItems:'flex-end' }}>
                        <span style={{ padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700, color:st.c, background:st.b }}>{st.l}</span>
                        <select value={o.plan} onChange={e=>changePlan(o.id,e.target.value)} style={{ fontSize:11, padding:'3px 8px', border:`1px solid ${C.border}`, borderRadius:6, fontFamily:'inherit', background:C.bg, color:C.text, cursor:'pointer' }}>
                          {['free','starter','pro','enterprise'].map(p=><option key={p} value={p}>{p}</option>)}
                        </select>
                      </div>
                    </div>
                    <div style={{ display:'flex', gap:8 }}>
                      <button onClick={()=>toggleOrgStatus(o.id,o.status)} style={{ padding:'5px 12px', border:`1px solid ${C.border}`, borderRadius:6, background:o.status==='active'?'#FEF2F2':o.status==='suspended'?'#EAF7E0':'#EAF7E0', color:o.status==='active'?'#DC2626':C.green, fontWeight:700, fontSize:11, cursor:'pointer', fontFamily:'inherit' }}>
                        {o.status==='active'?'تعليق':o.status==='suspended'?'تفعيل':'تفعيل'}
                      </button>
                      <button onClick={()=>downloadBackup(o.id,o.name)} disabled={backupLoading===o.id} style={{ padding:'5px 12px', border:`1px solid ${C.border}`, borderRadius:6, background:'#EDE9F7', color:'#7B4FBF', fontWeight:700, fontSize:11, cursor:'pointer', fontFamily:'inherit' }}>
                        {backupLoading===o.id?'...':'📥 نسخة'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Create org form */}
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:20 }}>
              <h3 style={{ fontSize:14, fontWeight:700, color:C.navy, margin:'0 0 16px' }}>🏢 إضافة شركة جديدة</h3>
              {[['اسم الشركة *','name','text'],['البريد الإلكتروني *','email','email'],['رقم الهاتف','phone','tel'],['المدينة','city','text']].map(([l,k,t])=>(
                <div key={k} style={{ marginBottom:10 }}>
                  <label style={{ fontSize:12, fontWeight:600, color:C.navy, display:'block', marginBottom:4 }}>{l}</label>
                  <input type={t} value={(newOrg as any)[k]} onChange={e=>setNewOrg(n=>({...n,[k]:e.target.value}))} style={fs}/>
                </div>
              ))}
              <div style={{ marginBottom:14 }}>
                <label style={{ fontSize:12, fontWeight:600, color:C.navy, display:'block', marginBottom:4 }}>الباقة الابتدائية</label>
                <select value={newOrg.plan} onChange={e=>setNewOrg(n=>({...n,plan:e.target.value}))} style={fs}>
                  {['free','starter','pro','enterprise'].map(p=><option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <button onClick={createOrg} disabled={savingOrg||!newOrg.name||!newOrg.email} style={{ width:'100%', padding:'11px', background:savingOrg||!newOrg.name||!newOrg.email?'#ccc':C.orange, border:'none', borderRadius:8, color:'#fff', fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
                {savingOrg?'...':'+ إنشاء شركة'}
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: الباقات */}
        {tab===2&&(
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, alignItems:'start' }}>
            {/* Plans list */}
            <div>
              {plans.map((p,i)=>(
                <div key={p.id} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:20, marginBottom:12 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:12 }}>
                    <div>
                      <h3 style={{ fontSize:16, fontWeight:800, color:C.navy, margin:0 }}>{p.name_ar}</h3>
                      <p style={{ fontSize:12, color:C.muted, margin:'2px 0 0' }}>{p.name}</p>
                    </div>
                    <div style={{ textAlign:'left' }}>
                      <p style={{ fontSize:20, fontWeight:800, color:C.orange, margin:0 }}>{p.price_monthly===0?'مجاني':p.price_monthly+' SAR'}</p>
                      {p.price_monthly>0&&<p style={{ fontSize:11, color:C.muted, margin:0 }}>/شهر</p>}
                    </div>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                    {[['فعاليات',p.max_events],['أعضاء',p.max_members],['كوادر',p.max_staff||'—'],['زوار/فعالية',p.max_attendees]].map(([l,v])=>(
                      <div key={l as string} style={{ background:'#F8F7FA', borderRadius:6, padding:'8px 10px' }}>
                        <p style={{ fontSize:14, fontWeight:800, color:C.navy, margin:0 }}>{v>=999?'∞':v}</p>
                        <p style={{ fontSize:10, color:C.muted, margin:0 }}>{l}</p>
                      </div>
                    ))}
                  </div>
                  <p style={{ fontSize:11, color:C.muted, margin:'10px 0 0' }}>
                    {orgs.filter(o=>o.plan===p.name.toLowerCase()).length} شركة على هذه الباقة
                  </p>
                </div>
              ))}
            </div>

            {/* Create plan */}
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:20 }}>
              <h3 style={{ fontSize:14, fontWeight:700, color:C.navy, margin:'0 0 16px' }}>➕ إنشاء باقة جديدة</h3>
              {[['الاسم (إنجليزي)','name','text'],['الاسم (عربي)','name_ar','text'],['السعر الشهري (SAR)','price_monthly','number'],['السعر السنوي (SAR)','price_yearly','number'],['أقصى فعاليات','max_events','number'],['أقصى أعضاء','max_members','number'],['أقصى كوادر','max_staff','number'],['أقصى زوار/فعالية','max_attendees','number']].map(([l,k,t])=>(
                <div key={k} style={{ marginBottom:10 }}>
                  <label style={{ fontSize:12, fontWeight:600, color:C.navy, display:'block', marginBottom:4 }}>{l}</label>
                  <input type={t} value={(newPlan as any)[k]} onChange={e=>setNewPlan(n=>({...n,[k]:e.target.value}))} style={fs}/>
                </div>
              ))}
              <button onClick={createPlan} disabled={savingPlan||!newPlan.name||!newPlan.name_ar} style={{ width:'100%', padding:'11px', background:savingPlan||!newPlan.name||!newPlan.name_ar?'#ccc':C.orange, border:'none', borderRadius:8, color:'#fff', fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
                {savingPlan?'...':'+ إنشاء باقة'}
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: المحاسبة */}
        {tab===3&&(
          <div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:20 }}>
              {[
                {l:'إجمالي الشركات',v:stats.orgs,c:C.navy,b:'#F0EDF7'},
                {l:'حسابات نشطة',v:stats.active,c:C.green,b:'#EAF7E0'},
                {l:'حسابات تجريبية',v:stats.trial,c:'#B07000',b:'#FFF8E8'},
              ].map(s=>(
                <div key={s.l} style={{ background:s.b, borderRadius:10, padding:'16px 18px' }}>
                  <p style={{ fontSize:28, fontWeight:800, color:s.c, margin:0 }}>{s.v}</p>
                  <p style={{ fontSize:12, color:C.muted, margin:0 }}>{s.l}</p>
                </div>
              ))}
            </div>

            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, overflow:'hidden' }}>
              <div style={{ padding:'14px 18px', borderBottom:`1px solid ${C.border}` }}>
                <span style={{ fontWeight:700, color:C.navy, fontSize:14 }}>توزيع الشركات على الباقات</span>
              </div>
              {['free','starter','pro','enterprise'].map(plan=>{
                const cnt = orgs.filter(o=>o.plan===plan).length
                const pct = orgs.length>0?Math.round(cnt/orgs.length*100):0
                const pc = PLAN_COLOR[plan]||PLAN_COLOR.free
                return (
                  <div key={plan} style={{ padding:'14px 18px', borderBottom:`1px solid ${C.border}` }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                      <span style={{ fontSize:13, fontWeight:700, color:C.navy }}>{plan.charAt(0).toUpperCase()+plan.slice(1)}</span>
                      <span style={{ fontSize:13, color:C.muted }}>{cnt} شركة ({pct}%)</span>
                    </div>
                    <div style={{ background:'#F0EDF7', borderRadius:20, height:8, overflow:'hidden' }}>
                      <div style={{ width:`${pct}%`, height:'100%', background:pc.c, borderRadius:20 }}/>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* TAB 4: النسخ الاحتياطي */}
        {tab===4&&(
          <div>
            <div style={{ background:'#FFF8E8', border:`1px solid #F5D56B`, borderRadius:10, padding:16, marginBottom:16 }}>
              <p style={{ fontSize:13, fontWeight:700, color:'#B07000', margin:'0 0 4px' }}>ℹ️ معلومات النسخ الاحتياطي</p>
              <p style={{ fontSize:12, color:'#B07000', margin:0 }}>النسخ تُصدَّر بصيغة Excel (.xlsx) وتشمل الفعاليات والتسجيلات والأعضاء</p>
            </div>

            {/* Full backup */}
            <div style={{ background:C.card, border:`2px solid ${C.orange}`, borderRadius:10, padding:20, marginBottom:16, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <h3 style={{ fontSize:15, fontWeight:800, color:C.navy, margin:'0 0 4px' }}>🗄️ نسخة كاملة للمنصة</h3>
                <p style={{ fontSize:12, color:C.muted, margin:0 }}>جميع الشركات، الفعاليات، التسجيلات</p>
              </div>
              <button onClick={downloadAllBackup} disabled={backupLoading==='all'} style={{ padding:'10px 20px', background:C.orange, border:'none', borderRadius:8, color:'#fff', fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
                {backupLoading==='all'?'جاري التحميل...':'📥 تحميل الكل'}
              </button>
            </div>

            {/* Per company backup */}
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, overflow:'hidden' }}>
              <div style={{ padding:'14px 18px', borderBottom:`1px solid ${C.border}` }}>
                <span style={{ fontWeight:700, color:C.navy, fontSize:14 }}>نسخة احتياطية لكل شركة</span>
              </div>
              {orgs.map((o,i)=>(
                <div key={o.id} style={{ padding:'12px 18px', borderBottom:i<orgs.length-1?`1px solid ${C.border}`:'none', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div>
                    <p style={{ fontSize:13, fontWeight:700, color:C.navy, margin:0 }}>{o.name}</p>
                    <p style={{ fontSize:11, color:C.muted, margin:'2px 0 0' }}>{o.plan} · {o.status}</p>
                  </div>
                  <button onClick={()=>downloadBackup(o.id,o.name)} disabled={backupLoading===o.id} style={{ padding:'7px 16px', background:'#EDE9F7', border:'none', borderRadius:6, color:'#7B4FBF', fontWeight:700, fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>
                    {backupLoading===o.id?'...':'📥 تحميل'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
