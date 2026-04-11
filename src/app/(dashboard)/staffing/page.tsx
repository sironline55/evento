'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect, useMemo, useRef } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import MobilePageHeader from '@/components/layout/MobilePageHeader'

const C = {
  navy:'#1E0A3C', orange:'#F05537', text:'#39364F',
  muted:'#6F7287', border:'#DBDAE3', bg:'#FAFAFA', card:'#FFFFFF', green:'#3A7D0A'
}
const ROLE_TYPES = ['استقبال','تسجيل','أمن','توجيه','تقني','ترجمة','تصوير','خدمة ضيوف','دعم إداري','أخرى']
const CITIES     = ['الرياض','جدة','الدمام','مكة المكرمة','المدينة المنورة','الخبر','تبوك','أبها','القصيم']
const STATUS_MAP: Record<string,{label:string;bg:string;color:string}> = {
  open:   {label:'مفتوح', bg:'#EAF7E0',color:'#1A5A00'},
  filled: {label:'مكتمل',bg:'#EDE9F7',color:'#5B3FA0'},
  closed: {label:'مغلق', bg:'#F1F1F1',color:'#6F7287'},
}
type Request = {
  id:string;title:string;city:string;event_date:string;role_type:string
  daily_rate:number;workers_needed:number|null;workers_confirmed:number|null
  status:string;description:string|null;duration_hours:number|null
  gender_preference:string|null;has_public_page:boolean;slug:string|null
  cover_image:string|null;highlights:string[]|null;requirements:string|null
  benefits:string[]|null;views_count:number;require_nafath:boolean
}
type Worker = {
  id:string;full_name:string;phone:string;city:string;gender:string|null
  skills:string[]|null;experience_years:number|null;daily_rate:number|null
  is_verified:boolean|null;is_available:boolean|null;rating:number|null
  nafath_verified:boolean|null;status:string|null;email:string|null
}
type Application = {
  id:string;status:string;cover_note:string|null;applied_at:string
  applicant_name:string|null;applicant_phone:string|null;applicant_city:string|null
  worker_profiles: {full_name:string;phone:string;city:string;skills:string[]|null;rating:number|null}|null
}

const inp: React.CSSProperties = {
  width:'100%',padding:'9px 12px',border:`1px solid ${C.border}`,borderRadius:8,
  fontSize:13,outline:'none',fontFamily:'inherit',color:C.text,background:C.card,boxSizing:'border-box'
}
const lbl: React.CSSProperties = {fontSize:12,fontWeight:600,color:C.text,display:'block',marginBottom:4}

