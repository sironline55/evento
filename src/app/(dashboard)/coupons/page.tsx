'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState, useMemo } from 'react'
import { createBrowserClient } from '@supabase/ssr'

const C = { navy:'#1E0A3C', orange:'#F05537', muted:'#6F7287', border:'#DBDAE3', bg:'#FAFAFA', card:'#FFFFFF', green:'#166534' }

type Coupon = {
  id: string; code: string; discount_type: 'percentage'|'fixed'
  discount_value: number; max_uses: number|null; used_count: number
  expires_at: string|null; is_active: boolean; description: string|null
  event_id: string|null
}

type Event = { id: string; title: string }

const inp: React.CSSProperties = {
  width:'100%', padding:'10px 13px', border:`1px solid ${C.border}`,
  borderRadius:8, fontSize:14, boxSizing:'border-box', outline:'none',
  background:'#fff', fontFamily:'inherit'
}
const sel: React.CSSProperties = { ...inp, cursor:'pointer' }

export default function CouponsPage() {
  const sb = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), [])

  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [events, setEvents]   = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [orgId, setOrgId]     = useState<string|null>(null)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving]   = useState(false)
  const [copied, setCopied]   = useState<string|null>(null)
  const [form, setForm] = useState({
    code:'', discount_type:'percentage', discount_value:'',
    max_uses:'', expires_at:'', description:'', event_id:''
  })

  useEffect(() => {
    async function load() {
      const { data: { user } } = await sb.auth.getUser()
      if (!user) return
      const { data: org } = await sb.from('organizations').select('id').eq('owner_id', user.id).single()
      if (!org) return
      setOrgId(org.id)
      const [{ data: c }, { data: e }] = await Promise.all([
        sb.from('coupons').select('*').eq('org_id', org.id).order('created_at', { ascending:false }),
        sb.from('events').select('id,title').eq('org_id', org.id).eq('status','published')
      ])
      setCoupons(c || [])
      setEvents(e || [])
      setLoading(false)
    }
    load()
  }, [])

  async function saveCoupon() {
    if (!orgId || !form.code || !form.discount_value) return
    setSaving(true)
    const payload: any = {
      org_id: orgId,
      code: form.code.toUpperCase().trim(),
      discount_type: form.discount_type,
      discount_value: Number(form.discount_value),
      description: form.description || null,
      event_id: form.event_id || null,
      max_uses: form.max_uses ? Number(form.max_uses) : null,
      expires_at: form.expires_at || null,
      is_active: true
    }
    const { data, error } = await sb.from('coupons').insert(payload).select().single()
    if (!error && data) {
      setCoupons(prev => [data, ...prev])
      setForm({ code:'', discount_type:'percentage', discount_value:'', max_uses:'', expires_at:'', description:'', event_id:'' })
      setShowForm(false)
    } else {
      alert('خطأ: ' + (error?.message || 'كود مكرر'))
    }
    setSaving(false)
  }

  async function toggleActive(id: string, current: boolean) {
    await sb.from('coupons').update({ is_active: !current }).eq('id', id)
    setCoupons(prev => prev.map(c => c.id === id ? {...c, is_active:!current} : c))
  }

  async function deleteCoupon(id: string) {
    if (!confirm('حذف هذا الكوبون؟')) return
    await sb.from('coupons').delete().eq('id', id)
    setCoupons(prev => prev.filter(c => c.id !== id))
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code)
    setCopied(code)
    setTimeout(() => setCopied(null), 2000)
  }

  function discountLabel(c: Coupon) {
    return c.discount_type === 'percentage'
      ? `${c.discount_value}%`
      : `${c.discount_value} ريال`
  }

  function usageLabel(c: Coupon) {
    if (!c.max_uses) return `${c.used_count} استخدام (غير محدود)`
    return `${c.used_count} / ${c.max_uses}`
  }

  function usagePct(c: Coupon) {
    if (!c.max_uses) return 0
    return Math.round((c.used_count / c.max_uses) * 100)
  }

  function isExpired(c: Coupon) {
    return c.expires_at ? new Date(c.expires_at) < new Date() : false
  }

  const active   = coupons.filter(c => c.is_active && !isExpired(c))
  const inactive = coupons.filter(c => !c.is_active || isExpired(c))

  if (loading) return (
    <div style={{ padding:40, textAlign:'center', color:C.muted, fontFamily:'Tajawal,sans-serif' }}>جاري التحميل...</div>
  )

  return (
    <div style={{ direction:'rtl', fontFamily:'Tajawal,sans-serif', padding:'24px 20px', maxWidth:900, margin:'0 auto' }}>

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:800, color:C.navy, margin:0 }}>كوبونات الخصم</h1>
          <p style={{ fontSize:13, color:C.muted, margin:'4px 0 0' }}>{active.length} كوبون نشط</p>
        </div>
        <button onClick={() => setShowForm(true)} style={{
          padding:'10px 20px', background:C.orange, color:'#fff', border:'none',
          borderRadius:10, fontWeight:700, fontSize:14, cursor:'pointer', fontFamily:'inherit'
        }}>+ إنشاء كوبون</button>
      </div>

      {/* Create form */}
      {showForm && (
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:24, marginBottom:24, boxShadow:'0 4px 20px rgba(0,0,0,.06)' }}>
          <h3 style={{ fontSize:16, fontWeight:700, color:C.navy, margin:'0 0 18px' }}>إنشاء كوبون جديد</h3>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:C.muted, display:'block', marginBottom:5 }}>كود الخصم *</label>
              <input placeholder="WELCOME50" value={form.code}
                onChange={e => setForm({...form, code:e.target.value.toUpperCase()})}
                style={inp}/>
            </div>
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:C.muted, display:'block', marginBottom:5 }}>نوع الخصم *</label>
              <select value={form.discount_type} onChange={e => setForm({...form, discount_type:e.target.value})} style={sel}>
                <option value="percentage">نسبة مئوية (%)</option>
                <option value="fixed">مبلغ ثابت (ريال)</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:C.muted, display:'block', marginBottom:5 }}>
                قيمة الخصم * {form.discount_type==='percentage'?'(%)':'(ريال)'}
              </label>
              <input type="number" placeholder={form.discount_type==='percentage'?'25':'50'}
                value={form.discount_value} onChange={e => setForm({...form, discount_value:e.target.value})}
                min="1" max={form.discount_type==='percentage'?'100':undefined} style={inp}/>
            </div>
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:C.muted, display:'block', marginBottom:5 }}>عدد الاستخدامات (فارغ = غير محدود)</label>
              <input type="number" placeholder="100" value={form.max_uses}
                onChange={e => setForm({...form, max_uses:e.target.value})} min="1" style={inp}/>
            </div>
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:C.muted, display:'block', marginBottom:5 }}>تاريخ الانتهاء (اختياري)</label>
              <input type="datetime-local" value={form.expires_at}
                onChange={e => setForm({...form, expires_at:e.target.value})} style={inp}/>
            </div>
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:C.muted, display:'block', marginBottom:5 }}>خاص بفعالية (اختياري)</label>
              <select value={form.event_id} onChange={e => setForm({...form, event_id:e.target.value})} style={sel}>
                <option value="">كل الفعاليات</option>
                {events.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
              </select>
            </div>
            <div style={{ gridColumn:'1/-1' }}>
              <label style={{ fontSize:12, fontWeight:600, color:C.muted, display:'block', marginBottom:5 }}>وصف (اختياري)</label>
              <input placeholder="خصم خاص للمسجلين الجدد..." value={form.description}
                onChange={e => setForm({...form, description:e.target.value})} style={inp}/>
            </div>
          </div>
          <div style={{ display:'flex', gap:10, marginTop:18 }}>
            <button onClick={saveCoupon} disabled={saving} style={{
              padding:'10px 28px', background:C.orange, color:'#fff', border:'none',
              borderRadius:8, fontWeight:700, fontSize:14, cursor:'pointer', fontFamily:'inherit',
              opacity:saving?0.7:1
            }}>{saving ? 'جاري الحفظ...' : 'حفظ الكوبون'}</button>
            <button onClick={() => setShowForm(false)} style={{
              padding:'10px 20px', background:'#F8F7FA', color:C.muted,
              border:`1px solid ${C.border}`, borderRadius:8, fontWeight:600,
              fontSize:14, cursor:'pointer', fontFamily:'inherit'
            }}>إلغاء</button>
          </div>
        </div>
      )}

      {/* Stats row */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:20 }}>
        {[
          { label:'إجمالي الكوبونات', val: coupons.length },
          { label:'نشط الآن', val: active.length },
          { label:'إجمالي الاستخدامات', val: coupons.reduce((s,c)=>s+c.used_count,0) },
        ].map(s => (
          <div key={s.label} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:'14px 18px' }}>
            <p style={{ fontSize:11, color:C.muted, margin:'0 0 4px', fontWeight:600 }}>{s.label}</p>
            <p style={{ fontSize:24, fontWeight:800, color:C.navy, margin:0 }}>{s.val}</p>
          </div>
        ))}
      </div>

      {/* Active coupons */}
      {active.length > 0 && (
        <div style={{ marginBottom:20 }}>
          <h2 style={{ fontSize:14, fontWeight:700, color:C.navy, margin:'0 0 12px' }}>● الكوبونات النشطة</h2>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {active.map(c => <CouponRow key={c.id} c={c} events={events} copied={copied} onCopy={copyCode} onToggle={toggleActive} onDelete={deleteCoupon} discountLabel={discountLabel} usageLabel={usageLabel} usagePct={usagePct} isExpired={isExpired}/>)}
          </div>
        </div>
      )}

      {/* Inactive coupons */}
      {inactive.length > 0 && (
        <div>
          <h2 style={{ fontSize:14, fontWeight:700, color:C.muted, margin:'0 0 12px' }}>○ غير نشطة / منتهية</h2>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {inactive.map(c => <CouponRow key={c.id} c={c} events={events} copied={copied} onCopy={copyCode} onToggle={toggleActive} onDelete={deleteCoupon} discountLabel={discountLabel} usageLabel={usageLabel} usagePct={usagePct} isExpired={isExpired}/>)}
          </div>
        </div>
      )}

      {coupons.length === 0 && (
        <div style={{ textAlign:'center', padding:'60px 20px', background:C.card, border:`1px solid ${C.border}`, borderRadius:14 }}>
          <div style={{ fontSize:48, marginBottom:12 }}>🏷️</div>
          <p style={{ fontSize:16, fontWeight:700, color:C.navy, margin:'0 0 6px' }}>لا توجد كوبونات بعد</p>
          <p style={{ fontSize:13, color:C.muted, margin:'0 0 16px' }}>أنشئ كوبون خصم لجذب المزيد من المسجلين</p>
          <button onClick={() => setShowForm(true)} style={{
            padding:'10px 24px', background:C.orange, color:'#fff', border:'none',
            borderRadius:8, fontWeight:700, fontSize:14, cursor:'pointer', fontFamily:'inherit'
          }}>+ إنشاء أول كوبون</button>
        </div>
      )}
    </div>
  )
}

