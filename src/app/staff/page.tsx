'use client'
import { useEffect, useState, useRef, useCallback } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
const C = { navy:'#1E0A3C', orange:'#F05537', blue:'#0070B8', border:'#DBDAE3', muted:'#6F7287', text:'#39364F', bg:'#FAFAFA', card:'#FFFFFF', green:'#3A7D0A' }

const ROLE_META: Record<string,{icon:string;label:string;color:string;bg:string}> = {
  ticket_scanner: {icon:'📷', label:'قارئ تذاكر',   color:C.green,   bg:'#EAF7E0'},
  receptionist:   {icon:'🤝', label:'مستقبل ضيوف', color:C.blue,    bg:'#EDF7FF'},
  crowd_manager:  {icon:'👥', label:'منظم حشود',    color:'#7B4FBF', bg:'#EDE9F7'},
  parking:        {icon:'🚗', label:'باركينغ',      color:'#B07000', bg:'#FFF8E8'},
  security:       {icon:'🛡', label:'أمن',           color:'#DC2626', bg:'#FEF2F2'},
  coordinator:    {icon:'🎯', label:'منسق',          color:C.orange,  bg:'#FEF0ED'},
}

export default function StaffDashboard() {
  const router = useRouter()
  const [profile, setProfile]       = useState<any>(null)
  const [worker, setWorker]         = useState<any>(null)
  const [assignments, setAssignments] = useState<any[]>([])
  const [loading, setLoading]       = useState(true)
  const [activeTab, setActiveTab]   = useState<'scanner'|'reception'|'crowd'|'parking'|'profile'>('scanner')
  // Scanner
  const [qrInput, setQrInput]   = useState('')
  const [scanRes, setScanRes]   = useState<any>(null)
  const [scanning, setScanning] = useState(false)
  const [scanHistory, setScanHistory] = useState<any[]>([])
  const [cameraOn, setCameraOn] = useState(false)
  const [cameraErr, setCameraErr] = useState('')
  const videoRef  = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream|null>(null)
  const scanRef   = useRef(false)
  const qrRef     = useRef<HTMLInputElement>(null)
  // Reception
  const [regs, setRegs] = useState<any[]>([])
  const [recSearch, setRecSearch] = useState('')
  // Today's shift
  const [todayEvent, setTodayEvent] = useState<any>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await sb.auth.getUser()
      if (!user) { router.push('/staff/login'); return }

      const { data: prof } = await sb.from('profiles').select('*').eq('id', user.id).single()
      setProfile(prof)

      const { data: wrk } = await sb.from('worker_profiles').select('*').eq('user_id', user.id).single()
      setWorker(wrk)

      if (wrk) {
        const { data: asgn } = await sb.from('staff_assignments')
          .select('*, events(id,title,start_date,location,cover_image,capacity)')
          .eq('worker_id', wrk.id)
          .in('status', ['confirmed','pending'])
          .order('shift_start', { ascending: true })
        setAssignments(asgn || [])

        // Load today's active assignment event registrations
        const today = new Date().toISOString().slice(0,10)
        const todayAsgn = (asgn||[]).find((a:any) => a.shift_start?.slice(0,10) === today || a.status === 'confirmed')
        if (todayAsgn?.events) {
          setTodayEvent(todayAsgn.events)
          const { data: r } = await sb.from('registrations').select('*').eq('event_id', todayAsgn.events.id).order('created_at', {ascending:false})
          setRegs(r || [])
        }
      }
      setLoading(false)
    }
    load()
  }, [])

  // Camera scanner
  const processFrame = useCallback(async () => {
    if (!scanRef.current || !videoRef.current || !canvasRef.current) return
    const v = videoRef.current; const c = canvasRef.current
    if (v.readyState !== v.HAVE_ENOUGH_DATA) { requestAnimationFrame(processFrame); return }
    c.width = v.videoWidth; c.height = v.videoHeight
    const ctx = c.getContext('2d'); if (!ctx) return; ctx.drawImage(v, 0, 0)
    let code: string | null = null
    if ('BarcodeDetector' in window) {
      try { const bd = new (window as any).BarcodeDetector({ formats: ['qr_code'] }); const b = await bd.detect(c); if (b.length > 0) code = b[0].rawValue } catch {}
    }
    if (code) { scanRef.current = false; await handleScan(code); setTimeout(() => { scanRef.current = true; requestAnimationFrame(processFrame) }, 2500) }
    else requestAnimationFrame(processFrame)
  }, [todayEvent])

  async function startCamera() {
    setCameraErr('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      streamRef.current = stream
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play() }
      setCameraOn(true); scanRef.current = true; requestAnimationFrame(processFrame)
    } catch(e:any) { setCameraErr(e.name === 'NotAllowedError' ? 'يرجى السماح بالكاميرا' : 'تعذّر تشغيل الكاميرا') }
  }
  function stopCamera() { scanRef.current = false; streamRef.current?.getTracks().forEach(t=>t.stop()); if(videoRef.current) videoRef.current.srcObject=null; setCameraOn(false) }
  useEffect(() => () => { stopCamera() }, [])

  async function handleScan(code: string) {
    if (!code.trim() || scanning) return
    setScanning(true); setScanRes(null)
    const eventId = todayEvent?.id
    try {
      let q = sb.from('registrations').select('id,guest_name,status,ticket_type').eq('qr_code', code.trim())
      if (eventId) q = q.eq('event_id', eventId)
      const { data: reg } = await q.single()
      if (!reg) { setScanRes({ type:'error', msg:'رمز غير صالح' }) }
      else if (reg.status === 'attended') { setScanRes({ type:'warning', msg:'تم المسح مسبقاً', name:reg.guest_name, ticket:reg.ticket_type }) }
      else {
        await sb.from('registrations').update({ status:'attended', checked_in_at:new Date().toISOString() }).eq('id', reg.id)
        setScanRes({ type:'success', msg:'✓ تم تسجيل الحضور', name:reg.guest_name, ticket:reg.ticket_type })
        setScanHistory(h => [{ name:reg.guest_name, ticket:reg.ticket_type, time:new Date().toLocaleTimeString('ar-SA') }, ...h.slice(0,29)])
        setRegs(r => r.map(x => x.id===reg.id ? { ...x, status:'attended', checked_in_at:new Date().toISOString() } : x))
      }
    } catch { setScanRes({ type:'error', msg:'خطأ في الاتصال' }) }
    finally { setScanning(false); setQrInput(''); setTimeout(() => qrRef.current?.focus(), 100) }
  }

  async function checkIn(regId: string) {
    await sb.from('registrations').update({ status:'attended', checked_in_at:new Date().toISOString() }).eq('id', regId)
    setRegs(r => r.map(x => x.id===regId ? { ...x, status:'attended' } : x))
  }

  async function clockIn() {
    const asgn = assignments[0]
    if (!asgn) return
    await sb.from('staff_assignments').update({ check_in_time: new Date().toISOString(), status:'confirmed' }).eq('id', asgn.id)
    setAssignments(a => a.map(x => x.id===asgn.id ? { ...x, check_in_time: new Date().toISOString() } : x))
  }

  async function signOut() { await sb.auth.signOut(); router.push('/staff/login') }

  const scanStyle: any = {
    success:{ bg:'#EAF7E0', border:C.green,   color:'#1A5A00', icon:'✅' },
    warning:{ bg:'#FFF8E8', border:'#B07000',  color:'#7A5000', icon:'⚠️' },
    error:  { bg:'#FEF2F2', border:'#DC2626',  color:'#B91C1C', icon:'❌' },
  }

  const mainRole = assignments[0]?.role || 'ticket_scanner'
  const roleMeta = ROLE_META[mainRole] || ROLE_META.ticket_scanner
  const attended = regs.filter(r => r.status === 'attended').length
  const total    = regs.length

  if (loading) return <div style={{ minHeight:'100vh', background:`linear-gradient(135deg, #0070B8, #005A94)`, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:16 }}>جاري التحميل...</div>

  return (
    <div style={{ minHeight:'100vh', background:C.bg, direction:'rtl' }}>
      {/* Header */}
      <div style={{ background:`linear-gradient(135deg, #0070B8, #005A94)`, padding:'16px 20px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:42, height:42, background:'rgba(255,255,255,0.2)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>{roleMeta.icon}</div>
            <div>
              <p style={{ color:'rgba(255,255,255,0.7)', fontSize:11, margin:0 }}>{roleMeta.label}</p>
              <p style={{ color:'#fff', fontSize:15, fontWeight:800, margin:0 }}>{worker?.full_name || profile?.full_name || 'الكادر'}</p>
            </div>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={()=>setActiveTab('profile')} style={{ padding:'7px 12px', background:'rgba(255,255,255,0.15)', border:'none', borderRadius:6, color:'#fff', fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>👤 ملفي</button>
            <button onClick={signOut} style={{ padding:'7px 12px', background:'rgba(255,255,255,0.15)', border:'none', borderRadius:6, color:'#fff', fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>خروج</button>
          </div>
        </div>

        {/* Today's event */}
        {todayEvent && (
          <div style={{ background:'rgba(255,255,255,0.12)', borderRadius:10, padding:'12px 16px', marginTop:14 }}>
            <p style={{ color:'rgba(255,255,255,0.7)', fontSize:11, margin:'0 0 2px' }}>الفعالية الحالية</p>
            <p style={{ color:'#fff', fontSize:14, fontWeight:700, margin:0 }}>{todayEvent.title}</p>
            {todayEvent.location && <p style={{ color:'rgba(255,255,255,0.65)', fontSize:12, margin:'2px 0 0' }}>📍 {todayEvent.location}</p>}
            <div style={{ display:'flex', gap:12, marginTop:8 }}>
              <span style={{ background:'rgba(255,255,255,0.2)', color:'#fff', fontSize:11, padding:'3px 10px', borderRadius:20, fontWeight:700 }}>✅ {attended} حضر</span>
              <span style={{ background:'rgba(255,255,255,0.2)', color:'#fff', fontSize:11, padding:'3px 10px', borderRadius:20 }}>📋 {total} مسجّل</span>
              {!assignments[0]?.check_in_time && (
                <button onClick={clockIn} style={{ background:C.orange, color:'#fff', border:'none', borderRadius:20, padding:'3px 12px', fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>⏱ تسجيل دوام</button>
              )}
            </div>
          </div>
        )}

        {!todayEvent && (
          <div style={{ background:'rgba(255,255,255,0.1)', borderRadius:10, padding:'12px 16px', marginTop:14 }}>
            <p style={{ color:'rgba(255,255,255,0.7)', fontSize:13, margin:0 }}>لا توجد مهام مجدولة اليوم</p>
          </div>
        )}
      </div>

      {/* Quick tabs based on role */}
      <div style={{ background:C.card, borderBottom:`1px solid ${C.border}`, overflowX:'auto' }}>
        <div style={{ display:'flex', minWidth:'max-content' }}>
          {[
            { key:'scanner',   icon:'📷', label:'الماسح'        },
            { key:'reception', icon:'🤝', label:'الاستقبال'     },
            { key:'crowd',     icon:'👥', label:'الحشود'        },
            { key:'parking',   icon:'🚗', label:'الباركينغ'     },
            { key:'profile',   icon:'👤', label:'ملفي الشخصي'  },
          ].map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key as any)} style={{
              padding:'11px 18px', border:'none', background:'transparent', cursor:'pointer',
              fontFamily:'inherit', fontSize:13, fontWeight:activeTab===t.key?700:500,
              color:activeTab===t.key?C.blue:C.muted, whiteSpace:'nowrap',
              borderBottom:activeTab===t.key?`3px solid ${C.blue}`:'3px solid transparent'
            }}>{t.icon} {t.label}</button>
          ))}
        </div>
      </div>

      <div style={{ padding:16, maxWidth:700, margin:'0 auto' }}>

        {/* SCANNER TAB */}
        {activeTab==='scanner' && (
          <div>
            <div style={{ background:C.card, border:`2px solid ${cameraOn?C.blue:C.border}`, borderRadius:12, overflow:'hidden', marginBottom:14 }}>
              <div style={{ padding:'12px 16px', background:'#F8F7FA', borderBottom:`1px solid ${C.border}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div>
                  <span style={{ fontWeight:700, color:C.navy, fontSize:14 }}>📷 ماسح التذاكر</span>
                  {todayEvent && <p style={{ fontSize:11, color:C.muted, margin:'2px 0 0' }}>{todayEvent.title}</p>}
                </div>
                <button onClick={cameraOn?stopCamera:startCamera} style={{ padding:'7px 16px', border:'none', borderRadius:6, cursor:'pointer', fontFamily:'inherit', fontWeight:700, fontSize:12, background:cameraOn?'#FEF2F2':C.blue, color:cameraOn?'#DC2626':'#fff' }}>
                  {cameraOn?'⏹ إيقاف':'▶ تشغيل'}
                </button>
              </div>
              {cameraErr && <div style={{ padding:'8px 16px', background:'#FEF2F2' }}><p style={{ margin:0, color:'#B91C1C', fontSize:12 }}>⚠️ {cameraErr}</p></div>}
              {cameraOn && (
                <div style={{ background:'#000', position:'relative' }}>
                  <video ref={videoRef} playsInline muted style={{ width:'100%', display:'block', maxHeight:260 }}/>
                  <canvas ref={canvasRef} style={{ display:'none' }}/>
                  <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:160, height:160, border:'3px solid rgba(0,112,184,0.9)', borderRadius:12, boxShadow:'0 0 0 1000px rgba(0,0,0,0.45)', pointerEvents:'none' }}/>
                  <div style={{ position:'absolute', top:12, left:12, background:'rgba(0,112,184,0.8)', color:'#fff', fontSize:11, fontWeight:700, padding:'4px 10px', borderRadius:20 }}>● مسح نشط</div>
                </div>
              )}
              {!cameraOn && <div style={{ padding:'20px', textAlign:'center' }}>
                <p style={{ color:C.muted, fontSize:13, margin:0 }}>أو استخدم الإدخال اليدوي / ماسح USB أدناه</p>
              </div>}
              <div style={{ padding:'12px 16px' }}>
                <div style={{ display:'flex', gap:8 }}>
                  <input ref={qrRef} value={qrInput} onChange={e=>setQrInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')handleScan(qrInput)}} placeholder="أدخل رمز التذكرة أو ماسح USB..." style={{ flex:1, padding:'10px 14px', border:`1px solid ${C.border}`, borderRadius:8, fontSize:14, outline:'none', fontFamily:'inherit', color:C.text, background:C.bg }} autoFocus/>
                  <button onClick={()=>handleScan(qrInput)} disabled={scanning||!qrInput.trim()} style={{ padding:'10px 20px', background:C.blue, border:'none', borderRadius:8, color:'#fff', fontWeight:700, cursor:'pointer', fontFamily:'inherit', opacity:scanning||!qrInput.trim()?0.5:1 }}>تحقق</button>
                </div>
              </div>
            </div>

            {scanRes && (() => {
              const sc = scanStyle[scanRes.type]
              return (
                <div style={{ background:sc.bg, border:`2px solid ${sc.border}`, borderRadius:10, padding:'14px 18px', marginBottom:14, animation:'fadeIn 0.2s' }}>
                  <p style={{ fontSize:16, fontWeight:800, color:sc.color, margin:0 }}>{sc.icon} {scanRes.msg}</p>
                  {scanRes.name && <p style={{ fontSize:13, color:sc.color, margin:'6px 0 0' }}>👤 {scanRes.name}{scanRes.ticket?` — ${scanRes.ticket}`:''}</p>}
                </div>
              )
            })()}

            {/* Scan stats */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:14 }}>
              <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:8, padding:'12px', textAlign:'center' }}>
                <p style={{ fontSize:24, fontWeight:800, color:C.blue, margin:0 }}>{scanHistory.length}</p>
                <p style={{ fontSize:11, color:C.muted, margin:0 }}>مسح اليوم</p>
              </div>
              <div style={{ background:'#EAF7E0', border:`1px solid #9DE07B`, borderRadius:8, padding:'12px', textAlign:'center' }}>
                <p style={{ fontSize:24, fontWeight:800, color:C.green, margin:0 }}>{attended}</p>
                <p style={{ fontSize:11, color:C.muted, margin:0 }}>حضور كلي</p>
              </div>
              <div style={{ background:'#EDF7FF', border:`1px solid #B3DFF7`, borderRadius:8, padding:'12px', textAlign:'center' }}>
                <p style={{ fontSize:24, fontWeight:800, color:C.blue, margin:0 }}>{total>0?Math.round(attended/total*100):0}%</p>
                <p style={{ fontSize:11, color:C.muted, margin:0 }}>نسبة الحضور</p>
              </div>
            </div>

            {/* Scan history */}
            {scanHistory.length > 0 && (
              <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, overflow:'hidden' }}>
                <div style={{ padding:'10px 16px', borderBottom:`1px solid ${C.border}`, display:'flex', justifyContent:'space-between' }}>
                  <span style={{ fontWeight:700, color:C.navy, fontSize:13 }}>آخر المسح ({scanHistory.length})</span>
                  <button onClick={()=>setScanHistory([])} style={{ fontSize:11, color:C.muted, background:'none', border:'none', cursor:'pointer', fontFamily:'inherit' }}>مسح</button>
                </div>
                <div style={{ maxHeight:240, overflowY:'auto' }}>
                  {scanHistory.map((h,i) => (
                    <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'9px 16px', borderBottom:`1px solid ${C.border}` }}>
                      <div>
                        <p style={{ fontSize:13, fontWeight:700, color:C.navy, margin:0 }}>✅ {h.name}</p>
                        <p style={{ fontSize:11, color:C.muted, margin:0 }}>{h.ticket}</p>
                      </div>
                      <span style={{ fontSize:11, color:C.muted }}>{h.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* RECEPTION TAB */}
        {activeTab==='reception' && (
          <div>
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, overflow:'hidden' }}>
              <div style={{ padding:'12px 16px', borderBottom:`1px solid ${C.border}`, background:'#EDF7FF' }}>
                <p style={{ fontWeight:700, color:C.blue, fontSize:14, margin:0 }}>🤝 قائمة الضيوف</p>
                {todayEvent && <p style={{ fontSize:11, color:C.muted, margin:'2px 0 0' }}>{todayEvent.title}</p>}
              </div>
              <div style={{ padding:'10px 16px', borderBottom:`1px solid ${C.border}` }}>
                <input value={recSearch} onChange={e=>setRecSearch(e.target.value)} placeholder="ابحث بالاسم..." style={{ width:'100%', padding:'9px 14px', border:`1px solid ${C.border}`, borderRadius:8, fontSize:13, outline:'none', fontFamily:'inherit', background:C.bg, boxSizing:'border-box' as const }}/>
              </div>
              <div style={{ maxHeight:400, overflowY:'auto' }}>
                {regs.filter(r => !recSearch || (r.guest_name||'').toLowerCase().includes(recSearch.toLowerCase())).map((r,i) => (
                  <div key={r.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 16px', borderBottom:`1px solid ${C.border}`, transition:'background 0.1s' }}
                    onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background='#F8F7FA'}
                    onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background='transparent'}
                  >
                    <div style={{ width:36, height:36, background:r.status==='attended'?'#EAF7E0':'#EDE9F7', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:700, color:r.status==='attended'?C.green:'#7B4FBF', flexShrink:0 }}>
                      {r.status==='attended'?'✓':(r.guest_name?.[0]||'?')}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ fontSize:13, fontWeight:700, color:C.navy, margin:0 }}>{r.guest_name}</p>
                      <p style={{ fontSize:11, color:C.muted, margin:0 }}>{r.ticket_type||'عام'} {r.guest_phone?`· ${r.guest_phone}`:''}</p>
                    </div>
                    {r.status === 'attended'
                      ? <span style={{ padding:'4px 10px', background:'#EAF7E0', borderRadius:20, fontSize:11, fontWeight:700, color:C.green, whiteSpace:'nowrap' }}>✅ حضر</span>
                      : <button onClick={()=>checkIn(r.id)} style={{ padding:'6px 12px', background:C.blue, border:'none', borderRadius:6, color:'#fff', fontWeight:700, fontSize:12, cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap' }}>✓ تسجيل</button>
                    }
                  </div>
                ))}
                {regs.length === 0 && <div style={{ padding:32, textAlign:'center' }}><p style={{ color:C.muted, fontSize:13 }}>لا توجد بيانات</p></div>}
              </div>
            </div>
          </div>
        )}

        {/* CROWD TAB */}
        {activeTab==='crowd' && (
          <div>
            <div style={{ background:`linear-gradient(135deg, #7B4FBF, #5E3A99)`, borderRadius:12, padding:20, marginBottom:14, color:'#fff' }}>
              <h3 style={{ fontSize:16, fontWeight:800, margin:'0 0 16px' }}>👥 إدارة الحشود</h3>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div style={{ background:'rgba(255,255,255,0.15)', borderRadius:10, padding:'14px', textAlign:'center' }}>
                  <p style={{ fontSize:32, fontWeight:800, margin:0 }}>{attended}</p>
                  <p style={{ fontSize:12, margin:0, opacity:0.8 }}>داخل المكان</p>
                </div>
                <div style={{ background:'rgba(255,255,255,0.15)', borderRadius:10, padding:'14px', textAlign:'center' }}>
                  <p style={{ fontSize:32, fontWeight:800, margin:0 }}>{todayEvent?.capacity ? todayEvent.capacity - attended : '∞'}</p>
                  <p style={{ fontSize:12, margin:0, opacity:0.8 }}>مقاعد متاحة</p>
                </div>
              </div>
              {todayEvent?.capacity > 0 && (
                <div style={{ marginTop:16 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, opacity:0.8, marginBottom:6 }}>
                    <span>الامتلاء</span>
                    <span>{Math.round(attended/todayEvent.capacity*100)}%</span>
                  </div>
                  <div style={{ background:'rgba(255,255,255,0.2)', borderRadius:20, height:8, overflow:'hidden' }}>
                    <div style={{ width:`${Math.min(attended/todayEvent.capacity*100, 100)}%`, height:'100%', background:'#fff', borderRadius:20, transition:'width 0.5s' }}/>
                  </div>
                </div>
              )}
            </div>
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:20 }}>
              <h3 style={{ fontSize:14, fontWeight:700, color:C.navy, margin:'0 0 12px' }}>المناطق والأقسام</h3>
              {assignments.map(a => (
                <div key={a.id} style={{ display:'flex', justifyContent:'space-between', padding:'10px 12px', background:'#F8F7FA', borderRadius:8, marginBottom:8 }}>
                  <div>
                    <p style={{ fontSize:13, fontWeight:700, color:C.navy, margin:0 }}>{a.zone||'المنطقة الرئيسية'}</p>
                    <p style={{ fontSize:11, color:C.muted, margin:'2px 0 0' }}>{a.events?.title}</p>
                  </div>
                  <span style={{ padding:'4px 10px', background:'#EAF7E0', borderRadius:20, fontSize:11, fontWeight:700, color:C.green }}>نشط</span>
                </div>
              ))}
              {assignments.length === 0 && <p style={{ color:C.muted, fontSize:13 }}>لا توجد مناطق مسندة</p>}
            </div>
          </div>
        )}

        {/* PARKING TAB */}
        {activeTab==='parking' && (
          <div>
            <div style={{ background:`linear-gradient(135deg, #B07000, #8A5500)`, borderRadius:12, padding:20, marginBottom:14, color:'#fff' }}>
              <h3 style={{ fontSize:16, fontWeight:800, margin:'0 0 8px' }}>🚗 إدارة الباركينغ</h3>
              <p style={{ fontSize:13, opacity:0.8, margin:0 }}>
                المنطقة: {assignments.find(a=>a.role==='parking')?.zone || 'المنطقة الرئيسية'}
              </p>
            </div>
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:20 }}>
              <p style={{ color:C.muted, fontSize:13, textAlign:'center', margin:0 }}>
                🚧 سيتم إضافة نظام إدارة الباركينغ في التحديث القادم
              </p>
            </div>
          </div>
        )}

        {/* PROFILE TAB */}
        {activeTab==='profile' && (
          <div>
            {/* Profile card */}
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, overflow:'hidden', marginBottom:14 }}>
              <div style={{ background:`linear-gradient(135deg, #0070B8, #005A94)`, padding:'24px', textAlign:'center' }}>
                <div style={{ width:72, height:72, background:'rgba(255,255,255,0.2)', borderRadius:'50%', display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize:28, marginBottom:10 }}>
                  {worker?.photo_url ? <img src={worker.photo_url} style={{ width:72, height:72, borderRadius:'50%', objectFit:'cover' }}/> : '👤'}
                </div>
                <h2 style={{ color:'#fff', fontSize:18, fontWeight:800, margin:'0 0 4px' }}>{worker?.full_name || profile?.full_name}</h2>
                <span style={{ background:'rgba(255,255,255,0.2)', color:'#fff', fontSize:11, padding:'3px 12px', borderRadius:20 }}>{roleMeta.icon} {roleMeta.label}</span>
                {worker?.is_verified && <span style={{ background:'#EAF7E0', color:C.green, fontSize:11, padding:'3px 10px', borderRadius:20, marginRight:6 }}>✓ موثّق</span>}
              </div>
              <div style={{ padding:'20px' }}>
                {/* Rating */}
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:16, padding:'14px', background:'#F8F7FA', borderRadius:10 }}>
                  <div style={{ textAlign:'center' }}>
                    <p style={{ fontSize:22, fontWeight:800, color:C.orange, margin:0 }}>{worker?.rating_avg?.toFixed(1)||'—'}</p>
                    <p style={{ fontSize:11, color:C.muted, margin:0 }}>التقييم</p>
                    {worker?.rating_avg && <div style={{ display:'flex', gap:2, justifyContent:'center', marginTop:4 }}>
                      {[1,2,3,4,5].map(s=><span key={s} style={{ fontSize:12, color:s<=Math.round(worker.rating_avg)?C.orange:'#DBDAE3' }}>★</span>)}
                    </div>}
                  </div>
                  <div style={{ textAlign:'center' }}>
                    <p style={{ fontSize:22, fontWeight:800, color:C.blue, margin:0 }}>{worker?.rating_count||0}</p>
                    <p style={{ fontSize:11, color:C.muted, margin:0 }}>تقييم</p>
                  </div>
                  <div style={{ textAlign:'center' }}>
                    <p style={{ fontSize:22, fontWeight:800, color:C.green, margin:0 }}>{worker?.total_events||0}</p>
                    <p style={{ fontSize:11, color:C.muted, margin:0 }}>فعالية</p>
                  </div>
                  <div style={{ textAlign:'center' }}>
                    <div style={{ width:32, height:32, background:worker?.is_available?'#EAF7E0':'#FEF2F2', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 4px' }}>
                      <span style={{ fontSize:16 }}>{worker?.is_available?'🟢':'🔴'}</span>
                    </div>
                    <p style={{ fontSize:11, color:C.muted, margin:0 }}>{worker?.is_available?'متاح':'مشغول'}</p>
                  </div>
                </div>

                {/* Info */}
                {[
                  ['📧', 'البريد', profile?.email],
                  ['📱', 'الجوال', worker?.phone || worker?.mobile_number || profile?.phone],
                  ['🏙', 'المدينة', worker?.city],
                  ['📝', 'نبذة', worker?.bio],
                ].filter(([_,__,v])=>v).map(([icon,label,val])=>(
                  <div key={label as string} style={{ display:'flex', gap:12, marginBottom:10, padding:'10px', background:'#FAFAFA', borderRadius:8 }}>
                    <span style={{ fontSize:16, flexShrink:0 }}>{icon}</span>
                    <div style={{ minWidth:0 }}>
                      <p style={{ fontSize:11, color:C.muted, margin:0 }}>{label}</p>
                      <p style={{ fontSize:13, fontWeight:600, color:C.text, margin:'2px 0 0' }}>{val}</p>
                    </div>
                  </div>
                ))}

                {/* Skills */}
                {worker?.skills?.length > 0 && (
                  <div>
                    <p style={{ fontSize:12, fontWeight:700, color:C.navy, margin:'10px 0 8px' }}>المهارات</p>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                      {worker.skills.map((s:string,i:number)=>(
                        <span key={i} style={{ fontSize:11, background:'#EDE9F7', color:'#7B4FBF', borderRadius:20, padding:'4px 12px', fontWeight:600 }}>{s}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Assignments */}
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, overflow:'hidden' }}>
              <div style={{ padding:'12px 16px', borderBottom:`1px solid ${C.border}` }}>
                <span style={{ fontWeight:700, color:C.navy, fontSize:14 }}>📅 مهامي القادمة ({assignments.length})</span>
              </div>
              {assignments.length === 0 ? (
                <div style={{ padding:24, textAlign:'center' }}><p style={{ color:C.muted, fontSize:13 }}>لا توجد مهام مجدولة</p></div>
              ) : assignments.map((a,i) => {
                const rm = ROLE_META[a.role] || ROLE_META.ticket_scanner
                return (
                  <div key={a.id} style={{ padding:'14px 16px', borderBottom:i<assignments.length-1?`1px solid ${C.border}`:'none', display:'flex', gap:12, alignItems:'flex-start' }}>
                    <div style={{ width:40, height:40, background:rm.bg, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>{rm.icon}</div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ fontSize:13, fontWeight:700, color:C.navy, margin:0 }}>{a.events?.title || 'فعالية'}</p>
                      <p style={{ fontSize:11, color:C.muted, margin:'2px 0 0' }}>{rm.label}{a.zone?` — ${a.zone}`:''}</p>
                      {a.shift_start && <p style={{ fontSize:11, color:C.blue, margin:'2px 0 0' }}>
                        ⏰ {new Date(a.shift_start).toLocaleString('ar-SA', {month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}
                        {a.shift_end?` → ${new Date(a.shift_end).toLocaleTimeString('ar-SA',{hour:'2-digit',minute:'2-digit'})}` : ''}
                      </p>}
                    </div>
                    <span style={{ padding:'3px 10px', borderRadius:20, fontSize:10, fontWeight:700, color:a.status==='confirmed'?C.green:'#B07000', background:a.status==='confirmed'?'#EAF7E0':'#FFF8E8', whiteSpace:'nowrap' }}>
                      {a.status==='confirmed'?'✓ مؤكد':'⏳ بانتظار'}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div style={{ height:32 }}/>
    </div>
  )
}
