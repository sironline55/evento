'use client'
import { useEffect, useState, useRef, useCallback } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

const sb = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const C = {
  navy:'#1E0A3C', orange:'#F05537', text:'#39364F',
  muted:'#6F7287', border:'#DBDAE3', bg:'#FAFAFA', card:'#FFFFFF', green:'#3A7D0A'
}

const STATUS_MAP: Record<string,{label:string;color:string;bg:string}> = {
  draft:     {label:'مسودة',  color:'#6F7287', bg:'#F8F7FA'},
  published: {label:'نشط',   color:C.green,   bg:'#EAF7E0'},
  completed: {label:'منتهي', color:'#6F7287', bg:'#F8F7FA'},
  cancelled: {label:'ملغي',  color:'#991B1B', bg:'#FEF2F2'},
}

const SCAN_STYLES: Record<string,any> = {
  success:{ bg:'#EAF7E0', border:C.green,   color:'#1A5A00', icon:'✅' },
  warning:{ bg:'#FFF8E8', border:'#B07000', color:'#7A5000', icon:'⚠️' },
  error:  { bg:'#FEF2F2', border:'#DC2626', color:'#B91C1C', icon:'❌' },
}

type Tab = 'overview'|'attendees'|'tickets'|'analytics'|'settings'

export default function EventDetailPage() {
  const { id } = useParams<{id:string}>()
  const router = useRouter()
  const [tab, setTab]       = useState<Tab>('overview')
  const [ev, setEv]         = useState<any>(null)
  const [regs, setRegs]     = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [liveAttended, setLiveAttended] = useState(0)

  // Scanner state
  const [qrInput, setQrInput]   = useState('')
  const [scanResult, setScanResult] = useState<any>(null)
  const [scanLoading, setScanLoading] = useState(false)
  const [scanHistory, setScanHistory] = useState<any[]>([])
  const [cameraOn, setCameraOn] = useState(false)
  const [cameraErr, setCameraErr] = useState('')
  const videoRef  = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const inputRef  = useRef<HTMLInputElement>(null)
  const streamRef = useRef<MediaStream|null>(null)
  const scanActive = useRef(false)
  const lastCode = useRef('')

  useEffect(() => {
    if (!id) return
    Promise.all([
      sb.from('events').select('*').eq('id', id).single(),
      sb.from('registrations').select('*').eq('event_id', id).order('created_at',{ascending:false}),
    ]).then(([{data:evData},{data:regData}])=>{
      setEv(evData)
      setRegs(regData||[])
      setLiveAttended((regData||[]).filter((r:any)=>r.status==='attended').length)
      setLoading(false)
    })

    // Realtime subscription
    const channel = sb.channel(`event-regs-${id}`)
      .on('postgres_changes',{event:'*',schema:'public',table:'registrations',filter:`event_id=eq.${id}`},
        ()=>{
          sb.from('registrations').select('*').eq('event_id',id).order('created_at',{ascending:false})
            .then(({data})=>{
              setRegs(data||[])
              setLiveAttended((data||[]).filter((r:any)=>r.status==='attended').length)
            })
        }
      ).subscribe()
    return ()=>{ sb.removeChannel(channel) }
  },[id])

  // QR scanning
  const handleScan = useCallback(async (code:string)=>{
    if (!code || scanLoading || code===lastCode.current) return
    lastCode.current = code
    setTimeout(()=>{ lastCode.current='' },2000)
    setScanLoading(true); setScanResult(null)
    try {
      const { data:reg } = await sb.from('registrations')
        .select('id,guest_name,status,qr_code,ticket_type,ticket_reference')
        .eq('qr_code',code).eq('event_id',id).maybeSingle()
      if (!reg) {
        setScanResult({type:'error',message:'رمز غير موجود في هذه الفعالية'})
      } else if (reg.status==='attended') {
        setScanResult({type:'warning',message:'مسح مسبقاً',name:reg.guest_name,ref:reg.ticket_reference})
      } else {
        await sb.from('registrations').update({status:'attended',checked_in_at:new Date().toISOString()}).eq('id',reg.id)
        setScanResult({type:'success',message:'تم تسجيل الحضور ✓',name:reg.guest_name,ref:reg.ticket_reference,ticket_type:reg.ticket_type})
        setScanHistory(h=>[{name:reg.guest_name,time:new Date().toLocaleTimeString('ar-SA'),ref:reg.ticket_reference},...h.slice(0,19)])
      }
    } catch { setScanResult({type:'error',message:'خطأ في الاتصال'}) }
    finally { setScanLoading(false); setQrInput(''); setTimeout(()=>inputRef.current?.focus(),100) }
  },[id,scanLoading])

  const processFrame = useCallback(async ()=>{
    if (!scanActive.current||!videoRef.current||!canvasRef.current) return
    const v=videoRef.current; if(v.readyState<2){requestAnimationFrame(processFrame);return}
    const c=canvasRef.current; c.width=v.videoWidth; c.height=v.videoHeight
    const ctx=c.getContext('2d'); if(!ctx) return; ctx.drawImage(v,0,0)
    if('BarcodeDetector' in window){
      try{
        const bd=new (window as any).BarcodeDetector({formats:['qr_code']})
        const codes=await bd.detect(c)
        if(codes.length>0){
          scanActive.current=false
          await handleScan(codes[0].rawValue)
          setTimeout(()=>{scanActive.current=true;requestAnimationFrame(processFrame)},2500)
          return
        }
      }catch{}
    }
    requestAnimationFrame(processFrame)
  },[handleScan])

  async function startCamera(){
    setCameraErr('')
    try{
      const s=await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'}})
      streamRef.current=s
      if(videoRef.current){videoRef.current.srcObject=s;await videoRef.current.play()}
      setCameraOn(true); scanActive.current=true; requestAnimationFrame(processFrame)
    }catch(e:any){
      setCameraErr(e.name==='NotAllowedError'?'يرجى السماح للكاميرا':'تعذر تشغيل الكاميرا')
    }
  }
  function stopCamera(){
    scanActive.current=false
    streamRef.current?.getTracks().forEach(t=>t.stop())
    streamRef.current=null
    if(videoRef.current)videoRef.current.srcObject=null
    setCameraOn(false)
  }
  useEffect(()=>()=>stopCamera(),[])

  async function checkIn(regId:string){
    await sb.from('registrations').update({status:'attended',checked_in_at:new Date().toISOString()}).eq('id',regId)
  }

  async function exportCSV(){
    const rows = [['الاسم','البريد','الحالة','نوع التذكرة','رقم التذكرة','تاريخ التسجيل','وقت الحضور']]
    regs.forEach(r=>rows.push([r.guest_name,r.guest_email||'',r.status,r.ticket_type||'',r.ticket_reference||'',new Date(r.created_at).toLocaleString('ar-SA'),r.checked_in_at?new Date(r.checked_in_at).toLocaleString('ar-SA'):'']))
    const csv = rows.map(r=>r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n')
    const a=document.createElement('a'); a.href='data:text/csv;charset=utf-8,\uFEFF'+encodeURIComponent(csv)
    a.download=`${ev?.title||'event'}_attendees.csv`; a.click()
  }

  if (loading) return <div style={{padding:60,textAlign:'center',color:C.muted}}>جاري التحميل...</div>
  if (!ev) return <div style={{padding:60,textAlign:'center',color:'#DC2626'}}>الفعالية غير موجودة</div>

  const st = STATUS_MAP[ev.status]||STATUS_MAP.draft
  const total = regs.length
  const attended = regs.filter(r=>r.status==='attended').length
  const notAttended = regs.filter(r=>r.status==='registered'||r.status==='confirmed').length
  const fillRate = ev.capacity ? Math.round((total/ev.capacity)*100) : 0
  const regLink = `${typeof window!=='undefined'?window.location.origin:''}/r/${id}`
  const publicLink = `${typeof window!=='undefined'?window.location.origin:''}/e/${id}`

  const filteredRegs = regs.filter(r=>{
    const matchSearch = !search || r.guest_name?.toLowerCase().includes(search.toLowerCase()) || r.guest_email?.toLowerCase().includes(search.toLowerCase()) || r.ticket_reference?.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter==='all' || r.status===filter
    return matchSearch && matchFilter
  })

  const TABS = [
    { id:'overview',   label:'📋 نظرة عامة' },
    { id:'attendees',  label:`👥 الحضور (${total})` },
    { id:'tickets',    label:'🎟 التذاكر' },
    { id:'analytics',  label:'📊 التقارير' },
    { id:'settings',   label:'⚙️ الإعدادات' },
  ]

  return (
    <div style={{minHeight:'100vh',background:C.bg,direction:'rtl'}}>

      {/* ── Top header ── */}
      <div style={{background:C.card,borderBottom:`1px solid ${C.border}`,padding:'14px 20px'}}>
        <div style={{display:'flex',alignItems:'center',gap:8,fontSize:12,color:C.muted,marginBottom:10}}>
          <Link href="/" style={{color:C.muted,textDecoration:'none'}}>الرئيسية</Link>
          <span>/</span>
          <Link href="/events" style={{color:C.muted,textDecoration:'none'}}>الفعاليات</Link>
          <span>/</span>
          <span style={{color:C.navy,fontWeight:600}}>{ev.title}</span>
        </div>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:10}}>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <h1 style={{fontSize:20,fontWeight:800,color:C.navy,margin:0}}>{ev.title}</h1>
            <span style={{fontSize:11,fontWeight:700,padding:'3px 9px',borderRadius:12,color:st.color,background:st.bg}}>{st.label}</span>
          </div>
          <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
            <button onClick={()=>navigator.clipboard?.writeText(regLink)} style={{padding:'7px 12px',border:`1px solid ${C.border}`,borderRadius:6,background:C.card,color:C.text,fontSize:11,cursor:'pointer',fontFamily:'inherit',fontWeight:600}}>
              🔗 رابط التسجيل
            </button>
            <Link href={`/e/${id}`} target="_blank" style={{padding:'7px 12px',border:`1px solid ${C.border}`,borderRadius:6,background:C.card,color:C.text,fontSize:11,textDecoration:'none',fontWeight:600}}>
              👁 الصفحة العامة
            </Link>
            <Link href={`/scanner?event=${id}`} style={{padding:'7px 12px',border:'none',borderRadius:6,background:'#EAF7E0',color:C.green,fontSize:11,textDecoration:'none',fontWeight:700}}>
              📷 فتح الماسح
            </Link>
            {ev.status==='draft' && (
              <button onClick={async()=>{await sb.from('events').update({status:'published'}).eq('id',id);setEv({...ev,status:'published'})}}
                style={{padding:'7px 16px',border:'none',borderRadius:6,background:C.orange,color:'#fff',fontSize:11,cursor:'pointer',fontFamily:'inherit',fontWeight:700}}>
                🚀 نشر
              </button>
            )}
            <Link href={`/events/${id}/edit`} style={{padding:'7px 12px',border:`1px solid ${C.border}`,borderRadius:6,background:C.card,color:C.text,fontSize:11,textDecoration:'none',fontWeight:600}}>
              ✏️ تعديل
            </Link>
          </div>
        </div>

        {/* Stats bar */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:8,marginTop:14}}>
          {[
            {label:'إجمالي المسجلين', value:total,       color:C.navy,   icon:'🎟'},
            {label:'حضروا',           value:liveAttended, color:C.green,  icon:'✅'},
            {label:'لم يحضروا',       value:notAttended,  color:'#7B4FBF',icon:'⏳'},
            {label:'الطاقة',          value:ev.capacity||'∞', color:C.muted, icon:'📊'},
            {label:'نسبة الامتلاء',   value:ev.capacity?`${fillRate}%`:'—', color:fillRate>80?C.orange:C.text, icon:'📈'},
          ].map(s=>(
            <div key={s.label} style={{background:'#F8F7FA',borderRadius:7,padding:'9px 12px'}}>
              <p style={{fontSize:18,fontWeight:800,color:s.color,margin:0}}>{s.value}</p>
              <p style={{fontSize:10,color:C.muted,margin:0}}>{s.icon} {s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{display:'flex',gap:0,borderBottom:`2px solid ${C.border}`,marginTop:14,marginBottom:-1}}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id as Tab)} style={{
              padding:'9px 14px',border:'none',background:'none',cursor:'pointer',
              fontFamily:'inherit',fontSize:12,fontWeight:700,whiteSpace:'nowrap',
              color:tab===t.id?C.orange:C.muted,
              borderBottom:tab===t.id?`2px solid ${C.orange}`:'2px solid transparent',
              marginBottom:-2
            }}>{t.label}</button>
          ))}
        </div>
      </div>

      <div style={{padding:'16px 20px',maxWidth:900,margin:'0 auto'}}>

        {/* ═══ OVERVIEW TAB ═══ */}
        {tab==='overview' && (
          <div style={{display:'grid',gridTemplateColumns:'1fr 280px',gap:16,alignItems:'start'}}>
            <div>
              {ev.cover_image && (
                <div style={{borderRadius:10,overflow:'hidden',marginBottom:14,height:200}}>
                  <img src={ev.cover_image} alt={ev.title} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                </div>
              )}
              <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,overflow:'hidden',marginBottom:14}}>
                <div style={{padding:'14px 18px',borderBottom:`1px solid ${C.border}`,fontWeight:700,color:C.navy,fontSize:13}}>معلومات الفعالية</div>
                <div style={{padding:'16px 18px',display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
                  {[
                    {label:'التاريخ والوقت',icon:'📅',value:ev.start_date?new Date(ev.start_date).toLocaleString('ar-SA',{weekday:'long',month:'long',day:'numeric',hour:'2-digit',minute:'2-digit'}):'—'},
                    {label:'الموقع',icon:'📍',value:ev.location||ev.location_type==='online'?'عبر الإنترنت':ev.location_type==='tba'?'سيُحدد':'—'},
                    {label:'التصنيف',icon:'🏷',value:ev.category||'—'},
                    {label:'الطاقة',icon:'👥',value:ev.capacity?ev.capacity.toLocaleString('ar-SA'):'غير محدودة'},
                    {label:'الحالة',icon:'📌',value:st.label},
                    {label:'الرؤية',icon:'🌐',value:ev.is_public?'عامة':'خاصة'},
                  ].map(f=>(
                    <div key={f.label}>
                      <p style={{fontSize:11,color:C.muted,margin:0}}>{f.icon} {f.label}</p>
                      <p style={{fontSize:13,fontWeight:600,color:C.text,margin:'3px 0 0'}}>{f.value}</p>
                    </div>
                  ))}
                </div>
                {ev.description && (
                  <div style={{padding:'0 18px 16px',borderTop:`1px solid ${C.border}`,paddingTop:14}}>
                    <p style={{fontSize:11,color:C.muted,margin:'0 0 6px'}}>الوصف</p>
                    <p style={{fontSize:13,color:C.text,lineHeight:1.6,margin:0}}>{ev.description}</p>
                  </div>
                )}
              </div>

              {/* Recent registrations preview */}
              {regs.length > 0 && (
                <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,overflow:'hidden'}}>
                  <div style={{padding:'12px 16px',borderBottom:`1px solid ${C.border}`,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <span style={{fontWeight:700,color:C.navy,fontSize:13}}>آخر التسجيلات</span>
                    <button onClick={()=>setTab('attendees')} style={{fontSize:11,color:C.orange,background:'none',border:'none',cursor:'pointer',fontFamily:'inherit',fontWeight:700}}>عرض الكل</button>
                  </div>
                  {regs.slice(0,5).map((r,i)=>(
                    <div key={r.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 16px',borderBottom:i<4?`1px solid ${C.border}`:'none'}}>
                      <div>
                        <p style={{fontSize:13,fontWeight:700,color:C.navy,margin:0}}>{r.guest_name}</p>
                        <p style={{fontSize:11,color:C.muted,margin:0}}>{r.guest_email||'—'}</p>
                      </div>
                      <div style={{display:'flex',gap:8,alignItems:'center'}}>
                        <span style={{fontSize:11,fontWeight:700,padding:'2px 8px',borderRadius:10,
                          color:r.status==='attended'?C.green:C.muted,
                          background:r.status==='attended'?'#EAF7E0':'#F8F7FA'
                        }}>{r.status==='attended'?'حضر':'مسجل'}</span>
                        {r.status!=='attended' && (
                          <button onClick={()=>checkIn(r.id)} style={{padding:'5px 10px',background:C.orange,color:'#fff',border:'none',borderRadius:5,fontSize:11,cursor:'pointer',fontFamily:'inherit',fontWeight:700}}>
                            ✓ حضر
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right panel */}
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              {/* QR Scanner shortcut */}
              <Link href={`/scanner?event=${id}`} style={{textDecoration:'none'}}>
                <div style={{background:C.navy,borderRadius:10,padding:18,textAlign:'center',cursor:'pointer'}}>
                  <div style={{fontSize:32,marginBottom:8}}>📷</div>
                  <p style={{color:'#fff',fontWeight:800,fontSize:14,margin:0}}>فتح ماسح QR</p>
                  <p style={{color:'rgba(255,255,255,0.6)',fontSize:11,margin:'4px 0 0'}}>تسجيل حضور مباشر لهذه الفعالية</p>
                </div>
              </Link>

              {/* Registration link */}
              <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:16}}>
                <p style={{fontSize:12,fontWeight:700,color:C.navy,margin:'0 0 8px'}}>🔗 رابط التسجيل</p>
                <div style={{background:'#F8F7FA',borderRadius:6,padding:'8px 10px',fontSize:11,color:C.text,wordBreak:'break-all',marginBottom:8}}>
                  {`/r/${id}`}
                </div>
                <button onClick={()=>navigator.clipboard?.writeText(regLink)} style={{width:'100%',padding:'8px',background:C.orange,color:'#fff',border:'none',borderRadius:6,fontWeight:700,fontSize:12,cursor:'pointer',fontFamily:'inherit'}}>
                  نسخ الرابط
                </button>
              </div>

              {/* Public page link */}
              <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:16}}>
                <p style={{fontSize:12,fontWeight:700,color:C.navy,margin:'0 0 8px'}}>👁 الصفحة العامة</p>
                <Link href={`/e/${id}`} target="_blank" style={{display:'block',textAlign:'center',padding:'8px',background:'#EDE9F7',color:'#7B4FBF',borderRadius:6,textDecoration:'none',fontWeight:700,fontSize:12}}>
                  عرض كما يراها الزوار ↗
                </Link>
              </div>

              {/* QR of reg link */}
              <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:16,textAlign:'center'}}>
                <p style={{fontSize:12,fontWeight:700,color:C.navy,margin:'0 0 10px'}}>QR رابط التسجيل</p>
                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(regLink)}&color=1E0A3C`} alt="QR" style={{borderRadius:6}}/>
                <p style={{fontSize:10,color:C.muted,margin:'8px 0 0'}}>امسح للتسجيل في الفعالية</p>
              </div>
            </div>
          </div>
        )}

        {/* ═══ ATTENDEES TAB (includes scanner) ═══ */}
        {tab==='attendees' && (
          <div style={{display:'grid',gridTemplateColumns:'1fr 320px',gap:16,alignItems:'start'}}>
            {/* Attendees list */}
            <div>
              <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,overflow:'hidden'}}>
                <div style={{padding:'12px 16px',borderBottom:`1px solid ${C.border}`}}>
                  <div style={{display:'flex',gap:8,marginBottom:10}}>
                    <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="بحث بالاسم أو البريد..."
                      style={{flex:1,padding:'8px 12px',border:`1px solid ${C.border}`,borderRadius:6,fontSize:13,outline:'none',fontFamily:'inherit',color:C.text,background:C.bg}}/>
                    <select value={filter} onChange={e=>setFilter(e.target.value)}
                      style={{padding:'8px 10px',border:`1px solid ${C.border}`,borderRadius:6,fontSize:12,color:C.text,background:C.bg,outline:'none',fontFamily:'inherit'}}>
                      <option value="all">الكل ({total})</option>
                      <option value="attended">حضروا ({attended})</option>
                      <option value="registered">لم يحضروا ({notAttended})</option>
                    </select>
                    <button onClick={exportCSV} style={{padding:'8px 12px',border:`1px solid ${C.border}`,borderRadius:6,background:C.card,color:C.text,fontSize:12,cursor:'pointer',fontFamily:'inherit',fontWeight:600,whiteSpace:'nowrap'}}>
                      ⬇ CSV
                    </button>
                  </div>
                  <p style={{fontSize:11,color:C.muted,margin:0}}>{filteredRegs.length} نتيجة</p>
                </div>

                {filteredRegs.length===0 ? (
                  <div style={{padding:40,textAlign:'center',color:C.muted,fontSize:13}}>لا توجد نتائج</div>
                ) : (
                  <div style={{maxHeight:520,overflowY:'auto'}}>
                    {filteredRegs.map((r,i)=>(
                      <div key={r.id} style={{display:'grid',gridTemplateColumns:'1fr auto',padding:'11px 16px',borderBottom:i<filteredRegs.length-1?`1px solid ${C.border}`:'none',alignItems:'center',gap:10}}>
                        <div>
                          <div style={{display:'flex',alignItems:'center',gap:8}}>
                            <p style={{fontSize:13,fontWeight:700,color:C.navy,margin:0}}>{r.guest_name}</p>
                            {r.ticket_reference && <span style={{fontSize:10,color:C.muted,fontFamily:'monospace'}}>#{r.ticket_reference}</span>}
                          </div>
                          <p style={{fontSize:11,color:C.muted,margin:'2px 0 0'}}>{r.guest_email||'—'} {r.ticket_type?`· ${r.ticket_type}`:''}</p>
                          {r.checked_in_at && <p style={{fontSize:10,color:C.green,margin:'2px 0 0'}}>✅ {new Date(r.checked_in_at).toLocaleTimeString('ar-SA')}</p>}
                        </div>
                        <div style={{display:'flex',gap:6,alignItems:'center'}}>
                          <Link href={`/ticket/${r.id}`} target="_blank" style={{padding:'5px 8px',background:'#EDE9F7',color:'#7B4FBF',borderRadius:5,textDecoration:'none',fontSize:10,fontWeight:700}}>
                            🎟 تذكرة
                          </Link>
                          {r.status!=='attended' ? (
                            <button onClick={()=>checkIn(r.id)} style={{padding:'5px 10px',background:C.orange,color:'#fff',border:'none',borderRadius:5,fontSize:11,cursor:'pointer',fontFamily:'inherit',fontWeight:700}}>
                              ✓ حضر
                            </button>
                          ) : (
                            <span style={{fontSize:11,fontWeight:700,color:C.green,background:'#EAF7E0',padding:'4px 9px',borderRadius:5}}>✅ حضر</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Inline scanner */}
            <div style={{position:'sticky',top:80}}>
              <div style={{background:C.card,border:`2px solid ${cameraOn?C.orange:C.border}`,borderRadius:10,overflow:'hidden'}}>
                <div style={{padding:'12px 14px',borderBottom:`1px solid ${C.border}`,display:'flex',justifyContent:'space-between',alignItems:'center',background:C.navy}}>
                  <span style={{fontWeight:700,color:'#fff',fontSize:13}}>📷 مسح الحضور</span>
                  {cameraOn && <span style={{fontSize:10,background:'#EAF7E0',color:C.green,padding:'2px 7px',borderRadius:8,fontWeight:700}}>● نشط</span>}
                </div>

                {/* Camera area */}
                <div style={{position:'relative',background:'#000',minHeight:cameraOn?180:0}}>
                  <video ref={videoRef} playsInline muted style={{width:'100%',display:cameraOn?'block':'none'}}/>
                  <canvas ref={canvasRef} style={{display:'none'}}/>
                  {cameraOn && (
                    <div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',width:130,height:130,border:'2px solid rgba(240,85,55,0.9)',borderRadius:8,boxShadow:'0 0 0 1000px rgba(0,0,0,0.4)',pointerEvents:'none'}}/>
                  )}
                </div>

                {cameraErr && <div style={{padding:8,background:'#FEF2F2'}}><p style={{margin:0,color:'#B91C1C',fontSize:11}}>⚠️ {cameraErr}</p></div>}

                <div style={{padding:14}}>
                  <button onClick={cameraOn?stopCamera:startCamera} style={{
                    width:'100%',padding:'9px',borderRadius:7,border:'none',cursor:'pointer',
                    background:cameraOn?'#FEF2F2':C.orange,
                    color:cameraOn?'#DC2626':'#fff',fontWeight:700,fontSize:12,fontFamily:'inherit',marginBottom:10
                  }}>{cameraOn?'⏹ إيقاف الكاميرا':'▶ تشغيل الكاميرا'}</button>

                  <div style={{display:'flex',gap:6}}>
                    <input ref={inputRef} value={qrInput} onChange={e=>setQrInput(e.target.value)}
                      onKeyDown={e=>{ if(e.key==='Enter') handleScan(qrInput.trim()) }}
                      placeholder="رمز QR أو USB..."
                      style={{flex:1,padding:'8px 10px',border:`1px solid ${C.border}`,borderRadius:6,fontSize:12,outline:'none',fontFamily:'inherit',color:C.text,background:C.bg}}
                      onFocus={e=>(e.target.style.borderColor=C.orange)}
                      onBlur={e=>(e.target.style.borderColor=C.border)}
                    />
                    <button onClick={()=>handleScan(qrInput.trim())} disabled={scanLoading||!qrInput.trim()} style={{
                      padding:'8px 12px',background:C.orange,color:'#fff',border:'none',
                      borderRadius:6,fontSize:12,cursor:'pointer',fontFamily:'inherit',fontWeight:700,
                      opacity:scanLoading||!qrInput.trim()?0.5:1
                    }}>✓</button>
                  </div>

                  {scanResult && (() => {
                    const s=SCAN_STYLES[scanResult.type]
                    return (
                      <div style={{marginTop:10,background:s.bg,border:`1px solid ${s.border}`,borderRadius:7,padding:'10px 12px'}}>
                        <div style={{display:'flex',alignItems:'center',gap:7}}>
                          <span style={{fontSize:18}}>{s.icon}</span>
                          <div>
                            <p style={{fontSize:13,fontWeight:700,color:s.color,margin:0}}>{scanResult.message}</p>
                            {scanResult.name && <p style={{fontSize:11,color:s.color,margin:'2px 0 0'}}>{scanResult.name}{scanResult.ref?` · #${scanResult.ref}`:''}</p>}
                          </div>
                        </div>
                      </div>
                    )
                  })()}

                  {scanHistory.length>0 && (
                    <div style={{marginTop:10}}>
                      <p style={{fontSize:11,color:C.muted,margin:'0 0 6px',fontWeight:700}}>آخر المسح</p>
                      {scanHistory.slice(0,5).map((h,i)=>(
                        <div key={i} style={{display:'flex',justifyContent:'space-between',fontSize:11,padding:'4px 0',borderBottom:i<4?`1px solid ${C.border}`:'none'}}>
                          <span style={{color:C.navy,fontWeight:600}}>{h.name}</span>
                          <span style={{color:C.muted}}>{h.time}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Link to full scanner */}
              <Link href={`/scanner?event=${id}`} style={{display:'block',textAlign:'center',padding:'10px',background:'#F0EDF7',color:'#7B4FBF',borderRadius:8,textDecoration:'none',fontWeight:700,fontSize:12,marginTop:10}}>
                فتح الماسح في شاشة كاملة ↗
              </Link>
            </div>
          </div>
        )}

        {/* ═══ TICKETS TAB ═══ */}
        {tab==='tickets' && (
          <div>
            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:20,marginBottom:16}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
                <h2 style={{fontSize:14,fontWeight:700,color:C.navy,margin:0}}>🎟 التذاكر المسجلة</h2>
                <span style={{fontSize:12,color:C.muted}}>{total} تذكرة</span>
              </div>

              {/* Ticket type breakdown */}
              {(() => {
                const byType: Record<string,number> = {}
                regs.forEach(r=>{ byType[r.ticket_type||'عادية']=(byType[r.ticket_type||'عادية']||0)+1 })
                return Object.entries(byType).map(([type,count])=>(
                  <div key={type} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 16px',border:`1px solid ${C.border}`,borderRadius:8,marginBottom:8}}>
                    <div>
                      <p style={{fontSize:14,fontWeight:700,color:C.navy,margin:0}}>{type}</p>
                      <p style={{fontSize:12,color:C.muted,margin:0}}>نوع التذكرة</p>
                    </div>
                    <div style={{textAlign:'left'}}>
                      <p style={{fontSize:20,fontWeight:800,color:C.orange,margin:0}}>{count}</p>
                      <p style={{fontSize:11,color:C.muted,margin:0}}>تذكرة</p>
                    </div>
                  </div>
                ))
              })()}
            </div>

            {/* All tickets list */}
            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,overflow:'hidden'}}>
              <div style={{padding:'12px 16px',borderBottom:`1px solid ${C.border}`,fontWeight:700,color:C.navy,fontSize:13}}>جميع التذاكر</div>
              {regs.map((r,i)=>(
                <div key={r.id} style={{display:'grid',gridTemplateColumns:'auto 1fr auto',padding:'10px 16px',borderBottom:i<regs.length-1?`1px solid ${C.border}`:'none',gap:12,alignItems:'center'}}>
                  <div style={{width:36,height:36,borderRadius:6,background:'#EDE9F7',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                    <span style={{fontSize:12,fontWeight:800,color:'#7B4FBF',fontFamily:'monospace'}}>{r.ticket_reference?.slice(0,3)||'??'}</span>
                  </div>
                  <div>
                    <p style={{fontSize:13,fontWeight:700,color:C.navy,margin:0}}>{r.guest_name}</p>
                    <p style={{fontSize:11,color:C.muted,margin:0}}>{r.ticket_type||'عادية'} · {r.ticket_reference?`#${r.ticket_reference}`:''}</p>
                  </div>
                  <Link href={`/ticket/${r.id}`} target="_blank" style={{padding:'6px 12px',background:'#EDE9F7',color:'#7B4FBF',borderRadius:6,textDecoration:'none',fontSize:11,fontWeight:700}}>
                    عرض التذكرة
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ ANALYTICS TAB ═══ */}
        {tab==='analytics' && (
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
            {/* Summary cards */}
            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:20,gridColumn:'1/-1'}}>
              <h2 style={{fontSize:14,fontWeight:700,color:C.navy,margin:'0 0 14px'}}>ملخص الفعالية</h2>
              <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>
                {[
                  {label:'إجمالي المسجلين', value:total,      icon:'🎟',color:C.navy},
                  {label:'حضروا',           value:attended,    icon:'✅',color:C.green},
                  {label:'لم يحضروا',       value:notAttended, icon:'⏳',color:'#7B4FBF'},
                  {label:'نسبة الحضور',     value:total>0?`${Math.round((attended/total)*100)}%`:'—', icon:'📈',color:C.orange},
                ].map(s=>(
                  <div key={s.label} style={{background:'#F8F7FA',borderRadius:8,padding:'14px 16px',textAlign:'center'}}>
                    <p style={{fontSize:24,margin:0}}>{s.icon}</p>
                    <p style={{fontSize:26,fontWeight:800,color:s.color,margin:'4px 0 2px'}}>{s.value}</p>
                    <p style={{fontSize:11,color:C.muted,margin:0}}>{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Status breakdown */}
            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:20}}>
              <h2 style={{fontSize:14,fontWeight:700,color:C.navy,margin:'0 0 14px'}}>توزيع الحالات</h2>
              {[
                {label:'حضروا',    value:attended,   color:C.green,   bg:'#EAF7E0'},
                {label:'مسجلون',   value:notAttended,color:'#7B4FBF', bg:'#EDE9F7'},
                {label:'ملغيون',   value:regs.filter(r=>r.status==='cancelled').length, color:'#DC2626', bg:'#FEF2F2'},
              ].map(s=>(
                <div key={s.label} style={{marginBottom:12}}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                    <span style={{fontSize:12,color:C.text,fontWeight:600}}>{s.label}</span>
                    <span style={{fontSize:12,fontWeight:700,color:s.color}}>{s.value}</span>
                  </div>
                  <div style={{height:6,background:'#F0EDF7',borderRadius:3,overflow:'hidden'}}>
                    <div style={{height:'100%',width:`${total>0?(s.value/total)*100:0}%`,background:s.color,borderRadius:3,transition:'width 0.5s'}}/>
                  </div>
                </div>
              ))}
            </div>

            {/* Capacity */}
            {ev.capacity && (
              <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:20}}>
                <h2 style={{fontSize:14,fontWeight:700,color:C.navy,margin:'0 0 14px'}}>الطاقة الاستيعابية</h2>
                <div style={{textAlign:'center'}}>
                  <svg width={140} height={140} viewBox="0 0 140 140">
                    <circle cx={70} cy={70} r={55} fill="none" stroke="#F0EDF7" strokeWidth={14}/>
                    <circle cx={70} cy={70} r={55} fill="none" stroke={C.orange} strokeWidth={14}
                      strokeDasharray={`${2*Math.PI*55}`}
                      strokeDashoffset={`${2*Math.PI*55*(1-Math.min(fillRate,100)/100)}`}
                      strokeLinecap="round"
                      transform="rotate(-90 70 70)"/>
                    <text x={70} y={70} textAnchor="middle" dominantBaseline="middle" fontSize={24} fontWeight="bold" fill={C.navy}>{fillRate}%</text>
                    <text x={70} y={90} textAnchor="middle" fontSize={10} fill={C.muted}>ممتلئ</text>
                  </svg>
                  <p style={{fontSize:12,color:C.muted,margin:'8px 0 0'}}>{total} من {ev.capacity} مقعد</p>
                </div>
              </div>
            )}

            {/* Export */}
            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:20,gridColumn:ev.capacity?'auto':'1/-1'}}>
              <h2 style={{fontSize:14,fontWeight:700,color:C.navy,margin:'0 0 14px'}}>تصدير البيانات</h2>
              <button onClick={exportCSV} style={{width:'100%',padding:'12px',background:'#EAF7E0',color:C.green,border:`1px solid #86EFAC`,borderRadius:8,fontWeight:700,fontSize:13,cursor:'pointer',fontFamily:'inherit',marginBottom:8}}>
                ⬇ تصدير CSV — جميع الزوار
              </button>
              <p style={{fontSize:11,color:C.muted,margin:0}}>يتضمن: الاسم، البريد، الحالة، نوع التذكرة، رقم التذكرة، التاريخ</p>
            </div>
          </div>
        )}

        {/* ═══ SETTINGS TAB ═══ */}
        {tab==='settings' && (
          <div style={{maxWidth:560}}>
            {/* Status change */}
            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:20,marginBottom:16}}>
              <h2 style={{fontSize:14,fontWeight:700,color:C.navy,margin:'0 0 14px'}}>⚙️ حالة الفعالية</h2>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                {['draft','published','completed','cancelled'].map(s=>{
                  const info = STATUS_MAP[s]
                  return (
                    <button key={s} onClick={async()=>{
                      await sb.from('events').update({status:s}).eq('id',id)
                      setEv({...ev,status:s})
                    }} style={{
                      padding:'12px',border:`2px solid ${ev.status===s?info.color:C.border}`,
                      borderRadius:8,background:ev.status===s?info.bg:C.card,
                      color:ev.status===s?info.color:C.text,fontWeight:700,fontSize:13,
                      cursor:'pointer',fontFamily:'inherit'
                    }}>{info.label}</button>
                  )
                })}
              </div>
            </div>

            {/* Event info */}
            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:20,marginBottom:16}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:12}}>
                <h2 style={{fontSize:14,fontWeight:700,color:C.navy,margin:0}}>معلومات الفعالية</h2>
                <Link href={`/events/${id}/edit`} style={{fontSize:12,color:C.orange,textDecoration:'none',fontWeight:700}}>✏️ تعديل</Link>
              </div>
              <p style={{fontSize:13,color:C.text,margin:0}}>{ev.title}</p>
              <p style={{fontSize:12,color:C.muted,margin:'4px 0 0'}}>{ev.start_date?new Date(ev.start_date).toLocaleDateString('ar-SA'):''}</p>
            </div>

            {/* Danger zone */}
            <div style={{background:'#FEF2F2',border:'1px solid #FCA5A5',borderRadius:10,padding:20}}>
              <h2 style={{fontSize:14,fontWeight:700,color:'#991B1B',margin:'0 0 12px'}}>⚠️ منطقة الخطر</h2>
              <button onClick={async()=>{
                if(confirm('هل أنت متأكد من إلغاء هذه الفعالية؟')){
                  await sb.from('events').update({status:'cancelled'}).eq('id',id)
                  setEv({...ev,status:'cancelled'})
                }
              }} style={{padding:'10px 20px',background:'#FEF2F2',border:'1px solid #DC2626',borderRadius:7,color:'#DC2626',fontWeight:700,fontSize:13,cursor:'pointer',fontFamily:'inherit'}}>
                إلغاء الفعالية
              </button>
            </div>
          </div>
        )}
      </div>
      <div className="h-20 md:h-0"/>
    </div>
  )
}
