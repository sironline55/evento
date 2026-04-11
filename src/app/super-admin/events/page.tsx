'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect, useMemo } from 'react'
import { createBrowserClient } from '@supabase/ssr'

const C = { navy:'#1E0A3C', orange:'#F05537', text:'#39364F', muted:'#6F7287', border:'#DBDAE3', bg:'#F4F3F8', card:'#FFFFFF', green:'#16a34a', red:'#DC2626' }

export default function AdminEventsPage() {
  const sb = useMemo(() => createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!), [])
  const [events, setEvents]   = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [actioning, setActioning] = useState<string|null>(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const { data } = await sb
        .from('events')
        .select('id,title,status,start_date,location,category,capacity,is_public,created_by,created_at')
        .order('created_at', { ascending:false })
      // Load registration counts
      const evIds = (data||[]).map((e:any)=>e.id)
      if (evIds.length > 0) {
        const { data: regs } = await sb.from('registrations').select('event_id')
        const counts: Record<string,number> = {}
        regs?.forEach(r => { counts[r.event_id] = (counts[r.event_id]||0)+1 })
        setEvents((data||[]).map((e:any)=>({ ...e, reg_count: counts[e.id]||0 })))
      } else {
        setEvents(data||[])
      }
    } finally { setLoading(false) }
  }

  async function changeStatus(id: string, newStatus: string) {
    setActioning(id)
    await sb.from('events').update({ status: newStatus }).eq('id', id)
    setEvents(ev => ev.map(e => e.id===id ? { ...e, status:newStatus } : e))
    setActioning(null)
  }

  async function deleteEvent(id: string, title: string) {
    if (!confirm(`⚠️ حذف "${title}" بشكل نهائي؟\nسيتم حذف جميع التسجيلات المرتبطة.`)) return
    setActioning(id)
    await sb.from('events').delete().eq('id', id)
    setEvents(ev => ev.filter(e => e.id!==id))
    setActioning(null)
  }

  const filtered = events.filter(e => {
    const matchSearch = !search || e.title?.toLowerCase().includes(search.toLowerCase()) || e.location?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter==='all' || e.status===statusFilter
    return matchSearch && matchStatus
  })

  const statusConf: Record<string,{label:string;bg:string;color:string}> = {
    published: { label:'منشور',  bg:'#DCFCE7', color:C.green },
    draft:     { label:'مسودة',  bg:'#F3F4F6', color:C.muted },
    cancelled: { label:'ملغي',   bg:'#FEE2E2', color:C.red   },
  }

  return (
    <div style={{ padding:'28px 32px', direction:'rtl' }}>
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontSize:22, fontWeight:800, color:C.navy, margin:'0 0 4px' }}>🎪 إدارة الفعاليات</h1>
        <p style={{ color:C.muted, fontSize:13, margin:0 }}>جميع الفعاليات عبر المنصة — {events.length} فعالية</p>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>
        {[
          { label:'الإجمالي',  val:events.length, color:C.navy },
          { label:'منشور',     val:events.filter(e=>e.status==='published').length, color:C.green },
          { label:'مسودة',     val:events.filter(e=>e.status==='draft').length, color:C.muted },
          { label:'إجمالي التسجيلات', val:events.reduce((s,e)=>s+(e.reg_count||0),0), color:C.orange },
        ].map(({ label, val, color }) => (
          <div key={label} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:'14px 16px' }}>
            <div style={{ fontSize:22, fontWeight:800, color }}>{val.toLocaleString('ar-SA')}</div>
            <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:12, marginBottom:18 }}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 بحث بالاسم أو الموقع..."
          style={{ padding:'9px 13px', border:`1px solid ${C.border}`, borderRadius:8, fontSize:13, outline:'none', background:C.card, fontFamily:'inherit', flex:1, maxWidth:300 }}/>
        <div style={{ display:'flex', gap:6 }}>
          {['all','published','draft','cancelled'].map(s => (
            <button key={s} onClick={()=>setStatusFilter(s)} style={{
              padding:'7px 14px', border:`1px solid ${statusFilter===s?C.navy:C.border}`,
              borderRadius:7, cursor:'pointer', fontWeight:600, fontSize:11, fontFamily:'inherit',
              background:statusFilter===s?C.navy:C.card, color:statusFilter===s?'#fff':C.muted,
            }}>{s==='all'?'الكل':statusConf[s]?.label||s}</button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ textAlign:'center', padding:60, color:C.muted }}>⏳ جاري التحميل...</div>
      ) : (
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, overflow:'hidden' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
            <thead>
              <tr style={{ background:'#F8F7FA', borderBottom:`1px solid ${C.border}` }}>
                {['الفعالية','الحالة','تاريخ البداية','التسجيلات','الطاقة','الإجراءات'].map(h => (
                  <th key={h} style={{ padding:'11px 14px', textAlign:'right', fontWeight:600, color:C.muted, fontSize:11 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length===0 ? (
                <tr><td colSpan={6} style={{ padding:'40px 14px', textAlign:'center', color:C.muted }}>لا توجد فعاليات</td></tr>
              ) : filtered.map((ev, i) => {
                const conf = statusConf[ev.status] || statusConf.draft
                return (
                  <tr key={ev.id} style={{ borderBottom:i<filtered.length-1?`1px solid ${C.border}`:'none', opacity:actioning===ev.id?0.5:1 }}>
                    <td style={{ padding:'12px 14px' }}>
                      <p style={{ fontSize:13, fontWeight:600, color:C.text, margin:'0 0 2px', maxWidth:220, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{ev.title}</p>
                      <p style={{ fontSize:11, color:C.muted, margin:0 }}>{ev.location||'—'} {ev.category?`· ${ev.category}`:''}</p>
                    </td>
                    <td style={{ padding:'12px 14px' }}>
                      <span style={{ fontSize:11, fontWeight:600, padding:'3px 9px', borderRadius:50, background:conf.bg, color:conf.color }}>{conf.label}</span>
                    </td>
                    <td style={{ padding:'12px 14px', fontSize:12, color:C.muted }}>
                      {ev.start_date ? new Date(ev.start_date).toLocaleDateString('ar-SA') : '—'}
                    </td>
                    <td style={{ padding:'12px 14px' }}>
                      <span style={{ fontWeight:700, color:C.orange }}>{ev.reg_count||0}</span>
                      {ev.capacity && <span style={{ color:C.muted, fontSize:11 }}> / {ev.capacity}</span>}
                    </td>
                    <td style={{ padding:'12px 14px', fontSize:12, color:C.muted }}>
                      {ev.capacity||'غير محدود'}
                    </td>
                    <td style={{ padding:'12px 14px' }}>
                      <div style={{ display:'flex', gap:6 }}>
                        <select value={ev.status} onChange={e=>changeStatus(ev.id,e.target.value)} disabled={actioning===ev.id}
                          style={{ padding:'4px 8px', border:`1px solid ${C.border}`, borderRadius:6, fontSize:11, fontFamily:'inherit', cursor:'pointer', background:C.card }}>
                          <option value="published">نشر</option>
                          <option value="draft">مسودة</option>
                          <option value="cancelled">إلغاء</option>
                        </select>
                        <button onClick={()=>deleteEvent(ev.id,ev.title)} disabled={actioning===ev.id}
                          style={{ padding:'4px 8px', background:'#FEE2E2', color:C.red, border:'none', borderRadius:6, cursor:'pointer', fontSize:11 }}>🗑</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
