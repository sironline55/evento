'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState, useRef } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useParams } from 'next/navigation'
import Link from 'next/link'

const C = { navy:'#1E0A3C',orange:'#F05537',muted:'#6F7287',border:'#DBDAE3',card:'#FFFFFF',green:'#3A7D0A' }

/* ── Animated App Clip–style circular code ── */
function CircularCode({ code, size = 220 }: { code: string; size?: number }) {
  const cx = size / 2
  const cy = size / 2

  const rings = [
    { r:98,  segs:36, sw:7.8, fill:.64, dir:'ccw', speed:28 },
    { r:83,  segs:30, sw:6.8, fill:.63, dir:'cw',  speed:22 },
    { r:69,  segs:25, sw:5.8, fill:.63, dir:'ccw', speed:18 },
    { r:56,  segs:20, sw:5.0, fill:.63, dir:'cw',  speed:14 },
    { r:44,  segs:15, sw:4.2, fill:.63, dir:'ccw', speed:11 },
    { r:33,  segs:11, sw:3.4, fill:.62, dir:'cw',  speed: 9 },
  ]

  // Deterministic bits from code
  const bits = Array.from({ length: 400 }, (_, i) => {
    const a = code.charCodeAt(i % code.length)
    return ((a * 17 + i * 31 + Math.floor(i / code.length) * 97) % 3) === 0 ? 1 : 0
  })

  let bi = 0
  const groups: React.ReactNode[] = []

  rings.forEach((ring, ri) => {
    const step = (2 * Math.PI) / ring.segs
    const paths: React.ReactNode[] = []
    for (let i = 0; i < ring.segs; i++) {
      const sa = i * step - Math.PI / 2
      const ea = sa + step * ring.fill
      const x1 = cx + ring.r * Math.cos(sa)
      const y1 = cy + ring.r * Math.sin(sa)
      const x2 = cx + ring.r * Math.cos(ea)
      const y2 = cy + ring.r * Math.sin(ea)
      const lg = (ea - sa) > Math.PI ? 1 : 0
      const isGray = bits[bi % bits.length] === 1
      bi++
      paths.push(
        <path
          key={i}
          d={`M${x1.toFixed(2)} ${y1.toFixed(2)} A${ring.r} ${ring.r} 0 ${lg} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`}
          stroke={isGray ? '#BBBBBB' : '#0D0D0D'}
          strokeWidth={ring.sw}
          strokeLinecap="round"
          fill="none"
        />
      )
    }
    const anim = ring.dir === 'cw'
      ? `clipSpin_cw_${ring.speed} ${ring.speed}s linear infinite`
      : `clipSpin_ccw_${ring.speed} ${ring.speed}s linear infinite`
    groups.push(
      <g key={ri} style={{ transformOrigin:`${cx}px ${cy}px`, animation: anim }}>
        {paths}
      </g>
    )
  })

  // Generate keyframe CSS
  const speedSet = [...new Set(rings.map(r => r.speed))]
  const keyframes = speedSet.map(s => `
    @keyframes clipSpin_cw_${s}  { from { transform: rotate(0deg);    } to { transform: rotate(360deg);  } }
    @keyframes clipSpin_ccw_${s} { from { transform: rotate(0deg);    } to { transform: rotate(-360deg); } }
  `).join('')

  const parts = code.split('-')
  const line1 = parts[0] || code.slice(0, 3)
  const line2 = parts.slice(1).join('-') || code.slice(3)

  return (
    <>
      <style>{`
        ${keyframes}
        @keyframes clipPulse { 0%,100%{opacity:1} 50%{opacity:.5} }
        .clip-center-text { animation: clipPulse 2.8s ease-in-out infinite; }
        @media print { .clip-center-text { animation: none !important; } }
        @media print { g[style*="animation"] { animation: none !important; } }
      `}</style>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        xmlns="http://www.w3.org/2000/svg"
        style={{ display:'block', background:'#fff', borderRadius:'50%' }}
      >
        {groups}
        {/* White centre */}
        <circle cx={cx} cy={cy} r={24} fill="#FFFFFF" stroke="#E0DDE8" strokeWidth={1.2} />
        {/* Ticket code — pulsing */}
        <g className="clip-center-text">
          <text x={cx} y={cy - 5} textAnchor="middle" fill={C.navy}
            fontSize={8.5} fontWeight={800} fontFamily="'Courier New',monospace" letterSpacing={0.4}>
            {line1}
          </text>
          <text x={cx} y={cy + 8} textAnchor="middle" fill={C.orange}
            fontSize={6.5} fontWeight={700} fontFamily="'Courier New',monospace">
            {line2}
          </text>
        </g>
      </svg>
    </>
  )
}

