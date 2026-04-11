'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState, useRef } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useParams } from 'next/navigation'
import Link from 'next/link'

const C = { navy:'#1E0A3C',orange:'#F05537',text:'#39364F',muted:'#6F7287',border:'#DBDAE3',bg:'#FAFAFA',card:'#FFFFFF',green:'#3A7D0A' }

/* ── App Clip–style circular code ── */
function CircularCode({ code, size = 220 }: { code: string; size?: number }) {
  const cx = size / 2
  const cy = size / 2

  // Deterministic bit sequence from ticket code
  const bits = Array.from({ length: 300 }, (_, i) => {
    const a = code.charCodeAt(i % code.length)
    const b = (i * 31 + 17) ^ (a * 7)
    return b % 3 === 0 ? 1 : 0   // ~33% gray, ~67% black
  })

  const rings = [
    { r: 97, segs: 34, sw: 7.5, fill: 0.62 },
    { r: 82, segs: 29, sw: 6.5, fill: 0.60 },
    { r: 68, segs: 24, sw: 5.5, fill: 0.62 },
    { r: 55, segs: 19, sw: 5,   fill: 0.60 },
    { r: 43, segs: 15, sw: 4,   fill: 0.62 },
  ]

  let bitIdx = 0
  const arcs: React.ReactNode[] = []

  rings.forEach((ring, ri) => {
    const step = (2 * Math.PI) / ring.segs
    for (let i = 0; i < ring.segs; i++) {
      const startA = i * step - Math.PI / 2
      const endA   = startA + step * ring.fill

      const x1 = cx + ring.r * Math.cos(startA)
      const y1 = cy + ring.r * Math.sin(startA)
      const x2 = cx + ring.r * Math.cos(endA)
      const y2 = cy + ring.r * Math.sin(endA)

      const isGray = bits[bitIdx % bits.length] === 1
      bitIdx++

      arcs.push(
        <path
          key={`${ri}-${i}`}
          d={`M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${ring.r} ${ring.r} 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`}
          stroke={isGray ? '#BBBBBB' : '#1E0A3C'}
          strokeWidth={ring.sw}
          strokeLinecap="round"
          fill="none"
        />
      )
    }
  })

  // Split code for display in centre
  const parts = code.split('-')                  // e.g. ["EVT","TICKET001"]
  const line1 = parts[0] || code.slice(0, 3)    // "EVT"
  const line2 = parts.slice(1).join('-') || code.slice(3)  // "TICKET001"

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} xmlns="http://www.w3.org/2000/svg">
      {arcs}

      {/* Centre white circle */}
      <circle cx={cx} cy={cy} r={31} fill="#FFFFFF" stroke="#E8E6EF" strokeWidth={1.5} />

      {/* Ticket code text */}
      <text
        x={cx} y={cy - 5}
        textAnchor="middle"
        fill={C.navy}
        fontSize="9"
        fontWeight="800"
        fontFamily="'Courier New', monospace"
        letterSpacing="0.5"
      >{line1}</text>
      <text
        x={cx} y={cy + 8}
        textAnchor="middle"
        fill={C.orange}
        fontSize="7.5"
        fontWeight="700"
        fontFamily="'Courier New', monospace"
        letterSpacing="0.3"
      >{line2}</text>
    </svg>
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
    sb.from('registrations').select('*,events(title,start_date,end_date,location,location_type,cover_image,category)').eq('qr_code',id).maybeSingle()
      .then(({data})=>{ setReg(data); setLoading(false) })
  },[id])

  function handlePrint() { window.print() }

  async function handleShare() {
    if(navigator.share) {
      await navigator.share({ title:`تذكرة: ${reg?.events?.title}`, url:window.location.href })
    } else {
      await navigator.clipboard.writeText(window.location.href)
      alert('تم نسخ رابط التذكرة!')
    }
  }

  if(loading) return <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:C.navy,color:'#fff'}}>جاري التحميل...</div>
  if(!reg)    return <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:C.navy,color:'#fff'}}>التذكرة غير موجودة</div>

  const ev = reg.events||{}
  const isWaitlisted = reg.status==='waitlisted'
  const ticketCode = reg.qr_code || reg.id

  return (
    <div style={{minHeight:'100vh',background:`linear-gradient(135deg, ${C.navy} 0%, #3D1A78 100%)`,padding:'24px 16px',direction:'rtl'}} className="ticket-root">
      {/* Header */}
      <div style={{maxWidth:460,margin:'0 auto',display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
        <Link href={`/e/${reg.event_id}`} style={{color:'rgba(255,255,255,0.6)',textDecoration:'none',fontSize:13}}>← الفعالية</Link>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <div style={{width:28,height:28,background:C.orange,borderRadius:6,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:800,fontSize:12}}>E</div>
          <span style={{color:'rgba(255,255,255,0.8)',fontWeight:700,fontSize:14}}>EventVMS</span>
        </div>
      </div>

      {/* Ticket Card */}
      <div ref={ticketRef} style={{maxWidth:400,margin:'0 auto',background:C.card,borderRadius:16,overflow:'hidden',boxShadow:'0 20px 60px rgba(0,0,0,0.4)'}}>
        {/* Top: Event image / color */}
        <div style={{background:ev.cover_image?'#000':C.orange,height:100,position:'relative',overflow:'hidden'}}>
          {ev.cover_image && <img src={ev.cover_image} alt="" style={{width:'100%',height:'100%',objectFit:'cover',opacity:0.7}}/>}
          <div style={{position:'absolute',inset:0,padding:'16px 20px',display:'flex',flexDirection:'column',justifyContent:'flex-end',background:'linear-gradient(transparent,rgba(0,0,0,0.6))'}}>
            {ev.category && <span style={{fontSize:10,fontWeight:700,color:'rgba(255,255,255,0.8)',textTransform:'uppercase',marginBottom:4}}>{ev.category}</span>}
            <h2 style={{fontSize:16,fontWeight:800,color:'#fff',margin:0,lineHeight:1.2}}>{ev.title}</h2>
          </div>
        </div>

        {/* Status banner */}
        {isWaitlisted && (
          <div style={{background:'#FFF8E8',borderBottom:`1px solid #F5D56B`,padding:'8px 20px',textAlign:'center'}}>
            <span style={{fontSize:12,fontWeight:700,color:'#B07000'}}>⏳ أنت في قائمة الانتظار</span>
          </div>
        )}
        {!isWaitlisted && reg.status==='attended' && (
          <div style={{background:'#EAF7E0',borderBottom:`1px solid #9DE07B`,padding:'8px 20px',textAlign:'center'}}>
            <span style={{fontSize:12,fontWeight:700,color:C.green}}>✅ تم تسجيل حضورك</span>
          </div>
        )}

        {/* Ticket details */}
        <div style={{padding:'20px 24px'}}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:16}}>
            <div>
              <p style={{fontSize:10,color:C.muted,margin:0,fontWeight:600,textTransform:'uppercase'}}>الاسم</p>
              <p style={{fontSize:14,fontWeight:700,color:C.navy,margin:'4px 0 0'}}>{reg.guest_name}</p>
            </div>
            <div>
              <p style={{fontSize:10,color:C.muted,margin:0,fontWeight:600,textTransform:'uppercase'}}>نوع التذكرة</p>
              <p style={{fontSize:14,fontWeight:700,color:C.navy,margin:'4px 0 0'}}>{reg.ticket_type||'عام'}</p>
            </div>
            <div>
              <p style={{fontSize:10,color:C.muted,margin:0,fontWeight:600,textTransform:'uppercase'}}>التاريخ</p>
              <p style={{fontSize:13,fontWeight:700,color:C.navy,margin:'4px 0 0'}}>
                {ev.start_date?new Date(ev.start_date).toLocaleDateString('ar-SA',{year:'numeric',month:'short',day:'numeric'}):'—'}
              </p>
            </div>
            <div>
              <p style={{fontSize:10,color:C.muted,margin:0,fontWeight:600,textTransform:'uppercase'}}>الموقع</p>
              <p style={{fontSize:13,fontWeight:700,color:C.navy,margin:'4px 0 0'}}>{ev.location_type==='online'?'أونلاين':ev.location||'—'}</p>
            </div>
          </div>

          {/* Dashed divider */}
          <div style={{borderTop:'2px dashed #DBDAE3',margin:'16px -24px',paddingTop:16,position:'relative'}}>
            <div style={{position:'absolute',top:-10,right:-1,width:18,height:20,background:`linear-gradient(135deg, ${C.navy} 0%, #3D1A78 100%)`,borderRadius:'0 50% 50% 0'}}/>
            <div style={{position:'absolute',top:-10,left:-1,width:18,height:20,background:`linear-gradient(135deg, ${C.navy} 0%, #3D1A78 100%)`,borderRadius:'50% 0 0 50%'}}/>
          </div>

          {/* Circular Code */}
          <div style={{textAlign:'center'}}>
            {!isWaitlisted ? (
              <>
                <div style={{display:'inline-block',padding:8,borderRadius:'50%',background:'#F8F7FF',border:`2px solid ${C.border}`,marginBottom:10}}>
                  <CircularCode code={ticketCode} size={220} />
                </div>
                <p style={{fontSize:11,color:C.muted,margin:'0 0 3px',fontWeight:600}}>امسح الرمز عند الدخول</p>
                <p style={{fontSize:10,color:C.border,margin:0,fontFamily:'monospace',letterSpacing:1,direction:'ltr'}}>{ticketCode}</p>
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

      {/* Action buttons */}
      <div style={{maxWidth:400,margin:'20px auto 0',display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
        <button onClick={handlePrint} style={{
          padding:'12px',border:'2px solid rgba(255,255,255,0.3)',borderRadius:8,
          background:'transparent',color:'#fff',fontWeight:700,fontSize:13,cursor:'pointer',fontFamily:'inherit'
        }}>🖨️ طباعة</button>
        <button onClick={handleShare} style={{
          padding:'12px',border:'none',borderRadius:8,
          background:C.orange,color:'#fff',fontWeight:700,fontSize:13,cursor:'pointer',fontFamily:'inherit'
        }}>📤 مشاركة</button>
      </div>

      <div style={{textAlign:'center',marginTop:20}}>
        <Link href={`/e/${reg.event_id}`} style={{color:'rgba(255,255,255,0.5)',fontSize:12,textDecoration:'none'}}>عرض تفاصيل الفعالية</Link>
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
