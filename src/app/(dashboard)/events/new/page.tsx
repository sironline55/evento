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
  { id: 1, label: 'صفحة الفعالية', desc: 'التفاصيل والمحتوى' },
  { id: 2, label: 'التذاكر', desc: 'الأسعار ومواعيد البيع' },
  { id: 3, label: 'النشر', desc: 'راجع وانشر' },
]

const CATEGORIES: Record<string, string[]> = {
  'مؤتمر وندوة':      ['مؤتمر','ندوة','قمة','ورشة عمل'],
  'موسيقى وفنون':      ['حفل موسيقي','معرض فني','عرض مسرحي','فيلم'],
  'رياضة ونشاط':      ['ماراثون','مباراة','تمرين جماعي','رياضة مائية'],
  'أعمال وتجارة':     ['ملتقى أعمال','فرص استثمار','تواصل مهني','إطلاق منتج'],
  'تكنولوجيا':         ['هاكاثون','مؤتمر تقني','ورشة برمجة','ذكاء اصطناعي'],
  'تعليم ودورات':     ['دورة تدريبية','محاضرة','تطوير مهني','لغات'],
  'طعام وشراب':       ['مهرجان طعام','تذوق','ورشة طبخ','قهوة'],
  'مجتمع وثقافة':     ['مهرجان ثقافي','معرض','احتفال','تطوع'],
  'أخرى':              ['متنوع','غير مصنّف'],
}

const RECURRENCE_OPTIONS = [
  { val: 'daily',   label: 'يومياً' },
  { val: 'weekly',  label: 'أسبوعياً' },
  { val: 'monthly', label: 'شهرياً' },
  { val: 'custom',  label: 'مخصص' },
]

type Ticket = {
  id: number; name: string; type: 'free' | 'paid'
  price: string; qty: string; desc: string
  saleStart: string; saleEnd: string
}

type AgendaItem  = { time: string; title: string; speaker: string }
type LineupItem  = { name: string; role: string; bio: string }

