'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState, useMemo } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'

const C = { navy:'#1E0A3C', orange:'#F05537', text:'#39364F', muted:'#6F7287', border:'#DBDAE3', bg:'#F8F7FA', card:'#FFF', green:'#3A7D0A', red:'#DC2626' }

const NOTIFICATION_GROUPS = [
  {
    id: 'events',
    label: '📅 الفعاليات',
    color: '#4A90D9',
    bg: '#EEF5FD',
    items: [
      { key: 'event_new',        label: 'فعالية جديدة',          desc: 'عند إضافة فعالية في تخصصك' },
      { key: 'event_reminder',   label: 'تذكير قبل الفعالية',    desc: '24 ساعة قبل موعد الفعالية' },
      { key: 'ticket_confirmed', label: 'تأكيد التذكرة',          desc: 'عند التسجيل بفعالية بنجاح' },
    ]
  },
  {
    id: 'staffing',
    label: '👷 الكوادر',
    color: '#6B3FA0',
    bg: '#F0EDFF',
    items: [
      { key: 'staff_application_received', label: 'طلب كوادر جديد',    desc: 'للمنظم: عند تقدم كوادر لطلبك' },
      { key: 'staff_application_accepted', label: 'قُبل طلبك',         desc: 'للكادر: عند قبول طلب العمل' },
      { key: 'staff_shift_reminder',       label: 'تذكير الوردية',     desc: 'ساعتان قبل بدء الوردية' },
    ]
  },
  {
    id: 'influencer',
    label: '🌟 حملات المؤثرين',
    color: '#E05530',
    bg: '#FEF0ED',
    items: [
      { key: 'inf_proposal_received', label: 'عرض مؤثر جديد',    desc: 'للمنظم: عند تقديم مؤثر عرضاً' },
      { key: 'inf_proposal_accepted', label: 'قُبل عرضك',         desc: 'للمؤثر: عند قبول عرضك' },
      { key: 'inf_payment_held',      label: 'مبلغ في Escrow',    desc: 'للمؤثر: عند إيداع المبلغ' },
      { key: 'inf_content_submitted', label: 'محتوى مُسلَّم',     desc: 'للمنظم: عند رفع المؤثر محتواه' },
      { key: 'inf_payment_released',  label: 'تم إفراج المبلغ',   desc: 'للمؤثر: عند تحويل المبلغ' },
    ]
  },
  {
    id: 'system',
    label: '🔔 النظام',
    color: C.muted,
    bg: '#F1F1F1',
    items: [
      { key: 'system_updates', label: 'تحديثات المنتج', desc: 'ميزات وإعلانات جديدة' },
    ]
  }
]

const STATUS_CFG: Record<string,{label:string; color:string; bg:string; icon:string}> = {
  sent:   { label:'أُرسل',     color:C.green,  bg:'#EAF7E0', icon:'✅' },
  mock:   { label:'محاكاة',    color:'#6B3FA0',bg:'#F0EDFF', icon:'🔵' },
  failed: { label:'فشل',       color:C.red,    bg:'#FEF2F2', icon:'❌' },
}

const CAT_ICONS: Record<string,string> = {
  events:'📅', staffing:'👷', influencer:'🌟', system:'🔔'
}

