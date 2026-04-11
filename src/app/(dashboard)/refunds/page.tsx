'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState, useMemo } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import MobilePageHeader from '@/components/layout/MobilePageHeader'

const C = { navy:'#1E0A3C', orange:'#F05537', muted:'#6F7287', border:'#DBDAE3', card:'#FFFFFF' }

const POLICY_LABELS: Record<string,{label:string;desc:string;color:string;bg:string}> = {
  flexible:    { label:'مرن',           desc:'استرداد كامل قبل 72 ساعة',     color:'#166534', bg:'#EAF7E0' },
  moderate:    { label:'معتدل',         desc:'استرداد 50% قبل 48 ساعة',      color:'#854F0B', bg:'#FAEEDA' },
  strict:      { label:'صارم',          desc:'استرداد 25% قبل 24 ساعة',      color:'#991B1B', bg:'#FEF2F2' },
  no_refund:   { label:'لا استرداد',    desc:'غير قابل للاسترداد',          color:'#6F7287', bg:'#F8F7FA' },
  full_refund: { label:'استرداد كامل',  desc:'استرداد كامل في أي وقت',      color:'#166534', bg:'#EAF7E0' },
  partial_refund:{ label:'استرداد جزئي',desc:'استرداد جزئي حسب الحالة',    color:'#854F0B', bg:'#FAEEDA' },
  custom:      { label:'مخصص',          desc:'سياسة خاصة',                  color:'#185FA5', bg:'#E6F1FB' },
}

const STATUS_MAP: Record<string,{label:string;color:string;bg:string}> = {
  pending:  { label:'قيد المراجعة', color:'#854F0B', bg:'#FAEEDA' },
  approved: { label:'موافق عليه',  color:'#166534', bg:'#EAF7E0' },
  rejected: { label:'مرفوض',       color:'#991B1B', bg:'#FEF2F2' },
  refunded: { label:'تم الاسترداد',color:'#185FA5', bg:'#E6F1FB' },
}

