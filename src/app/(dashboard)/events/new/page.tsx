'use client'
import { useState, useRef } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const sb = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const C = {
  navy: '#1E0A3C', orange: '#F05537', text: '#39364F',
  muted: '#6F7287', border: '#DBDAE3', bg: '#FAFAFA',
  card: '#FFFFFF', green: '#3A7D0A',
}

const STEPS = [
  { id: 1, label: 'بناء الصفحة',   desc: 'تفاصيل الفعالية' },
  { id: 2, label: 'التذاكر',        desc: 'أسعار وكميات' },
  { id: 3, label: 'النشر',          desc: 'راجع وانشر' },
]

const CATEGORIES: Record<string, string[]> = {
  'مؤتمر وندوة':    ['تكنولوجيا','طب وصحة','أعمال','تعليم','حكومي','أخرى'],
  'مهرجان وحفل':    ['موسيقى','فنون','طعام وشراب','ثقافة','أخرى'],
  'معرض وملتقى':    ['تجاري','فني','علمي','أخرى'],
  'دورة تدريبية':   ['تطوير مهني','تكنولوجيا','قيادة','لغات','أخرى'],
  'ورشة عمل':       ['فن','تصميم','تقنية','أعمال','أخرى'],
  'رياضة ونشاط':    ['كرة قدم','ركض','سباحة','رياضات جماعية','أخرى'],
  'فن وثقافة':      ['مسرح','سينما','معرض فني','أخرى'],
  'أعمال وتجارة':   ['تواصل مهني','استثمار','ريادة أعمال','أخرى'],
  'طعام وشراب':     ['مطاعم','طبخ','قهوة','أخرى'],
  'أخرى':           ['عام'],
}

const RECURRENCE_OPTIONS = [
  { value: 'daily',   label: 'يومياً' },
  { value: 'weekly',  label: 'أسبوعياً' },
  { value: 'monthly', label: 'شهرياً' },
  { value: 'custom',  label: 'مخصص' },
]

const DAYS_AR = ['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت']

type Ticket = {
  id: number; name: string; type: 'free'|'paid'|'donation'
  price: string; qty: string; desc: string
  saleStart: string; saleEnd: string
}
type Faq    = { q: string; a: string }
type Preview = 'mobile'|'desktop'

