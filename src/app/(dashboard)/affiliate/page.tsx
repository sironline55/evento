'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState, useMemo } from 'react'
import { createBrowserClient } from '@supabase/ssr'

const C = { navy:'#1E0A3C', orange:'#F05537', muted:'#6F7287', border:'#DBDAE3', card:'#FFFFFF' }
const BASE_URL = 'https://evento-h2ir.vercel.app'

export default function AffiliatePage() {
  const sb = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), [])

  const [links,   setLinks]   = useState<any[]>([])
  const [events,  setEvents]  = useState<any[]>([])
  const [orgId,   setOrgId]   = useState<string|null>(null)
  const [loading, setLoading] = useState(true)
  const [copied,  setCopied]  = useState<string|null>(null)
  const [form,    setForm]    = useState({ code:'', label:'', event_id:'' })
  const [saving,  setSaving]  = useState(false)
  const [toast,   setToast]   = useState('')

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3000) }

  useEffect(() => {
    async function load() {
      const { data:{ user } } = await sb.auth.getUser()
      if (!user) return
      const { data: org } = await sb.from('organizations').select('id').eq('owner_id', user.id).single()
      if (!org) return
      setOrgId(org.id)
      const [{ data: ls }, { data: evs }] = await Promise.all([
        sb.from('affiliate_links').select('*').eq('org_id', org.id).order('created_at', { ascending:false }),
        sb.from('events').select('id,title').eq('org_id', org.id).eq('status','published')
      ])
      setLinks(ls || [])
      setEvents(evs || [])
      setLoading(false)
    }
    load()
  }, [])

  async function createLink() {
    if (!orgId || !form.code.trim()) return
    setSaving(true)
    const code = form.code.toUpperCase().replace(/\s+/g, '-')
    const { data, error } = await sb.from('affiliate_links').insert({
      org_id: orgId,
      code,
      label: form.label || null,
      event_id: form.event_id || null
    }).select().single()
    if (!error && data) {
      setLinks(prev => [data, ...prev])
      setForm({ code:'', label:'', event_id:'' })
      showToast('تم إنشاء الرابط بنجاح ✅')
    } else {
      alert('خطأ: ' + (error?.message || 'الكود مكرر'))
    }
    setSaving(false)
  }

  async function deleteLink(id: string) {
    if (!confirm('حذف هذا الرابط؟')) return
    await sb.from('affiliate_links').delete().eq('id', id)
    setLinks(prev => prev.filter(l => l.id !== id))
    showToast('تم الحذف')
  }

  function buildUrl(link: any) {
    const ev = events.find(e => e.id === link.event_id)
    const base = link.event_id ? `${BASE_URL}/r/${link.event_id}` : `${BASE_URL}`
    return `${base}?ref=${link.code}`
  }

  function copyUrl(link: any) {
    const url = buildUrl(link)
    navigator.clipboard.writeText(url)
    setCopied(link.id); setTimeout(() => setCopied(null), 2500)
    showToast('تم نسخ الرابط 🔗')
  }

  const totalRegs   = links.reduce((s, l) => s + (l.reg_count || 0), 0)
  const totalClicks = links.reduce((s, l) => s + (l.click_count || 0), 0)

  if (loading) return <div style={{ padding:40, textAlign:'center', color:C.muted, fontFamily:'Tajawal,sans-serif' }}>جاري التحميل...</div>

  return (
    <div style={{ direction:'rtl', fontFamily:'Tajawal,sans-serif', padding:'24px 20px', maxWidth:900, margin:'0 auto' }}>

      {toast && (
        <div style={{ position:'fixed', top:20, left:'50%', transform:'translateX(-50%)', zIndex:9999,
          background:'#EAF7E0', border:'1px solid #9DE07B', borderRadius:12,
          padding:'12px 24px', fontWeight:700, fontSize:14, color:'#166534',
          boxShadow:'0 8px 24px rgba(0,0,0,.12)' }}>
          {toast}
        </div>
      )}

      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontSize:22, fontWeight:800, color:C.navy, margin:0 }}>روابط الإحالة (Affiliate)</h1>
        <p style={{ fontSize:13, color:C.muted, margin:'4px 0 0' }}>تتبع مصادر التسجيل وأداء الشركاء والمؤثرين</p>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:24 }}>
        {[
          { label:'إجمالي الروابط',    val: links.length },
          { label:'إجمالي النقرات',    val: totalClicks },
          { label:'تسجيلات عبر الروابط', val: totalRegs, color: C.orange },
        ].map(s => (
          <div key={s.label} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:'14px 18px' }}>
            <p style={{ fontSize:11, color:C.muted, margin:'0 0 4px', fontWeight:600 }}>{s.label}</p>
            <p style={{ fontSize:26, fontWeight:900, color: s.color || C.navy, margin:0 }}>{s.val}</p>
          </div>
        ))}
      </div>

      {/* Create form */}
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:20, marginBottom:20 }}>
        <h3 style={{ fontSize:14, fontWeight:700, color:C.navy, margin:'0 0 14px' }}>+ إنشاء رابط جديد</h3>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1.5fr', gap:10, marginBottom:12 }}>
          <div>
            <label style={{ fontSize:11, color:C.muted, fontWeight:600, display:'block', marginBottom:4 }}>كود الرابط *</label>
            <input placeholder="INFLUENCER1" value={form.code}
              onChange={e => setForm({...form, code:e.target.value.toUpperCase().replace(/\s/g,'-')})}
              style={{ width:'100%', padding:'9px 12px', border:`1px solid ${C.border}`, borderRadius:8, fontSize:13, fontFamily:'inherit', boxSizing:'border-box' }}/>
          </div>
          <div>
            <label style={{ fontSize:11, color:C.muted, fontWeight:600, display:'block', marginBottom:4 }}>الاسم / الوصف</label>
            <input placeholder="سارة الغامدي - تيك توك" value={form.label}
              onChange={e => setForm({...form, label:e.target.value})}
              style={{ width:'100%', padding:'9px 12px', border:`1px solid ${C.border}`, borderRadius:8, fontSize:13, fontFamily:'inherit', boxSizing:'border-box' }}/>
          </div>
          <div>
            <label style={{ fontSize:11, color:C.muted, fontWeight:600, display:'block', marginBottom:4 }}>خاص بفعالية (اختياري)</label>
            <select value={form.event_id} onChange={e => setForm({...form, event_id:e.target.value})}
              style={{ width:'100%', padding:'9px 12px', border:`1px solid ${C.border}`, borderRadius:8, fontSize:13, fontFamily:'inherit', background:'#fff', cursor:'pointer', boxSizing:'border-box' }}>
              <option value="">كل الفعاليات</option>
              {events.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
            </select>
          </div>
        </div>
        <button onClick={createLink} disabled={saving || !form.code.trim()} style={{
          padding:'9px 24px', background: saving||!form.code.trim() ? C.muted : C.orange,
          color:'#fff', border:'none', borderRadius:9, fontWeight:700, fontSize:13,
          cursor: saving||!form.code.trim() ? 'not-allowed' : 'pointer', fontFamily:'inherit'
        }}>{saving ? 'جاري الحفظ...' : 'إنشاء الرابط'}</button>
      </div>

      {/* Links list */}
      {links.length === 0 ? (
        <div style={{ textAlign:'center', padding:'48px', background:C.card, border:`1px solid ${C.border}`, borderRadius:14 }}>
          <div style={{ fontSize:40, marginBottom:10 }}>🔗</div>
          <p style={{ fontSize:15, fontWeight:700, color:C.navy, margin:'0 0 4px' }}>لا روابط بعد</p>
          <p style={{ fontSize:13, color:C.muted }}>أنشئ رابطاً لمؤثر أو شريك لتتبع مصادر التسجيل</p>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {links.map(link => {
            const ev = events.find(e => e.id === link.event_id)
            const url = buildUrl(link)
            const convRate = link.click_count > 0 ? Math.round(link.reg_count/link.click_count*100) : 0
            return (
              <div key={link.id} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:'16px 20px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:10 }}>
                  <div style={{ flex:1 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
                      <span style={{ fontSize:14, fontWeight:900, color:C.navy, fontFamily:'monospace', background:'#F0EDFC', padding:'3px 10px', borderRadius:6 }}>
                        {link.code}
                      </span>
                      {link.label && <span style={{ fontSize:13, color:C.muted }}>{link.label}</span>}
                      {ev && <span style={{ fontSize:11, background:'#FEF0ED', color:C.orange, padding:'2px 8px', borderRadius:10, fontWeight:600 }}>🎪 {ev.title}</span>}
                    </div>
                    {/* URL */}
                    <div style={{ background:'#F8F7FA', border:`1px solid ${C.border}`, borderRadius:8, padding:'6px 12px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:10 }}>
                      <code style={{ fontSize:11, color:C.muted, flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', direction:'ltr' }}>
                        {url}
                      </code>
                      <button onClick={() => copyUrl(link)} style={{
                        padding:'4px 10px', background: copied===link.id?'#EAF7E0':'#fff',
                        border:`1px solid ${copied===link.id?'#9DE07B':C.border}`,
                        color: copied===link.id?'#166534':C.navy,
                        borderRadius:6, fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap'
                      }}>
                        {copied===link.id ? '✅ تم' : '📋 نسخ'}
                      </button>
                    </div>
                  </div>

                  {/* Stats */}
                  <div style={{ display:'flex', gap:16, alignItems:'center' }}>
                    <div style={{ textAlign:'center' }}>
                      <p style={{ fontSize:20, fontWeight:900, color:C.navy, margin:0 }}>{link.click_count || 0}</p>
                      <p style={{ fontSize:11, color:C.muted, margin:0 }}>نقرة</p>
                    </div>
                    <div style={{ textAlign:'center' }}>
                      <p style={{ fontSize:20, fontWeight:900, color:C.orange, margin:0 }}>{link.reg_count || 0}</p>
                      <p style={{ fontSize:11, color:C.muted, margin:0 }}>تسجيل</p>
                    </div>
                    {link.click_count > 0 && (
                      <div style={{ textAlign:'center' }}>
                        <p style={{ fontSize:20, fontWeight:900, color:'#166534', margin:0 }}>{convRate}%</p>
                        <p style={{ fontSize:11, color:C.muted, margin:0 }}>تحويل</p>
                      </div>
                    )}
                    <button onClick={() => deleteLink(link.id)} style={{
                      padding:'6px 10px', background:'#FEF2F2', color:'#DC2626',
                      border:'1px solid #FECACA', borderRadius:8, fontSize:12, cursor:'pointer', fontFamily:'inherit'
                    }}>🗑</button>
                  </div>
                </div>

                {/* Progress bar */}
                {link.click_count > 0 && (
                  <div style={{ marginTop:10, height:4, background:'#EDE9F7', borderRadius:4, overflow:'hidden' }}>
                    <div style={{ height:'100%', width:`${Math.min(100,convRate)}%`, background:C.orange, borderRadius:4 }}/>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* How it works */}
      <div style={{ background:'#F8F7FA', border:`1px solid ${C.border}`, borderRadius:12, padding:'16px 20px', marginTop:20 }}>
        <h3 style={{ fontSize:13, fontWeight:700, color:C.navy, margin:'0 0 8px' }}>كيف يعمل؟</h3>
        <p style={{ fontSize:12, color:C.muted, margin:0, lineHeight:1.8 }}>
          أعطِ كل مؤثر أو شريك رابطه الخاص مثل: <code style={{ background:'#fff', padding:'2px 6px', borderRadius:4, fontSize:11 }}>evento.app/r/EVENT_ID?ref=SARAH1</code>
          <br/>عند تسجيل أي شخص من الرابط، يُحسب تلقائياً في إحصائيات ذلك الشريك.
        </p>
      </div>
    </div>
  )
}
