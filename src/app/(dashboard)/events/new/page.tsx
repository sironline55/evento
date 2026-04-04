'use client'
import { useState } from 'react'
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
  { id: 1, label: 'بناء صفحة الفعالية', desc: 'أضف تفاصيل فعالتك' },
  { id: 2, label: 'إضافة التذاكر',       desc: 'حدد التذاكر والأسعار' },
  { id: 3, label: 'نشر الفعالية',         desc: 'راجع وانشر' },
]

const EVENT_TYPES = [
  'مؤتمر وندوة','مهرجان وحفل','معرض وملتقى','دورة تدريبية','ورشة عمل',
  'رياضة ونشاط','فن وثقافة','تكنولوجيا','أعمال وتجارة','طعام وشراب','أخرى',
]

type Ticket  = { id: number; name: string; type: 'free'|'paid'; price: string; qty: string; desc: string }
type Faq     = { q: string; a: string }
type Preview = 'mobile' | 'desktop'

// ─────────────────── LIVE PREVIEW PANEL ────────────────────────────
function EventPreview({
  title, subtitle, eventType, startDate, startTime, endDate, endTime,
  locationType, location, description, highlights, ageInfo, doorTime,
  parking, tickets, mode,
}: {
  title: string; subtitle: string; eventType: string
  startDate: string; startTime: string; endDate: string; endTime: string
  locationType: string; location: string; description: string
  highlights: string; ageInfo: string; doorTime: string; parking: string
  tickets: Ticket[]; mode: Preview
}) {
  const dateStr = startDate
    ? new Date(`${startDate}T${startTime}`).toLocaleDateString('ar-SA', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      })
    : null
  const timeStr = startDate ? `${startTime} — ${endTime}` : null
  const locStr  = locationType === 'online' ? 'عبر الإنترنت' : location || 'مكان الفعالية'

  const isMobile = mode === 'mobile'
  const minTicketPrice = tickets.find(t => t.type === 'paid')?.price
  const priceLabel = minTicketPrice ? `من ${minTicketPrice} ر.س` : 'مجاني'

  const good: { icon: string; text: string }[] = []
  if (ageInfo)    good.push({ icon: '🎂', text: ageInfo })
  if (doorTime)   good.push({ icon: '🚪', text: doorTime })
  if (parking)    good.push({ icon: '🅿️', text: parking })
  if (highlights) good.push({ icon: '✨', text: highlights })
  if (startDate)  good.push({ icon: '⏱️', text: `${startTime} — ${endTime}` })
  if (locationType !== 'online') good.push({ icon: '📍', text: 'حضوري' })

  return (
    <div style={{
      width: isMobile ? 340 : '100%',
      margin: '0 auto',
      background: '#F0F3F7',
      borderRadius: isMobile ? 24 : 12,
      overflow: 'hidden',
      border: isMobile ? '8px solid #1C1C2E' : `1px solid ${C.border}`,
      boxShadow: isMobile ? '0 20px 60px rgba(0,0,0,0.25)' : '0 4px 20px rgba(0,0,0,0.08)',
      direction: 'rtl',
      fontFamily: 'inherit',
      maxHeight: isMobile ? 640 : 700,
      overflowY: 'auto',
    }}>
      {/* Top bar */}
      <div style={{ background: C.card, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${C.border}` }}>
        <span style={{ fontSize: 22, color: C.orange }}>🎪</span>
        <div style={{ display: 'flex', gap: 12 }}>
          <span style={{ color: '#3D7FE8', fontSize: 18 }}>↑</span>
          <span style={{ color: '#6F7287', fontSize: 18 }}>♡</span>
        </div>
      </div>

      {/* Banner */}
      <div style={{ height: isMobile ? 180 : 240, background: 'linear-gradient(135deg,#E8E0F0,#D0C8E8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 48 }}>🖼️</span>
      </div>

      <div style={{ padding: '20px 20px 0', background: C.card }}>
        {/* Title */}
        <h2 style={{ fontSize: isMobile ? 22 : 28, fontWeight: 800, color: C.navy, margin: '0 0 12px', lineHeight: 1.25 }}>
          {title || 'عنوان الفعالية'}
        </h2>

        {/* Organizer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: C.navy, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 14 }}>👤</div>
            <div>
              <span style={{ fontSize: 13, color: C.muted }}>بواسطة </span>
              <span style={{ fontSize: 13, fontWeight: 700, color: C.navy }}>اسم المنظم</span>
            </div>
          </div>
          <button style={{ padding: '5px 14px', border: `1px solid ${C.border}`, borderRadius: 6, background: C.card, fontSize: 12, fontWeight: 600, cursor: 'pointer', color: C.text }}>متابعة</button>
        </div>

        {/* Date & Location chips */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
          {locStr && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 16, color: C.muted }}>📍</span>
              <span style={{ fontSize: 13, color: C.muted }}>{locStr}</span>
            </div>
          )}
          {dateStr && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 16, color: C.muted }}>📅</span>
              <span style={{ fontSize: 13, color: C.muted }}>{dateStr} · {timeStr}</span>
            </div>
          )}
        </div>

        {/* Overview */}
        <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 16, marginBottom: 16 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: C.navy, margin: '0 0 10px' }}>نبذة عن الفعالية</h3>
          <p style={{ fontSize: 13, color: C.text, lineHeight: 1.7, margin: 0 }}>
            {description || 'لا يوجد وصف بعد — أضف وصفاً لفعالتك في الخطوة الأولى.'}
          </p>
        </div>

        {/* Category */}
        {eventType && (
          <p style={{ fontSize: 12, color: C.muted, marginBottom: 16 }}>التصنيف: {eventType}</p>
        )}

        {/* Good to Know */}
        {good.length > 0 && (
          <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 16, marginBottom: 16 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: C.navy, margin: '0 0 12px' }}>معلومات مهمة</h3>
            <div style={{ background: '#F8F7FA', borderRadius: 10, padding: '14px 16px', border: `1px solid ${C.border}` }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: C.navy, margin: '0 0 10px' }}>أبرز ما في الفعالية</p>
              {good.map((g, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 15 }}>{g.icon}</span>
                  <span style={{ fontSize: 13, color: C.text }}>{g.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Location section */}
        <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 16, marginBottom: 16 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: C.navy, margin: '0 0 6px' }}>الموقع</h3>
          <p style={{ fontSize: 14, fontWeight: 600, color: C.text, margin: 0 }}>{locStr}</p>
        </div>

        {/* Organized by */}
        <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 16, paddingBottom: 80 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: C.navy, margin: '0 0 12px' }}>المنظِّم</h3>
          <div style={{ background: '#F8F7FA', borderRadius: 12, padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: C.navy, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 22 }}>👤</div>
              <div>
                <p style={{ fontWeight: 700, color: C.navy, margin: 0, fontSize: 15 }}>اسم المنظم</p>
                <div style={{ display: 'flex', gap: 16, marginTop: 4 }}>
                  {['المتابعون','الفعاليات','يستضيف'].map(l => (
                    <div key={l} style={{ textAlign: 'center' }}>
                      <p style={{ fontSize: 11, color: C.muted, margin: 0 }}>{l}</p>
                      <p style={{ fontSize: 12, fontWeight: 700, color: C.text, margin: 0 }}>—</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <button style={{ padding: '10px', border: `1px solid ${C.border}`, borderRadius: 8, background: C.card, fontWeight: 600, fontSize: 13, cursor: 'pointer', color: C.text }}>تواصل</button>
              <button style={{ padding: '10px', border: 'none', borderRadius: 8, background: C.orange, color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>متابعة</button>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky bottom bar */}
      <div style={{ position: 'sticky', bottom: 0, background: C.card, borderTop: `1px solid ${C.border}`, padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <p style={{ fontWeight: 700, color: C.navy, margin: 0, fontSize: 15 }}>{priceLabel}</p>
          {dateStr && <p style={{ fontSize: 11, color: C.muted, margin: '2px 0 0' }}>{dateStr}</p>}
        </div>
        <button disabled style={{ padding: '10px 20px', border: 'none', borderRadius: 8, background: '#D9D9D9', color: '#9E9E9E', fontWeight: 700, fontSize: 14, cursor: 'not-allowed' }}>
          احجز تذكرة
        </button>
      </div>
    </div>
  )
}

// ─────────────────── MAIN PAGE ─────────────────────────────────────
export default function NewEventPage() {
  const router = useRouter()
  const [step, setStep]       = useState(1)
  const [saving, setSaving]   = useState(false)
  const [saved, setSaved]     = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [previewMode, setPreviewMode] = useState<Preview>('mobile')

  // Step 1
  const [title, setTitle]           = useState('')
  const [subtitle, setSubtitle]     = useState('')
  const [eventType, setEventType]   = useState('')
  const [startDate, setStartDate]   = useState('')
  const [startTime, setStartTime]   = useState('10:00')
  const [endDate, setEndDate]       = useState('')
  const [endTime, setEndTime]       = useState('12:00')
  const [locationType, setLocType]  = useState<'venue'|'online'>('venue')
  const [location, setLocation]     = useState('')
  const [capacity, setCapacity]     = useState('')
  const [description, setDesc]      = useState('')
  const [highlights, setHighlights] = useState('')
  const [ageInfo, setAgeInfo]       = useState('')
  const [doorTime, setDoorTime]     = useState('')
  const [parking, setParking]       = useState('')
  const [faqs, setFaqs]             = useState<Faq[]>([])
  const [showFaqTip, setShowFaqTip] = useState(true)

  // Step 2
  const [tickets, setTickets] = useState<Ticket[]>([
    { id: 1, name: 'تذكرة عامة', type: 'free', price: '', qty: '100', desc: '' }
  ])

  // Step 3
  const [visibility, setVisibility] = useState<'public'|'private'>('public')
  const [status, setStatus]         = useState<'draft'|'published'>('draft')

  function addTicket() {
    setTickets(t => [...t, { id: Date.now(), name: '', type: 'free', price: '', qty: '', desc: '' }])
  }
  function updateTicket(id: number, field: keyof Ticket, val: string) {
    setTickets(t => t.map(tk => tk.id === id ? { ...tk, [field]: val } : tk))
  }
  function removeTicket(id: number) { setTickets(t => t.filter(tk => tk.id !== id)) }
  function addFaq() { setFaqs(f => [...f, { q: '', a: '' }]) }
  function updateFaq(i: number, field: 'q'|'a', val: string) {
    setFaqs(f => f.map((faq, idx) => idx === i ? { ...faq, [field]: val } : faq))
  }
  function removeFaq(i: number) { setFaqs(f => f.filter((_, idx) => idx !== i)) }

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
        location: locationType === 'online' ? 'عبر الإنترنت' : location,
        start_date: startDT, end_date: endDT,
        capacity: capacity ? parseInt(capacity) : null,
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

  const inp: React.CSSProperties = {
    width: '100%', padding: '11px 14px',
    border: `1px solid ${C.border}`, borderRadius: 8,
    fontSize: 14, outline: 'none', fontFamily: 'inherit',
    color: C.text, background: C.card, boxSizing: 'border-box',
  }
  const lbl: React.CSSProperties = {
    fontSize: 12, fontWeight: 600, color: C.text, display: 'block', marginBottom: 6
  }
  const card: React.CSSProperties = {
    background: C.card, border: `1px solid ${C.border}`,
    borderRadius: 12, padding: '22px', marginBottom: 14,
  }

  const previewProps = {
    title, subtitle, eventType, startDate, startTime,
    endDate, endTime, locationType, location,
    description, highlights, ageInfo, doorTime, parking, tickets,
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, direction: 'rtl' }}>

      {/* ── Top bar ── */}
      <div style={{
        background: C.card, borderBottom: `1px solid ${C.border}`,
        position: 'sticky', top: 0, zIndex: 30
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, height: 52, padding: '0 20px', maxWidth: showPreview ? 1400 : 800, margin: '0 auto' }}>
          <Link href="/events" style={{ color: C.muted, textDecoration: 'none', fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap' }}>
            ← العودة
          </Link>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: C.navy }}>
              {title || 'فعالية بدون عنوان'}
            </span>
          </div>
          <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 4, background: '#F8F7FA', color: C.muted, whiteSpace: 'nowrap' }}>مسودة</span>

          {/* Preview toggle button */}
          <button onClick={() => setShowPreview(p => !p)} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 14px', borderRadius: 6,
            border: `1px solid ${showPreview ? C.orange : C.border}`,
            background: showPreview ? '#FEF0ED' : C.card,
            color: showPreview ? C.orange : C.text,
            cursor: 'pointer', fontSize: 13, fontWeight: 600,
            transition: 'all 0.15s', whiteSpace: 'nowrap',
          }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
            {showPreview ? 'إخفاء المعاينة' : 'معاينة'}
          </button>
        </div>

        {/* Steps */}
        <div style={{ display: 'flex', borderTop: `1px solid ${C.border}`, maxWidth: showPreview ? 1400 : 800, margin: '0 auto' }}>
          {STEPS.map(s => (
            <button key={s.id} onClick={() => setStep(s.id)} style={{
              flex: 1, padding: '8px 12px', background: 'none', border: 'none',
              cursor: 'pointer', textAlign: 'center',
              borderBottom: step === s.id ? `2px solid ${C.orange}` : '2px solid transparent',
              color: step === s.id ? C.orange : step > s.id ? C.green : C.muted,
              transition: 'all 0.15s', marginBottom: -1,
            }}>
              <div style={{ fontSize: 11, fontWeight: 700 }}>
                {step > s.id ? '✓ ' : ''}{s.id}. {s.label}
              </div>
              <div style={{ fontSize: 10, color: C.muted }}>{s.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Body (form + optional preview) ── */}
      <div style={{
        display: 'flex', gap: 24,
        maxWidth: showPreview ? 1400 : 820,
        margin: '0 auto', padding: '24px 20px 100px',
        alignItems: 'flex-start',
      }}>

        {/* ── FORM ── */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* ═════ STEP 1 ═════ */}
          {step === 1 && (
            <>
              {/* Banner */}
              <div style={{ ...card, textAlign: 'center', background: '#F3F0F8', border: '2px dashed #B4A7D6', cursor: 'pointer', padding: '36px 20px' }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>🖼️</div>
                <p style={{ fontWeight: 600, color: C.navy, margin: '0 0 4px', fontSize: 14 }}>رفع صورة أو فيديو</p>
                <p style={{ fontSize: 11, color: C.muted, margin: 0 }}>يُوصى بـ 2160 × 1080 — PNG، JPG أو GIF</p>
              </div>

              {/* Details */}
              <div style={card}>
                <p style={{ fontSize: 16, fontWeight: 700, color: C.navy, margin: '0 0 4px' }}>تفاصيل الفعالية</p>
                <p style={{ fontSize: 12, color: C.muted, margin: '0 0 16px' }}>أضف عنواناً واضحاً لفعالتك</p>
                <div style={{ marginBottom: 14 }}>
                  <label style={lbl}>اسم الفعالية *</label>
                  <input value={title} onChange={e => setTitle(e.target.value)}
                    placeholder="اسم قصير وواضح عن فعالتك"
                    style={{ ...inp, fontSize: 16, fontWeight: 600 }} />
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label style={lbl}>وصف مختصر <span style={{ color: C.muted, fontWeight: 400 }}>(اختياري)</span></label>
                  <input value={subtitle} onChange={e => setSubtitle(e.target.value)}
                    placeholder="جملة تلخص فعالتك..." style={inp} />
                </div>
                <div>
                  <label style={lbl}>نوع الفعالية</label>
                  <select value={eventType} onChange={e => setEventType(e.target.value)} style={inp}>
                    <option value="">اختر نوع الفعالية</option>
                    {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              {/* Date */}
              <div style={card}>
                <p style={{ fontSize: 16, fontWeight: 700, color: C.navy, margin: '0 0 4px' }}>التاريخ والوقت</p>
                <p style={{ fontSize: 12, color: C.muted, margin: '0 0 16px' }}>متى ستقام الفعالية؟</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {[
                    { label: 'تاريخ البداية *', val: startDate, set: setStartDate, type: 'date' },
                    { label: 'وقت البداية',     val: startTime, set: setStartTime, type: 'time' },
                    { label: 'تاريخ النهاية',   val: endDate,   set: setEndDate,   type: 'date' },
                    { label: 'وقت النهاية',     val: endTime,   set: setEndTime,   type: 'time' },
                  ].map(({ label, val, set, type }) => (
                    <div key={label}>
                      <label style={lbl}>{label}</label>
                      <input type={type} value={val} onChange={e => set(e.target.value)} style={inp} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Location */}
              <div style={card}>
                <p style={{ fontSize: 16, fontWeight: 700, color: C.navy, margin: '0 0 4px' }}>الموقع</p>
                <p style={{ fontSize: 12, color: C.muted, margin: '0 0 14px' }}>أين ستُقام الفعالية؟</p>
                <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                  {[['venue','📍 مكان فعلي'],['online','💻 عبر الإنترنت']].map(([v,l]) => (
                    <button key={v} onClick={() => setLocType(v as any)} style={{
                      flex: 1, padding: '10px', borderRadius: 8, cursor: 'pointer',
                      border: `2px solid ${locationType === v ? C.orange : C.border}`,
                      background: locationType === v ? '#FEF0ED' : C.card,
                      color: locationType === v ? C.orange : C.text,
                      fontWeight: 600, fontSize: 13, transition: 'all 0.15s'
                    }}>{l}</button>
                  ))}
                </div>
                {locationType === 'venue' && (
                  <div style={{ marginBottom: 12 }}>
                    <label style={lbl}>عنوان المكان</label>
                    <input value={location} onChange={e => setLocation(e.target.value)}
                      placeholder="المدينة، الحي، اسم المكان..." style={inp} />
                  </div>
                )}
                <div>
                  <label style={lbl}>الطاقة الاستيعابية</label>
                  <input type="number" value={capacity} onChange={e => setCapacity(e.target.value)}
                    placeholder="عدد الزوار المتوقع"
                    style={{ ...inp, maxWidth: 180 }} />
                </div>
              </div>

              {/* Description */}
              <div style={card}>
                <p style={{ fontSize: 16, fontWeight: 700, color: C.navy, margin: '0 0 4px' }}>نبذة عن الفعالية</p>
                <p style={{ fontSize: 12, color: C.muted, margin: '0 0 12px' }}>أخبر الزوار بما يمكن توقعه</p>
                <textarea value={description} onChange={e => setDesc(e.target.value)}
                  placeholder="اكتب هنا كل ما تريد أن يعرفه الزائر..."
                  rows={5} style={{ ...inp, resize: 'vertical', lineHeight: 1.6 }} />
              </div>

              {/* Good to Know */}
              <div style={card}>
                <p style={{ fontSize: 16, fontWeight: 700, color: C.navy, margin: '0 0 4px' }}>معلومات مهمة</p>
                <p style={{ fontSize: 12, color: C.muted, margin: '0 0 14px' }}>تساعد الزوار على الاستعداد</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {[
                    { label: '🎂 الفئة العمرية', val: ageInfo,    set: setAgeInfo,    ph: 'مثال: للجميع / 18+' },
                    { label: '🚪 وقت الدخول',    val: doorTime,   set: setDoorTime,   ph: 'قبل الموعد بـ 30 دقيقة' },
                    { label: '🅿️ مواقف السيارات', val: parking,    set: setParking,    ph: 'مواقف مجانية متاحة' },
                    { label: '✨ أبرز ما في الفعالية', val: highlights, set: setHighlights, ph: 'ما الذي يميز فعالتك؟' },
                  ].map(({ label, val, set, ph }) => (
                    <div key={label}>
                      <label style={lbl}>{label}</label>
                      <input value={val} onChange={e => set(e.target.value)} placeholder={ph} style={inp} />
                    </div>
                  ))}
                </div>
              </div>

              {/* FAQ */}
              <div style={card}>
                <p style={{ fontSize: 16, fontWeight: 700, color: C.navy, margin: '0 0 4px' }}>الأسئلة الشائعة</p>
                {showFaqTip && (
                  <div style={{ background: '#FFFBEC', border: '1px solid #F5C842', borderRadius: 8, padding: '9px 13px', marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: '#7A6000' }}>💡 الفعاليات التي تحتوي على FAQ تحصل على 8% حركة مرور أعلى</span>
                    <button onClick={() => setShowFaqTip(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, fontSize: 16, padding: 0 }}>×</button>
                  </div>
                )}
                {faqs.map((faq, i) => (
                  <div key={i} style={{ marginBottom: 10, padding: 12, background: '#F9F8FC', borderRadius: 8, border: `1px solid ${C.border}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: C.muted }}>سؤال {i + 1}</span>
                      <button onClick={() => removeFaq(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626', fontSize: 12 }}>حذف</button>
                    </div>
                    <input value={faq.q} onChange={e => updateFaq(i,'q',e.target.value)}
                      placeholder="السؤال..." style={{ ...inp, marginBottom: 6 }} />
                    <textarea value={faq.a} onChange={e => updateFaq(i,'a',e.target.value)}
                      placeholder="الإجابة..." rows={2} style={{ ...inp, resize: 'vertical' }} />
                  </div>
                ))}
                <button onClick={addFaq} style={{
                  width: '100%', padding: '9px', border: `2px dashed ${C.border}`, borderRadius: 8,
                  background: 'none', cursor: 'pointer', color: C.orange, fontWeight: 600, fontSize: 13
                }}>+ إضافة سؤال</button>
              </div>
            </>
          )}

          {/* ═════ STEP 2 ═════ */}
          {step === 2 && (
            <div>
              <div style={{ marginBottom: 18 }}>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: C.navy, margin: '0 0 4px' }}>التذاكر</h2>
                <p style={{ color: C.muted, fontSize: 13 }}>حدد أنواع التذاكر والأسعار</p>
              </div>
              {tickets.map((tk, i) => (
                <div key={tk.id} style={card}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: C.navy }}>تذكرة {i + 1}</span>
                    {tickets.length > 1 && (
                      <button onClick={() => removeTicket(tk.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626', fontSize: 12, fontWeight: 600 }}>حذف</button>
                    )}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10, marginBottom: 12 }}>
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
                  <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                    {[['free','مجاني'],['paid','مدفوع']].map(([v,l]) => (
                      <button key={v} onClick={() => updateTicket(tk.id,'type',v)} style={{
                        padding: '7px 18px', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 12,
                        border: `2px solid ${tk.type === v ? C.orange : C.border}`,
                        background: tk.type === v ? '#FEF0ED' : C.card,
                        color: tk.type === v ? C.orange : C.text,
                      }}>{l}</button>
                    ))}
                  </div>
                  {tk.type === 'paid' && (
                    <div style={{ marginBottom: 12 }}>
                      <label style={lbl}>السعر (ر.س)</label>
                      <input type="number" value={tk.price} onChange={e => updateTicket(tk.id,'price',e.target.value)}
                        placeholder="0.00" style={{ ...inp, maxWidth: 140 }} />
                    </div>
                  )}
                  <div>
                    <label style={lbl}>الوصف <span style={{ color: C.muted, fontWeight: 400 }}>(اختياري)</span></label>
                    <input value={tk.desc} onChange={e => updateTicket(tk.id,'desc',e.target.value)}
                      placeholder="ما الذي تشمله هذه التذكرة؟" style={inp} />
                  </div>
                </div>
              ))}
              <button onClick={addTicket} style={{
                width: '100%', padding: '13px', border: `2px dashed ${C.border}`, borderRadius: 10,
                background: 'none', cursor: 'pointer', color: C.orange, fontWeight: 700, fontSize: 14
              }}>+ إضافة نوع تذكرة آخر</button>
            </div>
          )}

          {/* ═════ STEP 3 ═════ */}
          {step === 3 && (
            <div>
              <div style={{ marginBottom: 18 }}>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: C.navy, margin: '0 0 4px' }}>نشر الفعالية</h2>
                <p style={{ color: C.muted, fontSize: 13 }}>راجع الإعدادات ثم انشر فعالتك</p>
              </div>
              <div style={{ ...card, border: `2px solid ${C.border}` }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: C.navy, margin: '0 0 14px' }}>ملخص الفعالية</h3>
                {[
                  ['📌 الاسم', title || '—'],
                  ['📅 التاريخ', startDate ? `${startDate} — ${startTime}` : '—'],
                  ['📍 الموقع', locationType === 'online' ? 'عبر الإنترنت' : location || '—'],
                  ['🎟 التذاكر', tickets.map(t => `${t.name||'بدون اسم'} (${t.type==='free'?'مجاني':t.price+' ر.س'})`).join('، ')],
                  ['👥 الطاقة', capacity || '—'],
                ].map(([k,v]) => (
                  <div key={k} style={{ display: 'flex', gap: 12, padding: '8px 0', borderBottom: `1px solid ${C.border}` }}>
                    <span style={{ fontSize: 12, color: C.muted, minWidth: 110 }}>{k}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{v}</span>
                  </div>
                ))}
              </div>
              <div style={card}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: C.navy, margin: '0 0 12px' }}>الرؤية</h3>
                <div style={{ display: 'flex', gap: 10 }}>
                  {[['public','🌐 عامة','تظهر في نتائج البحث'],['private','🔒 خاصة','يصل إليها من يملك الرابط']].map(([v,l,desc]) => (
                    <div key={v} onClick={() => setVisibility(v as any)} style={{
                      flex: 1, padding: 14, borderRadius: 10, cursor: 'pointer',
                      border: `2px solid ${visibility === v ? C.orange : C.border}`,
                      background: visibility === v ? '#FEF0ED' : C.card,
                    }}>
                      <p style={{ fontWeight: 700, color: visibility === v ? C.orange : C.text, margin: '0 0 3px', fontSize: 14 }}>{l}</p>
                      <p style={{ fontSize: 11, color: C.muted, margin: 0 }}>{desc}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div style={card}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: C.navy, margin: '0 0 12px' }}>حالة النشر</h3>
                <div style={{ display: 'flex', gap: 10 }}>
                  {[['draft','📝 مسودة','احفظ للمراجعة لاحقاً'],['published','🚀 نشر الآن','اجعل الفعالية متاحة فوراً']].map(([v,l,desc]) => (
                    <div key={v} onClick={() => setStatus(v as any)} style={{
                      flex: 1, padding: 14, borderRadius: 10, cursor: 'pointer',
                      border: `2px solid ${status === v ? C.green : C.border}`,
                      background: status === v ? '#EAF7E0' : C.card,
                    }}>
                      <p style={{ fontWeight: 700, color: status === v ? C.green : C.text, margin: '0 0 3px', fontSize: 14 }}>{l}</p>
                      <p style={{ fontSize: 11, color: C.muted, margin: 0 }}>{desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── PREVIEW PANEL ── */}
        {showPreview && (
          <div style={{ width: 380, flexShrink: 0, position: 'sticky', top: 100 }}>
            {/* Device toggle */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 16 }}>
              {([['mobile','📱','موبايل'],['desktop','🖥️','ديسكتوب']] as const).map(([m, icon, label]) => (
                <button key={m} onClick={() => setPreviewMode(m)} style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px',
                  borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13,
                  border: `2px solid ${previewMode === m ? C.navy : C.border}`,
                  background: previewMode === m ? C.navy : C.card,
                  color: previewMode === m ? '#fff' : C.text,
                  transition: 'all 0.15s'
                }}>
                  {/* Mobile icon SVG */}
                  {m === 'mobile' ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
                      <line x1="12" y1="18" x2="12.01" y2="18"/>
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                      <line x1="8" y1="21" x2="16" y2="21"/>
                      <line x1="12" y1="17" x2="12" y2="21"/>
                    </svg>
                  )}
                  {label}
                </button>
              ))}
            </div>

            {/* Preview label */}
            <p style={{ textAlign: 'center', fontSize: 11, color: C.muted, marginBottom: 12, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              معاينة مباشرة
            </p>

            <EventPreview {...previewProps} mode={previewMode} />
          </div>
        )}
      </div>

      {/* ── Bottom nav ── */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: C.card, borderTop: `1px solid ${C.border}`,
        padding: '12px 28px', display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', zIndex: 20, direction: 'rtl'
      }}>
        <button onClick={() => setStep(s => Math.max(1,s-1))} disabled={step===1} style={{
          padding: '10px 22px', border: `1px solid ${C.border}`, borderRadius: 6,
          background: C.card, cursor: step===1?'not-allowed':'pointer',
          color: step===1?C.muted:C.text, fontWeight: 600, fontSize: 13,
          opacity: step===1?0.4:1
        }}>← السابق</button>

        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {[1,2,3].map(n => (
            <div key={n} style={{
              width: n===step?22:7, height: 7, borderRadius: 50,
              background: n<step?C.green:n===step?C.orange:C.border,
              transition: 'all 0.3s'
            }}/>
          ))}
        </div>

        {step < 3 ? (
          <button onClick={() => setStep(s => Math.min(3,s+1))} style={{
            padding: '10px 26px', border: 'none', borderRadius: 6,
            background: C.orange, color: '#fff', cursor: 'pointer',
            fontWeight: 700, fontSize: 13,
          }}>التالي ←</button>
        ) : (
          <button onClick={publish} disabled={saving} style={{
            padding: '10px 26px', border: 'none', borderRadius: 6,
            background: saved?C.green:C.orange, color: '#fff',
            cursor: saving?'wait':'pointer', fontWeight: 700, fontSize: 13,
            transition: 'background 0.3s'
          }}>
            {saving?'جاري الحفظ...':saved?'✓ تم!':status==='published'?'🚀 نشر':'💾 حفظ كمسودة'}
          </button>
        )}
      </div>
    </div>
  )
}