// ── Live Preview ────────────────────────────────────────────────────
function EventPreview({
  title, subtitle, category, subcategory, startDate, startTime,
  endTime, locationType, location, eventUrl, description, highlights,
  ageInfo, doorTime, parking, tickets, coverPreview, mode,
}: {
  title: string; subtitle: string; category: string; subcategory: string
  startDate: string; startTime: string; endTime: string
  locationType: string; location: string; eventUrl: string
  description: string; highlights: string; ageInfo: string
  doorTime: string; parking: string; tickets: Ticket[]
  coverPreview: string | null; mode: 'mobile' | 'desktop'
}) {
  const isMobile = mode === 'mobile'
  const locStr = locationType === 'online' ? 'عبر الإنترنت' : locationType === 'tba' ? 'يُعلَن لاحقاً' : location || 'مكان الفعالية'
  const dateStr = startDate ? new Date(`${startDate}T${startTime}`).toLocaleDateString('ar-SA', { weekday:'long', year:'numeric', month:'long', day:'numeric' }) : null
  const minPrice = tickets.find(t => t.type === 'paid')?.price
  const priceLabel = minPrice ? `من ${minPrice} ر.س` : 'مجاني'
  const good = [
    ageInfo    && { icon:'🎂', text: ageInfo },
    doorTime   && { icon:'🚪', text: doorTime },
    parking    && { icon:'🅿️', text: parking },
    highlights && { icon:'✨', text: highlights },
    startDate  && { icon:'⏱️', text: `${startTime} — ${endTime}` },
    locationType !== 'online' && locationType !== 'tba' && { icon:'📍', text:'حضوري' },
  ].filter(Boolean) as { icon: string; text: string }[]

  return (
    <div style={{
      width: isMobile ? 320 : '100%', margin: '0 auto',
      background: '#F0F3F7', borderRadius: isMobile ? 24 : 12,
      overflow: 'hidden',
      border: isMobile ? '8px solid #1C1C2E' : `1px solid ${C.border}`,
      boxShadow: isMobile ? '0 20px 60px rgba(0,0,0,0.25)' : '0 4px 20px rgba(0,0,0,0.08)',
      direction: 'rtl', maxHeight: 620, overflowY: 'auto',
    }}>
      {/* Header */}
      <div style={{ background: C.card, padding: '10px 14px', display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:`1px solid ${C.border}` }}>
        <span style={{ fontSize:20, color:C.orange }}>🎪</span>
        <div style={{ display:'flex', gap:10 }}>
          <span style={{ color:'#3D7FE8', fontSize:16 }}>↑</span>
          <span style={{ color:C.muted, fontSize:16 }}>♡</span>
        </div>
      </div>

      {/* Banner */}
      {coverPreview ? (
        <img src={coverPreview} alt="cover" style={{ width:'100%', height: isMobile ? 160 : 220, objectFit:'cover' }} />
      ) : (
        <div style={{ height: isMobile ? 160 : 220, background:'linear-gradient(135deg,#E8E0F0,#D0C8E8)', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <span style={{ fontSize:40 }}>🖼️</span>
        </div>
      )}

      <div style={{ padding:'16px 16px 0', background: C.card }}>
        <h2 style={{ fontSize: isMobile ? 18 : 24, fontWeight:800, color:C.navy, margin:'0 0 10px', lineHeight:1.3 }}>
          {title || 'عنوان الفعالية'}
        </h2>
        {subtitle && <p style={{ fontSize:13, color:C.muted, margin:'0 0 10px' }}>{subtitle}</p>}

        {/* Organizer */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ width:28, height:28, borderRadius:'50%', background:C.navy, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:12 }}>👤</div>
            <span style={{ fontSize:12, color:C.text }}>بواسطة <strong>اسم المنظم</strong></span>
          </div>
          <button style={{ padding:'4px 12px', border:`1px solid ${C.border}`, borderRadius:6, background:C.card, fontSize:11, fontWeight:600 }}>متابعة</button>
        </div>

        {/* Chips */}
        <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:14 }}>
          {locStr && <div style={{ display:'flex', gap:6, alignItems:'center' }}><span>📍</span><span style={{ fontSize:12, color:C.muted }}>{locStr}</span></div>}
          {eventUrl && locationType === 'online' && <div style={{ display:'flex', gap:6, alignItems:'center' }}><span>🔗</span><span style={{ fontSize:12, color:'#3D7FE8' }}>رابط البث</span></div>}
          {dateStr && <div style={{ display:'flex', gap:6, alignItems:'center' }}><span>📅</span><span style={{ fontSize:12, color:C.muted }}>{dateStr} · {startTime} — {endTime}</span></div>}
          {category && <div style={{ display:'flex', gap:6, alignItems:'center' }}><span>🏷️</span><span style={{ fontSize:12, color:C.muted }}>{category}{subcategory && ` · ${subcategory}`}</span></div>}
        </div>

        {/* Overview */}
        <div style={{ borderTop:`1px solid ${C.border}`, paddingTop:12, marginBottom:12 }}>
          <h3 style={{ fontSize:16, fontWeight:700, color:C.navy, margin:'0 0 8px' }}>نبذة عن الفعالية</h3>
          <p style={{ fontSize:12, color:C.text, lineHeight:1.7, margin:0 }}>
            {description || 'لا يوجد وصف بعد...'}
          </p>
        </div>

        {/* Good to know */}
        {good.length > 0 && (
          <div style={{ borderTop:`1px solid ${C.border}`, paddingTop:12, marginBottom:12 }}>
            <h3 style={{ fontSize:16, fontWeight:700, color:C.navy, margin:'0 0 10px' }}>معلومات مهمة</h3>
            <div style={{ background:'#F8F7FA', borderRadius:8, padding:'12px', border:`1px solid ${C.border}` }}>
              <p style={{ fontSize:12, fontWeight:700, color:C.navy, margin:'0 0 8px' }}>أبرز ما في الفعالية</p>
              {good.map((g, i) => (
                <div key={i} style={{ display:'flex', gap:6, marginBottom:5 }}>
                  <span style={{ fontSize:13 }}>{g.icon}</span>
                  <span style={{ fontSize:12, color:C.text }}>{g.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Location */}
        <div style={{ borderTop:`1px solid ${C.border}`, paddingTop:12, marginBottom:12 }}>
          <h3 style={{ fontSize:16, fontWeight:700, color:C.navy, margin:'0 0 4px' }}>الموقع</h3>
          <p style={{ fontSize:13, fontWeight:600, color:C.text, margin:0 }}>{locStr}</p>
        </div>

        {/* Organizer card */}
        <div style={{ borderTop:`1px solid ${C.border}`, paddingTop:12, paddingBottom:70 }}>
          <h3 style={{ fontSize:16, fontWeight:700, color:C.navy, margin:'0 0 10px' }}>المنظِّم</h3>
          <div style={{ background:'#F8F7FA', borderRadius:10, padding:'12px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
              <div style={{ width:44, height:44, borderRadius:'50%', background:C.navy, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:18 }}>👤</div>
              <div>
                <p style={{ fontWeight:700, color:C.navy, margin:0, fontSize:13 }}>اسم المنظم</p>
                <div style={{ display:'flex', gap:10, marginTop:3 }}>
                  {['المتابعون','الفعاليات'].map(l => (
                    <div key={l}><p style={{ fontSize:10, color:C.muted, margin:0 }}>{l}</p><p style={{ fontSize:11, fontWeight:700, color:C.text, margin:0 }}>—</p></div>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
              <button style={{ padding:'8px', border:`1px solid ${C.border}`, borderRadius:6, background:C.card, fontWeight:600, fontSize:12 }}>تواصل</button>
              <button style={{ padding:'8px', border:'none', borderRadius:6, background:C.orange, color:'#fff', fontWeight:700, fontSize:12 }}>متابعة</button>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky bottom */}
      <div style={{ position:'sticky', bottom:0, background:C.card, borderTop:`1px solid ${C.border}`, padding:'10px 16px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div>
          <p style={{ fontWeight:700, color:C.navy, margin:0, fontSize:13 }}>{priceLabel}</p>
          {dateStr && <p style={{ fontSize:10, color:C.muted, margin:'1px 0 0' }}>{dateStr}</p>}
        </div>
        <button disabled style={{ padding:'8px 16px', border:'none', borderRadius:6, background:'#D9D9D9', color:'#9E9E9E', fontWeight:700, fontSize:12 }}>
          احجز تذكرة
        </button>
      </div>
    </div>
  )
}

// ── MAIN PAGE ───────────────────────────────────────────────────────
export default function NewEventPage() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  const [step, setStep]               = useState(1)
  const [saving, setSaving]           = useState(false)
  const [saved, setSaved]             = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [previewMode, setPreviewMode] = useState<'mobile'|'desktop'>('mobile')
  const [uploading, setUploading]     = useState(false)

  // Step 1
  const [coverFile, setCoverFile]     = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [coverUrl, setCoverUrl]       = useState('')
  const [title, setTitle]             = useState('')
  const [subtitle, setSubtitle]       = useState('')
  const [category, setCategory]       = useState('')
  const [subcategory, setSubcategory] = useState('')
  const [isRecurring, setIsRecurring] = useState(false)
  const [recurrence, setRecurrence]   = useState('weekly')
  const [startDate, setStartDate]     = useState('')
  const [startTime, setStartTime]     = useState('10:00')
  const [endDate, setEndDate]         = useState('')
  const [endTime, setEndTime]         = useState('12:00')
  const [locationType, setLocType]    = useState<'venue'|'online'|'tba'>('venue')
  const [location, setLocation]       = useState('')
  const [locationDetails, setLocDetails] = useState('')
  const [eventUrl, setEventUrl]       = useState('')
  const [capacity, setCapacity]       = useState('')
  const [description, setDesc]        = useState('')
  const [highlights, setHighlights]   = useState('')
  const [ageInfo, setAgeInfo]         = useState('')
  const [doorTime, setDoorTime]       = useState('')
  const [parking, setParking]         = useState('')
  const [faqs, setFaqs]               = useState<{q:string;a:string}[]>([])
  const [showFaqTip, setShowFaqTip]   = useState(true)
  const [agenda, setAgenda]           = useState<AgendaItem[]>([])
  const [lineup, setLineup]           = useState<LineupItem[]>([])

  // Step 2
  const [tickets, setTickets] = useState<Ticket[]>([
    { id:1, name:'تذكرة عامة', type:'free', price:'', qty:'100', desc:'', saleStart:'', saleEnd:'' }
  ])

  // Step 3
  const [visibility, setVisibility] = useState<'public'|'private'>('public')
  const [status, setStatus]         = useState<'draft'|'published'>('draft')

  // ── Handlers ────────────────────────────────────────────────────
  async function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setCoverFile(file)
    const reader = new FileReader()
    reader.onload = (ev) => setCoverPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
    // Upload immediately
    setUploading(true)
    try {
      const { data: { user } } = await sb.auth.getUser()
      const ext = file.name.split('.').pop()
      const path = `${user?.id}/${Date.now()}.${ext}`
      const { error } = await sb.storage.from('event-images').upload(path, file, { upsert: true })
      if (!error) {
        const { data: { publicUrl } } = sb.storage.from('event-images').getPublicUrl(path)
        setCoverUrl(publicUrl)
      }
    } finally { setUploading(false) }
  }

  function addTicket() {
    setTickets(t => [...t, { id:Date.now(), name:'', type:'free', price:'', qty:'', desc:'', saleStart:'', saleEnd:'' }])
  }
  function updateTicket(id: number, field: keyof Ticket, val: string) {
    setTickets(t => t.map(tk => tk.id === id ? { ...tk, [field]: val } : tk))
  }
  function removeTicket(id: number) { setTickets(t => t.filter(tk => tk.id !== id)) }

  function addFaq()    { setFaqs(f => [...f, { q:'', a:'' }]) }
  function removeFaq(i: number) { setFaqs(f => f.filter((_, idx) => idx !== i)) }
  function updateFaq(i: number, field: 'q'|'a', val: string) {
    setFaqs(f => f.map((faq, idx) => idx === i ? { ...faq, [field]: val } : faq))
  }

  function addAgenda() { setAgenda(a => [...a, { time:'', title:'', speaker:'' }]) }
  function updateAgenda(i: number, field: keyof AgendaItem, val: string) {
    setAgenda(a => a.map((item, idx) => idx === i ? { ...item, [field]: val } : item))
  }
  function removeAgenda(i: number) { setAgenda(a => a.filter((_, idx) => idx !== i)) }

  function addLineup() { setLineup(l => [...l, { name:'', role:'', bio:'' }]) }
  function updateLineup(i: number, field: keyof LineupItem, val: string) {
    setLineup(l => l.map((item, idx) => idx === i ? { ...item, [field]: val } : item))
  }
  function removeLineup(i: number) { setLineup(l => l.filter((_, idx) => idx !== i)) }

  async function publish() {
    if (!title.trim()) { alert('يرجى إدخال اسم الفعالية'); setStep(1); return }
    if (!startDate)    { alert('يرجى تحديد تاريخ البداية'); setStep(1); return }
    setSaving(true)
    try {
      const { data: { user } } = await sb.auth.getUser()
      const startDT = `${startDate}T${startTime}:00`
      const endDT   = endDate ? `${endDate}T${endTime}:00` : null
      const { data, error } = await sb.from('events').insert({
        title: title.trim(),
        description: [subtitle, description].filter(Boolean).join('\n\n'),
        location: locationType === 'online' ? 'عبر الإنترنت' : locationType === 'tba' ? 'يُعلَن لاحقاً' : [location, locationDetails].filter(Boolean).join(' — '),
        event_url:   eventUrl || null,
        cover_image: coverUrl || null,
        category, subcategory,
        start_date: startDT, end_date: endDT,
        capacity: capacity ? parseInt(capacity) : null,
        is_recurring: isRecurring,
        recurrence: isRecurring ? { type: recurrence } : null,
        ticket_sale_start: tickets[0]?.saleStart || null,
        ticket_sale_end:   tickets[0]?.saleEnd   || null,
        agenda:  agenda.length  ? agenda  : null,
        lineup:  lineup.length  ? lineup  : null,
        status, is_public: visibility === 'public',
        created_by: user?.id,
      }).select('id').single()
      if (error) throw error
      setSaved(true)
      setTimeout(() => router.push(`/events/${data.id}`), 700)
    } catch (e: any) {
      alert('خطأ: ' + e.message)
    } finally { setSaving(false) }
  }

  // ── Styles ────────────────────────────────────────────────────────
  const inp: React.CSSProperties = {
    width:'100%', padding:'10px 13px',
    border:`1px solid ${C.border}`, borderRadius:8,
    fontSize:14, outline:'none', fontFamily:'inherit',
    color:C.text, background:C.card, boxSizing:'border-box',
  }
  const lbl: React.CSSProperties = {
    fontSize:12, fontWeight:600, color:C.text, display:'block', marginBottom:5
  }
  const card: React.CSSProperties = {
    background:C.card, border:`1px solid ${C.border}`,
    borderRadius:12, padding:'20px', marginBottom:12,
  }
  const sectionHead = (t: string, d?: string) => (
    <div style={{ marginBottom:14 }}>
      <p style={{ fontSize:15, fontWeight:700, color:C.navy, margin:'0 0 3px' }}>{t}</p>
      {d && <p style={{ fontSize:12, color:C.muted, margin:0 }}>{d}</p>}
    </div>
  )

  const subcats = category ? (CATEGORIES[category] || []) : []

  return (
    <div style={{ minHeight:'100vh', background:C.bg, direction:'rtl' }}>

      {/* ── Top bar ── */}
      <div style={{ background:C.card, borderBottom:`1px solid ${C.border}`, position:'sticky', top:0, zIndex:30 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, height:50, padding:'0 18px', maxWidth: showPreview ? 1500 : 820, margin:'0 auto' }}>
          <Link href="/events" style={{ color:C.muted, textDecoration:'none', fontSize:12, fontWeight:500, whiteSpace:'nowrap' }}>← العودة</Link>
          <div style={{ flex:1, textAlign:'center' }}>
            <span style={{ fontSize:13, fontWeight:700, color:C.navy }}>{title || 'فعالية بدون عنوان'}</span>
          </div>
          <span style={{ fontSize:11, fontWeight:600, padding:'3px 8px', borderRadius:4, background:'#F8F7FA', color:C.muted, whiteSpace:'nowrap' }}>مسودة</span>
          <button onClick={() => setShowPreview(p => !p)} style={{
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
        <div style={{ display:'flex', borderTop:`1px solid ${C.border}`, maxWidth: showPreview ? 1500 : 820, margin:'0 auto' }}>
          {STEPS.map(s => (
            <button key={s.id} onClick={() => setStep(s.id)} style={{
              flex:1, padding:'7px 10px', background:'none', border:'none', cursor:'pointer', textAlign:'center',
              borderBottom: step === s.id ? `2px solid ${C.orange}` : '2px solid transparent',
              color: step === s.id ? C.orange : step > s.id ? C.green : C.muted,
              transition:'all 0.15s', marginBottom:-1,
            }}>
              <div style={{ fontSize:11, fontWeight:700 }}>{step > s.id ? '✓ ' : ''}{s.id}. {s.label}</div>
              <div style={{ fontSize:10, color:C.muted }}>{s.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ display:'flex', gap:22, maxWidth: showPreview ? 1500 : 820, margin:'0 auto', padding:'20px 18px 100px', alignItems:'flex-start' }}>

        {/* ══ FORM ══ */}
        <div style={{ flex:1, minWidth:0 }}>

          {/* ───── STEP 1 ───── */}
          {step === 1 && (
            <>
              {/* ① Image Upload */}
              <div style={{ ...card, padding:0, overflow:'hidden' }}>
                <input ref={fileRef} type="file" accept="image/*" onChange={handleImageSelect} style={{ display:'none' }} />
                {coverPreview ? (
                  <div style={{ position:'relative' }}>
                    <img src={coverPreview} alt="cover" style={{ width:'100%', height:200, objectFit:'cover', display:'block' }} />
                    <div style={{ position:'absolute', top:10, left:10, display:'flex', gap:8 }}>
                      <button onClick={() => fileRef.current?.click()} style={{ background:'rgba(0,0,0,0.7)', color:'#fff', border:'none', borderRadius:6, padding:'6px 12px', fontSize:12, cursor:'pointer', fontWeight:600 }}>
                        {uploading ? '⏳ جاري الرفع...' : '✏️ تغيير الصورة'}
                      </button>
                      <button onClick={() => { setCoverPreview(null); setCoverFile(null); setCoverUrl('') }}
                        style={{ background:'rgba(220,38,38,0.8)', color:'#fff', border:'none', borderRadius:6, padding:'6px 10px', fontSize:12, cursor:'pointer' }}>✕</button>
                    </div>
                  </div>
                ) : (
                  <div onClick={() => fileRef.current?.click()} style={{ padding:'32px 20px', textAlign:'center', cursor:'pointer', background:'#F3F0F8', border:'2px dashed #B4A7D6' }}>
                    <div style={{ fontSize:28, marginBottom:8 }}>🖼️</div>
                    <p style={{ fontWeight:600, color:C.navy, margin:'0 0 3px', fontSize:14 }}>اضغط لرفع صورة الفعالية</p>
                    <p style={{ fontSize:11, color:C.muted, margin:0 }}>PNG، JPG أو GIF — حد أقصى 10 ميجابايت — يُوصى بـ 2160×1080</p>
                  </div>
                )}
              </div>

              {/* ② Event title & summary */}
              <div style={card}>
                {sectionHead('تفاصيل الفعالية','اسم واضح يخبر الناس ما سيشاهدون')}
                <div style={{ marginBottom:12 }}>
                  <label style={lbl}>اسم الفعالية *</label>
                  <input value={title} onChange={e => setTitle(e.target.value)}
                    placeholder="اسم قصير وواضح" maxLength={75}
                    style={{ ...inp, fontSize:16, fontWeight:600 }} />
                  <div style={{ textAlign:'left', fontSize:10, color:C.muted, marginTop:3 }}>{title.length}/75</div>
                </div>
                <div style={{ marginBottom:12 }}>
                  <div style={{ display:'flex', justifyContent:'space-between' }}>
                    <label style={lbl}>الوصف المختصر <span style={{ color:C.muted, fontWeight:400 }}>(140 حرف)</span></label>
                    <span style={{ fontSize:10, color:C.muted }}>{subtitle.length}/140</span>
                  </div>
                  <textarea value={subtitle} onChange={e => setSubtitle(e.target.value.slice(0,140))}
                    placeholder="جملة قصيرة تلخص فعالتك — يظهر للزوار أول ما يدخلون"
                    rows={2} style={{ ...inp, resize:'none' }} />
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                  <div>
                    <label style={lbl}>التصنيف</label>
                    <select value={category} onChange={e => { setCategory(e.target.value); setSubcategory('') }} style={inp}>
                      <option value="">اختر التصنيف</option>
                      {Object.keys(CATEGORIES).map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  {subcats.length > 0 && (
                    <div>
                      <label style={lbl}>التصنيف الفرعي</label>
                      <select value={subcategory} onChange={e => setSubcategory(e.target.value)} style={inp}>
                        <option value="">اختر...</option>
                        {subcats.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  )}
                </div>
              </div>

              {/* ③ Date & Time — with Recurring */}
              <div style={card}>
                {sectionHead('التاريخ والوقت')}
                {/* Single / Recurring toggle */}
                <div style={{ display:'flex', gap:8, marginBottom:14 }}>
                  {[['single','فعالية منفردة'],['recurring','فعالية متكررة']].map(([v,l]) => (
                    <button key={v} onClick={() => setIsRecurring(v === 'recurring')} style={{
                      flex:1, padding:'9px', borderRadius:8, cursor:'pointer', fontWeight:600, fontSize:13,
                      border:`2px solid ${(isRecurring ? 'recurring':'single') === v ? C.orange : C.border}`,
                      background:(isRecurring ? 'recurring':'single') === v ? '#FEF0ED' : C.card,
                      color:(isRecurring ? 'recurring':'single') === v ? C.orange : C.text,
                    }}>{l}</button>
                  ))}
                </div>

                {isRecurring && (
                  <div style={{ marginBottom:12, padding:12, background:'#FEF0ED', borderRadius:8, border:`1px solid #F5C0B0` }}>
                    <label style={{ ...lbl, marginBottom:8 }}>التكرار</label>
                    <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                      {RECURRENCE_OPTIONS.map(({ val, label }) => (
                        <button key={val} onClick={() => setRecurrence(val)} style={{
                          padding:'6px 14px', borderRadius:50, border:`1px solid ${recurrence===val?C.orange:C.border}`,
                          background: recurrence===val ? C.orange : C.card,
                          color: recurrence===val ? '#fff' : C.text,
                          fontWeight:600, fontSize:12, cursor:'pointer',
                        }}>{label}</button>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                  {[
                    { label:'تاريخ البداية *', val:startDate, set:setStartDate, type:'date' },
                    { label:'وقت البداية',     val:startTime, set:setStartTime, type:'time' },
                    { label:'تاريخ النهاية',   val:endDate,   set:setEndDate,   type:'date' },
                    { label:'وقت النهاية',     val:endTime,   set:setEndTime,   type:'time' },
                  ].map(({ label, val, set, type }) => (
                    <div key={label}>
                      <label style={lbl}>{label}</label>
                      <input type={type} value={val} onChange={e => set(e.target.value)} style={inp} />
                    </div>
                  ))}
                </div>
              </div>

              {/* ④ Location — Venue / Online / TBA */}
              <div style={card}>
                {sectionHead('الموقع')}
                <div style={{ display:'flex', gap:7, marginBottom:14 }}>
                  {[['venue','📍 مكان فعلي'],['online','💻 عبر الإنترنت'],['tba','❓ يُعلَن لاحقاً']].map(([v,l]) => (
                    <button key={v} onClick={() => setLocType(v as any)} style={{
                      flex:1, padding:'9px 6px', borderRadius:8, cursor:'pointer',
                      border:`2px solid ${locationType===v?C.orange:C.border}`,
                      background: locationType===v ? '#FEF0ED' : C.card,
                      color: locationType===v ? C.orange : C.text,
                      fontWeight:600, fontSize:12, transition:'all 0.15s'
                    }}>{l}</button>
                  ))}
                </div>

                {locationType === 'venue' && (
                  <>
                    <div style={{ marginBottom:10 }}>
                      <label style={lbl}>اسم المكان أو العنوان</label>
                      <input value={location} onChange={e => setLocation(e.target.value)}
                        placeholder="مثال: قاعة الملك فهد، الرياض" style={inp} />
                    </div>
                    <div>
                      <label style={lbl}>تفاصيل إضافية عن الموقع <span style={{ color:C.muted, fontWeight:400 }}>(اختياري)</span></label>
                      <input value={locationDetails} onChange={e => setLocDetails(e.target.value)}
                        placeholder="مثال: الطابق الثاني، قاعة B، بالقرب من..." style={inp} />
                    </div>
                  </>
                )}

                {locationType === 'online' && (
                  <div>
                    <label style={lbl}>رابط البث المباشر</label>
                    <input value={eventUrl} onChange={e => setEventUrl(e.target.value)}
                      placeholder="https://zoom.us/j/..." type="url" style={inp} />
                    <p style={{ fontSize:11, color:C.muted, marginTop:4 }}>سيظهر للمسجلين فقط بعد التسجيل</p>
                  </div>
                )}

                <div style={{ marginTop:12 }}>
                  <label style={lbl}>الطاقة الاستيعابية</label>
                  <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                    <input type="number" value={capacity} onChange={e => setCapacity(e.target.value)}
                      placeholder="عدد الزوار" style={{ ...inp, maxWidth:160 }} />
                    <span style={{ fontSize:12, color:C.muted }}>اتركها فارغة للسماح بعدد غير محدود</span>
                  </div>
                </div>
              </div>

              {/* ⑤ Description */}
              <div style={card}>
                {sectionHead('نبذة عن الفعالية','أخبر الزوار بما يمكن توقعه')}
                <textarea value={description} onChange={e => setDesc(e.target.value)}
                  placeholder="اكتب هنا كل ما تريد أن يعرفه الزائر — التفاصيل، الجدول، ما الذي سيستفيده..."
                  rows={6} style={{ ...inp, resize:'vertical', lineHeight:1.6 }} />
              </div>

              {/* ⑥ Good to Know */}
              <div style={card}>
                {sectionHead('معلومات مهمة','تساعد الزوار على الاستعداد')}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                  {[
                    { label:'🎂 الفئة العمرية', val:ageInfo,    set:setAgeInfo,    ph:'مثال: للجميع / 18+' },
                    { label:'🚪 وقت الدخول',   val:doorTime,   set:setDoorTime,   ph:'قبل الموعد بـ 30 دقيقة' },
                    { label:'🅿️ مواقف السيارات',val:parking,    set:setParking,    ph:'مواقف مجانية متاحة' },
                    { label:'✨ أبرز ما في الفعالية',val:highlights,set:setHighlights,ph:'ما الذي يميز فعالتك؟' },
                  ].map(({ label, val, set, ph }) => (
                    <div key={label}>
                      <label style={lbl}>{label}</label>
                      <input value={val} onChange={e => set(e.target.value)} placeholder={ph} style={inp} />
                    </div>
                  ))}
                </div>
              </div>

              {/* ⑦ Agenda */}
              <div style={card}>
                {sectionHead('الجدول الزمني','أضف برنامج الفعالية وقت بوقت')}
                {agenda.map((item, i) => (
                  <div key={i} style={{ display:'grid', gridTemplateColumns:'100px 1fr 1fr auto', gap:8, marginBottom:8, alignItems:'center' }}>
                    <input value={item.time} onChange={e => updateAgenda(i,'time',e.target.value)} placeholder="10:00" style={{ ...inp, fontSize:12 }} />
                    <input value={item.title} onChange={e => updateAgenda(i,'title',e.target.value)} placeholder="عنوان الجلسة..." style={{ ...inp, fontSize:12 }} />
                    <input value={item.speaker} onChange={e => updateAgenda(i,'speaker',e.target.value)} placeholder="المتحدث (اختياري)" style={{ ...inp, fontSize:12 }} />
                    <button onClick={() => removeAgenda(i)} style={{ background:'none', border:'none', cursor:'pointer', color:'#DC2626', fontSize:16, padding:'0 4px' }}>✕</button>
                  </div>
                ))}
                <button onClick={addAgenda} style={{ width:'100%', padding:'8px', border:`2px dashed ${C.border}`, borderRadius:8, background:'none', cursor:'pointer', color:C.orange, fontWeight:600, fontSize:13 }}>
                  + إضافة جلسة
                </button>
              </div>

              {/* ⑧ Lineup */}
              <div style={card}>
                {sectionHead('المتحدثون والفنانون','أضف المشاركين البارزين في فعالتك')}
                {lineup.map((item, i) => (
                  <div key={i} style={{ marginBottom:10, padding:12, background:'#F9F8FC', borderRadius:8, border:`1px solid ${C.border}` }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                      <span style={{ fontSize:11, fontWeight:600, color:C.muted }}>مشارك {i+1}</span>
                      <button onClick={() => removeLineup(i)} style={{ background:'none', border:'none', cursor:'pointer', color:'#DC2626', fontSize:12 }}>حذف</button>
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:8 }}>
                      <input value={item.name} onChange={e => updateLineup(i,'name',e.target.value)} placeholder="الاسم" style={{ ...inp, fontSize:12 }} />
                      <input value={item.role} onChange={e => updateLineup(i,'role',e.target.value)} placeholder="الدور / المسمى الوظيفي" style={{ ...inp, fontSize:12 }} />
                    </div>
                    <input value={item.bio} onChange={e => updateLineup(i,'bio',e.target.value)} placeholder="نبذة مختصرة (اختياري)" style={{ ...inp, fontSize:12 }} />
                  </div>
                ))}
                <button onClick={addLineup} style={{ width:'100%', padding:'8px', border:`2px dashed ${C.border}`, borderRadius:8, background:'none', cursor:'pointer', color:C.orange, fontWeight:600, fontSize:13 }}>
                  + إضافة مشارك
                </button>
              </div>

              {/* ⑨ FAQ */}
              <div style={card}>
                {sectionHead('الأسئلة الشائعة')}
                {showFaqTip && (
                  <div style={{ background:'#FFFBEC', border:'1px solid #F5C842', borderRadius:8, padding:'9px 12px', marginBottom:12, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span style={{ fontSize:12, color:'#7A6000' }}>💡 الفعاليات التي تحتوي على FAQ تحصل على 8% حركة مرور أعلى</span>
                    <button onClick={() => setShowFaqTip(false)} style={{ background:'none', border:'none', cursor:'pointer', color:C.muted, fontSize:16, padding:0 }}>×</button>
                  </div>
                )}
                {faqs.map((faq, i) => (
                  <div key={i} style={{ marginBottom:10, padding:12, background:'#F9F8FC', borderRadius:8, border:`1px solid ${C.border}` }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                      <span style={{ fontSize:11, fontWeight:600, color:C.muted }}>سؤال {i+1}</span>
                      <button onClick={() => removeFaq(i)} style={{ background:'none', border:'none', cursor:'pointer', color:'#DC2626', fontSize:12 }}>حذف</button>
                    </div>
                    <input value={faq.q} onChange={e => updateFaq(i,'q',e.target.value)} placeholder="السؤال..." style={{ ...inp, marginBottom:6 }} />
                    <textarea value={faq.a} onChange={e => updateFaq(i,'a',e.target.value)} placeholder="الإجابة..." rows={2} style={{ ...inp, resize:'vertical' }} />
                  </div>
                ))}
                <button onClick={addFaq} style={{ width:'100%', padding:'8px', border:`2px dashed ${C.border}`, borderRadius:8, background:'none', cursor:'pointer', color:C.orange, fontWeight:600, fontSize:13 }}>
                  + إضافة سؤال
                </button>
              </div>
            </>
          )}

          {/* ───── STEP 2 ───── */}
          {step === 2 && (
            <div>
              <div style={{ marginBottom:16 }}>
                <h2 style={{ fontSize:22, fontWeight:800, color:C.navy, margin:'0 0 4px' }}>التذاكر</h2>
                <p style={{ color:C.muted, fontSize:13 }}>حدد أنواع التذاكر والأسعار ومواعيد البيع</p>
              </div>
              {tickets.map((tk, i) => (
                <div key={tk.id} style={card}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:14 }}>
                    <span style={{ fontSize:14, fontWeight:700, color:C.navy }}>تذكرة {i+1}</span>
                    {tickets.length > 1 && (
                      <button onClick={() => removeTicket(tk.id)} style={{ background:'none', border:'none', cursor:'pointer', color:'#DC2626', fontSize:12, fontWeight:600 }}>حذف</button>
                    )}
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:10, marginBottom:12 }}>
                    <div>
                      <label style={lbl}>اسم التذكرة</label>
                      <input value={tk.name} onChange={e => updateTicket(tk.id,'name',e.target.value)}
                        placeholder="مثال: عامة، VIP..." style={inp} />
                    </div>
                    <div>
                      <label style={lbl}>الكمية</label>
                      <input type="number" value={tk.qty} onChange={e => updateTicket(tk.id,'qty',e.target.value)}
                        placeholder="100" style={inp} />
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:8, marginBottom:12 }}>
                    {[['free','🆓 مجاني'],['paid','💳 مدفوع']].map(([v,l]) => (
                      <button key={v} onClick={() => updateTicket(tk.id,'type',v)} style={{
                        padding:'7px 16px', borderRadius:6, cursor:'pointer', fontWeight:600, fontSize:12,
                        border:`2px solid ${tk.type===v?C.orange:C.border}`,
                        background: tk.type===v ? '#FEF0ED' : C.card,
                        color: tk.type===v ? C.orange : C.text,
                      }}>{l}</button>
                    ))}
                  </div>
                  {tk.type === 'paid' && (
                    <div style={{ marginBottom:12 }}>
                      <label style={lbl}>السعر (ر.س)</label>
                      <input type="number" value={tk.price} onChange={e => updateTicket(tk.id,'price',e.target.value)}
                        placeholder="0.00" style={{ ...inp, maxWidth:140 }} />
                    </div>
                  )}
                  <div style={{ marginBottom:12 }}>
                    <label style={lbl}>الوصف <span style={{ color:C.muted, fontWeight:400 }}>(اختياري)</span></label>
                    <input value={tk.desc} onChange={e => updateTicket(tk.id,'desc',e.target.value)}
                      placeholder="ما الذي تشمله هذه التذكرة؟" style={inp} />
                  </div>
                  {/* Sale dates */}
                  <div style={{ borderTop:`1px solid ${C.border}`, paddingTop:12 }}>
                    <p style={{ fontSize:12, fontWeight:600, color:C.navy, margin:'0 0 10px' }}>📅 مواعيد البيع</p>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                      <div>
                        <label style={lbl}>بداية البيع</label>
                        <input type="datetime-local" value={tk.saleStart} onChange={e => updateTicket(tk.id,'saleStart',e.target.value)} style={inp} />
                      </div>
                      <div>
                        <label style={lbl}>نهاية البيع</label>
                        <input type="datetime-local" value={tk.saleEnd} onChange={e => updateTicket(tk.id,'saleEnd',e.target.value)} style={inp} />
                      </div>
                    </div>
                    <p style={{ fontSize:11, color:C.muted, marginTop:6 }}>اتركهما فارغتين للبيع حتى موعد الفعالية</p>
                  </div>
                </div>
              ))}
              <button onClick={addTicket} style={{ width:'100%', padding:'12px', border:`2px dashed ${C.border}`, borderRadius:10, background:'none', cursor:'pointer', color:C.orange, fontWeight:700, fontSize:14 }}>
                + إضافة نوع تذكرة آخر
              </button>
            </div>
          )}

          {/* ───── STEP 3 ───── */}
          {step === 3 && (
            <div>
              <div style={{ marginBottom:16 }}>
                <h2 style={{ fontSize:22, fontWeight:800, color:C.navy, margin:'0 0 4px' }}>نشر الفعالية</h2>
                <p style={{ color:C.muted, fontSize:13 }}>راجع الإعدادات ثم انشر</p>
              </div>
              {/* Summary */}
              <div style={{ ...card, border:`2px solid ${C.border}` }}>
                <h3 style={{ fontSize:15, fontWeight:700, color:C.navy, margin:'0 0 12px' }}>ملخص الفعالية</h3>
                {[
                  ['📌 الاسم', title || '—'],
                  ['📅 التاريخ', startDate ? `${startDate} · ${startTime} — ${endTime}` : '—'],
                  ['📍 الموقع', locationType==='online' ? 'عبر الإنترنت' : locationType==='tba' ? 'يُعلَن لاحقاً' : location || '—'],
                  ['🏷️ التصنيف', [category,subcategory].filter(Boolean).join(' · ') || '—'],
                  ['🔄 التكرار', isRecurring ? RECURRENCE_OPTIONS.find(r=>r.val===recurrence)?.label||recurrence : 'فعالية منفردة'],
                  ['🖼️ صورة الغلاف', coverUrl ? '✅ تم الرفع' : '—'],
                  ['🎟 التذاكر', tickets.map(t=>`${t.name||'بدون اسم'} (${t.type==='free'?'مجاني':t.price+' ر.س'})`).join('، ')],
                  ['👥 الطاقة', capacity || 'غير محدودة'],
                  ['📋 الجدول', agenda.length ? `${agenda.length} جلسات` : '—'],
                  ['👤 المشاركون', lineup.length ? `${lineup.length} أشخاص` : '—'],
                ].map(([k,v]) => (
                  <div key={k} style={{ display:'flex', gap:12, padding:'7px 0', borderBottom:`1px solid ${C.border}` }}>
                    <span style={{ fontSize:12, color:C.muted, minWidth:110 }}>{k}</span>
                    <span style={{ fontSize:12, fontWeight:600, color:C.text }}>{v}</span>
                  </div>
                ))}
              </div>
              {/* Visibility */}
              <div style={card}>
                <h3 style={{ fontSize:15, fontWeight:700, color:C.navy, margin:'0 0 12px' }}>رؤية الفعالية</h3>
                <div style={{ display:'flex', gap:10 }}>
                  {[['public','🌐 عامة','تظهر في نتائج البحث'],['private','🔒 خاصة','يصل إليها من يملك الرابط فقط']].map(([v,l,d]) => (
                    <div key={v} onClick={() => setVisibility(v as any)} style={{
                      flex:1, padding:14, borderRadius:10, cursor:'pointer',
                      border:`2px solid ${visibility===v?C.orange:C.border}`,
                      background: visibility===v ? '#FEF0ED' : C.card,
                    }}>
                      <p style={{ fontWeight:700, color:visibility===v?C.orange:C.text, margin:'0 0 3px', fontSize:14 }}>{l}</p>
                      <p style={{ fontSize:11, color:C.muted, margin:0 }}>{d}</p>
                    </div>
                  ))}
                </div>
              </div>
              {/* Publish status */}
              <div style={card}>
                <h3 style={{ fontSize:15, fontWeight:700, color:C.navy, margin:'0 0 12px' }}>حالة النشر</h3>
                <div style={{ display:'flex', gap:10 }}>
                  {[['draft','📝 مسودة','احفظ للمراجعة لاحقاً'],['published','🚀 نشر الآن','الفعالية متاحة فوراً للجميع']].map(([v,l,d]) => (
                    <div key={v} onClick={() => setStatus(v as any)} style={{
                      flex:1, padding:14, borderRadius:10, cursor:'pointer',
                      border:`2px solid ${status===v?C.green:C.border}`,
                      background: status===v ? '#EAF7E0' : C.card,
                    }}>
                      <p style={{ fontWeight:700, color:status===v?C.green:C.text, margin:'0 0 3px', fontSize:14 }}>{l}</p>
                      <p style={{ fontSize:11, color:C.muted, margin:0 }}>{d}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ══ PREVIEW ══ */}
        {showPreview && (
          <div style={{ width:360, flexShrink:0, position:'sticky', top:100 }}>
            <div style={{ display:'flex', justifyContent:'center', gap:8, marginBottom:12 }}>
              {([['mobile','موبايل'],['desktop','ديسكتوب']] as const).map(([m,label]) => (
                <button key={m} onClick={() => setPreviewMode(m)} style={{
                  display:'flex', alignItems:'center', gap:5, padding:'7px 16px',
                  borderRadius:8, cursor:'pointer', fontWeight:600, fontSize:12,
                  border:`2px solid ${previewMode===m ? C.navy : C.border}`,
                  background: previewMode===m ? C.navy : C.card,
                  color: previewMode===m ? '#fff' : C.text,
                }}>
                  {m === 'mobile' ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                  )}
                  {label}
                </button>
              ))}
            </div>
            <p style={{ textAlign:'center', fontSize:10, color:C.muted, marginBottom:10, fontWeight:600, letterSpacing:'0.05em' }}>
              معاينة مباشرة
            </p>
            <EventPreview
              title={title} subtitle={subtitle} category={category} subcategory={subcategory}
              startDate={startDate} startTime={startTime} endDate={endDate} endTime={endTime}
              locationType={locationType} location={location} eventUrl={eventUrl}
              description={description} highlights={highlights} ageInfo={ageInfo}
              doorTime={doorTime} parking={parking} tickets={tickets}
              coverPreview={coverPreview} mode={previewMode}
            />
          </div>
        )}
      </div>

      {/* ── Bottom nav ── */}
      <div style={{ position:'fixed', bottom:0, left:0, right:0, background:C.card, borderTop:`1px solid ${C.border}`, padding:'12px 24px', display:'flex', justifyContent:'space-between', alignItems:'center', zIndex:20, direction:'rtl' }}>
        <button onClick={() => setStep(s => Math.max(1,s-1))} disabled={step===1} style={{
          padding:'9px 20px', border:`1px solid ${C.border}`, borderRadius:6,
          background:C.card, cursor:step===1?'not-allowed':'pointer',
          color:step===1?C.muted:C.text, fontWeight:600, fontSize:13, opacity:step===1?0.4:1
        }}>← السابق</button>
        <div style={{ display:'flex', gap:5, alignItems:'center' }}>
          {[1,2,3].map(n => (
            <div key={n} style={{ width:n===step?20:7, height:7, borderRadius:50, background:n<step?C.green:n===step?C.orange:C.border, transition:'all 0.3s' }}/>
          ))}
        </div>
        {step < 3 ? (
          <button onClick={() => setStep(s => Math.min(3,s+1))} style={{
            padding:'9px 24px', border:'none', borderRadius:6,
            background:C.orange, color:'#fff', cursor:'pointer', fontWeight:700, fontSize:13,
          }}>التالي ←</button>
        ) : (
          <button onClick={publish} disabled={saving} style={{
            padding:'9px 24px', border:'none', borderRadius:6,
            background:saved?C.green:C.orange, color:'#fff',
            cursor:saving?'wait':'pointer', fontWeight:700, fontSize:13, transition:'background 0.3s'
          }}>
            {saving?'جاري الحفظ...':saved?'✓ تم!':status==='published'?'🚀 نشر':'💾 حفظ كمسودة'}
          </button>
        )}
      </div>
    </div>
  )
}
