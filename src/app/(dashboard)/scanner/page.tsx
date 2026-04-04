'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import Link from 'next/link'

const sb = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const C = {
  navy:'#1E0A3C', orange:'#F05537', text:'#39364F',
  muted:'#6F7287', border:'#DBDAE3', bg:'#FAFAFA', card:'#FFFFFF',
  green:'#3A7D0A'
}

type ScanResult = {
  type: 'success'|'warning'|'error'
  message: string
  name?: string
  event?: string
  ticket_type?: string
}

type HistoryItem = { name:string; event:string; time:string; type:string; ticket_type?:string }

const RESULT_STYLES: Record<string,{bg:string;border:string;color:string;icon:string}> = {
  success: { bg:'#EAF7E0', border:'#3A7D0A', color:'#1A5A00', icon:'✅' },
  warning: { bg:'#FFF8E8', border:'#B07000', color:'#7A5000', icon:'⚠️' },
  error:   { bg:'#FEF2F2', border:'#DC2626', color:'#B91C1C', icon:'❌' },
}

export default function ScannerPage() {
  const [events, setEvents]     = useState<any[]>([])
  const [selEvent, setSelEvent] = useState<string>('all')
  const [qrInput, setQrInput]   = useState('')
  const [result, setResult]     = useState<ScanResult|null>(null)
  const [loading, setLoading]   = useState(false)
  const [history, setHistory]   = useState<HistoryItem[]>([])
  const [cameraOn, setCameraOn] = useState(false)
  const [cameraErr, setCameraErr] = useState('')
  const [todayStats, setTodayStats] = useState({ scanned:0, success:0, already:0, invalid:0 })
  const videoRef  = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const inputRef  = useRef<HTMLInputElement>(null)
  const streamRef = useRef<MediaStream|null>(null)
  const scanningRef = useRef(false)

  useEffect(() => {
    sb.from('events')
      .select('id,title,start_date')
      .in('status',['published','active'])
      .order('start_date',{ascending:true})
      .then(({data}) => setEvents(data||[]))
  },[])

  // ── QR Code scan via BarcodeDetector or jsQR ──
  const processFrame = useCallback(async () => {
    if (!scanningRef.current || !videoRef.current || !canvasRef.current) return
    const video = videoRef.current
    const canvas = canvasRef.current
    if (video.readyState !== video.HAVE_ENOUGH_DATA) {
      requestAnimationFrame(processFrame)
      return
    }
    canvas.width  = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(video,0,0)

    let code: string|null = null

    // Try native BarcodeDetector (Chrome 83+, Android, Edge)
    if ('BarcodeDetector' in window) {
      try {
        const bd = new (window as any).BarcodeDetector({ formats:['qr_code'] })
        const barcodes = await bd.detect(canvas)
        if (barcodes.length > 0) code = barcodes[0].rawValue
      } catch {}
    }

    if (code) {
      scanningRef.current = false
      await handleCodeFound(code)
      // resume after 2.5s
      setTimeout(() => {
        scanningRef.current = true
        requestAnimationFrame(processFrame)
      }, 2500)
    } else {
      requestAnimationFrame(processFrame)
    }
  },[selEvent])

  async function startCamera() {
    setCameraErr('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode:'environment', width:{ideal:1280}, height:{ideal:720} }
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setCameraOn(true)
      scanningRef.current = true
      requestAnimationFrame(processFrame)
    } catch(e:any) {
      setCameraErr(e.name === 'NotAllowedError'
        ? 'يرجى السماح بالوصول للكاميرا من إعدادات المتصفح'
        : 'تعذّر الوصول للكاميرا — استخدم الإدخال اليدوي')
    }
  }

  function stopCamera() {
    scanningRef.current = false
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    setCameraOn(false)
  }

  useEffect(() => () => { stopCamera() }, [])

  async function handleCodeFound(code: string) {
    if (!code || loading) return
    setLoading(true); setResult(null)

    try {
      let query = sb.from('registrations')
        .select('id,guest_name,status,qr_code,ticket_type,events(title)')
        .eq('qr_code', code)
      if (selEvent !== 'all') query = query.eq('event_id', selEvent)
      const { data: reg } = await query.single()

      setTodayStats(s => ({ ...s, scanned: s.scanned+1 }))

      if (!reg) {
        setResult({ type:'error', message:'رمز غير صالح أو غير موجود' })
        setTodayStats(s => ({ ...s, invalid: s.invalid+1 }))
      } else if (reg.status === 'attended') {
        setResult({ type:'warning', message:'تم مسح هذه التذكرة مسبقاً', name:reg.guest_name, event:(reg.events as any)?.title, ticket_type:reg.ticket_type })
        setTodayStats(s => ({ ...s, already: s.already+1 }))
      } else {
        await sb.from('registrations').update({ status:'attended', checked_in_at:new Date().toISOString() }).eq('id',reg.id)
        setResult({ type:'success', message:'تم تسجيل الحضور ✓', name:reg.guest_name, event:(reg.events as any)?.title, ticket_type:reg.ticket_type })
        setHistory(h => [{
          name:reg.guest_name, event:(reg.events as any)?.title||'—',
          time:new Date().toLocaleTimeString('ar-SA'), type:'success',
          ticket_type:reg.ticket_type
        }, ...h.slice(0,29)])
        setTodayStats(s => ({ ...s, success: s.success+1 }))
      }
    } catch {
      setResult({ type:'error', message:'خطأ في الاتصال بالخادم' })
    } finally {
      setLoading(false)
      setQrInput('')
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }

  return (
    <div style={{ minHeight:'100vh', background:C.bg, direction:'rtl' }}>

      {/* Header */}
      <div style={{ background:C.card, borderBottom:`1px solid ${C.border}`, padding:'20px 24px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
          <div>
            <h1 style={{ fontSize:28, fontWeight:800, margin:0, color:C.navy }}>📷 ماسح التذاكر</h1>
            <p style={{ color:C.muted, fontSize:13, margin:'4px 0 0' }}>سجّل حضور الزوار عبر رمز QR</p>
          </div>
          <Link href="/attendees" style={{
            padding:'8px 16px', background:'#EDE9F7', border:'none',
            borderRadius:6, color:'#7B4FBF', fontWeight:700, fontSize:12,
            textDecoration:'none', cursor:'pointer'
          }}>👥 قائمة الزوار</Link>
        </div>

        {/* Today's Stats */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginTop:16 }}>
          {[
            { label:'إجمالي المسح', value:todayStats.scanned, color:C.navy,   bg:'#F0EDF7' },
            { label:'تم بنجاح',     value:todayStats.success, color:C.green,   bg:'#EAF7E0' },
            { label:'مسح مسبقاً',   value:todayStats.already, color:'#B07000', bg:'#FFF8E8' },
            { label:'رموز خاطئة',   value:todayStats.invalid, color:'#DC2626', bg:'#FEF2F2' },
          ].map(s=>(
            <div key={s.label} style={{ background:s.bg, borderRadius:8, padding:'10px 14px' }}>
              <p style={{ fontSize:20, fontWeight:800, color:s.color, margin:0 }}>{s.value}</p>
              <p style={{ fontSize:11, color:C.muted, margin:0 }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ maxWidth:760, margin:'0 auto', padding:'20px 16px' }}>

        {/* Event Filter */}
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:8, padding:16, marginBottom:16 }}>
          <label style={{ fontSize:13, fontWeight:700, color:C.navy, display:'block', marginBottom:8 }}>تصفية حسب الفعالية</label>
          <select value={selEvent} onChange={e=>setSelEvent(e.target.value)} style={{
            width:'100%', padding:'10px 14px', border:`1px solid ${C.border}`,
            borderRadius:6, fontSize:14, color:C.text, background:C.bg,
            outline:'none', fontFamily:'inherit'
          }}>
            <option value="all">جميع الفعاليات</option>
            {events.map(ev=>(
              <option key={ev.id} value={ev.id}>{ev.title}</option>
            ))}
          </select>
        </div>

        {/* Camera Scanner */}
        <div style={{ background:C.card, border:`2px solid ${cameraOn?C.orange:C.border}`, borderRadius:10, overflow:'hidden', marginBottom:16 }}>
          <div style={{ padding:'14px 18px', borderBottom:`1px solid ${C.border}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div>
              <span style={{ fontWeight:700, color:C.navy, fontSize:14 }}>📷 المسح بالكاميرا</span>
              {cameraOn && <span style={{ marginRight:8, fontSize:11, background:'#EAF7E0', color:C.green, padding:'2px 8px', borderRadius:10, fontWeight:700 }}>● نشط</span>}
            </div>
            <button onClick={cameraOn ? stopCamera : startCamera} style={{
              padding:'8px 18px', borderRadius:6, border:'none', cursor:'pointer',
              background: cameraOn ? '#FEF2F2' : C.orange,
              color: cameraOn ? '#DC2626' : '#fff',
              fontWeight:700, fontSize:13, fontFamily:'inherit'
            }}>
              {cameraOn ? '⏹ إيقاف الكاميرا' : '▶ تشغيل الكاميرا'}
            </button>
          </div>

          {cameraErr && (
            <div style={{ padding:14, background:'#FEF2F2', borderBottom:`1px solid #FCA5A5` }}>
              <p style={{ margin:0, color:'#B91C1C', fontSize:13 }}>⚠️ {cameraErr}</p>
            </div>
          )}

          <div style={{ position:'relative', background:'#000', minHeight: cameraOn ? 280 : 0, overflow:'hidden' }}>
            <video ref={videoRef} playsInline muted style={{
              width:'100%', display: cameraOn ? 'block' : 'none'
            }}/>
            <canvas ref={canvasRef} style={{ display:'none' }}/>
            {cameraOn && (
              <div style={{
                position:'absolute', top:'50%', left:'50%',
                transform:'translate(-50%,-50%)',
                width:180, height:180,
                border:'3px solid rgba(240,85,55,0.8)',
                borderRadius:12, boxShadow:'0 0 0 1000px rgba(0,0,0,0.35)',
                pointerEvents:'none'
              }}/>
            )}
            {!cameraOn && !cameraErr && (
              <div style={{ padding:32, textAlign:'center' }}>
                <div style={{ fontSize:52, marginBottom:8 }}>📷</div>
                <p style={{ color:C.muted, fontSize:13, margin:0 }}>اضغط "تشغيل الكاميرا" لبدء المسح التلقائي</p>
                {!('BarcodeDetector' in window) && (
                  <p style={{ color:'#B07000', fontSize:12, marginTop:8, background:'#FFF8E8', padding:'8px 12px', borderRadius:6, display:'inline-block' }}>
                    ⚠️ متصفحك لا يدعم المسح التلقائي — استخدم الإدخال اليدوي أدناه
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Manual input (also works as USB scanner receiver) */}
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:20, marginBottom:16 }}>
          <h3 style={{ fontSize:14, fontWeight:700, color:C.navy, margin:'0 0 12px' }}>
            ⌨️ إدخال يدوي / ماسح USB
          </h3>
          <p style={{ fontSize:12, color:C.muted, margin:'0 0 12px' }}>
            اكتب رمز التذكرة أو وجّه ماسح USB نحو هذا الحقل — سيتم التحقق تلقائياً عند الإدخال
          </p>
          <div style={{ display:'flex', gap:8 }}>
            <input
              ref={inputRef}
              value={qrInput}
              onChange={e => setQrInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleCodeFound(qrInput.trim()) }}
              placeholder="أدخل رمز التذكرة أو امسح بماسح USB..."
              style={{
                flex:1, padding:'12px 16px', border:`2px solid ${C.border}`,
                borderRadius:8, fontSize:14, outline:'none',
                fontFamily:'inherit', color:C.text, background:C.bg
              }}
              onFocus={e=>(e.target.style.borderColor=C.orange)}
              onBlur={e=>(e.target.style.borderColor=C.border)}
              autoFocus
            />
            <button
              onClick={() => handleCodeFound(qrInput.trim())}
              disabled={loading || !qrInput.trim()}
              style={{
                padding:'12px 22px', background:C.orange, color:'#fff',
                border:'none', borderRadius:8, fontWeight:700, fontSize:14,
                cursor: loading||!qrInput.trim() ? 'not-allowed' : 'pointer',
                opacity: loading||!qrInput.trim() ? 0.6 : 1,
                fontFamily:'inherit'
              }}
            >
              {loading ? '...' : 'تحقق'}
            </button>
          </div>
        </div>

        {/* Result */}
        {result && (() => {
          const s = RESULT_STYLES[result.type]
          return (
            <div style={{
              background:s.bg, border:`2px solid ${s.border}`,
              borderRadius:10, padding:20, marginBottom:16,
              animation:'fadeIn 0.2s ease'
            }}>
              <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom: result.name ? 12 : 0 }}>
                <span style={{ fontSize:28 }}>{s.icon}</span>
                <div>
                  <p style={{ fontSize:16, fontWeight:800, color:s.color, margin:0 }}>{result.message}</p>
                </div>
              </div>
              {result.name && (
                <div style={{ background:'rgba(255,255,255,0.6)', borderRadius:8, padding:'12px 16px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                  <div>
                    <p style={{ fontSize:11, color:s.color, opacity:0.7, margin:0 }}>اسم الزائر</p>
                    <p style={{ fontSize:15, fontWeight:700, color:s.color, margin:0 }}>{result.name}</p>
                  </div>
                  {result.event && (
                    <div>
                      <p style={{ fontSize:11, color:s.color, opacity:0.7, margin:0 }}>الفعالية</p>
                      <p style={{ fontSize:13, fontWeight:600, color:s.color, margin:0 }}>{result.event}</p>
                    </div>
                  )}
                  {result.ticket_type && (
                    <div>
                      <p style={{ fontSize:11, color:s.color, opacity:0.7, margin:0 }}>نوع التذكرة</p>
                      <p style={{ fontSize:13, fontWeight:600, color:s.color, margin:0 }}>{result.ticket_type}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })()}

        {/* Scan History */}
        {history.length > 0 && (
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, overflow:'hidden' }}>
            <div style={{ padding:'14px 18px', borderBottom:`1px solid ${C.border}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ fontWeight:700, color:C.navy, fontSize:14 }}>سجل المسح ({history.length})</span>
              <button onClick={()=>setHistory([])} style={{ fontSize:12, color:C.muted, background:'none', border:'none', cursor:'pointer', fontFamily:'inherit' }}>مسح السجل</button>
            </div>
            <div style={{ maxHeight:320, overflowY:'auto' }}>
              {history.map((h,i)=>(
                <div key={i} style={{
                  display:'grid', gridTemplateColumns:'24px 1fr auto',
                  padding:'10px 18px', borderBottom: i<history.length-1 ? `1px solid ${C.border}` : 'none',
                  gap:10, alignItems:'center'
                }}>
                  <span style={{ fontSize:14 }}>{h.type==='success'?'✅':'⚠️'}</span>
                  <div>
                    <p style={{ fontSize:13, fontWeight:700, color:C.navy, margin:0 }}>{h.name}</p>
                    <p style={{ fontSize:11, color:C.muted, margin:0 }}>{h.event}{h.ticket_type?` · ${h.ticket_type}`:''}</p>
                  </div>
                  <span style={{ fontSize:11, color:C.muted, whiteSpace:'nowrap' }}>{h.time}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div className="h-20 md:h-0"/>
    </div>
  )
}
