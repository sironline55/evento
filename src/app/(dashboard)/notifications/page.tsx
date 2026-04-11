'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState, useMemo } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'

const C = { navy:'#1E0A3C', orange:'#F05537', text:'#39364F', muted:'#6F7287', border:'#DBDAE3', bg:'#F8F7FA', card:'#FFF', green:'#3A7D0A', red:'#DC2626' }

// ── Role-based notification groups ─────────────────────────────────────────
const ROLE_GROUPS: Record<string, {
  icon: string; label: string; color: string; bg: string; accent: string;
  items: { key: string; label: string; desc: string; emoji: string }[]
}[]> = {
  organizer: [
    {
      icon: '🎪', label: 'فعالياتي', color: '#1E0A3C', bg: '#EEE8F8', accent: '#4A2D9C',
      items: [
        { key: 'event_new',        emoji: '🆕', label: 'فعالية جديدة تضيفها',      desc: 'عند نشر فعالية جديدة بنجاح' },
        { key: 'event_reminder',   emoji: '⏰', label: 'تذكير قبل الفعالية',       desc: '24 ساعة قبل موعد كل فعالية' },
        { key: 'ticket_confirmed', emoji: '🎫', label: 'مشترك جديد في الفعالية',   desc: 'عند تسجيل أي حضور بفعالياتك' },
      ]
    },
    {
      icon: '👷', label: 'طلبات الكوادر', color: '#6B3FA0', bg: '#F0EDFF', accent: '#6B3FA0',
      items: [
        { key: 'staff_application_received', emoji: '📋', label: 'تقدّم كادر لطلبك',       desc: 'عند تقديم شخص طلب للعمل معك' },
      ]
    },
    {
      icon: '🌟', label: 'حملات المؤثرين', color: '#E05530', bg: '#FEF0ED', accent: '#F05537',
      items: [
        { key: 'inf_proposal_received', emoji: '📩', label: 'عرض مؤثر جديد',         desc: 'عند تقديم مؤثر عرضاً على بريفك' },
        { key: 'inf_content_submitted', emoji: '📤', label: 'المؤثر سلّم المحتوى',   desc: 'وقت مراجعة المحتوى وإطلاق المبلغ' },
      ]
    },
  ],
  influencer: [
    {
      icon: '🌟', label: 'نشاطي كمؤثر', color: '#E05530', bg: '#FEF0ED', accent: '#F05537',
      items: [
        { key: 'inf_proposal_accepted', emoji: '🎉', label: 'قبلوا عرضك',           desc: 'عند موافقة المنظم على عرضك' },
        { key: 'inf_payment_held',      emoji: '🔒', label: 'مبلغ محجوز في Escrow', desc: 'عند إيداع المنظم للمبلغ' },
        { key: 'inf_payment_released',  emoji: '💸', label: 'تم تحويل المبلغ',      desc: 'عند الإفراج عن مستحقاتك' },
      ]
    },
    {
      icon: '📅', label: 'الفعاليات', color: '#1E0A3C', bg: '#EEE8F8', accent: '#4A2D9C',
      items: [
        { key: 'event_new',      emoji: '🆕', label: 'فعالية جديدة في تخصصك', desc: 'اكتشف فعاليات تناسب محتواك' },
        { key: 'event_reminder', emoji: '⏰', label: 'تذكير بفعاليات مسجل بها', desc: '24 ساعة قبل الفعالية' },
      ]
    },
  ],
  staff: [
    {
      icon: '💼', label: 'عملي ككادر', color: '#3A7D0A', bg: '#EAF7E0', accent: '#3A7D0A',
      items: [
        { key: 'staff_application_accepted', emoji: '🎉', label: 'تم قبول طلبك',       desc: 'عند قبول طلب العمل في فعالية' },
        { key: 'staff_shift_reminder',       emoji: '⏰', label: 'تذكير وردية العمل',  desc: 'ساعتان قبل بدء وردياتك' },
      ]
    },
    {
      icon: '📅', label: 'فعاليات جديدة', color: '#1E0A3C', bg: '#EEE8F8', accent: '#4A2D9C',
      items: [
        { key: 'event_new',      emoji: '🆕', label: 'فرصة عمل جديدة',         desc: 'عند نشر طلب كوادر في تخصصك' },
        { key: 'ticket_confirmed', emoji: '📋', label: 'تأكيد تسجيلك بفعالية', desc: 'عند تأكيد مشاركتك' },
      ]
    },
  ],
  attendee: [
    {
      icon: '📅', label: 'الفعاليات', color: '#1E0A3C', bg: '#EEE8F8', accent: '#4A2D9C',
      items: [
        { key: 'event_new',        emoji: '🆕', label: 'فعالية جديدة',           desc: 'فعاليات جديدة في اهتماماتك' },
        { key: 'event_reminder',   emoji: '⏰', label: 'تذكير قبل الفعالية',     desc: '24 ساعة قبل فعالياتك المحجوزة' },
        { key: 'ticket_confirmed', emoji: '🎫', label: 'تأكيد الحجز',            desc: 'عند تأكيد تذكرتك' },
      ]
    },
  ],
}

