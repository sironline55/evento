'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState, useRef, useCallback } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import * as XLSX from 'xlsx'

const C = { navy:'#1E0A3C',orange:'#F05537',text:'#39364F',muted:'#6F7287',border:'#DBDAE3',bg:'#FAFAFA',card:'#FFFFFF',green:'#3A7D0A' }
const ST: Record<string,{label:string;color:string;bg:string}> = {
  registered:{label:'مسجّل',color:'#7B4FBF',bg:'#EDE9F7'},
  attended:{label:'حضر',color:C.green,bg:'#EAF7E0'},
  cancelled:{label:'ملغي',color:'#DC2626',bg:'#FEF2F2'},
  waitlisted:{label:'انتظار',color:'#B07000',bg:'#FFF8E8'},
}
const STAFF_STATUS: Record<string,{label:string;color:string;bg:string}> = {
  open:{label:'مفتوح',color:'#7B4FBF',bg:'#EDE9F7'},
  filled:{label:'مكتمل',color:C.green,bg:'#EAF7E0'},
  cancelled:{label:'ملغي',color:'#DC2626',bg:'#FEF2F2'},
}
const fs = {width:'100%',padding:'10px 14px',border:`1px solid ${C.border}`,borderRadius:6,fontSize:13,outline:'none',fontFamily:'inherit',color:C.text,background:C.bg,boxSizing:'border-box' as const}
const TABS = ['نظرة عامة','الحضور + الماسح','التذاكر والخصومات','قائمة الانتظار','الكوادر','التقارير','الإعدادات']

// Excel export
function exportXLSX(regs: any[], eventTitle: string) {
  const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const rows = regs.map((r,i)=>({
    '#': i+1,
    'الاسم': r.guest_name||'',
    'البريد': r.guest_email||r.email||'',
    'الجوال': r.guest_phone||r.phone||'',
    'التذكرة': r.ticket_type||'عام',
    'الحالة': ({registered:'مسجّل',attended:'حضر',cancelled:'ملغي',waitlisted:'انتظار'} as any)[r.status]||r.status,
    'كود خصم': r.discount_code||'',
    'تاريخ التسجيل': r.created_at?new Date(r.created_at).toLocaleDateString('ar-SA'):'',
    'وقت الحضور': r.checked_in_at?new Date(r.checked_in_at).toLocaleString('ar-SA'):'—',
  }))
  const ws = XLSX.utils.json_to_sheet(rows)
  ws['!cols']=[{wch:4},{wch:22},{wch:28},{wch:14},{wch:14},{wch:10},{wch:12},{wch:16},{wch:20}]
  const sum=[
    {'البيان':'إجمالي المسجلين','العدد':regs.filter(r=>r.status!=='waitlisted').length},
    {'البيان':'حضروا','العدد':regs.filter(r=>r.status==='attended').length},
    {'البيان':'لم يحضروا','العدد':regs.filter(r=>r.status==='registered').length},
    {'البيان':'ملغية','العدد':regs.filter(r=>r.status==='cancelled').length},
    {'البيان':'قائمة الانتظار','العدد':regs.filter(r=>r.status==='waitlisted').length},
  ]
  const ws2=XLSX.utils.json_to_sheet(sum)
  ws2['!cols']=[{wch:20},{wch:10}]
  const wb=XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb,ws,'الزوار')
  XLSX.utils.book_append_sheet(wb,ws2,'ملخص')
  XLSX.writeFile(wb,`${eventTitle.slice(0,30)}-الزوار.xlsx`)
}

function exportCSV(regs: any[], title: string) {
  const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const rows=[['الاسم','البريد','الجوال','التذكرة','الحالة','التسجيل','الحضور']]
  regs.forEach(r=>rows.push([r.guest_name,r.guest_email||r.email||'',r.guest_phone||r.phone||'',r.ticket_type||'عام',r.status,new Date(r.created_at).toLocaleDateString('ar-SA'),r.checked_in_at?new Date(r.checked_in_at).toLocaleTimeString('ar-SA'):'—']))
  const csv=rows.map(r=>r.join(',')).join('\n')
  const a=document.createElement('a')
  a.href='data:text/csv;charset=utf-8,\uFEFF'+encodeURIComponent(csv)
  a.download=`${title}-الزوار.csv`; a.click()
}

function printList(regs: any[], title: string) {
  const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const w=window.open('','_blank')!
  const rows=regs.map(r=>`<tr><td>${r.guest_name}</td><td>${r.ticket_type||'عام'}</td><td>${r.guest_email||r.email||''}</td><td>${r.status==='attended'?'✓':''}</td><td></td></tr>`).join('')
  w.document.write(`<html dir="rtl"><head><title>${title}</title><style>*{font-family:Arial,sans-serif}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ccc;padding:8px;font-size:12px}th{background:#1E0A3C;color:#fff}h2{color:#1E0A3C}@media print{button{display:none}}</style></head><body><h2>${title}</h2><p style="color:#666">${new Date().toLocaleDateString('ar-SA')} — ${regs.length} مسجّل</p><table><tr><th>الاسم</th><th>التذكرة</th><th>البريد</th><th>الحضور</th><th>توقيع</th></tr>${rows}</table><br><button onclick="window.print()" style="padding:10px 20px;background:#F05537;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:14px">🖨️ طباعة</button></body></html>`)
  w.document.close()
}

