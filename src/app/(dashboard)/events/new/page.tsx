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
  muted: '#6F7287', border: '#DBDAE3', bg: '#FAFAFA', card: '#FFFFFF',
  green: '#3A7D0A',
}

const STEPS = [
  { id: 1, label: 'بناء صفحة الفعالية', desc: 'أضف تفاصيل فعالتك' },
  { id: 2, label: 'إضافة التذاكر', desc: 'حدد أنواع التذاكر والأسعار' },
  { id: 3, label: 'نشر الفعالية', desc: 'راجع وانشر' },
]

const EVENT_TYPES = [
  'مؤتمر وندوة','مهرجان وحفل','معرض وملتقى','دورة تدريبية','ورشة عمل',
  'رياضة ونشاط','فن وثقافة','تكنولوجيا','أعمال وتجارة','طعام وشراب','أخرى'
]

const FAQ_EXAMPLES = [
  { q: 'كيف يمكنني الوصول إلى مكان الفعالية؟', a: '' },
  { q: 'هل يوجد انتظار للسيارات؟', a: '' },
]

type Ticket = { id: number; name: string; type: 'free' | 'paid'; price: string; qty: string; description: string }
type Faq    = { q: string; a: string }

export default function NewEventPage() {
  const router = useRouter()
  const [step, setStep]       = useState(1)
  const [saving, setSaving]   = useState(false)
  const [saved, setSaved]     = useState(false)

  // Step 1 fields
  const [title, setTitle]           = useState('')
  const [subtitle, setSubtitle]     = useState('')
  const [eventType, setEventType]   = useState('')
  const [startDate, setStartDate]   = useState('')
  const [startTime, setStartTime]   = useState('10:00')
  const [endDate, setEndDate]       = useState('')
  const [endTime, setEndTime]       = useState('12:00')
  const [locationType, setLocType]  = useState<'venue' | 'online'>('venue')
  const [location, setLocation]     = useState('')
  const [capacity, setCapacity]     = useState('')
  const [description, setDescription] = useState('')
  const [highlights, setHighlights] = useState('')
  const [ageInfo, setAgeInfo]       = useState('')
  const [doorTime, setDoorTime]     = useState('')
  const [parking, setParking]       = useState('')
  const [faqs, setFaqs]             = useState<Faq[]>([])
  const [showFaqTip, setShowFaqTip] = useState(true)

  // Step 2 fields
  const [tickets, setTickets] = useState<Ticket[]>([
    { id: 1, name: 'تذكرة عامة', type: 'free', price: '', qty: '100', description: '' }
  ])

  // Step 3 fields
  const [visibility, setVisibility] = useState<'public' | 'private'>('public')
  const [status, setStatus]         = useState<'draft' | 'published'>('draft')

  function addTicket() {
    setTickets(t => [...t, { id: Date.now(), name: '', type: 'free', price: '', qty: '', description: '' }])
  }

  function updateTicket(id: number, field: keyof Ticket, val: string) {
    setTickets(t => t.map(tk => tk.id === id ? { ...tk, [field]: val } : tk))
  }

  function removeTicket(id: number) {
    setTickets(t => t.filter(tk => tk.id !== id))
  }

  function addFaq() {
    setFaqs(f => [...f, { q: '', a: '' }])
  }

  function updateFaq(i: number, field: 'q' | 'a', val: string) {
    setFaqs(f => f.map((faq, idx) => idx === i ? { ...faq, [field]: val } : faq))
  }

  function removeFaq(i: number) {
    setFaqs(f => f.filter((_, idx) => idx !== i))
  }

  async function publish() {
    if (!title.trim()) { alert('يرجى إدخال اسم الفعالية'); setStep(1); return }
    if (!startDate)    { alert('يرجى تحديد تاريخ البداية'); setStep(1); return }
    setSaving(true)
    try {
      const { data: { user } } = await sb.auth.getUser()
      const startDT = startDate && startTime ? `${startDate}T${startTime}:00` : startDate
      const endDT   = endDate   && endTime   ? `${endDate}T${endTime}:00`   : endDate || null

      const { data, error } = await sb.from('events').insert({
        title:       title.trim(),
        description: [subtitle, description].filter(Boolean).join('\n\n'),
        location:    locationType === 'online' ? 'عبر الإنترنت' : location,
        start_date:  startDT,
        end_date:    endDT,
        capacity:    capacity ? parseInt(capacity) : null,
        status,
        is_public:   visibility === 'public',
        created_by:  user?.id,
      }).select('id').single()

      if (error) throw error
      setSaved(true)
      setTimeout(() => router.push(`/events/${data.id}`), 800)
    } catch (e: any) {
      alert('خطأ: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  // ─── Styles ───────────────────────────────────────────────────────
  const inp: React.CSSProperties = {
    width: '100%', padding: '12px 14px',
    border: `1px solid ${C.border}`, borderRadius: 8,
    fontSize: 15, outline: 'none', fontFamily: 'inherit',
    color: C.text, background: C.card, boxSizing: 'border-box',
    transition: 'border-color 0.15s',
  }
  const label: React.CSSProperties = {
    fontSize: 13, fontWeight: 600, color: C.text, display: 'block', marginBottom: 6
  }
  const sectionTitle: React.CSSProperties = {
    fontSize: 18, fontWeight: 700, color: C.navy, margin: '0 0 4px'
  }
  const sectionDesc: React.CSSProperties = {
    fontSize: 13, color: C.muted, margin: '0 0 16px'
  }
  const card: React.CSSProperties = {
    background: C.card, border: `1px solid ${C.border}`,
    borderRadius: 12, padding: '24px', marginBottom: 16,
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, direction: 'rtl' }}>

      {/* ── Top bar ── */}
      <div style={{ background: C.card, borderBottom: `1px solid ${C.border}`, padding: '0 24px', position: 'sticky', top: 0, zIndex: 30 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, height: 56, maxWidth: 900, margin: '0 auto' }}>
          <Link href="/events" style={{ color: C.muted, textDecoration: 'none', fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
            ← العودة للفعاليات
          </Link>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: C.navy }}>
              {title || 'فعالية بدون عنوان'}
            </span>
          </div>
          <span style={{ fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 4, background: '#F8F7FA', color: C.muted }}>
            مسودة
          </span>
        </div>

        {/* Step progress */}
        <div style={{ display: 'flex', borderTop: `1px solid ${C.border}`, maxWidth: 900, margin: '0 auto' }}>
          {STEPS.map(s => (
            <button key={s.id} onClick={() => setStep(s.id)} style={{
              flex: 1, padding: '10px 16px', background: 'none', border: 'none',
              cursor: 'pointer', textAlign: 'center', borderBottom: step === s.id ? `2px solid ${C.orange}` : '2px solid transparent',
              color: step === s.id ? C.orange : step > s.id ? C.green : C.muted,
              transition: 'all 0.15s', marginBottom: -1
            }}>
              <div style={{ fontSize: 12, fontWeight: 700 }}>
                {step > s.id ? '✓ ' : ''}{s.id}. {s.label}
              </div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>{s.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '28px 24px 80px' }}>

        {/* ═══════════ STEP 1 ═══════════ */}
        {step === 1 && (
          <>
            {/* Banner upload */}
            <div style={{ ...card, textAlign: 'center', background: '#F3F0F8', border: '2px dashed #B4A7D6', cursor: 'pointer', padding: '40px 24px', marginBottom: 16 }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🖼️</div>
              <p style={{ fontWeight: 600, color: C.navy, margin: '0 0 4px', fontSize: 15 }}>رفع صورة أو فيديو</p>
              <p style={{ fontSize: 12, color: C.muted, margin: 0 }}>يُوصى بـ 2160 × 1080 بكسل — PNG أو JPG أو GIF</p>
            </div>

            {/* Event title */}
            <div style={card}>
              <p style={sectionTitle}>تفاصيل الفعالية</p>
              <p style={sectionDesc}>أضف عنواناً واضحاً ومميزاً لفعالتك</p>

              <div style={{ marginBottom: 16 }}>
                <label style={label}>اسم الفعالية *</label>
                <input value={title} onChange={e => setTitle(e.target.value)}
                  placeholder="اسم قصير وواضح عن فعالتك"
                  style={{ ...inp, fontSize: 18, fontWeight: 600 }} />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={label}>وصف مختصر <span style={{ color: C.muted, fontWeight: 400 }}>(اختياري)</span></label>
                <input value={subtitle} onChange={e => setSubtitle(e.target.value)}
                  placeholder="جملة تلخص فعالتك..."
                  style={inp} />
              </div>

              <div>
                <label style={label}>نوع الفعالية</label>
                <select value={eventType} onChange={e => setEventType(e.target.value)}
                  style={{ ...inp }}>
                  <option value="">اختر نوع الفعالية</option>
                  {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            {/* Date & Time */}
            <div style={card}>
              <p style={sectionTitle}>التاريخ والوقت</p>
              <p style={sectionDesc}>متى ستقام الفعالية؟</p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={label}>تاريخ البداية *</label>
                  <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={inp} />
                </div>
                <div>
                  <label style={label}>وقت البداية</label>
                  <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} style={inp} />
                </div>
                <div>
                  <label style={label}>تاريخ النهاية</label>
                  <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={inp} />
                </div>
                <div>
                  <label style={label}>وقت النهاية</label>
                  <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} style={inp} />
                </div>
              </div>
            </div>

            {/* Location */}
            <div style={card}>
              <p style={sectionTitle}>الموقع</p>
              <p style={sectionDesc}>أين ستُقام الفعالية؟</p>

              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                {[['venue', '📍 مكان فعلي'], ['online', '💻 عبر الإنترنت']].map(([v, l]) => (
                  <button key={v} onClick={() => setLocType(v as any)} style={{
                    flex: 1, padding: '10px', borderRadius: 8, cursor: 'pointer',
                    border: `2px solid ${locationType === v ? C.orange : C.border}`,
                    background: locationType === v ? '#FEF0ED' : C.card,
                    color: locationType === v ? C.orange : C.text,
                    fontWeight: 600, fontSize: 14, transition: 'all 0.15s'
                  }}>{l}</button>
                ))}
              </div>

              {locationType === 'venue' && (
                <div>
                  <label style={label}>عنوان المكان</label>
                  <input value={location} onChange={e => setLocation(e.target.value)}
                    placeholder="المدينة، الحي، اسم المكان..."
                    style={inp} />
                </div>
              )}

              <div style={{ marginTop: 12 }}>
                <label style={label}>الطاقة الاستيعابية</label>
                <input type="number" value={capacity} onChange={e => setCapacity(e.target.value)}
                  placeholder="عدد الزوار المتوقع"
                  style={{ ...inp, maxWidth: 200 }} />
              </div>
            </div>

            {/* Description */}
            <div style={card}>
              <p style={sectionTitle}>نبذة عن الفعالية</p>
              <p style={sectionDesc}>أخبر الزوار بما يمكن توقعه — التفاصيل، الجدول الزمني، المعلومات المهمة</p>
              <textarea value={description} onChange={e => setDescription(e.target.value)}
                placeholder="اكتب هنا كل ما تريد أن يعرفه الزائر عن فعالتك..."
                rows={6} style={{ ...inp, resize: 'vertical', lineHeight: 1.6 }} />
            </div>

            {/* Good to know */}
            <div style={card}>
              <p style={sectionTitle}>معلومات مهمة</p>
              <p style={sectionDesc}>أضف تفاصيل تساعد الزوار على الاستعداد</p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[
                  { label: '🎂 الفئة العمرية', val: ageInfo, set: setAgeInfo, ph: 'مثال: للجميع / 18+' },
                  { label: '🚪 وقت الدخول', val: doorTime, set: setDoorTime, ph: 'مثال: قبل الموعد بـ 30 دقيقة' },
                  { label: '🅿️ ظروف الانتظار', val: parking, set: setParking, ph: 'مثال: مواقف مجانية متاحة' },
                  { label: '✨ أبرز ما في الفعالية', val: highlights, set: setHighlights, ph: 'ما الذي يميز فعالتك؟' },
                ].map(({ label: l, val, set, ph }) => (
                  <div key={l}>
                    <label style={label}>{l}</label>
                    <input value={val} onChange={e => set(e.target.value)} placeholder={ph} style={inp} />
                  </div>
                ))}
              </div>
            </div>

            {/* FAQ */}
            <div style={card}>
              <p style={sectionTitle}>الأسئلة الشائعة</p>
              {showFaqTip && (
                <div style={{ background: '#FFFBEC', border: '1px solid #F5C842', borderRadius: 8, padding: '10px 14px', marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, color: '#7A6000' }}>💡 الفعاليات التي تحتوي على FAQ تحصل على 8% حركة مرور أعلى</span>
                  <button onClick={() => setShowFaqTip(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, fontSize: 16 }}>×</button>
                </div>
              )}

              {faqs.map((faq, i) => (
                <div key={i} style={{ marginBottom: 12, padding: 14, background: '#F9F8FC', borderRadius: 8, border: `1px solid ${C.border}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: C.muted }}>سؤال {i + 1}</span>
                    <button onClick={() => removeFaq(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626', fontSize: 13 }}>حذف</button>
                  </div>
                  <input value={faq.q} onChange={e => updateFaq(i, 'q', e.target.value)}
                    placeholder="السؤال..." style={{ ...inp, marginBottom: 8 }} />
                  <textarea value={faq.a} onChange={e => updateFaq(i, 'a', e.target.value)}
                    placeholder="الإجابة..." rows={2} style={{ ...inp, resize: 'vertical' }} />
                </div>
              ))}

              <button onClick={addFaq} style={{
                width: '100%', padding: '10px', border: `2px dashed ${C.border}`, borderRadius: 8,
                background: 'none', cursor: 'pointer', color: C.orange, fontWeight: 600, fontSize: 14
              }}>+ إضافة سؤال</button>
            </div>
          </>
        )}

        {/* ═══════════ STEP 2 ═══════════ */}
        {step === 2 && (
          <div>
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: 24, fontWeight: 800, color: C.navy, margin: '0 0 6px' }}>التذاكر</h2>
              <p style={{ color: C.muted, fontSize: 14 }}>حدد أنواع التذاكر والأسعار لفعالتك</p>
            </div>

            {tickets.map((tk, i) => (
              <div key={tk.id} style={{ ...card, position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: C.navy }}>تذكرة {i + 1}</span>
                  {tickets.length > 1 && (
                    <button onClick={() => removeTicket(tk.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626', fontSize: 13, fontWeight: 600 }}>
                      حذف التذكرة
                    </button>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12, marginBottom: 12 }}>
                  <div>
                    <label style={label}>اسم التذكرة</label>
                    <input value={tk.name} onChange={e => updateTicket(tk.id, 'name', e.target.value)}
                      placeholder="مثال: تذكرة عامة، VIP..." style={inp} />
                  </div>
                  <div>
                    <label style={label}>الكمية المتاحة</label>
                    <input type="number" value={tk.qty} onChange={e => updateTicket(tk.id, 'qty', e.target.value)}
                      placeholder="100" style={inp} />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                  {[['free', 'مجاني'], ['paid', 'مدفوع']].map(([v, l]) => (
                    <button key={v} onClick={() => updateTicket(tk.id, 'type', v)} style={{
                      padding: '8px 20px', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 13,
                      border: `2px solid ${tk.type === v ? C.orange : C.border}`,
                      background: tk.type === v ? '#FEF0ED' : C.card,
                      color: tk.type === v ? C.orange : C.text, transition: 'all 0.15s'
                    }}>{l}</button>
                  ))}
                </div>

                {tk.type === 'paid' && (
                  <div style={{ marginBottom: 12 }}>
                    <label style={label}>السعر (ر.س)</label>
                    <input type="number" value={tk.price} onChange={e => updateTicket(tk.id, 'price', e.target.value)}
                      placeholder="0.00" style={{ ...inp, maxWidth: 160 }} />
                  </div>
                )}

                <div>
                  <label style={label}>وصف التذكرة <span style={{ color: C.muted, fontWeight: 400 }}>(اختياري)</span></label>
                  <input value={tk.description} onChange={e => updateTicket(tk.id, 'description', e.target.value)}
                    placeholder="ما الذي تشمله هذه التذكرة؟" style={inp} />
                </div>
              </div>
            ))}

            <button onClick={addTicket} style={{
              width: '100%', padding: '14px', border: `2px dashed ${C.border}`, borderRadius: 10,
              background: 'none', cursor: 'pointer', color: C.orange, fontWeight: 700, fontSize: 15
            }}>+ إضافة نوع تذكرة آخر</button>
          </div>
        )}

        {/* ═══════════ STEP 3 ═══════════ */}
        {step === 3 && (
          <div>
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: 24, fontWeight: 800, color: C.navy, margin: '0 0 6px' }}>نشر الفعالية</h2>
              <p style={{ color: C.muted, fontSize: 14 }}>راجع الإعدادات ثم انشر فعالتك</p>
            </div>

            {/* Summary card */}
            <div style={{ ...card, border: `2px solid ${C.border}` }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: C.navy, margin: '0 0 16px' }}>ملخص الفعالية</h3>
              <div style={{ display: 'grid', gap: 10 }}>
                {[
                  ['📌 الاسم', title || '—'],
                  ['📅 التاريخ', startDate ? `${startDate} — ${startTime}` : '—'],
                  ['📍 الموقع', locationType === 'online' ? 'عبر الإنترنت' : location || '—'],
                  ['🎟 التذاكر', tickets.map(t => `${t.name || 'بدون اسم'} (${t.type === 'free' ? 'مجاني' : t.price + ' ر.س'})`).join('، ')],
                  ['👥 الطاقة', capacity || '—'],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', gap: 12, padding: '8px 0', borderBottom: `1px solid ${C.border}` }}>
                    <span style={{ fontSize: 13, color: C.muted, minWidth: 120 }}>{k}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Visibility */}
            <div style={card}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: C.navy, margin: '0 0 12px' }}>رؤية الفعالية</h3>
              <div style={{ display: 'flex', gap: 10 }}>
                {[['public', '🌐 عامة', 'تظهر في نتائج البحث'], ['private', '🔒 خاصة', 'يصل إليها من يملك الرابط']].map(([v, l, desc]) => (
                  <div key={v} onClick={() => setVisibility(v as any)} style={{
                    flex: 1, padding: 16, borderRadius: 10, cursor: 'pointer',
                    border: `2px solid ${visibility === v ? C.orange : C.border}`,
                    background: visibility === v ? '#FEF0ED' : C.card, transition: 'all 0.15s'
                  }}>
                    <p style={{ fontWeight: 700, color: visibility === v ? C.orange : C.text, margin: '0 0 4px', fontSize: 15 }}>{l}</p>
                    <p style={{ fontSize: 12, color: C.muted, margin: 0 }}>{desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Publish status */}
            <div style={card}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: C.navy, margin: '0 0 12px' }}>حالة النشر</h3>
              <div style={{ display: 'flex', gap: 10 }}>
                {[['draft', '📝 مسودة', 'احفظ للمراجعة لاحقاً'], ['published', '🚀 نشر الآن', 'اجعل الفعالية متاحة فوراً']].map(([v, l, desc]) => (
                  <div key={v} onClick={() => setStatus(v as any)} style={{
                    flex: 1, padding: 16, borderRadius: 10, cursor: 'pointer',
                    border: `2px solid ${status === v ? C.green : C.border}`,
                    background: status === v ? '#EAF7E0' : C.card, transition: 'all 0.15s'
                  }}>
                    <p style={{ fontWeight: 700, color: status === v ? C.green : C.text, margin: '0 0 4px', fontSize: 15 }}>{l}</p>
                    <p style={{ fontSize: 12, color: C.muted, margin: 0 }}>{desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Navigation buttons ── */}
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          background: C.card, borderTop: `1px solid ${C.border}`,
          padding: '14px 32px', display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', zIndex: 20, direction: 'rtl'
        }}>
          <button onClick={() => setStep(s => Math.max(1, s - 1))} style={{
            padding: '10px 24px', border: `1px solid ${C.border}`, borderRadius: 6,
            background: C.card, cursor: step === 1 ? 'not-allowed' : 'pointer',
            color: step === 1 ? C.muted : C.text, fontWeight: 600, fontSize: 14,
            opacity: step === 1 ? 0.4 : 1
          }} disabled={step === 1}>
            ← السابق
          </button>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {[1, 2, 3].map(n => (
              <div key={n} style={{
                width: n === step ? 24 : 8, height: 8, borderRadius: 50,
                background: n < step ? C.green : n === step ? C.orange : C.border,
                transition: 'all 0.3s'
              }} />
            ))}
          </div>

          {step < 3 ? (
            <button onClick={() => setStep(s => Math.min(3, s + 1))} style={{
              padding: '10px 28px', border: 'none', borderRadius: 6,
              background: C.orange, color: '#fff', cursor: 'pointer',
              fontWeight: 700, fontSize: 14, boxShadow: '0 2px 8px rgba(240,85,55,0.35)'
            }}>
              التالي ←
            </button>
          ) : (
            <button onClick={publish} disabled={saving} style={{
              padding: '10px 28px', border: 'none', borderRadius: 6,
              background: saved ? C.green : C.orange, color: '#fff',
              cursor: saving ? 'wait' : 'pointer', fontWeight: 700, fontSize: 14,
              boxShadow: '0 2px 8px rgba(240,85,55,0.35)', transition: 'background 0.3s'
            }}>
              {saving ? 'جاري الحفظ...' : saved ? '✓ تم!' : status === 'published' ? '🚀 نشر الفعالية' : '💾 حفظ كمسودة'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