// ─── PREVIEW ──────────────────────────────────────────────────────
function EventPreview({ title, category, subcategory, startDate, startTime, endTime,
  locationType, location, onlineUrl, description, highlights, ageInfo, doorTime,
  parking, tickets, imagePreview, mode }: {
  title: string; category: string; subcategory: string
  startDate: string; startTime: string; endTime: string
  locationType: string; location: string; onlineUrl: string
  description: string; highlights: string; ageInfo: string
  doorTime: string; parking: string; tickets: Ticket[]
  imagePreview: string|null; mode: Preview
}) {
  const isMobile = mode === 'mobile'
  const dateStr = startDate
    ? new Date(`${startDate}T${startTime}`).toLocaleDateString('ar-SA', { weekday:'long', year:'numeric', month:'long', day:'numeric' })
    : null
  const locStr  = locationType === 'online' ? (onlineUrl || 'رابط البث سيُرسل عند التسجيل') : location || 'مكان الفعالية'
  const minPrice = tickets.filter(t => t.type === 'paid' && t.price).map(t => parseFloat(t.price)).sort((a,b)=>a-b)[0]
  const priceLabel = minPrice ? `من ${minPrice} ر.س` : 'مجاني'
  const goods = [
    ageInfo    && { icon:'🎂', text: ageInfo },
    doorTime   && { icon:'🚪', text: doorTime },
    parking    && { icon:'🅿️', text: parking },
    highlights && { icon:'✨', text: highlights },
    startDate  && { icon:'⏱️', text: `${startTime} — ${endTime}` },
    locationType !== 'online' && { icon:'📍', text:'حضوري' },
  ].filter(Boolean) as { icon:string; text:string }[]

  return (
    <div style={{
      width: isMobile ? 320 : '100%', margin: '0 auto', direction: 'rtl',
      background: '#F0F3F7', borderRadius: isMobile ? 24 : 12,
      border: isMobile ? '8px solid #1C1C2E' : `1px solid ${C.border}`,
      boxShadow: isMobile ? '0 16px 48px rgba(0,0,0,0.2)' : '0 4px 16px rgba(0,0,0,0.07)',
      maxHeight: isMobile ? 620 : 680, overflowY: 'auto', fontFamily:'inherit'
    }}>
      {/* Nav */}
      <div style={{ background: C.card, padding:'10px 14px', display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:`1px solid ${C.border}` }}>
        <span style={{ fontSize:20, color:C.orange }}>🎪</span>
        <div style={{ display:'flex', gap:10 }}>
          <span style={{ color:'#3D7FE8', fontSize:17 }}>↑</span>
          <span style={{ color:C.muted, fontSize:17 }}>♡</span>
        </div>
      </div>
      {/* Banner */}
      <div style={{ height: isMobile ? 160 : 200, background: imagePreview ? 'transparent' : 'linear-gradient(135deg,#E8E0F0,#D0C8E8)', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden' }}>
        {imagePreview
          ? <img src={imagePreview} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
          : <span style={{ fontSize:40 }}>🖼️</span>}
      </div>
      <div style={{ padding:'16px 16px 0', background: C.card }}>
        <h2 style={{ fontSize: isMobile ? 18 : 24, fontWeight:800, color:C.navy, margin:'0 0 10px', lineHeight:1.25 }}>
          {title || 'عنوان الفعالية'}
        </h2>
        {/* Organizer */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ width:28, height:28, borderRadius:'50%', background:C.navy, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:12 }}>👤</div>
            <span style={{ fontSize:12, color:C.text }}><span style={{ color:C.muted }}>بواسطة </span><strong>اسم المنظم</strong></span>
          </div>
          <button style={{ padding:'4px 12px', border:`1px solid ${C.border}`, borderRadius:6, background:C.card, fontSize:11, fontWeight:600, cursor:'pointer' }}>متابعة</button>
        </div>
        {/* Info chips */}
        <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:14 }}>
          {locStr && <div style={{ display:'flex', gap:7, alignItems:'center' }}><span style={{ fontSize:14 }}>📍</span><span style={{ fontSize:12, color:C.muted }}>{locStr}</span></div>}
          {dateStr && <div style={{ display:'flex', gap:7, alignItems:'center' }}><span style={{ fontSize:14 }}>📅</span><span style={{ fontSize:12, color:C.muted }}>{dateStr} · {startTime}–{endTime}</span></div>}
          {category && <div style={{ fontSize:11, color:C.muted }}>التصنيف: {category}{subcategory ? ` ← ${subcategory}` : ''}</div>}
        </div>
        {/* Overview */}
        <div style={{ borderTop:`1px solid ${C.border}`, paddingTop:12, marginBottom:12 }}>
          <h3 style={{ fontSize:15, fontWeight:700, color:C.navy, margin:'0 0 8px' }}>نبذة</h3>
          <p style={{ fontSize:12, color:C.text, lineHeight:1.6, margin:0 }}>
            {description || 'لا يوجد وصف بعد — أضف وصفاً لفعالتك.'}
          </p>
        </div>
        {/* Good to Know */}
        {goods.length > 0 && (
          <div style={{ borderTop:`1px solid ${C.border}`, paddingTop:12, marginBottom:12 }}>
            <h3 style={{ fontSize:15, fontWeight:700, color:C.navy, margin:'0 0 10px' }}>معلومات مهمة</h3>
            <div style={{ background:'#F8F7FA', borderRadius:8, padding:'12px 14px', border:`1px solid ${C.border}` }}>
              <p style={{ fontSize:12, fontWeight:700, color:C.navy, margin:'0 0 8px' }}>أبرز ما في الفعالية</p>
              {goods.map((g,i) => (
                <div key={i} style={{ display:'flex', gap:7, alignItems:'center', marginBottom:5 }}>
                  <span style={{ fontSize:14 }}>{g.icon}</span>
                  <span style={{ fontSize:12, color:C.text }}>{g.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* Organized by */}
        <div style={{ borderTop:`1px solid ${C.border}`, paddingTop:12, paddingBottom:70 }}>
          <h3 style={{ fontSize:15, fontWeight:700, color:C.navy, margin:'0 0 10px' }}>المنظِّم</h3>
          <div style={{ background:'#F8F7FA', borderRadius:10, padding:'14px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
              <div style={{ width:48, height:48, borderRadius:'50%', background:C.navy, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:20 }}>👤</div>
              <div>
                <p style={{ fontWeight:700, color:C.navy, margin:'0 0 4px', fontSize:14 }}>اسم المنظم</p>
                <div style={{ display:'flex', gap:14 }}>
                  {['المتابعون','الفعاليات','يستضيف'].map(l => (
                    <div key={l} style={{ textAlign:'center' }}>
                      <p style={{ fontSize:10, color:C.muted, margin:0 }}>{l}</p>
                      <p style={{ fontSize:11, fontWeight:700, margin:0 }}>—</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:7 }}>
              <button style={{ padding:'8px', border:`1px solid ${C.border}`, borderRadius:7, background:C.card, fontWeight:600, fontSize:12, cursor:'pointer' }}>تواصل</button>
              <button style={{ padding:'8px', border:'none', borderRadius:7, background:C.orange, color:'#fff', fontWeight:700, fontSize:12, cursor:'pointer' }}>متابعة</button>
            </div>
          </div>
        </div>
      </div>
      {/* Bottom */}
      <div style={{ position:'sticky', bottom:0, background:C.card, borderTop:`1px solid ${C.border}`, padding:'10px 16px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div>
          <p style={{ fontWeight:700, color:C.navy, margin:0, fontSize:14 }}>{priceLabel}</p>
          {dateStr && <p style={{ fontSize:10, color:C.muted, margin:'1px 0 0' }}>{dateStr}</p>}
        </div>
        <button disabled style={{ padding:'9px 16px', border:'none', borderRadius:7, background:'#D9D9D9', color:'#9E9E9E', fontWeight:700, fontSize:13, cursor:'not-allowed' }}>
          احجز تذكرة
        </button>
      </div>
    </div>
  )
}

// ─── MAIN PAGE ─────────────────────────────────────────────────────
export default function NewEventPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [step, setStep]           = useState(1)
  const [saving, setSaving]       = useState(false)
  const [saved, setSaved]         = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [previewMode, setPreviewMode] = useState<Preview>('mobile')

  // Image
  const [imageFile, setImageFile]       = useState<File|null>(null)
  const [imagePreview, setImagePreview] = useState<string|null>(null)
  const [imageUploading, setImageUploading] = useState(false)

  // Step 1
  const [title, setTitle]         = useState('')
  const [summary, setSummary]     = useState('')
  const [category, setCategory]   = useState('')
  const [subcategory, setSub]     = useState('')
  const [eventType, setEvType]    = useState<'single'|'recurring'>('single')
  const [recurrence, setRec]      = useState('weekly')
  const [recDays, setRecDays]     = useState<number[]>([])
  const [recEndDate, setRecEnd]   = useState('')
  const [startDate, setStartDate] = useState('')
  const [startTime, setStartTime] = useState('10:00')
  const [endDate, setEndDate]     = useState('')
  const [endTime, setEndTime]     = useState('12:00')
  const [locType, setLocType]     = useState<'venue'|'online'|'tba'>('venue')
  const [location, setLocation]   = useState('')
  const [onlineUrl, setOnlineUrl] = useState('')
  const [capacity, setCapacity]   = useState('')
  const [description, setDesc]    = useState('')
  const [highlights, setHL]       = useState('')
  const [ageInfo, setAge]         = useState('')
  const [doorTime, setDoor]       = useState('')
  const [parking, setPark]        = useState('')
  const [faqs, setFaqs]           = useState<Faq[]>([])
  const [showFaqTip, setFaqTip]   = useState(true)

  // Step 2
  const [tickets, setTickets] = useState<Ticket[]>([
    { id:1, name:'تذكرة عامة', type:'free', price:'', qty:'100', desc:'', saleStart:'', saleEnd:'' }
  ])

  // Step 3
  const [visibility, setVis]   = useState<'public'|'private'>('public')
  const [status, setStatus]    = useState<'draft'|'published'>('draft')

  // ── Image handlers ──
  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = ev => setImagePreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  async function uploadImage(eventId: string): Promise<string|null> {
    if (!imageFile) return null
    setImageUploading(true)
    try {
      const ext  = imageFile.name.split('.').pop()
      const path = `${eventId}/banner.${ext}`
      const { error } = await sb.storage.from('event-images').upload(path, imageFile, { upsert: true })
      if (error) throw error
      const { data } = sb.storage.from('event-images').getPublicUrl(path)
      return data.publicUrl
    } catch (e) {
      console.error(e)
      return null
    } finally {
      setImageUploading(false)
    }
  }

  // ── Ticket helpers ──
  function addTicket() {
    setTickets(t => [...t, { id:Date.now(), name:'', type:'free', price:'', qty:'', desc:'', saleStart:'', saleEnd:'' }])
  }
  function updateTicket(id:number, field:keyof Ticket, val:string) {
    setTickets(t => t.map(tk => tk.id===id ? {...tk,[field]:val} : tk))
  }
  function removeTicket(id:number) { setTickets(t => t.filter(tk=>tk.id!==id)) }

  // ── FAQ helpers ──
  function addFaq()  { setFaqs(f => [...f, { q:'', a:'' }]) }
  function updateFaq(i:number, field:'q'|'a', val:string) {
    setFaqs(f => f.map((faq,idx) => idx===i ? {...faq,[field]:val} : faq))
  }
  function removeFaq(i:number) { setFaqs(f => f.filter((_,idx)=>idx!==i)) }

  // ── Recurrence days ──
  function toggleDay(d:number) {
    setRecDays(prev => prev.includes(d) ? prev.filter(x=>x!==d) : [...prev,d])
  }

  // ── Publish ──
  async function publish() {
    if (!title.trim()) { alert('يرجى إدخال اسم الفعالية'); setStep(1); return }
    if (!startDate)    { alert('يرجى تحديد تاريخ البداية'); setStep(1); return }
    setSaving(true)
    try {
      const { data:{ user } } = await sb.auth.getUser()
      const startDT = `${startDate}T${startTime}:00`
      const endDT   = endDate ? `${endDate}T${endTime}:00` : null

      // Build recurrence rule
      let rrule = null
      if (eventType === 'recurring') {
        rrule = `FREQ=${recurrence.toUpperCase()}`
        if (recDays.length) rrule += `;BYDAY=${recDays.map(d=>['SU','MO','TU','WE','TH','FR','SA'][d]).join(',')}`
        if (recEndDate) rrule += `;UNTIL=${recEndDate.replace(/-/g,'')}T000000Z`
      }

      // Insert event
      const { data:ev, error } = await sb.from('events').insert({
        title: title.trim(),
        description: [summary, description].filter(Boolean).join('\n\n'),
        location: locType==='online' ? 'عبر الإنترنت' : locType==='tba' ? 'سيُعلن لاحقاً' : location,
        online_url:       locType==='online' ? onlineUrl : null,
        start_date:       startDT, end_date: endDT,
        capacity:         capacity ? parseInt(capacity) : null,
        status, is_public: visibility==='public',
        created_by:       user?.id,
        category, subcategory,
        event_type:       eventType,
        recurrence_rule:  rrule,
        highlights, age_restriction: ageInfo, door_time: doorTime, parking_info: parking,
      }).select('id').single()
      if (error) throw error

      // Upload image
      if (imageFile) {
        const imageUrl = await uploadImage(ev.id)
        if (imageUrl) await sb.from('events').update({ image_url: imageUrl }).eq('id', ev.id)
      }

      // Insert tickets
      if (tickets.length) {
        const tData = tickets.map((tk, i) => ({
          event_id:   ev.id,
          name:       tk.name || 'تذكرة',
          type:       tk.type,
          price:      tk.type==='paid' ? parseFloat(tk.price)||0 : 0,
          quantity:   tk.qty ? parseInt(tk.qty) : null,
          description: tk.desc || null,
          sale_start: tk.saleStart || null,
          sale_end:   tk.saleEnd   || null,
          sort_order: i,
        }))
        await sb.from('event_tickets').insert(tData)
      }

      setSaved(true)
      setTimeout(() => router.push(`/events/${ev.id}`), 700)
    } catch (e:any) {
      alert('خطأ: ' + e.message)
    } finally { setSaving(false) }
  }

  const inp: React.CSSProperties = {
    width:'100%', padding:'10px 13px',
    border:`1px solid ${C.border}`, borderRadius:8,
    fontSize:14, outline:'none', fontFamily:'inherit',
    color:C.text, background:C.card, boxSizing:'border-box',
  }
  const lbl: React.CSSProperties = { fontSize:12, fontWeight:600, color:C.text, display:'block', marginBottom:5 }
  const card: React.CSSProperties = { background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:'20px', marginBottom:12 }
  const sTitle: React.CSSProperties = { fontSize:16, fontWeight:700, color:C.navy, margin:'0 0 3px' }
  const sDesc:  React.CSSProperties = { fontSize:12, color:C.muted, margin:'0 0 14px' }

  const previewProps = {
    title, category, subcategory, startDate, startTime, endTime,
    locationType:locType, location, onlineUrl, description,
    highlights, ageInfo, doorTime, parking, tickets, imagePreview,
  }

  return (
    <div style={{ minHeight:'100vh', background:C.bg, direction:'rtl' }}>

      {/* ── Top bar ── */}
      <div style={{ background:C.card, borderBottom:`1px solid ${C.border}`, position:'sticky', top:0, zIndex:30 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, height:50, padding:'0 20px', maxWidth:showPreview?1400:820, margin:'0 auto' }}>
          <Link href="/events" style={{ color:C.muted, textDecoration:'none', fontSize:13, fontWeight:500, whiteSpace:'nowrap' }}>← العودة</Link>
          <div style={{ flex:1, textAlign:'center' }}>
            <span style={{ fontSize:13, fontWeight:700, color:C.navy }}>{title||'فعالية بدون عنوان'}</span>
          </div>
          <span style={{ fontSize:10, fontWeight:600, padding:'3px 8px', borderRadius:4, background:'#F8F7FA', color:C.muted }}>مسودة</span>
          <button onClick={() => setShowPreview(p=>!p)} style={{
            display:'flex', alignItems:'center', gap:5, padding:'6px 12px', borderRadius:6,
            border:`1px solid ${showPreview ? C.orange : C.border}`,
            background: showPreview ? '#FEF0ED' : C.card,
            color: showPreview ? C.orange : C.text,
            cursor:'pointer', fontSize:12, fontWeight:600, whiteSpace:'nowrap',
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            {showPreview ? 'إخفاء' : 'معاينة'}
          </button>
        </div>
        {/* Steps */}
        <div style={{ display:'flex', borderTop:`1px solid ${C.border}`, maxWidth:showPreview?1400:820, margin:'0 auto' }}>
          {STEPS.map(s => (
            <button key={s.id} onClick={() => setStep(s.id)} style={{
              flex:1, padding:'7px 8px', background:'none', border:'none', cursor:'pointer', textAlign:'center',
              borderBottom: step===s.id ? `2px solid ${C.orange}` : '2px solid transparent',
              color: step===s.id ? C.orange : step>s.id ? C.green : C.muted, marginBottom:-1,
            }}>
              <div style={{ fontSize:11, fontWeight:700 }}>{step>s.id?'✓ ':''}{s.id}. {s.label}</div>
              <div style={{ fontSize:10, color:C.muted }}>{s.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ display:'flex', gap:22, maxWidth:showPreview?1400:820, margin:'0 auto', padding:'20px 18px 100px', alignItems:'flex-start' }}>

        {/* FORM */}
        <div style={{ flex:1, minWidth:0 }}>

          {/* ══════ STEP 1 ══════ */}
          {step===1 && (
            <>
              {/* Image Upload */}
              <div style={{ ...card, padding:0, overflow:'hidden' }}>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} style={{ display:'none' }} />
                {imagePreview ? (
                  <div style={{ position:'relative' }}>
                    <img src={imagePreview} alt="" style={{ width:'100%', height:200, objectFit:'cover', display:'block' }} />
                    <button onClick={() => { setImageFile(null); setImagePreview(null) }} style={{
                      position:'absolute', top:10, left:10, background:'rgba(0,0,0,0.6)',
                      color:'#fff', border:'none', borderRadius:6, padding:'5px 10px', cursor:'pointer', fontSize:12, fontWeight:600
                    }}>✕ إزالة</button>
                    <button onClick={() => fileInputRef.current?.click()} style={{
                      position:'absolute', top:10, right:10, background:'rgba(0,0,0,0.6)',
                      color:'#fff', border:'none', borderRadius:6, padding:'5px 10px', cursor:'pointer', fontSize:12, fontWeight:600
                    }}>تغيير</button>
                  </div>
                ) : (
                  <div onClick={() => fileInputRef.current?.click()} style={{
                    padding:'40px 20px', textAlign:'center', background:'#F3F0F8',
                    border:'2px dashed #B4A7D6', cursor:'pointer', borderRadius:12,
                  }}>
                    <div style={{ fontSize:28, marginBottom:8 }}>🖼️</div>
                    <p style={{ fontWeight:600, color:C.navy, margin:'0 0 4px', fontSize:14 }}>اضغط لرفع صورة أو فيديو</p>
                    <p style={{ fontSize:11, color:C.muted, margin:0 }}>يُوصى بـ 2160×1080 — JPG, PNG, GIF (حتى 10MB)</p>
                    <p style={{ fontSize:11, color:C.muted, margin:'4px 0 0' }}>💡 الصور ترفع حركة الزيارة للفعالية بنسبة 30%</p>
                  </div>
                )}
              </div>

              {/* Event Details */}
              <div style={card}>
                <p style={sTitle}>تفاصيل الفعالية</p>
                <p style={sDesc}>العنوان والملخص والتصنيف</p>

                <div style={{ marginBottom:12 }}>
                  <label style={lbl}>اسم الفعالية * <span style={{ color:C.muted, fontWeight:400 }}>(حتى 75 حرفاً)</span></label>
                  <input value={title} onChange={e=>setTitle(e.target.value)} maxLength={75}
                    placeholder="اسم واضح يدل على محتوى فعالتك"
                    style={{ ...inp, fontSize:16, fontWeight:600 }} />
                  <div style={{ textAlign:'left', fontSize:10, color:C.muted, marginTop:3 }}>{title.length}/75</div>
                </div>

                <div style={{ marginBottom:12 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:5 }}>
                    <label style={{ ...lbl, marginBottom:0 }}>الملخص <span style={{ color:C.muted, fontWeight:400 }}>(140 حرفاً)</span></label>
                    <button style={{ background:'none', border:`1px solid ${C.border}`, borderRadius:6, padding:'3px 10px', fontSize:11, cursor:'pointer', color:C.muted }}>✨ اقتراح تلقائي</button>
                  </div>
                  <input value={summary} onChange={e=>setSummary(e.target.value.slice(0,140))}
                    placeholder="جملة قصيرة تشجع الزوار على الاهتمام..."
                    style={inp} />
                  <div style={{ textAlign:'left', fontSize:10, color:C.muted, marginTop:3 }}>{summary.length}/140</div>
                </div>

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                  <div>
                    <label style={lbl}>التصنيف الرئيسي</label>
                    <select value={category} onChange={e=>{setCategory(e.target.value); setSub('')}} style={inp}>
                      <option value="">اختر التصنيف</option>
                      {Object.keys(CATEGORIES).map(c=><option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  {category && CATEGORIES[category] && (
                    <div>
                      <label style={lbl}>التصنيف الفرعي</label>
                      <select value={subcategory} onChange={e=>setSub(e.target.value)} style={inp}>
                        <option value="">اختر الفرع</option>
                        {CATEGORIES[category].map(s=><option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  )}
                </div>
              </div>

              {/* Date & Time */}
              <div style={card}>
                <p style={sTitle}>التاريخ والوقت</p>
                <p style={sDesc}>متى ستقام الفعالية؟</p>

                {/* Single / Recurring toggle */}
                <div style={{ display:'flex', gap:8, marginBottom:14 }}>
                  {[['single','📅 فعالية واحدة'],['recurring','🔁 فعالية متكررة']].map(([v,l])=>(
                    <button key={v} onClick={()=>setEvType(v as any)} style={{
                      flex:1, padding:'9px', borderRadius:8, cursor:'pointer', fontWeight:600, fontSize:13,
                      border:`2px solid ${eventType===v ? C.orange : C.border}`,
                      background: eventType===v ? '#FEF0ED' : C.card,
                      color: eventType===v ? C.orange : C.text, transition:'all 0.15s'
                    }}>{l}</button>
                  ))}
                </div>

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:12 }}>
                  {[
                    { label:'تاريخ البداية *', val:startDate, set:setStartDate, type:'date' },
                    { label:'وقت البداية',     val:startTime, set:setStartTime, type:'time' },
                    { label:'تاريخ النهاية',   val:endDate,   set:setEndDate,   type:'date' },
                    { label:'وقت النهاية',     val:endTime,   set:setEndTime,   type:'time' },
                  ].map(({label,val,set,type})=>(
                    <div key={label}>
                      <label style={lbl}>{label}</label>
                      <input type={type} value={val} onChange={e=>set(e.target.value)} style={inp} />
                    </div>
                  ))}
                </div>

                {/* Recurring options */}
                {eventType==='recurring' && (
                  <div style={{ background:'#F8F7FA', borderRadius:10, padding:'14px', border:`1px solid ${C.border}` }}>
                    <p style={{ fontSize:13, fontWeight:600, color:C.navy, margin:'0 0 10px' }}>إعدادات التكرار</p>
                    <div style={{ marginBottom:10 }}>
                      <label style={lbl}>التكرار</label>
                      <select value={recurrence} onChange={e=>setRec(e.target.value)} style={inp}>
                        {RECURRENCE_OPTIONS.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </div>
                    {recurrence==='weekly' && (
                      <div style={{ marginBottom:10 }}>
                        <label style={lbl}>أيام التكرار</label>
                        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                          {DAYS_AR.map((d,i)=>(
                            <button key={i} onClick={()=>toggleDay(i)} style={{
                              padding:'5px 10px', borderRadius:20, cursor:'pointer', fontSize:12, fontWeight:600,
                              border:`2px solid ${recDays.includes(i) ? C.orange : C.border}`,
                              background: recDays.includes(i) ? '#FEF0ED' : C.card,
                              color: recDays.includes(i) ? C.orange : C.text,
                            }}>{d}</button>
                          ))}
                        </div>
                      </div>
                    )}
                    <div>
                      <label style={lbl}>تاريخ انتهاء التكرار</label>
                      <input type="date" value={recEndDate} onChange={e=>setRecEnd(e.target.value)} style={{ ...inp, maxWidth:200 }} />
                    </div>
                  </div>
                )}
              </div>

              {/* Location */}
              <div style={card}>
                <p style={sTitle}>الموقع</p>
                <p style={sDesc}>أين ستُقام الفعالية؟</p>
                <div style={{ display:'flex', gap:8, marginBottom:14 }}>
                  {[
                    ['venue','📍 مكان فعلي'],
                    ['online','💻 عبر الإنترنت'],
                    ['tba','📢 سيُعلن لاحقاً'],
                  ].map(([v,l])=>(
                    <button key={v} onClick={()=>setLocType(v as any)} style={{
                      flex:1, padding:'9px 6px', borderRadius:8, cursor:'pointer', fontWeight:600, fontSize:12,
                      border:`2px solid ${locType===v ? C.orange : C.border}`,
                      background: locType===v ? '#FEF0ED' : C.card,
                      color: locType===v ? C.orange : C.text, transition:'all 0.15s'
                    }}>{l}</button>
                  ))}
                </div>

                {locType==='venue' && (
                  <div style={{ marginBottom:12 }}>
                    <label style={lbl}>عنوان المكان</label>
                    <input value={location} onChange={e=>setLocation(e.target.value)}
                      placeholder="المدينة، الحي، اسم القاعة..." style={inp} />
                  </div>
                )}

                {locType==='online' && (
                  <div style={{ marginBottom:12 }}>
                    <label style={lbl}>رابط البث المباشر <span style={{ color:C.muted, fontWeight:400 }}>(يُرسل للمسجلين فقط)</span></label>
                    <input value={onlineUrl} onChange={e=>setOnlineUrl(e.target.value)}
                      placeholder="https://zoom.us/j/..." style={inp} />
                    <p style={{ fontSize:11, color:C.muted, margin:'4px 0 0' }}>💡 سيظهر الرابط للزوار المسجلين فقط بعد الحجز</p>
                  </div>
                )}

                <div>
                  <label style={lbl}>الطاقة الاستيعابية</label>
                  <input type="number" value={capacity} onChange={e=>setCapacity(e.target.value)}
                    placeholder="اتركه فارغاً لعدم التحديد"
                    style={{ ...inp, maxWidth:160 }} />
                </div>
              </div>

              {/* Description (rich feel) */}
              <div style={card}>
                <p style={sTitle}>نبذة عن الفعالية</p>
                <p style={sDesc}>اشرح ما يمكن توقعه — التفاصيل، الجدول، المعلومات المهمة</p>
                <textarea value={description} onChange={e=>setDesc(e.target.value)}
                  placeholder="اكتب هنا كل ما تريد أن يعرفه الزائر عن فعالتك..."
                  rows={5} style={{ ...inp, resize:'vertical', lineHeight:1.6 }} />
              </div>

              {/* Good to Know */}
              <div style={card}>
                <p style={sTitle}>معلومات مهمة</p>
                <p style={sDesc}>تساعد الزوار على الاستعداد</p>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                  {[
                    { label:'🎂 الفئة العمرية',       val:ageInfo,  set:setAge,  ph:'مثال: للجميع / 18+' },
                    { label:'🚪 وقت الدخول',           val:doorTime, set:setDoor, ph:'قبل الموعد بـ 30 دقيقة' },
                    { label:'🅿️ مواقف السيارات',       val:parking,  set:setPark, ph:'مواقف مجانية متاحة' },
                    { label:'✨ أبرز ما في الفعالية',  val:highlights, set:setHL, ph:'ما الذي يميز فعالتك؟' },
                  ].map(({label,val,set,ph})=>(
                    <div key={label}>
                      <label style={lbl}>{label}</label>
                      <input value={val} onChange={e=>set(e.target.value)} placeholder={ph} style={inp} />
                    </div>
                  ))}
                </div>
              </div>

              {/* FAQ */}
              <div style={card}>
                <p style={sTitle}>الأسئلة الشائعة</p>
                {showFaqTip && (
                  <div style={{ background:'#FFFBEC', border:'1px solid #F5C842', borderRadius:8, padding:'8px 12px', marginBottom:12, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span style={{ fontSize:12, color:'#7A6000' }}>💡 الفعاليات مع FAQ تحصل على 8% حركة مرور أعلى</span>
                    <button onClick={()=>setFaqTip(false)} style={{ background:'none', border:'none', cursor:'pointer', color:C.muted, fontSize:16, padding:0 }}>×</button>
                  </div>
                )}
                {faqs.map((faq,i)=>(
                  <div key={i} style={{ marginBottom:10, padding:12, background:'#F9F8FC', borderRadius:8, border:`1px solid ${C.border}` }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                      <span style={{ fontSize:11, fontWeight:600, color:C.muted }}>س {i+1}</span>
                      <button onClick={()=>removeFaq(i)} style={{ background:'none', border:'none', cursor:'pointer', color:'#DC2626', fontSize:12 }}>حذف</button>
                    </div>
                    <input value={faq.q} onChange={e=>updateFaq(i,'q',e.target.value)} placeholder="السؤال..." style={{ ...inp, marginBottom:6 }} />
                    <textarea value={faq.a} onChange={e=>updateFaq(i,'a',e.target.value)} placeholder="الإجابة..." rows={2} style={{ ...inp, resize:'vertical' }} />
                  </div>
                ))}
                <button onClick={addFaq} style={{ width:'100%', padding:'9px', border:`2px dashed ${C.border}`, borderRadius:8, background:'none', cursor:'pointer', color:C.orange, fontWeight:600, fontSize:13 }}>
                  + إضافة سؤال
                </button>
              </div>
            </>
          )}

          {/* ══════ STEP 2 ══════ */}
          {step===2 && (
            <div>
              <div style={{ marginBottom:16 }}>
                <h2 style={{ fontSize:22, fontWeight:800, color:C.navy, margin:'0 0 3px' }}>التذاكر</h2>
                <p style={{ color:C.muted, fontSize:13 }}>حدد أنواع التذاكر وتواريخ البيع</p>
              </div>
              {tickets.map((tk,i)=>(
                <div key={tk.id} style={card}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:14 }}>
                    <span style={{ fontSize:14, fontWeight:700, color:C.navy }}>تذكرة {i+1}</span>
                    {tickets.length>1 && (
                      <button onClick={()=>removeTicket(tk.id)} style={{ background:'none', border:'none', cursor:'pointer', color:'#DC2626', fontSize:12, fontWeight:600 }}>حذف</button>
                    )}
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:10, marginBottom:12 }}>
                    <div>
                      <label style={lbl}>اسم التذكرة</label>
                      <input value={tk.name} onChange={e=>updateTicket(tk.id,'name',e.target.value)} placeholder="عامة، VIP، طلاب..." style={inp} />
                    </div>
                    <div>
                      <label style={lbl}>الكمية</label>
                      <input type="number" value={tk.qty} onChange={e=>updateTicket(tk.id,'qty',e.target.value)} placeholder="100" style={inp} />
                    </div>
                  </div>

                  {/* Type */}
                  <div style={{ display:'flex', gap:7, marginBottom:12 }}>
                    {[['free','مجاني'],['paid','مدفوع'],['donation','تبرع']].map(([v,l])=>(
                      <button key={v} onClick={()=>updateTicket(tk.id,'type',v)} style={{
                        padding:'7px 14px', borderRadius:6, cursor:'pointer', fontWeight:600, fontSize:12,
                        border:`2px solid ${tk.type===v ? C.orange : C.border}`,
                        background: tk.type===v ? '#FEF0ED' : C.card,
                        color: tk.type===v ? C.orange : C.text,
                      }}>{l}</button>
                    ))}
                  </div>

                  {tk.type==='paid' && (
                    <div style={{ marginBottom:12 }}>
                      <label style={lbl}>السعر (ر.س)</label>
                      <input type="number" value={tk.price} onChange={e=>updateTicket(tk.id,'price',e.target.value)} placeholder="0.00" style={{ ...inp, maxWidth:140 }} />
                    </div>
                  )}

                  {/* Sale Dates */}
                  <div style={{ background:'#F8F7FA', borderRadius:8, padding:'12px', border:`1px solid ${C.border}`, marginBottom:10 }}>
                    <p style={{ fontSize:12, fontWeight:600, color:C.navy, margin:'0 0 10px' }}>📅 تواريخ البيع <span style={{ color:C.muted, fontWeight:400 }}>(اختياري)</span></p>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                      <div>
                        <label style={lbl}>بداية البيع</label>
                        <input type="datetime-local" value={tk.saleStart} onChange={e=>updateTicket(tk.id,'saleStart',e.target.value)} style={inp} />
                      </div>
                      <div>
                        <label style={lbl}>نهاية البيع</label>
                        <input type="datetime-local" value={tk.saleEnd} onChange={e=>updateTicket(tk.id,'saleEnd',e.target.value)} style={inp} />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label style={lbl}>الوصف <span style={{ color:C.muted, fontWeight:400 }}>(اختياري)</span></label>
                    <input value={tk.desc} onChange={e=>updateTicket(tk.id,'desc',e.target.value)} placeholder="ما الذي تشمله هذه التذكرة؟" style={inp} />
                  </div>
                </div>
              ))}
              <button onClick={addTicket} style={{ width:'100%', padding:'13px', border:`2px dashed ${C.border}`, borderRadius:10, background:'none', cursor:'pointer', color:C.orange, fontWeight:700, fontSize:14 }}>
                + إضافة نوع تذكرة آخر
              </button>
            </div>
          )}

          {/* ══════ STEP 3 ══════ */}
          {step===3 && (
            <div>
              <div style={{ marginBottom:16 }}>
                <h2 style={{ fontSize:22, fontWeight:800, color:C.navy, margin:'0 0 3px' }}>نشر الفعالية</h2>
                <p style={{ color:C.muted, fontSize:13 }}>راجع الإعدادات ثم انشر</p>
              </div>
              {/* Summary */}
              <div style={{ ...card, border:`2px solid ${C.border}` }}>
                <h3 style={{ fontSize:15, fontWeight:700, color:C.navy, margin:'0 0 14px' }}>ملخص الفعالية</h3>
                {[
                  ['📌 الاسم', title||'—'],
                  ['🎯 التصنيف', category ? `${category}${subcategory ? ` ← ${subcategory}` : ''}` : '—'],
                  ['📅 التاريخ', startDate ? `${startDate} · ${startTime}` : '—'],
                  ['🔁 النوع', eventType==='recurring' ? `متكرر · ${RECURRENCE_OPTIONS.find(r=>r.value===recurrence)?.label||''}` : 'فعالية واحدة'],
                  ['📍 الموقع', locType==='online' ? 'عبر الإنترنت' : locType==='tba' ? 'سيُعلن لاحقاً' : location||'—'],
                  ['🎟 التذاكر', tickets.map(t=>`${t.name||'تذكرة'} (${t.type==='free'?'مجاني':t.price+' ر.س'})`).join('، ')],
                  ['👥 الطاقة', capacity||'—'],
                  ['🖼️ الصورة', imageFile ? `✅ ${imageFile.name}` : '—'],
                ].map(([k,v])=>(
                  <div key={k} style={{ display:'flex', gap:10, padding:'7px 0', borderBottom:`1px solid ${C.border}` }}>
                    <span style={{ fontSize:12, color:C.muted, minWidth:100 }}>{k}</span>
                    <span style={{ fontSize:12, fontWeight:600, color:C.text }}>{v}</span>
                  </div>
                ))}
              </div>
              {/* Visibility */}
              <div style={card}>
                <h3 style={{ fontSize:15, fontWeight:700, color:C.navy, margin:'0 0 12px' }}>الرؤية</h3>
                <div style={{ display:'flex', gap:10 }}>
                  {[['public','🌐 عامة','تظهر في نتائج البحث'],['private','🔒 خاصة','يصل إليها من يملك الرابط']].map(([v,l,d])=>(
                    <div key={v} onClick={()=>setVis(v as any)} style={{
                      flex:1, padding:14, borderRadius:10, cursor:'pointer',
                      border:`2px solid ${visibility===v ? C.orange : C.border}`,
                      background: visibility===v ? '#FEF0ED' : C.card,
                    }}>
                      <p style={{ fontWeight:700, color:visibility===v ? C.orange : C.text, margin:'0 0 2px', fontSize:14 }}>{l}</p>
                      <p style={{ fontSize:11, color:C.muted, margin:0 }}>{d}</p>
                    </div>
                  ))}
                </div>
              </div>
              {/* Publish status */}
              <div style={card}>
                <h3 style={{ fontSize:15, fontWeight:700, color:C.navy, margin:'0 0 12px' }}>حالة النشر</h3>
                <div style={{ display:'flex', gap:10 }}>
                  {[['draft','📝 مسودة','احفظ للمراجعة لاحقاً'],['published','🚀 نشر الآن','متاح للجميع فوراً']].map(([v,l,d])=>(
                    <div key={v} onClick={()=>setStatus(v as any)} style={{
                      flex:1, padding:14, borderRadius:10, cursor:'pointer',
                      border:`2px solid ${status===v ? C.green : C.border}`,
                      background: status===v ? '#EAF7E0' : C.card,
                    }}>
                      <p style={{ fontWeight:700, color:status===v ? C.green : C.text, margin:'0 0 2px', fontSize:14 }}>{l}</p>
                      <p style={{ fontSize:11, color:C.muted, margin:0 }}>{d}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── PREVIEW PANEL ── */}
        {showPreview && (
          <div style={{ width:360, flexShrink:0, position:'sticky', top:96 }}>
            <div style={{ display:'flex', justifyContent:'center', gap:8, marginBottom:12 }}>
              {([['mobile','موبايل'],['desktop','ديسكتوب']] as const).map(([m,label])=>(
                <button key={m} onClick={()=>setPreviewMode(m)} style={{
                  display:'flex', alignItems:'center', gap:6, padding:'7px 16px',
                  borderRadius:8, cursor:'pointer', fontWeight:600, fontSize:12,
                  border:`2px solid ${previewMode===m ? C.navy : C.border}`,
                  background: previewMode===m ? C.navy : C.card,
                  color: previewMode===m ? '#fff' : C.text, transition:'all 0.15s'
                }}>
                  {m==='mobile'
                    ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
                    : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                  }
                  {label}
                </button>
              ))}
            </div>
            <p style={{ textAlign:'center', fontSize:10, color:C.muted, marginBottom:10, fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase' }}>معاينة مباشرة</p>
            <EventPreview {...previewProps} mode={previewMode} />
          </div>
        )}
      </div>

      {/* ── Bottom nav ── */}
      <div style={{
        position:'fixed', bottom:0, left:0, right:0,
        background:C.card, borderTop:`1px solid ${C.border}`,
        padding:'11px 24px', display:'flex', justifyContent:'space-between',
        alignItems:'center', zIndex:20, direction:'rtl'
      }}>
        <button onClick={()=>setStep(s=>Math.max(1,s-1))} disabled={step===1} style={{
          padding:'9px 20px', border:`1px solid ${C.border}`, borderRadius:6,
          background:C.card, cursor:step===1?'not-allowed':'pointer',
          color:step===1?C.muted:C.text, fontWeight:600, fontSize:13, opacity:step===1?0.4:1
        }}>← السابق</button>
        <div style={{ display:'flex', gap:5, alignItems:'center' }}>
          {[1,2,3].map(n=>(
            <div key={n} style={{ width:n===step?22:7, height:7, borderRadius:50, background:n<step?C.green:n===step?C.orange:C.border, transition:'all 0.3s' }}/>
          ))}
        </div>
        {step<3
          ? <button onClick={()=>setStep(s=>Math.min(3,s+1))} style={{ padding:'9px 24px', border:'none', borderRadius:6, background:C.orange, color:'#fff', cursor:'pointer', fontWeight:700, fontSize:13 }}>التالي ←</button>
          : <button onClick={publish} disabled={saving||imageUploading} style={{ padding:'9px 24px', border:'none', borderRadius:6, background:saved?C.green:C.orange, color:'#fff', cursor:saving?'wait':'pointer', fontWeight:700, fontSize:13, transition:'background 0.3s' }}>
              {imageUploading?'⏫ رفع الصورة...':saving?'جاري الحفظ...':saved?'✓ تم!':status==='published'?'🚀 نشر الفعالية':'💾 حفظ كمسودة'}
            </button>
        }
      </div>
    </div>
  )
}