export default function EventDetailPage() {
  const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const {id}=useParams(); const router=useRouter()
  const [ev,setEv]=useState<any>(null)
  const [tab,setTab]=useState(0)
  const [regs,setRegs]=useState<any[]>([])
  const [waitlist,setWaitlist]=useState<any[]>([])
  const [codes,setCodes]=useState<any[]>([])
  const [staffReqs,setStaffReqs]=useState<any[]>([])
  const [loading,setLoading]=useState(true)
  const [search,setSearch]=useState(''); const [filter,setFilter]=useState('all')
  const [stats,setStats]=useState({total:0,attended:0,waitlisted:0,capacity:0})
  // Scanner
  const [qrInput,setQrInput]=useState(''); const [scanRes,setScanRes]=useState<any>(null)
  const [scanning,setScanning]=useState(false); const [cameraOn,setCameraOn]=useState(false)
  const [cameraErr,setCameraErr]=useState(''); const [scanHistory,setScanHistory]=useState<any[]>([])
  const videoRef=useRef<HTMLVideoElement>(null); const canvasRef=useRef<HTMLCanvasElement>(null)
  const streamRef=useRef<MediaStream|null>(null); const scanningRef=useRef(false); const qrRef=useRef<HTMLInputElement>(null)
  // Discount
  const [newCode,setNewCode]=useState({code:'',discount_type:'percentage',discount_value:'',max_uses:'',expires_at:''})
  const [savingCode,setSavingCode]=useState(false)
  // Staff
  const [newStaff,setNewStaff]=useState({role_name:'',quantity:'1',notes:''})
  const [savingStaff,setSavingStaff]=useState(false)
  // Settings
  const [newStatus,setNewStatus]=useState(''); const [saving,setSaving]=useState(false)
  const [formFields,setFormFields]=useState<any[]>([]); const [waitlistEnabled,setWaitlistEnabled]=useState(false)

  useEffect(()=>{
    if(!id) return
    Promise.all([
      sb.from('events').select('*').eq('id',id).single(),
      sb.from('registrations').select('*').eq('event_id',id).order('created_at',{ascending:false}),
      sb.from('discount_codes').select('*').eq('event_id',id).order('created_at',{ascending:false}),
      sb.from('staffing_requests').select('*').eq('event_id',id).order('created_at',{ascending:false}),
    ]).then(([{data:ev},{data:r},{data:c},{data:s}])=>{
      if(ev){setEv(ev);setNewStatus(ev.status);setFormFields(ev.form_fields||[]);setWaitlistEnabled(ev.waitlist_enabled||false)}
      const all=r||[]
      setRegs(all.filter((x:any)=>x.status!=='waitlisted'))
      setWaitlist(all.filter((x:any)=>x.status==='waitlisted'))
      setCodes(c||[]); setStaffReqs(s||[])
      const att=all.filter((x:any)=>x.status==='attended').length
      const wait=all.filter((x:any)=>x.status==='waitlisted').length
      const tot=all.filter((x:any)=>x.status!=='waitlisted').length
      setStats({total:tot,attended:att,waitlisted:wait,capacity:ev?.capacity||0})
      setLoading(false)
    })
  },[id])

  // Realtime
  useEffect(()=>{
    if(!id) return
    const ch=sb.channel('ev-'+id)
      .on('postgres_changes',{event:'*',schema:'public',table:'registrations',filter:`event_id=eq.${id}`},(payload:any)=>{
        if(payload.eventType==='INSERT'){
          const r=payload.new
          if(r.status==='waitlisted') setWaitlist(w=>[r,...w])
          else setRegs(rs=>[r,...rs])
          setStats(s=>({...s,total:r.status!=='waitlisted'?s.total+1:s.total,waitlisted:r.status==='waitlisted'?s.waitlisted+1:s.waitlisted}))
        }
        if(payload.eventType==='UPDATE'){
          const r=payload.new
          setRegs(rs=>rs.map(x=>x.id===r.id?r:x))
          setWaitlist(w=>w.filter(x=>x.id!==r.id))
          if(r.status==='attended') setStats(s=>({...s,attended:s.attended+1}))
        }
      }).subscribe()
    return ()=>{sb.removeChannel(ch)}
  },[id])

  async function checkIn(regId:string){
  const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    await sb.from('registrations').update({status:'attended',checked_in_at:new Date().toISOString()}).eq('id',regId)}
  async function promoteWaitlist(regId:string){
  const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    await sb.from('registrations').update({status:'registered'}).eq('id',regId);setWaitlist(w=>w.filter(x=>x.id!==regId))}

  // Camera scanner
  const processFrame=useCallback(async()=>{
    if(!scanningRef.current||!videoRef.current||!canvasRef.current) return
    const v=videoRef.current; const c=canvasRef.current
    if(v.readyState!==v.HAVE_ENOUGH_DATA){requestAnimationFrame(processFrame);return}
    c.width=v.videoWidth; c.height=v.videoHeight
    const ctx=c.getContext('2d'); if(!ctx) return; ctx.drawImage(v,0,0)
    let code:string|null=null
    if('BarcodeDetector' in window){try{const bd=new (window as any).BarcodeDetector({formats:['qr_code']});const b=await bd.detect(c);if(b.length>0)code=b[0].rawValue}catch{}}
    if(code){scanningRef.current=false;await handleScan(code);setTimeout(()=>{scanningRef.current=true;requestAnimationFrame(processFrame)},2500)}
    else requestAnimationFrame(processFrame)
  },[id])

  async function startCamera(){
  const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    setCameraErr('')
    try{
      const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'}})
      streamRef.current=stream
      if(videoRef.current){videoRef.current.srcObject=stream;await videoRef.current.play()}
      setCameraOn(true);scanningRef.current=true;requestAnimationFrame(processFrame)
    }catch(e:any){setCameraErr(e.name==='NotAllowedError'?'يرجى السماح بالوصول للكاميرا':'تعذّر تشغيل الكاميرا')}
  }
  function stopCamera(){
  const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    scanningRef.current=false;streamRef.current?.getTracks().forEach(t=>t.stop());streamRef.current=null;if(videoRef.current)videoRef.current.srcObject=null;setCameraOn(false)}
  useEffect(()=>()=>{stopCamera()},[])

  async function handleScan(code:string){
  const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    if(!code.trim()||scanning) return
    setScanning(true);setScanRes(null)
    try{
      const {data:reg}=await sb.from('registrations').select('id,guest_name,status,ticket_type').eq('qr_code',code.trim()).eq('event_id',id).single()
      if(!reg){setScanRes({type:'error',msg:'رمز غير صالح'})}
      else if(reg.status==='attended'){setScanRes({type:'warning',msg:'تم المسح مسبقاً',name:reg.guest_name,ticket:reg.ticket_type})}
      else{
        await sb.from('registrations').update({status:'attended',checked_in_at:new Date().toISOString()}).eq('id',reg.id)
        setScanRes({type:'success',msg:'✓ تم تسجيل الحضور',name:reg.guest_name,ticket:reg.ticket_type})
        setScanHistory(h=>[{name:reg.guest_name,ticket:reg.ticket_type,time:new Date().toLocaleTimeString('ar-SA')},...h.slice(0,19)])
      }
    }catch{setScanRes({type:'error',msg:'خطأ في الاتصال'})}
    finally{setScanning(false);setQrInput('');setTimeout(()=>qrRef.current?.focus(),100)}
  }

  // Discount
  async function saveCode(){
  const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    if(!newCode.code||!newCode.discount_value) return
    setSavingCode(true)
    const {data}=await sb.from('discount_codes').insert({event_id:id,code:newCode.code.toUpperCase(),discount_type:newCode.discount_type,discount_value:Number(newCode.discount_value),max_uses:newCode.max_uses?Number(newCode.max_uses):null,expires_at:newCode.expires_at||null}).select().single()
    if(data) setCodes(c=>[data,...c])
    setNewCode({code:'',discount_type:'percentage',discount_value:'',max_uses:'',expires_at:''})
    setSavingCode(false)
  }
  async function deleteCode(cid:string){
  const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    await sb.from('discount_codes').delete().eq('id',cid);setCodes(c=>c.filter(x=>x.id!==cid))}
  async function toggleCode(cid:string,active:boolean){
  const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    await sb.from('discount_codes').update({is_active:!active}).eq('id',cid);setCodes(c=>c.map(x=>x.id===cid?{...x,is_active:!active}:x))}

  // Staff requests
  async function saveStaffReq(){
  const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    if(!newStaff.role_name) return
    setSavingStaff(true)
    const {data}=await sb.from('staffing_requests').insert({event_id:id,role_name:newStaff.role_name,quantity:Number(newStaff.quantity)||1,notes:newStaff.notes||null,status:'open'}).select().single()
    if(data) setStaffReqs(s=>[data,...s])
    setNewStaff({role_name:'',quantity:'1',notes:''})
    setSavingStaff(false)
  }
  async function deleteStaffReq(sid:string){
  const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    await sb.from('staffing_requests').delete().eq('id',sid);setStaffReqs(s=>s.filter(x=>x.id!==sid))}
  async function updateStaffStatus(sid:string,status:string){
  const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    await sb.from('staffing_requests').update({status}).eq('id',sid);setStaffReqs(s=>s.map(x=>x.id===sid?{...x,status}:x))}

  // Settings
  async function saveSettings(){
  const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    setSaving(true)
    await sb.from('events').update({status:newStatus,waitlist_enabled:waitlistEnabled,form_fields:formFields,updated_at:new Date().toISOString()}).eq('id',id)
    setSaving(false)
    setEv((e:any)=>({...e,status:newStatus,waitlist_enabled:waitlistEnabled,form_fields:formFields}))
  }

  const filtered=regs.filter(r=>{
    const q=search.toLowerCase()
    return (!q||(r.guest_name||'').toLowerCase().includes(q)||(r.guest_email||'').toLowerCase().includes(q))
      &&(filter==='all'||r.status===filter)
  })

  const fillPct=stats.capacity>0?Math.round(stats.total/stats.capacity*100):0

  if(loading) return <div style={{padding:40,textAlign:'center',color:C.muted,fontSize:14}}>جاري التحميل...</div>
  if(!ev) return <div style={{padding:40,textAlign:'center',color:C.muted}}>الفعالية غير موجودة</div>

  const evST=({draft:{l:'مسودة',c:'#6F7287',b:'#F8F7FA'},published:{l:'نشط',c:C.green,b:'#EAF7E0'},completed:{l:'مكتمل',c:'#7B4FBF',b:'#EDE9F7'},cancelled:{l:'ملغي',c:'#DC2626',b:'#FEF2F2'}} as any)[ev.status]||{l:ev.status,c:C.muted,b:'#F8F7FA'}
  const scanStyle=({success:{bg:'#EAF7E0',border:C.green,color:'#1A5A00',icon:'✅'},warning:{bg:'#FFF8E8',border:'#B07000',color:'#7A5000',icon:'⚠️'},error:{bg:'#FEF2F2',border:'#DC2626',color:'#B91C1C',icon:'❌'}} as any)

  return (
    <div style={{minHeight:'100vh',background:C.bg,direction:'rtl'}}>
      {/* Header */}
      <div style={{background:C.card,borderBottom:`1px solid ${C.border}`,padding:'16px 20px'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:10}}>
          <div>
            <div style={{display:'flex',gap:8,marginBottom:4,alignItems:'center'}}>
              <Link href="/events" style={{fontSize:12,color:C.muted,textDecoration:'none'}}>الفعاليات</Link>
              <span style={{color:C.border}}>/</span>
              <span style={{fontSize:12,color:C.text,fontWeight:600}}>{ev.title}</span>
            </div>
            <h1 style={{fontSize:20,fontWeight:800,color:C.navy,margin:'0 0 6px'}}>{ev.title}</h1>
            <div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
              <span style={{padding:'3px 10px',borderRadius:20,fontSize:11,fontWeight:700,color:evST.c,background:evST.b}}>{evST.l}</span>
              <span style={{fontSize:12,color:C.muted}}>📅 {ev.start_date?new Date(ev.start_date).toLocaleDateString('ar-SA',{year:'numeric',month:'short',day:'numeric'}):'—'}</span>
              {ev.location&&<span style={{fontSize:12,color:C.muted}}>📍 {ev.location}</span>}
            </div>
          </div>
          <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
            <Link href={`/e/${id}`} target="_blank" style={{padding:'8px 14px',border:`1px solid ${C.border}`,borderRadius:6,background:C.card,color:C.text,textDecoration:'none',fontWeight:600,fontSize:12}}>🌐 الصفحة العامة</Link>
            <button onClick={()=>navigator.clipboard.writeText(`${window.location.origin}/r/${id}`)} style={{padding:'8px 14px',border:`1px solid ${C.border}`,borderRadius:6,background:C.card,color:C.text,fontWeight:600,fontSize:12,cursor:'pointer',fontFamily:'inherit'}}>🔗 رابط التسجيل</button>
            <Link href={`/events/${id}/edit`} style={{padding:'8px 14px',background:C.orange,borderRadius:6,color:'#fff',textDecoration:'none',fontWeight:700,fontSize:12}}>✏️ تعديل</Link>
          </div>
        </div>

        {/* Stats */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:10,marginTop:14}}>
          {[
            {l:'المسجلون',v:stats.total,c:C.navy,b:'#F0EDF7'},
            {l:'حضروا',v:stats.attended,c:C.green,b:'#EAF7E0'},
            {l:'لم يحضروا',v:stats.total-stats.attended,c:C.muted,b:'#F8F7FA'},
            {l:'قائمة الانتظار',v:stats.waitlisted,c:'#B07000',b:'#FFF8E8'},
            {l:'نسبة الحضور',v:stats.total>0?Math.round(stats.attended/stats.total*100)+'%':'—',c:C.orange,b:'#FEF0ED'},
          ].map(s=>(
            <div key={s.l} style={{background:s.b,borderRadius:8,padding:'10px 12px'}}>
              <p style={{fontSize:20,fontWeight:800,color:s.c,margin:0}}>{s.v}</p>
              <p style={{fontSize:11,color:C.muted,margin:0}}>{s.l}</p>
            </div>
          ))}
        </div>
        {stats.capacity>0&&<div style={{marginTop:8}}>
          <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:C.muted,marginBottom:3}}>
            <span>الامتلاء: {fillPct}%</span><span>{stats.total}/{stats.capacity}</span>
          </div>
          <div style={{background:'#F0EDF7',borderRadius:20,height:5,overflow:'hidden'}}>
            <div style={{width:`${Math.min(fillPct,100)}%`,height:'100%',background:fillPct>=90?C.orange:C.green,borderRadius:20}}/>
          </div>
        </div>}
      </div>

      {/* Tabs */}
      <div style={{background:C.card,borderBottom:`1px solid ${C.border}`,overflowX:'auto'}}>
        <div style={{display:'flex',minWidth:'max-content'}}>
          {TABS.map((t,i)=>(
            <button key={i} onClick={()=>setTab(i)} style={{
              padding:'11px 16px',border:'none',background:'transparent',cursor:'pointer',
              fontWeight:tab===i?700:500,fontSize:12,fontFamily:'inherit',whiteSpace:'nowrap',
              color:tab===i?C.orange:C.muted,
              borderBottom:tab===i?`3px solid ${C.orange}`:'3px solid transparent',
            }}>{t}</button>
          ))}
        </div>
      </div>

      <div style={{padding:'16px',maxWidth:1100,margin:'0 auto'}}>

        {/* TAB 0: نظرة عامة */}
        {tab===0&&(
          <div style={{display:'grid',gridTemplateColumns:'1fr 260px',gap:16,alignItems:'start'}}>
            <div>
              {ev.cover_image&&<img src={ev.cover_image} alt="" style={{width:'100%',maxHeight:220,objectFit:'cover',borderRadius:10,marginBottom:14}}/>}
              <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:18,marginBottom:12}}>
                <h3 style={{fontSize:14,fontWeight:700,color:C.navy,margin:'0 0 12px'}}>تفاصيل الفعالية</h3>
                {[['التاريخ',ev.start_date?new Date(ev.start_date).toLocaleString('ar-SA'):'—'],['النهاية',ev.end_date?new Date(ev.end_date).toLocaleString('ar-SA'):'—'],['الموقع',ev.location||ev.location_type||'—'],['التصنيف',ev.category||'—'],['الطاقة',ev.capacity?ev.capacity+' شخص':'غير محدودة'],['قائمة الانتظار',ev.waitlist_enabled?'مفعّلة':'غير مفعّلة']].map(([k,v])=>(
                  <div key={k} style={{display:'grid',gridTemplateColumns:'110px 1fr',gap:8,marginBottom:8,paddingBottom:8,borderBottom:`1px solid ${C.border}`}}>
                    <span style={{fontSize:12,color:C.muted,fontWeight:600}}>{k}</span>
                    <span style={{fontSize:12,color:C.text,fontWeight:600}}>{v}</span>
                  </div>
                ))}
              </div>
              {ev.description&&<div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:18}}>
                <h3 style={{fontSize:14,fontWeight:700,color:C.navy,margin:'0 0 10px'}}>الوصف</h3>
                <p style={{fontSize:13,color:C.text,lineHeight:1.7,margin:0,whiteSpace:'pre-line'}}>{ev.description}</p>
              </div>}
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:14}}>
                <p style={{fontSize:12,fontWeight:700,color:C.navy,margin:'0 0 6px'}}>رابط التسجيل</p>
                <p style={{fontSize:10,color:C.muted,margin:'0 0 8px',wordBreak:'break-all',fontFamily:'monospace',background:'#F8F7FA',padding:'5px 8px',borderRadius:4}}>{typeof window!=='undefined'?`${window.location.origin}/r/${id}`:'...'}</p>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6}}>
                  <button onClick={()=>navigator.clipboard.writeText(`${window.location.origin}/r/${id}`)} style={{padding:'6px',border:`1px solid ${C.border}`,borderRadius:5,background:C.bg,fontSize:11,cursor:'pointer',fontFamily:'inherit',fontWeight:600,color:C.text}}>📋 نسخ</button>
                  <Link href={`/e/${id}`} target="_blank" style={{padding:'6px',border:`1px solid ${C.border}`,borderRadius:5,background:C.bg,fontSize:11,textDecoration:'none',fontWeight:600,color:C.text,textAlign:'center',display:'block'}}>🌐 عرض</Link>
                </div>
              </div>
              {[{label:'الحضور والماسح',icon:'📷',t:1,bg:'#EAF7E0',c:C.green},{label:'أكواد الخصم',icon:'🏷',t:2,bg:'#EDE9F7',c:'#7B4FBF'},{label:'قائمة الانتظار',icon:'⏳',t:3,bg:'#FFF8E8',c:'#B07000'},{label:'الكوادر',icon:'👷',t:4,bg:'#EDF7FF',c:'#0070B8'},{label:'التقارير',icon:'📊',t:5,bg:'#FEF0ED',c:C.orange}].map(q=>(
                <button key={q.t} onClick={()=>setTab(q.t)} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',background:q.bg,border:'none',borderRadius:8,cursor:'pointer',textAlign:'right',fontFamily:'inherit',width:'100%'}}>
                  <span style={{fontSize:16}}>{q.icon}</span>
                  <span style={{fontSize:12,fontWeight:700,color:q.c}}>{q.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* TAB 1: الحضور + الماسح */}
        {tab===1&&(
          <div>
            {/* Scanner */}
            <div style={{background:C.card,border:`2px solid ${cameraOn?C.orange:C.border}`,borderRadius:10,overflow:'hidden',marginBottom:14}}>
              <div style={{padding:'10px 16px',borderBottom:`1px solid ${C.border}`,display:'flex',justifyContent:'space-between',alignItems:'center',background:'#F8F7FA'}}>
                <span style={{fontWeight:700,color:C.navy,fontSize:13}}>📷 ماسح الحضور — {ev.title}</span>
                <div style={{display:'flex',gap:8,alignItems:'center'}}>
                  {scanHistory.length>0&&<span style={{fontSize:11,background:'#EAF7E0',color:C.green,padding:'2px 8px',borderRadius:10,fontWeight:700}}>{scanHistory.length} ✓</span>}
                  <button onClick={cameraOn?stopCamera:startCamera} style={{padding:'6px 14px',border:'none',borderRadius:6,cursor:'pointer',fontFamily:'inherit',fontWeight:700,fontSize:12,background:cameraOn?'#FEF2F2':C.orange,color:cameraOn?'#DC2626':'#fff'}}>
                    {cameraOn?'⏹ إيقاف':'▶ كاميرا'}
                  </button>
                </div>
              </div>
              {cameraErr&&<div style={{padding:'8px 16px',background:'#FEF2F2'}}><p style={{margin:0,color:'#B91C1C',fontSize:12}}>⚠️ {cameraErr}</p></div>}
              <div style={{display:'grid',gridTemplateColumns:cameraOn?'1fr 1fr':'1fr'}}>
                {cameraOn&&(
                  <div style={{background:'#000',position:'relative',minHeight:200}}>
                    <video ref={videoRef} playsInline muted style={{width:'100%',display:'block'}}/>
                    <canvas ref={canvasRef} style={{display:'none'}}/>
                    <div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',width:130,height:130,border:'3px solid rgba(240,85,55,0.9)',borderRadius:10,boxShadow:'0 0 0 1000px rgba(0,0,0,0.4)',pointerEvents:'none'}}/>
                  </div>
                )}
                <div style={{padding:14}}>
                  <div style={{display:'flex',gap:8,marginBottom:10}}>
                    <input ref={qrRef} value={qrInput} onChange={e=>setQrInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')handleScan(qrInput)}} placeholder="رمز QR أو ماسح USB..." style={{...fs,flex:1,padding:'8px 12px'}} autoFocus/>
                    <button onClick={()=>handleScan(qrInput)} disabled={scanning||!qrInput.trim()} style={{padding:'8px 14px',background:C.orange,border:'none',borderRadius:6,color:'#fff',fontWeight:700,cursor:'pointer',fontFamily:'inherit',opacity:scanning||!qrInput.trim()?0.5:1}}>تحقق</button>
                  </div>
                  {scanRes&&(()=>{const sc=scanStyle[scanRes.type];return(
                    <div style={{background:sc.bg,border:`2px solid ${sc.border}`,borderRadius:8,padding:'10px 14px',marginBottom:8}}>
                      <p style={{fontSize:14,fontWeight:700,color:sc.color,margin:0}}>{sc.icon} {scanRes.msg}</p>
                      {scanRes.name&&<p style={{fontSize:12,color:sc.color,margin:'3px 0 0'}}>👤 {scanRes.name} {scanRes.ticket?`— ${scanRes.ticket}`:''}</p>}
                    </div>
                  )})()}
                  {scanHistory.length>0&&<div style={{maxHeight:120,overflowY:'auto'}}>
                    {scanHistory.slice(0,4).map((h,i)=>(
                      <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'4px 0',borderBottom:`1px solid ${C.border}`,fontSize:11}}>
                        <span style={{color:C.text,fontWeight:600}}>✅ {h.name}</span>
                        <span style={{color:C.muted}}>{h.time}</span>
                      </div>
                    ))}
                  </div>}
                </div>
              </div>
            </div>

            {/* Attendees table */}
            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,overflow:'hidden'}}>
              <div style={{padding:'10px 16px',borderBottom:`1px solid ${C.border}`,display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
                <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="بحث..." style={{...fs,flex:1,minWidth:140,padding:'7px 10px'}}/>
                <select value={filter} onChange={e=>setFilter(e.target.value)} style={{...fs,width:'auto',padding:'7px 10px'}}>
                  <option value="all">الكل ({regs.length})</option>
                  <option value="registered">مسجّل</option>
                  <option value="attended">حضر</option>
                  <option value="cancelled">ملغي</option>
                </select>
                <button onClick={()=>exportXLSX([...regs,...waitlist],ev.title)} style={{padding:'7px 12px',border:`1px solid ${C.border}`,borderRadius:6,background:'#EAF7E0',color:C.green,fontWeight:700,fontSize:12,cursor:'pointer',fontFamily:'inherit'}}>📊 Excel</button>
                <button onClick={()=>exportCSV([...regs,...waitlist],ev.title)} style={{padding:'7px 12px',border:`1px solid ${C.border}`,borderRadius:6,background:C.bg,color:C.text,fontWeight:600,fontSize:12,cursor:'pointer',fontFamily:'inherit'}}>📥 CSV</button>
                <button onClick={()=>printList(regs,ev.title)} style={{padding:'7px 12px',border:`1px solid ${C.border}`,borderRadius:6,background:C.bg,color:C.text,fontWeight:600,fontSize:12,cursor:'pointer',fontFamily:'inherit'}}>🖨️</button>
              </div>
              <div style={{overflowX:'auto'}}>
                <table style={{width:'100%',borderCollapse:'collapse'}}>
                  <thead>
                    <tr style={{background:'#F8F7FA',borderBottom:`1px solid ${C.border}`}}>
                      {['الاسم','البريد / الجوال','التذكرة','الحالة','التسجيل','إجراء'].map(h=>(
                        <th key={h} style={{padding:'8px 12px',textAlign:'right',fontSize:11,fontWeight:700,color:C.muted,whiteSpace:'nowrap'}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length===0&&<tr><td colSpan={6} style={{padding:28,textAlign:'center',color:C.muted,fontSize:13}}>لا توجد نتائج</td></tr>}
                    {filtered.map(r=>{
                      const s=ST[r.status]||ST.registered
                      return(
                        <tr key={r.id} style={{borderBottom:`1px solid ${C.border}`}} onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background='#FAFAFA'} onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background='transparent'}>
                          <td style={{padding:'9px 12px',fontSize:13,fontWeight:700,color:C.navy,whiteSpace:'nowrap'}}>{r.guest_name}</td>
                          <td style={{padding:'9px 12px'}}>
                            <p style={{fontSize:11,color:C.muted,margin:0}}>{r.guest_email||r.email||'—'}</p>
                            <p style={{fontSize:11,color:C.muted,margin:0}}>{r.guest_phone||r.phone||''}</p>
                          </td>
                          <td style={{padding:'9px 12px',fontSize:12,color:C.muted}}>{r.ticket_type||'عام'}</td>
                          <td style={{padding:'9px 12px'}}><span style={{padding:'3px 8px',borderRadius:20,fontSize:11,fontWeight:700,color:s.color,background:s.bg}}>{s.label}</span></td>
                          <td style={{padding:'9px 12px',fontSize:11,color:C.muted,whiteSpace:'nowrap'}}>{new Date(r.created_at).toLocaleDateString('ar-SA')}</td>
                          <td style={{padding:'9px 12px'}}>
                            <div style={{display:'flex',gap:5}}>
                              {r.status!=='attended'&&<button onClick={()=>checkIn(r.id)} style={{padding:'4px 9px',background:'#EAF7E0',border:'none',borderRadius:5,color:C.green,fontWeight:700,fontSize:11,cursor:'pointer',fontFamily:'inherit'}}>✓</button>}
                              <Link href={`/ticket/${r.id}`} target="_blank" style={{padding:'4px 9px',background:'#EDE9F7',borderRadius:5,color:'#7B4FBF',fontWeight:700,fontSize:11,textDecoration:'none'}}>🎟</Link>
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

        {/* TAB 2: التذاكر والخصومات */}
        {tab===2&&(
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,alignItems:'start'}}>
            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:18}}>
              <h3 style={{fontSize:14,fontWeight:700,color:C.navy,margin:'0 0 12px'}}>أنواع التذاكر</h3>
              {(ev.tickets||[]).length===0?(
                <p style={{fontSize:13,color:C.muted}}>لا توجد تذاكر — <Link href={`/events/${id}/edit`} style={{color:C.orange}}>تعديل الفعالية</Link></p>
              ):(ev.tickets||[]).map((t:any,i:number)=>(
                <div key={i} style={{border:`1px solid ${C.border}`,borderRadius:8,padding:'10px 14px',marginBottom:8}}>
                  <div style={{display:'flex',justifyContent:'space-between'}}>
                    <p style={{fontSize:13,fontWeight:700,color:C.navy,margin:0}}>{t.name}</p>
                    <span style={{fontSize:13,fontWeight:800,color:C.orange}}>{t.price===0||!t.price?'مجاني':'SAR '+t.price}</span>
                  </div>
                  <p style={{fontSize:11,color:C.muted,margin:'4px 0 0'}}>
                    {regs.filter(r=>r.ticket_type===t.name).length} مسجّل {t.quantity?`/ ${t.quantity}`:''} 
                  </p>
                </div>
              ))}
            </div>
            <div>
              <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:18,marginBottom:12}}>
                <h3 style={{fontSize:14,fontWeight:700,color:C.navy,margin:'0 0 12px'}}>🏷️ إضافة كود خصم</h3>
                <div style={{marginBottom:8}}><label style={{fontSize:12,fontWeight:600,color:C.navy,display:'block',marginBottom:3}}>الكود</label><input value={newCode.code} onChange={e=>setNewCode(n=>({...n,code:e.target.value.toUpperCase()}))} style={{...fs,padding:'7px 10px'}} placeholder="SUMMER25"/></div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:8}}>
                  <div><label style={{fontSize:12,fontWeight:600,color:C.navy,display:'block',marginBottom:3}}>النوع</label><select value={newCode.discount_type} onChange={e=>setNewCode(n=>({...n,discount_type:e.target.value}))} style={{...fs,padding:'7px 10px'}}><option value="percentage">% نسبة</option><option value="fixed">SAR ثابت</option></select></div>
                  <div><label style={{fontSize:12,fontWeight:600,color:C.navy,display:'block',marginBottom:3}}>القيمة</label><input type="number" value={newCode.discount_value} onChange={e=>setNewCode(n=>({...n,discount_value:e.target.value}))} style={{...fs,padding:'7px 10px'}} placeholder="10"/></div>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:12}}>
                  <div><label style={{fontSize:12,fontWeight:600,color:C.navy,display:'block',marginBottom:3}}>أقصى استخدام</label><input type="number" value={newCode.max_uses} onChange={e=>setNewCode(n=>({...n,max_uses:e.target.value}))} style={{...fs,padding:'7px 10px'}} placeholder="∞"/></div>
                  <div><label style={{fontSize:12,fontWeight:600,color:C.navy,display:'block',marginBottom:3}}>ينتهي في</label><input type="date" value={newCode.expires_at} onChange={e=>setNewCode(n=>({...n,expires_at:e.target.value}))} style={{...fs,padding:'7px 10px'}}/></div>
                </div>
                <button onClick={saveCode} disabled={savingCode||!newCode.code||!newCode.discount_value} style={{width:'100%',padding:'9px',background:C.orange,border:'none',borderRadius:6,color:'#fff',fontWeight:700,fontSize:13,cursor:'pointer',fontFamily:'inherit',opacity:savingCode||!newCode.code||!newCode.discount_value?0.5:1}}>
                  {savingCode?'...':'+ إضافة'}
                </button>
              </div>
              <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,overflow:'hidden'}}>
                <div style={{padding:'10px 16px',borderBottom:`1px solid ${C.border}`}}><span style={{fontWeight:700,color:C.navy,fontSize:13}}>الأكواد ({codes.length})</span></div>
                {codes.length===0?<p style={{padding:16,fontSize:13,color:C.muted,margin:0}}>لا توجد أكواد</p>:codes.map(c=>(
                  <div key={c.id} style={{padding:'10px 16px',borderBottom:`1px solid ${C.border}`,display:'flex',alignItems:'center',gap:8}}>
                    <div style={{flex:1,minWidth:0}}>
                      <p style={{fontSize:13,fontWeight:800,color:C.navy,margin:0,fontFamily:'monospace'}}>{c.code}</p>
                      <p style={{fontSize:11,color:C.muted,margin:'2px 0 0'}}>{c.discount_type==='percentage'?`${c.discount_value}%`:`SAR ${c.discount_value}`} · {c.used_count} استخدام{c.max_uses?` / ${c.max_uses}`:''}</p>
                    </div>
                    <button onClick={()=>toggleCode(c.id,c.is_active)} style={{padding:'4px 8px',border:`1px solid ${C.border}`,borderRadius:5,background:c.is_active?'#EAF7E0':'#F8F7FA',color:c.is_active?C.green:C.muted,fontSize:10,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>{c.is_active?'نشط':'موقف'}</button>
                    <button onClick={()=>deleteCode(c.id)} style={{padding:'4px 8px',border:'none',background:'#FEF2F2',borderRadius:5,color:'#DC2626',fontSize:10,cursor:'pointer',fontFamily:'inherit'}}>حذف</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: قائمة الانتظار */}
        {tab===3&&(
          <div>
            {!ev.waitlist_enabled&&<div style={{background:'#FFF8E8',border:`1px solid #F5D56B`,borderRadius:10,padding:14,marginBottom:14,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <p style={{margin:0,fontSize:13,color:'#B07000'}}>قائمة الانتظار غير مفعّلة</p>
              <button onClick={async()=>{await sb.from('events').update({waitlist_enabled:true}).eq('id',id);setEv((e:any)=>({...e,waitlist_enabled:true}));setWaitlistEnabled(true)}} style={{padding:'6px 14px',background:'#B07000',border:'none',borderRadius:6,color:'#fff',fontWeight:700,fontSize:12,cursor:'pointer',fontFamily:'inherit'}}>تفعيل</button>
            </div>}
            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,overflow:'hidden'}}>
              <div style={{padding:'12px 16px',borderBottom:`1px solid ${C.border}`,background:'#FFF8E8'}}><span style={{fontWeight:700,color:'#B07000',fontSize:13}}>⏳ قائمة الانتظار ({waitlist.length})</span></div>
              {waitlist.length===0?(
                <div style={{padding:36,textAlign:'center'}}><p style={{fontSize:32,marginBottom:6}}>🎉</p><p style={{color:C.muted,fontSize:13}}>لا أحد في قائمة الانتظار</p></div>
              ):waitlist.map((r,i)=>(
                <div key={r.id} style={{padding:'12px 16px',borderBottom:i<waitlist.length-1?`1px solid ${C.border}`:'none',display:'flex',alignItems:'center',gap:10}}>
                  <div style={{width:28,height:28,background:'#FFF8E8',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,color:'#B07000',fontSize:12,flexShrink:0}}>{i+1}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <p style={{fontSize:13,fontWeight:700,color:C.navy,margin:0}}>{r.guest_name}</p>
                    <p style={{fontSize:11,color:C.muted,margin:'1px 0 0'}}>{r.guest_email||r.email||''}</p>
                  </div>
                  <span style={{fontSize:11,color:C.muted,whiteSpace:'nowrap'}}>{new Date(r.created_at).toLocaleDateString('ar-SA')}</span>
                  <button onClick={()=>promoteWaitlist(r.id)} style={{padding:'6px 12px',background:'#EAF7E0',border:'none',borderRadius:6,color:C.green,fontWeight:700,fontSize:12,cursor:'pointer',fontFamily:'inherit',whiteSpace:'nowrap'}}>✓ ترقية</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: الكوادر */}
        {tab===4&&(
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,alignItems:'start'}}>
            {/* Add staff request */}
            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:20}}>
              <h3 style={{fontSize:14,fontWeight:700,color:C.navy,margin:'0 0 14px'}}>👷 طلب كوادر جديد</h3>
              <div style={{marginBottom:10}}>
                <label style={{fontSize:12,fontWeight:600,color:C.navy,display:'block',marginBottom:4}}>المهمة / الدور *</label>
                <input value={newStaff.role_name} onChange={e=>setNewStaff(s=>({...s,role_name:e.target.value}))} style={{...fs,padding:'8px 12px'}} placeholder="مثال: مضيف، أمن، تقني..."/>
              </div>
              <div style={{marginBottom:10}}>
                <label style={{fontSize:12,fontWeight:600,color:C.navy,display:'block',marginBottom:4}}>العدد المطلوب</label>
                <input type="number" min="1" value={newStaff.quantity} onChange={e=>setNewStaff(s=>({...s,quantity:e.target.value}))} style={{...fs,padding:'8px 12px'}}/>
              </div>
              <div style={{marginBottom:14}}>
                <label style={{fontSize:12,fontWeight:600,color:C.navy,display:'block',marginBottom:4}}>ملاحظات</label>
                <textarea value={newStaff.notes} onChange={e=>setNewStaff(s=>({...s,notes:e.target.value}))} rows={3} style={{...fs,padding:'8px 12px',resize:'vertical'}} placeholder="متطلبات، ساعات العمل..."/>
              </div>
              <button onClick={saveStaffReq} disabled={savingStaff||!newStaff.role_name} style={{width:'100%',padding:'10px',background:C.orange,border:'none',borderRadius:8,color:'#fff',fontWeight:700,fontSize:13,cursor:'pointer',fontFamily:'inherit',opacity:savingStaff||!newStaff.role_name?0.5:1}}>
                {savingStaff?'...':'+ إضافة طلب'}
              </button>
              <div style={{marginTop:12,padding:'10px 12px',background:'#EDF7FF',borderRadius:8,border:'1px solid #B3DFF7'}}>
                <p style={{fontSize:12,color:'#0070B8',margin:0,fontWeight:600}}>💡 الكوادر المتاحون</p>
                <p style={{fontSize:11,color:'#0070B8',margin:'4px 0 0'}}>يمكن للعمال المسجلين في <Link href="/staffing" style={{color:'#F05537'}}>صفحة الكوادر</Link> التقدم للطلبات المنشورة</p>
              </div>
            </div>

            {/* Staff requests list */}
            <div>
              <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,overflow:'hidden'}}>
                <div style={{padding:'12px 16px',borderBottom:`1px solid ${C.border}`,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <span style={{fontWeight:700,color:C.navy,fontSize:14}}>طلبات الكوادر ({staffReqs.length})</span>
                  <Link href="/staffing" style={{fontSize:12,color:C.orange,textDecoration:'none',fontWeight:600}}>إدارة الكوادر ←</Link>
                </div>
                {staffReqs.length===0?(
                  <div style={{padding:36,textAlign:'center'}}>
                    <p style={{fontSize:32,marginBottom:6}}>👷</p>
                    <p style={{color:C.muted,fontSize:13}}>لا توجد طلبات كوادر بعد</p>
                  </div>
                ):staffReqs.map((s,i)=>{
                  const ss=STAFF_STATUS[s.status]||STAFF_STATUS.open
                  return(
                    <div key={s.id} style={{padding:'14px 16px',borderBottom:i<staffReqs.length-1?`1px solid ${C.border}`:'none'}}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:6}}>
                        <div>
                          <p style={{fontSize:13,fontWeight:700,color:C.navy,margin:0}}>{s.role_name}</p>
                          <p style={{fontSize:11,color:C.muted,margin:'2px 0 0'}}>العدد المطلوب: {s.quantity}</p>
                          {s.notes&&<p style={{fontSize:11,color:C.muted,margin:'2px 0 0'}}>{s.notes}</p>}
                        </div>
                        <span style={{padding:'3px 8px',borderRadius:20,fontSize:10,fontWeight:700,color:ss.color,background:ss.bg,whiteSpace:'nowrap'}}>{ss.label}</span>
                      </div>
                      <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                        {s.status!=='filled'&&<button onClick={()=>updateStaffStatus(s.id,'filled')} style={{padding:'4px 10px',background:'#EAF7E0',border:'none',borderRadius:5,color:C.green,fontWeight:700,fontSize:11,cursor:'pointer',fontFamily:'inherit'}}>✓ مكتمل</button>}
                        {s.status!=='open'&&<button onClick={()=>updateStaffStatus(s.id,'open')} style={{padding:'4px 10px',background:'#EDE9F7',border:'none',borderRadius:5,color:'#7B4FBF',fontWeight:700,fontSize:11,cursor:'pointer',fontFamily:'inherit'}}>إعادة فتح</button>}
                        <button onClick={()=>deleteStaffReq(s.id)} style={{padding:'4px 10px',background:'#FEF2F2',border:'none',borderRadius:5,color:'#DC2626',fontSize:11,cursor:'pointer',fontFamily:'inherit'}}>حذف</button>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Staff summary */}
              <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:16,marginTop:12}}>
                <h3 style={{fontSize:13,fontWeight:700,color:C.navy,margin:'0 0 10px'}}>ملخص الكوادر</h3>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10}}>
                  {[
                    {l:'إجمالي الطلبات',v:staffReqs.length,c:C.navy,b:'#F0EDF7'},
                    {l:'مفتوح',v:staffReqs.filter(s=>s.status==='open').length,c:'#7B4FBF',b:'#EDE9F7'},
                    {l:'مكتمل',v:staffReqs.filter(s=>s.status==='filled').length,c:C.green,b:'#EAF7E0'},
                  ].map(x=>(
                    <div key={x.l} style={{background:x.b,borderRadius:8,padding:'10px 12px',textAlign:'center'}}>
                      <p style={{fontSize:22,fontWeight:800,color:x.c,margin:0}}>{x.v}</p>
                      <p style={{fontSize:11,color:C.muted,margin:0}}>{x.l}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: التقارير */}
        {tab===5&&(
          <div>
            <div style={{display:'flex',gap:8,marginBottom:14,flexWrap:'wrap'}}>
              <button onClick={()=>exportXLSX([...regs,...waitlist],ev.title)} style={{padding:'9px 18px',background:'#EAF7E0',border:`1px solid #9DE07B`,borderRadius:6,color:C.green,fontWeight:700,fontSize:13,cursor:'pointer',fontFamily:'inherit'}}>📊 تصدير Excel</button>
              <button onClick={()=>exportCSV([...regs,...waitlist],ev.title)} style={{padding:'9px 18px',border:`1px solid ${C.border}`,borderRadius:6,background:C.card,color:C.text,fontWeight:700,fontSize:13,cursor:'pointer',fontFamily:'inherit'}}>📥 تصدير CSV</button>
              <button onClick={()=>printList(regs,ev.title)} style={{padding:'9px 18px',border:`1px solid ${C.border}`,borderRadius:6,background:C.card,color:C.text,fontWeight:700,fontSize:13,cursor:'pointer',fontFamily:'inherit'}}>🖨️ طباعة القائمة</button>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:14}}>
              <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:18}}>
                <h3 style={{fontSize:14,fontWeight:700,color:C.navy,margin:'0 0 14px'}}>توزيع الحضور</h3>
                {['registered','attended','cancelled','waitlisted'].map(st=>{
                  const cnt=st==='waitlisted'?waitlist.length:regs.filter(r=>r.status===st).length
                  const total=(regs.length+waitlist.length)||1
                  const pct=Math.round(cnt/total*100)
                  const s=ST[st]
                  return(<div key={st} style={{marginBottom:10}}>
                    <div style={{display:'flex',justifyContent:'space-between',fontSize:12,marginBottom:3}}>
                      <span style={{color:C.text,fontWeight:600}}>{s.label}</span>
                      <span style={{color:C.muted}}>{cnt} ({pct}%)</span>
                    </div>
                    <div style={{background:'#F0EDF7',borderRadius:20,height:7,overflow:'hidden'}}>
                      <div style={{width:`${pct}%`,height:'100%',background:s.color,borderRadius:20,transition:'width 0.5s'}}/>
                    </div>
                  </div>)
                })}
              </div>
              <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:18}}>
                <h3 style={{fontSize:14,fontWeight:700,color:C.navy,margin:'0 0 14px'}}>التذاكر والأكواد</h3>
                {Array.from(new Set(regs.map(r=>r.ticket_type||'عام'))).map(tt=>(
                  <div key={tt} style={{display:'flex',justifyContent:'space-between',padding:'7px 0',borderBottom:`1px solid ${C.border}`}}>
                    <span style={{fontSize:12,color:C.text,fontWeight:600}}>{tt}</span>
                    <span style={{fontSize:13,color:C.navy,fontWeight:800}}>{regs.filter(r=>(r.ticket_type||'عام')===tt).length}</span>
                  </div>
                ))}
                {codes.filter(c=>c.used_count>0).length>0&&<>
                  <p style={{fontSize:12,fontWeight:700,color:C.navy,margin:'14px 0 8px'}}>أكواد مستخدمة</p>
                  {codes.filter(c=>c.used_count>0).map(c=>(
                    <div key={c.id} style={{display:'flex',justifyContent:'space-between',fontSize:12,padding:'4px 0'}}>
                      <span style={{fontFamily:'monospace',color:C.text}}>{c.code}</span>
                      <span style={{color:C.muted}}>{c.used_count} مرة</span>
                    </div>
                  ))}
                </>}
              </div>
            </div>
            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,overflow:'hidden'}}>
              <div style={{padding:'12px 16px',borderBottom:`1px solid ${C.border}`}}><span style={{fontWeight:700,color:C.navy,fontSize:13}}>آخر التسجيلات</span></div>
              {regs.slice(0,10).map((r,i)=>(
                <div key={r.id} style={{display:'flex',alignItems:'center',gap:10,padding:'9px 16px',borderBottom:i<9?`1px solid ${C.border}`:'none'}}>
                  <div style={{width:30,height:30,background:'#EDE9F7',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,color:'#7B4FBF',flexShrink:0}}>{r.guest_name?.[0]||'?'}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <p style={{fontSize:12,fontWeight:700,color:C.navy,margin:0}}>{r.guest_name}</p>
                    <p style={{fontSize:11,color:C.muted,margin:0}}>{r.ticket_type||'عام'}</p>
                  </div>
                  <span style={{fontSize:11,color:C.muted,whiteSpace:'nowrap'}}>{new Date(r.created_at).toLocaleDateString('ar-SA')}</span>
                  <span style={{padding:'2px 8px',borderRadius:20,fontSize:10,fontWeight:700,color:(ST[r.status]||ST.registered).color,background:(ST[r.status]||ST.registered).bg}}>{(ST[r.status]||ST.registered).label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: الإعدادات */}
        {tab===6&&(
          <div style={{maxWidth:560}}>
            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:20,marginBottom:14}}>
              <h3 style={{fontSize:14,fontWeight:700,color:C.navy,margin:'0 0 14px'}}>حالة الفعالية</h3>
              <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8,marginBottom:14}}>
                {[['draft','مسودة','#F8F7FA','#6F7287'],['published','نشط','#EAF7E0',C.green],['completed','مكتمل','#EDE9F7','#7B4FBF'],['cancelled','ملغي','#FEF2F2','#DC2626']].map(([v,l,bg,c])=>(
                  <button key={v} onClick={()=>setNewStatus(v)} style={{padding:'9px',border:`2px solid ${newStatus===v?c:C.border}`,borderRadius:8,background:newStatus===v?bg:C.card,color:newStatus===v?c:C.muted,fontWeight:700,fontSize:12,cursor:'pointer',fontFamily:'inherit'}}>{l}</button>
                ))}
              </div>
              <label style={{display:'flex',alignItems:'center',gap:10,cursor:'pointer',padding:'10px 12px',border:`1px solid ${C.border}`,borderRadius:8,marginBottom:14}}>
                <input type="checkbox" checked={waitlistEnabled} onChange={e=>setWaitlistEnabled(e.target.checked)} style={{width:15,height:15,accentColor:C.orange}}/>
                <div><p style={{fontSize:13,fontWeight:700,color:C.navy,margin:0}}>⏳ تفعيل قائمة الانتظار</p><p style={{fontSize:11,color:C.muted,margin:0}}>عند الامتلاء يتاح للزوار الانضمام للانتظار</p></div>
              </label>
              <div>
                <p style={{fontSize:13,fontWeight:700,color:C.navy,margin:'0 0 8px'}}>حقول نموذج التسجيل المخصصة</p>
                {formFields.map((f:any,i:number)=>(
                  <div key={i} style={{display:'flex',gap:6,marginBottom:6}}>
                    <input value={f.label} onChange={e=>{const ff=[...formFields];ff[i]={...ff[i],label:e.target.value};setFormFields(ff)}} style={{...fs,flex:1,padding:'6px 10px'}} placeholder="اسم الحقل"/>
                    <select value={f.type} onChange={e=>{const ff=[...formFields];ff[i]={...ff[i],type:e.target.value};setFormFields(ff)}} style={{...fs,width:'auto',padding:'6px 10px'}}><option value="text">نص</option><option value="select">قائمة</option><option value="number">رقم</option></select>
                    <button onClick={()=>setFormFields(ff=>ff.filter((_,j)=>j!==i))} style={{padding:'6px 10px',background:'#FEF2F2',border:'none',borderRadius:5,color:'#DC2626',cursor:'pointer',fontFamily:'inherit'}}>✕</button>
                  </div>
                ))}
                <button onClick={()=>setFormFields(ff=>[...ff,{label:'',type:'text',required:false}])} style={{padding:'6px 14px',border:`1px dashed ${C.border}`,borderRadius:6,background:C.bg,color:C.muted,fontSize:12,cursor:'pointer',fontFamily:'inherit',fontWeight:600}}>+ إضافة حقل</button>
              </div>
              <button onClick={saveSettings} disabled={saving} style={{marginTop:14,width:'100%',padding:'11px',background:saving?'#ccc':C.orange,border:'none',borderRadius:8,color:'#fff',fontWeight:800,fontSize:14,cursor:saving?'not-allowed':'pointer',fontFamily:'inherit'}}>
                {saving?'جاري الحفظ...':'💾 حفظ الإعدادات'}
              </button>
            </div>
            <div style={{border:`1px solid #FCA5A5`,borderRadius:10,padding:18,background:'#FEF2F2'}}>
              <h3 style={{fontSize:14,fontWeight:700,color:'#DC2626',margin:'0 0 8px'}}>⚠️ منطقة الخطر</h3>
              <p style={{fontSize:13,color:'#7F1D1D',margin:'0 0 12px'}}>إلغاء الفعالية سيوقف التسجيلات الجديدة</p>
              <button onClick={async()=>{if(confirm('هل أنت متأكد من إلغاء الفعالية؟')){await sb.from('events').update({status:'cancelled'}).eq('id',id);router.push('/events')}}} style={{padding:'8px 18px',background:'#DC2626',border:'none',borderRadius:6,color:'#fff',fontWeight:700,fontSize:13,cursor:'pointer',fontFamily:'inherit'}}>إلغاء الفعالية</button>
            </div>
          </div>
        )}
      </div>
      <div className="h-20 md:h-0"/>
    </div>
  )
}
