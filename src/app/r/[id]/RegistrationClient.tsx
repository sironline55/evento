'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect, useMemo } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useParams } from 'next/navigation'
import { WorkerOptIn } from '@/components/workers/WorkerOptIn'
import { QRService } from '@/services/QRService'
import QRCode from 'qrcode'

const C = {
  navy:'#1E0A3C', orange:'#F05537', green:'#16a34a',
  red:'#dc2626', muted:'#6b7280', border:'#e5e7eb',
}

type Ticket = { name:string; type:'free'|'paid'; price:number; qty:number|null; desc:string|null }
type CouponResult = {
  id: string; code:string; discount_type:'percentage'|'fixed'; discount_value:number
  max_uses:number|null; used_count:number; min_ticket_price:number|null; expires_at:string|null
}

export default function RegistrationClient() {
  const sb = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), [])

  const { id } = useParams()
  const [ev, setEv]         = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [sub, setSub]       = useState(false)
  const [done, setDone]     = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [regId, setRegId]   = useState('')
  const [guestName, setGuestName] = useState('')
  const [guestPhone, setGuestPhone] = useState('')
  const [guestEmail, setGuestEmail] = useState('')

  // Form fields
  const [form, setForm] = useState({ full_name:'', email:'', phone:'', company:'', job_title:'' })

  // Ticket selection
  const [selectedTicket, setSelectedTicket] = useState<Ticket|null>(null)

  // Coupon
  const [couponCode, setCouponCode]       = useState('')
  const [couponLoading, setCouponLoading] = useState(false)
  const [coupon, setCoupon]               = useState<CouponResult|null>(null)
  const [couponError, setCouponError]     = useState('')
  const [couponApplied, setCouponApplied] = useState(false)

  useEffect(() => {
    sb.from('events')
      .select('id,title,start_date,location,status,tickets,cancellation_policy,cancellation_days_before,refund_percentage,cancellation_notes')
      .eq('id', id).single()
      .then(({ data }) => {
        setEv(data)
        // Auto-select first ticket
        if (data?.tickets?.length) setSelectedTicket(data.tickets[0])
        setLoading(false)
      })
  }, [id])

  // ── Price calc ──────────────────────────────────
  const basePrice   = selectedTicket?.type === 'paid' ? (selectedTicket.price || 0) : 0
  const isFree      = basePrice === 0

  function calcDiscount(): number {
    if (!couponApplied || !coupon || isFree) return 0
    if (coupon.discount_type === 'percentage') return Math.min(basePrice, basePrice * (coupon.discount_value / 100))
    return Math.min(basePrice, coupon.discount_value)
  }
  const discount   = calcDiscount()
  const finalPrice = Math.max(0, basePrice - discount)

  // ── Coupon validation ───────────────────────────
  async function applyCoupon() {
    if (!couponCode.trim()) return
    setCouponLoading(true); setCouponError(''); setCoupon(null); setCouponApplied(false)
    try {
      const { data, error } = await sb.from('coupons')
        .select('*')
        .eq('code', couponCode.toUpperCase().trim())
        .eq('is_active', true)
        .single()

      if (error || !data) { setCouponError('الكوبون غير صحيح أو غير موجود'); return }

      // Check event scope
      if (data.event_id && data.event_id !== id) { setCouponError('هذا الكوبون خاص بفعالية أخرى'); return }

      // Check expiry
      if (data.expires_at && new Date(data.expires_at) < new Date()) { setCouponError('انتهت صلاحية هذا الكوبون'); return }

      // Check max uses
      if (data.max_uses !== null && data.used_count >= data.max_uses) { setCouponError('تم استنفاد الحد الأقصى لاستخدام هذا الكوبون'); return }

      // Check min price
      if (data.min_ticket_price !== null && basePrice < data.min_ticket_price) {
        setCouponError(`هذا الكوبون يتطلب سعر تذكرة لا يقل عن ${data.min_ticket_price} ر.س`); return
      }

      setCoupon(data); setCouponApplied(true)
    } finally {
      setCouponLoading(false)
    }
  }

  function removeCoupon() { setCoupon(null); setCouponApplied(false); setCouponCode(''); setCouponError('') }

  // ── Submit ─────────────────────────────────────
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setSub(true)
    try {
      const reg = await QRService.createRegistration({
        event_id: id as string,
        guest_name: form.full_name,
        guest_email: form.email || undefined,
        guest_phone: form.phone || undefined,
        source: 'form',
        notes: [
          form.company,
          form.job_title,
          selectedTicket ? `تذكرة: ${selectedTicket.name}` : null,
          couponApplied && coupon ? `كوبون: ${coupon.code} (خصم ${discount.toFixed(0)} ر.س)` : null,
        ].filter(Boolean).join(' — ') || undefined
      })

      // Record coupon use + increment count
      if (couponApplied && coupon) {
        const { data:{ user } } = await sb.auth.getUser()
        await Promise.all([
          sb.from('coupon_uses').insert({
            coupon_id: coupon.id,
            registration_id: reg.id,
            user_id: user?.id ?? null,
            discount_amount: discount,
          }),
          sb.rpc('increment_coupon_uses', { coupon_id: coupon.id }).catch(() =>
            sb.from('coupons').update({ used_count: coupon.used_count + 1 }).eq('id', coupon.id)
          )
        ])
      }

      const qrUrl = await QRCode.toDataURL(reg.qr_code || reg.id, {
        width: 250, margin: 2,
        color: { dark: '#1a1a1a', light: '#FFFFFF' },
        errorCorrectionLevel: 'H',
      })
      setRegId(reg.id); setGuestName(form.full_name)
      setGuestPhone(form.phone); setGuestEmail(form.email)
      setQrDataUrl(qrUrl); setDone(true)

      if (form.email) {
        fetch(process.env.NEXT_PUBLIC_SUPABASE_URL + '/functions/v1/send-registration-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '' },
          body: JSON.stringify({ registration_id: reg.id }),
        }).catch(() => {})
      }
    } catch (err: any) {
      alert('خطأ: ' + err.message); setSub(false)
    }
  }

  const inp: React.CSSProperties = {
    width:'100%', padding:'11px 14px', border:`1px solid ${C.border}`,
    borderRadius:10, fontSize:15, boxSizing:'border-box', outline:'none',
    background:'#fff', fontFamily:'inherit', color:'#111',
  }

  // ── Loading / not found ────────────────────────
  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <p style={{ color:C.muted }}>جاري التحميل...</p>
    </div>
  )
  if (!ev) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center' }} dir="rtl">
      <h2 style={{ color:C.muted }}>الفعالية غير متاحة</h2>
    </div>
  )

  // ── Success screen ────────────────────────────
  if (done) return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#FBF8F5,#F3F0F8)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }} dir="rtl">
      <div style={{ background:'#fff', borderRadius:20, padding:32, maxWidth:440, width:'100%', boxShadow:'0 8px 40px rgba(0,0,0,0.08)', textAlign:'center' }}>
        <div style={{ fontSize:64, marginBottom:8 }}>🎉</div>
        <h2 style={{ fontSize:22, fontWeight:700, margin:'0 0 4px' }}>تم تسجيلك بنجاح!</h2>
        <p style={{ color:C.muted, margin:'0 0 24px', fontSize:14 }}>{ev.title}</p>
        {couponApplied && coupon && (
          <div style={{ background:'#DCFCE7', borderRadius:10, padding:'10px 14px', marginBottom:16, fontSize:13, color:'#166534', fontWeight:600 }}>
            ✅ تم تطبيق خصم {coupon.discount_type==='percentage'?`${coupon.discount_value}%`:`${coupon.discount_value} ر.س`} بكوبون {coupon.code}
          </div>
        )}
        <div style={{ background:'#f9fafb', borderRadius:16, padding:20, marginBottom:20, display:'inline-block' }}>
          {qrDataUrl && <img src={qrDataUrl} alt="QR Code" style={{ width:200, height:200, display:'block' }}/>}
          <p style={{ margin:'8px 0 0', fontSize:12, color:C.muted }}>امسح هذا الرمز عند الدخول</p>
        </div>
        <div style={{ background:'#FBF8F5', borderRadius:14, padding:16, marginBottom:20, textAlign:'right' }}>
          <p style={{ fontWeight:600, margin:'0 0 4px', color:'#C45800' }}>مرحباً {guestName} 👋</p>
          {guestPhone && <p style={{ margin:0, fontSize:13, color:'#C45800' }}>📱 {guestPhone}</p>}
        </div>
        <button onClick={() => { const a=document.createElement('a'); a.download='qr-code.png'; a.href=qrDataUrl; a.click() }}
          style={{ background:C.orange, color:'#fff', padding:'10px 24px', borderRadius:10, border:'none', cursor:'pointer', fontSize:14, fontWeight:600, marginBottom:16, fontFamily:'inherit' }}>
          ⬇️ تحميل QR Code
        </button>
        <WorkerOptIn attendeeId={regId} attendeeName={guestName} attendeePhone={guestPhone} attendeeEmail={guestEmail}/>
      </div>
    </div>
  )

  // ── Registration form ─────────────────────────
  const tickets: Ticket[] = ev.tickets || []
  const cancelPolicy = ev.cancellation_policy || 'no_refund'
  const policyConfig: Record<string,{icon:string; text:string; bg:string; color:string}> = {
    no_refund:     { icon:'🚫', text:'لا يوجد استرداد — التسجيل نهائي', bg:'#FEE2E2', color:'#991B1B' },
    full_refund:   { icon:'✅', text:`استرداد كامل${ev.cancellation_days_before?' قبل '+ev.cancellation_days_before+' يوم':''}`, bg:'#DCFCE7', color:'#166534' },
    partial_refund:{ icon:'⚡', text:`استرداد ${ev.refund_percentage||0}%${ev.cancellation_days_before?' قبل '+ev.cancellation_days_before+' يوم':''}`, bg:'#FEF3C7', color:'#92400E' },
    custom:        { icon:'📝', text: ev.cancellation_notes || 'راجع شروط الإلغاء', bg:'#EFF6FF', color:'#1D4ED8' },
  }
  const policy = policyConfig[cancelPolicy] || policyConfig.no_refund

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#FBF8F5,#F3F0F8)', padding:16 }} dir="rtl">
      <div style={{ maxWidth:480, margin:'0 auto', paddingTop:32 }}>

        {/* Event header */}
        <div style={{ background:'#fff', borderRadius:20, overflow:'hidden', boxShadow:'0 8px 40px rgba(0,0,0,0.08)', marginBottom:16 }}>
          <div style={{ background:`linear-gradient(135deg,${C.orange},${C.navy})`, padding:'28px 24px', color:'#fff' }}>
            <div style={{ fontSize:22, marginBottom:8 }}>🎪</div>
            <h1 style={{ fontSize:22, fontWeight:700, margin:'0 0 6px' }}>{ev.title}</h1>
            {ev.location  && <p style={{ margin:'0 0 4px', opacity:0.85, fontSize:14 }}>📍 {ev.location}</p>}
            {ev.start_date && <p style={{ margin:0, opacity:0.85, fontSize:14 }}>📅 {new Date(ev.start_date).toLocaleDateString('ar-SA', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}</p>}
          </div>

          <form onSubmit={submit} style={{ padding:24, display:'flex', flexDirection:'column', gap:14 }}>
            <h2 style={{ fontSize:18, fontWeight:700, margin:'0 0 4px', color:C.navy }}>سجّل حضورك</h2>

            {/* ── Ticket selection ── */}
            {tickets.length > 1 && (
              <div>
                <label style={{ fontSize:13, fontWeight:600, display:'block', marginBottom:8, color:'#374151' }}>🎟 اختر نوع التذكرة</label>
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {tickets.map((tk, i) => (
                    <div key={i} onClick={() => { setSelectedTicket(tk); removeCoupon() }} style={{
                      padding:'12px 14px', borderRadius:10, cursor:'pointer',
                      border:`2px solid ${selectedTicket?.name===tk.name?(tk.type==='paid'?C.orange:C.green):C.border}`,
                      background: selectedTicket?.name===tk.name ? (tk.type==='paid'?'#FEF0ED':'#F0FDF4') : '#fff',
                      display:'flex', justifyContent:'space-between', alignItems:'center',
                      transition:'all 0.15s',
                    }}>
                      <div>
                        <span style={{ fontWeight:600, fontSize:14, color:'#111' }}>{tk.name}</span>
                        {tk.desc && <p style={{ margin:'2px 0 0', fontSize:12, color:C.muted }}>{tk.desc}</p>}
                      </div>
                      <span style={{ fontWeight:700, fontSize:16, color: tk.type==='free'?C.green:C.orange }}>
                        {tk.type==='free' ? 'مجاني' : `${tk.price} ر.س`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Personal info ── */}
            <div>
              <label style={{ fontSize:13, fontWeight:500, display:'block', marginBottom:5 }}>الاسم الكامل *</label>
              <input value={form.full_name} onChange={e=>setForm({...form,full_name:e.target.value})} required placeholder="محمد أحمد" style={inp}/>
            </div>
            <div>
              <label style={{ fontSize:13, fontWeight:500, display:'block', marginBottom:5 }}>البريد الإلكتروني</label>
              <input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="example@email.com" style={inp}/>
            </div>
            <div>
              <label style={{ fontSize:13, fontWeight:500, display:'block', marginBottom:5 }}>رقم الجوال</label>
              <input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="05xxxxxxxx" style={inp} type="tel"/>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <div>
                <label style={{ fontSize:13, fontWeight:500, display:'block', marginBottom:5 }}>الشركة</label>
                <input value={form.company} onChange={e=>setForm({...form,company:e.target.value})} placeholder="اختياري" style={inp}/>
              </div>
              <div>
                <label style={{ fontSize:13, fontWeight:500, display:'block', marginBottom:5 }}>المسمى</label>
                <input value={form.job_title} onChange={e=>setForm({...form,job_title:e.target.value})} placeholder="اختياري" style={inp}/>
              </div>
            </div>

            {/* ── Coupon section (paid tickets only) ── */}
            {!isFree && (
              <div style={{ background:'#F9F8FC', borderRadius:12, padding:'14px', border:`1px solid ${C.border}` }}>
                <label style={{ fontSize:13, fontWeight:600, display:'block', marginBottom:8, color:'#374151' }}>🏷️ كوبون خصم (اختياري)</label>
                {!couponApplied ? (
                  <>
                    <div style={{ display:'flex', gap:8 }}>
                      <input
                        value={couponCode}
                        onChange={e => { setCouponCode(e.target.value.toUpperCase()); setCouponError('') }}
                        placeholder="أدخل كود الخصم"
                        maxLength={20}
                        style={{ ...inp, fontFamily:'monospace', fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', flex:1 }}
                        onKeyDown={e => e.key==='Enter' && (e.preventDefault(), applyCoupon())}
                      />
                      <button type="button" onClick={applyCoupon} disabled={couponLoading || !couponCode.trim()} style={{
                        padding:'11px 16px', background:C.navy, color:'#fff', border:'none',
                        borderRadius:10, cursor:'pointer', fontWeight:600, fontSize:13,
                        fontFamily:'inherit', opacity: (!couponCode.trim() || couponLoading) ? 0.5 : 1, whiteSpace:'nowrap',
                      }}>
                        {couponLoading ? '...' : 'تطبيق'}
                      </button>
                    </div>
                    {couponError && (
                      <p style={{ margin:'8px 0 0', fontSize:12, color:C.red, fontWeight:500 }}>❌ {couponError}</p>
                    )}
                  </>
                ) : coupon && (
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', background:'#DCFCE7', borderRadius:8, padding:'10px 12px' }}>
                    <div>
                      <code style={{ fontWeight:700, color:C.green, fontSize:14 }}>{coupon.code}</code>
                      <span style={{ fontSize:12, color:'#166534', marginRight:8 }}>
                        — خصم {coupon.discount_type==='percentage'?`${coupon.discount_value}%`:`${coupon.discount_value} ر.س`}
                      </span>
                    </div>
                    <button type="button" onClick={removeCoupon} style={{ background:'none', border:'none', cursor:'pointer', color:C.muted, fontSize:18, fontWeight:700, lineHeight:1 }}>×</button>
                  </div>
                )}
              </div>
            )}

            {/* ── Price summary ── */}
            {!isFree && (
              <div style={{ background:'#fff', border:`1px solid ${C.border}`, borderRadius:12, overflow:'hidden' }}>
                <div style={{ padding:'12px 16px', borderBottom:`1px solid ${C.border}`, display:'flex', justifyContent:'space-between', fontSize:14 }}>
                  <span style={{ color:C.muted }}>سعر التذكرة</span>
                  <span style={{ fontWeight:600 }}>{basePrice} ر.س</span>
                </div>
                {couponApplied && discount > 0 && (
                  <div style={{ padding:'12px 16px', borderBottom:`1px solid ${C.border}`, display:'flex', justifyContent:'space-between', fontSize:14 }}>
                    <span style={{ color:C.green }}>🏷️ خصم الكوبون</span>
                    <span style={{ fontWeight:600, color:C.green }}>− {discount.toFixed(2)} ر.س</span>
                  </div>
                )}
                <div style={{ padding:'12px 16px', display:'flex', justifyContent:'space-between', fontSize:16, fontWeight:700, background: finalPrice===0?'#F0FDF4':'#FEF0ED' }}>
                  <span>الإجمالي</span>
                  <span style={{ color: finalPrice===0?C.green:C.orange }}>
                    {finalPrice===0 ? 'مجاني 🎉' : `${finalPrice.toFixed(2)} ر.س`}
                  </span>
                </div>
              </div>
            )}

            {/* ── Cancellation policy badge ── */}
            <div style={{ display:'flex', alignItems:'flex-start', gap:8, padding:'10px 12px', borderRadius:10, background:policy.bg }}>
              <span style={{ fontSize:16, marginTop:1 }}>{policy.icon}</span>
              <div>
                <span style={{ fontSize:12, fontWeight:700, color:policy.color, display:'block' }}>سياسة الإلغاء</span>
                <span style={{ fontSize:12, color:policy.color }}>{policy.text}</span>
                {ev.cancellation_notes && cancelPolicy !== 'custom' && (
                  <span style={{ fontSize:11, color:policy.color, display:'block', marginTop:2, opacity:0.8 }}>{ev.cancellation_notes}</span>
                )}
              </div>
            </div>

            {/* ── Submit button ── */}
            <button type="submit" disabled={sub} style={{
              background: C.orange, color:'#fff', padding:'14px', borderRadius:12,
              border:'none', fontSize:16, fontWeight:700, cursor:'pointer',
              opacity:sub?0.7:1, fontFamily:'inherit', transition:'opacity 0.2s',
            }}>
              {sub ? 'جاري التسجيل...' : isFree ? 'تسجيل الحضور مجاناً ✓' : finalPrice===0 ? 'تأكيد التسجيل مجاناً ✓' : `تأكيد الحضور — ${finalPrice.toFixed(0)} ر.س`}
            </button>
          </form>
        </div>

        <p style={{ textAlign:'center', fontSize:12, color:'#9ca3af' }}>مدعوم من EventVMS</p>
      </div>
    </div>
  )
}
