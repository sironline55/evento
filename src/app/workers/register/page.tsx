'use client'
export const dynamic = 'force-dynamic'
import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

const C = { navy:'#1E0A3C', orange:'#F05537', text:'#1F1F2E', muted:'#4A4A68', border:'#C8C6D4', bg:'#F4F3F8', card:'#FFFFFF', green:'#1A6B00' }

const CITIES = ['الرياض','جدة','الدمام','مكة المكرمة','المدينة المنورة','الطائف','تبوك','القصيم','حائل','أبها','نجران','جازان']
const SKILLS = ['استقبال ضيوف','صب قهوة وشاي','تسجيل الزوار','إدارة الحشود','التوجيه والإرشاد','المساعدة اللوجستية','التنسيق الميداني','الأمن والسلامة','التصوير','دعم تقني']
const EVENT_TYPES = ['مؤتمرات','معارض','حفلات','مهرجانات','فعاليات حكومية','مجالس واجتماعات','افتتاحيات','رياضية']
const DAYS = [{k:'sat',l:'السبت'},{k:'sun',l:'الأحد'},{k:'mon',l:'الاثنين'},{k:'tue',l:'الثلاثاء'},{k:'wed',l:'الأربعاء'},{k:'thu',l:'الخميس'},{k:'fri',l:'الجمعة'}]

const inp: React.CSSProperties = {
  padding:'13px 16px', border:`2px solid ${C.border}`, borderRadius:10,
  fontSize:15, width:'100%', outline:'none', background:C.card,
  color:C.text, boxSizing:'border-box', fontFamily:'inherit', fontWeight:500
}
const label: React.CSSProperties = { fontSize:13, fontWeight:700, color:C.navy, display:'block', marginBottom:6 }
const section: React.CSSProperties = { marginBottom:18 }

