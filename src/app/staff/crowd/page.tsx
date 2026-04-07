'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'

const C = { navy:'#1E0A3C', orange:'#F05537', text:'#39364F', muted:'#6F7287', border:'#DBDAE3', bg:'#FAFAFA', card:'#FFFFFF', green:'#3A7D0A' }

export default function StaffCrowd() {
  const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const [events, setEvents] = useState<any[]>([])
  const [selEv, setSelEv]   = useState<any>(null)
  const [regs, setRegs]     = useState({ total:0, attended:0, capacity:0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    sb.auth.getUser().then(async ({ data }) => {
      if (!data.user) return
      const { data: w } = await sb.from('worker_profiles').select('*').eq('user_id', data.user.id).single()
      if (!w) return
      const { data: asgn } = await sb.from('event_staff_assignments').select('events(id,title,capacity,start_date,location)').eq('worker_profile_id', w.id)
      const evList = (asgn||[]).map((a:any)=>a.events).filter(Boolean)
      setEvents(evList)
      if (evList.length > 0) loadEvent(evList[0])
      setLoading(false)
    })
  }, [])

  async function loadEvent(ev: any) {
  const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    setSelEv(ev)
    const [{ count:total },{ count:attended }] = await Promise.all([
      sb.from('registrations').select('*',{count:'exact',head:true}).eq('event_id',ev.id).neq('status','waitlisted'),
      sb.from('registrations').select('*',{count:'exact',head:true}).eq('event_id',ev.id).eq('status','attended'),
    ])
    setRegs({ total:total||0, attended:attended||0, capacity:ev.capacity||0 })
  }

  const pct = regs.capacity > 0 ? Math.round(regs.attended/regs.capacity*100) : regs.total>0 ? Math.round(regs.attended/regs.total*100) : 0

  return (
    <div style={{ direction:'rtl' }}>
      <div style={{ background:C.navy, padding:'16px 20px' }}>
        <h1 style={{ color:'#fff', fontSize:18, fontWeight:800, margin:0 }}>👥 إدارة الحشود</h1>
      </div>
      <div style={{ padding:16 }}>
        {events.length > 1 && (
          <div style={{ marginBottom:14 }}>
            <select value={selEv?.id||''} onChange={e=>loadEvent(events.find(x=>x.id===e.target.value))} style={{ width:'100%',padding:'10px',border:`1px solid ${C.border}`,borderRadius:8,fontSize:14,fontFamily:'inherit',color:C.text,background:C.bg,outline:'none' }}>
              {events.map(ev=><option key={ev.id} value={ev.id}>{ev.title}</option>)}
            </select>
          </div>
        )}
        {selEv && <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:20, marginBottom:14 }}>
          <h2 style={{ fontSize:16, fontWeight:800, color:C.navy, margin:'0 0 4px' }}>{selEv.title}</h2>
          <p style={{ fontSize:12, color:C.muted, margin:'0 0 20px' }}>📍 {selEv.location||'—'}</p>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12, marginBottom:20 }}>
            {[{l:'مسجلون',v:regs.total,c:C.navy,b:'#F0EDF7'},{l:'حضروا',v:regs.attended,c:C.green,b:'#EAF7E0'},{l:'الطاقة',v:regs.capacity||'∞',c:C.orange,b:'#FEF0ED'}].map(s=>(
              <div key={s.l} style={{ background:s.b, borderRadius:8, padding:'12px', textAlign:'center' }}>
                <p style={{ fontSize:24, fontWeight:800, color:s.c, margin:0 }}>{s.v}</p>
                <p style={{ fontSize:11, color:C.muted, margin:0 }}>{s.l}</p>
              </div>
            ))}
          </div>
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:C.muted, marginBottom:6 }}>
              <span>نسبة الامتلاء</span><span style={{ fontWeight:700, color:pct>=90?C.orange:C.green }}>{pct}%</span>
            </div>
            <div style={{ background:'#F0EDF7', borderRadius:20, height:12, overflow:'hidden' }}>
              <div style={{ width:`${Math.min(pct,100)}%`, height:'100%', background:pct>=90?C.orange:pct>=70?'#B07000':C.green, borderRadius:20, transition:'width 0.5s' }}/>
            </div>
          </div>
          <div style={{ marginTop:16, padding:'12px', borderRadius:8, background:pct>=90?'#FEF0ED':pct>=70?'#FFF8E8':'#EAF7E0', border:`1px solid ${pct>=90?C.orange:pct>=70?'#F5D56B':C.green}` }}>
            <p style={{ fontSize:13, fontWeight:700, color:pct>=90?C.orange:pct>=70?'#B07000':C.green, margin:0 }}>
              {pct>=90?'⚠️ تحذير: القاعة شبه ممتلئة':pct>=70?'🟡 الحضور مرتفع':' ✅ الوضع طبيعي'}
            </p>
          </div>
        </div>}
      </div>
    </div>
  )
}
