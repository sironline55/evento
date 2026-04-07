'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

const C = {
  navy:'#1E0A3C', orange:'#F05537', text:'#39364F',
  muted:'#6F7287', border:'#DBDAE3', bg:'#FAFAFA', card:'#FFFFFF'
}

const CATEGORIES = [
  'مهرجانات وترفيه', 'تعليم وتطوير', 'أعمال وشبكات',
  'صحة ورياضة', 'فنون وثقافة', 'تقنية', 'اجتماعي وخيري',
  'ديني', 'رياضة', 'سياحة وسفر',
]

const fieldStyle = {
  width:'100%', padding:'10px 14px', border:`1px solid ${C.border}`,
  borderRadius:6, fontSize:14, outline:'none', fontFamily:'inherit',
  color:C.text, background:C.bg, boxSizing:'border-box' as const
}

const labelStyle = { fontSize:13, fontWeight:600, color:C.navy, marginBottom:6, display:'block' as const }

export default function EditEventPage() {
  const { id } = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState<any>({
    title:'', description:'', location:'',
    start_date:'', end_date:'', capacity:'',
    category:'', subcategory:'', is_recurring:false,
    status:'draft', is_public:true, cover_image:'',
    event_url:'', location_type:'venue'
  })

  useEffect(() => {
    if (!id) return
    sb.from('events').select('*').eq('id', id).single().then(({ data }) => {
      if (data) {
        setForm({
          title: data.title || '',
          description: data.description || '',
          location: data.location || '',
          start_date: data.start_date ? data.start_date.slice(0,16) : '',
          end_date: data.end_date ? data.end_date.slice(0,16) : '',
          capacity: data.capacity || '',
          category: data.category || '',
          subcategory: data.subcategory || '',
          is_recurring: data.is_recurring || false,
          status: data.status || 'draft',
          is_public: data.is_public !== false,
          cover_image: data.cover_image || '',
          event_url: data.event_url || '',
          location_type: data.location_type || 'venue'
        })
      }
      setLoading(false)
    })
  }, [id])

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }))

  async function save(publish = false) {
    setSaving(true)
    const payload: any = {
      ...form,
      capacity: form.capacity ? Number(form.capacity) : null,
      updated_at: new Date().toISOString(),
    }
    if (publish) payload.status = 'published'
    const { error } = await sb.from('events').update(payload).eq('id', id)
    setSaving(false)
    if (!error) {
      setSaved(true)
      setTimeout(() => { setSaved(false); router.push(`/events/${id}`) }, 1200)
    }
  }

  if (loading) return <div style={{ padding:40, textAlign:'center', color:C.muted }}>جاري التحميل...</div>

  return (
    <div style={{ minHeight:'100vh', background:C.bg, direction:'rtl' }}>
      {/* Header */}
      <div style={{ background:C.card, borderBottom:`1px solid ${C.border}`, padding:'12px 32px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <Link href={`/events/${id}`} style={{ color:C.muted, textDecoration:'none', fontSize:13 }}>← العودة للفعالية</Link>
          <span style={{ color:C.border }}>/</span>
          <span style={{ fontSize:14, fontWeight:700, color:C.navy }}>تعديل الفعالية</span>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={() => save(false)} disabled={saving} style={{ padding:'9px 18px', border:`1px solid ${C.border}`, borderRadius:6, background:C.card, color:C.text, fontWeight:600, fontSize:13, cursor:'pointer' }}>
            {saving ? '...' : saved ? '✓ تم' : '💾 حفظ كمسودة'}
          </button>
          <button onClick={() => save(true)} disabled={saving} style={{ padding:'9px 18px', border:'none', borderRadius:6, background:C.orange, color:'#fff', fontWeight:700, fontSize:13, cursor:'pointer' }}>
            {saving ? '...' : '🚀 حفظ ونشر'}
          </button>
        </div>
      </div>

      <div style={{ maxWidth:700, margin:'24px auto', padding:'0 16px' }}>
        {/* Basic Info */}
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:8, padding:24, marginBottom:16 }}>
          <h2 style={{ fontSize:15, fontWeight:700, color:C.navy, margin:'0 0 18px' }}>📋 المعلومات الأساسية</h2>

          <div style={{ marginBottom:16 }}>
            <label style={labelStyle}>عنوان الفعالية *</label>
            <input value={form.title} onChange={e=>set('title',e.target.value)} style={fieldStyle} placeholder="اسم الفعالية..."/>
          </div>

          <div style={{ marginBottom:16 }}>
            <label style={labelStyle}>الوصف</label>
            <textarea value={form.description} onChange={e=>set('description',e.target.value)} rows={4}
              style={{ ...fieldStyle, resize:'vertical' }} placeholder="نبذة عن الفعالية..."/>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:16 }}>
            <div>
              <label style={labelStyle}>التصنيف</label>
              <select value={form.category} onChange={e=>set('category',e.target.value)} style={fieldStyle}>
                <option value="">اختر تصنيفاً</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>التصنيف الفرعي</label>
              <input value={form.subcategory} onChange={e=>set('subcategory',e.target.value)} style={fieldStyle} placeholder="تصنيف فرعي..."/>
            </div>
          </div>

          <div>
            <label style={labelStyle}>صورة الغلاف (رابط)</label>
            <input value={form.cover_image} onChange={e=>set('cover_image',e.target.value)} style={fieldStyle} placeholder="https://..."/>
            {form.cover_image && (
              <img src={form.cover_image} alt="" style={{ width:'100%', height:140, objectFit:'cover', borderRadius:6, marginTop:8 }} onError={e=>(e.currentTarget.style.display='none')}/>
            )}
          </div>
        </div>

        {/* Date & Location */}
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:8, padding:24, marginBottom:16 }}>
          <h2 style={{ fontSize:15, fontWeight:700, color:C.navy, margin:'0 0 18px' }}>📅 التاريخ والموقع</h2>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:16 }}>
            <div>
              <label style={labelStyle}>تاريخ البداية *</label>
              <input type="datetime-local" value={form.start_date} onChange={e=>set('start_date',e.target.value)} style={fieldStyle}/>
            </div>
            <div>
              <label style={labelStyle}>تاريخ النهاية</label>
              <input type="datetime-local" value={form.end_date} onChange={e=>set('end_date',e.target.value)} style={fieldStyle}/>
            </div>
          </div>

          <div style={{ marginBottom:16 }}>
            <label style={labelStyle}>نوع الموقع</label>
            <div style={{ display:'flex', gap:10 }}>
              {[['venue','📍 قاعة / مكان'],['online','💻 عبر الإنترنت'],['tba','❓ سيُحدد لاحقاً']].map(([v,l])=>(
                <button key={v} onClick={()=>set('location_type',v)} style={{ flex:1, padding:'9px', border:`2px solid ${form.location_type===v?C.orange:C.border}`, borderRadius:6, background:form.location_type===v?'#FEF0ED':C.card, color:form.location_type===v?C.orange:C.text, fontWeight:600, fontSize:12, cursor:'pointer' }}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          {form.location_type === 'venue' && (
            <div>
              <label style={labelStyle}>العنوان</label>
              <input value={form.location} onChange={e=>set('location',e.target.value)} style={fieldStyle} placeholder="المدينة، الحي، اسم المكان..."/>
            </div>
          )}

          {form.location_type === 'online' && (
            <div>
              <label style={labelStyle}>رابط البث</label>
              <input value={form.event_url} onChange={e=>set('event_url',e.target.value)} style={fieldStyle} placeholder="https://zoom.us/..."/>
            </div>
          )}
        </div>

        {/* Capacity & Settings */}
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:8, padding:24, marginBottom:16 }}>
          <h2 style={{ fontSize:15, fontWeight:700, color:C.navy, margin:'0 0 18px' }}>⚙️ إعدادات الفعالية</h2>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:16 }}>
            <div>
              <label style={labelStyle}>الطاقة الاستيعابية</label>
              <input type="number" value={form.capacity} onChange={e=>set('capacity',e.target.value)} style={fieldStyle} placeholder="0 = غير محدود"/>
            </div>
            <div>
              <label style={labelStyle}>الحالة</label>
              <select value={form.status} onChange={e=>set('status',e.target.value)} style={fieldStyle}>
                <option value="draft">مسودة</option>
                <option value="published">منشور</option>
                <option value="completed">مكتمل</option>
                <option value="cancelled">ملغي</option>
              </select>
            </div>
          </div>

          <div style={{ display:'flex', gap:10 }}>
            <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', padding:'10px 14px', border:`1px solid ${C.border}`, borderRadius:6, flex:1 }}>
              <input type="checkbox" checked={form.is_public} onChange={e=>set('is_public',e.target.checked)} style={{ width:16, height:16, accentColor:C.orange }}/>
              <span style={{ fontSize:13, fontWeight:600, color:C.text }}>🌐 فعالية عامة (مرئية للعموم)</span>
            </label>
            <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', padding:'10px 14px', border:`1px solid ${C.border}`, borderRadius:6, flex:1 }}>
              <input type="checkbox" checked={form.is_recurring} onChange={e=>set('is_recurring',e.target.checked)} style={{ width:16, height:16, accentColor:C.orange }}/>
              <span style={{ fontSize:13, fontWeight:600, color:C.text }}>🔄 فعالية متكررة</span>
            </label>
          </div>
        </div>

        {/* Save buttons */}
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={() => save(false)} disabled={saving} style={{ flex:1, padding:'13px', border:`1px solid ${C.border}`, borderRadius:8, background:C.card, color:C.text, fontWeight:700, fontSize:14, cursor:'pointer' }}>
            💾 حفظ كمسودة
          </button>
          <button onClick={() => save(true)} disabled={saving} style={{ flex:2, padding:'13px', border:'none', borderRadius:8, background:C.orange, color:'#fff', fontWeight:800, fontSize:14, cursor:'pointer' }}>
            🚀 حفظ ونشر الفعالية
          </button>
        </div>
      </div>
    </div>
  )
}
