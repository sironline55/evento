'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState, useMemo } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter, useSearchParams } from 'next/navigation'

const C = { navy:'#1E0A3C', orange:'#F05537', text:'#39364F', muted:'#6F7287', border:'#DBDAE3', bg:'#FAFAFA', card:'#FFF', green:'#3A7D0A' }
const inp: React.CSSProperties = { width:'100%', padding:'11px 14px', border:`1px solid ${C.border}`, borderRadius:8, fontSize:14, outline:'none', fontFamily:'inherit', color:C.text, background:C.card, boxSizing:'border-box' }
const lbl: React.CSSProperties = { fontSize:12, fontWeight:700, color:C.text, display:'block', marginBottom:6 }

const EVENT_TYPES = ['حفلة موسيقية','مؤتمر','معرض','فعالية رياضية','رحلة سياحية','حفل زفاف','مهرجان','ورشة عمل','إطلاق منتج','أخرى']
const CONTENT_TYPES = ['ريلز','ستوري','فيديو طويل','منشور','بث مباشر','تغريدة']
const PLATFORMS = ['تيك توك','إنستغرام','سناب شات','يوتيوب','تويتر']
const INFLUENCERS_COUNT = [1, 2, 3, 4, 5]

export default function NewBriefPage() {
  const sb = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), [])
  const router = useRouter()
  const searchParams = useSearchParams()
  const [org, setOrg] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [step, setStep] = useState(1)

  const [form, setForm] = useState({
    title: '', description: '',
    event_date: '', event_location: '', event_type: '',
    content_types_needed: [] as string[],
    required_platforms: [] as string[],
    budget_min: '', budget_max: '',
    influencers_needed: 1,
    min_followers: '',
    specializations_needed: [] as string[],
    proposal_deadline: '',
  })

  const set = (k: string, v: any) => setForm(f => ({...f, [k]:v}))
  const toggle = (k: string, v: string) => setForm(f => {
    const arr: string[] = f[k as keyof typeof f] as string[]
    return {...f, [k]: arr.includes(v) ? arr.filter(x=>x!==v) : [...arr, v]}
  })

  useEffect(() => {
    sb.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push('/login'); return }
      const { data: ownedOrgs } = await sb.from('organizations').select('*').eq('owner_id', data.user.id).limit(1)
      if (ownedOrgs?.[0]) setOrg(ownedOrgs[0])
    })
  }, [])

  async function submit() {
    if (!org || !form.title || !form.description) return
    setSaving(true)
    const { data: { user } } = await sb.auth.getUser()
    const { error } = await sb.from('campaign_briefs').insert({
      org_id: org.id,
      created_by: user?.id,
      title: form.title,
      description: form.description,
      event_date: form.event_date || null,
      event_location: form.event_location || null,
      event_type: form.event_type || null,
      content_types_needed: form.content_types_needed,
      required_platforms: form.required_platforms,
      budget_min: form.budget_min ? parseFloat(form.budget_min) : null,
      budget_max: form.budget_max ? parseFloat(form.budget_max) : null,
      influencers_needed: form.influencers_needed,
      min_followers: form.min_followers ? parseInt(form.min_followers) : 0,
      specializations_needed: form.specializations_needed,
      proposal_deadline: form.proposal_deadline ? new Date(form.proposal_deadline).toISOString() : null,
      status: 'open',
    })
    setSaving(false)
    if (!error) router.push('/dashboard/briefs')
    else alert('خطأ: ' + error.message)
  }

  const STEPS = ['تفاصيل الفعالية', 'المتطلبات', 'الميزانية والنشر']
  const isStep1Valid = form.title && form.description && form.event_type
  const isStep2Valid = form.content_types_needed.length > 0 && form.influencers_needed >= 1

  return (
    <div style={{ minHeight:'100vh', background:C.bg, direction:'rtl', padding:'28px 24px' }}>
      <div style={{ maxWidth:680, margin:'0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom:24 }}>
          <a href="/dashboard/briefs" style={{ color:C.muted, fontSize:13, textDecoration:'none' }}>← الرجوع للبريفات</a>
          <h1 style={{ fontSize:24, fontWeight:800, color:C.navy, margin:'8px 0 4px' }}>📋 نشر بريف حملة مؤثر</h1>
          <p style={{ color:C.muted, fontSize:13 }}>اكتب تفاصيل احتياجك وسيتقدم المؤثرون المناسبون بعروضهم</p>
        </div>

        {/* Steps indicator */}
        <div style={{ display:'flex', gap:0, marginBottom:28 }}>
          {STEPS.map((s, i) => (
            <div key={i} style={{ flex:1, display:'flex', alignItems:'center' }}>
              <div style={{ display:'flex', alignItems:'center', flex:1 }}>
                <div style={{
                  width:30, height:30, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center',
                  background: step > i+1 ? C.green : step === i+1 ? C.orange : C.border,
                  color: step > i+1 || step === i+1 ? '#fff' : C.muted,
                  fontWeight:800, fontSize:13, flexShrink:0
                }}>{step > i+1 ? '✓' : i+1}</div>
                <span style={{ fontSize:12, color: step===i+1 ? C.navy : C.muted, fontWeight: step===i+1 ? 700 : 400, marginRight:8, whiteSpace:'nowrap' }}>{s}</span>
                {i < STEPS.length-1 && <div style={{ flex:1, height:2, background: step > i+1 ? C.green : C.border, margin:'0 8px' }}/>}
              </div>
            </div>
          ))}
        </div>

        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:28 }}>

          {/* Step 1 */}
          {step===1 && (
            <div style={{ display:'grid', gap:16 }}>
              <h3 style={{ fontSize:16, fontWeight:800, color:C.navy, margin:0 }}>تفاصيل الفعالية</h3>
              <div>
                <label style={lbl}>عنوان البريف *</label>
                <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="مثال: نحتاج مؤثر لتغطية حفلة موسيقية في الرياض" style={inp}/>
              </div>
              <div>
                <label style={lbl}>وصف الحملة * <span style={{ color:C.muted, fontWeight:400 }}>(كن دقيقاً)</span></label>
                <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={4} placeholder="اشرح ما تريده بالضبط: نوع المحتوى، الجمهور المستهدف، الأهداف المتوقعة..." style={{...inp, resize:'vertical'}}/>
              </div>
              <div>
                <label style={lbl}>نوع الفعالية *</label>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  {EVENT_TYPES.map(t => (
                    <button key={t} onClick={() => set('event_type', t)} style={{
                      padding:'7px 14px', borderRadius:20, cursor:'pointer', fontFamily:'inherit', fontSize:12, fontWeight:600,
                      border: form.event_type===t ? `2px solid ${C.orange}` : `1px solid ${C.border}`,
                      background: form.event_type===t ? '#FEF0ED' : C.card, color: form.event_type===t ? C.orange : C.text
                    }}>{t}</button>
                  ))}
                </div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div>
                  <label style={lbl}>تاريخ الفعالية</label>
                  <input type="date" value={form.event_date} onChange={e => set('event_date', e.target.value)} style={inp}/>
                </div>
                <div>
                  <label style={lbl}>موقع الفعالية</label>
                  <input value={form.event_location} onChange={e => set('event_location', e.target.value)} placeholder="مثال: الرياض، قاعة X" style={inp}/>
                </div>
              </div>
              <button onClick={() => setStep(2)} disabled={!isStep1Valid} style={{ padding:'12px', background: isStep1Valid ? C.orange : '#DBDAE3', border:'none', borderRadius:10, color:'#fff', fontWeight:800, fontSize:14, cursor: isStep1Valid ? 'pointer' : 'not-allowed', fontFamily:'inherit' }}>
                التالي: المتطلبات ←
              </button>
            </div>
          )}

          {/* Step 2 */}
          {step===2 && (
            <div style={{ display:'grid', gap:16 }}>
              <h3 style={{ fontSize:16, fontWeight:800, color:C.navy, margin:0 }}>متطلبات المؤثر</h3>
              <div>
                <label style={lbl}>أنواع المحتوى المطلوبة *</label>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  {CONTENT_TYPES.map(t => (
                    <button key={t} onClick={() => toggle('content_types_needed', t)} style={{
                      padding:'7px 14px', borderRadius:20, cursor:'pointer', fontFamily:'inherit', fontSize:12, fontWeight:600,
                      border: form.content_types_needed.includes(t) ? `2px solid ${C.orange}` : `1px solid ${C.border}`,
                      background: form.content_types_needed.includes(t) ? '#FEF0ED' : C.card,
                      color: form.content_types_needed.includes(t) ? C.orange : C.text
                    }}>{t}</button>
                  ))}
                </div>
              </div>
              <div>
                <label style={lbl}>المنصات المطلوبة</label>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  {PLATFORMS.map(p => (
                    <button key={p} onClick={() => toggle('required_platforms', p)} style={{
                      padding:'7px 14px', borderRadius:20, cursor:'pointer', fontFamily:'inherit', fontSize:12, fontWeight:600,
                      border: form.required_platforms.includes(p) ? `2px solid ${C.navy}` : `1px solid ${C.border}`,
                      background: form.required_platforms.includes(p) ? '#E8E4F0' : C.card,
                      color: form.required_platforms.includes(p) ? C.navy : C.text
                    }}>{p}</button>
                  ))}
                </div>
              </div>
              <div>
                <label style={lbl}>عدد المؤثرين المطلوبين *</label>
                <div style={{ display:'flex', gap:10 }}>
                  {INFLUENCERS_COUNT.map(n => (
                    <button key={n} onClick={() => set('influencers_needed', n)} style={{
                      width:48, height:48, borderRadius:10, cursor:'pointer', fontFamily:'inherit', fontSize:16, fontWeight:800,
                      border: form.influencers_needed===n ? `2px solid ${C.orange}` : `1px solid ${C.border}`,
                      background: form.influencers_needed===n ? '#FEF0ED' : C.card,
                      color: form.influencers_needed===n ? C.orange : C.text
                    }}>{n}</button>
                  ))}
                </div>
                <p style={{ fontSize:11, color:C.muted, margin:'6px 0 0' }}>سيتقدم عدة مؤثرين وأنت تختار الأنسب</p>
              </div>
              <div>
                <label style={lbl}>الحد الأدنى للمتابعين</label>
                <input type="number" value={form.min_followers} onChange={e => set('min_followers', e.target.value)} placeholder="مثال: 50000" style={inp}/>
              </div>
              <div style={{ display:'flex', gap:10 }}>
                <button onClick={() => setStep(1)} style={{ flex:1, padding:'11px', border:`1px solid ${C.border}`, borderRadius:10, background:'none', color:C.text, fontWeight:600, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>← السابق</button>
                <button onClick={() => setStep(3)} disabled={!isStep2Valid} style={{ flex:2, padding:'12px', background: isStep2Valid ? C.orange : '#DBDAE3', border:'none', borderRadius:10, color:'#fff', fontWeight:800, fontSize:14, cursor: isStep2Valid ? 'pointer' : 'not-allowed', fontFamily:'inherit' }}>
                  التالي: الميزانية ←
                </button>
              </div>
            </div>
          )}

          {/* Step 3 */}
          {step===3 && (
            <div style={{ display:'grid', gap:16 }}>
              <h3 style={{ fontSize:16, fontWeight:800, color:C.navy, margin:0 }}>الميزانية والنشر</h3>
              <div>
                <label style={lbl}>نطاق الميزانية المتوقعة (ريال)</label>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                  <div>
                    <input type="number" value={form.budget_min} onChange={e => set('budget_min', e.target.value)} placeholder="الحد الأدنى" style={inp}/>
                  </div>
                  <div>
                    <input type="number" value={form.budget_max} onChange={e => set('budget_max', e.target.value)} placeholder="الحد الأقصى" style={inp}/>
                  </div>
                </div>
                <p style={{ fontSize:11, color:C.muted, margin:'5px 0 0' }}>تحديد الميزانية يساعد المؤثرين على تقديم عروض مناسبة</p>
              </div>
              <div>
                <label style={lbl}>آخر موعد للتقدم</label>
                <input type="datetime-local" value={form.proposal_deadline} onChange={e => set('proposal_deadline', e.target.value)} style={inp}/>
              </div>

              {/* Summary */}
              <div style={{ background:'#F8F7FA', borderRadius:10, padding:16 }}>
                <p style={{ fontSize:13, fontWeight:700, color:C.navy, margin:'0 0 10px' }}>ملخص البريف</p>
                <div style={{ display:'grid', gap:6 }}>
                  {[
                    ['العنوان', form.title],
                    ['نوع الفعالية', form.event_type],
                    ['المحتوى المطلوب', form.content_types_needed.join('، ')],
                    ['عدد المؤثرين', form.influencers_needed + ' مؤثر'],
                    ['الميزانية', form.budget_min && form.budget_max ? `${parseInt(form.budget_min).toLocaleString()} - ${parseInt(form.budget_max).toLocaleString()} ريال` : 'مفتوحة'],
                  ].filter(([,v]) => v).map(([l,v]) => (
                    <div key={l} style={{ display:'flex', justifyContent:'space-between', fontSize:12 }}>
                      <span style={{ color:C.muted }}>{l}</span>
                      <span style={{ color:C.text, fontWeight:600 }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ background:'#EAF7E0', border:'1px solid #C3E6C3', borderRadius:10, padding:12 }}>
                <p style={{ fontSize:12, color:'#1A5A00', margin:0, fontWeight:600 }}>
                  🔒 المبلغ المتفق عليه سيُحفظ بضمان المنصة ولن يُحوَّل للمؤثر إلا بعد موافقتك على التسليم
                </p>
              </div>

              <div style={{ display:'flex', gap:10 }}>
                <button onClick={() => setStep(2)} style={{ flex:1, padding:'11px', border:`1px solid ${C.border}`, borderRadius:10, background:'none', color:C.text, fontWeight:600, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>← السابق</button>
                <button onClick={submit} disabled={saving} style={{ flex:2, padding:'12px', background:C.orange, border:'none', borderRadius:10, color:'#fff', fontWeight:800, fontSize:14, cursor: saving ? 'wait' : 'pointer', fontFamily:'inherit' }}>
                  {saving ? '⏳ جاري النشر...' : '🚀 نشر البريف'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
