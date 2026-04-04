'use client'
import{useEffect,useState}from 'react'
import{createBrowserClient}from '@supabase/ssr'
import{useParams}from 'next/navigation'
import Link from 'next/link'
export default function EventAttendeesPage(){
  const{id}=useParams()
  const[ev,setEv]=useState<any>(null)
  const[att,setAtt]=useState<any[]>([])
  const[loading,setL]=useState(true)
  const sb=createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  useEffect(()=>{Promise.all([sb.from('events').select('name').eq('id',id).single(),sb.from('attendees').select('*').eq('event_id',id).order('created_at',{ascending:false})]).then(([e,a])=>{setEv(e.data);setAtt(a.data||[]);setL(false)})},[id])
  async function checkIn(aId:string){await sb.from('attendees').update({status:'checked_in',checked_in_at:new Date().toISOString()}).eq('id',aId);setAtt(prev=>prev.map(a=>a.id===aId?{...a,status:'checked_in'}:a))}
  const ci=att.filter(a=>a.status==='checked_in').length
  return(
    <div style={{padding:24,direction:'rtl'}}>
      <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:20}}>
        <Link href={'/events/'+id} style={{color:'#666',textDecoration:'none',fontSize:14}}>← {ev?.name}</Link>
        <span style={{color:'#d1d5db'}}>/</span><span style={{fontSize:14,fontWeight:500}}>الزوار ({att.length})</span>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:14,marginBottom:20}}>
        {[{l:'إجمالي',v:att.length,c:'#2B6E64'},{l:'دخلوا',v:ci,c:'#0891b2'},{l:'غائبون',v:att.length-ci,c:'#d97706'}].map(s=>(
          <div key={s.l} style={{background:'#fff',borderRadius:14,padding:18,border:'1px solid #f0f0f0',textAlign:'center'}}><div style={{fontSize:26,fontWeight:700,color:s.c}}>{s.v}</div><div style={{fontSize:12,color:'#666',marginTop:4}}>{s.l}</div></div>
        ))}
      </div>
      {loading?<div style={{textAlign:'center',padding:40,color:'#666'}}>جاري التحميل...</div>
      :att.length===0?<div style={{textAlign:'center',padding:60,background:'#fff',borderRadius:16,border:'1px solid #f0f0f0',color:'#999'}}><p style={{fontSize:40,margin:'0 0 12px'}}>👥</p><p style={{fontWeight:600}}>لا يوجد زوار</p></div>
      :(
        <div style={{background:'#fff',borderRadius:16,border:'1px solid #f0f0f0',overflow:'hidden'}}>
          {att.map((a,i)=>(
            <div key={a.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 16px',borderTop:i>0?'1px solid #f3f4f6':'none'}}>
              <div><p style={{fontWeight:600,margin:0,fontSize:14}}>{a.full_name}</p><p style={{color:'#666',margin:0,fontSize:12}}>{a.phone||a.email||'—'}{a.company?' · '+a.company:''}</p></div>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <span style={{padding:'3px 10px',borderRadius:20,fontSize:11,background:a.status==='checked_in'?'#dcfce7':'#f3f4f6',color:a.status==='checked_in'?'#166534':'#374151'}}>{a.status==='checked_in'?'✓ دخل':'مسجل'}</span>
                {a.status!=='checked_in'&&<button onClick={()=>checkIn(a.id)} style={{padding:'6px 14px',background:'#2B6E64',color:'#fff',border:'none',borderRadius:8,fontSize:12,cursor:'pointer',fontWeight:600}}>دخول</button>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