export default function WorkerRegisterPage() {
  const router = useRouter()
  const [step, setStep]     = useState(1)
  const [loading, setLoading] = useState(false)
  const [done, setDone]     = useState(false)
  const [form, setForm] = useState({
    full_name:'', phone:'', email:'', password:'', city:'',
    gender:'' as 'male'|'female'|'', age:'',
    skills:[] as string[], experience_years:'0', daily_rate:'150',
    availability:[] as string[], event_types:[] as string[],
    bio:'', national_id:''
  })

  const toggle = (arr:string[], val:string) => arr.includes(val)?arr.filter(x=>x!==val):[...arr,val]
  const set = (k:string,v:any) => setForm(f=>({...f,[k]:v}))

  async function submit() {
    if(!form.email||!form.password) { alert('يرجى إدخال البريد الإلكتروني وكلمة المرور'); return }
    setLoading(true)
    try {
      // 1. Create auth account
      const { data: authData, error: authErr } = await sb.auth.signUp({ email:form.email, password:form.password })
      if (authErr) throw authErr
      const userId = authData.user?.id
      // 2. Create worker profile
      const { error: wpErr } = await sb.from('worker_profiles').insert({
        full_name: form.full_name, phone: form.phone, email: form.email,
        city: form.city, gender: form.gender||null,
        age: form.age?parseInt(form.age):null, bio: form.bio||null,
        skills: form.skills, experience_years: parseInt(form.experience_years),
        daily_rate: parseInt(form.daily_rate), availability: form.availability,
        event_types: form.event_types, source: 'self_registered',
        national_id: form.national_id||null, user_id: userId||null, status:'pending'
      })
      if (wpErr) throw wpErr
      setDone(true)
    } catch(e:any) {
      alert('خطأ: '+(e.message||'يرجى المحاولة مرة أخرى'))
    } finally { setLoading(false) }
  }

  if (done) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:C.bg,direction:'rtl'}}>
      <div style={{background:C.card,borderRadius:16,padding:40,textAlign:'center',maxWidth:420,boxShadow:'0 4px 24px rgba(0,0,0,0.08)'}}>
        <div style={{fontSize:56,marginBottom:16}}>🎉</div>
        <h2 style={{fontSize:22,fontWeight:800,color:C.navy,marginBottom:8}}>تم التسجيل بنجاح!</h2>
        <p style={{color:C.muted,fontSize:14,marginBottom:24}}>سيتم مراجعة طلبك خلال 24 ساعة. يمكنك الدخول لبوابة الكوادر الآن.</p>
        <Link href="/staff/login" style={{display:'block',padding:'12px',background:C.orange,color:'#fff',borderRadius:8,textDecoration:'none',fontWeight:700,fontSize:14,marginBottom:10}}>
          دخول بوابة الكوادر ←
        </Link>
      </div>
    </div>
  )

  const steps = ['المعلومات الأساسية','المهارات والخبرة','الإتاحة والأجر']

  return (
    <div style={{minHeight:'100vh',background:C.bg,direction:'rtl'}}>
      <style>{`input::placeholder,select::placeholder,textarea::placeholder{color:#8884AA;opacity:1} input,select,textarea{transition:border-color 0.15s} input:focus,select:focus,textarea:focus{border-color:#F05537 !important}`}</style>
      <div style={{maxWidth:540,margin:'0 auto',padding:'32px 16px'}}>

        {/* Header */}
        <div style={{textAlign:'center',marginBottom:28}}>
          <div style={{width:60,height:60,background:C.orange,borderRadius:14,display:'inline-flex',alignItems:'center',justifyContent:'center',marginBottom:14,fontSize:28}}>👤</div>
          <h1 style={{fontSize:24,fontWeight:800,color:C.navy,margin:'0 0 6px'}}>سجّل للعمل في الفعاليات</h1>
          <p style={{color:C.muted,fontSize:14,margin:0}}>انضم لآلاف الكوادر وابدأ العمل في الفعاليات السعودية</p>
        </div>

        {/* Card */}
        <div style={{background:C.card,borderRadius:16,padding:28,boxShadow:'0 4px 24px rgba(0,0,0,0.07)'}}>
          {/* Step indicators */}
          <div style={{display:'flex',gap:8,marginBottom:24}}>
            {steps.map((s,i)=>(
              <div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
                <div style={{height:4,width:'100%',borderRadius:2,background:step>i+1?C.orange:step===i+1?C.orange:'#E8E6F0',opacity:step>i+1?0.5:1}}/>
                <span style={{fontSize:10,color:step===i+1?C.orange:step>i+1?C.muted:'#C0BDCE',fontWeight:step===i+1?700:400}}>{s}</span>
              </div>
            ))}
          </div>

          {/* Step 1 */}
          {step===1&&(
            <div>
              <div style={section}>
                <label style={label}>الاسم الكامل *</label>
                <input value={form.full_name} onChange={e=>set('full_name',e.target.value)} placeholder="محمد أحمد العمري" style={inp}/>
              </div>
              <div style={section}>
                <label style={label}>رقم الجوال *</label>
                <input value={form.phone} onChange={e=>set('phone',e.target.value)} placeholder="05xxxxxxxx" style={inp} type="tel"/>
              </div>
              <div style={section}>
                <label style={label}>البريد الإلكتروني * (لدخول البوابة)</label>
                <input value={form.email} onChange={e=>set('email',e.target.value)} placeholder="your@email.com" style={inp} type="email"/>
              </div>
              <div style={section}>
                <label style={label}>كلمة المرور * (لدخول البوابة)</label>
                <input value={form.password} onChange={e=>set('password',e.target.value)} placeholder="8 أحرف على الأقل" style={inp} type="password"/>
              </div>
              <div style={section}>
                <label style={label}>المدينة *</label>
                <select value={form.city} onChange={e=>set('city',e.target.value)} style={inp}>
                  <option value="">اختر المدينة</option>
                  {CITIES.map(c=><option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div style={section}>
                <label style={label}>الجنس *</label>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                  {[['male','ذكر'],['female','أنثى']].map(([v,l])=>(
                    <button key={v} onClick={()=>set('gender',v)} style={{padding:'12px',borderRadius:10,border:`2px solid ${form.gender===v?C.orange:C.border}`,background:form.gender===v?'#FEF0ED':C.card,color:form.gender===v?C.orange:C.text,fontWeight:700,fontSize:15,cursor:'pointer',fontFamily:'inherit'}}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
              <div style={section}>
                <label style={label}>العمر</label>
                <input value={form.age} onChange={e=>set('age',e.target.value)} placeholder="العمر (اختياري)" style={inp} type="number" min="18" max="65"/>
              </div>
              <button onClick={()=>{ if(!form.full_name||!form.phone||!form.email||!form.password||!form.city||!form.gender) return alert('يرجى تعبئة جميع الحقول المطلوبة'); setStep(2) }}
                style={{width:'100%',padding:'14px',background:C.orange,color:'#fff',border:'none',borderRadius:12,fontSize:16,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>
                التالي ←
              </button>
            </div>
          )}

          {/* Step 2 */}
          {step===2&&(
            <div>
              <div style={section}>
                <label style={{...label,marginBottom:10}}>المهارات (اختر ما ينطبق)</label>
                <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
                  {SKILLS.map(s=>(
                    <button key={s} onClick={()=>set('skills',toggle(form.skills,s))} style={{padding:'8px 14px',borderRadius:20,border:`2px solid ${form.skills.includes(s)?C.orange:C.border}`,background:form.skills.includes(s)?'#FEF0ED':C.card,color:form.skills.includes(s)?C.orange:C.text,fontWeight:600,fontSize:13,cursor:'pointer',fontFamily:'inherit'}}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div style={section}>
                <label style={{...label,marginBottom:10}}>أنواع الفعاليات المفضلة</label>
                <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
                  {EVENT_TYPES.map(e=>(
                    <button key={e} onClick={()=>set('event_types',toggle(form.event_types,e))} style={{padding:'8px 14px',borderRadius:20,border:`2px solid ${form.event_types.includes(e)?C.orange:C.border}`,background:form.event_types.includes(e)?'#FEF0ED':C.card,color:form.event_types.includes(e)?C.orange:C.text,fontWeight:600,fontSize:13,cursor:'pointer',fontFamily:'inherit'}}>
                      {e}
                    </button>
                  ))}
                </div>
              </div>
              <div style={section}>
                <label style={label}>سنوات الخبرة في الفعاليات</label>
                <select value={form.experience_years} onChange={e=>set('experience_years',e.target.value)} style={{...inp,marginTop:4}}>
                  <option value="0">لا خبرة سابقة</option>
                  <option value="1">سنة</option>
                  <option value="2">2 سنوات</option>
                  <option value="3">3 سنوات</option>
                  <option value="5">5+ سنوات</option>
                </select>
              </div>
              <div style={section}>
                <label style={label}>نبذة تعريفية (اختياري)</label>
                <textarea value={form.bio} onChange={e=>set('bio',e.target.value)} placeholder="اكتب نبذة عن نفسك ومهاراتك..." rows={3} style={{...inp,resize:'vertical'}}/>
              </div>
              <div style={{display:'flex',gap:10}}>
                <button onClick={()=>setStep(1)} style={{padding:'14px 20px',background:'#EDE9F7',border:'none',borderRadius:12,color:'#7B4FBF',fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>← السابق</button>
                <button onClick={()=>{ if(form.skills.length===0) return alert('اختر مهارة واحدة على الأقل'); setStep(3) }} style={{flex:1,padding:'14px',background:C.orange,color:'#fff',border:'none',borderRadius:12,fontSize:15,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>
                  التالي ←
                </button>
              </div>
            </div>
          )}

          {/* Step 3 */}
          {step===3&&(
            <div>
              <div style={section}>
                <label style={{...label,marginBottom:10}}>أيام الإتاحة للعمل</label>
                <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8}}>
                  {DAYS.map(d=>(
                    <button key={d.k} onClick={()=>set('availability',toggle(form.availability,d.k))} style={{padding:'10px 6px',borderRadius:8,border:`2px solid ${form.availability.includes(d.k)?C.orange:C.border}`,background:form.availability.includes(d.k)?'#FEF0ED':C.card,color:form.availability.includes(d.k)?C.orange:C.text,fontWeight:700,fontSize:12,cursor:'pointer',fontFamily:'inherit',textAlign:'center'}}>
                      {d.l}
                    </button>
                  ))}
                </div>
              </div>
              <div style={section}>
                <label style={label}>الأجر المقبول لليوم (ريال)</label>
                <input value={form.daily_rate} onChange={e=>set('daily_rate',e.target.value)} style={{...inp,marginTop:4}} type="number" min="50" max="2000"/>
                <p style={{fontSize:12,color:C.muted,margin:'6px 0 0'}}>متوسط السوق: 150-300 ريال/يوم</p>
              </div>
              <div style={{background:'#F0EDF7',borderRadius:10,padding:'14px 16px',marginBottom:18,border:`1px solid #C9C3E0`}}>
                <p style={{fontSize:13,color:C.navy,fontWeight:700,margin:'0 0 4px'}}>🔒 بياناتك محمية</p>
                <p style={{fontSize:12,color:C.muted,margin:0}}>لن نشارك بياناتك مع أي جهة دون موافقتك</p>
              </div>
              <div style={{display:'flex',gap:10}}>
                <button onClick={()=>setStep(2)} style={{padding:'14px 20px',background:'#EDE9F7',border:'none',borderRadius:12,color:'#7B4FBF',fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>← السابق</button>
                <button onClick={submit} disabled={loading||form.availability.length===0}
                  style={{flex:1,padding:'14px',background:loading||form.availability.length===0?'#ccc':C.orange,color:'#fff',border:'none',borderRadius:12,fontSize:15,fontWeight:700,cursor:loading||form.availability.length===0?'not-allowed':'pointer',fontFamily:'inherit'}}>
                  {loading?'جاري التسجيل...':'✅ أكمل التسجيل'}
                </button>
              </div>
            </div>
          )}
        </div>

        <p style={{textAlign:'center',marginTop:20,fontSize:13,color:C.muted}}>
          لديك حساب بالفعل؟ <Link href="/staff/login" style={{color:C.orange,fontWeight:700,textDecoration:'none'}}>سجّل الدخول</Link>
        </p>
        <p style={{textAlign:'center',marginTop:8,fontSize:12,color:'#9CA3AF'}}>
          هل أنت شركة فعاليات؟ <Link href="/login" style={{color:C.orange}}>سجّل هنا</Link>
        </p>
      </div>
    </div>
  )
}
