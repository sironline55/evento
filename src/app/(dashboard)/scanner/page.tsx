'use client'
import { useState, useRef, useEffect, useCallback, Suspense } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

const sb = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const C = {
  navy:'#1E0A3C', orange:'#F05537', text:'#39364F',
  muted:'#6F7287', border:'#DBDAE3', bg:'#FAFAFA', card:'#FFFFFF', green:'#3A7D0A'
}

type ScanResult = { type:'success'|'warning'|'error'; message:string; name?:string; event?:string; ticket_type?:string; ref?:string }
type HistoryItem = { name:string; event:string; time:string; type:string; ref?:string }

const STYLES: Record<string,{bg:string;border:string;color:string;icon:string}> = {
  success:{ bg:'#EAF7E0', border:C.green, color:'#1A5A00', icon:'✅' },
  warning:{ bg:'#FFF8E8', border:'#B07000', color:'#7A5000', icon:'⚠️' },
  error:  { bg:'#FEF2F2', border:'#DC2626', color:'#B91C1C', icon:'❌' },
}

function ScannerInner() {
  const sp = useSearchParams()
  const preselectedEvent = sp.get('event')

  const [events, setEvents]     = useState<any[]>([])
  const [selEvent, setSelEvent] = useState<string>(preselectedEvent||'all')
  const [selEventName, setSelEventName] = useState<string>('')
  const [qrInput, setQrInput]   = useState('')
  const [result, setResult]     = useState<ScanResult|null>(null)
  const [loading, setLoading]   = useState(false)
  const [history, setHistory]   = useState<HistoryItem[]>([])
  const [cameraOn, setCameraOn] = useState(false)
  const [cameraErr, setCameraErr] = useState('')
  const [stats, setStats] = useState({ total:0, success:0, already:0, invalid:0 })
  const [liveCount, setLiveCount] = useState<number|null>(null)
  const videoRef  = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const inputRef  = useRef<HTMLInputElement>(null)
  const streamRef = useRef<MediaStream|null>(null)
  const scanActive = useRef(false)
  const lastScanned = useRef('')

  useEffect(() => {
    sb.from('events')
      .select('id,title,start_date,status')
      .in('status',['published','active','draft'])
      .order('start_date',{ascending:false})
      .limit(50)
      .then(({data})=>{
        setEvents(data||[])
        if (preselectedEvent) {
          const ev = (data||[]).find((e:any)=>e.id===preselectedEvent)
          if (ev) setSelEventName(ev.title)
        }
      })
  },[])

  // Live attendance count for selected event
  useEffect(() => {
    if (selEvent === 'all') { setLiveCount(null); return }
    const fetchCount = () =>
      sb.from('registrations').select('*',{count:'exact',head:true}).eq('event_id',selEvent).eq('status','attended')
        .then(({count})=>setLiveCount(count||0))
    fetchCount()
    const channel = sb.channel(`reg-${selEvent}`)
      .on('postgres_changes',{ event:'UPDATE', schema:'public', table:'registrations', filter:`event_id=eq.${selEvent}` },fetchCount)
      .subscribe()
    return () => { sb.removeChannel(channel) }
  },[selEvent])

  const handleCodeFound = useCallback(async (code: string) => {
    if (!code || loading || code === lastScanned.current) return
    lastScanned.current = code
    setTimeout(() => { lastScanned.current = '' }, 2000)

    setLoading(true); setResult(null)
    try {
      let q = sb.from('registrations')
        .select('id,guest_name,status,qr_code,ticket_type,ticket_reference,events(title)')
        .eq('qr_code', code)
      if (selEvent !== 'all') q = q.eq('event_id', selEvent)
      const { data: reg } = await q.maybeSingle()

      setStats(s=>({...s, total:s.total+1}))
      if (!reg) {
        setResult({ type:'error', message:'رمز غير صالح أو لا ينتمي لهذه الفعالية' })
        setStats(s=>({...s, invalid:s.invalid+1}))
      } else if (reg.status==='attended') {
        setResult({ type:'warning', message:'تم مسح هذه التذكرة مسبقاً', name:reg.guest_name, event:(reg.events as any)?.title, ticket_type:reg.ticket_type, ref:reg.ticket_reference })
        setStats(s=>({...s, already:s.already+1}))
      } else {
        await sb.from('registrations').update({ status:'attended', checked_in_at:new Date().toISOString() }).eq('id',reg.id)
        setResult({ type:'success', message:'تم تسجيل الحضور ✓', name:reg.guest_name, event:(reg.events as any)?.title, ticket_type:reg.ticket_type, ref:reg.ticket_reference })
        setHistory(h=>[{ name:reg.guest_name, event:(reg.events as any)?.title||'—', time:new Date().toLocaleTimeString('ar-SA'), type:'success', ref:reg.ticket_reference }, ...h.slice(0,29)])
        setStats(s=>({...s, success:s.success+1}))
      }
    } catch { setResult({ type:'error', message:'خطأ في الاتصال' }) }
    finally { setLoading(false); setQrInput(''); setTimeout(()=>inputRef.current?.focus(),100) }
  },[selEvent, loading])

  const processFrame = useCallback(async () => {
    if (!scanActive.current || !videoRef.current || !canvasRef.current) return
    const video = videoRef.current
    if (video.readyState < 2) { requestAnimationFrame(processFrame); return }
    const canvas = canvasRef.current
    canvas.width = video.videoWidth; canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(video, 0, 0)
    if ('BarcodeDetector' in window) {
      try {
        const bd = new (window as any).BarcodeDetector({formats:['qr_code']})
        const codes = await bd.detect(canvas)
        if (codes.length > 0) {
          const code = codes[0].rawValue
          scanActive.current = false
          await handleCodeFound(code)
          setTimeout(() => { scanActive.current = true; requestAnimationFrame(processFrame) }, 2500)
          return
        }
      } catch {}
    }
    requestAnimationFrame(processFrame)
  },[handleCodeFound])

  async function startCamera() {
    setCameraErr('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video:{ facingMode:'environment' } })
      streamRef.current = stream
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play() }
      setCameraOn(true)
      scanActive.current = true
      requestAnimationFrame(processFrame)
    } catch(e:any) {
      setCameraErr(e.name==='NotAllowedError' ? 'يرجى السماح للمتصفح بالوصول للكاميرا' : 'تعذّر تشغيل الكاميرا')
    }
  }

  function stopCamera() {
    scanActive.current = false
    streamRef.current?.getTracks().forEach(t=>t.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    setCameraOn(false)
  }

  useEffect(() => () => stopCamera(), [])

  return (
    <div style={{ minHeight:'100vh', background:C.bg, direction:'rtl' }}>
      {/* Header */}
      <div style={{ background:C.card, borderBottom:`1px solid ${C.border}`, padding:'16px 20px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
          <div>
            <h1 style={{ fontSize:22, fontWeight:800, margin:0, color:C.navy }}>📷 ماسح التذاكر</h1>
            {selEvent !== 'all' && selEventName && (
              <p style={{ fontSize:12, color:C.orange, margin:'3px 0 0', fontWeight:600 }}>📍 {selEventName}</p>
            )}
          </div>
          <div style={{ display:'flex', gap:8 }}>
            {selEvent !== 'all' && (
              <Link href={`/events/${selEvent}`} style={{ padding:'7px 14px', background:'#EDE9F7', color:'#7B4FBF', borderRadius:6, textDecoration:'none', fontWeight:700, fontSize:12 }}>
                ← الفعالية
              </Link>
            )}
            <Link href="/attendees" style={{ padding:'7px 14px', background:'#F0EDF7', color:C.navy, borderRadius:6, textDecoration:'none', fontWeight:700, fontSize:12 }}>
              👥 الزوار
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8 }}>
          {[
            { label:'إجمالي', value:stats.total, color:C.navy, bg:'#F0EDF7' },
            { label:'نجاح', value:stats.success, color:C.green, bg:'#EAF7E0' },
            { label:'مسبقاً', value:stats.already, color:'#B07000', bg:'#FFF8E8' },
            { label:'خاطئ', value:stats.invalid, color:'#DC2626', bg:'#FEF2F2' },
          ].map(s=>(
            <div key={s.label} style={{ background:s.bg, borderRadius:7, padding:'8px 10px' }}>
              <p style={{ fontSize:18, fontWeight:800, color:s.color, margin:0 }}>{s.value}</p>
              <p style={{ fontSize:10, color:C.muted, margin:0 }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Live count */}
        {liveCount !== null && (
          <div style={{ marginTop:10, padding:'8px 12px', background:'#EAF7E0', borderRadius:6, display:'flex', justifyContent:'space-between' }}>
            <span style={{ fontSize:12, color:C.green, fontWeight:700 }}>● حضور مباشر لهذه الفعالية</span>
            <span style={{ fontSize:14, fontWeight:800, color:C.green }}>{liveCount} شخص</span>
          </div>
        )}
      </div>

      <div style={{ maxWidth:680, margin:'0 auto', padding:'16px' }}>
        {/* Event selector */}
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:8, padding:14, marginBottom:14 }}>
          <label style={{ fontSize:12, fontWeight:700, color:C.navy, display:'block', marginBottom:6 }}>تصفية الفعالية</label>
          <select value={selEvent} onChange={e=>{
            setSelEvent(e.target.value)
            const ev = events.find(x=>x.id===e.target.value)
            setSelEventName(ev?.title||'')
          }} style={{ width:'100%', padding:'9px 12px', border:`1px solid ${C.border}`, borderRadius:6, fontSize:13, color:C.text, background:C.bg, outline:'none', fontFamily:'inherit' }}>
            <option value="all">جميع الفعاليات</option>
            {events.map(ev=>(
              <option key={ev.id} value={ev.id}>{ev.title}</option>
            ))}
          </select>
        </div>

        {/* Camera */}
        <div style={{ background:C.card, border:`2px solid ${cameraOn?C.orange:C.border}`, borderRadius:10, overflow:'hidden', marginBottom:14 }}>
          <div style={{ padding:'12px 16px', borderBottom:`1px solid ${C.border}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ fontWeight:700, color:C.navy, fontSize:13 }}>📷 الكاميرا</span>
              {cameraOn && <span style={{ fontSize:10, background:'#EAF7E0', color:C.green, padding:'2px 7px', borderRadius:8, fontWeight:700 }}>● نشط</span>}
            </div>
            <button onClick={cameraOn?stopCamera:startCamera} style={{
              padding:'7px 16px', borderRadius:6, border:'none', cursor:'pointer',
              background:cameraOn?'#FEF2F2':C.orange,
              color:cameraOn?'#DC2626':'#fff', fontWeight:700, fontSize:12, fontFamily:'inherit'
            }}>{cameraOn?'⏹ إيقاف':'▶ تشغيل'}</button>
          </div>

          {cameraErr && <div style={{ padding:10, background:'#FEF2F2' }}><p style={{ margin:0, color:'#B91C1C', fontSize:12 }}>⚠️ {cameraErr}</p></div>}

          <div style={{ position:'relative', background:'#000', display:cameraOn?'block':'none' }}>
            <video ref={videoRef} playsInline muted style={{ width:'100%', display:'block' }}/>
            <canvas ref={canvasRef} style={{ display:'none' }}/>
            <div style={{
              position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)',
              width:170, height:170, borderRadius:12,
              border:'3px solid rgba(240,85,55,0.9)',
              boxShadow:'0 0 0 1000px rgba(0,0,0,0.4)',
              pointerEvents:'none'
            }}>
              {/* Corner markers */}
              {['top:0;right:0','top:0;left:0','bottom:0;right:0','bottom:0;left:0'].map((pos,i)=>(
                <div key={i} style={{
                  position:'absolute',
                  ...(Object.fromEntries(pos.split(';').map(p=>p.split(':')))),
                  width:20, height:20,
                  borderTop: pos.includes('top') ? '3px solid #fff' : 'none',
                  borderBottom: pos.includes('bottom') ? '3px solid #fff' : 'none',
                  borderRight: pos.includes('right') ? '3px solid #fff' : 'none',
                  borderLeft: pos.includes('left') ? '3px solid #fff' : 'none',
                }}/>
              ))}
            </div>
          </div>

          {!cameraOn && !cameraErr && (
            <div style={{ padding:24, textAlign:'center' }}>
              <div style={{ fontSize:40, marginBottom:6 }}>📷</div>
              <p style={{ color:C.muted, fontSize:12, margin:0 }}>اضغط "تشغيل" للمسح التلقائي عبر الكاميرا</p>
              {'BarcodeDetector' in (typeof window!=='undefined'?window:{}) || (
                <p style={{ fontSize:11, color:'#B07000', marginTop:6, background:'#FFF8E8', padding:'6px 10px', borderRadius:5, display:'inline-block' }}>
                  متصفحك لا يدعم BarcodeDetector — استخدم الإدخال أدناه
                </p>
              )}
            </div>
          )}
        </div>

        {/* Manual / USB input */}
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:16, marginBottom:14 }}>
          <label style={{ fontSize:12, fontWeight:700, color:C.navy, display:'block', marginBottom:8 }}>⌨️ إدخال يدوي / ماسح USB</label>
          <div style={{ display:'flex', gap:8 }}>
            <input
              ref={inputRef}
              value={qrInput}
              onChange={e=>setQrInput(e.target.value)}
              onKeyDown={e=>{ if(e.key==='Enter') handleCodeFound(qrInput.trim()) }}
              placeholder="رمز التذكرة أو QR..."
              style={{
                flex:1, padding:'10px 14px', border:`2px solid ${C.border}`,
                borderRadius:7, fontSize:14, outline:'none', fontFamily:'inherit', color:C.text, background:C.bg
              }}
              onFocus={e=>(e.target.style.borderColor=C.orange)}
              onBlur={e=>(e.target.style.borderColor=C.border)}
              autoFocus
            />
            <button onClick={()=>handleCodeFound(qrInput.trim())} disabled={loading||!qrInput.trim()} style={{
              padding:'10px 20px', background:C.orange, color:'#fff', border:'none',
              borderRadius:7, fontWeight:700, fontSize:13, cursor:loading||!qrInput.trim()?'not-allowed':'pointer',
              opacity:loading||!qrInput.trim()?0.6:1, fontFamily:'inherit'
            }}>{loading?'...':'✓ تحقق'}</button>
          </div>
        </div>

        {/* Result */}
        {result && (() => {
          const s = STYLES[result.type]
          return (
            <div style={{ background:s.bg, border:`2px solid ${s.border}`, borderRadius:10, padding:16, marginBottom:14, animation:'pop 0.2s ease' }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:result.name?10:0 }}>
                <span style={{ fontSize:24 }}>{s.icon}</span>
                <p style={{ fontSize:15, fontWeight:800, color:s.color, margin:0 }}>{result.message}</p>
              </div>
              {result.name && (
                <div style={{ background:'rgba(255,255,255,0.65)', borderRadius:7, padding:'10px 14px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                  <div>
                    <p style={{ fontSize:10, color:s.color, opacity:0.7, margin:0 }}>الاسم</p>
                    <p style={{ fontSize:14, fontWeight:700, color:s.color, margin:0 }}>{result.name}</p>
                  </div>
                  {result.ref && <div>
                    <p style={{ fontSize:10, color:s.color, opacity:0.7, margin:0 }}>رقم التذكرة</p>
                    <p style={{ fontSize:13, fontWeight:700, color:s.color, margin:0, fontFamily:'monospace' }}>#{result.ref}</p>
                  </div>}
                  {result.event && <div>
                    <p style={{ fontSize:10, color:s.color, opacity:0.7, margin:0 }}>الفعالية</p>
                    <p style={{ fontSize:12, fontWeight:600, color:s.color, margin:0 }}>{result.event}</p>
                  </div>}
                  {result.ticket_type && <div>
                    <p style={{ fontSize:10, color:s.color, opacity:0.7, margin:0 }}>نوع التذكرة</p>
                    <p style={{ fontSize:12, fontWeight:600, color:s.color, margin:0 }}>{result.ticket_type}</p>
                  </div>}
                </div>
              )}
            </div>
          )
        })()}

        {/* History */}
        {history.length > 0 && (
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, overflow:'hidden' }}>
            <div style={{ padding:'12px 16px', borderBottom:`1px solid ${C.border}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ fontWeight:700, color:C.navy, fontSize:13 }}>سجل الجلسة ({history.length})</span>
              <button onClick={()=>setHistory([])} style={{ fontSize:11, color:C.muted, background:'none', border:'none', cursor:'pointer', fontFamily:'inherit' }}>مسح</button>
            </div>
            <div style={{ maxHeight:300, overflowY:'auto' }}>
              {history.map((h,i)=>(
                <div key={i} style={{ display:'grid', gridTemplateColumns:'20px 1fr auto', padding:'9px 16px', borderBottom:i<history.length-1?`1px solid ${C.border}`:'none', gap:10, alignItems:'center' }}>
                  <span style={{ fontSize:13 }}>✅</span>
                  <div>
                    <p style={{ fontSize:12, fontWeight:700, color:C.navy, margin:0 }}>{h.name}</p>
                    <p style={{ fontSize:10, color:C.muted, margin:0 }}>{h.event}{h.ref?` · #${h.ref}`:''}</p>
                  </div>
                  <span style={{ fontSize:10, color:C.muted }}>{h.time}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <style>{`@keyframes pop{from{opacity:0;transform:scale(0.96)}to{opacity:1;transform:scale(1)}}`}</style>
      <div className="h-20 md:h-0"/>
    </div>
  )
}

export default function ScannerPage() {
  return <Suspense><ScannerInner/></Suspense>
}
