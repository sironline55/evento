'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState, useMemo } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import MobilePageHeader from '@/components/layout/MobilePageHeader'

const C = { navy:'#1E0A3C', orange:'#F05537', muted:'#6F7287', border:'#DBDAE3', card:'#FFFFFF' }

const STATUS_STYLE: Record<string, { label:string; bg:string; color:string }> = {
  sent:   { label:'أُرسل',      bg:'#EAF7E0', color:'#166534' },
  mock:   { label:'محاكاة',    bg:'#E6F1FB', color:'#185FA5' },
  failed: { label:'فشل',        bg:'#FEF2F2', color:'#DC2626' },
}

export default function RemindersPage() {
  const sb = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), [])

  const [logs,     setLogs]     = useState<any[]>([])
  const [events,   setEvents]   = useState<any[]>([])
  const [loading,  setLoading]  = useState(true)
  const [testing,  setTesting]  = useState(false)
  const [testResult, setTestResult] = useState<any>(null)
  const [filter,   setFilter]   = useState('all')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await sb.auth.getUser()
      if (!user) return
      const { data: org } = await sb.from('organizations').select('id').eq('owner_id', user.id).single()
      if (!org) return

      // Get event IDs for this org
      const { data: evs } = await sb.from('events')
        .select('id,title,start_date,category_icon')
        .eq('org_id', org.id)
        .order('start_date', { ascending:false })
        .limit(20)

      setEvents(evs || [])
      const eventIds = (evs || []).map((e:any) => e.id)

      // Get notification logs for these events
      const { data: ls } = await sb.from('notification_log')
        .select('*')
        .in('reference_id', eventIds.length ? eventIds : ['00000000-0000-0000-0000-000000000000'])
        .order('created_at', { ascending: false })
        .limit(100)

      setLogs(ls || [])
      setLoading(false)
    }
    load()
  }, [])

  async function runCronNow() {
    setTesting(true); setTestResult(null)
    try {
      const res = await fetch('/api/cron/reminders?secret=' + (process.env.NEXT_PUBLIC_CRON_SECRET || 'dev'))
      const data = await res.json()
      setTestResult(data)
    } catch (e: any) {
      setTestResult({ error: e.message })
    }
    setTesting(false)
    // Reload logs
    const { data: ls } = await sb.from('notification_log')
      .select('*').order('created_at', { ascending:false }).limit(100)
    setLogs(ls || [])
  }

  const eventMap = Object.fromEntries(events.map(e => [e.id, e]))
  const eventLogs = filter === 'all' ? logs : logs.filter(l => l.status === filter)

  const stats = {
    total:  logs.length,
    sent:   logs.filter(l => l.status === 'sent').length,
    mock:   logs.filter(l => l.status === 'mock').length,
    failed: logs.filter(l => l.status === 'failed').length,
  }

  // Upcoming events with registration counts
  const upcomingEvents = events
    .filter(e => new Date(e.start_date) > new Date())
    .slice(0, 5)

  if (loading) return <div style={{ padding:40, textAlign:'center', color:C.muted, fontFamily:'Tajawal,sans-serif' }}>جاري التحميل...</div>

  return (
    <div style={{ direction:'rtl', fontFamily:'Tajawal,sans-serif', padding:'24px 20px', maxWidth:960, margin:'0 auto' }}>
      <MobilePageHeader title="التذكيرات" />

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:800, color:C.navy, margin:0 }}>التذكيرات التلقائية</h1>
          <p style={{ fontSize:13, color:C.muted, margin:'4px 0 0' }}>
            يُرسل الـ Cron تذكيرات واتساب قبل 24 ساعة و1 ساعة من كل فعالية
          </p>
        </div>
        <button onClick={runCronNow} disabled={testing} style={{
          padding:'10px 20px', background: testing ? C.muted : C.orange,
          color:'#fff', border:'none', borderRadius:10,
          fontWeight:700, fontSize:13, cursor: testing ? 'not-allowed':'pointer', fontFamily:'inherit'
        }}>
          {testing ? '⏳ جاري التشغيل...' : '▶ تشغيل الآن'}
        </button>
      </div>

      {/* Cron result */}
      {testResult && (
        <div style={{
          background: testResult.error ? '#FEF2F2' : testResult.sent > 0 ? '#EAF7E0' : '#E6F1FB',
          border: `1px solid ${testResult.error ? '#FECACA' : testResult.sent > 0 ? '#9DE07B' : '#93C5FD'}`,
          borderRadius:12, padding:'14px 18px', marginBottom:20
        }}>
          {testResult.error ? (
            <p style={{ color:'#DC2626', margin:0, fontWeight:600 }}>❌ خطأ: {testResult.error}</p>
          ) : (
            <div>
              <p style={{ color:'#166534', fontWeight:700, margin:'0 0 6px' }}>
                {testResult.mock ? '🧪 وضع المحاكاة — ' : ''}
                نتيجة التشغيل
              </p>
              <div style={{ display:'flex', gap:20, fontSize:13, flexWrap:'wrap' }}>
                <span>📤 أُرسل: <strong>{testResult.sent}</strong></span>
                <span>⏭ تجاوز: <strong>{testResult.skipped}</strong></span>
                <span>❌ فشل: <strong>{testResult.failed}</strong></span>
                <span>📅 فعاليات فُحصت: <strong>{testResult.events_checked}</strong></span>
              </div>
              {testResult.mock && (
                <p style={{ fontSize:11, color:'#185FA5', margin:'8px 0 0' }}>
                  لتفعيل الإرسال الحقيقي: أضف WHATSAPP_TOKEN و WHATSAPP_PHONE_ID في إعدادات Vercel
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:24 }}>
        {[
          { label:'إجمالي المُرسل',  val: stats.total,  color: C.navy },
          { label:'أُرسل فعلاً',     val: stats.sent,   color: '#166534' },
          { label:'محاكاة (mock)',   val: stats.mock,   color: '#185FA5' },
          { label:'فشل',             val: stats.failed, color: '#DC2626' },
        ].map(s => (
          <div key={s.label} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:'14px 18px' }}>
            <p style={{ fontSize:11, color:C.muted, margin:'0 0 4px', fontWeight:600 }}>{s.label}</p>
            <p style={{ fontSize:26, fontWeight:900, color:s.color, margin:0 }}>{s.val}</p>
          </div>
        ))}
      </div>

      {/* How it works */}
      <div style={{ background:'#F0F7FF', border:'1px solid #BFDBFE', borderRadius:14, padding:'16px 20px', marginBottom:24 }}>
        <h3 style={{ fontSize:14, fontWeight:700, color:C.navy, margin:'0 0 10px' }}>⚙️ كيف يعمل الـ Cron</h3>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, fontSize:13, color:C.muted }}>
          {[
            { icon:'🕐', label:'الجدول',         val:'كل ساعة تلقائياً (0 * * * *)' },
            { icon:'📅', label:'تذكير 24 ساعة',  val:'يُرسل قبل الفعالية بـ 23-26 ساعة' },
            { icon:'⏰', label:'تذكير 1 ساعة',   val:'يُرسل قبل الفعالية بـ 1-2 ساعة' },
            { icon:'🔒', label:'منع التكرار',    val:'يُحفظ وقت الإرسال في كل تذكرة' },
            { icon:'🧪', label:'الوضع الحالي',   val:'محاكاة (mock) — بانتظار مفاتيح API' },
            { icon:'📱', label:'الشرط',          val:'فقط المسجلون الذين أدخلوا رقم جوال' },
          ].map(i => (
            <div key={i.label} style={{ display:'flex', gap:8 }}>
              <span>{i.icon}</span>
              <div>
                <span style={{ color:C.navy, fontWeight:600 }}>{i.label}: </span>
                <span>{i.val}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Upcoming events */}
      {upcomingEvents.length > 0 && (
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:'18px 20px', marginBottom:20 }}>
          <h3 style={{ fontSize:14, fontWeight:700, color:C.navy, margin:'0 0 14px' }}>📅 الفعاليات القادمة — مؤهلة للتذكيرات</h3>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {upcomingEvents.map(ev => {
              const evDate = new Date(ev.start_date)
              const hoursLeft = Math.round((evDate.getTime() - Date.now()) / 3600_000)
              const sent24h = logs.filter(l => l.reference_id === ev.id && l.type?.includes('24h')).length
              const sent1h  = logs.filter(l => l.reference_id === ev.id && l.type?.includes('1h')).length
              return (
                <div key={ev.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 14px', background:'#F8F7FA', borderRadius:10, flexWrap:'wrap', gap:8 }}>
                  <div>
                    <p style={{ fontSize:13, fontWeight:700, color:C.navy, margin:0 }}>
                      {ev.category_icon} {ev.title}
                    </p>
                    <p style={{ fontSize:11, color:C.muted, margin:'3px 0 0' }}>
                      {evDate.toLocaleDateString('ar-SA', { weekday:'short', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' })}
                      {' · '}
                      <strong style={{ color: hoursLeft < 2 ? '#DC2626' : hoursLeft < 25 ? C.orange : '#166534' }}>
                        {hoursLeft < 1 ? 'بعد أقل من ساعة' : `بعد ${hoursLeft} ساعة`}
                      </strong>
                    </p>
                  </div>
                  <div style={{ display:'flex', gap:8, fontSize:12 }}>
                    <span style={{ padding:'3px 10px', background: sent24h>0?'#EAF7E0':'#F8F7FA', color:sent24h>0?'#166534':C.muted, borderRadius:12, border:`1px solid ${sent24h>0?'#9DE07B':C.border}` }}>
                      24h: {sent24h} أُرسل
                    </span>
                    <span style={{ padding:'3px 10px', background: sent1h>0?'#EAF7E0':'#F8F7FA', color:sent1h>0?'#166534':C.muted, borderRadius:12, border:`1px solid ${sent1h>0?'#9DE07B':C.border}` }}>
                      1h: {sent1h} أُرسل
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Logs */}
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, overflow:'hidden' }}>
        <div style={{ padding:'14px 20px', borderBottom:`1px solid ${C.border}`, display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:8 }}>
          <h3 style={{ fontSize:14, fontWeight:700, color:C.navy, margin:0 }}>سجل الإشعارات</h3>
          <div style={{ display:'flex', gap:6 }}>
            {[['all','الكل'],['sent','أُرسل'],['mock','محاكاة'],['failed','فشل']].map(([v,l]) => (
              <button key={v} onClick={() => setFilter(v)} style={{
                padding:'5px 12px', borderRadius:16, border:'none', fontFamily:'inherit',
                fontSize:12, cursor:'pointer', fontWeight: filter===v?700:500,
                background: filter===v ? C.navy : '#F8F7FA',
                color: filter===v ? '#fff' : C.muted
              }}>{l}</button>
            ))}
          </div>
        </div>

        {eventLogs.length === 0 ? (
          <div style={{ padding:'40px 20px', textAlign:'center' }}>
            <div style={{ fontSize:40, marginBottom:8 }}>📭</div>
            <p style={{ fontSize:14, fontWeight:700, color:C.navy, margin:'0 0 4px' }}>لا سجلات بعد</p>
            <p style={{ fontSize:13, color:C.muted }}>اضغط "تشغيل الآن" لاختبار الإرسال</p>
          </div>
        ) : (
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
              <thead>
                <tr style={{ background:'#F8F7FA' }}>
                  {['الوقت','النوع','الجوال','الفعالية','الحالة'].map(h => (
                    <th key={h} style={{ padding:'10px 14px', textAlign:'right', color:C.muted, fontWeight:600, fontSize:11 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {eventLogs.slice(0,50).map((log, i) => {
                  const ev = eventMap[log.reference_id]
                  const st = STATUS_STYLE[log.status] || { label:log.status, bg:'#F8F7FA', color:C.muted }
                  return (
                    <tr key={log.id} style={{ borderTop:`1px solid ${C.border}`, background:i%2===0?'#fff':'#FAFAFA' }}>
                      <td style={{ padding:'10px 14px', color:C.muted, fontSize:12, whiteSpace:'nowrap' }}>
                        {new Date(log.created_at).toLocaleString('ar-SA', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' })}
                      </td>
                      <td style={{ padding:'10px 14px', color:C.navy, fontWeight:600 }}>
                        {log.type?.includes('24h') ? '⏰ 24 ساعة' : log.type?.includes('1h') ? '🚨 ساعة' : log.type}
                      </td>
                      <td style={{ padding:'10px 14px', color:C.muted, fontFamily:'monospace', direction:'ltr' }}>
                        {log.phone ? log.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') : '—'}
                      </td>
                      <td style={{ padding:'10px 14px', color:C.navy, maxWidth:200, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {ev?.title || '—'}
                      </td>
                      <td style={{ padding:'10px 14px' }}>
                        <span style={{ fontSize:11, padding:'3px 10px', background:st.bg, color:st.color, borderRadius:12, fontWeight:600, whiteSpace:'nowrap' }}>
                          {st.label}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}