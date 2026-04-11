'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect, useMemo } from 'react'
import { createBrowserClient } from '@supabase/ssr'

const C = {
  navy:'#1E0A3C', orange:'#F05537', text:'#39364F',
  muted:'#6F7287', border:'#DBDAE3', bg:'#FAFAFA',
  card:'#FFFFFF', green:'#3A7D0A', red:'#DC2626',
}

type Coupon = {
  id: string
  code: string
  event_id: string | null
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  max_uses: number | null
  used_count: number
  min_ticket_price: number | null
  expires_at: string | null
  is_active: boolean
  description: string | null
  created_at: string
  event_title?: string
}

type Event = { id: string; title: string }

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({length:8}, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export default function CouponsPage() {
  const sb = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), [])

  const [coupons, setCoupons]   = useState<Coupon[]>([])
  const [events, setEvents]     = useState<Event[]>([])
  const [loading, setLoading]   = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving]     = useState(false)
  const [filterActive, setFilterActive] = useState<'all'|'active'|'inactive'>('all')

  // Form state
  const [code, setCode]               = useState(generateCode())
  const [eventId, setEventId]         = useState('')
  const [discountType, setDiscType]   = useState<'percentage'|'fixed'>('percentage')
  const [discountValue, setDiscVal]   = useState('')
  const [maxUses, setMaxUses]         = useState('')
  const [minPrice, setMinPrice]       = useState('')
  const [expiresAt, setExpiresAt]     = useState('')
  const [description, setDescription] = useState('')

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [{ data: cData }, { data: eData }] = await Promise.all([
        sb.from('coupons').select('*').order('created_at', { ascending: false }),
        sb.from('events').select('id, title').order('start_date', { ascending: false }),
      ])
      const eventsMap: Record<string,string> = {}
      eData?.forEach(e => { eventsMap[e.id] = e.title })
      setCoupons((cData || []).map(c => ({ ...c, event_title: c.event_id ? eventsMap[c.event_id] : undefined })))
      setEvents(eData || [])
    } finally {
      setLoading(false)
    }
  }

  async function saveCoupon() {
    if (!code.trim() || !discountValue) return alert('الكود والقيمة مطلوبان')
    const val = parseFloat(discountValue)
    if (isNaN(val) || val <= 0) return alert('قيمة الخصم غير صحيحة')
    if (discountType === 'percentage' && val > 100) return alert('نسبة الخصم لا تتجاوز 100%')

    setSaving(true)
    try {
      const { data: { user } } = await sb.auth.getUser()
      const { error } = await sb.from('coupons').insert({
        code: code.toUpperCase().trim(),
        event_id: eventId || null,
        discount_type: discountType,
        discount_value: val,
        max_uses: maxUses ? parseInt(maxUses) : null,
        min_ticket_price: minPrice ? parseFloat(minPrice) : null,
        expires_at: expiresAt || null,
        description: description || null,
        created_by: user?.id,
      })
      if (error) {
        if (error.code === '23505') return alert('هذا الكود مستخدم مسبقاً — اختر كوداً آخر')
        throw error
      }
      resetForm()
      await loadData()
    } catch (e: any) {
      alert('خطأ: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(id: string, current: boolean) {
    await sb.from('coupons').update({ is_active: !current }).eq('id', id)
    setCoupons(c => c.map(cp => cp.id === id ? { ...cp, is_active: !current } : cp))
  }

  async function deleteCoupon(id: string) {
    if (!confirm('هل أنت متأكد من حذف هذا الكوبون؟')) return
    await sb.from('coupons').delete().eq('id', id)
    setCoupons(c => c.filter(cp => cp.id !== id))
  }

  function resetForm() {
    setCode(generateCode())
    setEventId(''); setDiscType('percentage'); setDiscVal('')
    setMaxUses(''); setMinPrice(''); setExpiresAt(''); setDescription('')
    setShowForm(false)
  }

  const filtered = coupons.filter(c =>
    filterActive === 'all' ? true :
    filterActive === 'active' ? c.is_active :
    !c.is_active
  )

  const inp: React.CSSProperties = {
    width:'100%', padding:'9px 12px', border:`1px solid ${C.border}`,
    borderRadius:8, fontSize:13, outline:'none', fontFamily:'inherit',
    color:C.text, background:C.card, boxSizing:'border-box',
  }
  const lbl: React.CSSProperties = { fontSize:12, fontWeight:600, color:C.text, display:'block', marginBottom:4 }

  return (
    <div style={{ padding:'24px 28px', direction:'rtl', minHeight:'100vh', background:C.bg }}>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:800, color:C.navy, margin:'0 0 4px' }}>🏷️ الكوبونات والخصومات</h1>
          <p style={{ fontSize:13, color:C.muted, margin:0 }}>أنشئ أكواد خصم لمتسجلي الفعاليات وتتبع استخدامها</p>
        </div>
        <button onClick={() => setShowForm(true)} style={{
          display:'flex', alignItems:'center', gap:6,
          padding:'9px 18px', background:C.orange, color:'#fff',
          border:'none', borderRadius:8, cursor:'pointer', fontWeight:700, fontSize:13,
          fontFamily:'inherit',
        }}>
          + كوبون جديد
        </button>
      </div>

      {/* Stats row */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:24 }}>
        {[
          { label:'إجمالي الكوبونات', val: coupons.length, color:C.navy },
          { label:'كوبونات نشطة',     val: coupons.filter(c=>c.is_active).length, color:C.green },
          { label:'إجمالي الاستخدام', val: coupons.reduce((s,c)=>s+c.used_count,0), color:C.orange },
          { label:'كوبونات منتهية',   val: coupons.filter(c=>!c.is_active||isExpired(c.expires_at)).length, color:C.red },
        ].map(({ label, val, color }) => (
          <div key={label} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:'14px 16px' }}>
            <div style={{ fontSize:22, fontWeight:800, color }}>{val}</div>
            <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div style={{ display:'flex', gap:4, marginBottom:16 }}>
        {([['all','الكل'],['active','نشط'],['inactive','متوقف']] as const).map(([v,l]) => (
          <button key={v} onClick={() => setFilterActive(v)} style={{
            padding:'6px 16px', border:'none', borderRadius:6, cursor:'pointer',
            fontWeight:600, fontSize:12, fontFamily:'inherit',
            background: filterActive===v ? C.navy : C.card,
            color: filterActive===v ? '#fff' : C.muted,
            border: `1px solid ${filterActive===v ? C.navy : C.border}`,
          }}>{l}</button>
        ))}
      </div>

      {/* Coupons table */}
      {loading ? (
        <div style={{ textAlign:'center', padding:60, color:C.muted }}>⏳ جاري التحميل...</div>
      ) : filtered.length === 0 ? (
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:'60px 20px', textAlign:'center' }}>
          <div style={{ fontSize:40, marginBottom:12 }}>🏷️</div>
          <p style={{ fontSize:15, fontWeight:600, color:C.navy }}>لا توجد كوبونات بعد</p>
          <p style={{ fontSize:12, color:C.muted }}>أنشئ كوبوناً لتقديم خصومات على تذاكر فعالياتك</p>
          <button onClick={() => setShowForm(true)} style={{ marginTop:16, padding:'9px 20px', background:C.orange, color:'#fff', border:'none', borderRadius:8, cursor:'pointer', fontWeight:700, fontFamily:'inherit' }}>
            + إنشاء أول كوبون
          </button>
        </div>
      ) : (
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, overflow:'hidden' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
            <thead>
              <tr style={{ background:'#F8F7FA', borderBottom:`1px solid ${C.border}` }}>
                {['الكود','نوع الخصم','الاستخدام','الفعالية','الانتهاء','الحالة','إجراءات'].map(h => (
                  <th key={h} style={{ padding:'10px 14px', textAlign:'right', fontWeight:600, color:C.muted, fontSize:11 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => {
                const expired = isExpired(c.expires_at)
                const full    = c.max_uses !== null && c.used_count >= c.max_uses
                const badge   = !c.is_active ? { label:'متوقف',  bg:'#FEE2E2', color:C.red  }
                              : expired      ? { label:'منتهي',   bg:'#FEF3C7', color:'#92400E' }
                              : full         ? { label:'استُنفد', bg:'#F3E8FF', color:'#7C3AED' }
                              :                { label:'نشط',     bg:'#DCFCE7', color:C.green }
                return (
                  <tr key={c.id} style={{ borderBottom: i<filtered.length-1 ? `1px solid ${C.border}` : 'none', transition:'background 0.1s' }}>
                    <td style={{ padding:'12px 14px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <code style={{ background:'#F3F0F8', color:C.navy, padding:'3px 8px', borderRadius:5, fontWeight:700, fontSize:13, letterSpacing:'0.05em' }}>{c.code}</code>
                        <button onClick={() => { navigator.clipboard.writeText(c.code) }} title="نسخ" style={{ background:'none', border:'none', cursor:'pointer', color:C.muted, fontSize:12 }}>📋</button>
                      </div>
                      {c.description && <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>{c.description}</div>}
                    </td>
                    <td style={{ padding:'12px 14px' }}>
                      <span style={{ fontWeight:700, color:c.discount_type==='percentage'?C.orange:C.green, fontSize:14 }}>
                        {c.discount_type === 'percentage' ? `${c.discount_value}%` : `${c.discount_value} ر.س`}
                      </span>
                      {c.min_ticket_price && <div style={{ fontSize:10, color:C.muted }}>الحد الأدنى: {c.min_ticket_price} ر.س</div>}
                    </td>
                    <td style={{ padding:'12px 14px' }}>
                      <div style={{ fontSize:13, fontWeight:600, color:C.text }}>
                        {c.used_count} {c.max_uses ? `/ ${c.max_uses}` : ''}
                      </div>
                      {c.max_uses && (
                        <div style={{ width:60, height:4, background:'#E5E7EB', borderRadius:2, marginTop:4 }}>
                          <div style={{ width:`${Math.min(100,(c.used_count/c.max_uses)*100)}%`, height:'100%', background:full?C.red:C.orange, borderRadius:2 }}/>
                        </div>
                      )}
                    </td>
                    <td style={{ padding:'12px 14px', fontSize:12, color:C.muted }}>
                      {c.event_title ? <span style={{ color:C.text }}>{c.event_title}</span> : <span style={{ fontStyle:'italic' }}>كل الفعاليات</span>}
                    </td>
                    <td style={{ padding:'12px 14px', fontSize:12, color: expired ? C.red : C.muted }}>
                      {c.expires_at ? new Date(c.expires_at).toLocaleDateString('ar-SA') : '—'}
                    </td>
                    <td style={{ padding:'12px 14px' }}>
                      <span style={{ fontSize:11, fontWeight:600, padding:'3px 8px', borderRadius:50, background:badge.bg, color:badge.color }}>{badge.label}</span>
                    </td>
                    <td style={{ padding:'12px 14px' }}>
                      <div style={{ display:'flex', gap:6 }}>
                        <button onClick={() => toggleActive(c.id, c.is_active)} style={{
                          padding:'4px 10px', borderRadius:5, border:'none', cursor:'pointer',
                          background: c.is_active ? '#FEF3C7' : '#DCFCE7',
                          color: c.is_active ? '#92400E' : C.green,
                          fontWeight:600, fontSize:11, fontFamily:'inherit',
                        }}>
                          {c.is_active ? '⏸ إيقاف' : '▶ تفعيل'}
                        </button>
                        <button onClick={() => deleteCoupon(c.id)} style={{
                          padding:'4px 8px', borderRadius:5, border:'none',
                          cursor:'pointer', background:'#FEE2E2', color:C.red,
                          fontWeight:600, fontSize:11,
                        }}>🗑</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create coupon modal */}
      {showForm && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:100, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }} onClick={e => e.target === e.currentTarget && resetForm()}>
          <div style={{ background:C.card, borderRadius:14, width:'100%', maxWidth:520, maxHeight:'90vh', overflowY:'auto', direction:'rtl' }}>
            <div style={{ padding:'18px 20px', borderBottom:`1px solid ${C.border}`, display:'flex', justifyContent:'space-between', alignItems:'center', position:'sticky', top:0, background:C.card, zIndex:1 }}>
              <h2 style={{ fontSize:16, fontWeight:800, color:C.navy, margin:0 }}>🏷️ كوبون جديد</h2>
              <button onClick={resetForm} style={{ background:'none', border:'none', cursor:'pointer', color:C.muted, fontSize:20 }}>×</button>
            </div>

            <div style={{ padding:'18px 20px' }}>
              {/* Code */}
              <div style={{ marginBottom:14 }}>
                <label style={lbl}>كود الخصم *</label>
                <div style={{ display:'flex', gap:8 }}>
                  <input value={code} onChange={e=>setCode(e.target.value.toUpperCase().replace(/\s/g,''))} maxLength={20} style={{ ...inp, fontFamily:'monospace', fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase' }} placeholder="EVENTO2025"/>
                  <button onClick={() => setCode(generateCode())} style={{ padding:'9px 12px', border:`1px solid ${C.border}`, borderRadius:8, background:C.bg, cursor:'pointer', fontSize:12, color:C.muted, whiteSpace:'nowrap', fontFamily:'inherit' }}>🎲 عشوائي</button>
                </div>
              </div>

              {/* Description */}
              <div style={{ marginBottom:14 }}>
                <label style={lbl}>وصف داخلي <span style={{ color:C.muted, fontWeight:400 }}>(اختياري — للتنظيم الداخلي فقط)</span></label>
                <input value={description} onChange={e=>setDescription(e.target.value)} placeholder="مثال: خصم للمتحدثين / Early Bird" style={inp}/>
              </div>

              {/* Discount type + value */}
              <div style={{ marginBottom:14 }}>
                <label style={lbl}>نوع الخصم *</label>
                <div style={{ display:'flex', gap:8, marginBottom:8 }}>
                  {[['percentage','% نسبة مئوية'],['fixed','ر.س مبلغ ثابت']].map(([v,l]) => (
                    <button key={v} onClick={() => setDiscType(v as any)} style={{
                      flex:1, padding:'9px', border:`2px solid ${discountType===v?C.orange:C.border}`,
                      borderRadius:8, cursor:'pointer', fontWeight:600, fontSize:12,
                      background: discountType===v?'#FEF0ED':C.card,
                      color: discountType===v?C.orange:C.text, fontFamily:'inherit',
                    }}>{l}</button>
                  ))}
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <input type="number" value={discountValue} onChange={e=>setDiscVal(e.target.value)} placeholder={discountType==='percentage'?'مثال: 20':'مثال: 50'} min="0" max={discountType==='percentage'?100:undefined} style={{ ...inp, maxWidth:160 }}/>
                  <span style={{ fontSize:14, fontWeight:700, color:C.muted }}>{discountType==='percentage'?'%':'ر.س'}</span>
                  {discountValue && <span style={{ fontSize:12, color:C.green, fontWeight:600 }}>
                    {discountType==='percentage'?`خصم ${discountValue}% على السعر`:`خصم ${discountValue} ر.س ثابت`}
                  </span>}
                </div>
              </div>

              {/* Event filter */}
              <div style={{ marginBottom:14 }}>
                <label style={lbl}>تطبيق على فعالية محددة <span style={{ color:C.muted, fontWeight:400 }}>(اتركه فارغاً لتطبيقه على كل الفعاليات)</span></label>
                <select value={eventId} onChange={e=>setEventId(e.target.value)} style={inp}>
                  <option value="">كل الفعاليات</option>
                  {events.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
                </select>
              </div>

              {/* Max uses + min price */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
                <div>
                  <label style={lbl}>الحد الأقصى للاستخدام</label>
                  <input type="number" value={maxUses} onChange={e=>setMaxUses(e.target.value)} placeholder="غير محدود" min="1" style={inp}/>
                </div>
                <div>
                  <label style={lbl}>الحد الأدنى لسعر التذكرة (ر.س)</label>
                  <input type="number" value={minPrice} onChange={e=>setMinPrice(e.target.value)} placeholder="بدون حد أدنى" min="0" style={inp}/>
                </div>
              </div>

              {/* Expiry */}
              <div style={{ marginBottom:20 }}>
                <label style={lbl}>تاريخ انتهاء الكوبون</label>
                <input type="datetime-local" value={expiresAt} onChange={e=>setExpiresAt(e.target.value)} style={inp}/>
                <p style={{ fontSize:11, color:C.muted, marginTop:4 }}>اتركه فارغاً للكوبون الدائم</p>
              </div>

              {/* Preview */}
              {code && discountValue && (
                <div style={{ background:'linear-gradient(135deg,#1E0A3C,#3D1E7A)', borderRadius:10, padding:'14px 16px', marginBottom:16, color:'#fff', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div>
                    <div style={{ fontSize:10, opacity:0.6, marginBottom:2 }}>معاينة الكوبون</div>
                    <code style={{ fontSize:18, fontWeight:800, letterSpacing:'0.1em', color:C.orange }}>{code}</code>
                  </div>
                  <div style={{ textAlign:'center' }}>
                    <div style={{ fontSize:22, fontWeight:800, color:C.orange }}>
                      {discountType==='percentage'?`${discountValue}%`:`${discountValue} ر.س`}
                    </div>
                    <div style={{ fontSize:10, opacity:0.6 }}>خصم</div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div style={{ display:'flex', gap:10 }}>
                <button onClick={resetForm} style={{ flex:1, padding:'10px', border:`1px solid ${C.border}`, borderRadius:8, background:C.card, cursor:'pointer', fontWeight:600, fontSize:13, color:C.text, fontFamily:'inherit' }}>إلغاء</button>
                <button onClick={saveCoupon} disabled={saving} style={{ flex:2, padding:'10px', border:'none', borderRadius:8, background:C.orange, color:'#fff', cursor:'pointer', fontWeight:700, fontSize:13, fontFamily:'inherit', opacity:saving?0.7:1 }}>
                  {saving ? '⏳ جاري الحفظ...' : '💾 حفظ الكوبون'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function isExpired(expiresAt: string | null): boolean {
  if (!expiresAt) return false
  return new Date(expiresAt) < new Date()
}
