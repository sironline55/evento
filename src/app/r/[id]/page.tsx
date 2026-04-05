'use client'
export const dynamic = 'force-dynamic'
import{useState,useEffect}from 'react'
import{createBrowserClient}from '@supabase/ssr'
import{useParams}from 'next/navigation'
import{WorkerOptIn}from '@/components/workers/WorkerOptIn'
export default function Reg(){
  const{id}=useParams()
  const[ev,setEv]=useState<any>(null)
  const[loading,setLoading]=useState(true)
  const[sub,setSub]=useState(false)
  const[done,setDone]=useState(false)
  const[aId,setAId]=useState('')
  const[aN,setAN]=useState('')
  const[form,setForm]=useState({full_name:'',email:'',phone:'',company:'',job_title:''})
  const sb=createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  useEffect(()=>{sb.from('events').select('id,name,start_date,venue_name,account_id,status').eq('id',id).single().then(({data})=>{setEv(data);setLoading(false)})},[id])
  const inp:React.CSSProperties={width:'100%',padding:'11px 14px',border:'1px solid #e5e7eb',borderRadius:10,fontSize:15,boxSizing:'border-box',outline:'none',background:'#fff',fontFamily:'inherit'}
  async function submit(e:React.FormEvent){
    e.preventDefault();setSub(true)
    const qr=crypto.randomUUID()
    const{data,error}=await sb.from('attendees').insert({event_id:id,account_id:ev.account_id,full_name:form.full_name,email:form.email||null,phone:form.phone||null,company:form.company||null,job_title:form.job_title||null,qr_code:qr,status:'registered',source:'form'}).select('id,full_name').single()
    if(!error&&data){setAId(data.id);setAN(data.full_name);setDone(true)}
    else{alert('Error: '+error?.message);setSub(false)}
  }
  if(loading)return<div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center'}}><p>جاري التحميل...</p></div>
  if(!ev)return<div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center'}} dir="rtl"><h2>الفعالية غير متاحة</h2></div>
  if(done)return(
    <div style={{minHeight:'100vh',background:'linear-gradient(135deg,#f0f9f6,#e8f4f0)',display:'flex',alignItems:'center',justifyContent:'center',padding:16}} dir="rtl">
      <div style={{background:'#fff',borderRadius:20,padding:32,maxWidth:440,width:'100%',boxShadow:'0 8px 40px rgba(0,0,0,0.08)'}}>
        <div style={{textAlign:'center',marginBottom:24}}>
          <div style={{fontSize:64,marginBottom:12}}>🎉</div>
          <h2 style={{fontSize:24,fontWeight:700,margin:0}}>تم تسجيلك بنجاح!</h2>
          <p style={{color:'#666',marginTop:8}}>{ev.name}</p>
        </div>
        <div style={{background:'#f0f9f6',borderRadius:14,padding:20,textAlign:'center',marginBottom:20}}>
          <p style={{fontWeight:600,margin:'0 0 4px',color:'#065f46'}}>مرحباً {aN}</p>
        </div>
        <WorkerOptIn attendeeId={aId} attendeeName={aN}/>
      </div>
    </div>
  )
  return(
    <div style={{minHeight:'100vh',background:'linear-gradient(135deg,#f0f9f6,#e8f4f0)',padding:16}} dir="rtl">
      <div style={{maxWidth:480,margin:'0 auto',paddingTop:32}}>
        <div style={{background:'#fff',borderRadius:20,overflow:'hidden',boxShadow:'0 8px 40px rgba(0,0,0,0.08)',marginBottom:20}}>
          <div style={{background:'linear-gradient(135deg,#2B6E64,#1a4a42)',padding:'28px 24px',color:'#fff'}}>
            <div style={{fontSize:22,marginBottom:8}}>🎪</div>
            <h1 style={{fontSize:22,fontWeight:700,margin:'0 0 6px'}}>{ev.name}</h1>
            {ev.venue_name&&<p style={{margin:'0 0 4px',opacity:0.85,fontSize:14}}>📍 {ev.venue_name}</p>}
            {ev.start_date&&<p style={{margin:0,opacity:0.85,fontSize:14}}>📅 {new Date(ev.start_date).toLocaleDateString('ar-SA')}</p>}
          </div>
          <form onSubmit={submit} style={{padding:24,display:'flex',flexDirection:'column',gap:14}}>
            <h2 style={{fontSize:18,fontWeight:700,margin:'0 0 4px'}}>سجّل حضورك</h2>
            <div><label style={{fontSize:13,fontWeight:500,display:'block',marginBottom:5}}>الاسم الكامل *</label>
              <input value={form.full_name} onChange={e=>setForm({...form,full_name:e.target.value})} required placeholder="محمد أحمد" style={inp}/></div>
            <div><label style={{fontSize:13,fontWeight:500,display:'block',marginBottom:5}}>البريد الإلكتروني</label>
              <input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="example@email.com" style={inp}/></div>
            <div><label style={{fontSize:13,fontWeight:500,display:'block',marginBottom:5}}>رقم الجوال</label>
              <input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="05xxxxxxxx" style={inp} type="tel"/></div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
              <div><label style={{fontSize:13,fontWeight:500,display:'block',marginBottom:5}}>الشركة</label>
                <input value={form.company} onChange={e=>setForm({...form,company:e.target.value})} placeholder="اختياري" style={inp}/></div>
              <div><label style={{fontSize:13,fontWeight:500,display:'block',marginBottom:5}}>المسمى</label>
                <input value={form.job_title} onChange={e=>setForm({...form,job_title:e.target.value})} placeholder="اختياري" style={inp}/></div>
            </div>
            <button type="submit" disabled={sub} style={{background:'#2B6E64',color:'#fff',padding:'14px',borderRadius:12,border:'none',fontSize:16,fontWeight:700,cursor:'pointer',opacity:sub?0.7:1}}>
              {sub?'جاري التسجيل...':'تسجيل الحضور مجاناً ✓'}
            </button>
          </form>
        </div>
        <p style={{textAlign:'center',fontSize:12,color:'#9ca3af'}}>مدعوم من EventVMS</p>
      </div>
    </div>
  )
}