function CouponRow({ c, events, copied, onCopy, onToggle, onDelete, discountLabel, usageLabel, usagePct, isExpired }: any) {
  const C2 = { navy:'#1E0A3C', orange:'#F05537', muted:'#6F7287', border:'#DBDAE3' }
  const expired = isExpired(c)
  const pct = usagePct(c)
  const eventName = events.find((e: any) => e.id === c.event_id)?.title

  return (
    <div style={{
      background:'#fff', border:`1px solid ${C2.border}`, borderRadius:12,
      padding:'16px 20px', opacity: (!c.is_active || expired) ? 0.65 : 1
    }}>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:10 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          {/* Code badge */}
          <div style={{
            background: c.is_active && !expired ? '#F0F7FF' : '#F8F7FA',
            border:`1.5px dashed ${c.is_active && !expired ? '#93C5FD' : C2.border}`,
            borderRadius:8, padding:'6px 14px', cursor:'pointer'
          }} onClick={() => onCopy(c.code)}>
            <span style={{ fontSize:15, fontWeight:900, color:C2.navy, fontFamily:'monospace', letterSpacing:2 }}>{c.code}</span>
          </div>
          {/* Discount value */}
          <div style={{ background:'#FEF0ED', borderRadius:20, padding:'4px 12px' }}>
            <span style={{ fontSize:13, fontWeight:700, color:C2.orange }}>خصم {discountLabel(c)}</span>
          </div>
          {/* Copied toast */}
          {copied === c.code && (
            <span style={{ fontSize:12, color:'#166534', fontWeight:600 }}>✅ تم النسخ!</span>
          )}
        </div>

        {/* Actions */}
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={() => onCopy(c.code)} style={{
            padding:'6px 12px', background:'#F8F7FA', border:`1px solid ${C2.border}`,
            borderRadius:7, fontSize:12, color:C2.muted, cursor:'pointer', fontFamily:'inherit'
          }}>📋 نسخ</button>
          <button onClick={() => onToggle(c.id, c.is_active)} style={{
            padding:'6px 12px', background: c.is_active ? '#FEF2F2' : '#EAF7E0',
            border:`1px solid ${c.is_active ? '#FECACA' : '#9DE07B'}`,
            borderRadius:7, fontSize:12, color: c.is_active ? '#DC2626' : '#166534',
            cursor:'pointer', fontFamily:'inherit'
          }}>{c.is_active ? 'إيقاف' : 'تفعيل'}</button>
          <button onClick={() => onDelete(c.id)} style={{
            padding:'6px 10px', background:'#FEF2F2', border:'1px solid #FECACA',
            borderRadius:7, fontSize:12, color:'#DC2626', cursor:'pointer', fontFamily:'inherit'
          }}>🗑</button>
        </div>
      </div>

      {/* Meta row */}
      <div style={{ display:'flex', gap:16, marginTop:10, flexWrap:'wrap' }}>
        <span style={{ fontSize:12, color:C2.muted }}>📊 {usageLabel(c)}</span>
        {c.expires_at && (
          <span style={{ fontSize:12, color: expired ? '#DC2626' : C2.muted }}>
            ⏰ {expired ? 'منتهي — ' : 'ينتهي: '}
            {new Date(c.expires_at).toLocaleDateString('ar-SA', { year:'numeric', month:'short', day:'numeric' })}
          </span>
        )}
        {eventName && <span style={{ fontSize:12, color:C2.muted }}>🎪 {eventName}</span>}
        {c.description && <span style={{ fontSize:12, color:C2.muted }}>💬 {c.description}</span>}
      </div>

      {/* Usage bar */}
      {c.max_uses && (
        <div style={{ marginTop:10, height:4, background:'#EDE9F7', borderRadius:4, overflow:'hidden' }}>
          <div style={{ height:'100%', width:`${pct}%`, background: pct>80?'#DC2626':'#F05537', borderRadius:4 }}/>
        </div>
      )}
    </div>
  )
}
