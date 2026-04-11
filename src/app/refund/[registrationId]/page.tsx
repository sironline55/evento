'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useParams } from 'next/navigation'
import Link from 'next/link'

const C = { navy:'#1E0A3C', orange:'#F05537', muted:'#6F7287', border:'#DBDAE3' }

const POLICY_INFO: Record<string,{label:string;desc:string;color:string}> = {
  flexible:     { label:'مرن',          desc:'استرداد كامل إذا كان الطلب قبل المهلة المحددة',  color:'#166534' },
  moderate:     { label:'معتدل',        desc:'استرداد جزئي حسب وقت الطلب',                    color:'#854F0B' },
  strict:       { label:'صارم',         desc:'استرداد محدود قبل 24 ساعة من الفعالية',          color:'#991B1B' },
  no_refund:    { label:'لا استرداد',   desc:'لا يمكن استرداد قيمة التذكرة',                   color:'#6F7287' },
  full_refund:  { label:'استرداد كامل', desc:'يحق لك الاسترداد الكامل في أي وقت',             color:'#166534' },
  partial_refund:{ label:'جزئي',        desc:'استرداد جزئي حسب سياسة الفعالية',               color:'#854F0B' },
  custom:       { label:'مخصص',         desc:'تواصل مع المنظم للاستفسار',                     color:'#185FA5' },
}

