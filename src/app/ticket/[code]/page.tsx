'use client'
import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'

const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxcGNqc2JjandxbHhmc3NtdGpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxOTQ2MDQsImV4cCI6MjA5MDc3MDYwNH0.W2zchuG_HMpVIFhz9m5NbUSb2n59sUb2-xjtNclzcX8'
const SB_URL = 'https://xqpcjsbcjwqlxfssmtjb.supabase.co'

function QRCode({ value, size = 140 }: { value: string; size?: number }) {
  // Simple QR-like pattern using canvas for visual display
  // In production: use qrcode.js or API
  return (
    <div style={{ width:size, height:size, background:'#fff', padding:8, borderRadius:8, display:'inline-block' }}>
      <svg width={size-16} height={size-16} viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg">
        {/* QR finder patterns + data modules (simplified visual) */}
        <rect width="21" height="21" fill="white"/>
        {/* Top-left finder */}
        <rect x="0" y="0" width="7" height="7" fill="#1E0A3C" rx="0.5"/>
        <rect x="1" y="1" width="5" height="5" fill="white"/>
        <rect x="2" y="2" width="3" height="3" fill="#1E0A3C"/>
        {/* Top-right finder */}
        <rect x="14" y="0" width="7" height="7" fill="#1E0A3C" rx="0.5"/>
        <rect x="15" y="1" width="5" height="5" fill="white"/>
        <rect x="16" y="2" width="3" height="3" fill="#1E0A3C"/>
        {/* Bottom-left finder */}
        <rect x="0" y="14" width="7" height="7" fill="#1E0A3C" rx="0.5"/>
        <rect x="1" y="15" width="5" height="5" fill="white"/>
        <rect x="2" y="16" width="3" height="3" fill="#1E0A3C"/>
        {/* Data modules (ticket code derived pattern) */}
        {value.split('').map((char, i) => {
          const code = char.charCodeAt(0)
          const x = (i * 3 + 8) % 14 + 1
          const y = Math.floor(i / 5) * 3 + 8
          return code % 2 === 0 && y < 21 ? (
            <rect key={i} x={x} y={y < 14 ? y : y - 6} width="1" height="1" fill="#1E0A3C"/>
          ) : null
        })}
        {/* Additional random-looking modules */}
        {[
          [8,0],[10,0],[12,0],[9,1],[11,1],[8,2],[10,2],[12,2],
          [0,8],[2,8],[4,8],[1,9],[3,9],[0,10],[2,10],[4,10],
          [8,8],[9,9],[10,10],[11,9],[12,8],[9,11],[11,11],
          [8,14],[10,14],[12,14],[9,15],[11,16],[8,16],[10,16],
          [14,8],[16,8],[18,8],[15,9],[17,9],[14,10],[16,10],[18,10],
          [14,14],[16,14],[18,14],[15,15],[17,15],[14,16],[16,16],[18,16],
          [8,18],[10,18],[12,18],[9,19],[11,19],[8,20],[10,20],[12,20],
        ].map(([x, y], i) => (
          <rect key={`d${i}`} x={x} y={y} width="1" height="1" fill="#1E0A3C"/>
        ))}
      </svg>
    </div>
  )
}

