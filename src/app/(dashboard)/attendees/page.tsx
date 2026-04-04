'use client'
import{useEffect,useState}from 'react'
import{createBrowserClient}from '@supabase/ssr'
export default function AttendeesPage(){
  const[att,setAtt]=useState<any[]>([])
  const[loading,setL]=useState(true)
  const[search,setSearch]=useState('')
  const sb=createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  useEffect(()=>{sb.from('attendees').select('id,full_name,email,phone,company,status,created_at,events(name)').order('created_at',{ascending:false}).limit(100).then(({data})=>{setAtt(data||[]);setL(false)})},[])
  const f=att.filter(a=>!search||a.full_name?.toLowerCase().includes(search.toLowerCase())||a.phone?.includes(search))
  return(
    <div style={{padding:24,direction:'rtl'}}>
      <h1 style={{fontSize:24,fontWeight:700,marginBottom:8}}>الزوار المسجلون</h1>
      <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="بحث بالاسم أو الجوال..." style={{width:'100%',maxWidth:400,padding:'10px 14px',border:'1px solid #e5e7eb',borderRadius:10,fontSize:14,marginBottom:16,outline:'none',boxSizing:'border-box' as const,fontFamily:'inherit'}}/>
      {loading?<div style={{textAlign:'center',padding:60,color:'#666'}}>جاري التحميل...</div>
      :f.length===0?<div style={{textAlign:'center',padding:60,background:'#fff',borderRadius:16,border:'1px solid #f0f0f0',color:'#999'}}><p style={{fontSize:40,margin:'0 0 12px'}}>👥</p><p style={{fontWeight:600}}>لا توجد نتائج</p></div>
      :(
        <div style={{background:'#fff',borderRadius:16,border:'1px solid #f0f0f0',overflow:'hidden'}}>
          <div style={{padding:'10px 16px',background:'#f9fafb',display:'grid',gridTemplateColumns:'2fr 1.5fr 1fr 1fr',gap:12,fontSize:12,fontWeight:600,color:'#6b7280'}}>
            <span>الاسم</span><span>الفعالية</span><span>الجوال</span><span>الحالة</span>
          </div>
          {f.map((a,i)=>(
            <div key={a.id} style={{padding:'12px 16px',display:'grid',gridTemplateColumns:'2fr 1.5fr 1fr 1fr',gap:12,alignItems:'center',borderTop:i>0?'1px solid #f3f4f6':'none'}}>
              <div><p style={{fontWeight:600,margin:0,fontSize:14}}>{a.full_name}</p>{a.company&&<p style={{color:'#666',margin:0,fontSize:12}}>{a.company}</p>}</div>
              <span style={{color:'#666',fontSize:13}}>{(a.events as any)?.name||'—'}</span>
              <span style={{color:'#666',fontSize:13}}>{a.phone||a.email||'—'}</span>
              <span style={{padding:'2px 8px',borderRadius:20,fontSize:11,display:'inline-block',background:a.status==='checked_in'?'#dcfce7':'#f3f4f6',color:a.status==='checked_in'?'#166534':'#374151'}}>{a.status==='checked_in'?'دخل':'مسجل'}</span>
            </div>
          ))}
          <div style={{padding:'8px 16px',background:'#f9fafb',fontSize:12,color:'#666',borderTop:'1px solid #f3f4f6'}}>إجمالي: {f.length} زائر</div>
        </div>
      )}
    </div>
  )
}