export default function RefundRequestPage() {
  const { registrationId } = useParams()
  const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

  const [reg,     setReg]     = useState<any>(null)
  const [ev,      setEv]      = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [reason,  setReason]  = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done,    setDone]    = useState(false)
  const [error,   setError]   = useState('')

  useEffect(() => {
    if (!registrationId) return
    sb.from('registrations').select('*').eq('id', registrationId).single()
      .then(async ({ data: r }) => {
        if (!r) { setLoading(false); return }
        setReg(r)
        const { data: e } = await sb.from('events')
          .select('id,title,start_date,location,org_id,price_from,cancellation_policy,refund_deadline_hours,cancellation_note,category_icon,organizations(name,accent_color)')
          .eq('id', r.event_id).single()
        setEv(e)
        setLoading(false)
      })
  }, [registrationId])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!reg || !ev) return
    setSubmitting(true); setError('')

    // Check if refunds allowed
    if (ev.cancellation_policy === 'no_refund') {
      setError('عذراً، هذه الفعالية غير قابلة للاسترداد'); setSubmitting(false); return
    }

    // Check deadline
    if (ev.refund_deadline_hours && ev.start_date) {
      const deadline = new Date(ev.start_date).getTime() - ev.refund_deadline_hours * 3600000
      if (Date.now() > deadline) {
        setError(`انتهت مهلة طلب الاسترداد (كانت ${ev.refund_deadline_hours} ساعة قبل الفعالية)`);
        setSubmitting(false); return
      }
    }

    const { error: err } = await sb.from('refund_requests').insert({
      registration_id: registrationId,
      event_id: ev.id,
      org_id: ev.org_id,
      guest_name: reg.guest_name,
      guest_email: reg.guest_email,
      reason: reason || null,
      amount: Number(ev.price_from || 0),
      status: 'pending'
    })

    if (err) { setError('حدث خطأ: ' + err.message); setSubmitting(false); return }

    // Update registration status to cancelled
    await sb.from('registrations').update({ status:'cancelled' }).eq('id', registrationId)
    setDone(true)
  }

  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:C.navy, color:'#fff', fontFamily:'Tajawal,sans-serif' }}>
      جاري التحميل...
    </div>
  )

  if (!reg || !ev) return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:C.navy, color:'#fff', fontFamily:'Tajawal,sans-serif', gap:12 }}>
      <div style={{ fontSize:40 }}>❌</div>
      <p style={{ fontSize:16, fontWeight:700 }}>التذكرة غير موجودة</p>
    </div>
  )

  if (done) return (
    <div style={{ minHeight:'100vh', background:`linear-gradient(135deg,${C.navy},#3D1A78)`, display:'flex', alignItems:'center', justifyContent:'center', direction:'rtl', fontFamily:'Tajawal,sans-serif', padding:16 }}>
      <div style={{ background:'#fff', borderRadius:20, padding:36, maxWidth:400, width:'100%', textAlign:'center' }}>
        <div style={{ fontSize:52, marginBottom:12 }}>📨</div>
        <h2 style={{ fontSize:20, fontWeight:800, color:C.navy, margin:'0 0 8px' }}>تم إرسال طلب الاسترداد</h2>
        <p style={{ color:C.muted, fontSize:13, margin:'0 0 20px', lineHeight:1.7 }}>
          تم استلام طلبك وسيتواصل معك المنظم خلال 3-5 أيام عمل.
        </p>
        <div style={{ background:'#F8F7FA', borderRadius:10, padding:'12px 16px', marginBottom:18, textAlign:'right' }}>
          <p style={{ fontSize:11, color:C.muted, margin:'0 0 3px', fontWeight:600 }}>رقم تذكرتك</p>
          <p style={{ fontSize:14, fontWeight:800, color:C.navy, margin:0, fontFamily:'monospace' }}>{reg.qr_code}</p>
        </div>
        <Link href="/" style={{ color:C.muted, fontSize:13, textDecoration:'none' }}>← الصفحة الرئيسية</Link>
      </div>
    </div>
  )

  const org    = ev.organizations as any
  const accent = org?.accent_color || C.orange
  const policy = POLICY_INFO[ev.cancellation_policy || 'flexible']
  const isPaid = Number(ev.price_from || 0) > 0

  // Compute deadline
  let deadlineStr = ''
  if (ev.refund_deadline_hours && ev.start_date) {
    const dl = new Date(new Date(ev.start_date).getTime() - ev.refund_deadline_hours * 3600000)
    deadlineStr = dl.toLocaleString('ar-SA', { weekday:'short', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' })
  }

  return (
    <div style={{ minHeight:'100vh', background:`linear-gradient(135deg,${C.navy},#3D1A78)`, direction:'rtl', fontFamily:'Tajawal,sans-serif', padding:'24px 16px' }}>

      {/* Header */}
      <div style={{ maxWidth:460, margin:'0 auto 20px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <Link href={`/ticket/${reg.qr_code}`} style={{ color:'rgba(255,255,255,.6)', textDecoration:'none', fontSize:13 }}>← التذكرة</Link>
        <span style={{ color:'rgba(255,255,255,.8)', fontWeight:700, fontSize:14 }}>{org?.name || 'EventVMS'}</span>
      </div>

      <div style={{ maxWidth:460, margin:'0 auto', background:'#fff', borderRadius:20, overflow:'hidden', boxShadow:'0 20px 60px rgba(0,0,0,.3)' }}>

        {/* Banner */}
        <div style={{ background:accent, padding:'20px 24px' }}>
          <span style={{ fontSize:26 }}>{ev.category_icon || '🎪'}</span>
          <h2 style={{ fontSize:16, fontWeight:800, color:'#fff', margin:'8px 0 3px', lineHeight:1.3 }}>{ev.title}</h2>
          <p style={{ fontSize:12, color:'rgba(255,255,255,.8)', margin:0 }}>
            طلب إلغاء وإسترداد — {reg.guest_name}
          </p>
        </div>

        <div style={{ padding:'24px' }}>

          {/* Policy card */}
          <div style={{ background:'#F8F7FA', border:`1px solid ${C.border}`, borderRadius:12, padding:'14px 16px', marginBottom:20 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
              <p style={{ fontSize:13, fontWeight:700, color:C.navy, margin:0 }}>سياسة الإلغاء</p>
              <span style={{ fontSize:12, padding:'3px 10px', background: ev.cancellation_policy==='no_refund'?'#F8F7FA':'#EAF7E0',
                color: policy.color, borderRadius:12, fontWeight:600, border:`1px solid ${policy.color}30` }}>
                {policy.label}
              </span>
            </div>
            <p style={{ fontSize:12, color:C.muted, margin:'0 0 6px' }}>{policy.desc}</p>
            {deadlineStr && <p style={{ fontSize:12, color:C.muted, margin:0 }}>⏰ آخر موعد للإلغاء: <strong style={{ color:C.navy }}>{deadlineStr}</strong></p>}
            {ev.cancellation_note && <p style={{ fontSize:12, color:C.navy, margin:'6px 0 0', padding:'8px', background:'#fff', borderRadius:6, border:`1px solid ${C.border}` }}>📌 {ev.cancellation_note}</p>}
          </div>

          {ev.cancellation_policy === 'no_refund' ? (
            <div style={{ textAlign:'center', padding:'20px 0' }}>
              <div style={{ fontSize:36, marginBottom:8 }}>🚫</div>
              <p style={{ fontSize:14, fontWeight:700, color:'#DC2626', margin:'0 0 4px' }}>لا يمكن استرداد هذه التذكرة</p>
              <p style={{ fontSize:12, color:C.muted, margin:0 }}>إذا كان لديك استفسار تواصل مع المنظم مباشرةً</p>
            </div>
          ) : (
            <form onSubmit={submit}>
              {isPaid && (
                <div style={{ display:'flex', justifyContent:'space-between', padding:'12px 14px', background:'#F0F7FF', borderRadius:10, marginBottom:16, border:'1px solid #BFDBFE' }}>
                  <span style={{ fontSize:13, fontWeight:600, color:C.navy }}>المبلغ المتوقع للاسترداد</span>
                  <span style={{ fontSize:16, fontWeight:900, color:'#185FA5' }}>{Number(ev.price_from).toLocaleString('ar-SA')} ريال</span>
                </div>
              )}

              <div style={{ marginBottom:16 }}>
                <label style={{ fontSize:13, fontWeight:600, color:C.navy, display:'block', marginBottom:6 }}>
                  سبب الإلغاء <span style={{ color:C.muted, fontSize:11, fontWeight:400 }}>(اختياري)</span>
                </label>
                <textarea
                  value={reason} onChange={e => setReason(e.target.value)}
                  placeholder="ظرف طارئ / سفر / تغيير في الخطط..."
                  rows={3}
                  style={{ width:'100%', padding:'12px 14px', border:`1px solid ${C.border}`, borderRadius:10, fontSize:14, boxSizing:'border-box', outline:'none', resize:'vertical', fontFamily:'inherit' }}
                />
              </div>

              {error && (
                <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:10, padding:'10px 14px', marginBottom:14 }}>
                  <p style={{ fontSize:13, color:'#DC2626', margin:0 }}>⚠️ {error}</p>
                </div>
              )}

              <div style={{ background:'#FFF8E8', border:'1px solid #F5D56B', borderRadius:10, padding:'10px 14px', marginBottom:16 }}>
                <p style={{ fontSize:12, color:'#854F0B', margin:0 }}>
                  ⚠️ سيتم إلغاء تسجيلك وإرسال طلب الاسترداد للمنظم. هذا الإجراء لا يمكن التراجع عنه.
                </p>
              </div>

              <button type="submit" disabled={submitting} style={{
                width:'100%', padding:'14px', background:submitting?C.muted:'#DC2626',
                color:'#fff', borderRadius:12, border:'none', fontSize:15,
                fontWeight:700, cursor:submitting?'not-allowed':'pointer', fontFamily:'inherit'
              }}>
                {submitting ? 'جاري الإرسال...' : '🔄 تأكيد طلب الإلغاء والاسترداد'}
              </button>

              <p style={{ textAlign:'center', fontSize:11, color:C.muted, margin:'12px 0 0' }}>
                بتأكيد الطلب توافق على سياسة الإلغاء المذكورة أعلاه
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