export default function RefundRequestsPage() {
  const sb = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), [])

  const [requests, setRequests] = useState<any[]>([])
  const [events,   setEvents]   = useState<any[]>([])
  const [loading,  setLoading]  = useState(true)
  const [orgId,    setOrgId]    = useState<string|null>(null)
  const [filter,   setFilter]   = useState('all')
  const [resolving, setResolving] = useState<string|null>(null)

  useEffect(() => {
    async function load() {
      const { data:{ user } } = await sb.auth.getUser()
      if (!user) return
      const { data: org } = await sb.from('organizations').select('id').eq('owner_id', user.id).single()
      if (!org) return
      setOrgId(org.id)
      const [{ data: reqs }, { data: evs }] = await Promise.all([
        sb.from('refund_requests').select('*').eq('org_id', org.id).order('requested_at', { ascending:false }),
        sb.from('events').select('id,title,cancellation_policy,refund_deadline_hours,cancellation_note').eq('org_id', org.id)
      ])
      setRequests(reqs || [])
      setEvents(evs || [])
      setLoading(false)
    }
    load()
  }, [])

  async function updatePolicy(eventId: string, policy: string, hours: number, note: string) {
    await sb.from('events').update({
      cancellation_policy: policy,
      refund_deadline_hours: hours,
      cancellation_note: note || null
    }).eq('id', eventId)
    setEvents(prev => prev.map(e => e.id === eventId ? {...e, cancellation_policy:policy, refund_deadline_hours:hours, cancellation_note:note} : e))
  }

  async function resolve(id: string, status: string, note: string) {
    setResolving(id)
    await sb.from('refund_requests').update({ status, admin_note: note || null, resolved_at: new Date().toISOString() }).eq('id', id)
    setRequests(prev => prev.map(r => r.id === id ? {...r, status, admin_note:note, resolved_at:new Date().toISOString()} : r))
    setResolving(null)
  }

  const filtered = filter === 'all' ? requests : requests.filter(r => r.status === filter)
  const pending  = requests.filter(r => r.status === 'pending').length
  const eventMap = Object.fromEntries(events.map(e => [e.id, e]))

  if (loading) return <div style={{ padding:40, textAlign:'center', color:C.muted, fontFamily:'Tajawal,sans-serif' }}>جاري التحميل...</div>

  return (
    <div style={{ direction:'rtl', fontFamily:'Tajawal,sans-serif', padding:'24px 20px', maxWidth:960, margin:'0 auto' }}>
      <MobilePageHeader title="الاسترداد" />

      {/* Header */}
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontSize:22, fontWeight:800, color:C.navy, margin:0 }}>الإلغاء والاسترداد</h1>
        <p style={{ fontSize:13, color:C.muted, margin:'4px 0 0' }}>
          {pending > 0 ? `${pending} طلب بانتظار المراجعة` : 'لا طلبات معلقة'}
        </p>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:24 }}>
        {[
          { label:'إجمالي الطلبات',  val:requests.length,                                 color:C.navy },
          { label:'قيد المراجعة',    val:requests.filter(r=>r.status==='pending').length,  color:'#854F0B' },
          { label:'موافق عليها',     val:requests.filter(r=>r.status==='approved'||r.status==='refunded').length, color:'#166534' },
          { label:'مرفوضة',          val:requests.filter(r=>r.status==='rejected').length, color:'#991B1B' },
        ].map(s => (
          <div key={s.label} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:'14px 18px' }}>
            <p style={{ fontSize:11, color:C.muted, margin:'0 0 4px', fontWeight:600 }}>{s.label}</p>
            <p style={{ fontSize:24, fontWeight:800, color:s.color, margin:0 }}>{s.val}</p>
          </div>
        ))}
      </div>

      {/* Policy settings per event */}
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:20, marginBottom:24 }}>
        <h2 style={{ fontSize:15, fontWeight:700, color:C.navy, margin:'0 0 16px' }}>⚙️ سياسة الإلغاء لكل فعالية</h2>
        {events.length === 0 && <p style={{ color:C.muted, fontSize:13 }}>لا فعاليات منشورة</p>}
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {events.map(ev => (
            <EventPolicyRow key={ev.id} ev={ev} onSave={updatePolicy} />
          ))}
        </div>
      </div>

      {/* Requests list */}
      <div>
        {/* Filter tabs */}
        <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' }}>
          {[
            { val:'all',      label:'الكل' },
            { val:'pending',  label:'قيد المراجعة' },
            { val:'approved', label:'موافق' },
            { val:'rejected', label:'مرفوض' },
            { val:'refunded', label:'تم الاسترداد' },
          ].map(f => (
            <button key={f.val} onClick={() => setFilter(f.val)} style={{
              padding:'7px 16px', borderRadius:20, border:'none', fontFamily:'inherit',
              fontWeight:filter===f.val?700:500, fontSize:13, cursor:'pointer',
              background: filter===f.val ? C.navy : '#F8F7FA',
              color: filter===f.val ? '#fff' : C.muted
            }}>{f.label}</button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign:'center', padding:'48px 20px', background:C.card, border:`1px solid ${C.border}`, borderRadius:14 }}>
            <div style={{ fontSize:40, marginBottom:8 }}>📋</div>
            <p style={{ fontSize:15, fontWeight:700, color:C.navy, margin:'0 0 4px' }}>لا توجد طلبات</p>
            <p style={{ fontSize:13, color:C.muted, margin:0 }}>ستظهر طلبات الاسترداد هنا</p>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {filtered.map(req => (
              <RefundRow key={req.id} req={req} eventMap={eventMap} resolving={resolving} onResolve={resolve} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function EventPolicyRow({ ev, onSave }: { ev:any; onSave:(id:string,p:string,h:number,n:string)=>void }) {
  const C2 = { navy:'#1E0A3C', muted:'#6F7287', border:'#DBDAE3' }
  const [policy, setPolicy] = useState(ev.cancellation_policy || 'flexible')
  const [hours,  setHours]  = useState(String(ev.refund_deadline_hours ?? 48))
  const [note,   setNote]   = useState(ev.cancellation_note || '')
  const [saved,  setSaved]  = useState(false)

  const info = POLICY_LABELS[policy] || POLICY_LABELS.flexible

  async function save() {
    await onSave(ev.id, policy, Number(hours), note)
    setSaved(true); setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div style={{ border:`1px solid ${C2.border}`, borderRadius:10, padding:'14px 16px' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:10, marginBottom:10 }}>
        <p style={{ fontSize:14, fontWeight:700, color:C2.navy, margin:0 }}>{ev.title}</p>
        <span style={{ fontSize:12, padding:'3px 10px', background:info.bg, color:info.color, borderRadius:12, fontWeight:600 }}>
          {info.label}
        </span>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
        <div>
          <label style={{ fontSize:11, color:C2.muted, fontWeight:600, display:'block', marginBottom:4 }}>سياسة الإلغاء</label>
          <select value={policy} onChange={e => setPolicy(e.target.value)}
            style={{ width:'100%', padding:'8px 10px', border:`1px solid ${C2.border}`, borderRadius:8, fontSize:13, fontFamily:'inherit', background:'#fff' }}>
            {Object.entries(POLICY_LABELS).map(([k,v]) => <option key={k} value={k}>{v.label} — {v.desc}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize:11, color:C2.muted, fontWeight:600, display:'block', marginBottom:4 }}>مهلة الإلغاء (ساعة)</label>
          <input type="number" value={hours} onChange={e => setHours(e.target.value)} min="0"
            style={{ width:'100%', padding:'8px 10px', border:`1px solid ${C2.border}`, borderRadius:8, fontSize:13, fontFamily:'inherit', boxSizing:'border-box' }}/>
        </div>
        <div style={{ gridColumn:'1/-1' }}>
          <label style={{ fontSize:11, color:C2.muted, fontWeight:600, display:'block', marginBottom:4 }}>ملاحظة مخصصة (اختياري)</label>
          <input value={note} onChange={e => setNote(e.target.value)} placeholder="سياسة الإلغاء مرنة للمجموعات..."
            style={{ width:'100%', padding:'8px 10px', border:`1px solid ${C2.border}`, borderRadius:8, fontSize:13, fontFamily:'inherit', boxSizing:'border-box' }}/>
        </div>
      </div>
      <button onClick={save} style={{
        marginTop:10, padding:'7px 18px',
        background: saved ? '#EAF7E0' : '#1E0A3C',
        color: saved ? '#166534' : '#fff',
        border: saved ? '1px solid #9DE07B' : 'none',
        borderRadius:8, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit'
      }}>
        {saved ? '✅ تم الحفظ' : 'حفظ السياسة'}
      </button>
    </div>
  )
}

function RefundRow({ req, eventMap, resolving, onResolve }: any) {
  const C2 = { navy:'#1E0A3C', muted:'#6F7287', border:'#DBDAE3', orange:'#F05537' }
  const [adminNote, setAdminNote] = useState(req.admin_note || '')
  const [open, setOpen] = useState(false)
  const st = STATUS_MAP[req.status] || STATUS_MAP.pending
  const ev = eventMap[req.event_id]

  return (
    <div style={{ background:'#fff', border:`1px solid ${C2.border}`, borderRadius:12, overflow:'hidden' }}>
      <div style={{ padding:'14px 18px', display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:10 }}>
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
            <p style={{ fontSize:14, fontWeight:700, color:C2.navy, margin:0 }}>{req.guest_name || 'ضيف'}</p>
            <span style={{ fontSize:11, padding:'3px 10px', background:st.bg, color:st.color, borderRadius:12, fontWeight:600 }}>{st.label}</span>
          </div>
          <p style={{ fontSize:12, color:C2.muted, margin:0 }}>{ev?.title || req.event_id}</p>
          {req.guest_email && <p style={{ fontSize:12, color:C2.muted, margin:'2px 0 0' }}>{req.guest_email}</p>}
          {req.reason && <p style={{ fontSize:12, color:C2.navy, margin:'6px 0 0', background:'#F8F7FA', padding:'6px 10px', borderRadius:6 }}>💬 {req.reason}</p>}
        </div>
        <div style={{ textAlign:'left' }}>
          <p style={{ fontSize:11, color:C2.muted, margin:'0 0 2px' }}>
            {new Date(req.requested_at).toLocaleDateString('ar-SA', { year:'numeric', month:'short', day:'numeric' })}
          </p>
          {req.amount > 0 && <p style={{ fontSize:15, fontWeight:800, color:C2.orange, margin:0 }}>{Number(req.amount).toLocaleString('ar-SA')} ريال</p>}
          {req.status === 'pending' && (
            <button onClick={() => setOpen(!open)} style={{
              marginTop:8, padding:'6px 14px', background:C2.navy, color:'#fff',
              border:'none', borderRadius:8, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit'
            }}>{open ? 'إغلاق' : 'مراجعة'}</button>
          )}
        </div>
      </div>
      {open && req.status === 'pending' && (
        <div style={{ borderTop:`1px solid ${C2.border}`, padding:'14px 18px', background:'#FAFAFA' }}>
          <label style={{ fontSize:12, color:C2.muted, fontWeight:600, display:'block', marginBottom:6 }}>ملاحظة للعميل (اختياري)</label>
          <input value={adminNote} onChange={e => setAdminNote(e.target.value)} placeholder="سبب القرار..."
            style={{ width:'100%', padding:'9px 12px', border:`1px solid ${C2.border}`, borderRadius:8, fontSize:13, fontFamily:'inherit', marginBottom:10, boxSizing:'border-box' }}/>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={() => onResolve(req.id, 'approved', adminNote)} disabled={resolving===req.id}
              style={{ flex:1, padding:'9px', background:'#EAF7E0', color:'#166534', border:'1px solid #9DE07B', borderRadius:8, fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
              ✅ موافقة
            </button>
            <button onClick={() => onResolve(req.id, 'refunded', adminNote)} disabled={resolving===req.id}
              style={{ flex:1, padding:'9px', background:'#E6F1FB', color:'#185FA5', border:'1px solid #93C5FD', borderRadius:8, fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
              💸 تم الاسترداد
            </button>
            <button onClick={() => onResolve(req.id, 'rejected', adminNote)} disabled={resolving===req.id}
              style={{ flex:1, padding:'9px', background:'#FEF2F2', color:'#DC2626', border:'1px solid #FECACA', borderRadius:8, fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
              ✕ رفض
            </button>
          </div>
        </div>
      )}
      {req.admin_note && req.status !== 'pending' && (
        <div style={{ borderTop:`1px solid ${C2.border}`, padding:'10px 18px', background:'#F8F7FA' }}>
          <p style={{ fontSize:12, color:C2.muted, margin:0 }}>ملاحظة الإدارة: {req.admin_note}</p>
        </div>
      )}
    </div>
  )
}