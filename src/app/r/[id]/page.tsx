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

  const [ev, setEv]       = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone]   = useState(false)
  const [ticketCode, setTicketCode] = useState('')
  const [form, setForm]   = useState({ guest_name:'', guest_email:'', guest_phone:'', notes:'' })

  useEffect(() => {
    if (!id) return
    sb.from('events')
      .select('id, title, start_date, location, capacity, price_from, category_icon, org_id, status, organizations(name, logo_url, accent_color)')
      .eq('id', id)
      .single()
      .then(({ data }) => { setEv(data); setLoading(false) })
  }, [id])

  const inp: React.CSSProperties = {
    width:'100%', padding:'12px 14px', border:`1px solid ${C.border}`,
    borderRadius:10, fontSize:15, boxSizing:'border-box', outline:'none',
    background:'#fafafa', fontFamily:'inherit'
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!ev) return
    setSubmitting(true)
    const qr = 'EVT-' + Math.random().toString(36).substring(2,10).toUpperCase()

    const { data, error } = await sb
      .from('registrations')
      .insert({
        event_id: id,
        org_id: ev.org_id,
        guest_name: form.guest_name,
        guest_email: form.guest_email || null,
        guest_phone: form.guest_phone || null,
        notes: form.notes || null,
        qr_code: qr,
        status: 'registered',
        ticket_type: 'general',
        source: 'public_form'
      })
      .select('id, qr_code')
      .single()

    if (!error && data) {
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

  const org = ev.organizations as any
  const accent = org?.accent_color || C.orange

  // Success screen
  if (done) return (
    <div style={{ minHeight:'100vh', background:`linear-gradient(135deg,${C.navy},#3D1A78)`, display:'flex', alignItems:'center', justifyContent:'center', direction:'rtl', fontFamily:'Tajawal,sans-serif', padding:16 }}>
      <div style={{ background:'#fff', borderRadius:20, padding:36, maxWidth:400, width:'100%', textAlign:'center' }}>
        <div style={{ fontSize:56, marginBottom:12 }}>🎉</div>
        <h2 style={{ fontSize:22, fontWeight:800, color:C.navy, margin:'0 0 8px' }}>تم التسجيل بنجاح!</h2>
        <p style={{ color:C.muted, fontSize:14, margin:'0 0 20px' }}>مرحباً {form.guest_name}، تم تسجيلك في {ev.title}</p>
        <div style={{ background:'#F8F7FA', borderRadius:12, padding:'14px 20px', marginBottom:20 }}>
          <p style={{ fontSize:11, color:C.muted, margin:'0 0 4px', fontWeight:600 }}>رمز تذكرتك</p>
          <p style={{ fontSize:18, fontWeight:900, color:C.navy, margin:0, fontFamily:'monospace', letterSpacing:2 }}>{ticketCode}</p>
        </div>
        <Link href={`/ticket/${ticketCode}`} style={{
          display:'block', padding:'13px', background:accent,
          color:'#fff', borderRadius:10, textDecoration:'none',
          fontWeight:700, fontSize:15, marginBottom:10
        }}>
          🎫 عرض تذكرتي
        </Link>
        <Link href={`/e/${id}`} style={{ color:C.muted, fontSize:13, textDecoration:'none' }}>
          ← العودة للفعالية
        </Link>
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

      {/* Form card */}
      <div style={{ maxWidth:460, margin:'0 auto', background:'#fff', borderRadius:20, overflow:'hidden', boxShadow:'0 20px 60px rgba(0,0,0,.3)' }}>

        {/* Event banner */}
        <div style={{ background:accent, padding:'20px 24px' }}>
          <span style={{ fontSize:28 }}>{ev.category_icon || '🎪'}</span>
          <h2 style={{ fontSize:17, fontWeight:800, color:'#fff', margin:'8px 0 4px', lineHeight:1.3 }}>{ev.title}</h2>
          {ev.start_date && (
            <p style={{ fontSize:12, color:'rgba(255,255,255,.85)', margin:0 }}>
              📅 {fmtDate(ev.start_date)}  {ev.location ? `· 📍 ${ev.location}` : ''}
            </p>
          )}
          {ev.price_from && Number(ev.price_from) > 0 ? (
            <p style={{ fontSize:13, color:'rgba(255,255,255,.9)', margin:'6px 0 0', fontWeight:700 }}>
              السعر: {Number(ev.price_from).toLocaleString('ar-SA')} ريال
            </p>
          ) : (
            <span style={{ display:'inline-block', marginTop:6, fontSize:12, padding:'3px 10px', background:'rgba(255,255,255,.2)', color:'#fff', borderRadius:12, fontWeight:600 }}>مجاني</span>
          )}
        </div>

        {/* Form */}
        <form onSubmit={submit} style={{ padding:'24px' }}>
          <h3 style={{ fontSize:16, fontWeight:700, color:C.navy, margin:'0 0 20px' }}>بيانات التسجيل</h3>

          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div>
              <label style={{ fontSize:13, fontWeight:600, color:C.navy, display:'block', marginBottom:6 }}>
                الاسم الكامل <span style={{ color:'#DC2626' }}>*</span>
              </label>
              <input
                type="text" required placeholder="محمد أحمد"
                value={form.guest_name} onChange={e => setForm({...form, guest_name:e.target.value})}
                style={inp}
              />
            </div>

            <div>
              <label style={{ fontSize:13, fontWeight:600, color:C.navy, display:'block', marginBottom:6 }}>
                البريد الإلكتروني
              </label>
              <input
                type="email" placeholder="example@email.com"
                value={form.guest_email} onChange={e => setForm({...form, guest_email:e.target.value})}
                style={inp}
              />
            </div>

            <div>
              <label style={{ fontSize:13, fontWeight:600, color:C.navy, display:'block', marginBottom:6 }}>
                رقم الجوال <span style={{ color:C.muted, fontWeight:400, fontSize:11 }}>(للتواصل)</span>
              </label>
              <input
                type="tel" placeholder="05xxxxxxxx"
                value={form.guest_phone} onChange={e => setForm({...form, guest_phone:e.target.value})}
                style={inp}
              />
            </div>

            <div>
              <label style={{ fontSize:13, fontWeight:600, color:C.navy, display:'block', marginBottom:6 }}>
                ملاحظات <span style={{ color:C.muted, fontWeight:400, fontSize:11 }}>(اختياري)</span>
              </label>
              <textarea
                placeholder="أي طلبات خاصة..."
                value={form.notes} onChange={e => setForm({...form, notes:e.target.value})}
                rows={2}
                style={{...inp, resize:'vertical'}}
              />
            </div>

            <button type="submit" disabled={submitting} style={{
              padding:'14px', background: submitting ? C.muted : accent,
              color:'#fff', borderRadius:12, border:'none',
              fontSize:16, fontWeight:700, cursor: submitting ? 'not-allowed' : 'pointer',
              fontFamily:'inherit', transition:'background .2s'
            }}>
              {submitting ? 'جاري التسجيل...' : '🎟 تأكيد التسجيل'}
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