// ─── Apps Drawer ──────────────────────────────────────────────────────
function AppsDrawer({ request, onClose }: {request:Request;onClose:()=>void}) {
  const sb = useMemo(()=>createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!),[])
  const [apps, setApps]     = useState<Application[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(()=>{
    sb.from('worker_applications')
      .select('id,status,cover_note,applied_at,applicant_name,applicant_phone,applicant_city,worker_profiles(full_name,phone,city,skills,rating)')
      .or(`request_id.eq.${request.id},staffing_request_id.eq.${request.id}`)
      .order('applied_at',{ascending:false})
      .then(({data})=>{setApps((data||[]) as any);setLoading(false)})
  },[])

  async function updateApp(id:string, status:string) {
    await sb.from('worker_applications').update({status,reviewed_at:new Date().toISOString()}).eq('id',id)
    setApps(a=>a.map(x=>x.id===id?{...x,status}:x))
  }

  const shareUrl = `${typeof window!=='undefined'?window.location.origin:''}/jobs/${request.slug}`

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.4)',zIndex:100,display:'flex',justifyContent:'flex-end'}} onClick={onClose}>
      <MobilePageHeader title="الكوادر" />
      <div style={{width:'min(480px,100%)',background:C.card,height:'100%',overflowY:'auto',direction:'rtl'}} onClick={e=>e.stopPropagation()}>
        <div style={{padding:'18px 18px 14px',borderBottom:`1px solid ${C.border}`,position:'sticky',top:0,background:C.card,zIndex:1}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10}}>
            <div>
              <h3 style={{margin:0,fontSize:16,fontWeight:800,color:C.navy}}>{request.title}</h3>
              <p style={{margin:'3px 0 0',fontSize:12,color:C.muted}}>📍 {request.city} · 📅 {request.event_date}</p>
            </div>
            <button onClick={onClose} style={{background:'none',border:'none',fontSize:20,cursor:'pointer',color:C.muted}}>✕</button>
          </div>
          {/* Share link if public */}
          {request.has_public_page && request.slug && (
            <div style={{background:'#EAF7E0',borderRadius:8,padding:'8px 12px',display:'flex',gap:8,alignItems:'center',marginBottom:8}}>
              <span style={{fontSize:11,color:C.green,flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',fontFamily:'monospace'}}>
                /jobs/{request.slug}
              </span>
              <button onClick={()=>navigator.clipboard?.writeText(shareUrl)} style={{padding:'3px 8px',background:C.green,border:'none',borderRadius:5,color:'#fff',fontSize:10,fontWeight:700,cursor:'pointer',fontFamily:'inherit',flexShrink:0}}>نسخ</button>
              <a href={`https://wa.me/?text=${encodeURIComponent('فرصة توظيف: '+request.title+'\n'+shareUrl)}`} target="_blank" rel="noopener"
                style={{padding:'3px 8px',background:'#25D366',border:'none',borderRadius:5,color:'#fff',fontSize:10,fontWeight:700,textDecoration:'none',flexShrink:0}}>واتساب</a>
            </div>
          )}
          <div style={{display:'flex',gap:8}}>
            {[{l:'إجمالي',v:apps.length,c:C.navy},{l:'مقبول',v:apps.filter(a=>a.status==='accepted').length,c:C.green},{l:'بانتظار',v:apps.filter(a=>a.status==='pending').length,c:'#B07000'}].map(s=>(
              <div key={s.l} style={{flex:1,textAlign:'center',padding:'6px',background:'#F8F7FA',borderRadius:6}}>
                <p style={{fontSize:16,fontWeight:800,color:s.c,margin:0}}>{s.v}</p>
                <p style={{fontSize:10,color:C.muted,margin:0}}>{s.l}</p>
              </div>
            ))}
          </div>
        </div>
        <div style={{padding:14}}>
          {loading?<p style={{textAlign:'center',color:C.muted,padding:30}}>...</p>
          :apps.length===0?<div style={{textAlign:'center',padding:40}}><div style={{fontSize:40,marginBottom:8}}>📭</div><p style={{color:C.muted,fontSize:13}}>لا توجد طلبات بعد</p></div>
          :apps.map(app=>{
            const w = app.worker_profiles
            const name = app.applicant_name || w?.full_name || '—'
            const phone = app.applicant_phone || w?.phone || '—'
            const stMap:any={pending:{bg:'#FFF8E8',c:'#B07000',l:'انتظار'},accepted:{bg:'#EAF7E0',c:C.green,l:'مقبول'},rejected:{bg:'#FEF2F2',c:'#DC2626',l:'مرفوض'}}
            const s=stMap[app.status]||stMap.pending
            return (
              <div key={app.id} style={{border:`1px solid ${C.border}`,borderRadius:10,padding:14,marginBottom:10}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:6}}>
                  <div>
                    <p style={{fontWeight:700,color:C.navy,margin:0,fontSize:14}}>{name}</p>
                    <p style={{fontSize:11,color:C.muted,margin:'2px 0 0'}}>📞 {phone}</p>
                  </div>
                  <span style={{fontSize:11,fontWeight:600,padding:'3px 8px',borderRadius:6,background:s.bg,color:s.c}}>{s.l}</span>
                </div>
                {app.cover_note&&<p style={{fontSize:12,color:C.text,background:'#F8F7FA',borderRadius:6,padding:'7px 10px',margin:'0 0 8px'}}>{app.cover_note}</p>}
                {app.status==='pending'&&(
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

// ─── New Request Modal (basic) ─────────────────────────────────────────
// ─── NewRequestModal ─────────────────────────────────────────────────────────
function NewRequestModal({ events, onClose, onSaved }: {
  events:{id:string;title:string}[]
  onClose:()=>void
  onSaved:(req:Request)=>void
}) {
  const sb = useMemo(()=>createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!),[])
  const fileRef = useRef<HTMLInputElement>(null)
  const [saving, setSaving]             = useState(false)
  const [imageUploading, setImageUploading] = useState(false)
  const [coverPreview, setCoverPreview] = useState<string|null>(null)
  const [coverUrl, setCoverUrl]         = useState('')

  // Basic fields
  const [form, setForm] = useState({
    title:'', city:'الرياض', event_date:'', role_type:'استقبال',
    workers_needed:'1', daily_rate:'', duration_hours:'8',
    gender_preference:'any', description:'', event_id:'',
    location_name:'', require_nafath:false,
  })
  const set = (k:string, v:any) => setForm(f=>({...f,[k]:v}))

  // Public page toggle
  const [hasPublicPage, setHasPublicPage] = useState(false)

  // Public page extras
  const [highlights, setHighlights]   = useState<string[]>([''])
  const [benefits, setBenefits]       = useState<string[]>([''])
  const [requirements, setRequirements] = useState('')
  const [orgName, setOrgName]         = useState('')

  function addHighlight()  { setHighlights(h=>[...h,'']) }
  function addBenefit()    { setBenefits(b=>[...b,'']) }
  function updateHL(i:number, v:string) { setHighlights(h=>h.map((x,idx)=>idx===i?v:x)) }
  function updateBN(i:number, v:string) { setBenefits(b=>b.map((x,idx)=>idx===i?v:x)) }
  function removeHL(i:number) { setHighlights(h=>h.filter((_,idx)=>idx!==i)) }
  function removeBN(i:number) { setBenefits(b=>b.filter((_,idx)=>idx!==i)) }

  async function handleImage(e:React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setCoverPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
    setImageUploading(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `staffing/${Date.now()}.${ext}`
      const { error } = await sb.storage.from('event-images').upload(path, file, { upsert:true })
      if (!error) {
        const { data:{publicUrl} } = sb.storage.from('event-images').getPublicUrl(path)
        setCoverUrl(publicUrl)
      }
    } finally { setImageUploading(false) }
  }

  async function save() {
    if (!form.title.trim() || !form.event_date || !form.daily_rate) {
      alert('يرجى تعبئة الحقول المطلوبة'); return
    }
    setSaving(true)
    try {
      const cleanHL = highlights.filter(h=>h.trim())
      const cleanBN = benefits.filter(b=>b.trim())

      const { data, error } = await sb.from('staffing_requests').insert({
        title:            form.title.trim(),
        city:             form.city,
        event_date:       form.event_date,
        role_type:        form.role_type,
        workers_needed:   parseInt(form.workers_needed)||1,
        daily_rate:       parseInt(form.daily_rate)||0,
        duration_hours:   parseInt(form.duration_hours)||8,
        gender_preference: form.gender_preference==='any'?null:form.gender_preference,
        description:      form.description||null,
        location_name:    form.location_name||null,
        event_id:         form.event_id||null,
        require_nafath:   form.require_nafath,
        status:           'open',
        workers_confirmed: 0,
        // Public page fields
        has_public_page:  hasPublicPage,
        cover_image:      coverUrl||null,
        highlights:       cleanHL.length ? cleanHL : null,
        benefits:         cleanBN.length ? cleanBN : null,
        requirements:     requirements.trim()||null,
        org_name:         orgName.trim()||null,
        views_count:      0,
      }).select().single()
      if (error) throw error
      onSaved(data as Request)
    } catch(e:any) { alert('خطأ: '+e.message) }
    finally { setSaving(false) }
  }

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:100,display:'flex',alignItems:'flex-start',justifyContent:'center',padding:'16px',overflowY:'auto'}} onClick={onClose}>
      <div style={{background:C.card,borderRadius:16,width:'100%',maxWidth:580,marginTop:20,marginBottom:20,direction:'rtl'}} onClick={e=>e.stopPropagation()}>

        {/* Header */}
        <div style={{padding:'18px 20px 14px',borderBottom:`1px solid ${C.border}`,display:'flex',justifyContent:'space-between',alignItems:'center',position:'sticky',top:0,background:C.card,borderRadius:'16px 16px 0 0',zIndex:1}}>
          <h2 style={{margin:0,fontSize:18,fontWeight:800,color:C.navy}}>نشر طلب توظيف جديد</h2>
          <button onClick={onClose} style={{background:'none',border:'none',fontSize:22,cursor:'pointer',color:C.muted}}>✕</button>
        </div>

        <div style={{padding:20,maxHeight:'80vh',overflowY:'auto'}}>

          {/* ── BASIC FIELDS ── */}
          <p style={{fontSize:13,fontWeight:700,color:C.navy,margin:'0 0 12px',display:'flex',alignItems:'center',gap:6}}>
            <span style={{background:'#EDE9F7',borderRadius:'50%',width:22,height:22,display:'inline-flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:800,color:'#5B3FA0'}}>1</span>
            التفاصيل الأساسية
          </p>
          <div style={{display:'grid',gap:10,marginBottom:16}}>
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
            <div>
              <label style={lbl}>اسم المكان أو الحي</label>
              <input value={form.location_name} onChange={e=>set('location_name',e.target.value)} placeholder="مثال: مركز الرياض التجاري، حي العليا" style={inp}/>
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
                <label style={lbl}>الأجر (ر.س) *</label>
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
            <div>
              <label style={lbl}>وصف الدور</label>
              <textarea value={form.description} onChange={e=>set('description',e.target.value)} rows={2} placeholder="ما الذي سيقوم به الكادر بالتحديد؟" style={{...inp,resize:'vertical'}}/>
            </div>
            {events.length>0&&(
              <div>
                <label style={lbl}>ربط بفعالية (اختياري)</label>
                <select value={form.event_id} onChange={e=>set('event_id',e.target.value)} style={inp}>
                  <option value="">— بدون ربط —</option>
                  {events.map(ev=><option key={ev.id} value={ev.id}>{ev.title}</option>)}
                </select>
              </div>
            )}
            <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',padding:'8px 10px',background:'#EDE9F7',borderRadius:8}}>
              <input type="checkbox" checked={form.require_nafath} onChange={e=>set('require_nafath',e.target.checked)} style={{width:15,height:15,accentColor:'#5B3FA0'}}/>
              <div>
                <p style={{margin:0,fontSize:13,fontWeight:600,color:'#5B3FA0'}}>🛡️ يُشترط التحقق بنفاذ</p>
                <p style={{margin:0,fontSize:11,color:C.muted}}>للفعاليات ذات متطلبات أمنية عالية</p>
              </div>
            </label>
          </div>

          {/* ── PUBLIC PAGE TOGGLE ── */}
          <div style={{borderTop:`1px solid ${C.border}`,paddingTop:16,marginBottom:16}}>
            <div onClick={()=>setHasPublicPage(p=>!p)} style={{
              display:'flex',alignItems:'center',justifyContent:'space-between',cursor:'pointer',
              padding:'14px 16px',borderRadius:10,
              background: hasPublicPage ? 'linear-gradient(135deg,#1E0A3C,#3D1A78)' : '#F8F7FA',
              border: `2px solid ${hasPublicPage?C.orange:C.border}`,
              transition:'all 0.2s'
            }}>
              <div>
                <p style={{margin:0,fontSize:14,fontWeight:700,color:hasPublicPage?'#fff':C.navy}}>
                  🌐 إنشاء صفحة توظيف عامة
                </p>
                <p style={{margin:'3px 0 0',fontSize:11,color:hasPublicPage?'rgba(255,255,255,0.7)':C.muted}}>
                  صفحة مستقلة مع رابط قابل للمشاركة + نموذج تقديم مباشر
                </p>
              </div>
              <div style={{
                width:44,height:24,borderRadius:50,
                background: hasPublicPage?C.orange:'#DBDAE3',
                position:'relative',transition:'background 0.2s',flexShrink:0
              }}>
                <div style={{
                  position:'absolute',top:2,width:20,height:20,borderRadius:'50%',background:'#fff',
                  transition:'right 0.2s, left 0.2s',
                  right: hasPublicPage?2:'auto', left: hasPublicPage?'auto':2,
                  boxShadow:'0 1px 4px rgba(0,0,0,0.2)'
                }}/>
              </div>
            </div>

            {hasPublicPage && (
              <div style={{marginTop:16,display:'grid',gap:14}}>
                <p style={{fontSize:13,fontWeight:700,color:C.navy,margin:'0 0 4px',display:'flex',alignItems:'center',gap:6}}>
                  <span style={{background:'#EDE9F7',borderRadius:'50%',width:22,height:22,display:'inline-flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:800,color:'#5B3FA0'}}>2</span>
                  تفاصيل الصفحة العامة
                </p>

                {/* Cover image */}
                <div>
                  <label style={lbl}>صورة الطلب</label>
                  <input ref={fileRef} type="file" accept="image/*" onChange={handleImage} style={{display:'none'}}/>
                  {coverPreview ? (
                    <div style={{position:'relative'}}>
                      <img src={coverPreview} alt="cover" style={{width:'100%',height:160,objectFit:'cover',borderRadius:8,display:'block'}}/>
                      <div style={{position:'absolute',top:8,left:8,display:'flex',gap:6}}>
                        <button onClick={()=>fileRef.current?.click()} style={{background:'rgba(0,0,0,0.7)',color:'#fff',border:'none',borderRadius:6,padding:'5px 10px',fontSize:11,cursor:'pointer'}}>
                          {imageUploading?'⏳...':'✏️ تغيير'}
                        </button>
                        <button onClick={()=>{setCoverPreview(null);setCoverUrl('')}} style={{background:'rgba(220,38,38,0.8)',color:'#fff',border:'none',borderRadius:6,padding:'5px 8px',fontSize:11,cursor:'pointer'}}>✕</button>
                      </div>
                    </div>
                  ) : (
                    <div onClick={()=>fileRef.current?.click()} style={{padding:'24px',textAlign:'center',cursor:'pointer',background:'#F3F0F8',border:'2px dashed #B4A7D6',borderRadius:8}}>
                      <div style={{fontSize:28,marginBottom:6}}>🖼️</div>
                      <p style={{fontWeight:600,color:C.navy,margin:'0 0 3px',fontSize:13}}>اضغط لرفع صورة الطلب</p>
                      <p style={{fontSize:11,color:C.muted,margin:0}}>PNG أو JPG — تظهر في رابط المشاركة</p>
                    </div>
                  )}
                </div>

                {/* Org name */}
                <div>
                  <label style={lbl}>اسم المنظمة / الجهة (للصفحة العامة)</label>
                  <input value={orgName} onChange={e=>setOrgName(e.target.value)} placeholder="مثال: شركة الأحداث الكبرى" style={inp}/>
                </div>

                {/* Highlights */}
                <div>
                  <label style={{...lbl,marginBottom:8}}>✨ مميزات العمل <span style={{color:C.muted,fontWeight:400}}>(تظهر كبطاقات)</span></label>
                  {highlights.map((h,i)=>(
                    <div key={i} style={{display:'flex',gap:6,marginBottom:6}}>
                      <input value={h} onChange={e=>updateHL(i,e.target.value)} placeholder={`ميزة ${i+1}... مثال: وجبة مجانية`} style={{...inp,flex:1}}/>
                      {highlights.length>1 && <button onClick={()=>removeHL(i)} style={{background:'none',border:'none',cursor:'pointer',color:'#DC2626',fontSize:16,padding:'0 4px'}}>✕</button>}
                    </div>
                  ))}
                  {highlights.length < 6 && (
                    <button onClick={addHighlight} style={{width:'100%',padding:'7px',border:`2px dashed ${C.border}`,borderRadius:8,background:'none',cursor:'pointer',color:C.orange,fontWeight:600,fontSize:12}}>
                      + إضافة ميزة
                    </button>
                  )}
                </div>

                {/* Benefits */}
                <div>
                  <label style={{...lbl,marginBottom:8}}>🎁 ما تحصل عليه <span style={{color:C.muted,fontWeight:400}}>(تظهر كـ tags)</span></label>
                  {benefits.map((b,i)=>(
                    <div key={i} style={{display:'flex',gap:6,marginBottom:6}}>
                      <input value={b} onChange={e=>updateBN(i,e.target.value)} placeholder={`مثال: شهادة خبرة`} style={{...inp,flex:1}}/>
                      {benefits.length>1 && <button onClick={()=>removeBN(i)} style={{background:'none',border:'none',cursor:'pointer',color:'#DC2626',fontSize:16,padding:'0 4px'}}>✕</button>}
                    </div>
                  ))}
                  {benefits.length < 6 && (
                    <button onClick={addBenefit} style={{width:'100%',padding:'7px',border:`2px dashed ${C.border}`,borderRadius:8,background:'none',cursor:'pointer',color:C.orange,fontWeight:600,fontSize:12}}>
                      + إضافة
                    </button>
                  )}
                </div>

                {/* Requirements */}
                <div>
                  <label style={lbl}>📝 المتطلبات والشروط</label>
                  <textarea value={requirements} onChange={e=>setRequirements(e.target.value)} rows={3}
                    placeholder="مثال: - اللباقة والتعامل مع الجمهور&#10;- إجادة اللغة الإنجليزية&#10;- الحضور قبل ساعة من بدء الفعالية"
                    style={{...inp,resize:'vertical'}}/>
                </div>

                {/* Preview note */}
                <div style={{background:'#EAF7E0',borderRadius:8,padding:'10px 12px',border:'1px solid #C3E6C3',display:'flex',gap:8}}>
                  <span style={{fontSize:14}}>✅</span>
                  <p style={{margin:0,fontSize:12,color:'#1A5A00',lineHeight:1.5}}>
                    بعد النشر ستجد رابطاً في بطاقة الطلب يمكن مشاركته مباشرة عبر واتساب أو نسخه.
                    <br/>الرابط سيكون: <strong>evento.app/jobs/your-slug</strong>
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* ── ACTIONS ── */}
          <div style={{display:'flex',gap:10}}>
            <button onClick={onClose} style={{flex:1,padding:'11px',border:`1px solid ${C.border}`,borderRadius:8,background:C.bg,cursor:'pointer',fontWeight:600,fontSize:13,fontFamily:'inherit',color:C.text}}>إلغاء</button>
            <button onClick={save} disabled={saving||imageUploading} style={{flex:2,padding:'11px',border:'none',borderRadius:8,background:saving?'#DBDAE3':C.orange,color:'#fff',cursor:saving?'not-allowed':'pointer',fontWeight:700,fontSize:13,fontFamily:'inherit'}}>
              {imageUploading?'⏫ رفع الصورة...':saving?'⏳ جاري النشر...':hasPublicPage?'🌐 نشر مع صفحة عامة':'🚀 نشر الطلب'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function StaffingPage() {
  const sb = useMemo(()=>createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!),[])
  const [tab, setTab]         = useState<'requests'|'workers'>('requests')
  const [requests, setRequests] = useState<Request[]>([])
  const [workers, setWorkers]   = useState<Worker[]>([])
  const [events, setEvents]     = useState<{id:string;title:string}[]>([])
  const [loading, setLoading]   = useState(true)
  const [showNew, setShowNew]   = useState(false)
  const [viewApps, setViewApps] = useState<Request|null>(null)
  const [shareReq, setShareReq] = useState<Request|null>(null)
  const [search, setSearch]     = useState('')
  const [filterCity, setFilterCity] = useState('')
  const [appCounts, setAppCounts]   = useState<Record<string,number>>({})

  async function loadRequests() {
    const {data} = await sb.from('staffing_requests').select('*').order('created_at',{ascending:false}).limit(100)
    const reqs = (data||[]) as Request[]
    setRequests(reqs)
    if(reqs.length>0){
      const {data:apps} = await sb.from('worker_applications').select('staffing_request_id,request_id')
      const counts:Record<string,number>={}
      ;(apps||[]).forEach((a:any)=>{const rid=a.staffing_request_id||a.request_id;if(rid)counts[rid]=(counts[rid]||0)+1})
      setAppCounts(counts)
    }
  }

  useEffect(()=>{
    Promise.all([
      loadRequests(),
      sb.from('worker_profiles').select('*').order('created_at',{ascending:false}).limit(100).then(({data})=>setWorkers((data||[]) as Worker[])),
      sb.from('events').select('id,title').in('status',['published','draft']).order('start_date',{ascending:false}).limit(50).then(({data})=>setEvents(data||[])),
    ]).finally(()=>setLoading(false))
  },[])

  async function toggleWorkerStatus(w:Worker){
    const nv=!w.is_available
    await sb.from('worker_profiles').update({is_available:nv}).eq('id',w.id)
    setWorkers(ws=>ws.map(x=>x.id===w.id?{...x,is_available:nv}:x))
  }

  function handleCreated(req:Request){
    setShowNew(false)
    setRequests(rs=>[req,...rs])
    if(req.has_public_page) setShareReq(req)
  }

  const filteredReqs    = requests.filter(r=>(!search||r.title.includes(search)||r.role_type.includes(search)||r.city.includes(search))&&(!filterCity||r.city===filterCity))
  const filteredWorkers = workers.filter(w=>(!search||w.full_name.includes(search)||(w.city||'').includes(search))&&(!filterCity||w.city===filterCity))
  const stats={openReqs:requests.filter(r=>r.status==='open').length,totalWorkers:workers.length,available:workers.filter(w=>w.is_available).length,pending:Object.values(appCounts).reduce((a,b)=>a+b,0)}
  const inp2={padding:'9px 13px',border:`1px solid ${C.border}`,borderRadius:8,fontSize:13,outline:'none',fontFamily:'inherit',color:C.text,background:C.card}

  return (
    <div style={{minHeight:'100vh',background:C.bg,direction:'rtl'}}>
      {/* Header */}
      <div style={{background:C.card,borderBottom:`1px solid ${C.border}`,padding:'20px 24px 0'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:16}}>
          <div>
            <h1 style={{fontSize:26,fontWeight:800,margin:0,color:C.navy}}>👷 الكوادر البشرية</h1>
            <p style={{color:C.muted,fontSize:12,margin:'3px 0 0'}}>إدارة طلبات التوظيف وقاعدة الكوادر</p>
          </div>
          <button onClick={()=>setShowNew(true)} style={{padding:'9px 18px',background:C.orange,color:'#fff',border:'none',borderRadius:8,fontWeight:700,fontSize:13,cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',gap:6}}>+ نشر طلب جديد</button>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:16}}>
          {[{icon:'📋',label:'طلبات مفتوحة',value:stats.openReqs,color:C.orange},{icon:'👥',label:'إجمالي الكوادر',value:stats.totalWorkers,color:C.navy},{icon:'✅',label:'متاحون الآن',value:stats.available,color:C.green},{icon:'📨',label:'طلبات تقديم',value:stats.pending,color:'#7B4FBF'}].map(s=>(
            <div key={s.label} style={{background:'#F8F7FA',borderRadius:10,padding:'12px 14px'}}>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}><span style={{fontSize:18}}>{s.icon}</span><span style={{fontSize:22,fontWeight:800,color:s.color}}>{s.value}</span></div>
              <p style={{fontSize:11,color:C.muted,margin:0}}>{s.label}</p>
            </div>
          ))}
        </div>
        <div style={{display:'flex',borderTop:`1px solid ${C.border}`}}>
          {([['requests','📋 طلبات التوظيف'],['workers','👤 قاعدة الكوادر']] as const).map(([t,l])=>(
            <button key={t} onClick={()=>setTab(t)} style={{flex:1,padding:'10px',background:'none',border:'none',cursor:'pointer',fontSize:13,fontWeight:tab===t?700:400,color:tab===t?C.orange:C.muted,borderBottom:tab===t?`2px solid ${C.orange}`:'2px solid transparent',marginBottom:-1,fontFamily:'inherit'}}>{l}</button>
          ))}
        </div>
      </div>

      <div style={{padding:'16px 24px',maxWidth:1100,margin:'0 auto'}}>
        <div style={{display:'flex',gap:10,marginBottom:16}}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder={tab==='requests'?'بحث في الطلبات...':'بحث في الكوادر...'} style={{...inp2,flex:1}}/>
          <select value={filterCity} onChange={e=>setFilterCity(e.target.value)} style={{...inp2,minWidth:120}}>
            <option value="">كل المدن</option>
            {CITIES.map(c=><option key={c}>{c}</option>)}
          </select>
        </div>

        {loading?<div style={{textAlign:'center',padding:60,color:C.muted}}>جاري التحميل...</div>
        :tab==='requests'?(
          filteredReqs.length===0?(
            <div style={{textAlign:'center',padding:60}}><div style={{fontSize:50,marginBottom:12}}>📋</div><h3 style={{color:C.navy,margin:'0 0 6px'}}>لا توجد طلبات بعد</h3><button onClick={()=>setShowNew(true)} style={{marginTop:14,padding:'10px 24px',background:C.orange,color:'#fff',border:'none',borderRadius:8,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>+ نشر طلب الآن</button></div>
          ):(
            <div style={{display:'grid',gap:12}}>
              {filteredReqs.map(req=>{
                const st=STATUS_MAP[req.status]||STATUS_MAP['open']
                const filled=req.workers_confirmed||0, needed=req.workers_needed||1
                const pct=Math.min(100,Math.round(filled/needed*100))
                const appCnt=appCounts[req.id]||0
                const shareUrl=`${typeof window!=='undefined'?window.location.origin:''}/jobs/${req.slug}`
                return (
                  <div key={req.id} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:'16px 18px'}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10}}>
                      <div style={{flex:1,display:'flex',gap:10,alignItems:'flex-start'}}>
                        {req.cover_image&&<img src={req.cover_image} alt="" style={{width:48,height:48,borderRadius:8,objectFit:'cover',flexShrink:0}}/>}
                        <div style={{flex:1}}>
                          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4,flexWrap:'wrap'}}>
                            <h3 style={{margin:0,fontSize:15,fontWeight:700,color:C.navy}}>{req.title}</h3>
                            <span style={{fontSize:11,fontWeight:600,padding:'2px 8px',borderRadius:6,background:st.bg,color:st.color}}>{st.label}</span>
                            {req.has_public_page&&<span style={{fontSize:10,fontWeight:600,padding:'2px 7px',borderRadius:6,background:'#E8F0FE',color:'#1967D2'}}>🌐 صفحة عامة</span>}
                          </div>
                          <div style={{display:'flex',gap:12,flexWrap:'wrap'}}>
                            <span style={{fontSize:12,color:C.muted}}>🏷️ {req.role_type}</span>
                            <span style={{fontSize:12,color:C.muted}}>📍 {req.city}</span>
                            <span style={{fontSize:12,color:C.muted}}>📅 {req.event_date}</span>
                            <span style={{fontSize:12,fontWeight:700,color:C.orange}}>💰 {req.daily_rate} ر.س/يوم</span>
                            {req.views_count>0&&<span style={{fontSize:11,color:C.muted}}>👁️ {req.views_count} مشاهدة</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div style={{marginBottom:10}}>
                      <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                        <span style={{fontSize:11,color:C.muted}}>{filled} / {needed} كادر مؤكد</span>
                        <span style={{fontSize:11,fontWeight:700,color:pct===100?C.green:C.navy}}>{pct}%</span>
                      </div>
                      <div style={{background:'#EDE9F7',borderRadius:50,height:6,overflow:'hidden'}}>
                        <div style={{width:`${pct}%`,height:'100%',background:pct===100?C.green:C.orange,borderRadius:50,transition:'width 0.4s'}}/>
                      </div>
                    </div>
                    <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
                      {/* Share button for public requests */}
                      {req.has_public_page && req.slug && (
                        <a
                          href={`https://wa.me/?text=${encodeURIComponent('فرصة عمل: '+req.title+'\n'+window.location.origin+'/jobs/'+req.slug)}`}
                          target="_blank" rel="noopener"
                          onClick={e=>e.stopPropagation()}
                          style={{padding:'7px 12px',background:'#25D366',borderRadius:7,color:'#fff',fontWeight:700,fontSize:12,textDecoration:'none',display:'flex',alignItems:'center',gap:4}}
                        >📲 مشاركة</a>
                      )}
                      {req.has_public_page && req.slug && (
                        <button onClick={e=>{e.stopPropagation();navigator.clipboard?.writeText(window.location.origin+'/jobs/'+req.slug);}} style={{padding:'7px 10px',background:'#EAF7E0',border:'none',borderRadius:7,cursor:'pointer',fontSize:12,color:C.green,fontWeight:700,fontFamily:'inherit'}}>🔗 نسخ</button>
                      )}
                      <button onClick={()=>setViewApps(req)} style={{padding:'7px 14px',background:appCnt>0?'#EDE9F7':C.bg,border:`1px solid ${appCnt>0?'#B4A7D6':C.border}`,borderRadius:7,cursor:'pointer',fontWeight:600,fontSize:12,color:appCnt>0?'#5B3FA0':C.text,fontFamily:'inherit'}}>📨 {appCnt} طلب تقديم</button>
                      {req.has_public_page&&req.slug&&(<>
                        <button onClick={()=>navigator.clipboard?.writeText(shareUrl)} style={{padding:'7px 12px',background:'#E8F0FE',border:'none',borderRadius:7,cursor:'pointer',fontSize:12,color:'#1967D2',fontWeight:600,fontFamily:'inherit'}}>🔗 نسخ الرابط</button>
                        <a href={`https://wa.me/?text=${encodeURIComponent('فرصة توظيف: '+req.title+'\n📍 '+req.city+' · 💰 '+req.daily_rate+' ر.س/يوم\n\n'+shareUrl)}`} target="_blank" rel="noopener"
                          style={{padding:'7px 12px',background:'#25D366',border:'none',borderRadius:7,cursor:'pointer',fontSize:12,color:'#fff',fontWeight:700,textDecoration:'none',display:'flex',alignItems:'center',gap:4}}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                          واتساب
                        </a>
                        <a href={`/jobs/${req.slug}`} target="_blank" style={{padding:'7px 10px',background:'#F8F7FA',border:`1px solid ${C.border}`,borderRadius:7,fontSize:11,color:C.muted,textDecoration:'none'}}>معاينة ←</a>
                      </>)}
                      <div style={{flex:1}}/>
                      {req.status==='open'?(
                        <button onClick={async()=>{await sb.from('staffing_requests').update({status:'closed'}).eq('id',req.id);setRequests(rs=>rs.map(r=>r.id===req.id?{...r,status:'closed'}:r))}} style={{padding:'7px 12px',background:'#F1F1F1',border:'none',borderRadius:7,cursor:'pointer',fontSize:12,color:C.muted,fontFamily:'inherit'}}>إغلاق</button>
                      ):(
                        <button onClick={async()=>{await sb.from('staffing_requests').update({status:'open'}).eq('id',req.id);setRequests(rs=>rs.map(r=>r.id===req.id?{...r,status:'open'}:r))}} style={{padding:'7px 12px',background:'#EAF7E0',border:'none',borderRadius:7,cursor:'pointer',fontSize:12,color:C.green,fontFamily:'inherit'}}>إعادة فتح</button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )
        ):(
          filteredWorkers.length===0?<div style={{textAlign:'center',padding:60}}><div style={{fontSize:50,marginBottom:12}}>👤</div><h3 style={{color:C.navy,margin:'0 0 6px'}}>لا يوجد كوادر مسجلون بعد</h3></div>
          :<div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:12}}>
            {filteredWorkers.map(w=>{
              const initials=w.full_name.split(' ').map(n=>n[0]).slice(0,2).join('')
              return (
                <div key={w.id} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:16}}>
                  <div style={{display:'flex',gap:12,alignItems:'flex-start',marginBottom:10}}>
                    <div style={{width:44,height:44,borderRadius:'50%',background:'linear-gradient(135deg,#B4A7D6,#7B4FBF)',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:800,fontSize:16,flexShrink:0}}>{initials}</div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:2}}>
                        <p style={{margin:0,fontWeight:700,color:C.navy,fontSize:14,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{w.full_name}</p>
                        {w.nafath_verified&&<span title="موثّق بنفاذ" style={{fontSize:10,background:'#EAF7E0',color:'#1A5A00',padding:'2px 6px',borderRadius:6,fontWeight:700,flexShrink:0}}>🛡️ نفاذ</span>}
                        {!w.nafath_verified&&w.is_verified&&<span style={{fontSize:13}}>✅</span>}
                      </div>
                      <div style={{display:'flex',gap:8}}><span style={{fontSize:11,color:C.muted}}>📍 {w.city}</span>{w.rating&&<span style={{fontSize:11,color:'#B07000'}}>⭐ {Number(w.rating).toFixed(1)}</span>}</div>
                    </div>
                    <span style={{fontSize:10,fontWeight:600,padding:'3px 7px',borderRadius:6,background:w.is_available?'#EAF7E0':'#F1F1F1',color:w.is_available?C.green:C.muted,flexShrink:0}}>{w.is_available?'متاح':'غير متاح'}</span>
                  </div>
                  {w.skills&&w.skills.length>0&&<div style={{display:'flex',gap:4,flexWrap:'wrap',marginBottom:10}}>{w.skills.slice(0,4).map((s,i)=><span key={i} style={{fontSize:10,background:'#EDE9F7',color:'#5B3FA0',padding:'2px 7px',borderRadius:10}}>{s}</span>)}{w.skills.length>4&&<span style={{fontSize:10,color:C.muted}}>+{w.skills.length-4}</span>}</div>}
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',paddingTop:10,borderTop:`1px solid ${C.border}`}}>
                    <div>{w.daily_rate&&<span style={{fontSize:12,fontWeight:700,color:C.orange}}>{w.daily_rate} ر.س/يوم</span>}</div>
                    <button onClick={()=>toggleWorkerStatus(w)} style={{padding:'5px 10px',border:'none',borderRadius:6,cursor:'pointer',fontSize:11,fontWeight:600,fontFamily:'inherit',background:w.is_available?'#FEF2F2':'#EAF7E0',color:w.is_available?'#DC2626':C.green}}>{w.is_available?'⏸ إيقاف':'▶ تفعيل'}</button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {showNew&&<NewRequestModal events={events} onClose={()=>setShowNew(false)} onCreated={handleCreated}/>}
      {viewApps&&<AppsDrawer request={viewApps} onClose={()=>setViewApps(null)}/>}
      {shareReq&&<ShareToast req={shareReq} onClose={()=>setShareReq(null)}/>}
    </div>
  )
}