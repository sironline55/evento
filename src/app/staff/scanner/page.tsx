'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState, useRef, useCallback } from 'react'
import { createBrowserClient } from '@supabase/ssr'

const sb = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
const C = { navy:'#1E0A3C', orange:'#F05537', text:'#39364F', muted:'#6F7287', border:'#DBDAE3', bg:'#FAFAFA', card:'#FFFFFF', green:'#3A7D0A' }

export default function StaffScanner() {
  const [worker, setWorker] = useState<any>(null)
  const [events, setEvents] = useState<any[]>([])
  const [selEvent, setSelEvent] = useState<string>('all')
  const [result, setResult]   = useState<any>(null)
  const [scanning, setScanning] = useState(false)
  const [cameraOn, setCameraOn] = useState(false)
  const [cameraErr, setCameraErr] = useState('')
  const [history, setHistory]   = useState<any[]>([])
  const [todayCnt, setTodayCnt] = useState({ success:0, dupe:0, invalid:0 })
  const [qrInput, setQrInput]   = useState('')
  const videoRef  = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream|null>(null)
  const scanRef   = useRef(false)
  const inputRef  = useRef<HTMLInputElement>(null)

  useEffect(() => {
    sb.auth.getUser().then(async ({ data }) => {
      if (!data.user) return
      const { data: w } = await sb.from('worker_profiles').select('*').eq('user_id', data.user.id).single()
      if (!w) return
      setWorker(w)
      // Get today's assigned events
      const { data: asgn } = await sb.from('event_staff_assignments')
        .select('events(id,title,start_date)')
        .eq('worker_profile_id', w.id)
        .in('status', ['assigned','confirmed'])
      const evList = (asgn||[]).map((a:any) => a.events).filter(Boolean)
      setEvents(evList)
      if (evList.length === 1) setSelEvent(evList[0].id)
    })
  }, [])

  const processFrame = useCallback(async () => {
    if (!scanRef.current || !videoRef.current || !canvasRef.current) return
    const v = videoRef.current, c = canvasRef.current
    if (v.readyState !== v.HAVE_ENOUGH_DATA) { requestAnimationFrame(processFrame); return }
    c.width = v.videoWidth; c.height = v.videoHeight
    const ctx = c.getContext('2d'); if (!ctx) return
    ctx.drawImage(v, 0, 0)
    let code: string|null = null
    if ('BarcodeDetector' in window) {
      try { const bd = new (window as any).BarcodeDetector({ formats:['qr_code'] }); const b = await bd.detect(c); if (b.length > 0) code = b[0].rawValue } catch {}
    }
    if (code) { scanRef.current = false; await handleScan(code); setTimeout(() => { scanRef.current = true; requestAnimationFrame(processFrame) }, 2500) }
    else requestAnimationFrame(processFrame)
  }, [selEvent])

  async function startCamera() {
    setCameraErr('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video:{ facingMode:'environment' } })
      streamRef.current = stream
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play() }
      setCameraOn(true); scanRef.current = true; requestAnimationFrame(processFrame)
    } catch(e:any) { setCameraErr(e.name === 'NotAllowedError' ? 'يرجى السماح بالكاميرا' : 'تعذّر تشغيل الكاميرا') }
  }
  function stopCamera() { scanRef.current = false; streamRef.current?.getTracks().forEach(t=>t.stop()); streamRef.current=null; if(videoRef.current) videoRef.current.srcObject=null; setCameraOn(false) }
  useEffect(() => () => { stopCamera() }, [])

  async function handleScan(code: string) {
    if (!code.trim() || scanning) return
    setScanning(true); setResult(null)
    try {
      let q = sb.from('registrations').select('id,guest_name,status,ticket_type,events(title)').eq('qr_code', code.trim())
      if (selEvent !== 'all') q = q.eq('event_id', selEvent)
      const { data: reg } = await q.single()
      if (!reg) {
        setResult({ type:'error', msg:'رمز غير صالح أو غير مخصص لهذه الفعالية' })
        setTodayCnt(c => ({ ...c, invalid: c.invalid+1 }))
      } else if (reg.status === 'attended') {
        setResult({ type:'warning', msg:'تم المسح مسبقاً', name:reg.guest_name, ticket:reg.ticket_type })
        setTodayCnt(c => ({ ...c, dupe: c.dupe+1 }))
      } else {
        await sb.from('registrations').update({ status:'attended', checked_in_at:new Date().toISOString(), check_in_method:'staff_scan' }).eq('id', reg.id)
        setResult({ type:'success', msg:'✓ تم تسجيل الحضور', name:reg.guest_name, ticket:reg.ticket_type, event:(reg.events as any)?.title })
        setHistory(h => [{ name:reg.guest_name, time:new Date().toLocaleTimeString('ar-SA'), ticket:reg.ticket_type }, ...h.slice(0,29)])
        setTodayCnt(c => ({ ...c, success: c.success+1 }))
      }
    } catch { setResult({ type:'error', msg:'خطأ في الاتصال' }) }
    finally { setScanning(false); setQrInput(''); setTimeout(() => inputRef.current?.focus(), 100) }
  }

  const SC: any = {
    success: { bg:'#EAF7E0', border:C.green, color:'#1A5A00', icon:'✅' },
    warning: { bg:'#FFF8E8', border:'#B07000', color:'#7A5000', icon:'⚠️' },
    error:   { bg:'#FEF2F2', border:'#DC2626', color:'#B91C1C', icon:'❌' },
  }

  return (
    <div style={{ direction:'rtl' }}>
      {/* Header */}
      <div style={{ background:C.navy, padding:'16px 20px' }}>
        <h1 style={{ color:'#fff', fontSize:18, fontWeight:800, margin:'0 0 12px' }}>📷 ماسح التذاكر</h1>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
          {[{l:'ناجح',v:todayCnt.success,b:'#EAF7E0',c:C.green},{l:'مكرر',v:todayCnt.dupe,b:'#FFF8E8',c:'#B07000'},{l:'خاطئ',v:todayCnt.invalid,b:'#FEF2F2',c:'#DC2626'}].map(s=>(
            <div key={s.l} style={{ background:s.b, borderRadius:8, padding:'8px', textAlign:'center' }}>
              <p style={{ fontSize:20, fontWeight:800, color:s.c, margin:0 }}>{s.v}</p>
              <p style={{ fontSize:10, color:C.muted, margin:0 }}>{s.l}</p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding:16 }}>
        {/* Event selector */}
        {events.length > 1 && (
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:8, padding:14, marginBottom:14 }}>
            <label style={{ fontSize:12, fontWeight:700, color:C.navy, display:'block', marginBottom:6 }}>الفعالية</label>
            <select value={selEvent} onChange={e=>setSelEvent(e.target.value)} style={{ width:'100%', padding:'9px 12px', border:`1px solid ${C.border}`, borderRadius:6, fontSize:13, fontFamily:'inherit', color:C.text, background:C.bg, outline:'none' }}>
              <option value="all">جميع الفعاليات</option>
              {events.map(ev => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
            </select>
          </div>
        )}

        {/* Camera */}
        <div style={{ background:C.card, border:`2px solid ${cameraOn?C.orange:C.border}`, borderRadius:12, overflow:'hidden', marginBottom:14 }}>
          <div style={{ padding:'12px 16px', borderBottom:`1px solid ${C.border}`, display:'flex', justifyContent:'space-between', alignItems:'center', background:'#F8F7FA' }}>
            <span style={{ fontWeight:700, color:C.navy, fontSize:13 }}>الكاميرا {cameraOn && <span style={{ fontSize:10, color:C.green, background:'#EAF7E0', padding:'2px 8px', borderRadius:10, marginRight:6 }}>● نشط</span>}</span>
            <button onClick={cameraOn?stopCamera:startCamera} style={{ padding:'7px 16px', border:'none', borderRadius:6, cursor:'pointer', fontFamily:'inherit', fontWeight:700, fontSize:12, background:cameraOn?'#FEF2F2':C.orange, color:cameraOn?'#DC2626':'#fff' }}>
              {cameraOn ? '⏹ إيقاف' : '▶ تشغيل'}
            </button>
          </div>
          {cameraErr && <div style={{ padding:'10px 16px', background:'#FEF2F2' }}><p style={{ margin:0, color:'#B91C1C', fontSize:12 }}>⚠️ {cameraErr}</p></div>}
          <div style={{ position:'relative', background:'#000', minHeight: cameraOn ? 260 : 0, overflow:'hidden' }}>
            <video ref={videoRef} playsInline muted style={{ width:'100%', display: cameraOn ? 'block' : 'none' }}/>
            <canvas ref={canvasRef} style={{ display:'none' }}/>
            {cameraOn && <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:160, height:160, border:'3px solid rgba(240,85,55,0.9)', borderRadius:12, boxShadow:'0 0 0 1000px rgba(0,0,0,0.4)', pointerEvents:'none' }}/>}
          </div>
          {!cameraOn && (
            <div style={{ padding:'24px', textAlign:'center' }}>
              <p style={{ fontSize:40, margin:'0 0 8px' }}>📷</p>
              <p style={{ color:C.muted, fontSize:13, margin:0 }}>اضغط "تشغيل" للمسح التلقائي</p>
              {!('BarcodeDetector' in window) && <p style={{ fontSize:11, color:'#B07000', marginTop:8, background:'#FFF8E8', padding:'6px 10px', borderRadius:6, display:'inline-block' }}>متصفحك لا يدعم المسح التلقائي</p>}
            </div>
          )}
        </div>

        {/* Manual input */}
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:16, marginBottom:14 }}>
          <p style={{ fontSize:12, fontWeight:700, color:C.navy, margin:'0 0 8px' }}>⌨️ إدخال يدوي / ماسح USB</p>
          <div style={{ display:'flex', gap:8 }}>
            <input ref={inputRef} value={qrInput} onChange={e=>setQrInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')handleScan(qrInput)}} placeholder="وجّه ماسح USB هنا..." style={{ flex:1, padding:'10px 14px', border:`1px solid ${C.border}`, borderRadius:8, fontSize:14, fontFamily:'inherit', color:C.text, background:C.bg, outline:'none' }} autoFocus/>
            <button onClick={()=>handleScan(qrInput)} disabled={scanning||!qrInput.trim()} style={{ padding:'10px 18px', background:C.orange, border:'none', borderRadius:8, color:'#fff', fontWeight:700, cursor:'pointer', fontFamily:'inherit', opacity:scanning||!qrInput.trim()?0.5:1 }}>تحقق</button>
          </div>
        </div>

        {/* Result */}
        {result && (()=>{
          const s = SC[result.type]
          return (
            <div style={{ background:s.bg, border:`2px solid ${s.border}`, borderRadius:12, padding:20, marginBottom:14, animation:'fadeIn 0.2s ease' }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom: result.name?12:0 }}>
                <span style={{ fontSize:28 }}>{s.icon}</span>
                <p style={{ fontSize:16, fontWeight:800, color:s.color, margin:0 }}>{result.msg}</p>
              </div>
              {result.name && <div style={{ background:'rgba(255,255,255,0.6)', borderRadius:8, padding:'10px 14px' }}>
                <p style={{ fontSize:14, fontWeight:700, color:s.color, margin:0 }}>👤 {result.name}</p>
                {result.ticket && <p style={{ fontSize:12, color:s.color, margin:'2px 0 0' }}>🎟 {result.ticket}</p>}
                {result.event && <p style={{ fontSize:12, color:s.color, margin:'2px 0 0' }}>📅 {result.event}</p>}
              </div>}
            </div>
          )
        })()}

        {/* History */}
        {history.length > 0 && (
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, overflow:'hidden' }}>
            <div style={{ padding:'10px 16px', borderBottom:`1px solid ${C.border}`, display:'flex', justifyContent:'space-between' }}>
              <span style={{ fontWeight:700, color:C.navy, fontSize:13 }}>آخر {history.length} مسح</span>
              <button onClick={()=>setHistory([])} style={{ fontSize:11, color:C.muted, background:'none', border:'none', cursor:'pointer', fontFamily:'inherit' }}>مسح</button>
            </div>
            {history.slice(0,8).map((h,i)=>(
              <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'9px 16px', borderBottom: i<7 ? `1px solid ${C.border}` : 'none', fontSize:12 }}>
                <span style={{ color:C.text, fontWeight:600 }}>✅ {h.name}</span>
                <span style={{ color:C.muted }}>{h.time}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  )
}
