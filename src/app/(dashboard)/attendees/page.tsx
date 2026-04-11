'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState, useMemo } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import Link from 'next/link'
import Pagination from '@/components/ui/Pagination'


const C = {
  navy:'#1E0A3C', orange:'#F05537', text:'#39364F',
  muted:'#6F7287', border:'#DBDAE3', bg:'#FAFAFA', card:'#FFFFFF'
}

const STATUS_CONFIG: Record<string,{label:string;bg:string;color:string}> = {
  registered: {label:'مسجل',           bg:'#EDE9F7', color:'#7B4FBF'},
  pending:    {label:'قيد الانتظار',   bg:'#FFF8E8', color:'#B07000'},
  waitlisted: {label:'قائمة الانتظار',bg:'#E6F1FB', color:'#185FA5'},
  confirmed:  {label:'مؤكد',           bg:'#E8F8F0', color:'#1A7A4A'},
  attended:   {label:'حضر',            bg:'#EAF7E0', color:'#166534'},
  cancelled:  {label:'ملغي',           bg:'#FEF2F2', color:'#DC2626'},
  no_show:    {label:'غائب',           bg:'#F8F7FA', color:'#6F7287'},
}

export default function AttendeesPage() {
  const sb = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), [])

  const [regs,     setRegs]     = useState<any[]>([])
  const [events,   setEvents]   = useState<any[]>([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')
  const [filter,   setFilter]   = useState('all')
  const [eventFilter, setEventFilter] = useState('all')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkLoading, setBulkLoading] = useState(false)
  const [page, setPage] = useState(1)
  const PER_PAGE = 50
  const [toast,    setToast]    = useState<{msg:string;type:string}|null>(null)

  function showToast(msg: string, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  useEffect(() => {
    async function load() {
      const [{ data: rs }, { data: evs }] = await Promise.all([
        sb.from('registrations')
          .select('id,guest_name,guest_email,guest_phone,status,created_at,qr_code,ticket_type,event_id,events(id,title)')
          .order('created_at', { ascending: false })
          .limit(500),
        sb.from('events').select('id,title').eq('status','published').order('start_date', { ascending:false })
      ])
      setRegs(rs || [])
      setEvents(evs || [])
      setLoading(false)
    }
    load()
  }, [])

  const filtered = useMemo(() => regs.filter(r => {
    const matchSearch = !search
      || r.guest_name?.toLowerCase().includes(search.toLowerCase())
      || r.guest_email?.toLowerCase().includes(search.toLowerCase())
      || r.guest_phone?.includes(search)
      || r.qr_code?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filter === 'all' || r.status === filter
    const matchEvent  = eventFilter === 'all' || r.event_id === eventFilter
    return matchSearch && matchStatus && matchEvent
  }), [regs, search, filter, eventFilter])

  // ── CSV Export ──
  function exportCSV() {
    const headers = ['الاسم','البريد الإلكتروني','الجوال','الفعالية','الحالة','نوع التذكرة','رمز QR','تاريخ التسجيل']
    const rows = filtered.map(r => [
      r.guest_name || '',
      r.guest_email || '',
      r.guest_phone || '',
      (r.events as any)?.title || '',
      STATUS_CONFIG[r.status]?.label || r.status,
      r.ticket_type || '',
      r.qr_code || '',
      r.created_at ? new Date(r.created_at).toLocaleDateString('ar-SA') : ''
    ])
    const csv = [headers, ...rows].map(row =>
      row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = `attendees-${new Date().toISOString().slice(0,10)}.csv`; a.click()
    URL.revokeObjectURL(url)
    showToast(`تم تصدير ${filtered.length} سجل كـ CSV`)
  }

  // ── Selection ──
  function toggleSelect(id: string) {
    setSelected(prev => {
      const n = new Set(prev)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  }
  function toggleAll() {
    if (selected.size === filtered.length) { setSelected(new Set()); return }
    setSelected(new Set(filtered.map(r => r.id)))
  }

  // ── Bulk status update ──
  async function bulkUpdate(newStatus: string) {
    if (!selected.size) return
    setBulkLoading(true)
    const ids = Array.from(selected)
    const { error } = await sb.from('registrations').update({ status: newStatus }).in('id', ids)
    if (!error) {
      setRegs(prev => prev.map(r => selected.has(r.id) ? { ...r, status: newStatus } : r))
      setSelected(new Set())
      showToast(`تم تحديث ${ids.length} سجل إلى "${STATUS_CONFIG[newStatus]?.label || newStatus}"`)
    } else {
      showToast('حدث خطأ في التحديث', 'error')
    }
    setBulkLoading(false)
  }

  // ── Promote from waitlist ──
  async function promoteWaitlisted(regId: string) {
    const { error } = await sb.from('registrations').update({ status: 'registered' }).eq('id', regId)
    if (!error) {
      setRegs(prev => prev.map(r => r.id === regId ? { ...r, status: 'registered' } : r))
      showToast('تم ترقية المسجل من قائمة الانتظار ✅')
    }
  }

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: regs.length }
    regs.forEach(r => { c[r.status] = (c[r.status] || 0) + 1 })
    return c
  }, [regs])

  const paginated = useMemo(() =>
    filtered.slice((page-1)*PER_PAGE, page*PER_PAGE), [filtered, page, PER_PAGE])

  // Reset page on filter change
  const prevFilter = useMemo(() => { setPage(1); return filter }, [filter, search, eventFilter])

  const toastColors: Record<string,{bg:string;color:string;border:string}> = {
    success: { bg:'#EAF7E0', color:'#166534', border:'#9DE07B' },
    error:   { bg:'#FEF2F2', color:'#DC2626', border:'#FECACA' },
  }

  return (
    <div style={{ minHeight:'100vh', background:C.bg, direction:'rtl', fontFamily:'Tajawal,sans-serif' }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position:'fixed', top:20, left:'50%', transform:'translateX(-50%)',
          zIndex:9999, padding:'12px 24px', borderRadius:12, fontWeight:700, fontSize:14,
          ...toastColors[toast.type] || toastColors.success,
          border:`1px solid`, boxShadow:'0 8px 24px rgba(0,0,0,.12)',
          animation:'toastIn .25s ease'
        }}>
          {toast.msg}
        </div>
      )}
      <style>{`@keyframes toastIn{from{opacity:0;transform:translateX(-50%) translateY(-10px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}`}</style>

      {/* Header */}
      <div style={{ background:C.card, borderBottom:`1px solid ${C.border}`, padding:'20px 28px 0' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16, flexWrap:'wrap', gap:10 }}>
          <div>
            <h1 style={{ fontSize:26, fontWeight:800, margin:0, color:C.navy }}>الحضور والتسجيلات</h1>
            <p style={{ color:C.muted, fontSize:13, marginTop:3 }}>
              {regs.length} تسجيل · {regs.filter(r=>r.status==='attended').length} حضر فعلاً
            </p>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={exportCSV} style={{
              padding:'9px 18px', background:'#F8F7FA', border:`1px solid ${C.border}`,
              borderRadius:9, fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit', color:C.navy,
              display:'flex', alignItems:'center', gap:6
            }}>📥 تصدير CSV ({filtered.length})</button>
          </div>
        </div>

        {/* Filters row */}
        <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:12, flexWrap:'wrap' }}>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="🔍 بحث بالاسم أو البريد أو الجوال..."
            style={{ padding:'8px 14px', border:`1px solid ${C.border}`, borderRadius:8, fontSize:13,
              outline:'none', background:C.bg, fontFamily:'inherit', color:C.text, minWidth:240 }}/>
          <select value={eventFilter} onChange={e => setEventFilter(e.target.value)}
            style={{ padding:'8px 12px', border:`1px solid ${C.border}`, borderRadius:8, fontSize:13,
              background:'#fff', fontFamily:'inherit', color:C.navy, cursor:'pointer' }}>
            <option value="all">كل الفعاليات</option>
            {events.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
          </select>
        </div>

        {/* Status tabs */}
        <div style={{ display:'flex', gap:0, overflowX:'auto' }}>
          {[['all','الكل'],['registered','مسجل'],['waitlisted','انتظار'],['attended','حضر'],['cancelled','ملغي'],['no_show','غائب']].map(([v,l]) => (
            <button key={v} onClick={() => setFilter(v)} style={{
              padding:'9px 16px', background:'none', border:'none', cursor:'pointer', fontSize:13,
              fontWeight: filter===v ? 700 : 400, color: filter===v ? C.orange : C.muted,
              borderBottom: filter===v ? `2px solid ${C.orange}` : '2px solid transparent',
              whiteSpace:'nowrap'
            }}>{l} ({counts[v] || 0})</button>
          ))}
        </div>
      </div>

      {/* Bulk actions bar */}
      {selected.size > 0 && (
        <div style={{ background:'#1E0A3C', padding:'12px 28px', display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
          <span style={{ color:'rgba(255,255,255,.8)', fontSize:13, fontWeight:600 }}>
            {selected.size} محدد
          </span>
          <div style={{ display:'flex', gap:8 }}>
            {[
              { status:'attended', label:'✅ سجّل الحضور', bg:'#EAF7E0', color:'#166534' },
              { status:'cancelled', label:'❌ إلغاء',       bg:'#FEF2F2', color:'#DC2626' },
              { status:'no_show',   label:'⚠️ غائب',        bg:'#FFF8E8', color:'#854F0B' },
            ].map(b => (
              <button key={b.status} onClick={() => bulkUpdate(b.status)} disabled={bulkLoading}
                style={{ padding:'6px 14px', background:b.bg, color:b.color, border:'none', borderRadius:8,
                  fontWeight:700, fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>
                {b.label}
              </button>
            ))}
            <button onClick={() => setSelected(new Set())}
              style={{ padding:'6px 12px', background:'rgba(255,255,255,.15)', color:'#fff', border:'none',
                borderRadius:8, fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>
              إلغاء التحديد
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div style={{ padding:'0 28px 40px' }}>
        {loading ? (
          <div style={{ textAlign:'center', padding:'60px 0', color:C.muted }}>جاري التحميل...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign:'center', padding:'60px 0' }}>
            <div style={{ fontSize:48, marginBottom:12 }}>👥</div>
            <p style={{ fontSize:16, fontWeight:700, color:C.navy, margin:'0 0 4px' }}>لا نتائج</p>
            <p style={{ color:C.muted, fontSize:13 }}>غيّر فلتر البحث</p>
          </div>
        ) : (
          <>
            {/* Table header */}
            <div style={{ display:'grid', gridTemplateColumns:'36px 2fr 2fr 1.5fr 1fr 100px 90px',
              padding:'10px 14px', fontSize:11, fontWeight:700, color:C.muted,
              textTransform:'uppercase', borderBottom:`1px solid ${C.border}`, marginTop:8 }}>
              <input type="checkbox"
                checked={selected.size === filtered.length && filtered.length > 0}
                onChange={toggleAll} style={{ cursor:'pointer' }}/>
              <span>الاسم</span><span>التواصل</span><span>الفعالية</span>
              <span>التاريخ</span><span>الحالة</span><span style={{ textAlign:'center' }}>تذكرة</span>
            </div>

            {/* Rows */}
            {paginated.map((r, i) => {
              const s = STATUS_CONFIG[r.status] || STATUS_CONFIG.registered
              const isSelected = selected.has(r.id)
              return (
                <div key={r.id} style={{
                  display:'grid', gridTemplateColumns:'36px 2fr 2fr 1.5fr 1fr 100px 90px',
                  padding:'12px 14px', alignItems:'center',
                  borderBottom:`1px solid ${C.border}`,
                  background: isSelected ? '#F0EDFC' : i%2===0 ? C.card : '#FAFAFA',
                  transition:'background .1s'
                }}>
                  <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(r.id)} style={{ cursor:'pointer' }}/>

                  <div>
                    <p style={{ fontWeight:700, fontSize:14, margin:0, color:C.navy }}>{r.guest_name || '—'}</p>
                    {r.ticket_type && <p style={{ fontSize:11, color:C.muted, margin:'2px 0 0' }}>{r.ticket_type}</p>}
                  </div>

                  <div>
                    {r.guest_email && <p style={{ fontSize:12, color:C.text, margin:0 }}>{r.guest_email}</p>}
                    {r.guest_phone && (
                      <a href={`https://wa.me/${r.guest_phone.replace(/\D/g,'')}`} target="_blank"
                        style={{ fontSize:11, color:'#25D366', textDecoration:'none', margin:'2px 0 0', display:'block' }}>
                        {r.guest_phone}
                      </a>
                    )}
                  </div>

                  <div style={{ fontSize:12, color:C.muted, lineHeight:1.4 }}>
                    {(r.events as any)?.title || '—'}
                  </div>

                  <div style={{ fontSize:11, color:C.muted }}>
                    {r.created_at ? new Date(r.created_at).toLocaleDateString('ar-SA') : '—'}
                  </div>

                  <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                    <span style={{ display:'inline-block', padding:'3px 8px', borderRadius:6,
                      fontSize:11, fontWeight:600, background:s.bg, color:s.color }}>
                      {s.label}
                    </span>
                    {r.status === 'waitlisted' && (
                      <button onClick={() => promoteWaitlisted(r.id)}
                        style={{ fontSize:10, padding:'2px 6px', background:'#EAF7E0', color:'#166534',
                          border:'1px solid #9DE07B', borderRadius:4, cursor:'pointer', fontFamily:'inherit', fontWeight:700 }}>
                        ترقية ↑
                      </button>
                    )}
                  </div>

                  <div style={{ textAlign:'center' }}>
                    {r.qr_code ? (
                      <a href={`/ticket/${r.qr_code}`} target="_blank" rel="noopener"
                        style={{ display:'inline-block', padding:'4px 10px', background:'#FEF0ED',
                          border:'1px solid #F05537', borderRadius:6, color:'#F05537',
                          fontSize:11, fontWeight:700, textDecoration:'none' }}>
                        🎫
                      </a>
                    ) : <span style={{ fontSize:11, color:'#DBDAE3' }}>—</span>}
                  </div>
                </div>
              )
            })}
          </>
        )}
        {/* Pagination */}
        <Pagination total={filtered.length} page={page} perPage={PER_PAGE} onPage={setPage}/>
      </div>
    </div>
  )
}
