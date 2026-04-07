'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useParams } from 'next/navigation'
import Link from 'next/link'


const C = {
  navy:'#1E0A3C', orange:'#F05537', text:'#39364F',
  muted:'#6F7287', border:'#DBDAE3', bg:'#FAFAFA', card:'#FFFFFF', green:'#3A7D0A'
}

const STATUS_CONFIG: Record<string,{label:string;color:string;bg:string}> = {
  pending:   { label:'منتظر', color:'#B07000', bg:'#FFF8E8' },
  confirmed: { label:'مؤكد',  color:'#3A7D0A', bg:'#EAF7E0' },
  attended:  { label:'حضر',   color:'#1A4A7A', bg:'#E8F0F8' },
  cancelled: { label:'ملغي',  color:'#DC2626', bg:'#FEF2F2' },
}

export default function AttendeesClient() {
  const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const { id } = useParams()
  const [regs, setRegs]       = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [filter, setFilter]   = useState('all')

  useEffect(() => {
    if (!id) return
    sb.from('registrations')
      .select('id,guest_name,guest_email,guest_phone,status,created_at,qr_code')
      .eq('event_id', id)
      .order('created_at', { ascending: false })
      .then(({ data }) => { setRegs(data || []); setLoading(false) })
  }, [id])

  async function checkIn(regId: string) {
  const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    await sb.from('registrations')
      .update({ status: 'attended', checked_in_at: new Date().toISOString() })
      .eq('id', regId)
    setRegs(r => r.map(x => x.id === regId ? { ...x, status: 'attended' } : x))
  }

  function exportCSV() {
  const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    const rows = [
      ['الاسم','البريد','الهاتف','الحالة','التسجيل'],
      ...regs.map(r=>[r.guest_name||'',r.guest_email||'',r.guest_phone||'',r.status||'',r.created_at?.substring(0,10)||''])
    ]
    const csv = '\uFEFF' + rows.map(r=>r.join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}))
    a.download = `attendees_${id}.csv`; a.click()
  }

  const filtered = regs.filter(r => {
    const ms = !search || r.guest_name?.toLowerCase().includes(search.toLowerCase()) || r.guest_email?.toLowerCase().includes(search.toLowerCase())
    const mf = filter === 'all' || r.status === filter
    return ms && mf
  })

  return (
    <div style={{ minHeight:'100vh', background:C.bg, direction:'rtl' }}>
      {/* Header */}
      <div style={{ background:C.card, borderBottom:`1px solid ${C.border}`, padding:'20px 28px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <Link href={`/events/${id}`} style={{ color:C.muted, textDecoration:'none', fontSize:13 }}>← الفعالية</Link>
            <span style={{ color:C.border }}>/</span>
            <h1 style={{ fontSize:20, fontWeight:800, margin:0, color:C.navy }}>الزوار المسجلون</h1>
          </div>
          <button onClick={exportCSV} style={{ padding:'7px 16px', border:`1px solid ${C.border}`, borderRadius:6, background:C.card, color:C.text, fontWeight:600, fontSize:13, cursor:'pointer' }}>
            ⬇️ تصدير CSV
          </button>
        </div>
        <p style={{ color:C.muted, fontSize:13, margin:0 }}>{regs.length} مسجّل إجمالاً</p>
      </div>

      {/* Filters */}
      <div style={{ background:C.card, borderBottom:`1px solid ${C.border}`, padding:'10px 28px', display:'flex', gap:12, flexWrap:'wrap', alignItems:'center' }}>
        <input value={search} onChange={e=>setSearch(e.target.value)}
          placeholder="🔍 بحث بالاسم أو البريد..."
          style={{ padding:'7px 12px', border:`1px solid ${C.border}`, borderRadius:6, fontSize:13, outline:'none', fontFamily:'inherit', color:C.text, background:C.bg, minWidth:220 }}/>
        <div style={{ display:'flex', gap:6 }}>
          {[['all','الكل'],['pending','منتظر'],['confirmed','مؤكد'],['attended','حضر'],['cancelled','ملغي']].map(([v,l])=>(
            <button key={v} onClick={()=>setFilter(v)} style={{
              padding:'5px 13px', borderRadius:50, border:`1px solid ${filter===v?C.orange:C.border}`,
              background:filter===v?'#FEF0ED':C.card, color:filter===v?C.orange:C.text,
              fontSize:12, fontWeight:600, cursor:'pointer'
            }}>{l} {v!=='all'?`(${regs.filter(r=>r.status===v).length})`:''}</button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={{ padding:'20px 28px' }}>
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:8, overflow:'hidden' }}>
          <div style={{ display:'grid', gridTemplateColumns:'2fr 2fr 1fr 1fr 120px', padding:'9px 16px', fontSize:11, fontWeight:700, color:C.muted, letterSpacing:'0.06em', textTransform:'uppercase', background:'#F9F8F6', borderBottom:`1px solid ${C.border}` }}>
            <span>الاسم</span><span>التواصل</span><span>الحالة</span><span>التسجيل</span><span>إجراء</span>
          </div>

          {loading ? (
            <div style={{ padding:'40px', textAlign:'center', color:C.muted }}>جاري التحميل...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding:'40px', textAlign:'center', color:C.muted }}>
              <p style={{ fontSize:36, margin:'0 0 8px' }}>👥</p>
              <p>{search||filter!=='all'?'لا توجد نتائج':'لا يوجد مسجلون بعد'}</p>
            </div>
          ) : filtered.map((r, i) => {
            const s = STATUS_CONFIG[r.status] || STATUS_CONFIG.pending
            return (
              <div key={r.id} style={{ display:'grid', gridTemplateColumns:'2fr 2fr 1fr 1fr 120px', padding:'11px 16px', alignItems:'center', borderBottom:i<filtered.length-1?`1px solid ${C.border}`:'none', transition:'background 0.12s' }}
                onMouseEnter={e=>(e.currentTarget.style.background='#F8F7FA')}
                onMouseLeave={e=>(e.currentTarget.style.background='transparent')}>
                <p style={{ fontWeight:700, fontSize:14, margin:0, color:C.navy }}>{r.guest_name||'—'}</p>
                <div>
                  <p style={{ fontSize:12, color:C.text, margin:0 }}>{r.guest_email||'—'}</p>
                  {r.guest_phone && <p style={{ fontSize:11, color:C.muted, margin:'2px 0 0' }}>{r.guest_phone}</p>}
                </div>
                <span style={{ display:'inline-block', padding:'3px 10px', borderRadius:4, fontSize:11, fontWeight:600, background:s.bg, color:s.color }}>{s.label}</span>
                <span style={{ fontSize:11, color:C.muted }}>{r.created_at?new Date(r.created_at).toLocaleDateString('ar-SA'):'—'}</span>
                <div>
                  {r.status !== 'attended' ? (
                    <button onClick={()=>checkIn(r.id)} style={{ padding:'5px 12px', border:'none', borderRadius:6, background:'#EAF7E0', color:C.green, fontWeight:700, fontSize:11, cursor:'pointer' }}>
                      ✓ تسجيل حضور
                    </button>
                  ) : (
                    <span style={{ fontSize:11, color:C.green, fontWeight:600 }}>✅ حضر</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        {filtered.length > 0 && (
          <p style={{ fontSize:12, color:C.muted, textAlign:'center', marginTop:10 }}>
            {filtered.length} من {regs.length} مسجّل
          </p>
        )}
      </div>
    </div>
  )
}
