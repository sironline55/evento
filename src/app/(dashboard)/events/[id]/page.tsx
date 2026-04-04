'use client'
import { useEffect, useState, useRef } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

const sb = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const C = {
  navy:'#1E0A3C', orange:'#F05537', text:'#39364F',
  muted:'#6F7287', border:'#DBDAE3', bg:'#FAFAFA', card:'#FFFFFF', green:'#3A7D0A'
}

const STATUS_CONFIG: Record<string,{label:string;color:string;bg:string}> = {
  draft:     { label:'مسودة',  color:'#6F7287', bg:'#F8F7FA' },
  published: { label:'نشط',   color:'#3A7D0A', bg:'#EAF7E0' },
  active:    { label:'نشط',   color:'#3A7D0A', bg:'#EAF7E0' },
  completed: { label:'منتهي', color:'#6F7287', bg:'#F8F7FA' },
  cancelled: { label:'ملغي',  color:'#C6341A', bg:'#FDEDEA' },
}

const REG_STATUS: Record<string,{label:string;color:string;bg:string}> = {
  pending:   { label:'منتظر', color:'#B07000', bg:'#FFF8E8' },
  confirmed: { label:'مؤكد',  color:'#3A7D0A', bg:'#EAF7E0' },
  attended:  { label:'حضر',   color:'#1A4A7A', bg:'#E8F0F8' },
  cancelled: { label:'ملغي',  color:'#DC2626', bg:'#FEF2F2' },
}

const TABS = [
  { id:'overview',   label:'نظرة عامة', icon:'📋' },
  { id:'attendees',  label:'الزوار',    icon:'👥' },
  { id:'scanner',    label:'الماسح',    icon:'📷' },
  { id:'analytics',  label:'الإحصاءات', icon:'📊' },
  { id:'settings',   label:'الإعدادات', icon:'⚙️' },
]

