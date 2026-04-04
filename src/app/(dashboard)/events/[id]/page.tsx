'use client'
import { useEffect, useState } from 'react'
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

const STATUS_MAP: Record<string,{label:string;color:string;bg:string}> = {
  draft:     {label:'مسودة',  color:'#6F7287', bg:'#F8F7FA'},
  published: {label:'نشط',   color:'#3A7D0A', bg:'#EAF7E0'},
  active:    {label:'نشط',   color:'#3A7D0A', bg:'#EAF7E0'},
  completed: {label:'منتهي', color:'#6F7287', bg:'#F8F7FA'},
  cancelled: {label:'ملغي',  color:'#C6341A', bg:'#FDEDEA'},
}

const REG_STATUS: Record<string,{label:string;color:string;bg:string}> = {
  pending:   {label:'منتظر',  color:'#B07000', bg:'#FFF8E8'},
  confirmed: {label:'مؤكد',  color:'#1A7A4A', bg:'#E8F8F0'},
  attended:  {label:'حضر',   color:'#1A4A9A', bg:'#E8F0FA'},
  cancelled: {label:'ملغي',  color:'#DC2626', bg:'#FEF2F2'},
}

export default function EventDetailPage() {
  const { id } = useParams()
  const router = useRouter()

  const [event, setEvent]       = useState<any>(null)
  const [regs, setRegs]         = useState<any[]>([])
  const [counts, setCounts]     = useState({total:0, attended:0, pending:0, cancelled:0})
  const [loading, setLoading]   = useState(true)
  const [tab, setTab]           = useState('overview')
  const [copied, setCopied]     = useState(false)
  const [statusSaving, setStatusSaving] = useState(false)
  const [search, setSearch]     = useState('')
  const [regFilter, setRegFilter] = useState('all')
  const [checkinLoading, setCheckinLoading] = useState<string|null>(null)

  useEffect(() => {
    if (!id) return
    loadData()
  }, [id])

  async function loadData() {
    setLoading(true)
    const [evRes, regsRes, totalRes, attendedRes, pendingRes, cancelledRes] = await Promise.all([
      sb.from('events').select('*').eq('id', id).single(),
      sb.from('registrations').select('id,guest_name,guest_email,guest_phone,status,qr_code,created_at').eq('event_id', id).order('created_at',{ascending:false}),
      sb.from('registrations').select('*',{count:'exact',head:true}).eq('event_id', id),
      sb.from('registrations').select('*',{count:'exact',head:true}).eq('event_id', id).eq('status','attended'),
      sb.from('registrations').select('*',{count:'exact',head:true}).eq('event_id', id).eq('status','pending'),
      sb.from('registrations').select('*',{count:'exact',head:true}).eq('event_id', id).eq('status','cancelled'),
    ])
    setEvent(evRes.data)
    setRegs(regsRes.data||[])
    setCounts({total:totalRes.count||0, attended:attendedRes.count||0, pending:pendingRes.count||0, cancelled:cancelledRes.count||0})
    setLoading(false)
  }

  async function copyRegLink() {
    const link = `${window.location.origin}/r/${id}`
    await navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(()=>setCopied(false), 2500)
  }

  async function changeStatus(newStatus: string) {
    setStatusSaving(true)
    await sb.from('events').update({status: newStatus}).eq('id', id)
    setEvent((e: any) => ({...e, status: newStatus}))
    setStatusSaving(false)
  }

  async function manualCheckin(regId: string) {
    setCheckinLoading(regId)
    await sb.from('registrations').update({status:'attended', checked_in_at: new Date().toISOString()}).eq('id', regId)
    setRegs(rs => rs.map(r => r.id===regId ? {...r, status:'attended'} : r))
    setCounts(c => ({...c, attended:c.attended+1, pending:Math.max(0,c.pending-1)}))
    setCheckinLoading(null)
  }

  async function exportCSV() {
    const headers = ['الاسم','البريد','الهاتف','الحالة','تاريخ التسجيل']
    const rows = regs.map(r=>[
      r.guest_name||'', r.guest_email||'', r.guest_phone||'',
      REG_STATUS[r.status]?.label||r.status,
      r.created_at?new Date(r.created_at).toLocaleDateString('ar-SA'):''
    ])
    const csv = [headers,...rows].map(r=>r.join(',')).join('\n')
    const blob = new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'})
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href=url; a.download=`${event?.title||'event'}-registrations.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'60vh'}}>
      <div style={{textAlign:'center',color:C.muted}}>
        <div style={{fontSize:32,marginBottom:8}}>⏳</div>
        <p>جاري التحميل...</p>
      </div>
    </div>
  )

  if (!event) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'60vh'}}>
      <div style={{textAlign:'center'}}>
        <div style={{fontSize:48,marginBottom:12}}>❌</div>
        <h2 style={{color:C.navy,margin:'0 0 8px'}}>الفعالية غير موجودة</h2>
        <Link href="/events" style={{color:C.orange,fontWeight:600,fontSize:14}}>← العودة للفعاليات</Link>
      </div>
    </div>
  )

  const s = STATUS_MAP[event.status] || STATUS_MAP.draft
  const fillRate = event.capacity ? Math.round((counts.total/event.capacity)*100) : null
  const regLink = typeof window !== 'undefined' ? `${window.location.origin}/r/${id}` : `/r/${id}`
  const filteredRegs = regs.filter(r => {
    const matchSearch = !search || r.guest_name?.toLowerCase().includes(search.toLowerCase()) || r.guest_email?.toLowerCase().includes(search.toLowerCase())
    const matchFilter = regFilter === 'all' || r.status === regFilter
    return matchSearch && matchFilter
  })

  return (
    <div style={{minHeight:'100vh', background:C.bg, direction:'rtl'}}>

      {/* ── Top header ── */}
      <div style={{background:C.card, borderBottom:`1px solid ${C.border}`, padding:'24px 32px 0'}}>

        {/* Breadcrumb */}
        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:14,fontSize:13}}>
          <Link href="/events" style={{color:C.muted,textDecoration:'none'}}>الفعاليات</Link>
          <span style={{color:C.border}}>/</span>
          <span style={{color:C.text,fontWeight:500}}>{event.title}</span>
        </div>

        {/* Title row */}
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:18,flexWrap:'wrap',gap:12}}>
          <div>
            <h1 style={{fontSize:32,fontWeight:800,margin:'0 0 6px',color:C.navy,letterSpacing:'-0.5px'}}>{event.title}</h1>
            <div style={{display:'flex',gap:16,flexWrap:'wrap'}}>
              {event.start_date && <span style={{fontSize:13,color:C.muted}}>📅 {new Date(event.start_date).toLocaleDateString('ar-SA',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</span>}
              {event.location   && <span style={{fontSize:13,color:C.muted}}>📍 {event.location}</span>}
              {event.category   && <span style={{fontSize:13,color:C.muted}}>🏷 {event.category}</span>}
            </div>
          </div>

          {/* Actions */}
          <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
            {/* Status badge + quick change */}
            <div style={{position:'relative'}}>
              <select value={event.status} onChange={e=>changeStatus(e.target.value)}
                disabled={statusSaving}
                style={{padding:'8px 12px',border:`1px solid ${s.color}`,borderRadius:6,
                  background:s.bg,color:s.color,fontWeight:700,fontSize:13,cursor:'pointer',
                  outline:'none',fontFamily:'inherit'}}>
                {Object.entries(STATUS_MAP).map(([v,{label}])=>(
                  <option key={v} value={v}>{label}</option>
                ))}
              </select>
            </div>
            <button onClick={copyRegLink} style={{
              display:'flex',alignItems:'center',gap:6,
              padding:'8px 14px',border:`1px solid ${C.border}`,borderRadius:6,
              background:copied?'#EAF7E0':C.card,color:copied?C.green:C.text,
              fontWeight:600,fontSize:13,cursor:'pointer',transition:'all 0.2s'}}>
              {copied?'✓ تم النسخ':'📋 نسخ رابط التسجيل'}
            </button>
            <Link href={`/scanner`} style={{
              display:'flex',alignItems:'center',gap:6,
              padding:'8px 14px',border:'none',borderRadius:6,
              background:C.orange,color:'#fff',fontWeight:700,fontSize:13,textDecoration:'none'}}>
              📷 ماسح QR
            </Link>
            <Link href={`/events/new`} style={{
              display:'flex',alignItems:'center',gap:6,
              padding:'8px 14px',border:`1px solid ${C.border}`,borderRadius:6,
              background:C.card,color:C.text,fontWeight:600,fontSize:13,textDecoration:'none'}}>
              ✏️ تعديل
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div style={{display:'flex'}}>
          {[['overview','نظرة عامة'],['attendees',`الزوار (${counts.total})`],['scanner','الماسح'],['settings','الإعدادات']].map(([v,l])=>(
            <button key={v} onClick={()=>setTab(v)} style={{
              padding:'10px 20px',background:'none',border:'none',cursor:'pointer',
              fontSize:14,fontWeight:tab===v?700:400,
              color:tab===v?C.orange:C.muted,
              borderBottom:tab===v?`2px solid ${C.orange}`:'2px solid transparent',
              transition:'all 0.15s',marginBottom:-1}}>
              {l}
            </button>
          ))}
        </div>
      </div>

      <div style={{maxWidth:1060,margin:'0 auto',padding:'24px 32px'}}>

        {/* ═══ TAB: OVERVIEW ═══ */}
        {tab==='overview' && (
          <>
            {/* Stats */}
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14,marginBottom:22}}>
              {[
                {label:'إجمالي التسجيلات', value:counts.total,   icon:'🎟', color:C.orange},
                {label:'حضروا',             value:counts.attended, icon:'✅', color:C.green},
                {label:'قيد الانتظار',      value:counts.pending,  icon:'⏳', color:'#B07000'},
                {label:'الطاقة / الامتلاء', value:event.capacity?`${counts.total}/${event.capacity}${fillRate!==null?` (${fillRate}%)`:''}`:counts.total, icon:'👥', color:C.navy},
              ].map(({label,value,icon,color})=>(
                <div key={label} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:8,padding:'18px 20px'}}>
                  <div style={{fontSize:22,marginBottom:10}}>{icon}</div>
                  <p style={{fontSize:24,fontWeight:800,color,margin:'0 0 4px'}}>{value}</p>
                  <p style={{fontSize:12,color:C.muted,margin:0}}>{label}</p>
                </div>
              ))}
            </div>

            <div style={{display:'grid',gridTemplateColumns:'1fr 300px',gap:18,alignItems:'start'}}>
              {/* Recent registrations */}
              <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:8,overflow:'hidden'}}>
                <div style={{padding:'14px 20px',borderBottom:`1px solid ${C.border}`,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <h2 style={{fontSize:15,fontWeight:700,margin:0,color:C.navy}}>آخر التسجيلات</h2>
                  <div style={{display:'flex',gap:8}}>
                    <button onClick={exportCSV} style={{padding:'6px 12px',border:`1px solid ${C.border}`,borderRadius:6,background:C.bg,fontSize:12,fontWeight:600,cursor:'pointer',color:C.text,display:'flex',alignItems:'center',gap:4}}>
                      ↓ تصدير CSV
                    </button>
                    <button onClick={()=>setTab('attendees')} style={{padding:'6px 12px',border:'none',borderRadius:6,background:'#FEF0ED',color:C.orange,fontSize:12,fontWeight:700,cursor:'pointer'}}>
                      عرض الكل
                    </button>
                  </div>
                </div>
                {regs.length===0?(
                  <div style={{textAlign:'center',padding:'40px 0',color:C.muted}}>
                    <p style={{fontSize:40,margin:'0 0 8px'}}>👥</p>
                    <p style={{fontWeight:600,color:C.navy,margin:'0 0 4px'}}>لا يوجد زوار مسجلون بعد</p>
                    <p style={{fontSize:13,margin:'0 0 14px'}}>شارك رابط التسجيل لبدء استقبال الزوار</p>
                    <button onClick={copyRegLink} style={{padding:'8px 18px',border:'none',borderRadius:6,background:C.orange,color:'#fff',fontWeight:700,fontSize:13,cursor:'pointer'}}>
                      📋 نسخ رابط التسجيل
                    </button>
                  </div>
                ):regs.slice(0,8).map((r,i)=>{
                  const rs=REG_STATUS[r.status]||REG_STATUS.pending
                  return (
                    <div key={r.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 20px',borderBottom:i<Math.min(regs.length,8)-1?`1px solid ${C.border}`:'none',transition:'background 0.12s'}}
                      onMouseEnter={e=>(e.currentTarget.style.background='#F8F7FA')}
                      onMouseLeave={e=>(e.currentTarget.style.background='transparent')}>
                      <div>
                        <p style={{fontWeight:700,fontSize:13,margin:0,color:C.navy}}>{r.guest_name||'—'}</p>
                        <p style={{fontSize:11,color:C.muted,margin:'2px 0 0'}}>{r.guest_email||r.guest_phone||'—'}</p>
                      </div>
                      <div style={{display:'flex',gap:8,alignItems:'center'}}>
                        {r.status!=='attended'&&(
                          <button onClick={()=>manualCheckin(r.id)} disabled={checkinLoading===r.id} style={{padding:'4px 10px',border:'none',borderRadius:4,background:'#E8F8F0',color:C.green,fontSize:11,fontWeight:600,cursor:'pointer'}}>
                            {checkinLoading===r.id?'...':'✓ تسجيل دخول'}
                          </button>
                        )}
                        <span style={{padding:'3px 10px',borderRadius:4,fontSize:11,fontWeight:600,background:rs.bg,color:rs.color}}>{rs.label}</span>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Right: Event info + Quick actions */}
              <div style={{display:'flex',flexDirection:'column',gap:14}}>
                {/* Registration link */}
                <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:8,padding:18}}>
                  <h3 style={{fontSize:14,fontWeight:700,color:C.navy,margin:'0 0 12px'}}>🔗 رابط التسجيل</h3>
                  <div style={{background:C.bg,borderRadius:6,padding:'10px 12px',fontSize:12,color:C.muted,wordBreak:'break-all',marginBottom:10}}>
                    {regLink}
                  </div>
                  <button onClick={copyRegLink} style={{width:'100%',padding:'9px',border:'none',borderRadius:6,background:copied?C.green:C.orange,color:'#fff',fontWeight:700,fontSize:13,cursor:'pointer',transition:'background 0.3s'}}>
                    {copied?'✓ تم النسخ':'نسخ الرابط'}
                  </button>
                </div>

                {/* Quick actions */}
                <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:8,padding:18}}>
                  <h3 style={{fontSize:14,fontWeight:700,color:C.navy,margin:'0 0 12px'}}>⚡ إجراءات سريعة</h3>
                  <div style={{display:'flex',flexDirection:'column',gap:8}}>
                    <Link href="/scanner" style={{display:'flex',alignItems:'center',gap:10,padding:'10px 14px',background:'#FEF0ED',borderRadius:8,textDecoration:'none',fontWeight:600,fontSize:13,color:C.orange}}>
                      <span style={{fontSize:18}}>📷</span>
                      <div><p style={{margin:0,fontWeight:700}}>ماسح QR</p><p style={{margin:0,fontSize:11,color:C.muted}}>تسجيل دخول الزوار</p></div>
                    </Link>
                    <button onClick={exportCSV} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 14px',background:'#F3F0F8',borderRadius:8,border:'none',cursor:'pointer',fontWeight:600,fontSize:13,color:'#6B46C1',width:'100%',textAlign:'right'}}>
                      <span style={{fontSize:18}}>📊</span>
                      <div style={{textAlign:'right'}}><p style={{margin:0,fontWeight:700}}>تصدير Excel</p><p style={{margin:0,fontSize:11,color:C.muted}}>تحميل قائمة الزوار</p></div>
                    </button>
                    <button onClick={()=>setTab('attendees')} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 14px',background:'#E8F0FA',borderRadius:8,border:'none',cursor:'pointer',fontWeight:600,fontSize:13,color:'#1A4A9A',width:'100%',textAlign:'right'}}>
                      <span style={{fontSize:18}}>👥</span>
                      <div style={{textAlign:'right'}}><p style={{margin:0,fontWeight:700}}>إدارة الزوار</p><p style={{margin:0,fontSize:11,color:C.muted}}>{counts.total} مسجّل</p></div>
                    </button>
                  </div>
                </div>

                {/* Event details */}
                <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:8,padding:18}}>
                  <h3 style={{fontSize:14,fontWeight:700,color:C.navy,margin:'0 0 12px'}}>📋 تفاصيل الفعالية</h3>
                  {[
                    ['التاريخ',     event.start_date?new Date(event.start_date).toLocaleDateString('ar-SA',{year:'numeric',month:'long',day:'numeric'}):'—'],
                    ['الموقع',      event.location||'—'],
                    ['التصنيف',    event.category||'—'],
                    ['الطاقة',      event.capacity?.toLocaleString('ar')||'غير محدودة'],
                    ['الحالة',      STATUS_MAP[event.status]?.label||event.status],
                  ].map(([k,v])=>(
                    <div key={k} style={{display:'flex',gap:10,padding:'6px 0',borderBottom:`1px solid ${C.border}`}}>
                      <span style={{fontSize:12,color:C.muted,minWidth:70}}>{k}</span>
                      <span style={{fontSize:12,fontWeight:600,color:C.text}}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* ═══ TAB: ATTENDEES ═══ */}
        {tab==='attendees' && (
          <div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16,flexWrap:'wrap',gap:10}}>
              <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                <input value={search} onChange={e=>setSearch(e.target.value)}
                  placeholder="🔍 بحث بالاسم أو البريد..."
                  style={{padding:'8px 12px',border:`1px solid ${C.border}`,borderRadius:6,fontSize:13,outline:'none',background:C.card,fontFamily:'inherit',color:C.text}}/>
                {[['all','الكل'],['pending','منتظر'],['confirmed','مؤكد'],['attended','حضر'],['cancelled','ملغي']].map(([v,l])=>(
                  <button key={v} onClick={()=>setRegFilter(v)} style={{
                    padding:'7px 14px',borderRadius:50,fontSize:12,fontWeight:600,cursor:'pointer',border:'none',
                    background:regFilter===v?C.orange:'#F8F7FA',
                    color:regFilter===v?'#fff':C.muted}}>
                    {l} {v==='all'?`(${counts.total})`:v==='attended'?`(${counts.attended})`:v==='pending'?`(${counts.pending})`:''}
                  </button>
                ))}
              </div>
              <button onClick={exportCSV} style={{padding:'8px 16px',border:`1px solid ${C.border}`,borderRadius:6,background:C.card,fontSize:13,fontWeight:600,cursor:'pointer',color:C.text,display:'flex',alignItems:'center',gap:6}}>
                ↓ تصدير CSV
              </button>
            </div>

            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:8,overflow:'hidden'}}>
              <div style={{display:'grid',gridTemplateColumns:'2fr 2fr 1fr 1fr 120px',padding:'10px 20px',fontSize:11,fontWeight:700,color:C.muted,letterSpacing:'0.06em',textTransform:'uppercase',background:'#F9F8F6'}}>
                <span>الاسم</span><span>التواصل</span><span>تاريخ التسجيل</span><span>الحالة</span><span>إجراء</span>
              </div>
              {filteredRegs.length===0?(
                <div style={{textAlign:'center',padding:'40px',color:C.muted}}>
                  <p style={{fontSize:36,margin:'0 0 8px'}}>👥</p>
                  <p>لا توجد نتائج</p>
                </div>
              ):filteredRegs.map((r,i)=>{
                const rs=REG_STATUS[r.status]||REG_STATUS.pending
                return (
                  <div key={r.id} style={{display:'grid',gridTemplateColumns:'2fr 2fr 1fr 1fr 120px',padding:'13px 20px',alignItems:'center',borderBottom:i<filteredRegs.length-1?`1px solid ${C.border}`:'none',transition:'background 0.12s'}}
                    onMouseEnter={e=>(e.currentTarget.style.background='#F8F7FA')}
                    onMouseLeave={e=>(e.currentTarget.style.background='transparent')}>
                    <p style={{fontWeight:700,fontSize:13,margin:0,color:C.navy}}>{r.guest_name||'—'}</p>
                    <div>
                      <p style={{fontSize:12,color:C.text,margin:0}}>{r.guest_email||'—'}</p>
                      {r.guest_phone&&<p style={{fontSize:11,color:C.muted,margin:'2px 0 0'}}>{r.guest_phone}</p>}
                    </div>
                    <p style={{fontSize:11,color:C.muted,margin:0}}>{r.created_at?new Date(r.created_at).toLocaleDateString('ar-SA'):'—'}</p>
                    <span style={{display:'inline-block',padding:'3px 10px',borderRadius:4,fontSize:11,fontWeight:600,background:rs.bg,color:rs.color}}>{rs.label}</span>
                    <div style={{display:'flex',gap:6}}>
                      {r.status!=='attended'&&(
                        <button onClick={()=>manualCheckin(r.id)} disabled={checkinLoading===r.id} style={{padding:'5px 10px',border:'none',borderRadius:4,background:'#E8F8F0',color:C.green,fontSize:11,fontWeight:700,cursor:'pointer'}}>
                          {checkinLoading===r.id?'...':'✓ دخول'}
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ═══ TAB: SCANNER ═══ */}
        {tab==='scanner' && (
          <div style={{maxWidth:600,margin:'0 auto',textAlign:'center',paddingTop:20}}>
            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:32,marginBottom:16}}>
              <div style={{fontSize:64,marginBottom:16}}>📷</div>
              <h2 style={{fontSize:22,fontWeight:700,color:C.navy,margin:'0 0 8px'}}>ماسح QR — {event.title}</h2>
              <p style={{color:C.muted,margin:'0 0 24px',lineHeight:1.6}}>افتح الماسح لتسجيل دخول الزوار باستخدام رموز QR الخاصة بتذاكرهم</p>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:20}}>
                {[{icon:'✅',label:'حضروا',value:counts.attended,color:C.green,bg:'#EAF7E0'},{icon:'⏳',label:'لم يصلوا بعد',value:counts.total-counts.attended,color:'#B07000',bg:'#FFF8E8'}].map(({icon,label,value,color,bg})=>(
                  <div key={label} style={{background:bg,borderRadius:8,padding:'16px',textAlign:'center'}}>
                    <p style={{fontSize:28,fontWeight:800,color,margin:'0 0 4px'}}>{icon} {value}</p>
                    <p style={{fontSize:12,color:C.muted,margin:0}}>{label}</p>
                  </div>
                ))}
              </div>
              <Link href="/scanner" style={{display:'block',padding:'14px',border:'none',borderRadius:8,background:C.orange,color:'#fff',fontWeight:700,fontSize:16,textDecoration:'none',boxShadow:'0 4px 12px rgba(240,85,55,0.35)'}}>
                📷 فتح الماسح الآن
              </Link>
              <p style={{fontSize:12,color:C.muted,marginTop:12}}>💡 يمكنك توصيل ماسح QR بالـ USB لتسريع عملية الدخول</p>
            </div>

            {/* Manual check-in */}
            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:24}}>
              <h3 style={{fontSize:15,fontWeight:700,color:C.navy,margin:'0 0 14px'}}>تسجيل دخول يدوي</h3>
              <div style={{display:'flex',flexDirection:'column',gap:8,maxHeight:300,overflowY:'auto'}}>
                {regs.filter(r=>r.status!=='attended').slice(0,20).map(r=>(
                  <div key={r.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 14px',background:C.bg,borderRadius:8}}>
                    <div style={{textAlign:'right'}}>
                      <p style={{fontWeight:700,fontSize:13,margin:0,color:C.navy}}>{r.guest_name||'—'}</p>
                      <p style={{fontSize:11,color:C.muted,margin:'2px 0 0'}}>{r.guest_email||r.guest_phone||'—'}</p>
                    </div>
                    <button onClick={()=>manualCheckin(r.id)} disabled={checkinLoading===r.id} style={{padding:'6px 14px',border:'none',borderRadius:6,background:C.green,color:'#fff',fontWeight:700,fontSize:12,cursor:'pointer'}}>
                      {checkinLoading===r.id?'...':'✓ تسجيل دخول'}
                    </button>
                  </div>
                ))}
                {regs.filter(r=>r.status!=='attended').length===0&&(
                  <div style={{textAlign:'center',padding:'20px 0',color:C.muted}}>
                    <p>✅ جميع المسجلين سجّلوا دخولهم</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ═══ TAB: SETTINGS ═══ */}
        {tab==='settings' && (
          <div style={{maxWidth:560}}>
            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:8,padding:24,marginBottom:16}}>
              <h3 style={{fontSize:15,fontWeight:700,color:C.navy,margin:'0 0 16px'}}>تغيير حالة الفعالية</h3>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                {[['published','🟢 نشر الفعالية'],['draft','📝 رجوع لمسودة'],['completed','✅ إنهاء الفعالية'],['cancelled','❌ إلغاء الفعالية']].map(([v,l])=>(
                  <button key={v} onClick={()=>changeStatus(v)} disabled={event.status===v||statusSaving}
                    style={{padding:'10px',border:`1px solid ${event.status===v?STATUS_MAP[v]?.color||C.border:C.border}`,borderRadius:8,
                      background:event.status===v?(STATUS_MAP[v]?.bg||C.bg):C.bg,
                      color:event.status===v?(STATUS_MAP[v]?.color||C.text):C.text,
                      fontWeight:600,fontSize:13,cursor:event.status===v?'not-allowed':'pointer',
                      opacity:event.status===v?0.7:1}}>
                    {l}
                  </button>
                ))}
              </div>
            </div>

            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:8,padding:24,marginBottom:16}}>
              <h3 style={{fontSize:15,fontWeight:700,color:C.navy,margin:'0 0 4px'}}>رابط التسجيل</h3>
              <p style={{fontSize:13,color:C.muted,margin:'0 0 12px'}}>شارك هذا الرابط مع الزوار ليتمكنوا من التسجيل</p>
              <div style={{background:C.bg,borderRadius:6,padding:'10px 12px',fontSize:12,color:C.muted,wordBreak:'break-all',marginBottom:10}}>{regLink}</div>
              <button onClick={copyRegLink} style={{width:'100%',padding:'10px',border:'none',borderRadius:6,background:copied?C.green:C.orange,color:'#fff',fontWeight:700,fontSize:14,cursor:'pointer',transition:'background 0.3s'}}>
                {copied?'✓ تم النسخ':'📋 نسخ الرابط'}
              </button>
            </div>

            <div style={{background:'#FEF2F2',border:'1px solid #DC2626',borderRadius:8,padding:20}}>
              <h3 style={{fontSize:15,fontWeight:700,color:'#DC2626',margin:'0 0 8px'}}>منطقة الخطر</h3>
              <p style={{fontSize:13,color:'#B91C1C',margin:'0 0 14px'}}>هذه الإجراءات لا يمكن التراجع عنها</p>
              <button onClick={()=>changeStatus('cancelled')} disabled={event.status==='cancelled'} style={{padding:'9px 20px',border:'1px solid #DC2626',borderRadius:6,background:'#fff',color:'#DC2626',fontWeight:700,fontSize:13,cursor:'pointer'}}>
                إلغاء الفعالية
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
