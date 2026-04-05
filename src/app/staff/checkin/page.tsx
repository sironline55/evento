'use client'
import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'

const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
const C = { navy:'#1E0A3C', orange:'#F05537', text:'#39364F', muted:'#6F7287', border:'#DBDAE3', bg:'#FAFAFA', card:'#FFFFFF', green:'#3A7D0A' }

export default function StaffCheckin() {
  const [events, setEvents]   = useState<any[]>([])
  const [selEv, setSelEv]     = useState<string>('')
  const [regs, setRegs]       = useState<any[]>([])
  const [search, setSearch]   = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    sb.auth.getUser().then(async ({ data }) => {
      if (!data.user) return
      const { data: w } = await sb.from('worker_profiles').select('id').eq('user_id', data.user.id).single()
      if (!w) return
      const { data: asgn } = await sb.from('event_staff_assignments').select('events(id,title)').eq('worker_profile_id', w.id)
      const evList = (asgn||[]).map((a:any)=>a.events).filter(Boolean)
      setEvents(evList)
      if (evList.length > 0) { setSelEv(evList[0].id); loadRegs(evList[0].id) }
    })
  }, [])

  async function loadRegs(evId: string) {
    setLoading(true)
    const { data } = await sb.from('registrations').select('id,guest_name,guest_email,ticket_type,status,checked_in_at').eq('event_id',evId).neq('status','waitlisted').order('guest_name')
    setRegs(data||[])
    setLoading(false)
  }

  async function checkIn(regId: string) {
    await sb.from('registrations').update({ status:'attended', checked_in_at: new Date().toISOString(), check_in_method:'staff_manual' }).eq('id', regId)
    setRegs(r => r.map(x => x.id===regId ? {...x, status:'attended', checked_in_at: new Date().toISOString()} : x))
  }

  const filtered = regs.filter(r => !search || (r.guest_name||'').toLowerCase().includes(search.toLowerCase()) || (r.guest_email||'').toLowerCase().includes(search.toLowerCase()))
  const attended = regs.filter(r=>r.status==='attended').length

  return (
    <div style={{ direction:'rtl' }}>
      <div style={{ background:C.navy, padding:'16px 20px' }}>
        <h1 style={{ color:'#fff', fontSize:18, fontWeight:800, margin:'0 0 12px' }}>👋 استقبال الضيوف</h1>
        <div style={{ display:'flex', gap:10, background:'rgba(255,255,255,0.1)', borderRadius:8, padding:'8px 14px' }}>
          <span style={{ color:'#fff', fontSize:13 }}>حضر: <strong>{attended}</strong></span>
          <span style={{ color:'rgba(255,255,255,0.4)' }}>|</span>
          <span style={{ color:'rgba(255,255,255,0.7)', fontSize:13 }}>الكل: <strong>{regs.length}</strong></span>
        </div>
      </div>
      <div style={{ padding:16 }}>
        {events.length > 1 && (
          <select value={selEv} onChange={e=>{ setSelEv(e.target.value); loadRegs(e.target.value) }} style={{ width:'100%', padding:'10px', border:`1px solid ${C.border}`, borderRadius:8, fontSize:14, fontFamily:'inherit', color:C.text, background:C.bg, outline:'none', marginBottom:12 }}>
            {events.map(ev=><option key={ev.id} value={ev.id}>{ev.title}</option>)}
          </select>
        )}
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="بحث بالاسم أو البريد..." style={{ width:'100%', padding:'10px 14px', border:`1px solid ${C.border}`, borderRadius:8, fontSize:14, fontFamily:'inherit', color:C.text, background:C.bg, outline:'none', marginBottom:12, boxSizing:'border-box' }}/>
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, overflow:'hidden' }}>
          {loading ? <p style={{ padding:20, textAlign:'center', color:C.muted }}>جاري التحميل...</p>
          : filtered.length === 0 ? <p style={{ padding:20, textAlign:'center', color:C.muted }}>لا توجد نتائج</p>
          : filtered.map((r,i) => (
            <div key={r.id} style={{ padding:'12px 16px', borderBottom: i<filtered.length-1?`1px solid ${C.border}`:'none', display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:36, height:36, background:r.status==='attended'?'#EAF7E0':'#EDE9F7', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, color:r.status==='attended'?C.green:'#7B4FBF', flexShrink:0, fontSize:14 }}>{r.guest_name?.[0]||'?'}</div>
              <div style={{ flex:1, minWidth:0 }}>
                <p style={{ fontSize:13, fontWeight:700, color:C.navy, margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.guest_name}</p>
                <p style={{ fontSize:11, color:C.muted, margin:0 }}>{r.ticket_type||'عام'} · {r.guest_email||''}</p>
              </div>
              {r.status === 'attended' ? (
                <span style={{ fontSize:11, background:'#EAF7E0', color:C.green, padding:'4px 10px', borderRadius:20, fontWeight:700, whiteSpace:'nowrap' }}>✓ حاضر</span>
              ) : (
                <button onClick={()=>checkIn(r.id)} style={{ padding:'7px 14px', background:C.orange, border:'none', borderRadius:6, color:'#fff', fontWeight:700, fontSize:12, cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap' }}>تسجيل</button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
