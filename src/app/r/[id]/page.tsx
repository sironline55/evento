'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useParams } from 'next/navigation'
import Link from 'next/link'

const C = { navy:'#1E0A3C', orange:'#F05537', muted:'#6F7287', border:'#DBDAE3' }

export default function RegistrationPage() {
  const { id } = useParams()
  const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

  const [ev, setEv]           = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone]       = useState(false)
  const [ticketCode, setTicketCode] = useState('')
  const [regCount,   setRegCount]   = useState(0)
  const [isFull,     setIsFull]     = useState(false)
  const [form, setForm]       = useState({ guest_name:'', guest_email:'', guest_phone:'', notes:'' })

  // Coupon state
  const [couponCode, setCouponCode] = useState('')
  const [coupon, setCoupon]   = useState<any>(null)
  const [couponError, setCouponError] = useState('')
  const [checkingCoupon, setCheckingCoupon] = useState(false)

  useEffect(() => {
    if (!id) return
    sb.from('events')
      .select('id,title,start_date,location,capacity,price_from,category_icon,org_id,status,waitlist_enabled,organizations(name,logo_url,accent_color)')
      .eq('id', id).single()
      .then(({ data }) => { setEv(data); setLoading(false) })
  }, [id])

  const inp: React.CSSProperties = {
    width:'100%', padding:'12px 14px', border:`1px solid ${C.border}`,
    borderRadius:10, fontSize:15, boxSizing:'border-box', outline:'none',
    background:'#fafafa', fontFamily:'inherit'
  }

  // Original price
  const originalPrice = ev ? Number(ev.price_from || 0) : 0

  // Discounted price
  function calcDiscount() {
    if (!coupon || originalPrice === 0) return 0
    if (coupon.discount_type === 'percentage') return Math.min(originalPrice, originalPrice * coupon.discount_value / 100)
    return Math.min(originalPrice, coupon.discount_value)
  }
  const discount    = calcDiscount()
  const finalPrice  = Math.max(0, originalPrice - discount)

  async function applyCoupon() {
    if (!couponCode.trim() || !ev) return
    setCheckingCoupon(true); setCouponError(''); setCoupon(null)

    const { data, error } = await sb
      .from('coupons')
      .select('*')
      .eq('org_id', ev.org_id)
      .eq('code', couponCode.toUpperCase().trim())
      .eq('is_active', true)
      .single()

    if (error || !data) { setCouponError('كود الخصم غير صحيح'); setCheckingCoupon(false); return }
    if (data.expires_at && new Date(data.expires_at) < new Date()) { setCouponError('انتهت صلاحية هذا الكود'); setCheckingCoupon(false); return }
    if (data.max_uses && data.used_count >= data.max_uses) { setCouponError('تم استنفاد هذا الكود'); setCheckingCoupon(false); return }
    if (data.event_id && data.event_id !== id) { setCouponError('هذا الكود لفعالية مختلفة'); setCheckingCoupon(false); return }

    setCoupon(data)
    setCheckingCoupon(false)
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!ev) return
    setSubmitting(true)
    const qr = 'EVT-' + Math.random().toString(36).substring(2,10).toUpperCase()

    const { data, error } = await sb
      .from('registrations')
      .insert({
        event_id: id, org_id: ev.org_id,
        guest_name: form.guest_name,
        guest_email: form.guest_email || null,
        guest_phone: form.guest_phone || null,
        notes: (form.notes || '') + (coupon ? ` | كوبون: ${coupon.code}` : ''),
        qr_code: qr, status:'registered',
        ticket_type:'general', source:'public_form'
      })
      .select('id,qr_code').single()

    if (!error && data) {
      // Increment coupon used_count
      if (coupon) {
        await sb.from('coupons').update({ used_count: coupon.used_count + 1 }).eq('id', coupon.id)
      }
      setTicketCode(data.qr_code)
      setDone(true)
    } else {
      alert('حدث خطأ: ' + error?.message)
      setSubmitting(false)
    }
  }

  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:C.navy, color:'#fff', fontFamily:'Tajawal,sans-serif' }}>
      جاري التحميل...
    </div>
  )
  if (!ev) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:C.navy, color:'#fff', fontFamily:'Tajawal,sans-serif' }}>
      الفعالية غير موجودة
    </div>
  )

  const org    = ev.organizations as any
  const accent = org?.accent_color || C.orange

  if (done) return (
    <div style={{ minHeight:'100vh', background:`linear-gradient(135deg,${C.navy},#3D1A78)`, display:'flex', alignItems:'center', justifyContent:'center', direction:'rtl', fontFamily:'Tajawal,sans-serif', padding:16 }}>
      <div style={{ background:'#fff', borderRadius:20, padding:36, maxWidth:400, width:'100%', textAlign:'center' }}>
        <div style={{ fontSize:56, marginBottom:12 }}>🎉</div>
        <h2 style={{ fontSize:22, fontWeight:800, color:C.navy, margin:'0 0 8px' }}>{isFull && ev?.waitlist_enabled ? 'تم إضافتك لقائمة الانتظار!' : 'تم التسجيل بنجاح!'}</h2>
        <p style={{ color:C.muted, fontSize:14, margin:'0 0 20px' }}>مرحباً {form.guest_name}، تم تسجيلك في {ev.title}</p>
        {coupon && (
          <div style={{ background:'#EAF7E0', border:'1px solid #9DE07B', borderRadius:10, padding:'10px 16px', marginBottom:14 }}>
            <p style={{ fontSize:13, fontWeight:700, color:'#166534', margin:0 }}>
              ✅ تم تطبيق خصم {coupon.discount_type==='percentage'?`${coupon.discount_value}%`:`${coupon.discount_value} ريال`}
              {originalPrice > 0 && ` — السعر النهائي: ${finalPrice} ريال`}
            </p>
          </div>
        )}
        <div style={{ background:'#F8F7FA', borderRadius:12, padding:'14px 20px', marginBottom:20 }}>
          <p style={{ fontSize:11, color:C.muted, margin:'0 0 4px', fontWeight:600 }}>رمز تذكرتك</p>
          <p style={{ fontSize:18, fontWeight:900, color:C.navy, margin:0, fontFamily:'monospace', letterSpacing:2 }}>{ticketCode}</p>
        </div>
        <Link href={`/ticket/${ticketCode}`} style={{
          display:'block', padding:'13px', background:accent, color:'#fff',
          borderRadius:10, textDecoration:'none', fontWeight:700, fontSize:15, marginBottom:10
        }}>🎫 عرض تذكرتي</Link>
        <Link href={`/e/${id}`} style={{ color:C.muted, fontSize:13, textDecoration:'none' }}>← العودة للفعالية</Link>
      </div>
    </div>
  )

  const fmtDate = (d: string) => new Date(d).toLocaleDateString('ar-SA', {
    weekday:'long', year:'numeric', month:'long', day:'numeric'
  })

  return (
    <div style={{ minHeight:'100vh', background:`linear-gradient(135deg,${C.navy},#3D1A78)`, direction:'rtl', fontFamily:'Tajawal,sans-serif', padding:'24px 16px' }}>

      {/* Header */}
      <div style={{ maxWidth:460, margin:'0 auto 20px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <Link href={`/e/${id}`} style={{ color:'rgba(255,255,255,.6)', textDecoration:'none', fontSize:13 }}>← الفعالية</Link>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ width:28, height:28, background:accent, borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:800, fontSize:12 }}>
            {org?.name?.[0] || 'E'}
          </div>
          <span style={{ color:'rgba(255,255,255,.8)', fontWeight:700, fontSize:14 }}>{org?.name || 'EventVMS'}</span>
        </div>
      </div>

      <div style={{ maxWidth:460, margin:'0 auto', background:'#fff', borderRadius:20, overflow:'hidden', boxShadow:'0 20px 60px rgba(0,0,0,.3)' }}>

        {/* Event banner */}
        <div style={{ background:accent, padding:'20px 24px' }}>
          <span style={{ fontSize:28 }}>{ev.category_icon || '🎪'}</span>
          <h2 style={{ fontSize:17, fontWeight:800, color:'#fff', margin:'8px 0 4px', lineHeight:1.3 }}>{ev.title}</h2>
          {ev.start_date && (
            <p style={{ fontSize:12, color:'rgba(255,255,255,.85)', margin:0 }}>
              📅 {fmtDate(ev.start_date)}{ev.location?` · 📍 ${ev.location}`:''}
            </p>
          )}
          {originalPrice > 0 ? (
            <p style={{ fontSize:13, color:'rgba(255,255,255,.9)', margin:'6px 0 0', fontWeight:700 }}>
              السعر: {originalPrice.toLocaleString('ar-SA')} ريال
            </p>
          ) : (
            <span style={{ display:'inline-block', marginTop:6, fontSize:12, padding:'3px 10px', background:'rgba(255,255,255,.2)', color:'#fff', borderRadius:12, fontWeight:600 }}>مجاني</span>
          )}
        </div>

        <form onSubmit={submit} style={{ padding:'24px' }}>
          <h3 style={{ fontSize:16, fontWeight:700, color:C.navy, margin:'0 0 20px' }}>بيانات التسجيل</h3>

          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div>
              <label style={{ fontSize:13, fontWeight:600, color:C.navy, display:'block', marginBottom:6 }}>
                الاسم الكامل <span style={{ color:'#DC2626' }}>*</span>
              </label>
              <input type="text" required placeholder="محمد أحمد"
                value={form.guest_name} onChange={e => setForm({...form, guest_name:e.target.value})}
                style={inp}/>
            </div>
            <div>
              <label style={{ fontSize:13, fontWeight:600, color:C.navy, display:'block', marginBottom:6 }}>البريد الإلكتروني</label>
              <input type="email" placeholder="example@email.com"
                value={form.guest_email} onChange={e => setForm({...form, guest_email:e.target.value})}
                style={inp}/>
            </div>
            <div>
              <label style={{ fontSize:13, fontWeight:600, color:C.navy, display:'block', marginBottom:6 }}>
                رقم الجوال <span style={{ color:C.muted, fontWeight:400, fontSize:11 }}>(للتواصل)</span>
              </label>
              <input type="tel" placeholder="05xxxxxxxx"
                value={form.guest_phone} onChange={e => setForm({...form, guest_phone:e.target.value})}
                style={inp}/>
            </div>
            <div>
              <label style={{ fontSize:13, fontWeight:600, color:C.navy, display:'block', marginBottom:6 }}>
                ملاحظات <span style={{ color:C.muted, fontWeight:400, fontSize:11 }}>(اختياري)</span>
              </label>
              <textarea placeholder="أي طلبات خاصة..."
                value={form.notes} onChange={e => setForm({...form, notes:e.target.value})}
                rows={2} style={{...inp, resize:'vertical'}}/>
            </div>

            {/* Coupon section */}
            <div style={{ background:'#F8F7FA', border:`1px solid ${C.border}`, borderRadius:12, padding:'14px 16px' }}>
              <label style={{ fontSize:13, fontWeight:700, color:C.navy, display:'block', marginBottom:8 }}>
                🏷️ كوبون الخصم
              </label>
              <div style={{ display:'flex', gap:8 }}>
                <input
                  placeholder="أدخل كود الخصم"
                  value={couponCode}
                  onChange={e => { setCouponCode(e.target.value.toUpperCase()); setCoupon(null); setCouponError('') }}
                  disabled={!!coupon}
                  style={{ ...inp, flex:1, background: coupon ? '#EAF7E0' : '#fff', borderColor: coupon ? '#9DE07B' : couponError ? '#FECACA' : C.border }}
                />
                {!coupon ? (
                  <button type="button" onClick={applyCoupon} disabled={!couponCode.trim() || checkingCoupon}
                    style={{ padding:'12px 16px', background:C.navy, color:'#fff', border:'none', borderRadius:10, fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap', opacity:!couponCode.trim()?0.5:1 }}>
                    {checkingCoupon ? '...' : 'تطبيق'}
                  </button>
                ) : (
                  <button type="button" onClick={() => { setCoupon(null); setCouponCode(''); setCouponError('') }}
                    style={{ padding:'12px 14px', background:'#FEF2F2', color:'#DC2626', border:'1px solid #FECACA', borderRadius:10, fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
                    ✕
                  </button>
                )}
              </div>
              {couponError && <p style={{ fontSize:12, color:'#DC2626', margin:'6px 0 0' }}>⚠️ {couponError}</p>}
              {coupon && (
                <div style={{ marginTop:10, padding:'10px 12px', background:'#EAF7E0', border:'1px solid #9DE07B', borderRadius:8 }}>
                  <p style={{ fontSize:13, fontWeight:700, color:'#166534', margin:'0 0 3px' }}>
                    ✅ تم تطبيق كوبون {coupon.code}
                  </p>
                  {originalPrice > 0 && (
                    <div style={{ fontSize:12, color:'#166534' }}>
                      <span style={{ textDecoration:'line-through', color:C.muted }}>السعر الأصلي: {originalPrice} ريال</span>
                      {' → '}
                      <strong>السعر بعد الخصم: {finalPrice} ريال</strong>
                      {discount > 0 && <span style={{ color:'#DC2626', marginRight:6 }}>(-{coupon.discount_type==='percentage'?`${coupon.discount_value}%`:`${discount} ريال`})</span>}
                    </div>
                  )}
                  {originalPrice === 0 && <p style={{ fontSize:12, color:'#166534', margin:0 }}>الفعالية مجانية — الكوبون محفوظ</p>}
                </div>
              )}
            </div>

            {/* Price summary */}
            {originalPrice > 0 && (
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 16px', background: coupon?'#EAF7E0':'#F0F7FF', borderRadius:10, border:`1px solid ${coupon?'#9DE07B':'#BFDBFE'}` }}>
                <span style={{ fontSize:14, fontWeight:600, color:C.navy }}>المبلغ الإجمالي</span>
                <div style={{ textAlign:'left' }}>
                  {coupon && discount>0 && <span style={{ fontSize:12, textDecoration:'line-through', color:C.muted, display:'block' }}>{originalPrice} ريال</span>}
                  <span style={{ fontSize:18, fontWeight:900, color: coupon&&discount>0?'#166534':C.navy }}>{finalPrice} ريال</span>
                </div>
              </div>
            )}

            {/* Capacity / Waitlist notice */}
            {ev?.capacity && (
              <div style={{ padding:'10px 14px', borderRadius:10, background: isFull?'#FFF8E8':'#EAF7E0', border:`1px solid ${isFull?'#F5D56B':'#9DE07B'}`, fontSize:13 }}>
                {isFull ? (
                  ev?.waitlist_enabled
                    ? <span style={{ color:'#854F0B', fontWeight:600 }}>⏳ اكتملت المقاعد — سيتم إضافتك لقائمة الانتظار وإشعارك عند توفر مقعد</span>
                    : <span style={{ color:'#DC2626', fontWeight:600 }}>🚫 اكتملت المقاعد — التسجيل مغلق</span>
                ) : (
                  <span style={{ color:'#166534', fontWeight:600 }}>✅ {ev.capacity - regCount} مقعد متبقي من {ev.capacity}</span>
                )}
              </div>
            )}

            <button type="submit" disabled={submitting || (isFull && !ev?.waitlist_enabled)} style={{
              padding:'14px', background:submitting?C.muted:accent, color:'#fff',
              borderRadius:12, border:'none', fontSize:16, fontWeight:700,
              cursor:submitting?'not-allowed':'pointer', fontFamily:'inherit'
            }}>
              {submitting ? 'جاري التسجيل...' : isFull && ev?.waitlist_enabled ? '⏳ الانضمام لقائمة الانتظار' : isFull ? 'المقاعد ممتلئة' : '🎟 تأكيد التسجيل'}
            </button>
          </div>

          <p style={{ textAlign:'center', fontSize:12, color:C.muted, marginTop:14 }}>
            بالتسجيل توافق على شروط الاستخدام
          </p>
        </form>
      </div>
    </div>
  )
}