// Keys every role gets
const SYSTEM_GROUP = {
  icon: '🔔', label: 'النظام', color: C.muted, bg: '#F1F1F1', accent: C.muted,
  items: [
    { key: 'system_updates', emoji: '🆕', label: 'تحديثات المنتج', desc: 'ميزات وإعلانات EventVMS الجديدة' },
  ]
}

const STATUS_CFG: Record<string,{label:string; color:string; bg:string; icon:string}> = {
  sent:   { label:'أُرسل',   color:C.green,  bg:'#EAF7E0', icon:'✅' },
  mock:   { label:'تجربة',   color:'#6B3FA0',bg:'#F0EDFF', icon:'🔵' },
  failed: { label:'فشل',     color:C.red,    bg:'#FEF2F2', icon:'❌' },
}

// ── Toggle switch ─────────────────────────────────────────────────────────
function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      style={{
        width:46, height:26, borderRadius:13, border:'none', cursor:'pointer',
        background: on ? '#25D366' : C.border,
        position:'relative', transition:'background .2s', flexShrink:0
      }}
    >
      <div style={{
        position:'absolute', top:3, width:20, height:20, borderRadius:'50%',
        background:'#fff', transition:'all .2s',
        left: on ? 'calc(100% - 23px)' : 3,
        boxShadow:'0 1px 3px rgba(0,0,0,.2)'
      }}/>
    </button>
  )
}

