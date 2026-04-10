'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect, useMemo } from 'react'
import { createBrowserClient } from '@supabase/ssr'

const C = {
  navy:'#1E0A3C', orange:'#F05537', text:'#39364F',
  muted:'#6F7287', border:'#DBDAE3', bg:'#FAFAFA', card:'#FFFFFF', green:'#3A7D0A'
}

const ROLE_TYPES = ['استقبال','تسجيل','أمن','توجيه','تقني','ترجمة','تصوير','خدمة ضيوف','دعم إداري','أخرى']
const CITIES     = ['الرياض','جدة','الدمام','مكة المكرمة','المدينة المنورة','الخبر','الطائف','تبوك','أبها','القصيم']
const STATUS_MAP: Record<string,{label:string;bg:string;color:string}> = {
  open:     { label:'مفتوح',    bg:'#EAF7E0', color:'#1A5A00' },
  filled:   { label:'مكتمل',   bg:'#EDE9F7', color:'#5B3FA0' },
  closed:   { label:'مغلق',    bg:'#F1F1F1', color:'#6F7287' },
  pending:  { label:'معلق',    bg:'#FFF8E8', color:'#7A5000' },
  active:   { label:'نشط',     bg:'#EAF7E0', color:'#1A5A00' },
  inactive: { label:'غير نشط', bg:'#F1F1F1', color:'#6F7287' },
  verified: { label:'موثّق',   bg:'#E8F0FE', color:'#1967D2' },
}

type Request = {
  id:string; title:string; city:string; event_date:string; role_type:string; daily_rate:number
  workers_needed:number|null; workers_confirmed:number|null; status:string; description:string|null
  duration_hours:number|null; gender_preference:string|null; created_at:string; event_id:string|null
  _apps_count?: number
}
type Worker = {
  id:string; full_name:string; phone:string; city:string; gender:string|null; age:number|null
  skills:string[]|null; experience_years:number|null; daily_rate:number|null; is_verified:boolean|null
  is_available:boolean|null; rating:number|null; total_jobs:number|null; status:string|null
  email:string|null; bio:string|null; photo_url:string|null
}
type Application = {
  id:string; worker_id:string; status:string; cover_note:string|null; applied_at:string
  worker_profiles: { full_name:string; phone:string; city:string; skills:string[]|null; rating:number|null } | null
}