export default function TicketPage() {
  const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const { id } = useParams()
  const [reg, setReg] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const ticketRef = useRef<HTMLDivElement>(null)

  useEffect(()=>{
    if(!id) return
    sb.from('registrations')
      .select('*,events(title,start_date,end_date,location,location_type,cover_image,category)')
      .eq('qr_code', id)
      .maybeSingle()
      .then(({ data }) => { setReg(data); setLoading(false) })
  }, [id])

  function handlePrint() { window.print() }

  async function handleShare() {
    if (navigator.share) {
      await navigator.share({ title:`تذكرة: ${reg?.events?.title}`, url: window.location.href })
    } else {
      await navigator.clipboard.writeText(window.location.href)
      alert('تم نسخ رابط التذكرة!')
    }
  }

  if (loading) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:C.navy,color:'#fff',fontFamily:'Tajawal,sans-serif'}}>
      جاري التحميل...
    </div>
  )
  if (!reg) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:C.navy,color:'#fff',fontFamily:'Tajawal,sans-serif'}}>
      التذكرة غير موجودة
    </div>
  )

  const ev = reg.events || {}
  const isWaitlisted = reg.status === 'waitlisted'
  const ticketCode = reg.qr_code || reg.id

  return (
    <div style={{minHeight:'100vh',background:`linear-gradient(135deg,${C.navy} 0%,#3D1A78 100%)`,padding:'24px 16px',direction:'rtl'}} className="ticket-root">

      {/* Header */}
      <div style={{maxWidth:460,margin:'0 auto',display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
        <Link href={`/e/${reg.event_id}`} style={{color:'rgba(255,255,255,.6)',textDecoration:'none',fontSize:13}}>← الفعالية</Link>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <div style={{width:28,height:28,background:C.orange,borderRadius:6,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:800,fontSize:12}}>E</div>
          <span style={{color:'rgba(255,255,255,.8)',fontWeight:700,fontSize:14}}>EventVMS</span>
        </div>
      </div>

      {/* Ticket Card */}
      <div ref={ticketRef} style={{maxWidth:400,margin:'0 auto',background:C.card,borderRadius:16,overflow:'hidden',boxShadow:'0 20px 60px rgba(0,0,0,.4)'}}>

        {/* Event banner */}
        <div style={{background:ev.cover_image?'#000':C.orange,height:100,position:'relative',overflow:'hidden'}}>
          {ev.cover_image && <img src={ev.cover_image} alt="" style={{width:'100%',height:'100%',objectFit:'cover',opacity:.7}}/>}
          <div style={{position:'absolute',inset:0,padding:'16px 20px',display:'flex',flexDirection:'column',justifyContent:'flex-end',background:'linear-gradient(transparent,rgba(0,0,0,.6))'}}>
            {ev.category && <span style={{fontSize:10,fontWeight:700,color:'rgba(255,255,255,.8)',textTransform:'uppercase',marginBottom:4}}>{ev.category}</span>}
            <h2 style={{fontSize:16,fontWeight:800,color:'#fff',margin:0,lineHeight:1.2}}>{ev.title}</h2>
          </div>
        </div>

        {/* Status banners */}
        {isWaitlisted && (
          <div style={{background:'#FFF8E8',borderBottom:'1px solid #F5D56B',padding:'8px 20px',textAlign:'center'}}>
            <span style={{fontSize:12,fontWeight:700,color:'#B07000'}}>⏳ أنت في قائمة الانتظار</span>
          </div>
        )}
        {!isWaitlisted && reg.status === 'attended' && (
          <div style={{background:'#EAF7E0',borderBottom:'1px solid #9DE07B',padding:'8px 20px',textAlign:'center'}}>
            <span style={{fontSize:12,fontWeight:700,color:C.green}}>✅ تم تسجيل حضورك</span>
          </div>
        )}

        {/* Details grid */}
        <div style={{padding:'20px 24px'}}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:16}}>
            {[
              { label:'الاسم',       val: reg.guest_name },
              { label:'نوع التذكرة', val: reg.ticket_type || 'عام' },
              { label:'التاريخ',     val: ev.start_date ? new Date(ev.start_date).toLocaleDateString('ar-SA',{year:'numeric',month:'short',day:'numeric'}) : '—' },
              { label:'الموقع',      val: ev.location_type === 'online' ? 'أونلاين' : ev.location || '—' },
            ].map(d => (
              <div key={d.label}>
                <p style={{fontSize:10,color:C.muted,margin:0,fontWeight:600,textTransform:'uppercase'}}>{d.label}</p>
                <p style={{fontSize:13,fontWeight:700,color:C.navy,margin:'4px 0 0'}}>{d.val}</p>
              </div>
            ))}
          </div>

          {/* Dashed divider */}
          <div style={{borderTop:'2px dashed #DBDAE3',margin:'16px -24px',paddingTop:16,position:'relative'}}>
            <div style={{position:'absolute',top:-10,right:-1,width:18,height:20,background:`linear-gradient(135deg,${C.navy},#3D1A78)`,borderRadius:'0 50% 50% 0'}}/>
            <div style={{position:'absolute',top:-10,left:-1,width:18,height:20,background:`linear-gradient(135deg,${C.navy},#3D1A78)`,borderRadius:'50% 0 0 50%'}}/>
          </div>

          {/* Code section */}
          <div style={{textAlign:'center'}}>
            {!isWaitlisted ? (
              <>
                <div style={{display:'inline-block',padding:10,borderRadius:'50%',background:'#F5F4FC',border:'1.5px solid #E0DDE8',marginBottom:10}}>
                  <CircularCode code={ticketCode} size={220} />
                </div>
                <p style={{fontSize:11,color:C.muted,margin:'0 0 4px',fontWeight:600}}>امسح الرمز عند الدخول</p>
                <p style={{fontSize:10,color:'#BBBBBB',margin:0,fontFamily:'monospace',letterSpacing:1,direction:'ltr'}}>{ticketCode}</p>
              </>
            ) : (
              <div style={{padding:'20px',textAlign:'center'}}>
                <div style={{fontSize:40,marginBottom:8}}>⏳</div>
                <p style={{fontSize:13,color:C.muted}}>سيصبح الرمز متاحاً بعد تأكيد مقعدك</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{background:'#F8F7FA',padding:'12px 24px',borderTop:`1px solid ${C.border}`,textAlign:'center'}}>
          <p style={{fontSize:11,color:C.muted,margin:0}}>رقم التذكرة: <strong style={{fontFamily:'monospace'}}>{reg.id.slice(0,8).toUpperCase()}</strong></p>
        </div>
      </div>

      {/* Buttons */}
      <div style={{maxWidth:400,margin:'20px auto 0',display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
        <button onClick={handlePrint} style={{padding:'12px',border:'2px solid rgba(255,255,255,.3)',borderRadius:8,background:'transparent',color:'#fff',fontWeight:700,fontSize:13,cursor:'pointer',fontFamily:'inherit'}}>
          🖨️ طباعة
        </button>
        <button onClick={handleShare} style={{padding:'12px',border:'none',borderRadius:8,background:C.orange,color:'#fff',fontWeight:700,fontSize:13,cursor:'pointer',fontFamily:'inherit'}}>
          📤 مشاركة
        </button>
      </div>

      <div style={{textAlign:'center',marginTop:20}}>
        <Link href={`/e/${reg.event_id}`} style={{color:'rgba(255,255,255,.5)',fontSize:12,textDecoration:'none'}}>عرض تفاصيل الفعالية</Link>
      </div>

      <style>{`
        @media print {
          .ticket-root { background: white !important; padding: 0 !important; }
          button, a:not([href]) { display: none !important; }
        }
      `}</style>
    </div>
  )
}
