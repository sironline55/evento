'use client'
import { useEffect, useState, useRef, useCallback } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

const sb = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
const C = { navy:'#1E0A3C',orange:'#F05537',text:'#39364F',muted:'#6F7287',border:'#DBDAE3',bg:'#FAFAFA',card:'#FFFFFF',green:'#3A7D0A' }
const ST: Record<string,{label:string;color:string;bg:string}> = {
  registered: {label:'مسجّل',   color:'#7B4FBF', bg:'#EDE9F7'},
  attended:   {label:'حضر',     color:C.green,   bg:'#EAF7E0'},
  cancelled:  {label:'ملغي',    color:'#DC2626', bg:'#FEF2F2'},
  waitlisted: {label:'انتظار', color:'#B07000', bg:'#FFF8E8'},
}
const fs = { width:'100%',padding:'10px 14px',border:`1px solid ${C.border}`,borderRadius:6,fontSize:13,outline:'none',fontFamily:'inherit',color:C.text,background:C.bg,boxSizing:'border-box' as const }

const TABS = ['نظرة عامة','الحضور + الماسح','التذاكر والخصومات','قائمة الانتظار','التقارير','الإعدادات']

export default function EventDetailPage() {
  const { id }   = useParams()
  const router   = useRouter()
  const [ev, setEv]         = useState<any>(null)
  const [tab, setTab]       = useState(0)
  const [regs, setRegs]     = useState<any[]>([])
  const [waitlist, setWaitlist] = useState<any[]>([])
  const [codes, setCodes]   = useState<any[]>([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [stats, setStats]   = useState({ total:0, attended:0, waitlisted:0, capacity:0 })
  // Scanner state
  const [qrInput, setQrInput]   = useState('')
  const [scanRes, setScanRes]   = useState<any>(null)
  const [scanning, setScanning] = useState(false)
  const [cameraOn, setCameraOn] = useState(false)
  const [cameraErr, setCameraErr] = useState('')
  const [scanHistory, setScanHistory] = useState<any[]>([])
  const videoRef  = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream|null>(null)
  const scanningRef = useRef(false)
  const qrRef = useRef<HTMLInputElement>(null)
  // Discount code form
  const [newCode, setNewCode] = useState({ code:'', discount_type:'percentage', discount_value:'', max_uses:'', expires_at:'' })
  const [savingCode, setSavingCode] = useState(false)
  // settings
  const [newStatus, setNewStatus] = useState('')
  const [saving, setSaving] = useState(false)
  // Form fields editor
  const [formFields, setFormFields] = useState<any[]>([])
  const [waitlistEnabled, setWaitlistEnabled] = useState(false)

  // ── Load event ──
  useEffect(()=>{
    if(!id) return
    Promise.all([
      sb.from('events').select('*').eq('id',id).single(),
      sb.from('registrations').select('*').eq('event_id',id).order('created_at',{ascending:false}),
      sb.from('discount_codes').select('*').eq('event_id',id).order('created_at',{ascending:false}),
    ]).then(([{data:ev},{data:regs},{data:codes}])=>{
      if(ev){
        setEv(ev); setNewStatus(ev.status)
        setFormFields(ev.form_fields||[])
        setWaitlistEnabled(ev.waitlist_enabled||false)
      }
      const all = regs||[]
      setRegs(all.filter((r:any)=>r.status!=='waitlisted'))
      setWaitlist(all.filter((r:any)=>r.status==='waitlisted'))
      setCodes(codes||[])
      const att = all.filter((r:any)=>r.status==='attended').length
      const wait= all.filter((r:any)=>r.status==='waitlisted').length
      const tot = all.filter((r:any)=>r.status!=='waitlisted').length
      setStats({total:tot,attended:att,waitlisted:wait,capacity:ev?.capacity||0})
      setLoading(false)
    })
  },[id])

  // ── Realtime ──
  useEffect(()=>{
    if(!id) return
    const ch = sb.channel('ev-detail-'+id)
      .on('postgres_changes',{event:'*',schema:'public',table:'registrations',filter:`event_id=eq.${id}`},(payload:any)=>{
        if(payload.eventType==='INSERT'){
          const r = payload.new
          if(r.status==='waitlisted') setWaitlist(w=>[r,...w])
          else setRegs(rs=>[r,...rs])
          setStats(s=>({...s, total:r.status!=='waitlisted'?s.total+1:s.total, waitlisted:r.status==='waitlisted'?s.waitlisted+1:s.waitlisted}))
        }
        if(payload.eventType==='UPDATE'){
          const r = payload.new
          setRegs(rs=>rs.map(x=>x.id===r.id?r:x))
          setWaitlist(w=>w.filter(x=>x.id!==r.id))
          if(r.status==='attended') setStats(s=>({...s,attended:s.attended+1}))
        }
      }).subscribe()
    return ()=>{ sb.removeChannel(ch) }
  },[id])

  // ── Check-in ──
  async function checkIn(regId:string) {
    await sb.from('registrations').update({status:'attended',checked_in_at:new Date().toISOString()}).eq('id',regId)
  }

  // ── Promote from waitlist ──
  async function promoteWaitlist(regId:string) {
    await sb.from('registrations').update({status:'registered'}).eq('id',regId)
    setWaitlist(w=>w.filter(x=>x.id!==regId))
  }

  // ── Scanner ──
  const processFrame = useCallback(async()=>{
    if(!scanningRef.current||!videoRef.current||!canvasRef.current) return
    const video=videoRef.current; const canvas=canvasRef.current
    if(video.readyState!==video.HAVE_ENOUGH_DATA){requestAnimationFrame(processFrame);return}
    canvas.width=video.videoWidth; canvas.height=video.videoHeight
    const ctx=canvas.getContext('2d'); if(!ctx)return
    ctx.drawImage(video,0,0)
    let code:string|null=null
    if('BarcodeDetector' in window){
      try{const bd=new (window as any).BarcodeDetector({formats:['qr_code']});const b=await bd.detect(canvas);if(b.length>0)code=b[0].rawValue}catch{}
    }
    if(code){scanningRef.current=false;await handleScan(code);setTimeout(()=>{scanningRef.current=true;requestAnimationFrame(processFrame)},2500)}
    else{requestAnimationFrame(processFrame)}
  },[id])

  async function startCamera(){
    setCameraErr('')
    try{
      const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'}})
      streamRef.current=stream
      if(videoRef.current){videoRef.current.srcObject=stream;await videoRef.current.play()}
      setCameraOn(true); scanningRef.current=true; requestAnimationFrame(processFrame)
    }catch(e:any){ setCameraErr(e.name==='NotAllowedError'?'يرجى السماح بالوصول للكاميرا':'تعذّر الوصول للكاميرا') }
  }
  function stopCamera(){ scanningRef.current=false; streamRef.current?.getTracks().forEach(t=>t.stop()); streamRef.current=null; if(videoRef.current)videoRef.current.srcObject=null; setCameraOn(false) }
  useEffect(()=>()=>{stopCamera()},[])

  async function handleScan(code:string){
    if(!code.trim()||scanning) return
    setScanning(true); setScanRes(null)
    try{
      const {data:reg}=await sb.from('registrations').select('id,guest_name,status,ticket_type,events(title)').eq('qr_code',code.trim()).eq('event_id',id).single()
      if(!reg){setScanRes({type:'error',msg:'رمز غير صالح'})}
      else if(reg.status==='attended'){setScanRes({type:'warning',msg:'تم المسح مسبقاً',name:reg.guest_name,ticket:reg.ticket_type})}
      else{
        await sb.from('registrations').update({status:'attended',checked_in_at:new Date().toISOString()}).eq('id',reg.id)
        setScanRes({type:'success',msg:'تم تسجيل الحضور ✓',name:reg.guest_name,ticket:reg.ticket_type})
        setScanHistory(h=>[{name:reg.guest_name,ticket:reg.ticket_type,time:new Date().toLocaleTimeString('ar-SA')},...h.slice(0,19)])
      }
    }catch{setScanRes({type:'error',msg:'خطأ في الاتصال'})}
    finally{setScanning(false);setQrInput('');setTimeout(()=>qrRef.current?.focus(),100)}
  }

  // ── Discount code ──
  async function saveCode(){
    if(!newCode.code||!newCode.discount_value) return
    setSavingCode(true)
    const {data}=await sb.from('discount_codes').insert({
      event_id:id, code:newCode.code.toUpperCase(),
      discount_type:newCode.discount_type,
      discount_value:Number(newCode.discount_value),
      max_uses:newCode.max_uses?Number(newCode.max_uses):null,
      expires_at:newCode.expires_at||null,
    }).select().single()
    if(data) setCodes(c=>[data,...c])
    setNewCode({code:'',discount_type:'percentage',discount_value:'',max_uses:'',expires_at:''})
    setSavingCode(false)
  }
  async function deleteCode(cid:string){
    await sb.from('discount_codes').delete().eq('id',cid)
    setCodes(c=>c.filter(x=>x.id!==cid))
  }
  async function toggleCode(cid:string,active:boolean){
    await sb.from('discount_codes').update({is_active:!active}).eq('id',cid)
    setCodes(c=>c.map(x=>x.id===cid?{...x,is_active:!active}:x))
  }

  // ── Settings save ──
  async function saveSettings(){
    setSaving(true)
    await sb.from('events').update({status:newStatus,waitlist_enabled:waitlistEnabled,form_fields:formFields,updated_at:new Date().toISOString()}).eq('id',id)
    setSaving(false)
    setEv((e:any)=>({...e,status:newStatus,waitlist_enabled:waitlistEnabled,form_fields:formFields}))
  }

  // ── Export CSV ──
  function exportCSV(){
    const rows=[['الاسم','البريد','الجوال','الحالة','نوع التذكرة','تاريخ التسجيل','وقت الحضور']]
    regs.forEach(r=>rows.push([r.guest_name,r.email||'',r.phone||'',r.status,r.ticket_type||'',new Date(r.created_at).toLocaleDateString('ar-SA'),r.checked_in_at?new Date(r.checked_in_at).toLocaleTimeString('ar-SA'):'—']))
    const csv=rows.map(r=>r.join(',')).join('\n')
    const a=document.createElement('a')
    a.href='data:text/csv;charset=utf-8,\uFEFF'+encodeURIComponent(csv)
    a.download=`${ev?.title||'event'}-attendees.csv`
    a.click()
  }

  function printList(){
    const w=window.open('','_blank')!
    const rows=regs.map(r=>`<tr><td>${r.guest_name}</td><td>${r.ticket_type||'عام'}</td><td>${r.status==='attended'?'✓':''}</td><td></td></tr>`).join('')
    w.document.write(`<html dir="rtl"><head><title>${ev?.title}</title><style>table{width:100%;border-collapse:collapse}th,td{border:1px solid #ccc;padding:8px;font-size:13px}th{background:#1E0A3C;color:#fff}@media print{button{display:none}}</style></head><body><h2>${ev?.title||''}</h2><p>${new Date().toLocaleDateString('ar-SA')}</p><table><tr><th>الاسم</th><th>التذكرة</th><th>الحضور</th><th>توقيع</th></tr>${rows}</table><br><button onclick="window.print()">طباعة</button></body></html>`)
    w.document.close()
  }

  // ── Filtered regs ──
  const filtered = regs.filter(r=>{
    const q=search.toLowerCase()
    const matchQ=!q||(r.guest_name||'').toLowerCase().includes(q)||(r.email||'').toLowerCase().includes(q)
    const matchF=filter==='all'||r.status===filter
    return matchQ&&matchF
  })

  const fillPct = stats.capacity>0?Math.round(stats.total/stats.capacity*100):0

  if(loading) return <div style={{padding:40,textAlign:'center',color:C.muted}}>جاري التحميل...</div>
  if(!ev) return <div style={{padding:40,textAlign:'center',color:C.muted}}>الفعالية غير موجودة</div>

  const evST = ({draft:{l:'مسودة',c:'#6F7287',b:'#F8F7FA'},published:{l:'نشط',c:C.green,b:'#EAF7E0'},completed:{l:'مكتمل',c:'#6F7287',b:'#F8F7FA'},cancelled:{l:'ملغي',c:'#DC2626',b:'#FEF2F2'}} as any)[ev.status]||{l:ev.status,c:C.muted,b:'#F8F7FA'}

  return (
    <div style={{minHeight:'100vh',background:C.bg,direction:'rtl'}}>
      {/* ── Header ── */}
      <div style={{background:C.card,borderBottom:`1px solid ${C.border}`,padding:'16px 24px'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:12}}>
          <div>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
              <Link href="/events" style={{fontSize:12,color:C.muted,textDecoration:'none'}}>الفعاليات</Link>
              <span style={{color:C.border}}>/</span>
              <span style={{fontSize:12,color:C.text,fontWeight:600}}>{ev.title}</span>
            </div>
            <h1 style={{fontSize:22,fontWeight:800,color:C.navy,margin:0}}>{ev.title}</h1>
            <div style={{display:'flex',gap:8,marginTop:6,flexWrap:'wrap',alignItems:'center'}}>
              <span style={{padding:'3px 10px',borderRadius:20,fontSize:11,fontWeight:700,color:evST.c,background:evST.b}}>{evST.l}</span>
              <span style={{fontSize:12,color:C.muted}}>📅 {ev.start_date?new Date(ev.start_date).toLocaleDateString('ar-SA',{year:'numeric',month:'short',day:'numeric'}):'—'}</span>
              {ev.location&&<span style={{fontSize:12,color:C.muted}}>📍 {ev.location}</span>}
            </div>
          </div>
          <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
            <Link href={`/e/${id}`} target="_blank" style={{padding:'8px 14px',border:`1px solid ${C.border}`,borderRadius:6,background:C.card,color:C.text,textDecoration:'none',fontWeight:600,fontSize:12}}>🌐 الصفحة العامة</Link>
            <button onClick={()=>navigator.clipboard.writeText(`${window.location.origin}/r/${id}`)} style={{padding:'8px 14px',border:`1px solid ${C.border}`,borderRadius:6,background:C.card,color:C.text,fontWeight:600,fontSize:12,cursor:'pointer',fontFamily:'inherit'}}>🔗 نسخ الرابط</button>
            <Link href={`/events/${id}/edit`} style={{padding:'8px 14px',background:C.orange,borderRadius:6,color:'#fff',textDecoration:'none',fontWeight:700,fontSize:12}}>✏️ تعديل</Link>
          </div>
        </div>

        {/* Stats bar */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:10,marginTop:16}}>
          {[
            {l:'المسجلون',v:stats.total,c:C.navy,b:'#F0EDF7'},
            {l:'حضروا',v:stats.attended,c:C.green,b:'#EAF7E0'},
            {l:'لم يحضروا',v:stats.total-stats.attended,c:C.muted,b:'#F8F7FA'},
            {l:'قائمة الانتظار',v:stats.waitlisted,c:'#B07000',b:'#FFF8E8'},
            {l:'نسبة الحضور',v:stats.total>0?Math.round(stats.attended/stats.total*100)+'%':'—',c:C.orange,b:'#FEF0ED'},
          ].map(s=>(
            <div key={s.l} style={{background:s.b,borderRadius:8,padding:'10px 14px'}}>
              <p style={{fontSize:20,fontWeight:800,color:s.c,margin:0}}>{s.v}</p>
              <p style={{fontSize:11,color:C.muted,margin:0}}>{s.l}</p>
            </div>
          ))}
        </div>
        {stats.capacity>0&&(
          <div style={{marginTop:10}}>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:C.muted,marginBottom:4}}>
              <span>الامتلاء: {fillPct}%</span>
              <span>{stats.total}/{stats.capacity}</span>
            </div>
            <div style={{background:'#F0EDF7',borderRadius:20,height:6,overflow:'hidden'}}>
              <div style={{width:`${Math.min(fillPct,100)}%`,height:'100%',background:fillPct>=90?C.orange:C.green,borderRadius:20}}/>
            </div>
          </div>
        )}
      </div>

      {/* ── Tabs ── */}
      <div style={{background:C.card,borderBottom:`1px solid ${C.border}`,overflowX:'auto'}}>
        <div style={{display:'flex',minWidth:'max-content'}}>
          {TABS.map((t,i)=>(
            <button key={i} onClick={()=>setTab(i)} style={{
              padding:'12px 18px',border:'none',background:'transparent',cursor:'pointer',
              fontWeight:tab===i?700:500,fontSize:13,fontFamily:'inherit',whiteSpace:'nowrap',
              color:tab===i?C.orange:C.muted,
              borderBottom:tab===i?`3px solid ${C.orange}`:'3px solid transparent',
              transition:'all 0.15s'
            }}>{t}</button>
          ))}
        </div>
      </div>

      <div style={{padding:'20px 20px',maxWidth:1100,margin:'0 auto'}}>

        {/* ══ TAB 0: نظرة عامة ══ */}
        {tab===0&&(
          <div style={{display:'grid',gridTemplateColumns:'1fr 280px',gap:16,alignItems:'start'}}>
            <div>
              {ev.cover_image&&<img src={ev.cover_image} alt="" style={{width:'100%',maxHeight:240,objectFit:'cover',borderRadius:10,marginBottom:16}}/>}
              <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:20,marginBottom:14}}>
                <h3 style={{fontSize:14,fontWeight:700,color:C.navy,margin:'0 0 14px'}}>تفاصيل الفعالية</h3>
                {[
                  ['التاريخ والوقت',ev.start_date?new Date(ev.start_date).toLocaleString('ar-SA'):'—'],
                  ['نهاية الفعالية',ev.end_date?new Date(ev.end_date).toLocaleString('ar-SA'):'—'],
                  ['الموقع',ev.location||ev.location_type||'—'],
                  ['التصنيف',ev.category||'—'],
                  ['الطاقة',ev.capacity?ev.capacity+' شخص':'غير محدودة'],
                  ['قائمة الانتظار',ev.waitlist_enabled?'مفعّلة':'غير مفعّلة'],
                ].map(([k,v])=>(
                  <div key={k} style={{display:'grid',gridTemplateColumns:'120px 1fr',gap:8,marginBottom:10,paddingBottom:10,borderBottom:`1px solid ${C.border}`}}>
                    <span style={{fontSize:12,color:C.muted,fontWeight:600}}>{k}</span>
                    <span style={{fontSize:13,color:C.text,fontWeight:600}}>{v}</span>
                  </div>
                ))}
              </div>
              {ev.description&&(
                <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:20}}>
                  <h3 style={{fontSize:14,fontWeight:700,color:C.navy,margin:'0 0 10px'}}>الوصف</h3>
                  <p style={{fontSize:13,color:C.text,lineHeight:1.7,margin:0,whiteSpace:'pre-line'}}>{ev.description}</p>
                </div>
              )}
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:16}}>
                <p style={{fontSize:12,color:C.muted,fontWeight:700,margin:'0 0 8px'}}>رابط التسجيل</p>
                <p style={{fontSize:11,color:C.text,margin:'0 0 8px',wordBreak:'break-all',fontFamily:'monospace',background:'#F8F7FA',padding:'6px 8px',borderRadius:4}}>
                  {typeof window!=='undefined'?`${window.location.origin}/r/${id}`:'...'}
                </p>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6}}>
                  <button onClick={()=>navigator.clipboard.writeText(`${window.location.origin}/r/${id}`)} style={{padding:'7px',border:`1px solid ${C.border}`,borderRadius:6,background:C.bg,fontSize:11,cursor:'pointer',fontFamily:'inherit',fontWeight:600,color:C.text}}>📋 نسخ</button>
                  <Link href={`/e/${id}`} target="_blank" style={{padding:'7px',border:`1px solid ${C.border}`,borderRadius:6,background:C.bg,fontSize:11,textDecoration:'none',fontWeight:600,color:C.text,textAlign:'center',display:'block'}}>🌐 عرض</Link>
                </div>
              </div>
              {/* Quick actions */}
              {[
                {label:'الحضور والماسح',icon:'📷',tab:1,bg:'#EAF7E0',color:C.green},
                {label:'أكواد الخصم',icon:'🏷',tab:2,bg:'#EDE9F7',color:'#7B4FBF'},
                {label:'قائمة الانتظار',icon:'⏳',tab:3,bg:'#FFF8E8',color:'#B07000'},
                {label:'التقارير',icon:'📊',tab:4,bg:'#FEF0ED',color:C.orange},
              ].map(q=>(
                <button key={q.tab} onClick={()=>setTab(q.tab)} style={{
                  display:'flex',alignItems:'center',gap:10,padding:'12px 14px',
                  background:q.bg,border:'none',borderRadius:8,cursor:'pointer',
                  textAlign:'right',fontFamily:'inherit',width:'100%'
                }}>
                  <span style={{fontSize:18}}>{q.icon}</span>
                  <span style={{fontSize:13,fontWeight:700,color:q.color}}>{q.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ══ TAB 1: الحضور + الماسح ══ */}
        {tab===1&&(
          <div>
            {/* Mini Scanner */}
            <div style={{background:C.card,border:`2px solid ${cameraOn?C.orange:C.border}`,borderRadius:10,overflow:'hidden',marginBottom:16}}>
              <div style={{padding:'12px 18px',borderBottom:`1px solid ${C.border}`,display:'flex',justifyContent:'space-between',alignItems:'center',background:'#F8F7FA'}}>
                <span style={{fontWeight:700,color:C.navy,fontSize:14}}>📷 ماسح الحضور — {ev.title}</span>
                <div style={{display:'flex',gap:8,alignItems:'center'}}>
                  {scanHistory.length>0&&<span style={{fontSize:11,background:'#EAF7E0',color:C.green,padding:'3px 8px',borderRadius:10,fontWeight:700}}>{scanHistory.length} مُسح</span>}
                  <button onClick={cameraOn?stopCamera:startCamera} style={{padding:'7px 16px',border:'none',borderRadius:6,cursor:'pointer',fontFamily:'inherit',fontWeight:700,fontSize:12,background:cameraOn?'#FEF2F2':C.orange,color:cameraOn?'#DC2626':'#fff'}}>
                    {cameraOn?'⏹ إيقاف':'▶ كاميرا'}
                  </button>
                </div>
              </div>
              {cameraErr&&<div style={{padding:'10px 18px',background:'#FEF2F2'}}><p style={{margin:0,color:'#B91C1C',fontSize:12}}>⚠️ {cameraErr}</p></div>}
              <div style={{display:'grid',gridTemplateColumns:cameraOn?'1fr 1fr':'1fr',gap:0}}>
                {cameraOn&&(
                  <div style={{background:'#000',position:'relative',minHeight:200}}>
                    <video ref={videoRef} playsInline muted style={{width:'100%',display:'block'}}/>
                    <canvas ref={canvasRef} style={{display:'none'}}/>
                    <div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',width:140,height:140,border:'3px solid rgba(240,85,55,0.9)',borderRadius:10,boxShadow:'0 0 0 1000px rgba(0,0,0,0.4)',pointerEvents:'none'}}/>
                  </div>
                )}
                <div style={{padding:16}}>
                  <div style={{display:'flex',gap:8,marginBottom:12}}>
                    <input ref={qrRef} value={qrInput} onChange={e=>setQrInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')handleScan(qrInput)}} placeholder="رمز QR أو ماسح USB..." style={{...fs,flex:1,padding:'9px 12px'}} autoFocus/>
                    <button onClick={()=>handleScan(qrInput)} disabled={scanning||!qrInput.trim()} style={{padding:'9px 16px',background:C.orange,border:'none',borderRadius:6,color:'#fff',fontWeight:700,cursor:'pointer',fontFamily:'inherit',opacity:scanning||!qrInput.trim()?0.5:1}}>تحقق</button>
                  </div>
                  {scanRes&&(()=>{
                    const sc=({success:{bg:'#EAF7E0',border:C.green,color:'#1A5A00',icon:'✅'},warning:{bg:'#FFF8E8',border:'#B07000',color:'#7A5000',icon:'⚠️'},error:{bg:'#FEF2F2',border:'#DC2626',color:'#B91C1C',icon:'❌'}} as any)[scanRes.type]
                    return(
                      <div style={{background:sc.bg,border:`2px solid ${sc.border}`,borderRadius:8,padding:'10px 14px'}}>
                        <p style={{fontSize:14,fontWeight:700,color:sc.color,margin:0}}>{sc.icon} {scanRes.msg}</p>
                        {scanRes.name&&<p style={{fontSize:12,color:sc.color,margin:'4px 0 0'}}>👤 {scanRes.name} {scanRes.ticket?`— ${scanRes.ticket}`:''}</p>}
                      </div>
                    )
                  })()}
                  {scanHistory.length>0&&(
                    <div style={{marginTop:10,maxHeight:140,overflowY:'auto'}}>
                      {scanHistory.slice(0,5).map((h,i)=>(
                        <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'5px 0',borderBottom:`1px solid ${C.border}`,fontSize:12}}>
                          <span style={{color:C.text,fontWeight:600}}>{h.name}</span>
                          <span style={{color:C.muted}}>{h.time}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Attendees table */}
            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,overflow:'hidden'}}>
              <div style={{padding:'12px 18px',borderBottom:`1px solid ${C.border}`,display:'flex',gap:10,alignItems:'center',flexWrap:'wrap'}}>
                <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="بحث بالاسم أو الإيميل..." style={{...fs,flex:1,minWidth:160,padding:'8px 12px'}}/>
                <select value={filter} onChange={e=>setFilter(e.target.value)} style={{...fs,width:'auto',padding:'8px 12px'}}>
                  <option value="all">الكل ({regs.length})</option>
                  <option value="registered">مسجّل</option>
                  <option value="attended">حضر</option>
                  <option value="cancelled">ملغي</option>
                </select>
                <button onClick={exportCSV} style={{padding:'8px 14px',border:`1px solid ${C.border}`,borderRadius:6,background:C.bg,color:C.text,fontWeight:600,fontSize:12,cursor:'pointer',fontFamily:'inherit'}}>📥 CSV</button>
                <button onClick={printList} style={{padding:'8px 14px',border:`1px solid ${C.border}`,borderRadius:6,background:C.bg,color:C.text,fontWeight:600,fontSize:12,cursor:'pointer',fontFamily:'inherit'}}>🖨️ طباعة</button>
              </div>
              <div style={{overflowX:'auto'}}>
                <table style={{width:'100%',borderCollapse:'collapse'}}>
                  <thead>
                    <tr style={{background:'#F8F7FA',borderBottom:`1px solid ${C.border}`}}>
                      {['الاسم','الإيميل','الجوال','التذكرة','الحالة','التسجيل','إجراء'].map(h=>(
                        <th key={h} style={{padding:'10px 14px',textAlign:'right',fontSize:11,fontWeight:700,color:C.muted,whiteSpace:'nowrap'}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length===0&&<tr><td colSpan={7} style={{padding:32,textAlign:'center',color:C.muted,fontSize:13}}>لا توجد نتائج</td></tr>}
                    {filtered.map(r=>{
                      const s=ST[r.status]||ST.registered
                      return(
                        <tr key={r.id} style={{borderBottom:`1px solid ${C.border}`,transition:'background 0.1s'}} onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background='#FAFAFA'} onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background='transparent'}>
                          <td style={{padding:'10px 14px',fontSize:13,fontWeight:700,color:C.navy,whiteSpace:'nowrap'}}>{r.guest_name}</td>
                          <td style={{padding:'10px 14px',fontSize:12,color:C.muted}}>{r.email||'—'}</td>
                          <td style={{padding:'10px 14px',fontSize:12,color:C.muted}}>{r.phone||'—'}</td>
                          <td style={{padding:'10px 14px',fontSize:12,color:C.muted}}>{r.ticket_type||'عام'}</td>
                          <td style={{padding:'10px 14px'}}><span style={{padding:'3px 8px',borderRadius:20,fontSize:11,fontWeight:700,color:s.color,background:s.bg}}>{s.label}</span></td>
                          <td style={{padding:'10px 14px',fontSize:11,color:C.muted,whiteSpace:'nowrap'}}>{new Date(r.created_at).toLocaleDateString('ar-SA')}</td>
                          <td style={{padding:'10px 14px'}}>
                            <div style={{display:'flex',gap:6',flexWrap:'nowrap'}}>
                              {r.status!=='attended'&&<button onClick={()=>checkIn(r.id)} style={{padding:'5px 10px',background:'#EAF7E0',border:'none',borderRadius:5,color:C.green,fontWeight:700,fontSize:11,cursor:'pointer',fontFamily:'inherit'}}>✓ حضر</button>}
                              <Link href={`/ticket/${r.id}`} target="_blank" style={{padding:'5px 10px',background:'#EDE9F7',borderRadius:5,color:'#7B4FBF',fontWeight:700,fontSize:11,textDecoration:'none'}}>🎟</Link>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ══ TAB 2: التذاكر والخصومات ══ */}
        {tab===2&&(
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,alignItems:'start'}}>
            {/* Ticket types */}
            <div>
              <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:20,marginBottom:14}}>
                <h3 style={{fontSize:14,fontWeight:700,color:C.navy,margin:'0 0 14px'}}>أنواع التذاكر</h3>
                {(ev.tickets||[]).length===0?(
                  <p style={{fontSize:13,color:C.muted}}>لم تُضف أنواع تذاكر بعد — <Link href={`/events/${id}/edit`} style={{color:C.orange}}>تعديل الفعالية</Link></p>
                ):(ev.tickets||[]).map((t:any,i:number)=>(
                  <div key={i} style={{border:`1px solid ${C.border}`,borderRadius:8,padding:'12px 14px',marginBottom:8}}>
                    <div style={{display:'flex',justifyContent:'space-between'}}>
                      <div>
                        <p style={{fontSize:14,fontWeight:700,color:C.navy,margin:0}}>{t.name}</p>
                        {t.description&&<p style={{fontSize:12,color:C.muted,margin:'2px 0 0'}}>{t.description}</p>}
                      </div>
                      <span style={{fontSize:15,fontWeight:800,color:C.orange}}>{t.price===0||!t.price?'مجاني':'SAR '+t.price}</span>
                    </div>
                    <div style={{display:'flex',gap:12,marginTop:8,fontSize:12,color:C.muted}}>
                      <span>🎟 {regs.filter(r=>r.ticket_type===t.name).length} مسجّل</span>
                      {t.quantity&&<span>📦 الكمية: {t.quantity}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Discount codes */}
            <div>
              <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:20,marginBottom:14}}>
                <h3 style={{fontSize:14,fontWeight:700,color:C.navy,margin:'0 0 14px'}}>🏷️ إضافة كود خصم</h3>
                <div style={{marginBottom:10}}>
                  <label style={{fontSize:12,fontWeight:600,color:C.navy,display:'block',marginBottom:4}}>الكود</label>
                  <input value={newCode.code} onChange={e=>setNewCode(n=>({...n,code:e.target.value.toUpperCase()}))} style={{...fs,padding:'8px 12px'}} placeholder="PROMO2025"/>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:10}}>
                  <div>
                    <label style={{fontSize:12,fontWeight:600,color:C.navy,display:'block',marginBottom:4}}>نوع الخصم</label>
                    <select value={newCode.discount_type} onChange={e=>setNewCode(n=>({...n,discount_type:e.target.value}))} style={{...fs,padding:'8px 12px'}}>
                      <option value="percentage">نسبة مئوية %</option>
                      <option value="fixed">مبلغ ثابت SAR</option>
                    </select>
                  </div>
                  <div>
                    <label style={{fontSize:12,fontWeight:600,color:C.navy,display:'block',marginBottom:4}}>القيمة</label>
                    <input type="number" value={newCode.discount_value} onChange={e=>setNewCode(n=>({...n,discount_value:e.target.value}))} style={{...fs,padding:'8px 12px'}} placeholder="10"/>
                  </div>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:12}}>
                  <div>
                    <label style={{fontSize:12,fontWeight:600,color:C.navy,display:'block',marginBottom:4}}>أقصى استخدام</label>
                    <input type="number" value={newCode.max_uses} onChange={e=>setNewCode(n=>({...n,max_uses:e.target.value}))} style={{...fs,padding:'8px 12px'}} placeholder="غير محدود"/>
                  </div>
                  <div>
                    <label style={{fontSize:12,fontWeight:600,color:C.navy,display:'block',marginBottom:4}}>تاريخ الانتهاء</label>
                    <input type="date" value={newCode.expires_at} onChange={e=>setNewCode(n=>({...n,expires_at:e.target.value}))} style={{...fs,padding:'8px 12px'}}/>
                  </div>
                </div>
                <button onClick={saveCode} disabled={savingCode||!newCode.code||!newCode.discount_value} style={{width:'100%',padding:'10px',background:C.orange,border:'none',borderRadius:6,color:'#fff',fontWeight:700,fontSize:13,cursor:'pointer',fontFamily:'inherit',opacity:savingCode||!newCode.code||!newCode.discount_value?0.5:1}}>
                  {savingCode?'...':'+ إضافة كود'}
                </button>
              </div>

              <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,overflow:'hidden'}}>
                <div style={{padding:'12px 18px',borderBottom:`1px solid ${C.border}`,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <span style={{fontWeight:700,color:C.navy,fontSize:14}}>الأكواد ({codes.length})</span>
                </div>
                {codes.length===0?<p style={{padding:20,fontSize:13,color:C.muted,margin:0}}>لا توجد أكواد بعد</p>:codes.map(c=>(
                  <div key={c.id} style={{padding:'12px 18px',borderBottom:`1px solid ${C.border}`,display:'flex',alignItems:'center',gap:10}}>
                    <div style={{flex:1,minWidth:0}}>
                      <p style={{fontSize:13,fontWeight:800,color:C.navy,margin:0,fontFamily:'monospace'}}>{c.code}</p>
                      <p style={{fontSize:11,color:C.muted,margin:'2px 0 0'}}>
                        {c.discount_type==='percentage'?`${c.discount_value}%`:`SAR ${c.discount_value}`}
                        {c.max_uses?` · ${c.used_count}/${c.max_uses}`:` · ${c.used_count} استخدام`}
                        {c.expires_at?` · ينتهي ${new Date(c.expires_at).toLocaleDateString('ar-SA')}`:''}
                      </p>
                    </div>
                    <button onClick={()=>toggleCode(c.id,c.is_active)} style={{padding:'4px 10px',border:`1px solid ${C.border}`,borderRadius:5,background:c.is_active?'#EAF7E0':'#F8F7FA',color:c.is_active?C.green:C.muted,fontSize:11,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>
                      {c.is_active?'نشط':'متوقف'}
                    </button>
                    <button onClick={()=>deleteCode(c.id)} style={{padding:'4px 10px',border:'none',background:'#FEF2F2',borderRadius:5,color:'#DC2626',fontSize:11,cursor:'pointer',fontFamily:'inherit'}}>حذف</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══ TAB 3: قائمة الانتظار ══ */}
        {tab===3&&(
          <div>
            {!ev.waitlist_enabled&&(
              <div style={{background:'#FFF8E8',border:`1px solid #F5D56B`,borderRadius:10,padding:16,marginBottom:16,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <p style={{margin:0,fontSize:13,color:'#B07000'}}>قائمة الانتظار غير مفعّلة لهذه الفعالية</p>
                <button onClick={async()=>{await sb.from('events').update({waitlist_enabled:true}).eq('id',id);setEv((e:any)=>({...e,waitlist_enabled:true}));setWaitlistEnabled(true)}} style={{padding:'7px 14px',background:'#B07000',border:'none',borderRadius:6,color:'#fff',fontWeight:700,fontSize:12,cursor:'pointer',fontFamily:'inherit'}}>تفعيل</button>
              </div>
            )}
            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,overflow:'hidden'}}>
              <div style={{padding:'14px 18px',borderBottom:`1px solid ${C.border}`,display:'flex',justifyContent:'space-between',alignItems:'center',background:'#FFF8E8'}}>
                <span style={{fontWeight:700,color:'#B07000',fontSize:14}}>⏳ قائمة الانتظار ({waitlist.length})</span>
              </div>
              {waitlist.length===0?(
                <div style={{padding:40,textAlign:'center'}}>
                  <p style={{fontSize:32,marginBottom:8}}>🎉</p>
                  <p style={{color:C.muted,fontSize:13}}>لا أحد في قائمة الانتظار</p>
                </div>
              ):waitlist.map((r,i)=>(
                <div key={r.id} style={{padding:'14px 18px',borderBottom:i<waitlist.length-1?`1px solid ${C.border}`:'none',display:'flex',alignItems:'center',gap:12}}>
                  <div style={{width:32,height:32,background:'#FFF8E8',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,color:'#B07000',fontSize:13,flexShrink:0}}>{i+1}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <p style={{fontSize:13,fontWeight:700,color:C.navy,margin:0}}>{r.guest_name}</p>
                    <p style={{fontSize:11,color:C.muted,margin:'2px 0 0'}}>{r.email||''} {r.phone?`· ${r.phone}`:''}</p>
                  </div>
                  <span style={{fontSize:11,color:C.muted,whiteSpace:'nowrap'}}>{new Date(r.created_at).toLocaleDateString('ar-SA')}</span>
                  <button onClick={()=>promoteWaitlist(r.id)} style={{padding:'7px 14px',background:'#EAF7E0',border:'none',borderRadius:6,color:C.green,fontWeight:700,fontSize:12,cursor:'pointer',fontFamily:'inherit',whiteSpace:'nowrap'}}>✓ ترقية</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══ TAB 4: التقارير ══ */}
        {tab===4&&(
          <div>
            <div style={{display:'flex',gap:10,marginBottom:16,flexWrap:'wrap'}}>
              <button onClick={exportCSV} style={{padding:'9px 18px',background:C.orange,border:'none',borderRadius:6,color:'#fff',fontWeight:700,fontSize:13,cursor:'pointer',fontFamily:'inherit'}}>📥 تصدير CSV</button>
              <button onClick={printList} style={{padding:'9px 18px',border:`1px solid ${C.border}`,borderRadius:6,background:C.card,color:C.text,fontWeight:700,fontSize:13,cursor:'pointer',fontFamily:'inherit'}}>🖨️ طباعة القائمة</button>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:16,marginBottom:16}}>
              {/* Attendance chart */}
              <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:20}}>
                <h3 style={{fontSize:14,fontWeight:700,color:C.navy,margin:'0 0 16px'}}>توزيع الحضور</h3>
                {(['registered','attended','cancelled','waitlisted'] as const).map(st=>{
                  const cnt=regs.filter(r=>r.status===st).length+([...(['waitlisted'] as const)].includes(st)?waitlist.length:0)
                  const total=regs.length+waitlist.length||1
                  const pct=Math.round(cnt/total*100)
                  const s=ST[st]
                  return(
                    <div key={st} style={{marginBottom:10}}>
                      <div style={{display:'flex',justifyContent:'space-between',fontSize:12,marginBottom:4}}>
                        <span style={{color:C.text,fontWeight:600}}>{s.label}</span>
                        <span style={{color:C.muted}}>{cnt} ({pct}%)</span>
                      </div>
                      <div style={{background:'#F0EDF7',borderRadius:20,height:8,overflow:'hidden'}}>
                        <div style={{width:`${pct}%`,height:'100%',background:s.color,borderRadius:20,transition:'width 0.5s'}}/>
                      </div>
                    </div>
                  )
                })}
              </div>
              {/* Ticket breakdown */}
              <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:20}}>
                <h3 style={{fontSize:14,fontWeight:700,color:C.navy,margin:'0 0 16px'}}>توزيع التذاكر</h3>
                {Array.from(new Set(regs.map(r=>r.ticket_type||'عام'))).map(tt=>{
                  const cnt=regs.filter(r=>(r.ticket_type||'عام')===tt).length
                  return(
                    <div key={tt} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:`1px solid ${C.border}`}}>
                      <span style={{fontSize:13,color:C.text,fontWeight:600}}>{tt}</span>
                      <span style={{fontSize:13,color:C.navy,fontWeight:800}}>{cnt}</span>
                    </div>
                  )
                })}
                {codes.length>0&&(
                  <div style={{marginTop:16,paddingTop:16,borderTop:`1px solid ${C.border}`}}>
                    <p style={{fontSize:12,fontWeight:700,color:C.navy,margin:'0 0 8px'}}>الأكواد المستخدمة</p>
                    {codes.filter(c=>c.used_count>0).map(c=>(
                      <div key={c.id} style={{display:'flex',justifyContent:'space-between',fontSize:12,padding:'4px 0'}}>
                        <span style={{fontFamily:'monospace',color:C.text}}>{c.code}</span>
                        <span style={{color:C.muted}}>{c.used_count} استخدام</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            {/* Recent registrations */}
            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,overflow:'hidden'}}>
              <div style={{padding:'12px 18px',borderBottom:`1px solid ${C.border}`}}>
                <span style={{fontWeight:700,color:C.navy,fontSize:14}}>آخر التسجيلات</span>
              </div>
              {regs.slice(0,10).map((r,i)=>(
                <div key={r.id} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 18px',borderBottom:i<9?`1px solid ${C.border}`:'none'}}>
                  <div style={{width:32,height:32,background:'#EDE9F7',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:700,color:'#7B4FBF',flexShrink:0}}>{r.guest_name?.[0]||'?'}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <p style={{fontSize:13,fontWeight:700,color:C.navy,margin:0}}>{r.guest_name}</p>
                    <p style={{fontSize:11,color:C.muted,margin:0}}>{r.ticket_type||'عام'}</p>
                  </div>
                  <span style={{fontSize:11,color:C.muted,whiteSpace:'nowrap'}}>{new Date(r.created_at).toLocaleDateString('ar-SA')}</span>
                  <span style={{padding:'3px 8px',borderRadius:20,fontSize:10,fontWeight:700,color:(ST[r.status]||ST.registered).color,background:(ST[r.status]||ST.registered).bg}}>{(ST[r.status]||ST.registered).label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══ TAB 5: الإعدادات ══ */}
        {tab===5&&(
          <div style={{maxWidth:600}}>
            {/* Status */}
            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:20,marginBottom:14}}>
              <h3 style={{fontSize:14,fontWeight:700,color:C.navy,margin:'0 0 14px'}}>حالة الفعالية</h3>
              <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8,marginBottom:14}}>
                {[['draft','مسودة','#F8F7FA','#6F7287'],['published','نشط','#EAF7E0',C.green],['completed','مكتمل','#F0EDF7','#7B4FBF'],['cancelled','ملغي','#FEF2F2','#DC2626']].map(([v,l,bg,c])=>(
                  <button key={v} onClick={()=>setNewStatus(v)} style={{padding:'10px',border:`2px solid ${newStatus===v?c:C.border}`,borderRadius:8,background:newStatus===v?bg:C.card,color:newStatus===v?c:C.muted,fontWeight:700,fontSize:12,cursor:'pointer',fontFamily:'inherit',transition:'all 0.15s'}}>{l}</button>
                ))}
              </div>

              {/* Waitlist toggle */}
              <label style={{display:'flex',alignItems:'center',gap:10,cursor:'pointer',padding:'12px',border:`1px solid ${C.border}`,borderRadius:8,marginBottom:14}}>
                <input type="checkbox" checked={waitlistEnabled} onChange={e=>setWaitlistEnabled(e.target.checked)} style={{width:16,height:16,accentColor:C.orange}}/>
                <div>
                  <p style={{fontSize:13,fontWeight:700,color:C.navy,margin:0}}>⏳ تفعيل قائمة الانتظار</p>
                  <p style={{fontSize:11,color:C.muted,margin:0}}>عند امتلاء الفعالية يُتاح التسجيل في قائمة الانتظار</p>
                </div>
              </label>

              {/* Form fields */}
              <div>
                <p style={{fontSize:13,fontWeight:700,color:C.navy,margin:'0 0 10px'}}>حقول نموذج التسجيل المخصصة</p>
                {formFields.map((f:any,i:number)=>(
                  <div key={i} style={{display:'flex',gap:8,alignItems:'center',marginBottom:8}}>
                    <input value={f.label} onChange={e=>{const fs=[...formFields];fs[i]={...fs[i],label:e.target.value};setFormFields(fs)}} style={{...fs,flex:1,padding:'7px 10px'}} placeholder="اسم الحقل"/>
                    <select value={f.type} onChange={e=>{const fs=[...formFields];fs[i]={...fs[i],type:e.target.value};setFormFields(fs)}} style={{...fs,width:'auto',padding:'7px 10px'}}>
                      <option value="text">نص</option>
                      <option value="select">قائمة</option>
                      <option value="number">رقم</option>
                    </select>
                    <button onClick={()=>setFormFields(ff=>ff.filter((_,j)=>j!==i))} style={{padding:'7px 10px',background:'#FEF2F2',border:'none',borderRadius:5,color:'#DC2626',cursor:'pointer',fontFamily:'inherit',fontSize:12}}>✕</button>
                  </div>
                ))}
                <button onClick={()=>setFormFields(ff=>[...ff,{label:'',type:'text',required:false}])} style={{padding:'7px 14px',border:`1px dashed ${C.border}`,borderRadius:6,background:C.bg,color:C.muted,fontSize:12,cursor:'pointer',fontFamily:'inherit',fontWeight:600}}>+ إضافة حقل</button>
              </div>

              <button onClick={saveSettings} disabled={saving} style={{marginTop:16,width:'100%',padding:'11px',background:saving?'#ccc':C.orange,border:'none',borderRadius:8,color:'#fff',fontWeight:800,fontSize:14,cursor:saving?'not-allowed':'pointer',fontFamily:'inherit'}}>
                {saving?'جاري الحفظ...':'💾 حفظ الإعدادات'}
              </button>
            </div>

            {/* Danger zone */}
            <div style={{border:`1px solid #FCA5A5`,borderRadius:10,padding:20,background:'#FEF2F2'}}>
              <h3 style={{fontSize:14,fontWeight:700,color:'#DC2626',margin:'0 0 10px'}}>⚠️ منطقة الخطر</h3>
              <p style={{fontSize:13,color:'#7F1D1D',margin:'0 0 12px'}}>إلغاء الفعالية سيُوقف التسجيلات الجديدة</p>
              <button onClick={async()=>{if(confirm('هل أنت متأكد من إلغاء الفعالية؟')){await sb.from('events').update({status:'cancelled'}).eq('id',id);router.push('/events')}}} style={{padding:'9px 18px',background:'#DC2626',border:'none',borderRadius:6,color:'#fff',fontWeight:700,fontSize:13,cursor:'pointer',fontFamily:'inherit'}}>إلغاء الفعالية</button>
            </div>
          </div>
        )}

      </div>
      <div className="h-20 md:h-0"/>
    </div>
  )
}
