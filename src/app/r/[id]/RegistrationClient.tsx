'use client'
import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useParams } from 'next/navigation'
import { WorkerOptIn } from '@/components/workers/WorkerOptIn'
import { QRService } from '@/services/QRService'
import QRCode from 'qrcode'

const sb = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function RegistrationClient() {
  const { id } = useParams()
  const [ev, setEv] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [sub, setSub] = useState(false)
  const [done, setDone] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [regId, setRegId] = useState('')
  const [guestName, setGuestName] = useState('')
  const [guestPhone, setGuestPhone] = useState('')
  const [guestEmail, setGuestEmail] = useState('')
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', company: '', job_title: '' })

  const inp: React.CSSProperties = { width: '100%', padding: '11px 14px', border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 15, boxSizing: 'border-box', outline: 'none', background: '#fff', fontFamily: 'inherit' }

  useEffect(() => {
    sb.from('events').select('id, title, start_date, location, status').eq('id', id).single()
      .then(({ data }) => { setEv(data); setLoading(false) })
  }, [id])

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setSub(true)
    try {
      const reg = await QRService.createRegistration({
        event_id: id as string,
        guest_name: form.full_name,
        guest_email: form.email || undefined,
        guest_phone: form.phone || undefined,
        source: 'form',
        notes: form.company ? form.company + (form.job_title ? ' - ' + form.job_title : '') : undefined
      })
      const qrUrl = await QRCode.toDataURL(reg.qr_code || reg.id, {
        width: 250, margin: 2, color: { dark: '#1a1a1a', light: '#FFFFFF' }, errorCorrectionLevel: 'H'
      })
      setRegId(reg.id); setGuestName(form.full_name); setGuestPhone(form.phone)
      setGuestEmail(form.email); setQrDataUrl(qrUrl); setDone(true)
    } catch (err: any) { alert('خطأ: ' + err.message); setSub(false) }
  }

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p>جاري التحميل...</p></div>
  if (!ev) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }} dir="rtl"><h2>الفعالية غير متاحة</h2></div>

  if (done) return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#FBF8F5,#F3F0F8)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} dir="rtl">
      <div style={{ background: '#fff', borderRadius: 20, padding: 32, maxWidth: 440, width: '100%', boxShadow: '0 8px 40px rgba(0,0,0,0.08)', textAlign: 'center' }}>
        <div style={{ fontSize: 64, marginBottom: 8 }}>🎉</div>
        <h2 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px' }}>تم تسجيلك بنجاح!</h2>
        <p style={{ color: '#666', margin: '0 0 24px', fontSize: 14 }}>{ev.title}</p>
        <div style={{ background: '#f9fafb', borderRadius: 16, padding: 20, marginBottom: 20, display: 'inline-block' }}>
          {qrDataUrl && <img src={qrDataUrl} alt="QR Code" style={{ width: 200, height: 200, display: 'block' }} />}
          <p style={{ margin: '8px 0 0', fontSize: 12, color: '#666' }}>امسح هذا الرمز عند الدخول</p>
        </div>
        <div style={{ background: '#FBF8F5', borderRadius: 14, padding: 16, marginBottom: 20, textAlign: 'right' }}>
          <p style={{ fontWeight: 600, margin: '0 0 4px', color: '#C45800' }}>مرحباً {guestName}</p>
          {guestPhone && <p style={{ margin: 0, fontSize: 13, color: '#C45800' }}>📱 {guestPhone}</p>}
        </div>
        <button onClick={() => { const a = document.createElement('a'); a.download = 'qr-code.png'; a.href = qrDataUrl; a.click() }}
          style={{ background: '#F05537', color: '#fff', padding: '10px 24px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600, marginBottom: 16 }}>
          ⬇️ تحميل QR Code
        </button>
        <WorkerOptIn attendeeId={regId} attendeeName={guestName} attendeePhone={guestPhone} attendeeEmail={guestEmail} />
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#FBF8F5,#F3F0F8)', padding: 16 }} dir="rtl">
      <div style={{ maxWidth: 480, margin: '0 auto', paddingTop: 32 }}>
        <div style={{ background: '#fff', borderRadius: 20, overflow: 'hidden', boxShadow: '0 8px 40px rgba(0,0,0,0.08)', marginBottom: 20 }}>
          <div style={{ background: 'linear-gradient(135deg,#F05537,#1a4a42)', padding: '28px 24px', color: '#fff' }}>
            <div style={{ fontSize: 22, marginBottom: 8 }}>🎪</div>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 6px' }}>{ev.title}</h1>
            {ev.location && <p style={{ margin: '0 0 4px', opacity: 0.85, fontSize: 14 }}>📍 {ev.location}</p>}
            {ev.start_date && <p style={{ margin: 0, opacity: 0.85, fontSize: 14 }}>📅 {new Date(ev.start_date).toLocaleDateString('ar-SA')}</p>}
          </div>
          <form onSubmit={submit} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 4px' }}>سجّل حضورك</h2>
            <div><label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 5 }}>الاسم الكامل *</label>
              <input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} required placeholder="محمد أحمد" style={inp} /></div>
            <div><label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 5 }}>البريد الإلكتروني</label>
              <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="example@email.com" style={inp} /></div>
            <div><label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 5 }}>رقم الجوال</label>
              <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="05xxxxxxxx" style={inp} type="tel" /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div><label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 5 }}>الشركة</label>
                <input value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} placeholder="اختياري" style={inp} /></div>
              <div><label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 5 }}>المسمى</label>
                <input value={form.job_title} onChange={e => setForm({ ...form, job_title: e.target.value })} placeholder="اختياري" style={inp} /></div>
            </div>
            <button type="submit" disabled={sub} style={{ background: '#F05537', color: '#fff', padding: '14px', borderRadius: 12, border: 'none', fontSize: 16, fontWeight: 700, cursor: 'pointer', opacity: sub ? 0.7 : 1 }}>
              {sub ? 'جاري التسجيل...' : 'تسجيل الحضور مجاناً ✓'}
            </button>
          </form>
        </div>
        <p style={{ textAlign: 'center', fontSize: 12, color: '#9ca3af' }}>مدعوم من EventVMS</p>
      </div>
    </div>
  )
}