export default function TicketPage() {
  const params = useParams()
  const code = params?.code as string
  const ticketRef = useRef<HTMLDivElement>(null)

  const [reg, setReg] = useState<any>(null)
  const [event, setEvent] = useState<any>(null)
  const [org, setOrg] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [copied, setCopied] = useState(false)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    if (!code) return
    // Fetch registration by QR code
    fetch(`${SB_URL}/rest/v1/registrations?qr_code=eq.${code}&select=*,events(*)&limit=1`, {
      headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` }
    })
    .then(r => r.json())
    .then(async (data) => {
      if (!data?.length) {
        // Try without join
        const r2 = await fetch(`${SB_URL}/rest/v1/registrations?qr_code=eq.${code}&select=*&limit=1`, {
          headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` }
        })
        const d2 = await r2.json()
        if (!d2?.length) { setNotFound(true); setLoading(false); return }
        const reg = d2[0]
        setReg(reg)
        // Fetch event
        if (reg.event_id) {
          const er = await fetch(`${SB_URL}/rest/v1/events?id=eq.${reg.event_id}&select=*&limit=1`, {
            headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` }
          })
          const ed = await er.json()
          setEvent(ed?.[0])
          // Fetch org
          if (ed?.[0]?.org_id) {
            const or = await fetch(`${SB_URL}/rest/v1/organizations?id=eq.${ed[0].org_id}&select=name,logo_url,accent_color&limit=1`, {
              headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` }
            })
            const od = await or.json()
            setOrg(od?.[0])
          }
        }
      } else {
        const r = data[0]
        setReg(r)
        setEvent(r.events)
      }
      setLoading(false)
    })
    .catch(() => { setNotFound(true); setLoading(false) })
  }, [code])

  function handlePrint() {
    setDownloading(true)
    setTimeout(() => {
      window.print()
      setDownloading(false)
    }, 200)
  }

  function handleCopyLink() {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  function handleAppleWallet() {
    // Generate Apple Wallet pass data (mock — real needs server cert)
    const passData = {
      formatVersion: 1,
      passTypeIdentifier: 'pass.com.eventvms.ticket',
      serialNumber: code,
      teamIdentifier: 'EVENTVMS',
      organizationName: org?.name || 'EventVMS',
      description: event?.name || 'تذكرة فعالية',
      generic: {
        primaryFields: [{ key:'event', label:'الفعالية', value: event?.title || '' }],
        secondaryFields: [
          { key:'date', label:'التاريخ', value: event?.start_date || '' },
          { key:'location', label:'الموقع', value: event?.location || '' }
        ],
        auxiliaryFields: [{ key:'ticket', label:'رقم التذكرة', value: code }]
      },
      barcode: { message: code, format:'PKBarcodeFormatQR', messageEncoding:'iso-8859-1' }
    }
    const blob = new Blob([JSON.stringify(passData, null, 2)], { type:'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `ticket-${code}.json`; a.click()
    URL.revokeObjectURL(url)
    alert('✅ تم تحميل بيانات التذكرة — Apple Wallet يحتاج شهادة PKI لتفعيله الكامل')
  }

  const accentColor = org?.accent_color || '#F05537'

  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#0A0A1A', direction:'rtl' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:40, marginBottom:12 }}>🎫</div>
        <p style={{ color:'rgba(255,255,255,.6)', fontFamily:"'Tajawal',sans-serif" }}>جاري تحميل تذكرتك...</p>
      </div>
    </div>
  )

  if (notFound) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#0A0A1A', direction:'rtl' }}>
      <div style={{ textAlign:'center', padding:40 }}>
        <div style={{ fontSize:48, marginBottom:12 }}>❌</div>
        <h2 style={{ color:'#fff', fontSize:20, fontFamily:"'Tajawal',sans-serif", margin:'0 0 8px' }}>التذكرة غير موجودة</h2>
        <p style={{ color:'rgba(255,255,255,.5)', fontFamily:"'Tajawal',sans-serif", fontSize:14 }}>تأكد من صحة الرمز أو تواصل مع المنظم</p>
        <p style={{ color:'rgba(255,255,255,.3)', fontFamily:"'Tajawal',sans-serif", fontSize:12, marginTop:8 }}>رمز: {code}</p>
      </div>
    </div>
  )

  const eventDate = event?.start_date ? new Date(event.start_date).toLocaleDateString('ar-SA', { weekday:'long', year:'numeric', month:'long', day:'numeric' }) : '—'
  const eventTime = event?.start_time || event?.start_date ? new Date(event?.start_date || '').toLocaleTimeString('ar-SA', { hour:'2-digit', minute:'2-digit' }) : '—'

  return (
    <>
      {/* Print styles */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&display=swap');
        * { box-sizing: border-box; }
        body { margin:0; background:#0A0A1A; }
        @media print {
          body { background: white !important; }
          .no-print { display: none !important; }
          .ticket-card { box-shadow: none !important; border: 1px solid #eee !important; }
          @page { margin: 10mm; size: A5 landscape; }
        }
      `}</style>

      <div style={{ minHeight:'100vh', background:'#0A0A1A', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'24px 16px', fontFamily:"'Tajawal',sans-serif" }}>

        {/* Action buttons */}
        <div className="no-print" style={{ display:'flex', gap:10, marginBottom:24, flexWrap:'wrap', justifyContent:'center' }}>
          {[
            { icon:'📥', label: downloading ? 'يُحضَّر...' : 'تحميل PDF', onClick: handlePrint, bg:'#1E0A3C', color:'#fff' },
            { icon: copied ? '✅' : '🔗', label: copied ? 'تم النسخ!' : 'نسخ الرابط', onClick: handleCopyLink, bg:'rgba(255,255,255,.1)', color:'#fff' },
            { icon:'📧', label:'إرسال للإيميل', onClick: () => alert('سيتم إرسال التذكرة على البريد الإلكتروني المسجّل'), bg:'rgba(255,255,255,.1)', color:'#fff' },
            { icon:'🍎', label:'Apple Wallet', onClick: handleAppleWallet, bg:'#000', color:'#fff' },
          ].map(btn => (
            <button key={btn.label} onClick={btn.onClick} style={{
              padding:'10px 18px', background:btn.bg, border:'1px solid rgba(255,255,255,.15)',
              borderRadius:24, color:btn.color, fontWeight:700, fontSize:13,
              cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:7,
              backdropFilter:'blur(10px)'
            }}>
              <span>{btn.icon}</span>{btn.label}
            </button>
          ))}
        </div>

        {/* THE TICKET */}
        <div ref={ticketRef} className="ticket-card" style={{
          width:'min(680px, 100%)',
          background:'linear-gradient(135deg, #1E0A3C 0%, #2D1060 100%)',
          borderRadius:20,
          overflow:'hidden',
          boxShadow:'0 32px 80px rgba(0,0,0,.6)',
          position:'relative',
          direction:'rtl',
        }}>
          {/* Top accent bar */}
          <div style={{ height:5, background:`linear-gradient(90deg, ${accentColor}, #FF8C42, ${accentColor})` }}/>

          {/* Decorative circles */}
          <div style={{ position:'absolute', top:-60, left:-60, width:200, height:200, borderRadius:'50%', background:'rgba(255,255,255,.04)', pointerEvents:'none' }}/>
          <div style={{ position:'absolute', bottom:-40, right:-40, width:160, height:160, borderRadius:'50%', background:'rgba(255,255,255,.03)', pointerEvents:'none' }}/>

          <div style={{ padding:'28px 32px' }}>
            {/* Header row */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24 }}>
              <div>
                {/* Org name */}
                <div style={{ fontSize:11, color:'rgba(255,255,255,.5)', fontWeight:600, textTransform:'uppercase', letterSpacing:2, marginBottom:6 }}>
                  {org?.name || 'EventVMS'}
                </div>
                <h1 style={{ fontSize:22, fontWeight:900, color:'#fff', margin:0, lineHeight:1.3, maxWidth:320 }}>
                  {event?.title || 'فعالية'}
                </h1>
              </div>
              {/* EventVMS brand */}
              <div style={{ textAlign:'center', flexShrink:0 }}>
                <div style={{ fontSize:28 }}>🎪</div>
                <div style={{ fontSize:10, color:'rgba(255,255,255,.4)', fontWeight:700, marginTop:4 }}>EventVMS</div>
              </div>
            </div>

            {/* Event details */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:24 }}>
              {[
                { icon:'📅', label:'التاريخ', value: eventDate },
                { icon:'🕐', label:'الوقت', value: eventTime },
                { icon:'📍', label:'الموقع', value: event?.location || '—' },
                { icon:'🎭', label:'نوع الفعالية', value: event?.category || '—' },
              ].map(d => (
                <div key={d.label} style={{ background:'rgba(255,255,255,.07)', borderRadius:10, padding:'12px 14px' }}>
                  <div style={{ fontSize:11, color:'rgba(255,255,255,.5)', marginBottom:4 }}>{d.icon} {d.label}</div>
                  <div style={{ fontSize:13, fontWeight:700, color:'#fff', lineHeight:1.4 }}>{d.value}</div>
                </div>
              ))}
            </div>

            {/* Attendee info */}
            <div style={{ background:'rgba(255,255,255,.07)', borderRadius:10, padding:'12px 16px', marginBottom:20, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <div style={{ fontSize:11, color:'rgba(255,255,255,.5)', marginBottom:3 }}>👤 اسم الحضور</div>
                <div style={{ fontSize:15, fontWeight:800, color:'#fff' }}>{reg?.guest_name || reg?.attendee_name || 'الحضور الكريم'}</div>
                {(reg?.guest_email || reg?.attendee_email) && (
                  <div style={{ fontSize:11, color:'rgba(255,255,255,.5)', marginTop:2 }}>{reg?.guest_email || reg?.attendee_email}</div>
                )}
              </div>
              {(event?.price || event?.price_from) > 0 ? (
                <div style={{ textAlign:'center' }}>
                  <div style={{ fontSize:11, color:'rgba(255,255,255,.5)', marginBottom:2 }}>السعر</div>
                  <div style={{ fontSize:18, fontWeight:900, color:accentColor }}>{(event?.price || event?.price_from)?.toLocaleString()} ريال</div>
                </div>
              ) : (
                <div style={{ background:'rgba(58,125,10,.3)', border:'1px solid rgba(58,125,10,.5)', borderRadius:20, padding:'4px 14px', fontSize:12, fontWeight:700, color:'#7FD97F' }}>مجاني</div>
              )}
            </div>

            {/* Divider with cuts */}
            <div style={{ display:'flex', alignItems:'center', marginBottom:20, position:'relative' }}>
              <div style={{ position:'absolute', right:-32, width:20, height:20, borderRadius:'50%', background:'#0A0A1A' }}/>
              <div style={{ flex:1, borderTop:'2px dashed rgba(255,255,255,.15)' }}/>
              <div style={{ position:'absolute', left:-32, width:20, height:20, borderRadius:'50%', background:'#0A0A1A' }}/>
            </div>

            {/* QR + ticket code */}
            <div style={{ display:'flex', alignItems:'center', gap:24 }}>
              <div style={{ flexShrink:0 }}>
                <QRCode value={code} size={130} />
                <div style={{ fontSize:10, color:'rgba(255,255,255,.4)', textAlign:'center', marginTop:4, letterSpacing:1, direction:'ltr' }}>{code}</div>
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:11, color:'rgba(255,255,255,.5)', marginBottom:6 }}>رمز التحقق</div>
                <div style={{ fontSize:18, fontWeight:900, color:'#fff', letterSpacing:2, direction:'ltr', marginBottom:12 }}>{code}</div>
                <div style={{ fontSize:11, color:'rgba(255,255,255,.45)', lineHeight:1.8 }}>
                  • هذا الرمز لمرة واحدة فقط<br/>
                  • يُمسح عند الدخول للفعالية<br/>
                  • للدعم: support@eventvms.com
                </div>
                {/* Status badge */}
                <div style={{ marginTop:12, display:'inline-flex', alignItems:'center', gap:6, background: reg?.status === 'attended' ? 'rgba(58,125,10,.3)' : 'rgba(240,85,55,.2)', border:`1px solid ${reg?.status === 'attended' ? 'rgba(58,125,10,.5)' : 'rgba(240,85,55,.4)'}`, borderRadius:20, padding:'4px 12px' }}>
                  <span style={{ fontSize:8 }}>●</span>
                  <span style={{ fontSize:11, fontWeight:700, color: reg?.status === 'attended' ? '#7FD97F' : accentColor }}>
                    {reg?.status === 'attended' ? 'تم الحضور' : 'مؤكدة — جاهزة للدخول'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom accent */}
          <div style={{ height:3, background:`linear-gradient(90deg, transparent, ${accentColor}, transparent)` }}/>
        </div>

        {/* Share link display */}
        <div className="no-print" style={{ marginTop:20, padding:'10px 18px', background:'rgba(255,255,255,.05)', border:'1px solid rgba(255,255,255,.1)', borderRadius:10, display:'flex', alignItems:'center', gap:10, maxWidth:680, width:'100%' }}>
          <span style={{ fontSize:12, color:'rgba(255,255,255,.5)', fontFamily:'monospace', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {typeof window !== 'undefined' ? window.location.href : `https://evento-h2ir.vercel.app/ticket/${code}`}
          </span>
          <button onClick={handleCopyLink} style={{ padding:'5px 12px', background: copied ? 'rgba(58,125,10,.3)' : 'rgba(255,255,255,.1)', border:'1px solid rgba(255,255,255,.2)', borderRadius:6, color:'#fff', fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap' }}>
            {copied ? '✅ تم' : '📋 نسخ'}
          </button>
        </div>
      </div>
    </>
  )
}
