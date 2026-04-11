'use client'
import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'

const C = {
  navy:'#1E0A3C', orange:'#F05537', text:'#39364F',
  muted:'#6F7287', border:'#DBDAE3', bg:'#F8F7FA', card:'#FFFFFF', green:'#3A7D0A'
}

const CITIES = ['الرياض','جدة','الدمام','مكة المكرمة','المدينة المنورة','الخبر','تبوك','أبها','القصيم','أخرى']
const SKILLS_OPTIONS = ['استقبال','تسجيل','أمن','توجيه','تقني','ترجمة','تصوير','خدمة ضيوف','دعم إداري','إنجليزية','برامج Office']

export default function PublicJobClient({ job }: { job: any }) {
  const [step, setStep]           = useState<'view'|'apply'|'done'>('view')
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    name:'', phone:'', email:'', city:'الرياض',
    experience_years:'0', cover_note:'', skills: [] as string[],
  })
  const set = (k:string, v:string) => setForm(f => ({...f,[k]:v}))
  const toggleSkill = (s:string) => setForm(f => ({
    ...f, skills: f.skills.includes(s) ? f.skills.filter(x=>x!==s) : [...f.skills,s]
  }))

  const inp: React.CSSProperties = {
    width:'100%', padding:'11px 14px', border:`1px solid ${C.border}`,
    borderRadius:8, fontSize:14, outline:'none', fontFamily:'inherit',
    color:C.text, background:C.card, boxSizing:'border-box'
  }

  const shareUrl = typeof window !== 'undefined' ? window.location.href : ''
  const waText   = encodeURIComponent(`وظيفة: ${job.title}\n📍 ${job.city} · 💰 ${job.daily_rate} ر.س/يوم\n📅 ${job.event_date}\n\nقدّم الآن: ${shareUrl}`)

  async function submitApplication() {
    if (!form.name.trim() || !form.phone.trim()) {
      alert('الاسم ورقم الجوال مطلوبان'); return
    }
    setSubmitting(true)
    const sb = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    try {
      const { error } = await sb.from('worker_applications').insert({
        staffing_request_id: job.id,
        request_id:          job.id,
        worker_id:           '00000000-0000-0000-0000-000000000000', // guest
        status:              'pending',
        cover_note:          form.cover_note || null,
        applicant_name:      form.name.trim(),
        applicant_phone:     form.phone.trim(),
        applicant_email:     form.email || null,
        applicant_city:      form.city,
        applicant_skills:    form.skills.length ? form.skills : null,
        experience_years:    parseInt(form.experience_years)||0,
        is_guest_apply:      true,
      })
      if (error) throw error
      setStep('done')
    } catch(e:any) { alert('خطأ: '+e.message) }
    finally { setSubmitting(false) }
  }

  // ── DONE ──────────────────────────────────────────────────────────
  if (step === 'done') return (
    <div style={{minHeight:'100vh',background:C.bg,display:'flex',alignItems:'center',justifyContent:'center',padding:20,direction:'rtl'}}>
      <div style={{background:C.card,borderRadius:20,padding:40,maxWidth:420,width:'100%',textAlign:'center',boxShadow:'0 8px 40px rgba(0,0,0,0.1)'}}>
        <div style={{fontSize:64,marginBottom:12}}>✅</div>
        <h2 style={{fontSize:24,fontWeight:800,color:C.navy,margin:'0 0 8px'}}>تم إرسال طلبك!</h2>
        <p style={{color:C.muted,fontSize:14,margin:'0 0 20px',lineHeight:1.6}}>
          سيتواصل معك صاحب العمل قريباً على رقم <strong>{form.phone}</strong>
        </p>
        <div style={{background:'#EAF7E0',borderRadius:10,padding:'14px 18px',marginBottom:20}}>
          <p style={{margin:0,fontSize:13,color:C.green,fontWeight:600}}>
            🎉 طلبك قيد المراجعة — تابع جوالك!
          </p>
        </div>
        <a href={`https://wa.me/?text=${waText}`} target="_blank" rel="noopener"
          style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8,padding:'11px 20px',background:'#25D366',border:'none',borderRadius:8,color:'#fff',fontWeight:700,fontSize:14,textDecoration:'none'}}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          شارك الفرصة عبر واتساب
        </a>
      </div>
    </div>
  )

  // ── APPLY FORM ────────────────────────────────────────────────────
  if (step === 'apply') return (
    <div style={{minHeight:'100vh',background:C.bg,direction:'rtl'}}>
      {/* Mini header */}
      <div style={{background:C.navy,padding:'14px 20px',display:'flex',alignItems:'center',gap:12}}>
        <button onClick={()=>setStep('view')} style={{background:'rgba(255,255,255,0.1)',border:'none',color:'#fff',borderRadius:6,padding:'6px 12px',cursor:'pointer',fontFamily:'inherit',fontSize:12}}>← رجوع</button>
        <p style={{color:'#fff',fontWeight:700,fontSize:14,margin:0,flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{job.title}</p>
      </div>

      <div style={{maxWidth:540,margin:'0 auto',padding:'20px 16px 60px'}}>
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:24}}>
          <h2 style={{fontSize:20,fontWeight:800,color:C.navy,margin:'0 0 4px'}}>تقديم الطلب</h2>
          <p style={{fontSize:13,color:C.muted,margin:'0 0 20px'}}>يتواصل معك صاحب العمل مباشرة على جوالك</p>

          <div style={{display:'grid',gap:12}}>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
              <div>
                <label style={{fontSize:12,fontWeight:600,color:C.text,display:'block',marginBottom:4}}>الاسم الكامل *</label>
                <input value={form.name} onChange={e=>set('name',e.target.value)} placeholder="محمد عبدالله" style={inp}/>
              </div>
              <div>
                <label style={{fontSize:12,fontWeight:600,color:C.text,display:'block',marginBottom:4}}>رقم الجوال *</label>
                <input value={form.phone} onChange={e=>set('phone',e.target.value)} placeholder="05xxxxxxxx" inputMode="tel" style={inp}/>
              </div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
              <div>
                <label style={{fontSize:12,fontWeight:600,color:C.text,display:'block',marginBottom:4}}>البريد (اختياري)</label>
                <input type="email" value={form.email} onChange={e=>set('email',e.target.value)} placeholder="name@email.com" style={inp}/>
              </div>
              <div>
                <label style={{fontSize:12,fontWeight:600,color:C.text,display:'block',marginBottom:4}}>المدينة</label>
                <select value={form.city} onChange={e=>set('city',e.target.value)} style={inp}>
                  {CITIES.map(c=><option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label style={{fontSize:12,fontWeight:600,color:C.text,display:'block',marginBottom:6}}>المهارات ذات الصلة</label>
              <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                {SKILLS_OPTIONS.map(s => (
                  <button key={s} onClick={()=>toggleSkill(s)} style={{
                    padding:'5px 12px',borderRadius:20,fontSize:12,cursor:'pointer',fontFamily:'inherit',fontWeight:600,
                    border:`1px solid ${form.skills.includes(s)?C.orange:C.border}`,
                    background:form.skills.includes(s)?'#FEF0ED':C.card,
                    color:form.skills.includes(s)?C.orange:C.text,
                  }}>{s}</button>
                ))}
              </div>
            </div>
            <div>
              <label style={{fontSize:12,fontWeight:600,color:C.text,display:'block',marginBottom:4}}>سنوات الخبرة</label>
              <select value={form.experience_years} onChange={e=>set('experience_years',e.target.value)} style={{...inp,maxWidth:160}}>
                {['0','1','2','3','4','5','6+'].map(v=><option key={v} value={v}>{v==='0'?'بدون خبرة':v+' سنوات'}</option>)}
              </select>
            </div>
            <div>
              <label style={{fontSize:12,fontWeight:600,color:C.text,display:'block',marginBottom:4}}>رسالة تعريفية (اختياري)</label>
              <textarea value={form.cover_note} onChange={e=>set('cover_note',e.target.value)} rows={3}
                placeholder="اكتب باختصار لماذا أنت مناسب لهذا الدور..." style={{...inp,resize:'vertical'}}/>
            </div>
          </div>

          <button onClick={submitApplication} disabled={submitting||!form.name.trim()||!form.phone.trim()} style={{
            marginTop:20,width:'100%',padding:'13px',border:'none',borderRadius:8,
            background: form.name.trim()&&form.phone.trim() ? C.orange : '#DBDAE3',
            color:'#fff',fontWeight:700,fontSize:15,cursor:submitting?'wait':'pointer',fontFamily:'inherit',transition:'background 0.2s'
          }}>
            {submitting?'⏳ جاري الإرسال...':'🚀 إرسال الطلب'}
          </button>
          <p style={{textAlign:'center',fontSize:11,color:C.muted,margin:'10px 0 0'}}>
            بالضغط على إرسال توافق على مشاركة بياناتك مع صاحب العمل
          </p>
        </div>
      </div>
    </div>
  )

  // ── JOB VIEW ──────────────────────────────────────────────────────
  const posted = new Date(job.created_at).toLocaleDateString('ar-SA',{year:'numeric',month:'long',day:'numeric'})
  const deadline = job.event_date ? new Date(job.event_date).toLocaleDateString('ar-SA',{weekday:'long',year:'numeric',month:'long',day:'numeric'}) : null
  const pct = Math.min(100, Math.round(((job.workers_confirmed||0)/(job.workers_needed||1))*100))

  return (
    <div style={{minHeight:'100vh',background:C.bg,direction:'rtl'}}>
      {/* Cover Image */}
      {job.cover_image ? (
        <div style={{height:240,background:'#1E0A3C',overflow:'hidden',position:'relative'}}>
          <img src={job.cover_image} alt="" style={{width:'100%',height:'100%',objectFit:'cover',opacity:0.85}}/>
          <div style={{position:'absolute',inset:0,background:'linear-gradient(to top,rgba(30,10,60,0.8),transparent)'}}/>
          <div style={{position:'absolute',bottom:16,right:16,left:16}}>
            <h1 style={{color:'#fff',fontSize:22,fontWeight:800,margin:0,lineHeight:1.3}}>{job.title}</h1>
            {job.org_name&&<p style={{color:'rgba(255,255,255,0.8)',fontSize:13,margin:'4px 0 0'}}>{job.org_name}</p>}
          </div>
        </div>
      ) : (
        <div style={{height:140,background:`linear-gradient(135deg,${C.navy},#3D1A78)`,display:'flex',alignItems:'flex-end',padding:'16px 20px'}}>
          <div>
            <h1 style={{color:'#fff',fontSize:20,fontWeight:800,margin:0}}>{job.title}</h1>
            {job.org_name&&<p style={{color:'rgba(255,255,255,0.7)',fontSize:12,margin:'3px 0 0'}}>{job.org_name}</p>}
          </div>
        </div>
      )}

      <div style={{maxWidth:600,margin:'0 auto',padding:'16px 16px 100px'}}>
        {/* Key info pills */}
        <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:14}}>
          {[
            {icon:'🏷️',text:job.role_type},
            {icon:'📍',text:job.city},
            {icon:'📅',text:job.event_date},
            {icon:'⏱️',text:`${job.duration_hours||8} ساعات`},
            {icon:'💰',text:`${job.daily_rate} ر.س/يوم`},
            job.gender_preference&&{icon:'👤',text:job.gender_preference==='male'?'ذكر':job.gender_preference==='female'?'أنثى':'—'},
            job.require_nafath&&{icon:'🛡️',text:'يُشترط توثيق نفاذ'},
          ].filter(Boolean).map((p:any,i)=>(
            <span key={i} style={{fontSize:12,fontWeight:600,padding:'5px 10px',borderRadius:20,background:C.card,border:`1px solid ${C.border}`,color:C.text,display:'flex',alignItems:'center',gap:4}}>
              <span>{p.icon}</span>{p.text}
            </span>
          ))}
        </div>

        {/* Progress */}
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:'14px 16px',marginBottom:12}}>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
            <span style={{fontSize:12,color:C.muted,fontWeight:600}}>المقاعد المتبقية</span>
            <span style={{fontSize:13,fontWeight:800,color:pct===100?C.green:C.navy}}>
              {(job.workers_needed||0)-(job.workers_confirmed||0)} من {job.workers_needed||'—'}
            </span>
          </div>
          <div style={{background:'#EDE9F7',borderRadius:50,height:7,overflow:'hidden'}}>
            <div style={{width:`${pct}%`,height:'100%',background:pct===100?C.green:C.orange,borderRadius:50,transition:'width 0.4s'}}/>
          </div>
          <p style={{fontSize:11,color:C.muted,margin:'6px 0 0'}}>{pct}% ممتلئ · {job.views_count||0} مشاهدة</p>
        </div>

        {/* Description */}
        {job.description && (
          <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:'16px',marginBottom:12}}>
            <h3 style={{fontSize:14,fontWeight:700,color:C.navy,margin:'0 0 8px'}}>📋 تفاصيل الوظيفة</h3>
            <p style={{fontSize:13,color:C.text,lineHeight:1.7,margin:0,whiteSpace:'pre-line'}}>{job.description}</p>
          </div>
        )}

        {/* Highlights */}
        {job.highlights && job.highlights.length > 0 && (
          <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:'16px',marginBottom:12}}>
            <h3 style={{fontSize:14,fontWeight:700,color:C.navy,margin:'0 0 10px'}}>✨ أبرز مميزات الوظيفة</h3>
            <div style={{display:'grid',gap:7}}>
              {job.highlights.map((h:string,i:number) => (
                <div key={i} style={{display:'flex',gap:8,alignItems:'flex-start'}}>
                  <span style={{color:C.green,fontSize:15,flexShrink:0}}>✓</span>
                  <span style={{fontSize:13,color:C.text}}>{h}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Requirements */}
        {job.requirements && (
          <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:'16px',marginBottom:12}}>
            <h3 style={{fontSize:14,fontWeight:700,color:C.navy,margin:'0 0 8px'}}>📌 المتطلبات</h3>
            <p style={{fontSize:13,color:C.text,lineHeight:1.7,margin:0,whiteSpace:'pre-line'}}>{job.requirements}</p>
          </div>
        )}

        {/* Benefits */}
        {job.benefits && job.benefits.length > 0 && (
          <div style={{background:'#EAF7E0',border:'1px solid #C3E6C3',borderRadius:10,padding:'16px',marginBottom:12}}>
            <h3 style={{fontSize:14,fontWeight:700,color:C.green,margin:'0 0 10px'}}>🎁 المزايا والفوائد</h3>
            <div style={{display:'grid',gap:7}}>
              {job.benefits.map((b:string,i:number) => (
                <div key={i} style={{display:'flex',gap:8,alignItems:'flex-start'}}>
                  <span style={{color:C.green,fontSize:14,flexShrink:0}}>🎁</span>
                  <span style={{fontSize:13,color:'#2A6A20'}}>{b}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Posted info */}
        <p style={{fontSize:11,color:C.muted,margin:'0 0 80px',textAlign:'center'}}>
          نُشر في {posted} · آخر موعد للتقديم: {deadline||'غير محدد'}
        </p>
      </div>

      {/* Fixed bottom CTA */}
      <div style={{position:'fixed',bottom:0,left:0,right:0,background:C.card,borderTop:`1px solid ${C.border}`,padding:'12px 16px',display:'flex',gap:10,direction:'rtl'}}>
        <a href={`https://wa.me/?text=${waText}`} target="_blank" rel="noopener"
          style={{display:'flex',alignItems:'center',gap:6,padding:'11px 16px',background:'#25D366',border:'none',borderRadius:8,color:'#fff',fontWeight:700,fontSize:13,textDecoration:'none',flexShrink:0}}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          مشاركة
        </a>
        <button onClick={()=>setStep('apply')} disabled={pct===100} style={{
          flex:1,padding:'11px',border:'none',borderRadius:8,
          background:pct===100?'#DBDAE3':C.orange,
          color:'#fff',fontWeight:700,fontSize:15,cursor:pct===100?'not-allowed':'pointer',fontFamily:'inherit'
        }}>
          {pct===100?'المقاعد ممتلئة':'🚀 قدّم الآن'}
        </button>
      </div>
    </div>
  )
}
