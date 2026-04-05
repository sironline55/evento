'use client'
import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import Link from 'next/link'

const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
const C = { navy:'#1E0A3C',orange:'#F05537',text:'#39364F',muted:'#6F7287',border:'#DBDAE3',bg:'#FAFAFA',card:'#FFFFFF',green:'#3A7D0A' }
const fs = {width:'100%',padding:'9px 12px',border:`1px solid ${C.border}`,borderRadius:6,fontSize:13,outline:'none',fontFamily:'inherit',color:C.text,background:C.bg,boxSizing:'border-box' as const}

export default function StaffAttendeesPage() {
  const [regs,setRegs]=useState<any[]>([])
  const [events,setEvents]=useState<any[]>([])
  const [selEv,setSelEv]=useState('')
  const [search,setSearch]=useState('')
  const [orgId,setOrgId]=useState('')
  const [loading,setLoading]=useState(true)

  useEffect(()=>{
    sb.auth.getUser().then(async({data:{user}})=>{
      if(!user)return
      const {data:m}=await sb.from('org_members').select('org_id').eq('user_id',user.id).single()
      if(!m)return
      setOrgId(m.org_id)
      const {data:evs}=await sb.from('events').select('id,title').eq('org_id',m.org_id).in('status',['published','completed']).order('start_date',{ascending:false}).limit(20)
      setEvents(evs||[])
      if(evs&&evs.length>0){
        setSelEv(evs[0].id)
        const {data:r}=await sb.from('registrations').select('*').eq('event_id',evs[0].id).order('created_at',{ascending:false})
        setRegs(r||[])
      }
      setLoading(false)
    })
  },[])

  async function loadEvent(eid:string){
    setSelEv(eid);setLoading(true)
    const {data:r}=await sb.from('registrations').select('*').eq('event_id',eid).order('created_at',{ascending:false})
    setRegs(r||[]);setLoading(false)
  }

  async function checkIn(id:string){
    await sb.from('registrations').update({status:'attended',checked_in_at:new Date().toISOString()}).eq('id',id)
    setRegs(r=>r.map(x=>x.id===id?{...x,status:'attended',checked_in_at:new Date().toISOString()}:x))
  }

  const filtered=regs.filter(r=>!search||(r.guest_name||'').toLowerCase().includes(search.toLowerCase())||(r.guest_email||'').toLowerCase().includes(search.toLowerCase()))
  const attended=regs.filter(r=>r.status==='attended').length

  return(
    <div style={{padding:'16px 20px',maxWidth:900,margin:'0 auto',direction:'rtl'}}>
      <div style={{display:'flex',gap:10,marginBottom:14,flexWrap:'wrap',alignItems:'center'}}>
        <select value={selEv} onChange={e=>loadEvent(e.target.value)} style={{...fs,flex:1,maxWidth:300}}>
          {events.map(ev=><option key={ev.id} value={ev.id}>{ev.title}</option>)}
        </select>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="بحث..." style={{...fs,flex:1,maxWidth:240}}/>
        <span style={{fontSize:12,color:C.muted,whiteSpace:'nowrap'}}>✅ {attended} / {regs.length} حضروا</span>
      </div>

      <div style={{background:'#FAFAFA',borderRadius:8,height:6,overflow:'hidden',marginBottom:14}}>
        <div style={{width:regs.length>0?`${Math.round(attended/regs.length*100)}%`:'0%',height:'100%',background:C.green,borderRadius:8,transition:'width 0.4s'}}/>
      </div>

      <div style={{background:'#fff',border:`1px solid ${C.border}`,borderRadius:10,overflow:'hidden'}}>
        {loading?<div style={{padding:40,textAlign:'center',color:C.muted}}>جاري التحميل...</div>:
        filtered.length===0?<div style={{padding:40,textAlign:'center',color:C.muted}}>لا توجد نتائج</div>:
        filtered.map((r,i)=>(
          <div key={r.id} style={{display:'flex',alignItems:'center',gap:12,padding:'12px 16px',borderBottom:i<filtered.length-1?`1px solid ${C.border}`:'none'}}>
            <div style={{width:36,height:36,background:r.status==='attended'?'#EAF7E0':'#EDE9F7',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,fontWeight:700,color:r.status==='attended'?C.green:'#7B4FBF',flexShrink:0}}>
              {r.status==='attended'?'✓':(r.guest_name?.[0]||'?')}
            </div>
            <div style={{flex:1,minWidth:0}}>
              <p style={{fontSize:13,fontWeight:700,color:C.navy,margin:0}}>{r.guest_name}</p>
              <p style={{fontSize:11,color:C.muted,margin:0}}>{r.guest_email||''} {r.ticket_type?`· ${r.ticket_type}`:''}</p>
            </div>
            <div style={{display:'flex',gap:6,alignItems:'center'}}>
              {r.status!=='attended'&&<button onClick={()=>checkIn(r.id)} style={{padding:'5px 12px',background:'#EAF7E0',border:'none',borderRadius:6,color:C.green,fontWeight:700,fontSize:12,cursor:'pointer',fontFamily:'inherit'}}>✓ حضر</button>}
              {r.status==='attended'&&<span style={{fontSize:11,color:C.green,fontWeight:700}}>✅ حضر</span>}
              <Link href={`/ticket/${r.id}`} target="_blank" style={{padding:'5px 10px',background:'#EDE9F7',borderRadius:5,color:'#7B4FBF',fontWeight:700,fontSize:11,textDecoration:'none'}}>🎟</Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}