// ── Role Badge ────────────────────────────────────────────────────────────
function RoleBadge({ role, label, active, onClick }: { role:string; label:string; active:boolean; onClick:()=>void }) {
  const icons: Record<string,string> = { organizer:'🎪', influencer:'🌟', staff:'👷', attendee:'🎫' }
  const colors: Record<string,string> = { organizer:C.navy, influencer:C.orange, staff:C.green, attendee:'#6B3FA0' }
  return (
    <button onClick={onClick} style={{
      padding:'10px 16px', borderRadius:12, cursor:'pointer', fontFamily:'inherit',
      border: active ? `2px solid ${colors[role]}` : `1px solid ${C.border}`,
      background: active ? colors[role] : C.card,
      color: active ? '#fff' : C.text,
      fontWeight: active ? 800 : 500, fontSize:13,
      display:'flex', alignItems:'center', gap:8,
      transition:'all .15s'
    }}>
      <span style={{ fontSize:18 }}>{icons[role]}</span>
      <div style={{ textAlign:'right' }}>
        <div>{label}</div>
        {active && <div style={{ fontSize:10, opacity:.8, marginTop:1 }}>إشعاراتي الحالية</div>}
      </div>
    </button>
  )
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
  const [saved, setSaved] = useState(false)
  const [testing, setTesting] = useState(false)
  const [tab, setTab] = useState<'settings'|'log'>('settings')
  const [phone, setPhone] = useState('')
  const [userId, setUserId] = useState('')
  const [logFilter, setLogFilter] = useState('all')

  // User roles (can have multiple)
  const [userRoles, setUserRoles] = useState<string[]>([])
  const [activeRole, setActiveRole] = useState<string>('organizer')
  const [roleInfo, setRoleInfo] = useState<Record<string,any>>({})

  useEffect(() => {
    sb.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push('/login'); return }
      setUserId(data.user.id)

      // Detect all roles in parallel
      const [orgRes, infRes, staffRes, prefsRes, logsRes] = await Promise.all([
        sb.from('organizations').select('id,name').eq('owner_id', data.user.id).limit(1),
        sb.from('influencer_profiles').select('id,display_name_ar,status').eq('user_id', data.user.id).limit(1),
        sb.from('worker_profiles').select('id,full_name').eq('user_id', data.user.id).limit(1),
        sb.from('notification_preferences').select('*').eq('user_id', data.user.id).single(),
        sb.from('notification_log').select('*').eq('user_id', data.user.id).order('created_at', { ascending:false }).limit(60),
      ])

      const roles: string[] = []
      const info: Record<string,any> = {}

      if (orgRes.data?.length) {
        roles.push('organizer')
        info.organizer = { name: orgRes.data[0].name }
      }
      if (infRes.data?.length) {
        roles.push('influencer')
        info.influencer = { name: infRes.data[0].display_name_ar, status: infRes.data[0].status }
      }
      if (staffRes.data?.length) {
        roles.push('staff')
        info.staff = { name: staffRes.data[0].full_name }
      }
      if (roles.length === 0) roles.push('attendee')

      setUserRoles(roles)
      setRoleInfo(info)
      setActiveRole(roles[0])

      // Prefs
      let p = prefsRes.data
      if (!p) {
        const { data: np } = await sb.from('notification_preferences').insert({ user_id: data.user.id }).select().single()
        p = np
      }
      setPrefs(p)
      setPhone(p?.phone || '')
      setLogs(logsRes.data || [])
      setLoading(false)
    })
  }, [])

  function toggle(key: string) { setPrefs((p: any) => ({ ...p, [key]: !p[key] })) }

  async function save() {
    setSaving(true)
    await sb.from('notification_preferences').update({ ...prefs, phone, updated_at: new Date().toISOString() }).eq('user_id', userId)
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  async function sendTest() {
    if (!phone) { alert('أدخل رقم واتساب أولاً'); return }
    setTesting(true)
    const res = await fetch('/api/whatsapp/send', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ type:'test', userId, phone, data:{} })
    })
    const d = await res.json()
    if (d.ok) {
      const { data: l } = await sb.from('notification_log').select('*').eq('user_id', userId).order('created_at', { ascending:false }).limit(60)
      setLogs(l || [])
      alert(d.mock ? '✅ تجربة ناجحة — سُجّل في السجل (وضع محاكاة)' : '✅ رسالة اختبار أُرسلت على واتساب!')
    } else alert('❌ ' + d.error)
    setTesting(false)
  }

  const currentGroups = prefs ? [...(ROLE_GROUPS[activeRole] || ROLE_GROUPS.attendee), SYSTEM_GROUP] : []

  const enabledCount = prefs ? Object.entries(prefs).filter(([k,v]) =>
    typeof v === 'boolean' && v === true &&
    currentGroups.some(g => g.items.some(i => i.key === k))
  ).length : 0

  const totalForRole = currentGroups.reduce((s, g) => s + g.items.length, 0)
  const filteredLogs = logFilter === 'all' ? logs : logs.filter(l => l.category === logFilter || l.status === logFilter)

  const ROLE_LABELS: Record<string,string> = { organizer:'منظم فعاليات', influencer:'مؤثر', staff:'كادر', attendee:'حضور' }

  if (loading) return <div style={{ padding:60, textAlign:'center', color:C.muted, direction:'rtl', fontFamily:"'Tajawal',sans-serif" }}>⏳ جاري التحميل...</div>

  return (
    <div style={{ padding:'28px 24px', direction:'rtl', minHeight:'100vh', background:C.bg, fontFamily:"'Tajawal',sans-serif" }}>
      <div style={{ maxWidth:900, margin:'0 auto' }}>

        {/* ── Header ── */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24 }}>
          <div>
            <h1 style={{ fontSize:24, fontWeight:800, color:C.navy, margin:'0 0 4px' }}>📲 إشعارات واتساب</h1>
            <p style={{ color:C.muted, fontSize:13, margin:0 }}>خصّص الإشعارات التي تصلك حسب دورك في المنصة</p>
          </div>
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            <span style={{ fontSize:12, fontWeight:700, padding:'4px 12px', background:C.green+'22', color:C.green, borderRadius:20 }}>
              🟢 {enabledCount}/{totalForRole} مفعّل
            </span>
          </div>
        </div>

        {/* ── Phone input row ── */}
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:20, marginBottom:20 }}>
          <h3 style={{ fontSize:14, fontWeight:800, color:C.navy, margin:'0 0 12px' }}>📱 رقم واتساب</h3>
          <div style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'flex-end' }}>
            <div style={{ flex:1, minWidth:200 }}>
              <input
                value={phone} onChange={e => setPhone(e.target.value)}
                placeholder="+966501234567"
                style={{ width:'100%', padding:'11px 14px', border:`1.5px solid ${C.border}`, borderRadius:8, fontSize:14, fontFamily:'inherit', direction:'ltr', textAlign:'left', outline:'none', boxSizing:'border-box' }}
              />
            </div>
            <button onClick={sendTest} disabled={testing || !phone} style={{ padding:'11px 18px', background: testing||!phone ? C.border : '#25D366', border:'none', borderRadius:8, color:'#fff', fontWeight:700, fontSize:13, cursor: testing||!phone?'not-allowed':'pointer', fontFamily:'inherit', whiteSpace:'nowrap', display:'flex', alignItems:'center', gap:6 }}>
              {testing ? '⏳...' : '📤 إرسال اختبار'}
            </button>
            <button onClick={save} disabled={saving} style={{ padding:'11px 22px', background: saved ? C.green : C.orange, border:'none', borderRadius:8, color:'#fff', fontWeight:800, fontSize:13, cursor:saving?'wait':'pointer', fontFamily:'inherit', whiteSpace:'nowrap' }}>
              {saving ? '⏳...' : saved ? '✅ حُفظ!' : '💾 حفظ'}
            </button>
          </div>
          <p style={{ fontSize:11, color:C.muted, margin:'8px 0 0' }}>
            💡 وضع المحاكاة — لتفعيل واتساب الحقيقي أضف <code>WHATSAPP_TOKEN</code> في Vercel
          </p>
        </div>

        {/* ── Role selector ── */}
        {userRoles.length > 1 && (
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:20, marginBottom:20 }}>
            <p style={{ fontSize:13, fontWeight:700, color:C.navy, margin:'0 0 12px' }}>👤 أنت في المنصة بأكثر من دور — اختر لتخصيص إشعاراته</p>
            <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
              {userRoles.map(role => (
                <RoleBadge key={role} role={role} label={ROLE_LABELS[role]} active={activeRole===role} onClick={() => setActiveRole(role)} />
              ))}
            </div>
          </div>
        )}

        {/* ── Tabs ── */}
        <div style={{ display:'flex', gap:0, borderBottom:`1px solid ${C.border}`, marginBottom:20 }}>
          {[['settings','⚙️ إعدادات الإشعارات'],['log','📋 سجل الإرسال']].map(([v,l]) => (
            <button key={v} onClick={() => setTab(v as any)} style={{ padding:'9px 20px', background:'none', border:'none', cursor:'pointer', fontFamily:'inherit', fontSize:13, fontWeight:tab===v?700:400, color:tab===v?C.orange:C.muted, borderBottom:tab===v?`2px solid ${C.orange}`:'2px solid transparent', marginBottom:-1 }}>{l}</button>
          ))}
        </div>

        {/* ── SETTINGS TAB ── */}
        {tab === 'settings' && prefs && (
          <div>
            {/* Role context card */}
            <div style={{ background: ROLE_GROUPS[activeRole]?.[0]?.bg || '#F8F7FA', border:`1px solid ${C.border}`, borderRadius:12, padding:'14px 18px', marginBottom:16, display:'flex', alignItems:'center', gap:12 }}>
              <span style={{ fontSize:28 }}>
                {{ organizer:'🎪', influencer:'🌟', staff:'👷', attendee:'🎫' }[activeRole]}
              </span>
              <div>
                <p style={{ fontSize:14, fontWeight:800, color:C.navy, margin:'0 0 2px' }}>
                  إشعارات {ROLE_LABELS[activeRole]}
                  {roleInfo[activeRole]?.name && ` — ${roleInfo[activeRole].name}`}
                </p>
                <p style={{ fontSize:12, color:C.muted, margin:0 }}>
                  {{ organizer: 'إشعارات تساعدك في إدارة فعالياتك وكواردك وحملات المؤثرين', influencer: 'تابع حالة عروضك ومدفوعاتك بشكل فوري', staff: 'لا تفوت أي فرصة عمل أو تذكير وردية', attendee: 'كن أول من يعرف بالفعاليات الجديدة' }[activeRole] || ''}
                </p>
              </div>
              {activeRole==='influencer' && roleInfo.influencer?.status === 'pending' && (
                <span style={{ marginRight:'auto', fontSize:11, background:'#FFF8E8', color:'#B07000', padding:'4px 10px', borderRadius:20, fontWeight:700 }}>⏳ قيد المراجعة</span>
              )}
            </div>

            {/* Notification groups */}
            <div style={{ display:'grid', gap:12 }}>
              {currentGroups.map(group => (
                <div key={group.label} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, overflow:'hidden' }}>
                  {/* Group header */}
                  <div style={{ padding:'13px 18px', background:group.bg, borderBottom:`1px solid ${C.border}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <h3 style={{ fontSize:14, fontWeight:800, color:group.accent || C.navy, margin:0 }}>
                      {group.icon} {group.label}
                    </h3>
                    <span style={{ fontSize:11, color:group.accent || C.muted, fontWeight:600 }}>
                      {group.items.filter(i => prefs[i.key]).length}/{group.items.length} مفعّل
                    </span>
                  </div>
                  {/* Items */}
                  <div>
                    {group.items.map((item, idx) => {
                      const on = prefs[item.key] ?? true
                      return (
                        <div key={item.key} onClick={() => toggle(item.key)} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 18px', borderBottom: idx < group.items.length-1 ? `1px solid ${C.border}` : 'none', cursor:'pointer', transition:'background .12s' }}
                          onMouseEnter={e => (e.currentTarget.style.background = '#FAFAFA')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                          <div style={{ display:'flex', alignItems:'center', gap:12, flex:1 }}>
                            <span style={{ fontSize:20, flexShrink:0 }}>{item.emoji}</span>
                            <div>
                              <div style={{ fontSize:14, fontWeight:600, color: on ? C.text : C.muted }}>{item.label}</div>
                              <div style={{ fontSize:12, color:C.muted, marginTop:1 }}>{item.desc}</div>
                            </div>
                          </div>
                          <Toggle on={on} onChange={() => toggle(item.key)} />
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Quick actions */}
            <div style={{ display:'flex', gap:10, marginTop:16, flexWrap:'wrap' }}>
              <button onClick={() => {
                const allKeys = currentGroups.flatMap(g => g.items.map(i => i.key))
                setPrefs((p: any) => { const n={...p}; allKeys.forEach(k=>n[k]=true); return n })
              }} style={{ padding:'9px 18px', background:'#EAF7E0', border:`1px solid ${C.green}`, borderRadius:8, color:C.green, fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
                ✅ تفعيل الكل
              </button>
              <button onClick={() => {
                const allKeys = currentGroups.flatMap(g => g.items.map(i => i.key))
                setPrefs((p: any) => { const n={...p}; allKeys.forEach(k=>n[k]=false); return n })
              }} style={{ padding:'9px 18px', background:'#FEF2F2', border:`1px solid ${C.red}22`, borderRadius:8, color:C.red, fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
                🔕 إيقاف الكل
              </button>
              <button onClick={save} disabled={saving} style={{ padding:'9px 22px', background: saved ? C.green : C.orange, border:'none', borderRadius:8, color:'#fff', fontWeight:800, fontSize:13, cursor:saving?'wait':'pointer', fontFamily:'inherit', marginRight:'auto' }}>
                {saving ? '⏳...' : saved ? '✅ حُفظ!' : '💾 حفظ الإعدادات'}
              </button>
            </div>
          </div>
        )}

        {/* ── LOG TAB ── */}
        {tab === 'log' && (
          <div>
            {/* Stats */}
            <div style={{ display:'flex', gap:10, marginBottom:14, flexWrap:'wrap' }}>
              {[
                { l:'إجمالي', v:logs.length, c:C.navy },
                { l:'✅ أُرسل', v:logs.filter(x=>x.status==='sent').length, c:C.green },
                { l:'🔵 محاكاة', v:logs.filter(x=>x.status==='mock').length, c:'#6B3FA0' },
                { l:'❌ فشل', v:logs.filter(x=>x.status==='failed').length, c:C.red },
              ].map(s => (
                <div key={s.l} style={{ padding:'10px 18px', background:C.card, border:`1px solid ${C.border}`, borderRadius:10, textAlign:'center', minWidth:80 }}>
                  <div style={{ fontSize:20, fontWeight:900, color:s.c }}>{s.v}</div>
                  <div style={{ fontSize:11, color:C.muted }}>{s.l}</div>
                </div>
              ))}
            </div>

            {/* Filter chips */}
            <div style={{ display:'flex', gap:8, marginBottom:14, flexWrap:'wrap' }}>
              {[['all','الكل'],['events','الفعاليات'],['staffing','الكوادر'],['influencer','المؤثرون'],['sent','أُرسل'],['mock','محاكاة'],['failed','فشل']].map(([v,l]) => (
                <button key={v} onClick={() => setLogFilter(v)} style={{ padding:'6px 14px', borderRadius:20, cursor:'pointer', fontFamily:'inherit', fontSize:12, fontWeight:600, border: logFilter===v ? `1.5px solid ${C.orange}` : `1px solid ${C.border}`, background: logFilter===v ? '#FEF0ED' : C.card, color: logFilter===v ? C.orange : C.text }}>{l}</button>
              ))}
            </div>

            {filteredLogs.length === 0 ? (
              <div style={{ textAlign:'center', padding:60, background:C.card, borderRadius:14, border:`2px dashed ${C.border}` }}>
                <div style={{ fontSize:40, marginBottom:8 }}>📭</div>
                <p style={{ color:C.muted, fontSize:14, marginBottom:16 }}>لا توجد إشعارات بعد</p>
                <button onClick={sendTest} style={{ padding:'10px 22px', background:'#25D366', border:'none', borderRadius:8, color:'#fff', fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                  📤 أرسل رسالة اختبار
                </button>
              </div>
            ) : (
              <div style={{ display:'grid', gap:8 }}>
                {filteredLogs.map(log => {
                  const st = STATUS_CFG[log.status] || STATUS_CFG.mock
                  const catIcon: Record<string,string> = { events:'📅', staffing:'👷', influencer:'🌟', system:'🔔' }
                  return (
                    <div key={log.id} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:'12px 16px', display:'flex', gap:12, alignItems:'flex-start' }}>
                      <span style={{ fontSize:20, flexShrink:0 }}>{catIcon[log.category] || '🔔'}</span>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
                          <span style={{ fontSize:13, fontWeight:700, color:C.navy }}>{log.title}</span>
                          <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:20, background:st.bg, color:st.color, flexShrink:0 }}>{st.icon} {st.label}</span>
                        </div>
                        <p style={{ fontSize:12, color:C.muted, margin:'0 0 6px', lineHeight:1.4, overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis' }}>
                          {log.message.split('\n')[0].replace(/\*/g,'')}
                        </p>
                        <div style={{ display:'flex', gap:14, fontSize:11, color:C.muted }}>
                          <span>📱 {log.phone}</span>
                          <span>🕐 {new Date(log.created_at).toLocaleString('ar-SA', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' })}</span>
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
