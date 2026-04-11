'use client'
import React, { useEffect, useState, useMemo } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter, useSearchParams } from 'next/navigation'

const C = { navy:'#1E0A3C', orange:'#F05537', text:'#39364F', muted:'#6F7287', border:'#DBDAE3', bg:'#FAFAFA', card:'#FFFFFF', green:'#3A7D0A' }
const inp: React.CSSProperties = { width:'100%', padding:'11px 14px', border:`1px solid ${C.border}`, borderRadius:8, fontSize:14, outline:'none', fontFamily:'inherit', color:C.text, background:C.card, boxSizing:'border-box' }
const lbl: React.CSSProperties = { fontSize:12, fontWeight:700, color:C.text, display:'block', marginBottom:6 }

const CONTENT_TYPES = ['ريلز','ستوري','فيديو يوتيوب','منشور','تغطية مباشرة']

export default function NewBriefPage() {
  const sb = useMemo(() => createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!), [])
  const router = useRouter()
  const params = useSearchParams()
  const preselectedInfluencer = params.get('influencer')

  const [user, setUser] = useState<any>(null)
  const [org, setOrg] = useState<any>(null)
  const [events, setEvents] = useState<any[]>([])
  const [saving, setSaving] = useState(false)
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    title: '', description: '', event_id: '', event_name: '', event_date: '',
    event_location: '', content_types: [] as string[],
    influencer_count: 1, budget_min: '', budget_max: '',
    deadline: '', requirements: ''
  })
  const set = (k: string, v: any) => setForm(f => ({...f,[k]:v}))

  useEffect(() => {
    sb.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push('/login'); return }
      setUser(data.user)
      const { data: orgData } = await sb.from('organizations').select('*').eq('owner_id', data.user.id).single()
      setOrg(orgData)
      if (orgData) {
        const { data: evData } = await sb.from('events').select('id,title,start_date,location').eq('org_id', orgData.id).order('start_date', { ascending:false }).limit(20)
        setEvents(evData || [])
      }
    })
  }, [])

  function toggleContentType(ct: string) {
    set('content_types', form.content_types.includes(ct)
      ? form.content_types.filter(c=>c!==ct)
      : [...form.content_types, ct])
  }

  async function handleSubmit() {
    if (!form.title.trim() || !form.description.trim() || form.content_types.length === 0) {
      alert('يرجى ملء جميع الحقول المطلوبة')
      return
    }
    setSaving(true)
    const { data, error } = await sb.from('campaign_briefs').insert({
      org_id: org?.id,
      created_by: user.id,
      title: form.title.trim(),
      description: form.description.trim(),
      event_id: form.event_id || null,
      event_name: form.event_name || null,
      event_date: form.event_date || null,
      event_location: form.event_location || null,
      content_types: form.content_types,
      influencer_count: form.influencer_count,
      budget_min: form.budget_min ? parseInt(form.budget_min) : null,
      budget_max: form.budget_max ? parseInt(form.budget_max) : null,
      deadline: form.deadline || null,
      requirements: form.requirements || null,
      status: 'open'
    }).select().single()
    setSaving(false)
    if (!error && data) {
      router.push(`/influencers/briefs/${data.id}`)
    } else {
      alert('خطأ: ' + error?.message)
    }
  }

  const progress = (step / 3) * 100

  return (
    <div style={{ minHeight:'100vh', background:C.bg, direction:'rtl' }}>
      {/* Header */}
      <div style={{ background:C.card, borderBottom:`1px solid ${C.border}`, padding:'18px 32px' }}>
        <div style={{ maxWidth:680, margin:'0 auto', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <h1 style={{ fontSize:20, fontWeight:800, color:C.navy, margin:0 }}>📢 انشر طلب مؤثر</h1>
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            {[1,2,3].map(s => (
              <div key={s} style={{ display:'flex', alignItems:'center', gap:4 }}>
                <div style={{
                  width:28, height:28, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center',
                  background: step >= s ? C.orange : '#EDE9F7', color: step >= s ? '#fff' : C.muted,
                  fontWeight:700, fontSize:13
                }}>{s}</div>
                {s < 3 && <div style={{ width:24, height:2, background: step > s ? C.orange : '#EDE9F7' }}/>}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth:680, margin:'32px auto', padding:'0 24px' }}>

        {/* Step 1: الفعالية */}
        {step === 1 && (
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:28 }}>
            <h2 style={{ fontSize:18, fontWeight:800, color:C.navy, margin:'0 0 4px' }}>🎪 تفاصيل الفعالية</h2>
            <p style={{ color:C.muted, fontSize:13, margin:'0 0 24px' }}>أخبر المؤثرين عن فعاليتك</p>

            <div style={{ display:'grid', gap:16 }}>
              <div>
                <label style={lbl}>عنوان الحملة *</label>
                <input value={form.title} onChange={e=>set('title',e.target.value)} placeholder="مثال: تغطية مؤتمر ريادة الأعمال 2026" style={inp}/>
              </div>
              <div>
                <label style={lbl}>وصف الحملة وأهدافها *</label>
                <textarea value={form.description} onChange={e=>set('description',e.target.value)} rows={4}
                  placeholder="صف فعاليتك، الجمهور المستهدف، وما تتوقعه من المؤثر..."
                  style={{...inp, resize:'vertical'}}/>
              </div>

              {events.length > 0 && (
                <div>
                  <label style={lbl}>اربط بفعالية في نظامك (اختياري)</label>
                  <select value={form.event_id} onChange={e=>{
                    const ev = events.find(ev=>ev.id===e.target.value)
                    set('event_id', e.target.value)
                    if (ev) {
                      set('event_name', ev.title)
                      set('event_date', ev.start_date?.split('T')[0])
                      set('event_location', ev.location||'')
                    }
                  }} style={inp}>
                    <option value="">-- اختر فعالية --</option>
                    {events.map(ev => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
                  </select>
                </div>
              )}

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div>
                  <label style={lbl}>اسم الفعالية</label>
                  <input value={form.event_name} onChange={e=>set('event_name',e.target.value)} style={inp}/>
                </div>
                <div>
                  <label style={lbl}>تاريخ الفعالية</label>
                  <input type="date" value={form.event_date} onChange={e=>set('event_date',e.target.value)} style={inp}/>
                </div>
              </div>
              <div>
                <label style={lbl}>مكان الفعالية</label>
                <input value={form.event_location} onChange={e=>set('event_location',e.target.value)} placeholder="مثال: قاعة الملك فهد، الرياض" style={inp}/>
              </div>
            </div>

            <button onClick={()=>setStep(2)} disabled={!form.title.trim()||!form.description.trim()} style={{
              marginTop:24, width:'100%', padding:'13px', background: form.title.trim()&&form.description.trim() ? C.navy : '#DBDAE3',
              border:'none', borderRadius:8, color:'#fff', fontWeight:700, fontSize:15, cursor:'pointer', fontFamily:'inherit'
            }}>التالي — نوع المحتوى ←</button>
          </div>
        )}

        {/* Step 2: المحتوى والعدد */}
        {step === 2 && (
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:28 }}>
            <h2 style={{ fontSize:18, fontWeight:800, color:C.navy, margin:'0 0 4px' }}>📱 نوع المحتوى والميزانية</h2>
            <p style={{ color:C.muted, fontSize:13, margin:'0 0 24px' }}>حدد ما تحتاجه من المؤثر</p>

            <div style={{ display:'grid', gap:20 }}>
              <div>
                <label style={lbl}>نوع المحتوى المطلوب * (اختر واحد أو أكثر)</label>
                <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginTop:4 }}>
                  {CONTENT_TYPES.map(ct => (
                    <button key={ct} onClick={()=>toggleContentType(ct)} style={{
                      padding:'9px 18px', borderRadius:20, cursor:'pointer', fontFamily:'inherit',
                      border:`2px solid ${form.content_types.includes(ct)?C.orange:C.border}`,
                      background:form.content_types.includes(ct)?'#FEF0ED':'#fff',
                      color:form.content_types.includes(ct)?C.orange:C.text,
                      fontWeight:form.content_types.includes(ct)?700:400, fontSize:13
                    }}>{ct}</button>
                  ))}
                </div>
              </div>

              <div>
                <label style={lbl}>عدد المؤثرين المطلوبين</label>
                <div style={{ display:'flex', gap:10 }}>
                  {[1,2,3,4,5].map(n => (
                    <button key={n} onClick={()=>set('influencer_count',n)} style={{
                      width:52, height:52, borderRadius:10, cursor:'pointer', fontFamily:'inherit',
                      border:`2px solid ${form.influencer_count===n?C.orange:C.border}`,
                      background:form.influencer_count===n?C.orange:'#fff',
                      color:form.influencer_count===n?'#fff':C.text,
                      fontWeight:700, fontSize:18
                    }}>{n}</button>
                  ))}
                </div>
                <p style={{ fontSize:11, color:C.muted, margin:'6px 0 0' }}>
                  سيتمكن حتى {form.influencer_count} مؤثر من قبول طلبك
                </p>
              </div>

              <div>
                <label style={lbl}>الميزانية المتوقعة (ريال)</label>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  <div>
                    <input type="number" value={form.budget_min} onChange={e=>set('budget_min',e.target.value)} placeholder="الحد الأدنى" style={inp}/>
                  </div>
                  <div>
                    <input type="number" value={form.budget_max} onChange={e=>set('budget_max',e.target.value)} placeholder="الحد الأقصى" style={inp}/>
                  </div>
                </div>
              </div>

              <div>
                <label style={lbl}>آخر موعد لاستقبال العروض</label>
                <input type="date" value={form.deadline} onChange={e=>set('deadline',e.target.value)} style={inp}/>
              </div>

              <div>
                <label style={lbl}>متطلبات إضافية (اختياري)</label>
                <textarea value={form.requirements} onChange={e=>set('requirements',e.target.value)} rows={3}
                  placeholder="مثال: يجب أن يكون المؤثر من الرياض، خبرة سابقة بالمؤتمرات..."
                  style={{...inp,resize:'vertical'}}/>
              </div>
            </div>

            <div style={{ display:'flex', gap:10, marginTop:24 }}>
              <button onClick={()=>setStep(1)} style={{ padding:'13px 20px', background:'#F8F7FA', border:`1px solid ${C.border}`, borderRadius:8, fontFamily:'inherit', cursor:'pointer', fontWeight:600, color:C.text }}>← رجوع</button>
              <button onClick={()=>setStep(3)} disabled={form.content_types.length===0} style={{
                flex:1, padding:'13px', background:form.content_types.length>0?C.navy:'#DBDAE3',
                border:'none', borderRadius:8, color:'#fff', fontWeight:700, fontSize:15, cursor:'pointer', fontFamily:'inherit'
              }}>التالي — مراجعة ونشر ←</button>
            </div>
          </div>
        )}

        {/* Step 3: مراجعة */}
        {step === 3 && (
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:28 }}>
            <h2 style={{ fontSize:18, fontWeight:800, color:C.navy, margin:'0 0 4px' }}>✅ مراجعة الطلب</h2>
            <p style={{ color:C.muted, fontSize:13, margin:'0 0 24px' }}>تأكد من المعلومات قبل النشر</p>

            <div style={{ display:'grid', gap:12 }}>
              {[
                ['📝 العنوان', form.title],
                ['🎪 الفعالية', form.event_name || '—'],
                ['📅 التاريخ', form.event_date || '—'],
                ['📍 المكان', form.event_location || '—'],
                ['📱 المحتوى', form.content_types.join('، ')],
                ['👥 العدد', `${form.influencer_count} مؤثر`],
                ['💰 الميزانية', form.budget_min && form.budget_max ? `${parseInt(form.budget_min).toLocaleString()} - ${parseInt(form.budget_max).toLocaleString()} ريال` : '—'],
                ['⏰ الموعد النهائي', form.deadline || '—'],
              ].map(([label, value]) => (
                <div key={label} style={{ display:'flex', gap:10, padding:'10px 0', borderBottom:`1px solid ${C.border}` }}>
                  <span style={{ fontSize:13, color:C.muted, minWidth:150 }}>{label}</span>
                  <span style={{ fontSize:13, fontWeight:600, color:C.text }}>{value}</span>
                </div>
              ))}
            </div>

            {/* Description preview */}
            <div style={{ background:'#F8F7FA', borderRadius:10, padding:14, margin:'16px 0' }}>
              <p style={{ fontSize:12, fontWeight:700, color:C.navy, margin:'0 0 6px' }}>الوصف:</p>
              <p style={{ fontSize:13, color:C.text, margin:0, lineHeight:1.7 }}>{form.description}</p>
            </div>

            {/* Info box */}
            <div style={{ background:'#EAF7E0', border:'1px solid #C3E6C3', borderRadius:10, padding:'12px 16px', marginBottom:20 }}>
              <p style={{ fontSize:12, color:'#1A5A00', fontWeight:700, margin:'0 0 4px' }}>🔒 كيف يعمل نظام الدفع؟</p>
              <p style={{ fontSize:11, color:'#1A5A00', margin:0, lineHeight:1.7 }}>
                عند قبولك لعرض مؤثر، يُحتجز المبلغ في حساب الضمان (Escrow) ولا يُحوَّل للمؤثر إلا بعد موافقتك على المحتوى المسلَّم.
              </p>
            </div>

            <div style={{ display:'flex', gap:10 }}>
              <button onClick={()=>setStep(2)} style={{ padding:'13px 20px', background:'#F8F7FA', border:`1px solid ${C.border}`, borderRadius:8, fontFamily:'inherit', cursor:'pointer', fontWeight:600, color:C.text }}>← رجوع</button>
              <button onClick={handleSubmit} disabled={saving} style={{
                flex:1, padding:'13px', background:saving?C.muted:C.orange,
                border:'none', borderRadius:8, color:'#fff', fontWeight:700, fontSize:15, cursor:saving?'wait':'pointer', fontFamily:'inherit'
              }}>{saving?'⏳ جاري النشر...':'🚀 انشر الطلب الآن'}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