export default function EventDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const scanRef = useRef<HTMLInputElement>(null)

  const [event, setEvent]             = useState<any>(null)
  const [registrations, setRegs]      = useState<any[]>([])
  const [count, setCount]             = useState(0)
  const [loading, setLoading]         = useState(true)
  const [tab, setTab]                 = useState('overview')
  const [search, setSearch]           = useState('')
  const [regFilter, setRegFilter]     = useState('all')
  const [copied, setCopied]           = useState(false)
  const [publishLoading, setPublishLoading] = useState(false)

  // Scanner state
  const [qrInput, setQrInput]   = useState('')
  const [scanResult, setScanResult] = useState<{type:string;msg:string;name?:string}|null>(null)
  const [scanLoading, setScanLoading] = useState(false)
  const [scanHistory, setScanHistory] = useState<{name:string;time:string;type:string}[]>([])

  // Settings state
  const [newStatus, setNewStatus] = useState('')
  const [saving, setSaving] = useState(false)

  const regLink = typeof window !== 'undefined' ? `${window.location.origin}/r/${id}` : ''

  useEffect(() => {
    if (!id) return
    loadData()
  }, [id])

  async function loadData() {
    const [{ data: ev }, { data: regs }, { count: c }] = await Promise.all([
      sb.from('events').select('*').eq('id', id).single(),
      sb.from('registrations').select('id,guest_name,guest_email,guest_phone,status,created_at,qr_code').eq('event_id', id).order('created_at', { ascending: false }),
      sb.from('registrations').select('*', { count: 'exact', head: true }).eq('event_id', id),
    ])
    setEvent(ev)
    setRegs(regs || [])
    setCount(c || 0)
    setNewStatus(ev?.status || 'draft')
    setLoading(false)
  }

  async function copyRegLink() {
    await navigator.clipboard.writeText(regLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function exportCSV() {
    const rows = [
      ['الاسم','البريد الإلكتروني','الهاتف','الحالة','تاريخ التسجيل'],
      ...registrations.map(r => [r.guest_name||'', r.guest_email||'', r.guest_phone||'', r.status||'', r.created_at?.substring(0,10)||''])
    ]
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob(['\uFEFF'+csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `${event?.title}_زوار.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function checkIn(regId: string, name: string) {
    await sb.from('registrations').update({ status:'attended', checked_in_at: new Date().toISOString() }).eq('id', regId)
    setRegs(r => r.map(x => x.id === regId ? { ...x, status:'attended' } : x))
  }

  async function handleScan() {
    const code = qrInput.trim(); if (!code || scanLoading) return
    setScanLoading(true); setScanResult(null)
    try {
      const { data: reg } = await sb.from('registrations')
        .select('id,guest_name,status').eq('qr_code', code).eq('event_id', id).single()
      if (!reg) {
        setScanResult({ type:'error', msg:'لم يُعثر على هذا الرمز في هذه الفعالية' })
      } else if (reg.status === 'attended') {
        setScanResult({ type:'warning', msg:'تم التحقق مسبقاً', name: reg.guest_name })
      } else {
        await sb.from('registrations').update({ status:'attended', checked_in_at: new Date().toISOString() }).eq('id', reg.id)
        setScanResult({ type:'success', msg:'تم التحقق بنجاح ✓', name: reg.guest_name })
        setScanHistory(h => [{ name:reg.guest_name, time:new Date().toLocaleTimeString('ar-SA'), type:'success' }, ...h.slice(0,19)])
        setRegs(r => r.map(x => x.id === reg.id ? { ...x, status:'attended' } : x))
        setCount(c => c)
      }
    } catch { setScanResult({ type:'error', msg:'خطأ في الاتصال' }) }
    finally { setScanLoading(false); setQrInput(''); setTimeout(()=>scanRef.current?.focus(),100) }
  }

  async function saveSettings() {
    setSaving(true)
    await sb.from('events').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', id)
    setEvent((e: any) => ({ ...e, status: newStatus }))
    setSaving(false)
  }

  async function publishEvent() {
    setPublishLoading(true)
    await sb.from('events').update({ status:'published' }).eq('id', id)
    setEvent((e: any) => ({ ...e, status:'published' }))
    setNewStatus('published')
    setPublishLoading(false)
  }

  if (loading) return (
    <div style={{ padding:40, textAlign:'center', color:C.muted }}>
      <div style={{ fontSize:32 }}>⏳</div>
      <p>جاري التحميل...</p>
    </div>
  )
  if (!event) return (
    <div style={{ padding:40, textAlign:'center', color:C.muted }}>
      <p>الفعالية غير موجودة</p>
      <Link href="/events" style={{ color:C.orange }}>← العودة للفعاليات</Link>
    </div>
  )

  const s = STATUS_CONFIG[event.status] || STATUS_CONFIG.draft
  const attended = registrations.filter(r => r.status === 'attended').length
  const fillRate = event.capacity ? Math.round((count / event.capacity) * 100) : null
  const filteredRegs = registrations.filter(r => {
    const ms = !search || r.guest_name?.toLowerCase().includes(search.toLowerCase()) || r.guest_email?.toLowerCase().includes(search.toLowerCase())
    const mf = regFilter === 'all' || r.status === regFilter
    return ms && mf
  })

  const SCAN_STYLES: Record<string,{bg:string;border:string;color:string;icon:string}> = {
    success: { bg:'#EAF7E0', border:'#3A7D0A', color:'#1A5A00', icon:'✅' },
    warning: { bg:'#FFF8E8', border:'#B07000', color:'#7A5000', icon:'⚠️' },
    error:   { bg:'#FEF2F2', border:'#DC2626', color:'#B91C1C', icon:'❌' },
  }

  return (
    <div style={{ minHeight:'100vh', background:C.bg, direction:'rtl' }}>

      {/* ── Top Header ── */}
      <div style={{ background:C.card, borderBottom:`1px solid ${C.border}`, padding:'0 32px' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', height:52 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <Link href="/events" style={{ color:C.muted, textDecoration:'none', fontSize:13, fontWeight:500 }}>
              ← الفعاليات
            </Link>
            <span style={{ color:C.border }}>/</span>
            <span style={{ fontSize:13, color:C.text, fontWeight:600, maxWidth:300, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              {event.title}
            </span>
          </div>

          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            {/* Status badge */}
            <span style={{ padding:'4px 12px', borderRadius:4, fontSize:12, fontWeight:600, background:s.bg, color:s.color }}>
              {s.label}
            </span>

            {/* Publish button if draft */}
            {(event.status === 'draft') && (
              <button onClick={publishEvent} disabled={publishLoading} style={{
                padding:'7px 16px', border:'none', borderRadius:6,
                background:C.green, color:'#fff', fontWeight:700, fontSize:12, cursor:'pointer'
              }}>
                {publishLoading ? '...' : '🚀 نشر الفعالية'}
              </button>
            )}

            {/* Copy reg link */}
            <button onClick={copyRegLink} style={{
              padding:'7px 14px', border:`1px solid ${C.border}`, borderRadius:6,
              background: copied ? '#EAF7E0' : C.card, color: copied ? C.green : C.text,
              fontWeight:600, fontSize:12, cursor:'pointer', transition:'all 0.2s'
            }}>
              {copied ? '✓ تم النسخ' : '🔗 نسخ رابط التسجيل'}
            </button>

            {/* Export */}
            <button onClick={exportCSV} style={{
              padding:'7px 14px', border:`1px solid ${C.border}`, borderRadius:6,
              background:C.card, color:C.text, fontWeight:600, fontSize:12, cursor:'pointer'
            }}>
              ⬇️ تصدير CSV
            </button>

            {/* Edit event */}
            <Link href={`/events/${id}/edit`} style={{
              padding:'7px 14px', border:`1px solid ${C.border}`, borderRadius:6,
              background:C.card, color:C.text, fontWeight:600, fontSize:12,
              textDecoration:'none', display:'inline-block'
            }}>
              ✏️ تعديل
            </Link>
          </div>
        </div>

        {/* Event title */}
        <div style={{ paddingBottom:0, marginTop:4 }}>
          <h1 style={{ fontSize:32, fontWeight:800, margin:'0 0 4px', color:C.navy, letterSpacing:'-0.5px' }}>
            {event.title}
          </h1>
          <div style={{ display:'flex', gap:16, paddingBottom:0, flexWrap:'wrap' }}>
            {event.location && <span style={{ fontSize:13, color:C.muted }}>📍 {event.location}</span>}
            {event.start_date && <span style={{ fontSize:13, color:C.muted }}>📅 {new Date(event.start_date).toLocaleDateString('ar-SA', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}</span>}
            {event.category && <span style={{ fontSize:13, color:C.muted }}>🏷️ {event.category}</span>}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', marginTop:12 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding:'10px 18px', background:'none', border:'none', cursor:'pointer',
              fontSize:13, fontWeight:tab===t.id?700:400,
              color:tab===t.id?C.orange:C.muted,
              borderBottom:tab===t.id?`2px solid ${C.orange}`:'2px solid transparent',
              transition:'all 0.15s', marginBottom:-1, display:'flex', alignItems:'center', gap:6
            }}>
              <span style={{ fontSize:14 }}>{t.icon}</span>{t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Stats Bar ── */}
      <div style={{ background:C.card, borderBottom:`1px solid ${C.border}`, padding:'14px 32px' }}>
        <div style={{ display:'flex', gap:28 }}>
          {[
            { label:'إجمالي المسجلين', value:count, color:C.orange },
            { label:'حضروا',           value:attended, color:C.green },
            { label:'لم يحضروا',       value:count-attended, color:C.muted },
            { label:'الطاقة الاستيعابية', value:event.capacity||'غير محدودة', color:C.navy },
            ...(fillRate !== null ? [{ label:'نسبة الامتلاء', value:`${fillRate}%`, color:fillRate>80?'#DC2626':C.navy }] : []),
          ].map(stat => (
            <div key={stat.label} style={{ textAlign:'center', minWidth:80 }}>
              <p style={{ fontSize:22, fontWeight:800, color:stat.color, margin:0 }}>{stat.value}</p>
              <p style={{ fontSize:11, color:C.muted, margin:'2px 0 0', fontWeight:500 }}>{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Tab Content ── */}
      <div style={{ padding:'24px 32px', maxWidth:1000, margin:'0 auto' }}>

        {/* ═════ OVERVIEW TAB ═════ */}
        {tab === 'overview' && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 340px', gap:20 }}>
            <div>
              {/* Event info card */}
              <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:8, padding:24, marginBottom:16 }}>
                <h2 style={{ fontSize:16, fontWeight:700, color:C.navy, margin:'0 0 16px' }}>تفاصيل الفعالية</h2>

                {event.cover_image && (
                  <img src={event.cover_image} alt={event.title}
                    style={{ width:'100%', height:200, objectFit:'cover', borderRadius:8, marginBottom:16 }}/>
                )}

                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {[
                    { icon:'📅', label:'تاريخ البداية', val: event.start_date ? new Date(event.start_date).toLocaleDateString('ar-SA',{weekday:'long',year:'numeric',month:'long',day:'numeric',hour:'2-digit',minute:'2-digit'}) : '—' },
                    { icon:'⏰', label:'تاريخ النهاية',  val: event.end_date   ? new Date(event.end_date).toLocaleDateString('ar-SA',{weekday:'long',year:'numeric',month:'long',day:'numeric',hour:'2-digit',minute:'2-digit'}) : '—' },
                    { icon:'📍', label:'الموقع',         val: event.location || '—' },
                    { icon:'👥', label:'الطاقة الاستيعابية', val: event.capacity ? event.capacity.toLocaleString('ar') + ' شخص' : 'غير محدودة' },
                    { icon:'🏷️', label:'التصنيف',        val: [event.category, event.subcategory].filter(Boolean).join(' · ') || '—' },
                    { icon:'🔄', label:'التكرار',         val: event.is_recurring ? `متكررة — ${(event.recurrence as any)?.type||''}` : 'فعالية منفردة' },
                  ].map(({ icon, label, val }) => (
                    <div key={label} style={{ display:'flex', gap:12, padding:'8px 0', borderBottom:`1px solid ${C.border}` }}>
                      <span style={{ fontSize:16, width:20, flexShrink:0 }}>{icon}</span>
                      <span style={{ fontSize:13, color:C.muted, minWidth:130 }}>{label}</span>
                      <span style={{ fontSize:13, fontWeight:600, color:C.text }}>{val}</span>
                    </div>
                  ))}
                </div>

                {event.description && (
                  <div style={{ marginTop:16, paddingTop:16, borderTop:`1px solid ${C.border}` }}>
                    <p style={{ fontSize:13, fontWeight:600, color:C.navy, margin:'0 0 8px' }}>نبذة عن الفعالية</p>
                    <p style={{ fontSize:13, color:C.text, lineHeight:1.7, margin:0 }}>{event.description}</p>
                  </div>
                )}
              </div>

              {/* Recent attendees preview */}
              <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:8, overflow:'hidden' }}>
                <div style={{ padding:'14px 20px', borderBottom:`1px solid ${C.border}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <h2 style={{ fontSize:15, fontWeight:700, margin:0, color:C.navy }}>آخر الزوار المسجلين</h2>
                  <button onClick={() => setTab('attendees')} style={{ background:'none', border:'none', color:C.orange, fontWeight:600, fontSize:13, cursor:'pointer' }}>
                    عرض الكل ({count}) ←
                  </button>
                </div>
                {registrations.slice(0,5).length === 0 ? (
                  <div style={{ padding:'40px', textAlign:'center', color:C.muted }}>
                    <p style={{ fontSize:36, margin:'0 0 10px' }}>👥</p>
                    <p style={{ fontWeight:600, margin:'0 0 4px' }}>لا يوجد مسجلون بعد</p>
                    <p style={{ fontSize:13, margin:0 }}>شارك رابط التسجيل لبدء استقبال الزوار</p>
                  </div>
                ) : registrations.slice(0,5).map((r, i) => {
                  const rs = REG_STATUS[r.status] || REG_STATUS.pending
                  return (
                    <div key={r.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'11px 20px', borderBottom:i<4?`1px solid ${C.border}`:'none' }}>
                      <div>
                        <p style={{ fontWeight:600, fontSize:13, margin:0, color:C.navy }}>{r.guest_name}</p>
                        <p style={{ fontSize:11, color:C.muted, margin:'2px 0 0' }}>{r.guest_email||r.guest_phone||'—'}</p>
                      </div>
                      <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                        <span style={{ fontSize:11, padding:'2px 8px', borderRadius:4, fontWeight:600, background:rs.bg, color:rs.color }}>{rs.label}</span>
                        {r.status !== 'attended' && (
                          <button onClick={() => checkIn(r.id, r.guest_name)} style={{ padding:'4px 10px', border:'none', borderRadius:4, background:'#EAF7E0', color:C.green, fontWeight:600, fontSize:11, cursor:'pointer' }}>
                            تسجيل حضور
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Right panel */}
            <div>
              {/* Registration link card */}
              <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:8, padding:20, marginBottom:16 }}>
                <h3 style={{ fontSize:14, fontWeight:700, color:C.navy, margin:'0 0 12px' }}>🔗 رابط التسجيل للزوار</h3>
                <div style={{ background:C.bg, border:`1px solid ${C.border}`, borderRadius:6, padding:'8px 12px', fontSize:12, color:C.muted, wordBreak:'break-all', marginBottom:12 }}>
                  {regLink}
                </div>
                <button onClick={copyRegLink} style={{
                  width:'100%', padding:'10px', border:'none', borderRadius:6,
                  background: copied ? C.green : C.orange,
                  color:'#fff', fontWeight:700, fontSize:13, cursor:'pointer', transition:'background 0.2s'
                }}>
                  {copied ? '✓ تم نسخ الرابط' : '📋 نسخ الرابط'}
                </button>
              </div>

              {/* Quick actions */}
              <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:8, padding:20, marginBottom:16 }}>
                <h3 style={{ fontSize:14, fontWeight:700, color:C.navy, margin:'0 0 12px' }}>⚡ الإجراءات السريعة</h3>
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {[
                    { label:'📷 فتح الماسح', action:()=>setTab('scanner'), color:C.orange, fill:true },
                    { label:'👥 عرض الزوار الكامل', action:()=>setTab('attendees'), color:C.navy, fill:false },
                    { label:'📊 الإحصاءات', action:()=>setTab('analytics'), color:C.navy, fill:false },
                    { label:'⬇️ تصدير الزوار CSV', action:exportCSV, color:C.navy, fill:false },
                  ].map(({ label, action, color, fill }) => (
                    <button key={label} onClick={action} style={{
                      width:'100%', padding:'10px', border:`1px solid ${fill?color:C.border}`, borderRadius:6,
                      background: fill ? color : C.card,
                      color: fill ? '#fff' : C.text,
                      fontWeight:600, fontSize:13, cursor:'pointer', textAlign:'right'
                    }}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Online event URL */}
              {event.event_url && (
                <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:8, padding:20 }}>
                  <h3 style={{ fontSize:14, fontWeight:700, color:C.navy, margin:'0 0 10px' }}>💻 رابط البث</h3>
                  <a href={event.event_url} target="_blank" rel="noopener noreferrer"
                    style={{ color:C.orange, fontSize:13, wordBreak:'break-all' }}>
                    {event.event_url}
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═════ ATTENDEES TAB ═════ */}
        {tab === 'attendees' && (
          <div>
            {/* Filters */}
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:8, padding:'12px 16px', marginBottom:14, display:'flex', gap:12, flexWrap:'wrap', alignItems:'center' }}>
              <input value={search} onChange={e=>setSearch(e.target.value)}
                placeholder="🔍 بحث بالاسم أو البريد..."
                style={{ padding:'8px 12px', border:`1px solid ${C.border}`, borderRadius:6, fontSize:13, outline:'none', fontFamily:'inherit', color:C.text, background:C.bg, minWidth:220 }}/>
              <div style={{ display:'flex', gap:6 }}>
                {[['all','الكل'],['pending','منتظر'],['confirmed','مؤكد'],['attended','حضر'],['cancelled','ملغي']].map(([v,l])=>(
                  <button key={v} onClick={()=>setRegFilter(v)} style={{
                    padding:'6px 14px', borderRadius:50, border:`1px solid ${regFilter===v?C.orange:C.border}`,
                    background:regFilter===v?'#FEF0ED':C.card, color:regFilter===v?C.orange:C.text,
                    fontSize:12, fontWeight:600, cursor:'pointer'
                  }}>{l} {v!=='all'?`(${registrations.filter(r=>r.status===v).length})`:''}</button>
                ))}
              </div>
              <button onClick={exportCSV} style={{ marginRight:'auto', padding:'7px 14px', border:`1px solid ${C.border}`, borderRadius:6, background:C.card, color:C.text, fontWeight:600, fontSize:12, cursor:'pointer' }}>
                ⬇️ تصدير CSV
              </button>
            </div>

            {/* Table */}
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:8, overflow:'hidden' }}>
              <div style={{ display:'grid', gridTemplateColumns:'2fr 2fr 1fr 1fr 120px', padding:'10px 16px', fontSize:11, fontWeight:700, color:C.muted, letterSpacing:'0.06em', textTransform:'uppercase', background:'#F9F8F6', borderBottom:`1px solid ${C.border}` }}>
                <span>الاسم</span><span>التواصل</span><span>الحالة</span><span>التسجيل</span><span>إجراء</span>
              </div>

              {filteredRegs.length === 0 ? (
                <div style={{ padding:'40px', textAlign:'center', color:C.muted }}>
                  <p style={{ fontSize:36, margin:'0 0 8px' }}>👥</p>
                  <p>{search||regFilter!=='all' ? 'لا توجد نتائج' : 'لا يوجد مسجلون بعد'}</p>
                </div>
              ) : filteredRegs.map((r, i) => {
                const rs = REG_STATUS[r.status] || REG_STATUS.pending
                return (
                  <div key={r.id} style={{ display:'grid', gridTemplateColumns:'2fr 2fr 1fr 1fr 120px', padding:'12px 16px', alignItems:'center', borderBottom:i<filteredRegs.length-1?`1px solid ${C.border}`:'none', transition:'background 0.12s' }}
                    onMouseEnter={e=>(e.currentTarget.style.background='#F8F7FA')}
                    onMouseLeave={e=>(e.currentTarget.style.background='transparent')}>
                    <p style={{ fontWeight:700, fontSize:14, margin:0, color:C.navy }}>{r.guest_name||'—'}</p>
                    <div>
                      <p style={{ fontSize:12, color:C.text, margin:0 }}>{r.guest_email||'—'}</p>
                      {r.guest_phone && <p style={{ fontSize:11, color:C.muted, margin:'2px 0 0' }}>{r.guest_phone}</p>}
                    </div>
                    <span style={{ display:'inline-block', padding:'3px 10px', borderRadius:4, fontSize:11, fontWeight:600, background:rs.bg, color:rs.color }}>{rs.label}</span>
                    <span style={{ fontSize:11, color:C.muted }}>{r.created_at ? new Date(r.created_at).toLocaleDateString('ar-SA') : '—'}</span>
                    <div>
                      {r.status !== 'attended' ? (
                        <button onClick={() => checkIn(r.id, r.guest_name)} style={{ padding:'5px 12px', border:'none', borderRadius:6, background:'#EAF7E0', color:C.green, fontWeight:700, fontSize:11, cursor:'pointer' }}>
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

            {filteredRegs.length > 0 && (
              <p style={{ fontSize:12, color:C.muted, marginTop:8, textAlign:'center' }}>
                عرض {filteredRegs.length} من {count} مسجّل
              </p>
            )}
          </div>
        )}

        {/* ═════ SCANNER TAB ═════ */}
        {tab === 'scanner' && (
          <div style={{ maxWidth:640, margin:'0 auto' }}>
            <div style={{ background:C.card, border:`2px solid ${C.border}`, borderRadius:12, padding:28, marginBottom:16, textAlign:'center' }}>
              <div style={{ fontSize:52, marginBottom:14 }}>📷</div>
              <h2 style={{ fontSize:18, fontWeight:700, color:C.navy, margin:'0 0 6px' }}>ماسح تذاكر الفعالية</h2>
              <p style={{ fontSize:13, color:C.muted, margin:'0 0 20px' }}>سيتحقق الماسح فقط من تذاكر هذه الفعالية</p>
              <input ref={scanRef} value={qrInput}
                onChange={e=>setQrInput(e.target.value)}
                onKeyDown={e=>{ if(e.key==='Enter') handleScan() }}
                placeholder="امسح رمز QR أو أدخله يدوياً..."
                autoFocus
                style={{ width:'100%', padding:'14px 18px', border:`2px solid ${qrInput?C.orange:C.border}`, borderRadius:10, fontSize:15, outline:'none', fontFamily:'inherit', color:C.navy, background:C.bg, boxSizing:'border-box' as const, textAlign:'center', letterSpacing:'0.1em', transition:'border-color 0.2s', marginBottom:12 }}
              />
              <button onClick={handleScan} disabled={scanLoading||!qrInput.trim()} style={{
                width:'100%', padding:'12px', border:'none', borderRadius:8,
                background:qrInput.trim()?C.orange:'#D1D5DB',
                color:'#fff', fontWeight:700, fontSize:14, cursor:qrInput.trim()?'pointer':'not-allowed', transition:'background 0.2s'
              }}>
                {scanLoading ? 'جاري التحقق...' : 'تحقق من التذكرة'}
              </button>
              <p style={{ fontSize:11, color:C.muted, marginTop:10 }}>
                💡 يمكن توصيل ماسح QR USB — يُدخل الرمز تلقائياً ويضغط Enter
              </p>
            </div>

            {scanResult && (() => {
              const ss = SCAN_STYLES[scanResult.type] || SCAN_STYLES.error
              return (
                <div style={{ background:ss.bg, border:`2px solid ${ss.border}`, borderRadius:12, padding:22, marginBottom:16, textAlign:'center' }}>
                  <div style={{ fontSize:40, marginBottom:8 }}>{ss.icon}</div>
                  <p style={{ fontSize:18, fontWeight:700, color:ss.color, margin:'0 0 6px' }}>{scanResult.msg}</p>
                  {scanResult.name && <p style={{ fontSize:15, fontWeight:600, color:C.navy, margin:0 }}>{scanResult.name}</p>}
                </div>
              )
            })()}

            {scanHistory.length > 0 && (
              <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, overflow:'hidden' }}>
                <div style={{ padding:'12px 18px', borderBottom:`1px solid ${C.border}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <h3 style={{ fontSize:14, fontWeight:700, margin:0, color:C.navy }}>آخر عمليات المسح</h3>
                  <span style={{ fontSize:12, color:C.muted, background:C.bg, padding:'2px 10px', borderRadius:20, fontWeight:600 }}>{scanHistory.length}</span>
                </div>
                {scanHistory.map((h,i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 18px', borderBottom:i<scanHistory.length-1?`1px solid ${C.border}`:'none' }}>
                    <span style={{ fontSize:16 }}>{h.type==='success'?'✅':'⚠️'}</span>
                    <p style={{ fontWeight:600, fontSize:13, margin:0, color:C.navy, flex:1 }}>{h.name}</p>
                    <span style={{ fontSize:11, color:C.muted }}>{h.time}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═════ ANALYTICS TAB ═════ */}
        {tab === 'analytics' && (
          <div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:20 }}>
              {[
                { label:'إجمالي المسجلين', value:count,            color:C.orange, icon:'🎟' },
                { label:'حضروا',           value:attended,          color:C.green,  icon:'✅' },
                { label:'لم يحضروا',       value:count-attended,    color:C.muted,  icon:'⏳' },
                { label:'نسبة الحضور',     value:count>0?`${Math.round(attended/count*100)}%`:'0%', color:C.navy, icon:'📊' },
              ].map(({ label, value, color, icon }) => (
                <div key={label} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:8, padding:'18px 20px' }}>
                  <div style={{ fontSize:22, marginBottom:8 }}>{icon}</div>
                  <p style={{ fontSize:28, fontWeight:800, color, margin:'0 0 4px' }}>{value}</p>
                  <p style={{ fontSize:12, color:C.muted, margin:0 }}>{label}</p>
                </div>
              ))}
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
              {/* Status breakdown */}
              <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:8, padding:22 }}>
                <h2 style={{ fontSize:15, fontWeight:700, color:C.navy, margin:'0 0 16px' }}>توزيع الحالات</h2>
                {Object.entries(REG_STATUS).map(([key, cfg]) => {
                  const n = registrations.filter(r=>r.status===key).length
                  const pct = count > 0 ? Math.round((n/count)*100) : 0
                  return (
                    <div key={key} style={{ marginBottom:12 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                        <span style={{ fontSize:13, color:C.text, fontWeight:600 }}>{cfg.label}</span>
                        <span style={{ fontSize:13, fontWeight:700, color:cfg.color }}>{n} ({pct}%)</span>
                      </div>
                      <div style={{ height:8, background:C.bg, borderRadius:4, overflow:'hidden', border:`1px solid ${C.border}` }}>
                        <div style={{ height:'100%', background:cfg.color, width:`${pct}%`, borderRadius:4, transition:'width 0.5s' }}/>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Attendance donut */}
              <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:8, padding:22, textAlign:'center' }}>
                <h2 style={{ fontSize:15, fontWeight:700, color:C.navy, margin:'0 0 16px' }}>معدل الحضور</h2>
                {(() => {
                  const pct = count > 0 ? Math.round((attended/count)*100) : 0
                  const r = 56, circ = 2 * Math.PI * r
                  return (
                    <div style={{ position:'relative', width:140, height:140, margin:'0 auto 14px' }}>
                      <svg viewBox="0 0 140 140">
                        <circle cx="70" cy="70" r={r} fill="none" stroke={C.border} strokeWidth="14"/>
                        <circle cx="70" cy="70" r={r} fill="none" stroke={C.orange} strokeWidth="14"
                          strokeLinecap="round" strokeDasharray={`${(pct/100)*circ} ${circ}`} transform="rotate(-90 70 70)"/>
                      </svg>
                      <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
                        <span style={{ fontSize:26, fontWeight:800, color:C.navy }}>{pct}%</span>
                        <span style={{ fontSize:11, color:C.muted }}>حضور</span>
                      </div>
                    </div>
                  )
                })()}
                <p style={{ color:C.muted, fontSize:13 }}>{attended} من {count} مسجّل</p>
                {event.capacity && (
                  <p style={{ color:C.muted, fontSize:12 }}>نسبة الامتلاء: {fillRate}%</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ═════ SETTINGS TAB ═════ */}
        {tab === 'settings' && (
          <div style={{ maxWidth:600 }}>
            {/* Status change */}
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:8, padding:22, marginBottom:16 }}>
              <h2 style={{ fontSize:15, fontWeight:700, color:C.navy, margin:'0 0 14px' }}>حالة الفعالية</h2>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:16 }}>
                {[
                  { val:'draft',     label:'مسودة',   desc:'غير منشورة' },
                  { val:'published', label:'منشور',   desc:'متاحة للعامة' },
                  { val:'completed', label:'مكتملة',  desc:'انتهت الفعالية' },
                  { val:'cancelled', label:'ملغاة',   desc:'تم الإلغاء' },
                ].map(({ val, label, desc }) => {
                  const cfg = STATUS_CONFIG[val] || STATUS_CONFIG.draft
                  return (
                    <div key={val} onClick={() => setNewStatus(val)} style={{ padding:14, borderRadius:8, cursor:'pointer', border:`2px solid ${newStatus===val?cfg.color:C.border}`, background:newStatus===val?cfg.bg:C.card, transition:'all 0.15s' }}>
                      <p style={{ fontWeight:700, color:newStatus===val?cfg.color:C.text, margin:'0 0 3px', fontSize:14 }}>{label}</p>
                      <p style={{ fontSize:11, color:C.muted, margin:0 }}>{desc}</p>
                    </div>
                  )
                })}
              </div>
              <button onClick={saveSettings} disabled={saving} style={{
                padding:'10px 24px', border:'none', borderRadius:6,
                background:saving?C.muted:C.orange, color:'#fff',
                fontWeight:700, fontSize:14, cursor:'pointer'
              }}>
                {saving ? 'جاري الحفظ...' : 'حفظ الحالة'}
              </button>
            </div>

            {/* Event info summary */}
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:8, padding:22, marginBottom:16 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
                <h2 style={{ fontSize:15, fontWeight:700, color:C.navy, margin:0 }}>معلومات الفعالية</h2>
                <Link href={`/events/${id}/edit`} style={{ color:C.orange, fontSize:13, fontWeight:600, textDecoration:'none' }}>تعديل ✏️</Link>
              </div>
              {[
                ['العنوان', event.title],
                ['الموقع', event.location||'—'],
                ['تاريخ البداية', event.start_date?new Date(event.start_date).toLocaleDateString('ar-SA'):'—'],
                ['الطاقة', event.capacity||'غير محدودة'],
              ].map(([k,v]) => (
                <div key={k} style={{ display:'flex', gap:12, padding:'8px 0', borderBottom:`1px solid ${C.border}` }}>
                  <span style={{ fontSize:13, color:C.muted, minWidth:120 }}>{k}</span>
                  <span style={{ fontSize:13, fontWeight:600, color:C.text }}>{v}</span>
                </div>
              ))}
            </div>

            {/* Danger zone */}
            <div style={{ background:'#FEF2F2', border:`1px solid #FECACA`, borderRadius:8, padding:22 }}>
              <h2 style={{ fontSize:15, fontWeight:700, color:'#B91C1C', margin:'0 0 10px' }}>⚠️ منطقة الخطر</h2>
              <p style={{ fontSize:13, color:'#7F1D1D', margin:'0 0 14px' }}>هذه الإجراءات لا يمكن التراجع عنها</p>
              <button onClick={async () => {
                if (!confirm('هل أنت متأكد من إلغاء هذه الفعالية؟')) return
                await sb.from('events').update({ status:'cancelled' }).eq('id', id)
                setEvent((e: any) => ({ ...e, status:'cancelled' }))
                setNewStatus('cancelled')
              }} style={{ padding:'8px 18px', border:'1px solid #FECACA', borderRadius:6, background:'#FEF2F2', color:'#B91C1C', fontWeight:600, fontSize:13, cursor:'pointer' }}>
                إلغاء الفعالية
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