// ── New Request Modal ──────────────────────────────────────────────────
function NewRequestModal({ events, onClose, onSaved }: {
  events: {id:string;title:string}[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const sb = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), [])
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title:'', city:'الرياض', event_date:'', role_type:'استقبال',
    workers_needed:'1', daily_rate:'', duration_hours:'8',
    gender_preference:'any', description:'', event_id:'',
  })
  const set = (k:string, v:string) => setForm(f => ({...f,[k]:v}))

  async function save() {
    if (!form.title.trim() || !form.event_date || !form.daily_rate) {
      alert('يرجى تعبئة الحقول المطلوبة'); return
    }
    setSaving(true)
    try {
      const { error } = await sb.from('staffing_requests').insert({
        title:            form.title.trim(),
        city:             form.city,
        event_date:       form.event_date,
        role_type:        form.role_type,
        workers_needed:   parseInt(form.workers_needed)||1,
        daily_rate:       parseInt(form.daily_rate)||0,
        duration_hours:   parseInt(form.duration_hours)||8,
        gender_preference: form.gender_preference==='any'?null:form.gender_preference,
        description:      form.description||null,
        event_id:         form.event_id||null,
        status:           'open',
        workers_confirmed: 0,
      })
      if (error) throw error
      onSaved()
    } catch(e:any) { alert('خطأ: '+e.message) }
    finally { setSaving(false) }
  }

  const inp: React.CSSProperties = {
    width:'100%', padding:'9px 12px', border:`1px solid ${C.border}`, borderRadius:8,
    fontSize:13, outline:'none', fontFamily:'inherit', color:C.text, background:C.card, boxSizing:'border-box'
  }
  const lbl: React.CSSProperties = { fontSize:12, fontWeight:600, color:C.text, display:'block', marginBottom:4 }

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.45)',zIndex:100,display:'flex',alignItems:'center',justifyContent:'center',padding:16}} onClick={onClose}>
      <div style={{background:C.card,borderRadius:16,padding:24,width:'100%',maxWidth:540,maxHeight:'90vh',overflowY:'auto',direction:'rtl'}} onClick={e=>e.stopPropagation()}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
          <h2 style={{margin:0,fontSize:18,fontWeight:800,color:C.navy}}>نشر طلب توظيف جديد</h2>
          <button onClick={onClose} style={{background:'none',border:'none',fontSize:20,cursor:'pointer',color:C.muted}}>✕</button>
        </div>

        <div style={{display:'grid',gap:12}}>
          <div>
            <label style={lbl}>عنوان الدور *</label>
            <input value={form.title} onChange={e=>set('title',e.target.value)} placeholder="مثال: موظفو استقبال لمعرض التقنية" style={inp}/>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
            <div>
              <label style={lbl}>نوع الدور *</label>
              <select value={form.role_type} onChange={e=>set('role_type',e.target.value)} style={inp}>
                {ROLE_TYPES.map(r=><option key={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>المدينة *</label>
              <select value={form.city} onChange={e=>set('city',e.target.value)} style={inp}>
                {CITIES.map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10}}>
            <div>
              <label style={lbl}>تاريخ الفعالية *</label>
              <input type="date" value={form.event_date} onChange={e=>set('event_date',e.target.value)} style={inp}/>
            </div>
            <div>
              <label style={lbl}>عدد المطلوبين</label>
              <input type="number" min="1" value={form.workers_needed} onChange={e=>set('workers_needed',e.target.value)} style={inp}/>
            </div>
            <div>
              <label style={lbl}>الأجر اليومي (ر.س) *</label>
              <input type="number" value={form.daily_rate} onChange={e=>set('daily_rate',e.target.value)} placeholder="350" style={inp}/>
            </div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
            <div>
              <label style={lbl}>ساعات العمل</label>
              <input type="number" value={form.duration_hours} onChange={e=>set('duration_hours',e.target.value)} style={inp}/>
            </div>
            <div>
              <label style={lbl}>الجنس المطلوب</label>
              <select value={form.gender_preference} onChange={e=>set('gender_preference',e.target.value)} style={inp}>
                <option value="any">بدون تفضيل</option>
                <option value="male">ذكر</option>
                <option value="female">أنثى</option>
              </select>
            </div>
          </div>
          {events.length > 0 && (
            <div>
              <label style={lbl}>ربط بفعالية (اختياري)</label>
              <select value={form.event_id} onChange={e=>set('event_id',e.target.value)} style={inp}>
                <option value="">— بدون ربط —</option>
                {events.map(ev=><option key={ev.id} value={ev.id}>{ev.title}</option>)}
              </select>
            </div>
          )}
          <div>
            <label style={lbl}>تفاصيل إضافية</label>
            <textarea value={form.description} onChange={e=>set('description',e.target.value)} rows={3}
              placeholder="متطلبات خاصة، ملابس موحّدة، تدريب مسبق..." style={{...inp,resize:'vertical'}}/>
          </div>
        </div>

        <div style={{display:'flex',gap:10,marginTop:20}}>
          <button onClick={onClose} style={{flex:1,padding:'10px',border:`1px solid ${C.border}`,borderRadius:8,background:C.card,cursor:'pointer',fontWeight:600,fontSize:13,fontFamily:'inherit'}}>إلغاء</button>
          <button onClick={save} disabled={saving} style={{flex:2,padding:'10px',border:'none',borderRadius:8,background:C.orange,color:'#fff',cursor:saving?'wait':'pointer',fontWeight:700,fontSize:13,fontFamily:'inherit'}}>
            {saving ? '⏳ جاري النشر...' : '🚀 نشر الطلب'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Applications Drawer ────────────────────────────────────────────────
function AppsDrawer({ request, onClose }: { request: Request; onClose: () => void }) {
  const sb = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), [])
  const [apps, setApps]       = useState<Application[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    sb.from('worker_applications')
      .select('id,worker_id,status,cover_note,applied_at,worker_profiles(full_name,phone,city,skills,rating)')
      .or(`request_id.eq.${request.id},staffing_request_id.eq.${request.id}`)
      .order('applied_at', {ascending:false})
      .then(({data}) => { setApps((data||[]) as any); setLoading(false) })
  }, [])

  async function updateApp(appId: string, status: string) {
    await sb.from('worker_applications').update({status, reviewed_at: new Date().toISOString()}).eq('id', appId)
    setApps(a => a.map(x => x.id===appId ? {...x,status} : x))
    if (status === 'accepted') {
      await sb.from('staffing_requests').update({
        workers_confirmed: (request.workers_confirmed||0) + 1
      }).eq('id', request.id)
    }
  }

  const st = STATUS_MAP
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.4)',zIndex:100,display:'flex',justifyContent:'flex-end'}} onClick={onClose}>
      <div style={{width:'min(460px,100%)',background:C.card,height:'100%',overflowY:'auto',direction:'rtl',boxShadow:'-8px 0 32px rgba(0,0,0,0.15)'}} onClick={e=>e.stopPropagation()}>
        <div style={{padding:'20px 20px 16px',borderBottom:`1px solid ${C.border}`,position:'sticky',top:0,background:C.card,zIndex:1}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
            <div>
              <h3 style={{margin:0,fontSize:16,fontWeight:800,color:C.navy}}>{request.title}</h3>
              <p style={{margin:'3px 0 0',fontSize:12,color:C.muted}}>📍 {request.city} · 📅 {request.event_date}</p>
            </div>
            <button onClick={onClose} style={{background:'none',border:'none',fontSize:20,cursor:'pointer',color:C.muted,padding:0}}>✕</button>
          </div>
          <div style={{display:'flex',gap:8,marginTop:10}}>
            {[
              {l:'إجمالي',v:apps.length,c:C.navy},
              {l:'مقبول',v:apps.filter(a=>a.status==='accepted').length,c:C.green},
              {l:'بانتظار',v:apps.filter(a=>a.status==='pending').length,c:'#B07000'},
            ].map(s=>(
              <div key={s.l} style={{flex:1,textAlign:'center',padding:'6px',background:'#F8F7FA',borderRadius:6}}>
                <p style={{fontSize:16,fontWeight:800,color:s.c,margin:0}}>{s.v}</p>
                <p style={{fontSize:10,color:C.muted,margin:0}}>{s.l}</p>
              </div>
            ))}
          </div>
        </div>

        <div style={{padding:16}}>
          {loading ? (
            <p style={{textAlign:'center',color:C.muted,padding:30}}>جاري التحميل...</p>
          ) : apps.length === 0 ? (
            <div style={{textAlign:'center',padding:40}}>
              <div style={{fontSize:40,marginBottom:8}}>📭</div>
              <p style={{color:C.muted,fontSize:13}}>لا توجد طلبات حتى الآن</p>
            </div>
          ) : apps.map(app => {
            const w = app.worker_profiles
            const s = STATUS_MAP[app.status]||STATUS_MAP['pending']
            return (
              <div key={app.id} style={{border:`1px solid ${C.border}`,borderRadius:10,padding:14,marginBottom:10}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8}}>
                  <div>
                    <p style={{fontWeight:700,color:C.navy,margin:0,fontSize:14}}>{w?.full_name||'—'}</p>
                    <p style={{fontSize:11,color:C.muted,margin:'2px 0 0'}}>📍 {w?.city||'—'} · ⭐ {w?.rating||'—'}</p>
                  </div>
                  <span style={{fontSize:11,fontWeight:600,padding:'3px 8px',borderRadius:6,background:s.bg,color:s.color}}>{s.label}</span>
                </div>
                {w?.skills && w.skills.length > 0 && (
                  <div style={{display:'flex',gap:4,flexWrap:'wrap',marginBottom:8}}>
                    {w.skills.slice(0,4).map((sk,i)=>(
                      <span key={i} style={{fontSize:10,background:'#EDE9F7',color:'#5B3FA0',padding:'2px 7px',borderRadius:10}}>{sk}</span>
                    ))}
                  </div>
                )}
                {app.cover_note && <p style={{fontSize:12,color:C.text,background:'#F8F7FA',borderRadius:6,padding:'7px 10px',margin:'0 0 8px'}}>{app.cover_note}</p>}
                {app.status === 'pending' && (
                  <div style={{display:'flex',gap:7}}>
                    <button onClick={()=>updateApp(app.id,'accepted')} style={{flex:1,padding:'7px',background:C.green,border:'none',borderRadius:6,color:'#fff',fontWeight:700,fontSize:12,cursor:'pointer',fontFamily:'inherit'}}>✓ قبول</button>
                    <button onClick={()=>updateApp(app.id,'rejected')} style={{flex:1,padding:'7px',background:'#FEF2F2',border:'none',borderRadius:6,color:'#DC2626',fontWeight:700,fontSize:12,cursor:'pointer',fontFamily:'inherit'}}>✕ رفض</button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────
export default function StaffingPage() {
  const sb = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), [])

  const [tab, setTab]             = useState<'requests'|'workers'>('requests')
  const [requests, setRequests]   = useState<Request[]>([])
  const [workers, setWorkers]     = useState<Worker[]>([])
  const [events, setEvents]       = useState<{id:string;title:string}[]>([])
  const [loading, setLoading]     = useState(true)
  const [showNew, setShowNew]     = useState(false)
  const [viewApps, setViewApps]   = useState<Request|null>(null)
  const [search, setSearch]       = useState('')
  const [filterCity, setFilterCity] = useState('')
  const [appCounts, setAppCounts] = useState<Record<string,number>>({})

  async function loadRequests() {
    const {data} = await sb.from('staffing_requests').select('*').order('created_at',{ascending:false}).limit(100)
    const reqs = (data||[]) as Request[]
    setRequests(reqs)
    // Load application counts
    if (reqs.length > 0) {
      const {data:apps} = await sb.from('worker_applications').select('staffing_request_id,request_id')
      const counts: Record<string,number> = {}
      ;(apps||[]).forEach((a:any) => {
        const rid = a.staffing_request_id || a.request_id
        if (rid) counts[rid] = (counts[rid]||0) + 1
      })
      setAppCounts(counts)
    }
  }

  async function loadWorkers() {
    const {data} = await sb.from('worker_profiles').select('*').order('created_at',{ascending:false}).limit(100)
    setWorkers((data||[]) as Worker[])
  }

  async function loadEvents() {
    const {data} = await sb.from('events').select('id,title').in('status',['published','draft']).order('start_date',{ascending:false}).limit(50)
    setEvents(data||[])
  }

  useEffect(() => {
    Promise.all([loadRequests(), loadWorkers(), loadEvents()]).finally(() => setLoading(false))
  }, [])

  async function toggleWorkerStatus(w: Worker) {
    const nv = !w.is_available
    await sb.from('worker_profiles').update({is_available:nv}).eq('id',w.id)
    setWorkers(ws => ws.map(x => x.id===w.id ? {...x,is_available:nv} : x))
  }

  const filteredReqs = requests.filter(r =>
    (!search || r.title.includes(search) || r.role_type.includes(search) || r.city.includes(search)) &&
    (!filterCity || r.city === filterCity)
  )
  const filteredWorkers = workers.filter(w =>
    (!search || w.full_name.includes(search) || (w.city||'').includes(search)) &&
    (!filterCity || w.city === filterCity)
  )

  // Stats
  const stats = {
    openReqs:     requests.filter(r=>r.status==='open').length,
    totalWorkers: workers.length,
    available:    workers.filter(w=>w.is_available).length,
    pending:      Object.values(appCounts).reduce((a,b)=>a+b,0),
  }

  const inp: React.CSSProperties = {
    padding:'9px 13px', border:`1px solid ${C.border}`, borderRadius:8,
    fontSize:13, outline:'none', fontFamily:'inherit', color:C.text, background:C.card
  }

  return (
    <div style={{minHeight:'100vh', background:C.bg, direction:'rtl'}}>
      {/* Header */}
      <div style={{background:C.card, borderBottom:`1px solid ${C.border}`, padding:'20px 24px 0'}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16}}>
          <div>
            <h1 style={{fontSize:26, fontWeight:800, margin:0, color:C.navy}}>👷 الكوادر البشرية</h1>
            <p style={{color:C.muted, fontSize:12, margin:'3px 0 0'}}>إدارة طلبات التوظيف وقاعدة الكوادر</p>
          </div>
          <button onClick={()=>setShowNew(true)} style={{
            padding:'9px 18px', background:C.orange, color:'#fff', border:'none',
            borderRadius:8, fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit',
            display:'flex', alignItems:'center', gap:6
          }}>+ نشر طلب جديد</button>
        </div>

        {/* Stats */}
        <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:16}}>
          {[
            {icon:'📋', label:'طلبات مفتوحة', value:stats.openReqs,     color:C.orange},
            {icon:'👥', label:'إجمالي الكوادر',value:stats.totalWorkers, color:C.navy},
            {icon:'✅', label:'متاحون الآن',   value:stats.available,    color:C.green},
            {icon:'📨', label:'طلبات تقديم',   value:stats.pending,      color:'#7B4FBF'},
          ].map(s=>(
            <div key={s.label} style={{background:'#F8F7FA', borderRadius:10, padding:'12px 14px'}}>
              <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:4}}>
                <span style={{fontSize:18}}>{s.icon}</span>
                <span style={{fontSize:22, fontWeight:800, color:s.color}}>{s.value}</span>
              </div>
              <p style={{fontSize:11, color:C.muted, margin:0}}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{display:'flex', borderTop:`1px solid ${C.border}`, marginTop:4}}>
          {([['requests','📋 طلبات التوظيف'],['workers','👤 قاعدة الكوادر']] as const).map(([t,l])=>(
            <button key={t} onClick={()=>setTab(t)} style={{
              flex:1, padding:'10px', background:'none', border:'none', cursor:'pointer',
              borderBottom: tab===t ? `2px solid ${C.orange}` : '2px solid transparent',
              color: tab===t ? C.orange : C.muted,
              fontWeight: tab===t ? 700 : 500, fontSize:13, fontFamily:'inherit', marginBottom:-1
            }}>{l}</button>
          ))}
        </div>
      </div>

      <div style={{padding:'16px 24px', maxWidth:1100, margin:'0 auto'}}>
        {/* Search + Filter */}
        <div style={{display:'flex', gap:10, marginBottom:16}}>
          <input value={search} onChange={e=>setSearch(e.target.value)}
            placeholder={tab==='requests'?'بحث في الطلبات...':'بحث في الكوادر...'}
            style={{...inp, flex:1}}/>
          <select value={filterCity} onChange={e=>setFilterCity(e.target.value)} style={{...inp, minWidth:120}}>
            <option value="">كل المدن</option>
            {CITIES.map(c=><option key={c}>{c}</option>)}
          </select>
        </div>

        {loading ? (
          <div style={{textAlign:'center', padding:60, color:C.muted}}>جاري التحميل...</div>
        ) : tab === 'requests' ? (
          /* ── REQUESTS TAB ── */
          filteredReqs.length === 0 ? (
            <div style={{textAlign:'center', padding:60}}>
              <div style={{fontSize:50, marginBottom:12}}>📋</div>
              <h3 style={{color:C.navy, margin:'0 0 6px'}}>لا توجد طلبات بعد</h3>
              <p style={{color:C.muted, fontSize:13}}>انشر طلبك الأول للعثور على الكوادر المناسبة</p>
              <button onClick={()=>setShowNew(true)} style={{marginTop:14, padding:'10px 24px', background:C.orange, color:'#fff', border:'none', borderRadius:8, fontWeight:700, cursor:'pointer', fontFamily:'inherit'}}>+ نشر طلب الآن</button>
            </div>
          ) : (
            <div style={{display:'grid', gap:12}}>
              {filteredReqs.map(req => {
                const st = STATUS_MAP[req.status] || STATUS_MAP['open']
                const filled  = req.workers_confirmed || 0
                const needed  = req.workers_needed || 1
                const pct     = Math.min(100, Math.round(filled / needed * 100))
                const appCnt  = appCounts[req.id] || 0
                return (
                  <div key={req.id} style={{background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:'16px 18px'}}>
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10}}>
                      <div style={{flex:1}}>
                        <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:4}}>
                          <h3 style={{margin:0, fontSize:15, fontWeight:700, color:C.navy}}>{req.title}</h3>
                          <span style={{fontSize:11, fontWeight:600, padding:'2px 8px', borderRadius:6, background:st.bg, color:st.color}}>{st.label}</span>
                        </div>
                        <div style={{display:'flex', gap:12, flexWrap:'wrap'}}>
                          <span style={{fontSize:12, color:C.muted}}>🏷️ {req.role_type}</span>
                          <span style={{fontSize:12, color:C.muted}}>📍 {req.city}</span>
                          <span style={{fontSize:12, color:C.muted}}>📅 {req.event_date}</span>
                          <span style={{fontSize:12, color:C.muted}}>⏱️ {req.duration_hours||8} ساعات</span>
                          <span style={{fontSize:12, fontWeight:700, color:C.orange}}>💰 {req.daily_rate} ر.س/يوم</span>
                          {req.gender_preference && <span style={{fontSize:12, color:C.muted}}>👤 {req.gender_preference==='male'?'ذكر':req.gender_preference==='female'?'أنثى':'—'}</span>}
                        </div>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div style={{marginBottom:10}}>
                      <div style={{display:'flex', justifyContent:'space-between', marginBottom:4}}>
                        <span style={{fontSize:11, color:C.muted}}>الكوادر المؤكدة: {filled} / {needed}</span>
                        <span style={{fontSize:11, fontWeight:700, color:pct===100?C.green:C.navy}}>{pct}%</span>
                      </div>
                      <div style={{background:'#EDE9F7', borderRadius:50, height:6, overflow:'hidden'}}>
                        <div style={{width:`${pct}%`, height:'100%', background:pct===100?C.green:C.orange, borderRadius:50, transition:'width 0.4s'}}/>
                      </div>
                    </div>

                    {req.description && (
                      <p style={{fontSize:12, color:C.muted, margin:'0 0 10px', background:'#F8F7FA', padding:'7px 10px', borderRadius:6}}>{req.description}</p>
                    )}

                    <div style={{display:'flex', gap:8, alignItems:'center'}}>
                      <button onClick={()=>setViewApps(req)} style={{
                        padding:'7px 14px', background:appCnt>0?'#EDE9F7':C.bg,
                        border:`1px solid ${appCnt>0?'#B4A7D6':C.border}`,
                        borderRadius:7, cursor:'pointer', fontWeight:600, fontSize:12,
                        color:appCnt>0?'#5B3FA0':C.text, fontFamily:'inherit'
                      }}>📨 {appCnt} طلب تقديم</button>
                      <div style={{flex:1}}/>
                      {req.status === 'open' ? (
                        <button onClick={async()=>{
                          await sb.from('staffing_requests').update({status:'closed'}).eq('id',req.id)
                          setRequests(rs=>rs.map(r=>r.id===req.id?{...r,status:'closed'}:r))
                        }} style={{padding:'7px 12px', background:'#F1F1F1', border:'none', borderRadius:7, cursor:'pointer', fontSize:12, color:C.muted, fontFamily:'inherit'}}>إغلاق</button>
                      ) : (
                        <button onClick={async()=>{
                          await sb.from('staffing_requests').update({status:'open'}).eq('id',req.id)
                          setRequests(rs=>rs.map(r=>r.id===req.id?{...r,status:'open'}:r))
                        }} style={{padding:'7px 12px', background:'#EAF7E0', border:'none', borderRadius:7, cursor:'pointer', fontSize:12, color:C.green, fontFamily:'inherit'}}>إعادة فتح</button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )
        ) : (
          /* ── WORKERS TAB ── */
          filteredWorkers.length === 0 ? (
            <div style={{textAlign:'center', padding:60}}>
              <div style={{fontSize:50, marginBottom:12}}>👤</div>
              <h3 style={{color:C.navy, margin:'0 0 6px'}}>لا يوجد كوادر مسجلون بعد</h3>
              <p style={{color:C.muted, fontSize:13}}>الكوادر يُسجَّلون عبر رابط التسجيل الخاص</p>
            </div>
          ) : (
            <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:12}}>
              {filteredWorkers.map(w => {
                const st = w.is_verified ? STATUS_MAP['verified'] : w.is_available ? STATUS_MAP['active'] : STATUS_MAP['inactive']
                const initials = w.full_name.split(' ').map(n=>n[0]).slice(0,2).join('')
                return (
                  <div key={w.id} style={{background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:16}}>
                    <div style={{display:'flex', gap:12, alignItems:'flex-start', marginBottom:10}}>
                      <div style={{width:44, height:44, borderRadius:'50%', background:'linear-gradient(135deg,#B4A7D6,#7B4FBF)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:800, fontSize:16, flexShrink:0}}>
                        {initials}
                      </div>
                      <div style={{flex:1, minWidth:0}}>
                        <div style={{display:'flex', alignItems:'center', gap:6, marginBottom:2}}>
                          <p style={{margin:0, fontWeight:700, color:C.navy, fontSize:14, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{w.full_name}</p>
                          {w.nafath_verified && <span title='موثّق بنفاذ' style={{fontSize:11,background:'#EAF7E0',color:'#1A5A00',padding:'2px 7px',borderRadius:8,fontWeight:700,border:'1px solid #C3E6C3'}}>🛡️ نفاذ</span>}
                        {!w.nafath_verified && w.is_verified && <span style={{fontSize:13}}>✅</span>}
                        </div>
                        <div style={{display:'flex', gap:8}}>
                          <span style={{fontSize:11, color:C.muted}}>📍 {w.city}</span>
                          {w.rating && <span style={{fontSize:11, color:'#B07000'}}>⭐ {Number(w.rating).toFixed(1)}</span>}
                          {w.total_jobs && <span style={{fontSize:11, color:C.muted}}>{w.total_jobs} وظيفة</span>}
                        </div>
                      </div>
                      <span style={{fontSize:10, fontWeight:600, padding:'3px 7px', borderRadius:6, background:st.bg, color:st.color, whiteSpace:'nowrap', flexShrink:0}}>{st.label}</span>
                    </div>

                    {w.skills && w.skills.length > 0 && (
                      <div style={{display:'flex', gap:4, flexWrap:'wrap', marginBottom:10}}>
                        {w.skills.slice(0,4).map((sk,i)=>(
                          <span key={i} style={{fontSize:10, background:'#EDE9F7', color:'#5B3FA0', padding:'2px 7px', borderRadius:10}}>{sk}</span>
                        ))}
                        {w.skills.length > 4 && <span style={{fontSize:10, color:C.muted}}>+{w.skills.length-4}</span>}
                      </div>
                    )}

                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', paddingTop:10, borderTop:`1px solid ${C.border}`}}>
                      <div>
                        {w.daily_rate && <span style={{fontSize:12, fontWeight:700, color:C.orange}}>{w.daily_rate} ر.س/يوم</span>}
                        {w.experience_years && <span style={{fontSize:11, color:C.muted, marginRight:8}}>{w.experience_years} سنة خبرة</span>}
                      </div>
                      <button onClick={()=>toggleWorkerStatus(w)} style={{
                        padding:'5px 10px', border:'none', borderRadius:6, cursor:'pointer', fontSize:11, fontWeight:600, fontFamily:'inherit',
                        background: w.is_available ? '#FEF2F2' : '#EAF7E0',
                        color: w.is_available ? '#DC2626' : C.green
                      }}>{w.is_available ? '⏸ إيقاف' : '▶ تفعيل'}</button>
                    </div>
                  </div>
                )
              })}
            </div>
          )
        )}
      </div>

      {showNew && <NewRequestModal events={events} onClose={()=>setShowNew(false)} onSaved={()=>{ setShowNew(false); loadRequests() }}/>}
      {viewApps && <AppsDrawer request={viewApps} onClose={()=>setViewApps(null)}/>}
    </div>
  )
}

