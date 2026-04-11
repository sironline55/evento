'use client'
import { useState, useMemo } from 'react'
import { createBrowserClient } from '@supabase/ssr'

const C = {
  navy:'#1E0A3C', orange:'#F05537', text:'#39364F',
  muted:'#6F7287', border:'#DBDAE3', bg:'#F4F2F8', card:'#FFFFFF', green:'#3A7D0A'
}
const CITIES = ['الرياض','جدة','الدمام','مكة المكرمة','المدينة المنورة','الخبر','تبوك','أبها','القصيم','أخرى']

type Job = {
  id:string; title:string; city:string; event_date:string; role_type:string
  daily_rate:number; workers_needed:number|null; workers_confirmed:number|null
  duration_hours:number|null; gender_preference:string|null; description:string|null
  cover_image:string|null; highlights:string[]|null; requirements:string|null
  benefits:string[]|null; org_name:string|null; org_logo:string|null
  location_name:string|null; status:string; require_nafath:boolean|null
  slug:string; views_count:number|null
}

export default function JobPageClient({ job }: { job: Job }) {
  const sb = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), [])

  const [showApply, setShowApply] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    name:'', phone:'', email:'', city:job.city||'الرياض',
    experience:'', cover_note:''
  })
  const [errors, setErrors] = useState<Record<string,string>>({})

  const set = (k:string, v:string) => { setForm(f=>({...f,[k]:v})); setErrors(e=>({...e,[k]:''})) }

  function validate() {
    const e: Record<string,string> = {}
    if (!form.name.trim())  e.name  = 'الاسم مطلوب'
    if (!form.phone.trim()) e.phone = 'رقم الجوال مطلوب'
    if (form.phone && !/^05\d{8}$/.test(form.phone.replace(/\s/g,''))) e.phone = 'رقم جوال غير صحيح'
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'بريد إلكتروني غير صحيح'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function submit() {
    if (!validate()) return
    setSubmitting(true)
    try {
      const { error } = await sb.from('worker_applications').insert({
        staffing_request_id: job.id,
        applicant_name:      form.name.trim(),
        applicant_phone:     form.phone.trim(),
        applicant_email:     form.email.trim() || null,
        applicant_city:      form.city,
        experience_years:    form.experience ? parseInt(form.experience) : null,
        cover_note:          form.cover_note.trim() || null,
        status:              'pending',
        is_guest_apply:      true,
        applied_at:          new Date().toISOString(),
      })
      if (error) throw error
      setSubmitted(true)
    } catch(e:any) {
      alert('خطأ في الإرسال: ' + e.message)
    } finally {
      setSubmitting(false)
    }
  }

  const isFull = (job.workers_confirmed || 0) >= (job.workers_needed || 999)
  const pct    = Math.min(100, Math.round(((job.workers_confirmed||0) / (job.workers_needed||1)) * 100))

  const shareUrl = typeof window !== 'undefined' ? window.location.href : ''
  const waText   = encodeURIComponent(`🔔 فرصة عمل: ${job.title}\n📍 ${job.city}\n💰 ${job.daily_rate} ر.س/يوم\n\n${shareUrl}`)

  const inp: React.CSSProperties = {
    width:'100%', padding:'11px 14px', border:`1.5px solid ${C.border}`, borderRadius:10,
    fontSize:14, outline:'none', fontFamily:'inherit', color:C.text, background:C.card, boxSizing:'border-box'
  }

  return (
    <div style={{ minHeight:'100vh', background:C.bg, direction:'rtl' }}>

      {/* Hero */}
      <div style={{ position:'relative', minHeight:260, overflow:'hidden' }}>
        {job.cover_image ? (
          <img src={job.cover_image} alt={job.title}
            style={{ width:'100%', height:280, objectFit:'cover', display:'block' }}/>
        ) : (
          <div style={{ width:'100%', height:280, background:`linear-gradient(135deg, ${C.navy} 0%, #3D1A78 60%, #6B35CC 100%)`,
            display:'flex', alignItems:'center', justifyContent:'center' }}>
            <span style={{ fontSize:72, opacity:0.3 }}>👷</span>
          </div>
        )}
        {/* Overlay gradient */}
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top, rgba(30,10,60,0.85) 0%, rgba(30,10,60,0.1) 60%)' }}/>
        {/* Title over image */}
        <div style={{ position:'absolute', bottom:0, right:0, left:0, padding:'20px 20px 24px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
            {job.org_logo ? (
              <img src={job.org_logo} alt="" style={{ width:36, height:36, borderRadius:8, objectFit:'cover', border:'2px solid rgba(255,255,255,0.3)' }}/>
            ) : (
              <div style={{ width:36, height:36, background:C.orange, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:800, fontSize:16 }}>
                {(job.org_name||'E')[0]}
              </div>
            )}
            {job.org_name && <span style={{ color:'rgba(255,255,255,0.8)', fontSize:13, fontWeight:600 }}>{job.org_name}</span>}
          </div>
          <h1 style={{ color:'#fff', fontSize:22, fontWeight:900, margin:'0 0 8px', lineHeight:1.3 }}>{job.title}</h1>
          <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
            {[
              ['📍', job.location_name || job.city],
              ['🏷️', job.role_type],
              ['📅', new Date(job.event_date).toLocaleDateString('ar-SA', {year:'numeric',month:'long',day:'numeric'})],
              ['⏱️', `${job.duration_hours || 8} ساعات`],
            ].map(([i,v]) => (
              <span key={v} style={{ color:'rgba(255,255,255,0.85)', fontSize:12, display:'flex', alignItems:'center', gap:4 }}>
                <span>{i}</span><span>{v}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth:620, margin:'0 auto', padding:'16px 16px 100px' }}>

        {/* Key info cards */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:16 }}>
          {[
            { label:'الأجر اليومي', value:`${job.daily_rate} ر.س`, icon:'💰', color:C.orange },
            { label:'المطلوبون',    value:String(job.workers_needed || '—'), icon:'👤', color:C.navy },
            { label:'الجنس',       value: job.gender_preference === 'male' ? 'ذكور' : job.gender_preference === 'female' ? 'إناث' : 'بدون تفضيل', icon:'⚤', color:C.muted },
          ].map(s => (
            <div key={s.label} style={{ background:C.card, borderRadius:12, padding:'14px 12px', textAlign:'center', border:`1px solid ${C.border}`, boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize:20, marginBottom:4 }}>{s.icon}</div>
              <p style={{ fontSize:16, fontWeight:800, color:s.color, margin:0 }}>{s.value}</p>
              <p style={{ fontSize:10, color:C.muted, margin:'2px 0 0' }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        {job.workers_needed && (
          <div style={{ background:C.card, borderRadius:12, padding:'14px 16px', marginBottom:14, border:`1px solid ${C.border}` }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
              <span style={{ fontSize:12, color:C.muted }}>المقاعد المتبقية</span>
              <span style={{ fontSize:12, fontWeight:700, color: isFull ? '#DC2626' : C.green }}>
                {isFull ? 'اكتمل' : `${(job.workers_needed||0)-(job.workers_confirmed||0)} متبقي`}
              </span>
            </div>
            <div style={{ background:'#EDE9F7', borderRadius:50, height:8, overflow:'hidden' }}>
              <div style={{ width:`${pct}%`, height:'100%', background: isFull?'#DC2626':C.orange, borderRadius:50, transition:'width 0.4s' }}/>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', marginTop:4 }}>
              <span style={{ fontSize:10, color:C.muted }}>تم قبول {job.workers_confirmed||0}</span>
              <span style={{ fontSize:10, color:C.muted }}>{pct}% مكتمل</span>
            </div>
          </div>
        )}

        {/* Highlights / Benefits */}
        {(job.highlights||[]).length > 0 && (
          <div style={{ background:C.card, borderRadius:12, padding:'16px', marginBottom:14, border:`1px solid ${C.border}` }}>
            <h3 style={{ fontSize:15, fontWeight:700, color:C.navy, margin:'0 0 12px' }}>✨ مميزات العمل</h3>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
              {(job.highlights||[]).map((h,i) => (
                <div key={i} style={{ display:'flex', gap:8, alignItems:'center', padding:'8px 10px', background:'#F8F7FA', borderRadius:8 }}>
                  <span style={{ color:C.green, fontWeight:700, flexShrink:0 }}>✓</span>
                  <span style={{ fontSize:12, color:C.text }}>{h}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Benefits */}
        {(job.benefits||[]).length > 0 && (
          <div style={{ background:C.card, borderRadius:12, padding:'16px', marginBottom:14, border:`1px solid ${C.border}` }}>
            <h3 style={{ fontSize:15, fontWeight:700, color:C.navy, margin:'0 0 12px' }}>🎁 ما تحصل عليه</h3>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
              {(job.benefits||[]).map((b,i) => (
                <span key={i} style={{ background:'#EAF7E0', color:C.green, fontSize:12, fontWeight:600, padding:'5px 12px', borderRadius:20, border:'1px solid #C3E6C3' }}>{b}</span>
              ))}
            </div>
          </div>
        )}

        {/* Description */}
        {job.description && (
          <div style={{ background:C.card, borderRadius:12, padding:'16px', marginBottom:14, border:`1px solid ${C.border}` }}>
            <h3 style={{ fontSize:15, fontWeight:700, color:C.navy, margin:'0 0 10px' }}>📋 تفاصيل الوظيفة</h3>
            <p style={{ fontSize:13, color:C.text, lineHeight:1.7, margin:0, whiteSpace:'pre-line' }}>{job.description}</p>
          </div>
        )}

        {/* Requirements */}
        {job.requirements && (
          <div style={{ background:C.card, borderRadius:12, padding:'16px', marginBottom:14, border:`1px solid ${C.border}` }}>
            <h3 style={{ fontSize:15, fontWeight:700, color:C.navy, margin:'0 0 10px' }}>📝 المتطلبات</h3>
            <p style={{ fontSize:13, color:C.text, lineHeight:1.7, margin:0, whiteSpace:'pre-line' }}>{job.requirements}</p>
          </div>
        )}

        {/* Nafath notice */}
        {job.require_nafath && (
          <div style={{ background:'#EDE9F7', border:'1px solid #B4A7D6', borderRadius:10, padding:'12px 14px', marginBottom:14, display:'flex', gap:10, alignItems:'center' }}>
            <span style={{ fontSize:20 }}>🛡️</span>
            <div>
              <p style={{ fontWeight:700, color:'#5B3FA0', margin:0, fontSize:13 }}>يُشترط التحقق بنفاذ</p>
              <p style={{ color:'#7B4FBF', fontSize:11, margin:'2px 0 0' }}>هذه الفعالية تتطلب التحقق من الهوية الوطنية عبر تطبيق نفاذ</p>
            </div>
          </div>
        )}

        {/* Share */}
        <div style={{ background:C.card, borderRadius:12, padding:'14px 16px', marginBottom:14, border:`1px solid ${C.border}` }}>
          <p style={{ fontSize:13, fontWeight:600, color:C.navy, margin:'0 0 10px' }}>📢 شارك فرصة العمل</p>
          <div style={{ display:'flex', gap:8' }}>
            <a href={`https://wa.me/?text=${waText}`} target="_blank" rel="noopener"
              style={{ flex:1, padding:'10px', background:'#25D366', borderRadius:8, color:'#fff', fontWeight:700, fontSize:13, textDecoration:'none', textAlign:'center' }}>
              واتساب
            </a>
            <button onClick={() => navigator.clipboard?.writeText(shareUrl).then(()=>alert('تم نسخ الرابط!'))}
              style={{ flex:1, padding:'10px', background:C.bg, border:`1px solid ${C.border}`, borderRadius:8, color:C.text, fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
              نسخ الرابط
            </button>
            <a href={`https://twitter.com/intent/tweet?text=${waText}`} target="_blank" rel="noopener"
              style={{ padding:'10px 16px', background:'#1DA1F2', borderRadius:8, color:'#fff', fontWeight:700, fontSize:13, textDecoration:'none' }}>
              X
            </a>
          </div>
        </div>

      </div>

      {/* ── APPLICATION FORM (sticky bottom / modal) ── */}
      {!submitted && (
        <div style={{ position:'fixed', bottom:0, left:0, right:0, zIndex:50 }}>
          {showApply ? (
            <div style={{ background:C.card, borderTop:`2px solid ${C.orange}`, padding:'16px 16px 24px', maxHeight:'85vh', overflowY:'auto' }}>
              <div style={{ maxWidth:500, margin:'0 auto' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
                  <h3 style={{ margin:0, fontSize:16, fontWeight:800, color:C.navy }}>تقديم على الوظيفة</h3>
                  <button onClick={()=>setShowApply(false)} style={{ background:'none', border:'none', fontSize:20, cursor:'pointer', color:C.muted }}>✕</button>
                </div>
                <div style={{ display:'grid', gap:12 }}>
                  <div>
                    <label style={{ fontSize:12, fontWeight:600, color:C.text, display:'block', marginBottom:5 }}>الاسم الكامل *</label>
                    <input value={form.name} onChange={e=>set('name',e.target.value)} placeholder="اسمك الكامل" style={{ ...inp, borderColor: errors.name?'#DC2626':C.border }}/>
                    {errors.name && <p style={{ fontSize:11, color:'#DC2626', margin:'3px 0 0' }}>⚠️ {errors.name}</p>}
                  </div>
                  <div>
                    <label style={{ fontSize:12, fontWeight:600, color:C.text, display:'block', marginBottom:5 }}>رقم الجوال *</label>
                    <input value={form.phone} onChange={e=>set('phone',e.target.value)} placeholder="05xxxxxxxx" inputMode="tel" style={{ ...inp, borderColor: errors.phone?'#DC2626':C.border, fontFamily:'monospace', letterSpacing:2 }}/>
                    {errors.phone && <p style={{ fontSize:11, color:'#DC2626', margin:'3px 0 0' }}>⚠️ {errors.phone}</p>}
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                    <div>
                      <label style={{ fontSize:12, fontWeight:600, color:C.text, display:'block', marginBottom:5 }}>البريد الإلكتروني</label>
                      <input value={form.email} onChange={e=>set('email',e.target.value)} type="email" placeholder="اختياري" style={{ ...inp, borderColor: errors.email?'#DC2626':C.border }}/>
                      {errors.email && <p style={{ fontSize:11, color:'#DC2626', margin:'3px 0 0' }}>⚠️ {errors.email}</p>}
                    </div>
                    <div>
                      <label style={{ fontSize:12, fontWeight:600, color:C.text, display:'block', marginBottom:5 }}>المدينة</label>
                      <select value={form.city} onChange={e=>set('city',e.target.value)} style={inp}>
                        {CITIES.map(c=><option key={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize:12, fontWeight:600, color:C.text, display:'block', marginBottom:5 }}>سنوات الخبرة</label>
                    <select value={form.experience} onChange={e=>set('experience',e.target.value)} style={inp}>
                      <option value="">اختر...</option>
                      {['0','1','2','3','4','5','6','7','8','9','10+'].map(v=><option key={v} value={v}>{v} {v==='0'?'(بدون خبرة)':v==='10+'?'أو أكثر':'سنة'}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize:12, fontWeight:600, color:C.text, display:'block', marginBottom:5 }}>رسالة تقديم</label>
                    <textarea value={form.cover_note} onChange={e=>set('cover_note',e.target.value)} rows={3}
                      placeholder="أخبرنا لماذا أنت مناسب لهذا الدور... (اختياري)"
                      style={{ ...inp, resize:'vertical', lineHeight:1.6 }}/>
                  </div>
                  <button onClick={submit} disabled={submitting} style={{
                    padding:'13px', border:'none', borderRadius:10,
                    background: submitting ? '#DBDAE3' : C.orange,
                    color:'#fff', fontWeight:800, fontSize:15, cursor: submitting?'not-allowed':'pointer', fontFamily:'inherit'
                  }}>
                    {submitting ? '⏳ جاري الإرسال...' : '✅ إرسال طلب التوظيف'}
                  </button>
                  <p style={{ fontSize:11, color:C.muted, textAlign:'center', margin:0 }}>
                    بياناتك تُستخدم فقط للتواصل بشأن هذه الوظيفة
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ background:C.card, borderTop:`1px solid ${C.border}`, padding:'12px 16px', display:'flex', gap:10, alignItems:'center' }}>
              <div style={{ flex:1 }}>
                <p style={{ margin:0, fontSize:13, fontWeight:700, color:C.navy }}>{job.title}</p>
                <p style={{ margin:0, fontSize:12, color:C.orange, fontWeight:700 }}>{job.daily_rate} ر.س/يوم</p>
              </div>
              {isFull ? (
                <button disabled style={{ padding:'12px 24px', background:'#DBDAE3', border:'none', borderRadius:10, color:C.muted, fontWeight:700, fontSize:14, cursor:'not-allowed' }}>
                  اكتملت المقاعد
                </button>
              ) : (
                <button onClick={()=>setShowApply(true)} style={{
                  padding:'12px 28px', border:'none', borderRadius:10,
                  background:`linear-gradient(135deg,${C.orange},#D84020)`,
                  color:'#fff', fontWeight:800, fontSize:14, cursor:'pointer', fontFamily:'inherit',
                  boxShadow:'0 4px 16px rgba(240,85,55,0.4)'
                }}>
                  تقدّم الآن ←
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Success screen */}
      {submitted && (
        <div style={{ position:'fixed', inset:0, background:'rgba(30,10,60,0.9)', zIndex:100, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
          <div style={{ background:C.card, borderRadius:20, padding:32, maxWidth:380, width:'100%', textAlign:'center' }}>
            <div style={{ fontSize:64, marginBottom:16 }}>🎉</div>
            <h2 style={{ fontSize:22, fontWeight:900, color:C.navy, margin:'0 0 10px' }}>تم إرسال طلبك!</h2>
            <p style={{ fontSize:14, color:C.muted, margin:'0 0 20px', lineHeight:1.6 }}>
              تم استلام طلبك بنجاح. سيتواصل معك المسؤول على الرقم الذي أدخلته في حال قبولك.
            </p>
            <div style={{ background:'#F8F7FA', borderRadius:10, padding:'12px 16px', marginBottom:20, textAlign:'right' }}>
              <p style={{ fontSize:12, color:C.muted, margin:'0 0 4px' }}>الوظيفة</p>
              <p style={{ fontWeight:700, color:C.navy, margin:0 }}>{job.title}</p>
              <p style={{ fontSize:12, color:C.orange, margin:'2px 0 0', fontWeight:600 }}>📍 {job.city} · 💰 {job.daily_rate} ر.س/يوم</p>
            </div>
            <a href={`https://wa.me/?text=${waText}`} target="_blank" rel="noopener"
              style={{ display:'block', padding:'12px', background:'#25D366', borderRadius:10, color:'#fff', fontWeight:700, fontSize:14, textDecoration:'none', marginBottom:10 }}>
              📢 شارك مع أصدقائك
            </a>
            <p style={{ fontSize:12, color:C.muted }}>يمكنك إغلاق هذه الصفحة الآن</p>
          </div>
        </div>
      )}

    </div>
  )
}
