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

const STAFFING_STATUS: Record<string,{label:string;color:string;bg:string}> = {
  open:      { label:'مفتوح',    color:'#3A7D0A', bg:'#EAF7E0' },
  filled:    { label:'مكتمل',    color:'#1A4A7A', bg:'#E8F0F8' },
  cancelled: { label:'ملغي',     color:'#DC2626', bg:'#FEF2F2' },
}

const TABS = [
  { id:'overview',   label:'نظرة عامة',  icon:'📋' },
  { id:'tickets',    label:'التذاكر',     icon:'🎫' },
  { id:'attendees',  label:'الزوار',      icon:'👥' },
  { id:'scanner',    label:'الماسح',      icon:'📷' },
  { id:'analytics',  label:'الإحصاءات',  icon:'📊' },
  { id:'staffing',   label:'الكوادر',     icon:'👷' },
  { id:'settings',   label:'الإعدادات',  icon:'⚙️' },
]

export default function EventDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const scanRef = useRef<HTMLInputElement>(null)

  const [event, setEvent]             = useState<any>(null)
  const [registrations, setRegs]      = useState<any[]>([])
  const [tickets, setTickets]         = useState<any[]>([])
  const [staffingRequests, setStaff]  = useState<any[]>([])
  const [count, setCount]             = useState(0)
  const [loading, setLoading]         = useState(true)
  const [tab, setTab]                 = useState('overview')
  const [search, setSearch]           = useState('')
  const [regFilter, setRegFilter]     = useState('all')
  const [copied, setCopied]           = useState(false)
  const [publishLoading, setPublishLoading] = useState(false)

  // Scanner
  const [qrInput, setQrInput]     = useState('')
  const [scanResult, setScanResult] = useState<{type:string;msg:string;name?:string}|null>(null)
  const [scanLoading, setScanLoading] = useState(false)
  const [scanHistory, setScanHistory] = useState<{name:string;time:string;type:string}[]>([])

  // Settings
  const [newStatus, setNewStatus] = useState('')
  const [saving, setSaving] = useState(false)

  // Staffing form
  const [showStaffForm, setShowStaffForm] = useState(false)
  const [staffForm, setStaffForm] = useState({
    role_type:'', workers_needed:1, daily_rate:0, duration_hours:8,
    gender_preference:'any', description:''
  })
  const [staffSaving, setStaffSaving] = useState(false)

  // Ticket form
  const [showTicketForm, setShowTicketForm] = useState(false)
  const [ticketForm, setTicketForm] = useState({
    name:'', type:'free', price:0, quantity:100, description:'',
    sale_start:'', sale_end:''
  })
  const [ticketSaving, setTicketSaving] = useState(false)

  const regLink = typeof window !== 'undefined' ? `${window.location.origin}/r/${id}` : ''

  useEffect(() => {
    if (!id) return
    loadData()
  }, [id])

  useEffect(() => {
    if (tab === 'scanner' && scanRef.current) scanRef.current.focus()
  }, [tab])

  async function loadData() {
    const [
      { data: ev },
      { data: regs },
      { count: c },
      { data: tix },
      { data: staff }
    ] = await Promise.all([
      sb.from('events').select('*').eq('id', id).single(),
      sb.from('registrations').select('id,guest_name,guest_email,guest_phone,status,created_at,qr_code').eq('event_id', id).order('created_at',{ascending:false}),
      sb.from('registrations').select('*',{count:'exact',head:true}).eq('event_id', id),
      sb.from('event_tickets').select('*').eq('event_id', id).order('sort_order'),
      sb.from('staffing_requests').select('*').eq('event_id', id).order('created_at',{ascending:false})
    ])
    setEvent(ev)
    setRegs(regs || [])
    setCount(c || 0)
    setTickets(tix || [])
    setStaff(staff || [])
    setNewStatus(ev?.status || 'draft')
    setLoading(false)
  }

  async function checkIn(regId: string, name: string) {
    await sb.from('registrations').update({ status:'attended' }).eq('id', regId)
    setRegs(prev => prev.map(r => r.id === regId ? { ...r, status:'attended' } : r))
    setScanHistory(prev => [{ name, time: new Date().toLocaleTimeString('ar-SA'), type:'success' }, ...prev.slice(0,19)])
  }

  async function handleScan() {
    if (!qrInput.trim() || scanLoading) return
    setScanLoading(true)
    setScanResult(null)
    const code = qrInput.trim()
    setQrInput('')
    const { data: reg } = await sb.from('registrations').select('*').eq('qr_code', code).eq('event_id', id).single()
    if (!reg) {
      setScanResult({ type:'error', msg:'❌ رمز QR غير صالح أو لا ينتمي لهذه الفعالية' })
      setScanHistory(prev => [{ name:'مجهول', time:new Date().toLocaleTimeString('ar-SA'), type:'error' }, ...prev.slice(0,19)])
    } else if (reg.status === 'attended') {
      setScanResult({ type:'warning', msg:`⚠️ تم تسجيل حضور ${reg.guest_name} مسبقاً`, name: reg.guest_name })
      setScanHistory(prev => [{ name:reg.guest_name, time:new Date().toLocaleTimeString('ar-SA'), type:'warning' }, ...prev.slice(0,19)])
    } else {
      await sb.from('registrations').update({ status:'attended' }).eq('id', reg.id)
      setRegs(prev => prev.map(r => r.id === reg.id ? { ...r, status:'attended' } : r))
      setScanResult({ type:'success', msg:`✅ مرحباً ${reg.guest_name}! تم تسجيل الحضور`, name: reg.guest_name })
      setScanHistory(prev => [{ name:reg.guest_name, time:new Date().toLocaleTimeString('ar-SA'), type:'success' }, ...prev.slice(0,19)])
    }
    setScanLoading(false)
  }

  async function publishEvent() {
    setPublishLoading(true)
    await sb.from('events').update({ status:'published' }).eq('id', id)
    setEvent((e: any) => ({ ...e, status:'published' }))
    setNewStatus('published')
    setPublishLoading(false)
  }

  async function saveSettings() {
    setSaving(true)
    await sb.from('events').update({ status: newStatus }).eq('id', id)
    setEvent((e: any) => ({ ...e, status: newStatus }))
    setSaving(false)
  }

  async function saveTicket() {
    setTicketSaving(true)
    await sb.from('event_tickets').insert({
      event_id: id,
      name: ticketForm.name,
      type: ticketForm.type,
      price: ticketForm.type === 'free' ? 0 : ticketForm.price,
      quantity: ticketForm.quantity,
      description: ticketForm.description,
      sale_start: ticketForm.sale_start || null,
      sale_end: ticketForm.sale_end || null,
      is_visible: true,
      quantity_sold: 0
    })
    setTicketForm({ name:'', type:'free', price:0, quantity:100, description:'', sale_start:'', sale_end:'' })
    setShowTicketForm(false)
    setTicketSaving(false)
    const { data: tix } = await sb.from('event_tickets').select('*').eq('event_id', id).order('sort_order')
    setTickets(tix || [])
  }

  async function saveStaffRequest() {
    setStaffSaving(true)
    await sb.from('staffing_requests').insert({
      event_id: id,
      title: staffForm.role_type,
      role_type: staffForm.role_type,
      workers_needed: staffForm.workers_needed,
      daily_rate: staffForm.daily_rate,
      duration_hours: staffForm.duration_hours,
      gender_preference: staffForm.gender_preference,
      description: staffForm.description,
      status: 'open',
      workers_confirmed: 0,
      city: (event as any)?.location || '',
      event_date: (event as any)?.start_date ? new Date((event as any).start_date).toISOString().split('T')[0] : null
    })
    setStaffForm({ role_type:'', workers_needed:1, daily_rate:0, duration_hours:8, gender_preference:'any', description:'' })
    setShowStaffForm(false)
    setStaffSaving(false)
    const { data: staff } = await sb.from('staffing_requests').select('*').eq('event_id', id).order('created_at',{ascending:false})
    setStaff(staff || [])
  }

  async function deleteTicket(ticketId: string) {
    if (!confirm('حذف هذا النوع من التذاكر؟')) return
    await sb.from('event_tickets').delete().eq('id', ticketId)
    setTickets(prev => prev.filter(t => t.id !== ticketId))
  }

  function exportCSV() {
    const rows = [['الاسم','البريد','الهاتف','الحالة','تاريخ التسجيل']]
    registrations.forEach(r => rows.push([r.guest_name, r.guest_email||'', r.guest_phone||'', r.status, new Date(r.created_at).toLocaleDateString('ar-SA')]))
    const csv = rows.map(r => r.join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob(['\uFEFF'+csv], { type:'text/csv;charset=utf-8;' }))
    a.download = `attendees-${id}.csv`
    a.click()
  }

  function copyRegLink() {
    navigator.clipboard.writeText(regLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const filteredRegs = registrations.filter(r => {
    const matchSearch = !search || r.guest_name?.toLowerCase().includes(search.toLowerCase()) || r.guest_email?.toLowerCase().includes(search.toLowerCase())
    const matchFilter = regFilter === 'all' || r.status === regFilter
    return matchSearch && matchFilter
  })

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'60vh', flexDirection:'column', gap:16 }}>
      <div style={{ width:40, height:40, border:`4px solid ${C.border}`, borderTop:`4px solid ${C.orange}`, borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>
      <p style={{ color:C.muted, fontSize:14 }}>جاري تحميل بيانات الفعالية...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  if (!event) return (
    <div style={{ textAlign:'center', padding:'60px 20px' }}>
      <p style={{ fontSize:48, margin:'0 0 16px' }}>🔍</p>
      <h2 style={{ color:C.navy }}>الفعالية غير موجودة</h2>
      <Link href="/events" style={{ color:C.orange }}>← العودة للفعاليات</Link>
    </div>
  )

  const attended = registrations.filter(r => r.status === 'attended').length
  const cfg = STATUS_CONFIG[event.status] || STATUS_CONFIG.draft
  const fillRate = event.capacity ? Math.round((count / event.capacity) * 100) : 0

  // Parse JSONB fields
  const agenda: any[]   = Array.isArray(event.agenda)   ? event.agenda   : []
  const lineup: any[]   = Array.isArray(event.lineup)   ? event.lineup   : []
  const sponsors: any[] = Array.isArray(event.sponsors) ? event.sponsors : []

  return (
    <div style={{ minHeight:'100vh', background:C.bg, fontFamily:'system-ui,sans-serif', direction:'rtl' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .tab-btn { transition: all 0.15s; }
        .tab-btn:hover { background: #F0EEF4 !important; }
        .row-hover:hover { background: #F8F7FA !important; }
        .action-btn { transition: opacity 0.15s; }
        .action-btn:hover { opacity: 0.85; }
        input:focus, select:focus, textarea:focus { outline: 2px solid #F05537 !important; outline-offset: 1px; }
      `}</style>

      {/* ─── Top Header ─── */}
      <div style={{ background:C.card, borderBottom:`1px solid ${C.border}`, padding:'14px 32px' }}>
        <div style={{ maxWidth:1200, margin:'0 auto' }}>
          {/* Breadcrumb */}
          <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:12, fontSize:13, color:C.muted }}>
            <Link href="/" style={{ color:C.muted, textDecoration:'none' }}>الرئيسية</Link>
            <span>/</span>
            <Link href="/events" style={{ color:C.muted, textDecoration:'none' }}>الفعاليات</Link>
            <span>/</span>
            <span style={{ color:C.navy, fontWeight:600 }}>{event.title}</span>
          </div>
          {/* Title row */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:12 }}>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <h1 style={{ fontSize:22, fontWeight:800, color:C.navy, margin:0 }}>{event.title}</h1>
              <span style={{ padding:'4px 12px', borderRadius:20, fontSize:12, fontWeight:700, background:cfg.bg, color:cfg.color }}>{cfg.label}</span>
            </div>
            <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
              {event.status === 'draft' && (
                <button onClick={publishEvent} disabled={publishLoading} style={{ padding:'8px 18px', border:'none', borderRadius:6, background:C.orange, color:'#fff', fontWeight:700, fontSize:13, cursor:'pointer' }}>
                  {publishLoading ? '...' : '🚀 نشر الفعالية'}
                </button>
              )}
              <button onClick={copyRegLink} style={{ padding:'8px 14px', border:`1px solid ${C.border}`, borderRadius:6, background:copied?'#EAF7E0':C.card, color:copied?C.green:C.text, fontWeight:600, fontSize:13, cursor:'pointer' }}>
                {copied ? '✓ تم النسخ' : '🔗 رابط التسجيل'}
              </button>
              <button onClick={exportCSV} style={{ padding:'8px 14px', border:`1px solid ${C.border}`, borderRadius:6, background:C.card, color:C.text, fontWeight:600, fontSize:13, cursor:'pointer' }}>
                ⬇️ تصدير CSV
              </button>
              <Link href={`/events/${id}/edit`} style={{ padding:'8px 14px', border:`1px solid ${C.border}`, borderRadius:6, background:C.card, color:C.text, fontWeight:600, fontSize:13, textDecoration:'none' }}>
                ✏️ تعديل
              </Link>
            </div>
          </div>

          {/* Stats bar */}
          <div style={{ display:'flex', gap:24, marginTop:16, paddingTop:16, borderTop:`1px solid ${C.border}`, flexWrap:'wrap' }}>
            {[
              { label:'إجمالي المسجلين', val: count, color: C.navy },
              { label:'حضروا',           val: attended, color: C.green },
              { label:'لم يحضروا',       val: count - attended, color: C.muted },
              { label:'الطاقة',          val: event.capacity ? `${count}/${event.capacity}` : '∞', color: C.text },
              { label:'نسبة الامتلاء',   val: event.capacity ? `${fillRate}%` : '—', color: fillRate > 80 ? '#DC2626' : C.orange },
              { label:'أنواع التذاكر',   val: tickets.length, color: C.navy },
            ].map(({ label, val, color }) => (
              <div key={label} style={{ textAlign:'center' }}>
                <p style={{ fontSize:20, fontWeight:800, color, margin:0 }}>{val}</p>
                <p style={{ fontSize:11, color:C.muted, margin:'2px 0 0' }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Tabs ─── */}
      <div style={{ background:C.card, borderBottom:`1px solid ${C.border}` }}>
        <div style={{ maxWidth:1200, margin:'0 auto', display:'flex', gap:4, padding:'0 32px', overflowX:'auto' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} className="tab-btn"
              style={{ padding:'14px 18px', border:'none', borderBottom:`3px solid ${tab===t.id?C.orange:'transparent'}`, background:'transparent', color:tab===t.id?C.orange:C.muted, fontWeight:tab===t.id?700:500, fontSize:13, cursor:'pointer', whiteSpace:'nowrap', fontFamily:'inherit' }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Tab Content ─── */}
      <div style={{ maxWidth:1200, margin:'0 auto', padding:'24px 32px' }}>

        {/* ════════════════════════════════════════
            TAB: OVERVIEW
        ════════════════════════════════════════ */}
        {tab === 'overview' && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 340px', gap:20 }}>
            <div>
              {/* Event details card */}
              <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:8, padding:24, marginBottom:16 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
                  <h2 style={{ fontSize:16, fontWeight:700, color:C.navy, margin:0 }}>تفاصيل الفعالية</h2>
                  <Link href={`/events/${id}/edit`} style={{ color:C.orange, fontSize:13, fontWeight:600, textDecoration:'none' }}>تعديل ✏️</Link>
                </div>
                {event.cover_image && (
                  <img src={event.cover_image} alt={event.title}
                    style={{ width:'100%', height:220, objectFit:'cover', borderRadius:8, marginBottom:16 }}/>
                )}
                <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
                  {[
                    { icon:'📅', label:'تاريخ البداية', val: event.start_date ? new Date(event.start_date).toLocaleDateString('ar-SA',{weekday:'long',year:'numeric',month:'long',day:'numeric',hour:'2-digit',minute:'2-digit'}) : '—' },
                    { icon:'⏰', label:'تاريخ النهاية',  val: event.end_date ? new Date(event.end_date).toLocaleDateString('ar-SA',{weekday:'long',year:'numeric',month:'long',day:'numeric',hour:'2-digit',minute:'2-digit'}) : '—' },
                    { icon:'📍', label:'الموقع',         val: event.location_type === 'online' ? '💻 عبر الإنترنت' : event.location_type === 'tba' ? '❓ سيُحدد لاحقاً' : (event.location || '—') },
                    { icon:'👥', label:'الطاقة الاستيعابية', val: event.capacity ? event.capacity.toLocaleString('ar') + ' شخص' : 'غير محدودة' },
                    { icon:'🏷️', label:'التصنيف',        val: [event.category, event.subcategory].filter(Boolean).join(' · ') || '—' },
                    { icon:'🔄', label:'التكرار',         val: event.is_recurring ? `متكررة — ${(event.recurrence as any)?.type||''}` : 'فعالية منفردة' },
                    ...(event.door_time        ? [{ icon:'🚪', label:'وقت الدخول',   val: event.door_time }] : []),
                    ...(event.age_restriction  ? [{ icon:'🔞', label:'الفئة العمرية', val: event.age_restriction }] : []),
                    ...(event.parking_info     ? [{ icon:'🅿️', label:'الموقف',       val: event.parking_info }] : []),
                    ...(event.organizer_name   ? [{ icon:'🎪', label:'المنظم',        val: event.organizer_name }] : []),
                  ].map(({ icon, label, val }) => (
                    <div key={label} style={{ display:'flex', gap:12, padding:'10px 0', borderBottom:`1px solid ${C.border}` }}>
                      <span style={{ fontSize:15, width:22, flexShrink:0, paddingTop:1 }}>{icon}</span>
                      <span style={{ fontSize:13, color:C.muted, minWidth:140 }}>{label}</span>
                      <span style={{ fontSize:13, fontWeight:600, color:C.text }}>{val}</span>
                    </div>
                  ))}
                </div>

                {/* Tags */}
                {event.tags && event.tags.length > 0 && (
                  <div style={{ marginTop:14, paddingTop:14, borderTop:`1px solid ${C.border}` }}>
                    <p style={{ fontSize:12, fontWeight:700, color:C.muted, margin:'0 0 8px' }}>الوسوم</p>
                    <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                      {event.tags.map((tag: string) => (
                        <span key={tag} style={{ padding:'3px 10px', borderRadius:20, background:'#F0EEF4', color:C.navy, fontSize:12, fontWeight:600 }}>#{tag}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Highlights */}
                {event.highlights && (
                  <div style={{ marginTop:14, paddingTop:14, borderTop:`1px solid ${C.border}` }}>
                    <p style={{ fontSize:12, fontWeight:700, color:C.muted, margin:'0 0 6px' }}>✨ أبرز ما يميز الفعالية</p>
                    <p style={{ fontSize:13, color:C.text, lineHeight:1.7, margin:0 }}>{event.highlights}</p>
                  </div>
                )}

                {/* Description */}
                {event.description && (
                  <div style={{ marginTop:14, paddingTop:14, borderTop:`1px solid ${C.border}` }}>
                    <p style={{ fontSize:13, fontWeight:700, color:C.navy, margin:'0 0 8px' }}>نبذة عن الفعالية</p>
                    <p style={{ fontSize:13, color:C.text, lineHeight:1.7, margin:0 }}>{event.description}</p>
                  </div>
                )}

                {/* Online URL */}
                {(event.event_url || event.online_url) && (
                  <div style={{ marginTop:14, paddingTop:14, borderTop:`1px solid ${C.border}` }}>
                    <p style={{ fontSize:13, fontWeight:700, color:C.navy, margin:'0 0 8px' }}>💻 رابط البث</p>
                    <a href={event.event_url || event.online_url} target="_blank" rel="noopener noreferrer"
                      style={{ color:C.orange, fontSize:13, wordBreak:'break-all' }}>
                      {event.event_url || event.online_url}
                    </a>
                  </div>
                )}
              </div>

              {/* Agenda */}
              {agenda.length > 0 && (
                <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:8, padding:24, marginBottom:16 }}>
                  <h2 style={{ fontSize:15, fontWeight:700, color:C.navy, margin:'0 0 16px' }}>📋 أجندة الفعالية</h2>
                  <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
                    {agenda.map((item: any, i: number) => (
                      <div key={i} style={{ display:'flex', gap:16, padding:'12px 0', borderBottom: i < agenda.length - 1 ? `1px solid ${C.border}` : 'none', alignItems:'flex-start' }}>
                        <div style={{ minWidth:70, textAlign:'center' }}>
                          <span style={{ fontSize:12, fontWeight:700, color:C.orange, background:'#FEF0ED', padding:'3px 8px', borderRadius:4 }}>
                            {item.time || '—'}
                          </span>
                        </div>
                        <div>
                          <p style={{ fontWeight:700, color:C.navy, margin:'0 0 2px', fontSize:14 }}>{item.title}</p>
                          {item.speaker && <p style={{ fontSize:12, color:C.muted, margin:0 }}>🎤 {item.speaker}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Lineup */}
              {lineup.length > 0 && (
                <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:8, padding:24, marginBottom:16 }}>
                  <h2 style={{ fontSize:15, fontWeight:700, color:C.navy, margin:'0 0 16px' }}>🎤 المتحدثون والضيوف</h2>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:12 }}>
                    {lineup.map((person: any, i: number) => (
                      <div key={i} style={{ padding:14, borderRadius:8, border:`1px solid ${C.border}`, background:C.bg }}>
                        <div style={{ width:44, height:44, borderRadius:'50%', background:`hsl(${i*47},60%,70%)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, marginBottom:10 }}>
                          {person.name?.charAt(0) || '👤'}
                        </div>
                        <p style={{ fontWeight:700, color:C.navy, margin:'0 0 2px', fontSize:14 }}>{person.name}</p>
                        {person.role && <p style={{ fontSize:12, color:C.orange, margin:'0 0 4px', fontWeight:600 }}>{person.role}</p>}
                        {person.bio  && <p style={{ fontSize:11, color:C.muted, margin:0, lineHeight:1.5 }}>{person.bio}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sponsors */}
              {sponsors.length > 0 && (
                <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:8, padding:24, marginBottom:16 }}>
                  <h2 style={{ fontSize:15, fontWeight:700, color:C.navy, margin:'0 0 16px' }}>🤝 الرعاة</h2>
                  <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
                    {sponsors.map((s: any, i: number) => (
                      <div key={i} style={{ padding:'10px 18px', borderRadius:8, border:`1px solid ${C.border}`, background:C.bg, display:'flex', alignItems:'center', gap:8 }}>
                        <span style={{ fontSize:13, fontWeight:700, color:C.navy }}>{s.name || s}</span>
                        {s.tier && <span style={{ fontSize:11, color:C.muted }}>— {s.tier}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent attendees */}
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
                          <button onClick={() => checkIn(r.id, r.guest_name)}
                            style={{ padding:'4px 10px', border:'none', borderRadius:4, background:'#EAF7E0', color:C.green, fontWeight:600, fontSize:11, cursor:'pointer' }}>
                            تسجيل حضور
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Right sidebar */}
            <div>
              {/* Reg link card */}
              <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:8, padding:20, marginBottom:16 }}>
                <h3 style={{ fontSize:14, fontWeight:700, color:C.navy, margin:'0 0 12px' }}>🔗 رابط التسجيل للزوار</h3>
                <div style={{ background:C.bg, border:`1px solid ${C.border}`, borderRadius:6, padding:'8px 12px', fontSize:12, color:C.muted, wordBreak:'break-all', marginBottom:12 }}>
                  {regLink}
                </div>
                <button onClick={copyRegLink} style={{ width:'100%', padding:'10px', border:'none', borderRadius:6, background:copied?C.green:C.orange, color:'#fff', fontWeight:700, fontSize:13, cursor:'pointer' }}>
                  {copied ? '✓ تم نسخ الرابط' : '📋 نسخ الرابط'}
                </button>
              </div>

              {/* Quick actions */}
              <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:8, padding:20, marginBottom:16 }}>
                <h3 style={{ fontSize:14, fontWeight:700, color:C.navy, margin:'0 0 12px' }}>⚡ الإجراءات السريعة</h3>
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {[
                    { label:'📷 فتح الماسح', action:()=>setTab('scanner'), fill:true },
                    { label:'🎫 إدارة التذاكر', action:()=>setTab('tickets'), fill:false },
                    { label:'👥 عرض الزوار', action:()=>setTab('attendees'), fill:false },
                    { label:'📊 الإحصاءات', action:()=>setTab('analytics'), fill:false },
                    { label:'👷 طلبات الكوادر', action:()=>setTab('staffing'), fill:false },
                    { label:'⬇️ تصدير CSV', action:exportCSV, fill:false },
                  ].map(({ label, action, fill }) => (
                    <button key={label} onClick={action} className="action-btn" style={{ width:'100%', padding:'10px', border:`1px solid ${fill?C.orange:C.border}`, borderRadius:6, background:fill?C.orange:C.card, color:fill?'#fff':C.text, fontWeight:600, fontSize:13, cursor:'pointer', textAlign:'right', fontFamily:'inherit' }}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Ticket sale window */}
              {(event.ticket_sale_start || event.ticket_sale_end) && (
                <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:8, padding:20, marginBottom:16 }}>
                  <h3 style={{ fontSize:14, fontWeight:700, color:C.navy, margin:'0 0 12px' }}>🗓️ نافذة بيع التذاكر</h3>
                  {event.ticket_sale_start && (
                    <div style={{ display:'flex', gap:8, marginBottom:6 }}>
                      <span style={{ fontSize:12, color:C.muted }}>تبدأ:</span>
                      <span style={{ fontSize:12, fontWeight:600, color:C.text }}>{new Date(event.ticket_sale_start).toLocaleDateString('ar-SA',{day:'numeric',month:'long',year:'numeric'})}</span>
                    </div>
                  )}
                  {event.ticket_sale_end && (
                    <div style={{ display:'flex', gap:8 }}>
                      <span style={{ fontSize:12, color:C.muted }}>تنتهي:</span>
                      <span style={{ fontSize:12, fontWeight:600, color:C.text }}>{new Date(event.ticket_sale_end).toLocaleDateString('ar-SA',{day:'numeric',month:'long',year:'numeric'})}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════
            TAB: TICKETS
        ════════════════════════════════════════ */}
        {tab === 'tickets' && (
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
              <div>
                <h2 style={{ fontSize:17, fontWeight:700, color:C.navy, margin:0 }}>إدارة التذاكر</h2>
                <p style={{ fontSize:13, color:C.muted, margin:'4px 0 0' }}>{tickets.length} نوع تذكرة</p>
              </div>
              <button onClick={() => setShowTicketForm(!showTicketForm)} style={{ padding:'9px 18px', border:'none', borderRadius:6, background:C.orange, color:'#fff', fontWeight:700, fontSize:13, cursor:'pointer' }}>
                + إضافة نوع تذكرة
              </button>
            </div>

            {/* Add ticket form */}
            {showTicketForm && (
              <div style={{ background:C.card, border:`2px solid ${C.orange}`, borderRadius:8, padding:22, marginBottom:16 }}>
                <h3 style={{ fontSize:14, fontWeight:700, color:C.navy, margin:'0 0 14px' }}>نوع تذكرة جديد</h3>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                  <div>
                    <label style={{ fontSize:12, fontWeight:700, color:C.muted, display:'block', marginBottom:5 }}>اسم التذكرة *</label>
                    <input value={ticketForm.name} onChange={e=>setTicketForm(f=>({...f,name:e.target.value}))} placeholder="تذكرة عادية، VIP..." style={inputStyle}/>
                  </div>
                  <div>
                    <label style={{ fontSize:12, fontWeight:700, color:C.muted, display:'block', marginBottom:5 }}>النوع</label>
                    <select value={ticketForm.type} onChange={e=>setTicketForm(f=>({...f,type:e.target.value}))} style={inputStyle}>
                      <option value="free">مجانية</option>
                      <option value="paid">مدفوعة</option>
                    </select>
                  </div>
                  {ticketForm.type === 'paid' && (
                    <div>
                      <label style={{ fontSize:12, fontWeight:700, color:C.muted, display:'block', marginBottom:5 }}>السعر (ريال)</label>
                      <input type="number" value={ticketForm.price} onChange={e=>setTicketForm(f=>({...f,price:Number(e.target.value)}))} style={inputStyle}/>
                    </div>
                  )}
                  <div>
                    <label style={{ fontSize:12, fontWeight:700, color:C.muted, display:'block', marginBottom:5 }}>الكمية المتاحة</label>
                    <input type="number" value={ticketForm.quantity} onChange={e=>setTicketForm(f=>({...f,quantity:Number(e.target.value)}))} style={inputStyle}/>
                  </div>
                  <div>
                    <label style={{ fontSize:12, fontWeight:700, color:C.muted, display:'block', marginBottom:5 }}>تاريخ بداية البيع</label>
                    <input type="datetime-local" value={ticketForm.sale_start} onChange={e=>setTicketForm(f=>({...f,sale_start:e.target.value}))} style={inputStyle}/>
                  </div>
                  <div>
                    <label style={{ fontSize:12, fontWeight:700, color:C.muted, display:'block', marginBottom:5 }}>تاريخ انتهاء البيع</label>
                    <input type="datetime-local" value={ticketForm.sale_end} onChange={e=>setTicketForm(f=>({...f,sale_end:e.target.value}))} style={inputStyle}/>
                  </div>
                  <div style={{ gridColumn:'1/-1' }}>
                    <label style={{ fontSize:12, fontWeight:700, color:C.muted, display:'block', marginBottom:5 }}>وصف التذكرة</label>
                    <textarea value={ticketForm.description} onChange={e=>setTicketForm(f=>({...f,description:e.target.value}))} rows={2} placeholder="ما يشمله هذا النوع من التذاكر..." style={{ ...inputStyle, resize:'vertical' }}/>
                  </div>
                </div>
                <div style={{ display:'flex', gap:10, marginTop:14 }}>
                  <button onClick={saveTicket} disabled={!ticketForm.name || ticketSaving} style={{ padding:'9px 20px', border:'none', borderRadius:6, background:C.orange, color:'#fff', fontWeight:700, fontSize:13, cursor:'pointer' }}>
                    {ticketSaving ? 'جاري الحفظ...' : 'حفظ التذكرة'}
                  </button>
                  <button onClick={()=>setShowTicketForm(false)} style={{ padding:'9px 20px', border:`1px solid ${C.border}`, borderRadius:6, background:C.card, color:C.text, fontWeight:600, fontSize:13, cursor:'pointer' }}>
                    إلغاء
                  </button>
                </div>
              </div>
            )}

            {/* Tickets list */}
            {tickets.length === 0 ? (
              <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:8, padding:'60px 20px', textAlign:'center' }}>
                <p style={{ fontSize:48, margin:'0 0 12px' }}>🎫</p>
                <h3 style={{ color:C.navy, margin:'0 0 6px' }}>لا توجد تذاكر بعد</h3>
                <p style={{ color:C.muted, fontSize:13, margin:0 }}>أضف نوع تذكرة لبدء استقبال الحجوزات</p>
              </div>
            ) : (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:14 }}>
                {tickets.map((t: any) => {
                  const sold = t.quantity_sold || 0
                  const pct = t.quantity ? Math.round((sold/t.quantity)*100) : 0
                  return (
                    <div key={t.id} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:8, padding:20 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
                        <div>
                          <p style={{ fontWeight:700, color:C.navy, margin:'0 0 4px', fontSize:15 }}>{t.name}</p>
                          <span style={{ fontSize:12, padding:'2px 8px', borderRadius:4, background: t.type==='free'?'#EAF7E0':'#FEF0ED', color: t.type==='free'?C.green:C.orange, fontWeight:700 }}>
                            {t.type === 'free' ? 'مجانية' : `${t.price?.toLocaleString('ar')} ريال`}
                          </span>
                        </div>
                        <button onClick={() => deleteTicket(t.id)} style={{ padding:'4px 8px', border:`1px solid #FECACA`, borderRadius:4, background:'#FEF2F2', color:'#DC2626', fontSize:11, cursor:'pointer' }}>
                          حذف
                        </button>
                      </div>
                      {t.description && <p style={{ fontSize:12, color:C.muted, margin:'0 0 12px', lineHeight:1.5 }}>{t.description}</p>}
                      <div style={{ marginBottom:10 }}>
                        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                          <span style={{ fontSize:12, color:C.muted }}>المبيعة</span>
                          <span style={{ fontSize:12, fontWeight:700, color:C.text }}>{sold} / {t.quantity || '∞'}</span>
                        </div>
                        {t.quantity > 0 && (
                          <div style={{ height:6, background:C.border, borderRadius:3, overflow:'hidden' }}>
                            <div style={{ height:'100%', width:`${pct}%`, background: pct>80?'#DC2626':C.green, borderRadius:3 }}/>
                          </div>
                        )}
                      </div>
                      {(t.sale_start || t.sale_end) && (
                        <div style={{ fontSize:11, color:C.muted, paddingTop:8, borderTop:`1px solid ${C.border}` }}>
                          {t.sale_start && <span>من {new Date(t.sale_start).toLocaleDateString('ar-SA')} </span>}
                          {t.sale_end   && <span>حتى {new Date(t.sale_end).toLocaleDateString('ar-SA')}</span>}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════
            TAB: ATTENDEES
        ════════════════════════════════════════ */}
        {tab === 'attendees' && (
          <div>
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:8, padding:'12px 16px', marginBottom:14, display:'flex', gap:12, flexWrap:'wrap', alignItems:'center' }}>
              <input value={search} onChange={e=>setSearch(e.target.value)}
                placeholder="🔍 بحث بالاسم أو البريد..."
                style={{ padding:'8px 12px', border:`1px solid ${C.border}`, borderRadius:6, fontSize:13, fontFamily:'inherit', color:C.text, background:C.bg, minWidth:220 }}/>
              <div style={{ display:'flex', gap:6 }}>
                {[['all','الكل'],['pending','منتظر'],['confirmed','مؤكد'],['attended','حضر'],['cancelled','ملغي']].map(([v,l])=>(
                  <button key={v} onClick={()=>setRegFilter(v)} style={{ padding:'6px 14px', borderRadius:50, border:`1px solid ${regFilter===v?C.orange:C.border}`, background:regFilter===v?'#FEF0ED':C.card, color:regFilter===v?C.orange:C.text, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                    {l} {v!=='all'?`(${registrations.filter(r=>r.status===v).length})`:``}
                  </button>
                ))}
              </div>
              <button onClick={exportCSV} style={{ marginRight:'auto', padding:'7px 14px', border:`1px solid ${C.border}`, borderRadius:6, background:C.card, color:C.text, fontWeight:600, fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>
                ⬇️ تصدير CSV
              </button>
            </div>
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:8, overflow:'hidden' }}>
              <div style={{ display:'grid', gridTemplateColumns:'2fr 2fr 1fr 1fr 120px', padding:'10px 16px', fontSize:11, fontWeight:700, color:C.muted, letterSpacing:'0.05em', textTransform:'uppercase', background:'#F9F8F6', borderBottom:`1px solid ${C.border}` }}>
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
                  <div key={r.id} className="row-hover" style={{ display:'grid', gridTemplateColumns:'2fr 2fr 1fr 1fr 120px', padding:'12px 16px', alignItems:'center', borderBottom:i<filteredRegs.length-1?`1px solid ${C.border}`:'none', transition:'background 0.1s' }}>
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

        {/* ════════════════════════════════════════
            TAB: SCANNER
        ════════════════════════════════════════ */}
        {tab === 'scanner' && (
          <div style={{ maxWidth:640, margin:'0 auto' }}>
            <div style={{ background:C.card, border:`2px solid ${C.border}`, borderRadius:12, padding:28, marginBottom:16, textAlign:'center' }}>
              <div style={{ fontSize:52, marginBottom:14 }}>📷</div>
              <h2 style={{ fontSize:18, fontWeight:700, color:C.navy, margin:'0 0 6px' }}>ماسح تذاكر الفعالية</h2>
              <p style={{ fontSize:13, color:C.muted, margin:'0 0 20px', lineHeight:1.6 }}>
                وجّه الماسح الضوئي نحو رمز QR أو اكتبه يدوياً
              </p>
              <div style={{ display:'flex', gap:10 }}>
                <input ref={scanRef} value={qrInput} onChange={e=>setQrInput(e.target.value)}
                  onKeyDown={e=>e.key==='Enter'&&handleScan()}
                  placeholder="رمز QR أو رقم التذكرة..."
                  style={{ flex:1, padding:'12px 16px', border:`2px solid ${C.border}`, borderRadius:8, fontSize:15, fontFamily:'inherit', textAlign:'center' }}/>
                <button onClick={handleScan} disabled={!qrInput.trim()||scanLoading}
                  style={{ padding:'12px 22px', border:'none', borderRadius:8, background:C.orange, color:'#fff', fontWeight:700, fontSize:14, cursor:'pointer' }}>
                  {scanLoading ? '...' : 'فحص'}
                </button>
              </div>
              <p style={{ fontSize:12, color:C.muted, marginTop:10 }}>⌨️ الماسح USB يعمل تلقائياً • اضغط Enter للتأكيد</p>
            </div>

            {scanResult && (
              <div style={{ padding:18, borderRadius:10, marginBottom:16, textAlign:'center', border:'2px solid',
                background: scanResult.type==='success'?'#EAF7E0':scanResult.type==='warning'?'#FFF8E8':'#FEF2F2',
                borderColor: scanResult.type==='success'?C.green:scanResult.type==='warning'?'#B07000':'#DC2626',
                color: scanResult.type==='success'?C.green:scanResult.type==='warning'?'#B07000':'#DC2626',
              }}>
                <p style={{ fontSize:18, fontWeight:700, margin:0 }}>{scanResult.msg}</p>
              </div>
            )}

            {scanHistory.length > 0 && (
              <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:8, overflow:'hidden' }}>
                <div style={{ padding:'12px 16px', borderBottom:`1px solid ${C.border}`, display:'flex', justifyContent:'space-between' }}>
                  <p style={{ fontWeight:700, color:C.navy, margin:0, fontSize:14 }}>📋 سجل المسح</p>
                  <span style={{ fontSize:12, color:C.muted }}>{scanHistory.length} عملية</span>
                </div>
                {scanHistory.slice(0,10).map((h, i) => (
                  <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 16px', borderBottom:i<scanHistory.slice(0,10).length-1?`1px solid ${C.border}`:'none' }}>
                    <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                      <span style={{ fontSize:16 }}>{h.type==='success'?'✅':h.type==='warning'?'⚠️':'❌'}</span>
                      <span style={{ fontSize:13, fontWeight:600, color:C.navy }}>{h.name}</span>
                    </div>
                    <span style={{ fontSize:12, color:C.muted }}>{h.time}</span>
                  </div>
                ))}
              </div>
            )}

            <div style={{ marginTop:16, background:C.card, border:`1px solid ${C.border}`, borderRadius:8, padding:16 }}>
              <p style={{ fontSize:13, fontWeight:700, color:C.navy, margin:'0 0 8px' }}>📊 إحصائيات سريعة</p>
              <div style={{ display:'flex', gap:20 }}>
                <div><p style={{ fontSize:20, fontWeight:800, color:C.green, margin:0 }}>{registrations.filter(r=>r.status==='attended').length}</p><p style={{ fontSize:11, color:C.muted, margin:0 }}>حضروا</p></div>
                <div><p style={{ fontSize:20, fontWeight:800, color:C.navy, margin:0 }}>{count}</p><p style={{ fontSize:11, color:C.muted, margin:0 }}>إجمالي</p></div>
                <div><p style={{ fontSize:20, fontWeight:800, color:C.orange, margin:0 }}>{scanHistory.filter(h=>h.type==='success').length}</p><p style={{ fontSize:11, color:C.muted, margin:0 }}>جلسة هذه</p></div>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════
            TAB: ANALYTICS
        ════════════════════════════════════════ */}
        {tab === 'analytics' && (
          <div>
            {/* Stats */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:20 }}>
              {[
                { label:'إجمالي المسجلين', val:count, icon:'👥', color:C.navy },
                { label:'حضروا', val:attended, icon:'✅', color:C.green },
                { label:'لم يحضروا', val:count-attended, icon:'⏳', color:C.orange },
                { label:'نسبة الحضور', val:count>0?`${Math.round((attended/count)*100)}%`:'—', icon:'📈', color:'#1A4A7A' },
              ].map(({ label, val, icon, color }) => (
                <div key={label} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:8, padding:20 }}>
                  <p style={{ fontSize:26, margin:'0 0 6px' }}>{icon}</p>
                  <p style={{ fontSize:26, fontWeight:800, color, margin:'0 0 4px' }}>{val}</p>
                  <p style={{ fontSize:12, color:C.muted, margin:0 }}>{label}</p>
                </div>
              ))}
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
              {/* Status breakdown */}
              <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:8, padding:22 }}>
                <h3 style={{ fontSize:15, fontWeight:700, color:C.navy, margin:'0 0 16px' }}>توزيع الحالات</h3>
                {Object.entries(REG_STATUS).map(([status, cfg]) => {
                  const n = registrations.filter(r=>r.status===status).length
                  const pct = count > 0 ? Math.round((n/count)*100) : 0
                  return (
                    <div key={status} style={{ marginBottom:14 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                        <span style={{ fontSize:13, fontWeight:600, color:C.text }}>{cfg.label}</span>
                        <span style={{ fontSize:13, fontWeight:700, color:cfg.color }}>{n} ({pct}%)</span>
                      </div>
                      <div style={{ height:8, background:C.border, borderRadius:4, overflow:'hidden' }}>
                        <div style={{ height:'100%', width:`${pct}%`, background:cfg.color, borderRadius:4 }}/>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Donut chart */}
              <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:8, padding:22 }}>
                <h3 style={{ fontSize:15, fontWeight:700, color:C.navy, margin:'0 0 16px' }}>نسبة الحضور</h3>
                {count === 0 ? (
                  <div style={{ textAlign:'center', padding:'40px 0', color:C.muted }}>
                    <p style={{ fontSize:36 }}>📊</p>
                    <p style={{ fontSize:13 }}>لا توجد بيانات بعد</p>
                  </div>
                ) : (() => {
                  const pct = Math.round((attended/count)*100)
                  const r = 60, cx = 90, cy = 90
                  const circumference = 2 * Math.PI * r
                  const dashOffset = circumference - (pct / 100) * circumference
                  return (
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:16 }}>
                      <svg viewBox="0 0 180 180" width={180} height={180}>
                        <circle cx={cx} cy={cy} r={r} fill="none" stroke={C.border} strokeWidth={18}/>
                        <circle cx={cx} cy={cy} r={r} fill="none" stroke={C.green} strokeWidth={18}
                          strokeDasharray={circumference} strokeDashoffset={dashOffset}
                          strokeLinecap="round" transform={`rotate(-90 ${cx} ${cy})`} style={{ transition:'stroke-dashoffset 0.6s ease' }}/>
                        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" fontSize={22} fontWeight={800} fill={C.navy}>{pct}%</text>
                        <text x={cx} y={cy+20} textAnchor="middle" dominantBaseline="central" fontSize={11} fill={C.muted}>حضور</text>
                      </svg>
                      <div style={{ display:'flex', gap:20 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                          <div style={{ width:12, height:12, borderRadius:3, background:C.green }}/>
                          <span style={{ fontSize:12, color:C.text }}>حضروا ({attended})</span>
                        </div>
                        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                          <div style={{ width:12, height:12, borderRadius:3, background:C.border }}/>
                          <span style={{ fontSize:12, color:C.text }}>غابوا ({count-attended})</span>
                        </div>
                      </div>
                    </div>
                  )
                })()}
              </div>
            </div>

            {/* Ticket stats */}
            {tickets.length > 0 && (
              <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:8, padding:22, marginTop:16 }}>
                <h3 style={{ fontSize:15, fontWeight:700, color:C.navy, margin:'0 0 16px' }}>🎫 إحصائيات التذاكر</h3>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:12 }}>
                  {tickets.map((t: any) => {
                    const sold = t.quantity_sold || 0
                    const pct = t.quantity ? Math.round((sold/t.quantity)*100) : 0
                    return (
                      <div key={t.id} style={{ padding:14, borderRadius:8, border:`1px solid ${C.border}`, background:C.bg }}>
                        <p style={{ fontWeight:700, color:C.navy, margin:'0 0 4px', fontSize:13 }}>{t.name}</p>
                        <p style={{ fontSize:20, fontWeight:800, color:pct>80?'#DC2626':C.green, margin:'0 0 4px' }}>{sold} / {t.quantity||'∞'}</p>
                        {t.quantity > 0 && (
                          <div style={{ height:6, background:C.border, borderRadius:3, overflow:'hidden' }}>
                            <div style={{ height:'100%', width:`${pct}%`, background:pct>80?'#DC2626':C.green, borderRadius:3 }}/>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════
            TAB: STAFFING
        ════════════════════════════════════════ */}
        {tab === 'staffing' && (
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
              <div>
                <h2 style={{ fontSize:17, fontWeight:700, color:C.navy, margin:0 }}>إدارة الكوادر البشرية</h2>
                <p style={{ fontSize:13, color:C.muted, margin:'4px 0 0' }}>{staffingRequests.length} طلب توظيف</p>
              </div>
              <button onClick={() => setShowStaffForm(!showStaffForm)} style={{ padding:'9px 18px', border:'none', borderRadius:6, background:C.orange, color:'#fff', fontWeight:700, fontSize:13, cursor:'pointer' }}>
                + إضافة طلب كوادر
              </button>
            </div>

            {/* Add staff form */}
            {showStaffForm && (
              <div style={{ background:C.card, border:`2px solid ${C.orange}`, borderRadius:8, padding:22, marginBottom:16 }}>
                <h3 style={{ fontSize:14, fontWeight:700, color:C.navy, margin:'0 0 14px' }}>طلب كوادر جديد</h3>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                  <div>
                    <label style={{ fontSize:12, fontWeight:700, color:C.muted, display:'block', marginBottom:5 }}>نوع الدور *</label>
                    <input value={staffForm.role_type} onChange={e=>setStaffForm(f=>({...f,role_type:e.target.value}))} placeholder="مضيف، أمن، تقني..." style={inputStyle}/>
                  </div>
                  <div>
                    <label style={{ fontSize:12, fontWeight:700, color:C.muted, display:'block', marginBottom:5 }}>عدد المطلوبين</label>
                    <input type="number" min={1} value={staffForm.workers_needed} onChange={e=>setStaffForm(f=>({...f,workers_needed:Number(e.target.value)}))} style={inputStyle}/>
                  </div>
                  <div>
                    <label style={{ fontSize:12, fontWeight:700, color:C.muted, display:'block', marginBottom:5 }}>الأجر اليومي (ريال)</label>
                    <input type="number" min={0} value={staffForm.daily_rate} onChange={e=>setStaffForm(f=>({...f,daily_rate:Number(e.target.value)}))} style={inputStyle}/>
                  </div>
                  <div>
                    <label style={{ fontSize:12, fontWeight:700, color:C.muted, display:'block', marginBottom:5 }}>ساعات العمل</label>
                    <input type="number" min={1} max={24} value={staffForm.duration_hours} onChange={e=>setStaffForm(f=>({...f,duration_hours:Number(e.target.value)}))} style={inputStyle}/>
                  </div>
                  <div>
                    <label style={{ fontSize:12, fontWeight:700, color:C.muted, display:'block', marginBottom:5 }}>تفضيل الجنس</label>
                    <select value={staffForm.gender_preference} onChange={e=>setStaffForm(f=>({...f,gender_preference:e.target.value}))} style={inputStyle}>
                      <option value="any">لا يهم</option>
                      <option value="male">ذكر</option>
                      <option value="female">أنثى</option>
                    </select>
                  </div>
                  <div style={{ gridColumn:'1/-1' }}>
                    <label style={{ fontSize:12, fontWeight:700, color:C.muted, display:'block', marginBottom:5 }}>الوصف والمتطلبات</label>
                    <textarea value={staffForm.description} onChange={e=>setStaffForm(f=>({...f,description:e.target.value}))} rows={2} placeholder="تفاصيل إضافية عن الدور والمتطلبات..." style={{ ...inputStyle, resize:'vertical' }}/>
                  </div>
                </div>
                <div style={{ display:'flex', gap:10, marginTop:14 }}>
                  <button onClick={saveStaffRequest} disabled={!staffForm.role_type||staffSaving} style={{ padding:'9px 20px', border:'none', borderRadius:6, background:C.orange, color:'#fff', fontWeight:700, fontSize:13, cursor:'pointer' }}>
                    {staffSaving ? 'جاري الحفظ...' : 'إرسال الطلب'}
                  </button>
                  <button onClick={()=>setShowStaffForm(false)} style={{ padding:'9px 20px', border:`1px solid ${C.border}`, borderRadius:6, background:C.card, color:C.text, fontWeight:600, fontSize:13, cursor:'pointer' }}>
                    إلغاء
                  </button>
                </div>
              </div>
            )}

            {/* Staff requests list */}
            {staffingRequests.length === 0 ? (
              <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:8, padding:'60px 20px', textAlign:'center' }}>
                <p style={{ fontSize:48, margin:'0 0 12px' }}>👷</p>
                <h3 style={{ color:C.navy, margin:'0 0 6px' }}>لا توجد طلبات كوادر بعد</h3>
                <p style={{ color:C.muted, fontSize:13, margin:0 }}>أضف طلب كوادر لاستقطاب العمالة لهذه الفعالية</p>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                {staffingRequests.map((req: any) => {
                  const sc = STAFFING_STATUS[req.status] || STAFFING_STATUS.open
                  return (
                    <div key={req.id} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:8, padding:20 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
                        <div>
                          <p style={{ fontWeight:700, color:C.navy, margin:'0 0 4px', fontSize:15 }}>{req.role_type || req.title}</p>
                          <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                            <span style={{ padding:'2px 10px', borderRadius:4, fontSize:12, fontWeight:700, background:sc.bg, color:sc.color }}>{sc.label}</span>
                            <span style={{ fontSize:12, color:C.muted }}>طلب #{req.id?.slice(0,8)}</span>
                          </div>
                        </div>
                        <span style={{ fontSize:13, color:C.muted }}>{new Date(req.created_at).toLocaleDateString('ar-SA')}</span>
                      </div>
                      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, padding:'12px 0', borderTop:`1px solid ${C.border}`, borderBottom:`1px solid ${C.border}`, marginBottom:12 }}>
                        {[
                          { label:'المطلوبون', val:`${req.workers_needed} شخص` },
                          { label:'المؤكدون',  val:`${req.workers_confirmed || 0} شخص` },
                          { label:'الأجر اليومي', val: req.daily_rate > 0 ? `${req.daily_rate?.toLocaleString('ar')} ريال` : 'غير محدد' },
                          { label:'ساعات العمل', val:`${req.duration_hours || 8} ساعة` },
                        ].map(({ label, val }) => (
                          <div key={label}>
                            <p style={{ fontSize:11, color:C.muted, margin:'0 0 2px' }}>{label}</p>
                            <p style={{ fontSize:14, fontWeight:700, color:C.navy, margin:0 }}>{val}</p>
                          </div>
                        ))}
                      </div>
                      {req.description && <p style={{ fontSize:13, color:C.text, margin:'0 0 12px', lineHeight:1.6 }}>{req.description}</p>}
                      <div style={{ display:'flex', gap:8 }}>
                        <Link href="/staffing" style={{ padding:'7px 14px', border:`1px solid ${C.border}`, borderRadius:6, background:C.card, color:C.text, fontWeight:600, fontSize:12, textDecoration:'none' }}>
                          عرض المتقدمين ←
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════
            TAB: SETTINGS
        ════════════════════════════════════════ */}
        {tab === 'settings' && (
          <div style={{ maxWidth:600 }}>
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:8, padding:22, marginBottom:16 }}>
              <h2 style={{ fontSize:15, fontWeight:700, color:C.navy, margin:'0 0 14px' }}>حالة الفعالية</h2>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10, marginBottom:16 }}>
                {[
                  { val:'draft',     label:'مسودة',   desc:'غير منشورة', icon:'📝' },
                  { val:'published', label:'منشور',   desc:'متاحة للعامة', icon:'🚀' },
                  { val:'completed', label:'مكتملة',  desc:'انتهت الفعالية', icon:'✅' },
                  { val:'cancelled', label:'ملغاة',   desc:'تم الإلغاء', icon:'❌' },
                ].map(({ val, label, desc, icon }) => {
                  const cfg = STATUS_CONFIG[val] || STATUS_CONFIG.draft
                  return (
                    <div key={val} onClick={() => setNewStatus(val)} style={{ padding:14, borderRadius:8, cursor:'pointer', border:`2px solid ${newStatus===val?cfg.color:C.border}`, background:newStatus===val?cfg.bg:C.card, transition:'all 0.15s' }}>
                      <p style={{ fontSize:20, margin:'0 0 4px' }}>{icon}</p>
                      <p style={{ fontWeight:700, color:newStatus===val?cfg.color:C.text, margin:'0 0 3px', fontSize:14 }}>{label}</p>
                      <p style={{ fontSize:11, color:C.muted, margin:0 }}>{desc}</p>
                    </div>
                  )
                })}
              </div>
              <button onClick={saveSettings} disabled={saving} style={{ padding:'10px 24px', border:'none', borderRadius:6, background:saving?C.muted:C.orange, color:'#fff', fontWeight:700, fontSize:14, cursor:'pointer' }}>
                {saving ? 'جاري الحفظ...' : 'حفظ الحالة'}
              </button>
            </div>

            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:8, padding:22, marginBottom:16 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
                <h2 style={{ fontSize:15, fontWeight:700, color:C.navy, margin:0 }}>معلومات الفعالية</h2>
                <Link href={`/events/${id}/edit`} style={{ color:C.orange, fontSize:13, fontWeight:600, textDecoration:'none' }}>تعديل ✏️</Link>
              </div>
              {[
                ['العنوان', event.title],
                ['الموقع', event.location||'—'],
                ['التصنيف', [event.category, event.subcategory].filter(Boolean).join(' › ') || '—'],
                ['تاريخ البداية', event.start_date?new Date(event.start_date).toLocaleDateString('ar-SA'):'—'],
                ['تاريخ النهاية', event.end_date?new Date(event.end_date).toLocaleDateString('ar-SA'):'—'],
                ['الطاقة', event.capacity||'غير محدودة'],
                ['الرؤية', event.is_public?'عام':'خاص'],
              ].map(([k,v]) => (
                <div key={k} style={{ display:'flex', gap:12, padding:'8px 0', borderBottom:`1px solid ${C.border}` }}>
                  <span style={{ fontSize:13, color:C.muted, minWidth:130 }}>{k}</span>
                  <span style={{ fontSize:13, fontWeight:600, color:C.text }}>{v}</span>
                </div>
              ))}
            </div>

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

const inputStyle: React.CSSProperties = {
  width:'100%', padding:'9px 12px', border:`1px solid #DBDAE3`,
  borderRadius:6, fontSize:13, fontFamily:'inherit', color:'#39364F',
  background:'#FAFAFA', boxSizing:'border-box'
}