export default function NotificationsPage() {
  const sb = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), [])
  const router = useRouter()

  const [prefs, setPrefs] = useState<any>(null)
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [tab, setTab] = useState<'settings'|'log'>('settings')
  const [phone, setPhone] = useState('')
  const [saved, setSaved] = useState(false)
  const [userId, setUserId] = useState('')
  const [logFilter, setLogFilter] = useState('all')

  useEffect(() => {
    sb.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push('/login'); return }
      setUserId(data.user.id)

      // Load prefs
      const { data: p } = await sb.from('notification_preferences').select('*').eq('user_id', data.user.id).single()
      if (p) { setPrefs(p); setPhone(p.phone || '') }
      else {
        // Create default
        const { data: np } = await sb.from('notification_preferences').insert({ user_id: data.user.id }).select().single()
        setPrefs(np)
      }

      // Load log
      const { data: l } = await sb.from('notification_log').select('*').eq('user_id', data.user.id).order('created_at', { ascending:false }).limit(50)
      setLogs(l || [])
      setLoading(false)
    })
  }, [])

  function toggle(key: string) {
    setPrefs((p: any) => ({ ...p, [key]: !p[key] }))
  }

  async function save() {
    setSaving(true)
    await sb.from('notification_preferences').update({ ...prefs, phone, updated_at: new Date().toISOString() }).eq('user_id', userId)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  async function sendTest() {
    if (!phone) { alert('أدخل رقم واتساب أولاً'); return }
    setTesting(true)
    try {
      const res = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type:'test', userId, phone, data:{} })
      })
      const d = await res.json()
      if (d.ok) {
        const { data: l } = await sb.from('notification_log').select('*').eq('user_id', userId).order('created_at', { ascending:false }).limit(50)
        setLogs(l || [])
        alert(d.mock ? '✅ محاكاة ناجحة — الإشعار سُجّل في السجل (mock mode)' : '✅ تم إرسال رسالة اختبار على واتساب!')
      } else {
        alert('❌ فشل الإرسال: ' + d.error)
      }
    } catch {
      alert('❌ خطأ في الاتصال')
    }
    setTesting(false)
  }

  const filteredLogs = logFilter === 'all' ? logs : logs.filter(l => l.category === logFilter || l.status === logFilter)

  const stats = {
    total: logs.length,
    sent: logs.filter(l=>l.status==='sent').length,
    mock: logs.filter(l=>l.status==='mock').length,
    failed: logs.filter(l=>l.status==='failed').length,
  }

  if (loading) return <div style={{ padding:60, textAlign:'center', color:C.muted, direction:'rtl' }}>⏳ جاري التحميل...</div>

  return (
    <div style={{ padding:'28px 24px', direction:'rtl', minHeight:'100vh', background:C.bg, fontFamily:"'Tajawal',sans-serif" }}>
      <div style={{ maxWidth:900, margin:'0 auto' }}>

        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24 }}>
          <div>
            <h1 style={{ fontSize:24, fontWeight:800, color:C.navy, margin:'0 0 4px' }}>📲 إشعارات واتساب</h1>
            <p style={{ color:C.muted, fontSize:13, margin:0 }}>تحكم في الإشعارات التي تصلك على واتساب</p>
          </div>
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            <div style={{ padding:'5px 12px', background: prefs ? '#EAF7E0' : '#FEF2F2', borderRadius:20, fontSize:12, fontWeight:700, color: prefs ? C.green : C.red }}>
              {prefs ? '🟢 نشط' : '🔴 غير مفعّل'}
            </div>
          </div>
        </div>

        {/* Phone + Test */}
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:20, marginBottom:20 }}>
          <h3 style={{ fontSize:15, fontWeight:800, color:C.navy, margin:'0 0 14px' }}>📱 رقم واتساب</h3>
          <div style={{ display:'flex', gap:10, alignItems:'flex-end', flexWrap:'wrap' }}>
            <div style={{ flex:1, minWidth:200 }}>
              <label style={{ fontSize:12, fontWeight:600, color:C.muted, display:'block', marginBottom:6 }}>الرقم مع مفتاح الدولة</label>
              <input
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+966501234567"
                style={{ width:'100%', padding:'11px 14px', border:`1.5px solid ${C.border}`, borderRadius:8, fontSize:14, fontFamily:'inherit', color:C.text, background:C.card, outline:'none', boxSizing:'border-box', direction:'ltr', textAlign:'left' }}
              />
            </div>
            <button onClick={sendTest} disabled={testing || !phone} style={{ padding:'11px 18px', background: testing ? C.border : '#25D366', border:'none', borderRadius:8, color:'#fff', fontWeight:700, fontSize:13, cursor: testing||!phone ? 'not-allowed' : 'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:6, whiteSpace:'nowrap' }}>
              {testing ? '⏳...' : '📤 اختبار'}
            </button>
            <button onClick={save} disabled={saving} style={{ padding:'11px 20px', background: saved ? C.green : C.orange, border:'none', borderRadius:8, color:'#fff', fontWeight:800, fontSize:13, cursor: saving ? 'wait' : 'pointer', fontFamily:'inherit', whiteSpace:'nowrap' }}>
              {saving ? '⏳...' : saved ? '✅ حُفظ!' : '💾 حفظ'}
            </button>
          </div>
          <p style={{ fontSize:11, color:C.muted, margin:'8px 0 0' }}>
            💡 النظام في وضع المحاكاة (Mock) — لتفعيل واتساب الحقيقي أضف <code>WHATSAPP_TOKEN</code> + <code>WHATSAPP_PHONE_ID</code> في Vercel
          </p>
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', gap:0, borderBottom:`1px solid ${C.border}`, marginBottom:20 }}>
          {[['settings','⚙️ إعدادات الإشعارات'],['log','📋 سجل الإرسال']].map(([v,l]) => (
            <button key={v} onClick={() => setTab(v as any)} style={{ padding:'9px 20px', background:'none', border:'none', cursor:'pointer', fontFamily:'inherit', fontSize:13, fontWeight:tab===v?700:400, color:tab===v?C.orange:C.muted, borderBottom:tab===v?`2px solid ${C.orange}`:'2px solid transparent', marginBottom:-1 }}>{l}</button>
          ))}
        </div>

        {/* ── SETTINGS TAB ───────────────────────────────── */}
        {tab === 'settings' && (
          <div style={{ display:'grid', gap:14 }}>
            {NOTIFICATION_GROUPS.map(group => (
              <div key={group.id} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, overflow:'hidden' }}>
                {/* Group header */}
                <div style={{ padding:'14px 18px', background:group.bg, borderBottom:`1px solid ${C.border}` }}>
                  <h3 style={{ fontSize:15, fontWeight:800, color:C.navy, margin:0 }}>{group.label}</h3>
                </div>
                {/* Items */}
                <div style={{ padding:'8px 0' }}>
                  {group.items.map((item, i) => {
                    const enabled = prefs?.[item.key] ?? true
                    return (
                      <div key={item.key} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 18px', borderBottom: i < group.items.length-1 ? `1px solid ${C.border}` : 'none' }}>
                        <div>
                          <div style={{ fontSize:14, fontWeight:600, color:C.text, marginBottom:2 }}>{item.label}</div>
                          <div style={{ fontSize:12, color:C.muted }}>{item.desc}</div>
                        </div>
                        {/* Toggle switch */}
                        <button onClick={() => toggle(item.key)} style={{
                          width:46, height:26, borderRadius:13, border:'none', cursor:'pointer',
                          background: enabled ? '#25D366' : C.border,
                          position:'relative', transition:'background .2s', flexShrink:0
                        }}>
                          <div style={{
                            position:'absolute', top:3, width:20, height:20, borderRadius:'50%', background:'#fff',
                            transition:'left .2s, right .2s',
                            left: enabled ? 'auto' : 3,
                            right: enabled ? 3 : 'auto',
                            boxShadow:'0 1px 3px rgba(0,0,0,.2)'
                          }}/>
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}

            {/* Save button */}
            <button onClick={save} disabled={saving} style={{ padding:'14px', background: saved ? C.green : C.orange, border:'none', borderRadius:12, color:'#fff', fontWeight:900, fontSize:15, cursor: saving ? 'wait' : 'pointer', fontFamily:'inherit' }}>
              {saving ? '⏳ جاري الحفظ...' : saved ? '✅ تم حفظ الإعدادات!' : '💾 حفظ الإعدادات'}
            </button>
          </div>
        )}

        {/* ── LOG TAB ────────────────────────────────────── */}
        {tab === 'log' && (
          <div>
            {/* Stats */}
            <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap' }}>
              {[
                { label:'إجمالي', value:stats.total, color:C.navy },
                { label:'✅ أُرسل', value:stats.sent, color:C.green },
                { label:'🔵 محاكاة', value:stats.mock, color:'#6B3FA0' },
                { label:'❌ فشل', value:stats.failed, color:C.red },
              ].map(s => (
                <div key={s.label} style={{ padding:'10px 18px', background:C.card, border:`1px solid ${C.border}`, borderRadius:10, textAlign:'center', minWidth:80 }}>
                  <div style={{ fontSize:20, fontWeight:900, color:s.color }}>{s.value}</div>
                  <div style={{ fontSize:11, color:C.muted }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Filter */}
            <div style={{ display:'flex', gap:8, marginBottom:14, flexWrap:'wrap' }}>
              {[['all','الكل'],['events','الفعاليات'],['staffing','الكوادر'],['influencer','المؤثرون'],['sent','أُرسل'],['mock','محاكاة'],['failed','فشل']].map(([v,l]) => (
                <button key={v} onClick={() => setLogFilter(v)} style={{ padding:'6px 14px', borderRadius:20, cursor:'pointer', fontFamily:'inherit', fontSize:12, fontWeight:600, border: logFilter===v ? `1.5px solid ${C.orange}` : `1px solid ${C.border}`, background: logFilter===v ? '#FEF0ED' : C.card, color: logFilter===v ? C.orange : C.text }}>{l}</button>
              ))}
            </div>

            {filteredLogs.length === 0 ? (
              <div style={{ textAlign:'center', padding:60, background:C.card, borderRadius:14, border:`2px dashed ${C.border}` }}>
                <div style={{ fontSize:40, marginBottom:8 }}>📭</div>
                <p style={{ color:C.muted, fontSize:14 }}>لا توجد إشعارات بعد — اضغط "اختبار" لترى النظام في العمل</p>
              </div>
            ) : (
              <div style={{ display:'grid', gap:8 }}>
                {filteredLogs.map(log => {
                  const st = STATUS_CFG[log.status] || STATUS_CFG.mock
                  return (
                    <div key={log.id} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:'12px 16px', display:'flex', gap:12, alignItems:'flex-start' }}>
                      <div style={{ fontSize:20, flexShrink:0 }}>{CAT_ICONS[log.category] || '🔔'}</div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:4 }}>
                          <span style={{ fontSize:13, fontWeight:700, color:C.navy }}>{log.title}</span>
                          <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:20, background:st.bg, color:st.color, flexShrink:0, marginRight:8 }}>{st.icon} {st.label}</span>
                        </div>
                        <p style={{ fontSize:12, color:C.muted, margin:'0 0 4px', lineHeight:1.5, whiteSpace:'pre-line', overflow:'hidden', maxHeight:40 }}>
                          {log.message.split('\n')[0]}
                        </p>
                        <div style={{ display:'flex', gap:12, fontSize:11, color:C.muted }}>
                          <span>📱 {log.phone}</span>
                          <span>🕐 {new Date(log.created_at).toLocaleString('ar-SA')}</span>
                          {log.provider !== 'mock' && <span>🆔 {log.external_id?.slice(0,12)}</span>}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
