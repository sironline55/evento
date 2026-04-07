'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import Link from 'next/link'

const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

const C = {
  navy:'#1E0A3C', orange:'#F05537', text:'#39364F',
  muted:'#6F7287', border:'#DBDAE3', bg:'#FAFAFA', card:'#FFFFFF'
}

const STATUS_CONFIG: Record<string,{label:string;bg:string;color:string}> = {
  pending:   {label:'قيد الانتظار', bg:'#FFF8E8', color:'#B07000'},
  confirmed: {label:'مؤكد',         bg:'#E8F8F0', color:'#1A7A4A'},
  attended:  {label:'حضر',          bg:'#E8F0F8', color:'#1A4A7A'},
  cancelled: {label:'ملغي',         bg:'#FEF2F2', color:'#DC2626'},
}

export default function AttendeesPage() {
  const [regs, setRegs]       = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [filter, setFilter]   = useState('all')

  useEffect(() => {
    sb.from('registrations')
      .select('id,guest_name,guest_email,guest_phone,status,created_at,event_id,events(title)')
      .order('created_at', { ascending: false })
      .limit(200)
      .then(({ data }) => { setRegs(data || []); setLoading(false) })
  }, [])

  const filtered = regs.filter(r => {
    const matchSearch = !search
      || r.guest_name?.toLowerCase().includes(search.toLowerCase())
      || r.guest_email?.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || r.status === filter
    return matchSearch && matchFilter
  })

  return (
    <div style={{ minHeight:'100vh', background:C.bg, direction:'rtl' }}>
      {/* Header */}
      <div style={{ background:C.card, borderBottom:`1px solid ${C.border}`, padding:'24px 32px 0' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <div>
            <h1 style={{ fontSize:40, fontWeight:800, margin:0, color:C.navy, letterSpacing:'-1px' }}>الزوار</h1>
            <p style={{ color:C.muted, fontSize:13, marginTop:4 }}>{regs.length} تسجيل إجمالاً</p>
          </div>
        </div>
        {/* Tabs */}
        <div style={{ display:'flex' }}>
          {[['all','الكل'],['pending','قيد الانتظار'],['confirmed','مؤكد'],['attended','حضر'],['cancelled','ملغي']].map(([v,l])=>(
            <button key={v} onClick={()=>setFilter(v)} style={{
              padding:'10px 18px', background:'none', border:'none', cursor:'pointer', fontSize:13,
              fontWeight:filter===v?700:400,
              color:filter===v?C.orange:C.muted,
              borderBottom:filter===v?`2px solid ${C.orange}`:'2px solid transparent',
              transition:'all 0.15s', marginBottom:-1
            }}>{l} {v!=='all'&&`(${regs.filter(r=>r.status===v).length})`}</button>
          ))}
        </div>
      </div>

      {/* Search */}
      <div style={{ background:C.card, padding:'10px 32px', borderBottom:`1px solid ${C.border}` }}>
        <input value={search} onChange={e=>setSearch(e.target.value)}
          placeholder="🔍 بحث باسم الزائر أو البريد..."
          style={{ padding:'8px 14px', border:`1px solid ${C.border}`, borderRadius:6, fontSize:13,
            outline:'none', background:C.bg, fontFamily:'inherit', color:C.text, width:280 }}/>
      </div>

      {/* Table */}
      <div style={{ padding:'0 32px 40px' }}>
        {loading ? (
          <div style={{ textAlign:'center', padding:'80px 0', color:C.muted }}>جاري التحميل...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign:'center', padding:'60px 0' }}>
            <div style={{ fontSize:56, marginBottom:16 }}>👥</div>
            <h2 style={{ fontSize:20, fontWeight:700, color:C.navy, margin:'0 0 8px' }}>لا يوجد زوار بعد</h2>
            <p style={{ color:C.muted }}>سيظهر المسجلون هنا بعد إضافة فعاليات</p>
          </div>
        ) : (
          <>
            <div style={{ display:'grid', gridTemplateColumns:'2fr 2fr 1fr 1fr 100px',
              padding:'10px 16px', fontSize:11, fontWeight:700, color:C.muted,
              letterSpacing:'0.06em', textTransform:'uppercase',
              borderBottom:`1px solid ${C.border}`, marginTop:8 }}>
              <span>الاسم</span><span>البريد / الهاتف</span><span>الفعالية</span><span>التاريخ</span><span>الحالة</span>
            </div>
            {filtered.map((r,i) => {
              const s = STATUS_CONFIG[r.status] || STATUS_CONFIG.pending
              return (
                <div key={r.id} style={{ display:'grid', gridTemplateColumns:'2fr 2fr 1fr 1fr 100px',
                  padding:'13px 16px', alignItems:'center',
                  borderBottom:`1px solid ${C.border}`, background:C.card,
                  transition:'background 0.12s', cursor:'default' }}
                  onMouseEnter={e=>(e.currentTarget.style.background='#F8F7FA')}
                  onMouseLeave={e=>(e.currentTarget.style.background=C.card)}>
                  <div>
                    <p style={{ fontWeight:700, fontSize:14, margin:0, color:C.navy }}>{r.guest_name||'—'}</p>
                  </div>
                  <div>
                    <p style={{ fontSize:12, color:C.text, margin:0 }}>{r.guest_email||'—'}</p>
                    {r.guest_phone && <p style={{ fontSize:11, color:C.muted, margin:'2px 0 0' }}>{r.guest_phone}</p>}
                  </div>
                  <div style={{ fontSize:12, color:C.muted }}>
                    {(r.events as any)?.title || '—'}
                  </div>
                  <div style={{ fontSize:11, color:C.muted }}>
                    {r.created_at ? new Date(r.created_at).toLocaleDateString('ar-SA') : '—'}
                  </div>
                  <span style={{ display:'inline-block', padding:'3px 10px', borderRadius:4,
                    fontSize:11, fontWeight:600, background:s.bg, color:s.color }}>
                    {s.label}
                  </span>
                </div>
              )
            })}
          </>
        )}
      </div>
    </div>
  )
}
