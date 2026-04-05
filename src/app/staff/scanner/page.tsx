'use client'
import { useEffect, useState, useRef, useCallback } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useSearchParams } from 'next/navigation'

const sb = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
const C = { navy:'#1E0A3C',orange:'#F05537',text:'#39364F',muted:'#6F7287',border:'#DBDAE3',bg:'#FAFAFA',card:'#FFFFFF',green:'#3A7D0A' }

export default function StaffScannerPage() {
  const params   = useSearchParams()
  const eventId  = params.get('event') || ''
  const [events, setEvents]       = useState<any[]>([])
  const [selEvent, setSelEvent]   = useState(eventId)
  const [member, setMember]       = useState<any>(null)
  const [qrInput, setQrInput]     = useState('')
  const [result, setResult]       = useState<any>(null)
  const [scanning, setScanning]   = useState(false)
  const [cameraOn, setCameraOn]   = useState(false)
  const [cameraErr, setCameraErr] = useState('')
  const [history, setHistory]     = useState<any[]>([])
  const [todayCount, setTodayCount] = useState({scanned:0,success:0,already:0,error:0})
  const videoRef   = useRef<HTMLVideoElement>(null)
  const canvasRef  = useRef<HTMLCanvasElement>(null)
  const streamRef  = useRef<MediaStream|null>(null)
  const scanRef    = useRef(false)
  const inputRef   = useRef<HTMLInputElement>(null)

  useEffect(() => {
    sb.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data: m } = await sb.from('org_members').select('*').eq('user_id', user.id).single()
      setMember(m)
      const { data: evs } = await sb.from('events')
        .select('id,title,start_date').eq('org_id', m?.org_id)
        .in('status',['published','completed']).order('start_date',{ascending:false}).limit(20)
      setEvents(evs||[])
      if (!selEvent && evs && evs.length > 0) setSelEvent(evs[0].id)
    })
  },[])

  const processFrame = useCallback(async () => {
    if (!scanRef.current||!videoRef.current||!canvasRef.current) return
    const v=videoRef.current; const c=canvasRef.current
    if(v.readyState!==v.HAVE_ENOUGH_DATA){requestAnimationFrame(processFrame);return}
    c.width=v.videoWidth; c.height=v.videoHeight
    const ctx=c.getContext('2d'); if(!ctx) return; ctx.drawImage(v,0,0)
    let code:string|null=null
    if('BarcodeDetector' in window){
      try{const bd=new (window as any).BarcodeDetector({formats:['qr_code']});const b=await bd.detect(c);if(b.length>0)code=b[0].rawValue}catch{}
    }
    if(code){scanRef.current=false;await handleScan(code);setTimeout(()=>{scanRef.current=true;requestAnimationFrame(processFrame)},2500)}
    else requestAnimationFrame(processFrame)
  },[selEvent])

  async function startCamera(){
    setCameraErr('')
    try{
      const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'}})
      streamRef.current=stream
      if(videoRef.current){videoRef.current.srcObject=stream;await videoRef.current.play()}
      setCameraOn(true);scanRef.current=true;requestAnimationFrame(processFrame)
    }catch(e:any){setCameraErr(e.name==='NotAllowedError'?'يرجى السماح بالوصول للكاميرا':'تعذّر تشغيل الكاميرا')}
  }
  function stopCamera(){scanRef.current=false;streamRef.current?.getTracks().forEach(t=>t.stop());streamRef.current=null;if(videoRef.current)videoRef.current.srcObject=null;setCameraOn(false)}
  useEffect(()=>()=>{stopCamera()},[])

  async function handleScan(code: string) {
    if (!code.trim()||scanning) return
    setScanning(true); setResult(null)
    try {
      let q = sb.from('registrations').select('id,guest_name,status,ticket_type,events(title)').eq('qr_code',code.trim())
      if (selEvent) q = q.eq('event_id',selEvent)
      const {data:reg} = await q.single()
      setTodayCount(s=>({...s,scanned:s.scanned+1}))
      if (!reg) {
        setResult({type:'error',msg:'رمز غير صالح',icon:'❌'})
        setTodayCount(s=>({...s,error:s.error+1}))
      } else if (reg.status==='attended') {
        setResult({type:'warning',msg:'تم المسح مسبقاً',name:reg.guest_name,ticket:reg.ticket_type,icon:'⚠️'})
        setTodayCount(s=>({...s,already:s.already+1}))
      } else {
        await sb.from('registrations').update({status:'attended',checked_in_at:new Date().toISOString(),check_in_method:'staff_scanner'}).eq('id',reg.id)
        setResult({type:'success',msg:'تم تسجيل الحضور ✓',name:reg.guest_name,ticket:reg.ticket_type,event:(reg.events as any)?.title,icon:'✅'})
        setHistory(h=>[{name:reg.guest_name,ticket:reg.ticket_type,time:new Date().toLocaleTimeString('ar-SA')},...h.slice(0,49)])
        setTodayCount(s=>({...s,success:s.success+1}))
      }
    } catch { setResult({type:'error',msg:'خطأ في الاتصال',icon:'❌'}) }
    finally { setScanning(false); setQrInput(''); setTimeout(()=>inputRef.current?.focus(),100) }
  }

  const selectedEvent = events.find(e=>e.id===selEvent)
  const RC = {success:{bg:'#EAF7E0',border:C.green,color:'#1A5A00'},warning:{bg:'#FFF8E8',border:'#B07000',color:'#7A5000'},error:{bg:'#FEF2F2',border:'#DC2626',color:'#B91C1C'}}

  return (
    <div style={{minHeight:'calc(100vh - 120px)',background:C.bg,direction:'rtl'}}>

      {/* Event selector */}
      <div style={{background:C.card,borderBottom:`1px solid ${C.border}`,padding:'12px 20px',display:'flex',gap:12,alignItems:'center',flexWrap:'wrap'}}>
        <span style={{fontSize:13,fontWeight:700,color:C.navy,whiteSpace:'nowrap'}}>الفعالية:</span>
        <select value={selEvent} onChange={e=>setSelEvent(e.target.value)} style={{flex:1,padding:'8px 12px',border:`1px solid ${C.border}`,borderRadius:6,fontSize:13,outline:'none',fontFamily:'inherit',color:C.text,background:C.bg,maxWidth:400}}>
          <option value="">كل الفعاليات</option>
          {events.map(ev=><option key={ev.id} value={ev.id}>{ev.title}</option>)}
        </select>
        {selectedEvent && <span style={{fontSize:12,color:C.muted}}>{new Date(selectedEvent.start_date).toLocaleDateString('ar-SA')}</span>}
      </div>

      {/* Today stats */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:0,borderBottom:`1px solid ${C.border}`}}>
        {[
          {l:'إجمالي',v:todayCount.scanned,c:C.navy,bg:'#F0EDF7'},
          {l:'ناجح',v:todayCount.success,c:C.green,bg:'#EAF7E0'},
          {l:'مسبق',v:todayCount.already,c:'#B07000',bg:'#FFF8E8'},
          {l:'خاطئ',v:todayCount.error,c:'#DC2626',bg:'#FEF2F2'},
        ].map(s=>(
          <div key={s.l} style={{background:s.bg,padding:'12px',textAlign:'center',borderLeft:`1px solid ${C.border}`}}>
            <p style={{fontSize:24,fontWeight:800,color:s.c,margin:0}}>{s.v}</p>
            <p style={{fontSize:11,color:C.muted,margin:0}}>{s.l}</p>
          </div>
        ))}
      </div>

      <div style={{display:'grid',gridTemplateColumns:cameraOn?'1fr 340px':'1fr',minHeight:'calc(100vh - 260px)'}}>

        {/* Camera */}
        {cameraOn && (
          <div style={{background:'#000',position:'relative'}}>
            <video ref={videoRef} playsInline muted style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}}/>
            <canvas ref={canvasRef} style={{display:'none'}}/>
            <div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',width:200,height:200,border:'4px solid rgba(240,85,55,0.9)',borderRadius:16,boxShadow:'0 0 0 2000px rgba(0,0,0,0.5)',pointerEvents:'none'}}/>
            <div style={{position:'absolute',top:16,right:16}}>
              <button onClick={stopCamera} style={{padding:'8px 16px',background:'rgba(220,38,38,0.9)',border:'none',borderRadius:8,color:'#fff',fontWeight:700,fontSize:13,cursor:'pointer',fontFamily:'inherit'}}>⏹ إيقاف</button>
            </div>
            <div style={{position:'absolute',bottom:16,left:'50%',transform:'translateX(-50%)',background:'rgba(0,0,0,0.7)',padding:'6px 16px',borderRadius:20}}>
              <p style={{color:'#fff',fontSize:12,margin:0}}>وجّه الكاميرا نحو رمز QR</p>
            </div>
          </div>
        )}

        {/* Input + result */}
        <div style={{padding:20,display:'flex',flexDirection:'column',gap:14}}>

          {/* Camera button */}
          {!cameraOn && (
            <button onClick={startCamera} style={{
              padding:'14px',background:`linear-gradient(135deg,${C.navy},#3D1A78)`,
              border:'none',borderRadius:10,color:'#fff',fontWeight:800,fontSize:15,
              cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',justifyContent:'center',gap:10
            }}>
              <span style={{fontSize:24}}>📷</span>
              تشغيل الكاميرا
            </button>
          )}
          {cameraErr && <p style={{color:'#DC2626',fontSize:13,margin:0,textAlign:'center'}}>⚠️ {cameraErr}</p>}

          {/* Manual / USB input */}
          <div>
            <p style={{fontSize:12,fontWeight:700,color:C.muted,margin:'0 0 6px'}}>إدخال يدوي أو ماسح USB</p>
            <div style={{display:'flex',gap:8}}>
              <input
                ref={inputRef}
                value={qrInput}
                onChange={e=>setQrInput(e.target.value)}
                onKeyDown={e=>{if(e.key==='Enter')handleScan(qrInput)}}
                placeholder="رمز التذكرة..."
                style={{flex:1,padding:'12px 16px',border:`2px solid ${C.border}`,borderRadius:8,fontSize:14,outline:'none',fontFamily:'inherit',color:C.text,background:C.bg}}
                onFocus={e=>(e.target.style.borderColor=C.orange)}
                onBlur={e=>(e.target.style.borderColor=C.border)}
                autoFocus
              />
              <button onClick={()=>handleScan(qrInput)} disabled={scanning||!qrInput.trim()} style={{
                padding:'12px 20px',background:C.orange,border:'none',borderRadius:8,
                color:'#fff',fontWeight:800,fontSize:14,cursor:'pointer',fontFamily:'inherit',
                opacity:scanning||!qrInput.trim()?0.5:1
              }}>تحقق</button>
            </div>
          </div>

          {/* Result */}
          {result && (()=>{
            const s=(RC as any)[result.type]
            return(
              <div style={{background:s.bg,border:`3px solid ${s.border}`,borderRadius:12,padding:20,textAlign:'center',animation:'pulse 0.3s ease'}}>
                <div style={{fontSize:48,marginBottom:8}}>{result.icon}</div>
                <p style={{fontSize:18,fontWeight:800,color:s.color,margin:0}}>{result.msg}</p>
                {result.name&&<p style={{fontSize:15,color:s.color,margin:'8px 0 0',fontWeight:600}}>👤 {result.name}</p>}
                {result.ticket&&<p style={{fontSize:13,color:s.color,margin:'4px 0 0'}}>🎟 {result.ticket}</p>}
                {result.event&&<p style={{fontSize:12,color:s.color,opacity:0.7,margin:'4px 0 0'}}>📅 {result.event}</p>}
              </div>
            )
          })()}

          {/* Scan history */}
          {history.length > 0 && (
            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,overflow:'hidden',flex:1}}>
              <div style={{padding:'10px 14px',borderBottom:`1px solid ${C.border}`,display:'flex',justifyContent:'space-between'}}>
                <span style={{fontWeight:700,color:C.navy,fontSize:13}}>سجل اليوم ({history.length})</span>
                <button onClick={()=>setHistory([])} style={{fontSize:11,color:C.muted,background:'none',border:'none',cursor:'pointer',fontFamily:'inherit'}}>مسح</button>
              </div>
              <div style={{maxHeight:260,overflowY:'auto'}}>
                {history.map((h,i)=>(
                  <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'8px 14px',borderBottom:i<history.length-1?`1px solid ${C.border}`:'none',fontSize:12}}>
                    <span style={{color:C.navy,fontWeight:600}}>✅ {h.name}</span>
                    <div style={{textAlign:'left'}}>
                      <span style={{color:C.muted,fontSize:10}}>{h.ticket}</span>
                      <span style={{color:C.muted,marginRight:8}}>{h.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes pulse{0%{transform:scale(0.95)}50%{transform:scale(1.02)}100%{transform:scale(1)}}`}</style>
    </div>
  )
}
