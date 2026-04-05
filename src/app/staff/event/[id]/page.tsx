'use client'
import { useEffect, useState, useRef, useCallback } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useParams } from 'next/navigation'

const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
const C = { navy:'#1E0A3C',orange:'#F05537',text:'#39364F',muted:'#6F7287',border:'#DBDAE3',bg:'#FAFAFA',card:'#FFFFFF',green:'#3A7D0A' }

export default function StaffEventPage() {
  const { id } = useParams()
  const [worker, setWorker]       = useState<any>(null)
  const [assignment, setAssignment] = useState<any>(null)
  const [ev, setEv]               = useState<any>(null)
  const [loading, setLoading]     = useState(true)
  // Scanner
  const [qrInput, setQrInput]     = useState('')
  const [scanRes, setScanRes]     = useState<any>(null)
  const [scanning, setScanning]   = useState(false)
  const [scanHistory, setScanHistory] = useState<any[]>([])
  const [cameraOn, setCameraOn]   = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream|null>(null)
  const scanRef = useRef(false)
  const qrRef = useRef<HTMLInputElement>(null)
  // Crowd counter
  const [zoneCount, setZoneCount] = useState(0)
  // Parking
  const [parkingLog, setParkingLog] = useState<{plate:string;time:string;type:'in'|'out'}[]>([])
  const [plateInput, setPlateInput] = useState('')
  // Registrations for receptionist
  const [regs, setRegs] = useState<any[]>([])
  const [regSearch, setRegSearch] = useState('')

  useEffect(() => {
    sb.auth.getUser().then(async ({ data }) => {
      if (!data.user) return
      const { data: wp } = await sb.from('worker_profiles').select('*').eq('user_id', data.user.id).single()
      setWorker(wp)
      const [{ data: ev }, { data: asgn }, { data: regs }] = await Promise.all([
        sb.from('events').select('*').eq('id', id).single(),
        sb.from('event_staff_assignments').select('*').eq('event_id', id).eq('worker_profile_id', wp?.id).single(),
        sb.from('registrations').select('*').eq('event_id', id).in('status', ['registered','attended']).order('guest_name'),
      ])
      setEv(ev); setAssignment(asgn); setRegs(regs || [])
      setLoading(false)
    })
  }, [id])

  // Camera
  const processFrame = useCallback(async () => {
    if (!scanRef.current || !videoRef.current || !canvasRef.current) return
    const v = videoRef.current; const c = canvasRef.current
    if (v.readyState !== v.HAVE_ENOUGH_DATA) { requestAnimationFrame(processFrame); return }
    c.width = v.videoWidth; c.height = v.videoHeight
    const ctx = c.getContext('2d'); if (!ctx) return; ctx.drawImage(v,0,0)
    let code: string | null = null
    if ('BarcodeDetector' in window) {
      try { const bd = new (window as any).BarcodeDetector({formats:['qr_code']}); const b = await bd.detect(c); if (b.length>0) code = b[0].rawValue } catch {}
    }
    if (code) { scanRef.current = false; await handleScan(code); setTimeout(()=>{scanRef.current=true;requestAnimationFrame(processFrame)},2000) }
    else requestAnimationFrame(processFrame)
  }, [id])

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'}})
      streamRef.current = stream
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play() }
      setCameraOn(true); scanRef.current = true; requestAnimationFrame(processFrame)
    } catch { alert('تعذّر تشغيل الكاميرا') }
  }
  function stopCamera() { scanRef.current=false; streamRef.current?.getTracks().forEach(t=>t.stop()); if(videoRef.current)videoRef.current.srcObject=null; setCameraOn(false) }
  useEffect(()=>()=>{stopCamera()},[])

  async function handleScan(code: string) {
    if (!code.trim() || scanning) return
    setScanning(true); setScanRes(null)
    try {
      const { data: reg } = await sb.from('registrations').select('id,guest_name,status,ticket_type').eq('qr_code', code.trim()).eq('event_id', id).single()
      if (!reg) { setScanRes({type:'error',msg:'رمز غير صالح'}) }
      else if (reg.status==='attended') { setScanRes({type:'warning',msg:'مسح مسبقاً',name:reg.guest_name}) }
      else {
        await sb.from('registrations').update({status:'attended',checked_in_at:new Date().toISOString()}).eq('id',reg.id)
        setScanRes({type:'success',msg:'✓ تم تسجيل الحضور',name:reg.guest_name,ticket:reg.ticket_type})
        setScanHistory(h=>[{name:reg.guest_name,time:new Date().toLocaleTimeString('ar-SA')},...h.slice(0,9)])
        setRegs(rs=>rs.map(r=>r.id===reg.id?{...r,status:'attended'}:r))
      }
    } catch { setScanRes({type:'error',msg:'خطأ في الاتصال'}) }
    finally { setScanning(false); setQrInput(''); setTimeout(()=>qrRef.current?.focus(),100) }
  }

  async function checkIn() {
    if (!assignment) return
    await sb.from('event_staff_assignments').update({status:'checked_in',checked_in_at:new Date().toISOString()}).eq('id',assignment.id)
    setAssignment((a:any)=>({...a,status:'checked_in',checked_in_at:new Date().toISOString()}))
  }
  async function checkOut() {
    if (!assignment) return
    await sb.from('event_staff_assignments').update({status:'completed',checked_out_at:new Date().toISOString()}).eq('id',assignment.id)
    setAssignment((a:any)=>({...a,status:'completed',checked_out_at:new Date().toISOString()}))
  }

  const role = assignment?.role || worker?.skills?.[0] || 'staff'
  const scanStyle = ({success:{bg:'#EAF7E0',border:C.green,color:'#1A5A00',icon:'✅'},warning:{bg:'#FFF8E8',border:'#B07000',color:'#7A5000',icon:'⚠️'},error:{bg:'#FEF2F2',border:'#DC2626',color:'#B91C1C',icon:'❌'}} as any)
  const filteredRegs = regs.filter(r=>!regSearch||r.guest_name?.toLowerCase().includes(regSearch.toLowerCase())||r.guest_email?.toLowerCase().includes(regSearch.toLowerCase()))

  if (loading) return <div style={{padding:40,textAlign:'center',color:C.muted}}>جاري التحميل...</div>

  return (
    <div style={{minHeight:'100vh',background:C.bg,direction:'rtl',paddingBottom:80}}>
      {/* Header */}
      <div style={{background:C.navy,padding:'16px 20px',color:'#fff'}}>
        <p style={{fontSize:12,opacity:0.6,margin:'0 0 4px'}}>{ev?.start_date?new Date(ev.start_date).toLocaleDateString('ar-SA'):''}</p>
        <h2 style={{fontSize:16,fontWeight:800,margin:'0 0 6px'}}>{ev?.title||'الفعالية'}</h2>
        <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
          {assignment?.zone&&<span style={{background:'rgba(255,255,255,0.15)',padding:'3px 8px',borderRadius:10,fontSize:11}}>📍 المنطقة: {assignment.zone}</span>}
          <span style={{background:C.orange,padding:'3px 8px',borderRadius:10,fontSize:11,fontWeight:700}}>
            {{scanner:'📷 ماسح',receptionist:'🤝 استقبال',crowd_manager:'👥 إدارة حشود',parking:'🚗 مواقف',staff:'⭐ كادر'}[role]||role}
          </span>
          {assignment && (
            <span style={{background:assignment.status==='checked_in'?'#3A7D0A':assignment.status==='completed'?'#7B4FBF':'rgba(255,255,255,0.15)',padding:'3px 8px',borderRadius:10,fontSize:11,fontWeight:700}}>
              {assignment.status==='checked_in'?'✓ حاضر':assignment.status==='completed'?'✓ انتهى':'⏳ مجدول'}
            </span>
          )}
        </div>
        {/* Check-in/out buttons */}
        {assignment && assignment.status==='scheduled' && (
          <button onClick={checkIn} style={{marginTop:10,width:'100%',padding:'10px',background:C.orange,border:'none',borderRadius:8,color:'#fff',fontWeight:700,fontSize:13,cursor:'pointer',fontFamily:'inherit'}}>
            ✅ تسجيل الحضور لبدء العمل
          </button>
        )}
        {assignment && assignment.status==='checked_in' && (
          <button onClick={checkOut} style={{marginTop:10,width:'100%',padding:'10px',border:'1px solid rgba(255,255,255,0.3)',borderRadius:8,color:'rgba(255,255,255,0.8)',fontWeight:700,fontSize:13,cursor:'pointer',fontFamily:'inherit',background:'transparent'}}>
            🚪 تسجيل المغادرة
          </button>
        )}
      </div>

      <div style={{padding:16}}>
        {/* ── SCANNER role ── */}
        {(role==='scanner'||role==='staff') && (
          <div style={{marginBottom:14}}>
            <div style={{background:C.card,border:`2px solid ${cameraOn?C.orange:C.border}`,borderRadius:10,overflow:'hidden',marginBottom:10}}>
              <div style={{padding:'10px 14px',borderBottom:`1px solid ${C.border}`,display:'flex',justifyContent:'space-between',alignItems:'center',background:'#F8F7FA'}}>
                <span style={{fontWeight:700,color:C.navy,fontSize:14}}>📷 ماسح رموز QR</span>
                <button onClick={cameraOn?stopCamera:startCamera} style={{padding:'6px 14px',border:'none',borderRadius:6,cursor:'pointer',fontFamily:'inherit',fontWeight:700,fontSize:12,background:cameraOn?'#FEF2F2':C.orange,color:cameraOn?'#DC2626':'#fff'}}>
                  {cameraOn?'⏹ إيقاف':'▶ كاميرا'}
                </button>
              </div>
              {cameraOn&&(
                <div style={{background:'#000',position:'relative',minHeight:220}}>
                  <video ref={videoRef} playsInline muted style={{width:'100%',display:'block'}}/>
                  <canvas ref={canvasRef} style={{display:'none'}}/>
                  <div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',width:150,height:150,border:'3px solid rgba(240,85,55,0.9)',borderRadius:12,boxShadow:'0 0 0 1000px rgba(0,0,0,0.45)',pointerEvents:'none'}}/>
                </div>
              )}
              <div style={{padding:12}}>
                <div style={{display:'flex',gap:8}}>
                  <input ref={qrRef} value={qrInput} onChange={e=>setQrInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')handleScan(qrInput)}} placeholder="رمز QR أو ماسح USB..." style={{flex:1,padding:'10px 12px',border:`1px solid ${C.border}`,borderRadius:6,fontSize:13,outline:'none',fontFamily:'inherit',color:C.text,background:C.bg}} autoFocus/>
                  <button onClick={()=>handleScan(qrInput)} disabled={scanning||!qrInput.trim()} style={{padding:'10px 16px',background:C.orange,border:'none',borderRadius:6,color:'#fff',fontWeight:700,cursor:'pointer',fontFamily:'inherit',opacity:scanning||!qrInput.trim()?0.5:1}}>تحقق</button>
                </div>
                {scanRes&&(()=>{const s=scanStyle[scanRes.type];return(
                  <div style={{marginTop:10,background:s.bg,border:`2px solid ${s.border}`,borderRadius:8,padding:'10px 14px'}}>
                    <p style={{fontSize:14,fontWeight:700,color:s.color,margin:0}}>{s.icon} {scanRes.msg}</p>
                    {scanRes.name&&<p style={{fontSize:12,color:s.color,margin:'3px 0 0'}}>👤 {scanRes.name}</p>}
                  </div>
                )})()}
                {scanHistory.length>0&&<div style={{marginTop:8,maxHeight:100,overflowY:'auto'}}>
                  {scanHistory.map((h,i)=>(
                    <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'4px 0',borderBottom:`1px solid ${C.border}`,fontSize:11}}>
                      <span style={{color:C.text}}>✅ {h.name}</span>
                      <span style={{color:C.muted}}>{h.time}</span>
                    </div>
                  ))}
                </div>}
              </div>
            </div>
            <div style={{background:'#F8F7FA',borderRadius:8,padding:'10px 14px',textAlign:'center'}}>
              <p style={{fontSize:13,fontWeight:700,color:C.navy,margin:0}}>{regs.filter(r=>r.status==='attended').length} / {regs.length} حضروا</p>
            </div>
          </div>
        )}

        {/* ── RECEPTIONIST role ── */}
        {role==='receptionist' && (
          <div style={{marginBottom:14}}>
            <h3 style={{fontSize:14,fontWeight:700,color:C.navy,margin:'0 0 10px'}}>🤝 قائمة التسجيل</h3>
            <input value={regSearch} onChange={e=>setRegSearch(e.target.value)} placeholder="ابحث باسم الزائر أو البريد..." style={{width:'100%',padding:'10px 14px',border:`1px solid ${C.border}`,borderRadius:8,fontSize:13,outline:'none',fontFamily:'inherit',color:C.text,background:C.bg,boxSizing:'border-box',marginBottom:10}}/>
            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,overflow:'hidden'}}>
              {filteredRegs.slice(0,20).map((r,i)=>(
                <div key={r.id} style={{padding:'10px 14px',borderBottom:i<Math.min(filteredRegs.length,20)-1?`1px solid ${C.border}`:'none',display:'flex',alignItems:'center',gap:10}}>
                  <div style={{width:32,height:32,background:r.status==='attended'?'#EAF7E0':'#EDE9F7',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,fontWeight:700,color:r.status==='attended'?C.green:'#7B4FBF',flexShrink:0}}>{r.guest_name?.[0]||'?'}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <p style={{fontSize:13,fontWeight:700,color:C.navy,margin:0}}>{r.guest_name}</p>
                    <p style={{fontSize:11,color:C.muted,margin:0}}>{r.guest_email||''} · {r.ticket_type||'عام'}</p>
                  </div>
                  {r.status!=='attended'
                    ? <button onClick={async()=>{await sb.from('registrations').update({status:'attended',checked_in_at:new Date().toISOString()}).eq('id',r.id);setRegs(rs=>rs.map(x=>x.id===r.id?{...x,status:'attended'}:x))}} style={{padding:'5px 10px',background:'#EAF7E0',border:'none',borderRadius:6,color:C.green,fontWeight:700,fontSize:11,cursor:'pointer',fontFamily:'inherit'}}>✓ حضر</button>
                    : <span style={{padding:'3px 8px',background:'#EAF7E0',borderRadius:10,fontSize:11,fontWeight:700,color:C.green}}>✓ حضر</span>
                  }
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── CROWD MANAGER role ── */}
        {role==='crowd_manager' && (
          <div style={{marginBottom:14}}>
            <h3 style={{fontSize:14,fontWeight:700,color:C.navy,margin:'0 0 10px'}}>👥 عداد الحشد — {assignment?.zone||'المنطقة'}</h3>
            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:24,textAlign:'center',marginBottom:12}}>
              <p style={{fontSize:64,fontWeight:800,color:C.navy,margin:0,lineHeight:1}}>{zoneCount}</p>
              <p style={{fontSize:14,color:C.muted,margin:'6px 0 20px'}}>شخص في المنطقة</p>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                <button onClick={()=>setZoneCount(c=>c+1)} style={{padding:'18px',background:C.green,border:'none',borderRadius:10,color:'#fff',fontWeight:800,fontSize:20,cursor:'pointer',fontFamily:'inherit'}}>+ دخول</button>
                <button onClick={()=>setZoneCount(c=>Math.max(0,c-1))} style={{padding:'18px',background:'#FEF2F2',border:'none',borderRadius:10,color:'#DC2626',fontWeight:800,fontSize:20,cursor:'pointer',fontFamily:'inherit'}}>− خروج</button>
              </div>
              <button onClick={()=>setZoneCount(0)} style={{marginTop:10,padding:'8px 20px',border:`1px solid ${C.border}`,borderRadius:8,background:C.bg,color:C.muted,fontSize:12,cursor:'pointer',fontFamily:'inherit'}}>إعادة تعيين</button>
            </div>
            {ev?.capacity&&<div style={{background:'#F8F7FA',borderRadius:8,padding:'10px 14px'}}>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:12,color:C.muted,marginBottom:4}}><span>الطاقة الكلية</span><span>{zoneCount}/{ev.capacity}</span></div>
              <div style={{background:C.border,borderRadius:20,height:8,overflow:'hidden'}}><div style={{width:`${Math.min(zoneCount/ev.capacity*100,100)}%`,height:'100%',background:zoneCount/ev.capacity>0.9?C.orange:C.green,transition:'width 0.3s'}}/></div>
            </div>}
          </div>
        )}

        {/* ── PARKING role ── */}
        {role==='parking' && (
          <div style={{marginBottom:14}}>
            <h3 style={{fontSize:14,fontWeight:700,color:C.navy,margin:'0 0 10px'}}>🚗 سجل المواقف — {assignment?.zone||'المنطقة'}</h3>
            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:16,marginBottom:12}}>
              <input value={plateInput} onChange={e=>setPlateInput(e.target.value.toUpperCase())} placeholder="رقم اللوحة..." style={{width:'100%',padding:'11px 14px',border:`1px solid ${C.border}`,borderRadius:8,fontSize:15,outline:'none',fontFamily:'inherit',color:C.text,background:C.bg,boxSizing:'border-box',fontWeight:700,textAlign:'center',marginBottom:10}}/>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                <button onClick={()=>{if(plateInput.trim()){setParkingLog(l=>[{plate:plateInput.trim(),time:new Date().toLocaleTimeString('ar-SA'),type:'in'},...l]);setPlateInput('')}}} style={{padding:'12px',background:C.green,border:'none',borderRadius:8,color:'#fff',fontWeight:700,fontSize:13,cursor:'pointer',fontFamily:'inherit'}}>🟢 دخول</button>
                <button onClick={()=>{if(plateInput.trim()){setParkingLog(l=>[{plate:plateInput.trim(),time:new Date().toLocaleTimeString('ar-SA'),type:'out'},...l]);setPlateInput('')}}} style={{padding:'12px',background:'#FEF2F2',border:'none',borderRadius:8,color:'#DC2626',fontWeight:700,fontSize:13,cursor:'pointer',fontFamily:'inherit'}}>🔴 خروج</button>
              </div>
            </div>
            <div style={{background:'#F8F7FA',borderRadius:8,padding:'10px 14px',marginBottom:10,textAlign:'center'}}>
              <span style={{fontSize:13,fontWeight:700,color:C.navy}}>
                {parkingLog.filter(p=>p.type==='in').length - parkingLog.filter(p=>p.type==='out').length} سيارة داخل المواقف
              </span>
            </div>
            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,overflow:'hidden'}}>
              {parkingLog.length===0?<p style={{padding:20,textAlign:'center',color:C.muted,fontSize:13}}>لا يوجد سجل بعد</p>:parkingLog.slice(0,15).map((p,i)=>(
                <div key={i} style={{padding:'9px 14px',borderBottom:i<parkingLog.length-1?`1px solid ${C.border}`:'none',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <span style={{fontWeight:700,fontSize:13,color:C.navy,fontFamily:'monospace'}}>{p.plate}</span>
                  <div style={{display:'flex',gap:8,alignItems:'center'}}>
                    <span style={{fontSize:11,color:C.muted}}>{p.time}</span>
                    <span style={{padding:'2px 8px',borderRadius:10,fontSize:11,fontWeight:700,background:p.type==='in'?'#EAF7E0':'#FEF2F2',color:p.type==='in'?C.green:'#DC2626'}}>{p.type==='in'?'دخول':'خروج'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
