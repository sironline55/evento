'use client'
import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
const C = { navy:'#1E0A3C', orange:'#F05537', border:'#DBDAE3', muted:'#6F7287', text:'#39364F', bg:'#FAFAFA', card:'#FFFFFF', green:'#3A7D0A', purple:'#7B4FBF' }
const fs = { width:'100%', padding:'9px 12px', border:`1px solid ${C.border}`, borderRadius:6, fontSize:13, outline:'none', fontFamily:'inherit', color:C.text, background:C.bg, boxSizing:'border-box' as const }

const TABS = ['لوحة التحكم', 'الشركات المشتركة', 'الباقات', 'الكوادر', 'الفعاليات']

export default function SuperAdminDashboard() {
  const router = useRouter()
  const [tab, setTab]       = useState(0)
  const [stats, setStats]   = useState({ orgs:0, events:0, regs:0, workers:0, revenue:0 })
  const [orgs, setOrgs]     = useState<any[]>([])
  const [plans, setPlans]   = useState<any[]>([])
  const [workers, setWorkers] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editPlan, setEditPlan] = useState<any>(null)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await sb.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: prof } = await sb.from('profiles').select('role, portal_role').eq('id', user.id).single()
      if (prof?.role !== 'super_admin' && prof?.portal_role !== 'super_admin') { router.push('/'); return }

      const [o, e, r, w, p] = await Promise.all([
        sb.from('organizations').select('*, plans(name_ar)', { count: 'exact' }).order('created_at', { ascending: false }),
        sb.from('events').select('*', { count: 'exact', head: true }),
        sb.from('registrations').select('*', { count: 'exact', head: true }),
        sb.from('worker_profiles').select('*', { count: 'exact' }).order('created_at', { ascending: false }),
        sb.from('plans').select('*').order('sort_order'),
      ])
      setOrgs(o.data || []); setPlans(p.data || [])
      setWorkers(w.data || []); setEvents(e.data ? [] : [])
      setStats({ orgs: o.count||0, events: e.count||0, regs: r.count||0, workers: w.count||0, revenue:0 })
      setLoading(false)
    }
    load()
  }, [])

  async function savePlan(plan: any) {
    const { id, ...rest } = plan
    if (id) await sb.from('plans').update(rest).eq('id', id)
    else await sb.from('plans').insert(rest)
    const { data } = await sb.from('plans').select('*').order('sort_order')
    setPlans(data || []); setEditPlan(null)
  }

  async function toggleOrg(id: string, active: boolean) {
    await sb.from('organizations').update({ is_active: !active }).eq('id', id)
    setOrgs(o => o.map(x => x.id===id ? { ...x, is_active: !active } : x))
  }

  async function verifyWorker(id: string) {
    await sb.from('worker_profiles').update({ is_verified: true }).eq('id', id)
    setWorkers(w => w.map(x => x.id===id ? { ...x, is_verified: true } : x))
  }

  async function assignPlan(orgId: string, planId: string) {
    const expires = new Date(); expires.setFullYear(expires.getFullYear()+1)
    await sb.from('organizations').update({ plan_id: planId, plan_expires_at: expires.toISOString() }).eq('id', orgId)
    setOrgs(o => o.map(x => x.id===orgId ? { ...x, plan_id: planId } : x))
  }

  if (loading) return <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', color:C.muted }}>جاري التحميل...</div>

  return (
    <div style={{ minHeight:'100vh', background:C.bg, direction:'rtl' }}>
      {/* Header */}
      <div style={{ background:`linear-gradient(135deg, ${C.navy}, #3D1A78)`, padding:'20px 24px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:40, height:40, background:C.orange, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:800, fontSize:18 }}>E</div>
            <div>
              <h1 style={{ color:'#fff', fontSize:18, fontWeight:800, margin:0 }}>EventVMS — الإدارة العليا</h1>
              <p style={{ color:'rgba(255,255,255,0.6)', fontSize:12, margin:0 }}>Super Admin Dashboard</p>
            </div>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <Link href="/portal" style={{ padding:'7px 14px', background:'rgba(255,255,255,0.15)', borderRadius:6, color:'#fff', fontSize:12, textDecoration:'none', fontWeight:600 }}>🌐 البوابات</Link>
            <button onClick={async()=>{await sb.auth.signOut();router.push('/login')}} style={{ padding:'7px 14px', background:'rgba(255,255,255,0.15)', border:'none', borderRadius:6, color:'#fff', fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>خروج</button>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:10, marginTop:20 }}>
          {[
            { l:'الشركات',     v:stats.orgs,    icon:'🏢', c:'rgba(255,255,255,0.9)' },
            { l:'الفعاليات',   v:stats.events,  icon:'📅', c:'rgba(255,255,255,0.9)' },
            { l:'التسجيلات',   v:stats.regs,    icon:'🎟', c:'rgba(255,255,255,0.9)' },
            { l:'الكوادر',     v:stats.workers, icon:'👷', c:'rgba(255,255,255,0.9)' },
            { l:'الإيراد',     v:'—',           icon:'💰', c:'rgba(255,255,255,0.9)' },
          ].map(s => (
            <div key={s.l} style={{ background:'rgba(255,255,255,0.1)', borderRadius:10, padding:'12px', textAlign:'center' }}>
              <div style={{ fontSize:20, marginBottom:4 }}>{s.icon}</div>
              <p style={{ fontSize:22, fontWeight:800, color:'#fff', margin:0 }}>{s.v}</p>
              <p style={{ fontSize:11, color:'rgba(255,255,255,0.65)', margin:0 }}>{s.l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background:C.card, borderBottom:`1px solid ${C.border}`, overflowX:'auto' }}>
        <div style={{ display:'flex', minWidth:'max-content' }}>
          {TABS.map((t,i) => (
            <button key={i} onClick={()=>setTab(i)} style={{ padding:'12px 20px', border:'none', background:'transparent', cursor:'pointer', fontFamily:'inherit', fontSize:13, fontWeight:tab===i?700:500, color:tab===i?C.orange:C.muted, borderBottom:tab===i?`3px solid ${C.orange}`:'3px solid transparent', whiteSpace:'nowrap' }}>{t}</button>
          ))}
        </div>
      </div>

      <div style={{ padding:'16px', maxWidth:1100, margin:'0 auto' }}>

        {/* TAB 0: Dashboard */}
        {tab===0 && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            {/* Quick actions */}
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:20 }}>
              <h3 style={{ fontSize:14, fontWeight:700, color:C.navy, margin:'0 0 14px' }}>إجراءات سريعة</h3>
              {[
                { label:'إضافة شركة جديدة',   icon:'🏢', action:()=>setTab(1), color:C.navy  },
                { label:'تعديل الباقات',       icon:'💎', action:()=>setTab(2), color:C.purple},
                { label:'توثيق كادر',          icon:'✓',  action:()=>setTab(3), color:C.green },
                { label:'عرض الفعاليات',       icon:'📅', action:()=>setTab(4), color:C.orange},
              ].map(q => (
                <button key={q.label} onClick={q.action} style={{ display:'flex', alignItems:'center', gap:10, width:'100%', padding:'11px 14px', background:'#F8F7FA', border:`1px solid ${C.border}`, borderRadius:8, cursor:'pointer', fontFamily:'inherit', marginBottom:8, textAlign:'right' }}>
                  <span style={{ fontSize:18 }}>{q.icon}</span>
                  <span style={{ fontSize:13, fontWeight:600, color:q.color }}>{q.label}</span>
                </button>
              ))}
            </div>
            {/* Recent orgs */}
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, overflow:'hidden' }}>
              <div style={{ padding:'14px 18px', borderBottom:`1px solid ${C.border}` }}>
                <span style={{ fontWeight:700, color:C.navy, fontSize:14 }}>آخر الشركات المسجلة</span>
              </div>
              {orgs.slice(0,5).map((o,i) => (
                <div key={o.id} style={{ padding:'12px 18px', borderBottom:i<4?`1px solid ${C.border}`:'none', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div>
                    <p style={{ fontSize:13, fontWeight:700, color:C.navy, margin:0 }}>{o.name}</p>
                    <p style={{ fontSize:11, color:C.muted, margin:'2px 0 0' }}>{(o.plans as any)?.name_ar || 'بدون باقة'}</p>
                  </div>
                  <span style={{ padding:'3px 10px', borderRadius:20, fontSize:10, fontWeight:700, color:o.is_active!==false?C.green:'#DC2626', background:o.is_active!==false?'#EAF7E0':'#FEF2F2' }}>{o.is_active!==false?'نشط':'موقف'}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 1: Organizations */}
        {tab===1 && (
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, overflow:'hidden' }}>
            <div style={{ padding:'14px 18px', borderBottom:`1px solid ${C.border}`, display:'flex', justifyContent:'space-between' }}>
              <span style={{ fontWeight:700, color:C.navy, fontSize:14 }}>🏢 الشركات المشتركة ({orgs.length})</span>
            </div>
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                  <tr style={{ background:'#F8F7FA', borderBottom:`1px solid ${C.border}` }}>
                    {['الشركة','المالك','الباقة','تاريخ الانضمام','الحالة','إجراءات'].map(h=>(
                      <th key={h} style={{ padding:'10px 14px', textAlign:'right', fontSize:11, fontWeight:700, color:C.muted, whiteSpace:'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orgs.map((o,i) => (
                    <tr key={o.id} style={{ borderBottom:`1px solid ${C.border}` }}>
                      <td style={{ padding:'12px 14px' }}>
                        <p style={{ fontSize:13, fontWeight:700, color:C.navy, margin:0 }}>{o.name}</p>
                        {o.website && <p style={{ fontSize:11, color:C.muted, margin:'2px 0 0' }}>{o.website}</p>}
                      </td>
                      <td style={{ padding:'12px 14px', fontSize:12, color:C.muted }}>{o.owner_id?.slice(0,8)}...</td>
                      <td style={{ padding:'12px 14px' }}>
                        <select value={o.plan_id||''} onChange={e=>assignPlan(o.id,e.target.value)} style={{ ...fs, width:'auto', padding:'5px 8px', fontSize:11 }}>
                          <option value="">بدون باقة</option>
                          {plans.map(p => <option key={p.id} value={p.id}>{p.name_ar}</option>)}
                        </select>
                      </td>
                      <td style={{ padding:'12px 14px', fontSize:11, color:C.muted }}>{new Date(o.created_at).toLocaleDateString('ar-SA')}</td>
                      <td style={{ padding:'12px 14px' }}>
                        <span style={{ padding:'3px 10px', borderRadius:20, fontSize:10, fontWeight:700, color:o.is_active!==false?C.green:'#DC2626', background:o.is_active!==false?'#EAF7E0':'#FEF2F2' }}>{o.is_active!==false?'نشط':'موقف'}</span>
                      </td>
                      <td style={{ padding:'12px 14px' }}>
                        <button onClick={()=>toggleOrg(o.id, o.is_active!==false)} style={{ padding:'5px 12px', border:`1px solid ${C.border}`, borderRadius:5, background:C.bg, fontSize:11, cursor:'pointer', fontFamily:'inherit', fontWeight:600, color:C.text }}>
                          {o.is_active!==false?'إيقاف':'تفعيل'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: Plans */}
        {tab===2 && (
          <div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16, marginBottom:20 }}>
              {plans.map(p => (
                <div key={p.id} style={{ background:C.card, border:`2px solid ${p.slug==='pro'?C.orange:C.border}`, borderRadius:12, overflow:'hidden' }}>
                  {p.slug==='pro' && <div style={{ background:C.orange, padding:'4px', textAlign:'center' }}><span style={{ color:'#fff', fontSize:11, fontWeight:700 }}>الأكثر شيوعاً</span></div>}
                  <div style={{ padding:20 }}>
                    <h3 style={{ fontSize:18, fontWeight:800, color:C.navy, margin:'0 0 4px' }}>{p.name_ar}</h3>
                    <p style={{ fontSize:26, fontWeight:800, color:p.slug==='pro'?C.orange:C.navy, margin:'0 0 12px' }}>
                      {p.price_monthly===0?'مجاني':`SAR ${p.price_monthly}`}<span style={{ fontSize:13, fontWeight:500, color:C.muted }}>{p.price_monthly>0?'/شهر':''}</span>
                    </p>
                    <div style={{ borderTop:`1px solid ${C.border}`, paddingTop:12, marginBottom:12 }}>
                      {[
                        ['الفعاليات', p.max_events?p.max_events+' فعالية':'غير محدود'],
                        ['الكوادر',   p.max_staff?p.max_staff+' كادر':'غير محدود'],
                        ['الزوار/فعالية', p.max_attendees?p.max_attendees:'غير محدود'],
                      ].map(([k,v]) => (
                        <div key={k as string} style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:6 }}>
                          <span style={{ color:C.muted }}>{k}</span>
                          <span style={{ fontWeight:700, color:C.navy }}>{v}</span>
                        </div>
                      ))}
                    </div>
                    <div style={{ marginBottom:14 }}>
                      {(p.features||[]).map((f:string,i:number) => (
                        <p key={i} style={{ fontSize:12, color:C.text, margin:'0 0 4px' }}>✓ {f}</p>
                      ))}
                    </div>
                    <button onClick={()=>setEditPlan(p)} style={{ width:'100%', padding:'9px', border:`1px solid ${C.border}`, borderRadius:6, background:C.bg, color:C.text, fontWeight:600, fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>✏️ تعديل</button>
                  </div>
                </div>
              ))}
            </div>

            {/* Edit plan modal */}
            {editPlan && (
              <div style={{ background:C.card, border:`2px solid ${C.orange}`, borderRadius:12, padding:24, maxWidth:500 }}>
                <h3 style={{ fontSize:15, fontWeight:700, color:C.navy, margin:'0 0 16px' }}>تعديل باقة: {editPlan.name_ar}</h3>
                {[
                  ['name_ar','الاسم العربي','text'],
                  ['price_monthly','السعر الشهري (SAR)','number'],
                  ['price_yearly','السعر السنوي (SAR)','number'],
                  ['max_events','أقصى فعاليات (فارغ=غير محدود)','number'],
                  ['max_staff','أقصى كوادر (فارغ=غير محدود)','number'],
                  ['max_attendees','أقصى زوار/فعالية (فارغ=غير محدود)','number'],
                ].map(([k,l,t]) => (
                  <div key={k as string} style={{ marginBottom:10 }}>
                    <label style={{ fontSize:12, fontWeight:600, color:C.navy, display:'block', marginBottom:4 }}>{l}</label>
                    <input type={t as string} value={editPlan[k as string]??''} onChange={e=>setEditPlan((p:any)=>({...p,[k as string]:e.target.value||null}))} style={fs}/>
                  </div>
                ))}
                <div style={{ display:'flex', gap:8, marginTop:14 }}>
                  <button onClick={()=>savePlan(editPlan)} style={{ flex:1, padding:'10px', background:C.orange, border:'none', borderRadius:8, color:'#fff', fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>💾 حفظ</button>
                  <button onClick={()=>setEditPlan(null)} style={{ padding:'10px 18px', border:`1px solid ${C.border}`, borderRadius:8, background:C.bg, color:C.text, fontWeight:600, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>إلغاء</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Workers */}
        {tab===3 && (
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, overflow:'hidden' }}>
            <div style={{ padding:'14px 18px', borderBottom:`1px solid ${C.border}` }}>
              <span style={{ fontWeight:700, color:C.navy, fontSize:14 }}>👷 الكوادر ({workers.length})</span>
            </div>
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                  <tr style={{ background:'#F8F7FA', borderBottom:`1px solid ${C.border}` }}>
                    {['الاسم','الجوال','المدينة','التقييم','الفعاليات','التوثيق','إجراء'].map(h=>(
                      <th key={h} style={{ padding:'10px 14px', textAlign:'right', fontSize:11, fontWeight:700, color:C.muted, whiteSpace:'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {workers.map((w,i) => (
                    <tr key={w.id} style={{ borderBottom:`1px solid ${C.border}` }}>
                      <td style={{ padding:'10px 14px' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <div style={{ width:32, height:32, background:'#EDE9F7', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, color:C.purple, flexShrink:0 }}>
                            {w.full_name?.[0]||'?'}
                          </div>
                          <div>
                            <p style={{ fontSize:13, fontWeight:700, color:C.navy, margin:0 }}>{w.full_name}</p>
                            <p style={{ fontSize:11, color:C.muted, margin:0 }}>{w.skills?.slice(0,2).join(', ')}</p>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding:'10px 14px', fontSize:12, color:C.muted }}>{w.mobile_number||w.phone||'—'}</td>
                      <td style={{ padding:'10px 14px', fontSize:12, color:C.muted }}>{w.city||'—'}</td>
                      <td style={{ padding:'10px 14px' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                          <span style={{ fontSize:13, fontWeight:800, color:C.orange }}>{w.rating_avg?.toFixed(1)||'—'}</span>
                          <span style={{ fontSize:11, color:C.muted }}>({w.rating_count||0})</span>
                        </div>
                      </td>
                      <td style={{ padding:'10px 14px', fontSize:12, fontWeight:700, color:C.blue, textAlign:'center' }}>{w.total_events||0}</td>
                      <td style={{ padding:'10px 14px' }}>
                        <span style={{ padding:'3px 10px', borderRadius:20, fontSize:10, fontWeight:700, color:w.is_verified?C.green:'#B07000', background:w.is_verified?'#EAF7E0':'#FFF8E8' }}>
                          {w.is_verified?'✓ موثّق':'⏳ بانتظار'}
                        </span>
                      </td>
                      <td style={{ padding:'10px 14px' }}>
                        {!w.is_verified && (
                          <button onClick={()=>verifyWorker(w.id)} style={{ padding:'5px 12px', background:'#EAF7E0', border:'none', borderRadius:5, color:C.green, fontWeight:700, fontSize:11, cursor:'pointer', fontFamily:'inherit' }}>توثيق ✓</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: Events */}
        {tab===4 && (
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:20, textAlign:'center' }}>
            <p style={{ fontSize:32, marginBottom:8 }}>📅</p>
            <p style={{ color:C.muted, fontSize:13 }}>عرض جميع فعاليات المنصة</p>
            <Link href="/super-admin/organizations" style={{ color:C.orange, textDecoration:'none', fontWeight:600, fontSize:13 }}>عرض الفعاليات ←</Link>
          </div>
        )}
      </div>
    </div>
  )
}
