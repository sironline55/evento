'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect, useMemo } from 'react'
import { createBrowserClient } from '@supabase/ssr'

const C = { navy:'#1E0A3C', orange:'#F05537', text:'#39364F', muted:'#6F7287', border:'#DBDAE3', bg:'#F4F3F8', card:'#FFFFFF', green:'#16a34a', red:'#DC2626' }

export default function AdminCouponsPage() {
  const sb = useMemo(() => createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!), [])
  const [coupons, setCoupons] = useState<any[]>([])
  const [uses, setUses]       = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [view, setView]       = useState<'coupons'|'uses'>('coupons')
  const [actioning, setActioning] = useState<string|null>(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const [{ data: cpData }, { data: usesData }] = await Promise.all([
        sb.from('coupons').select('*').order('created_at',{ascending:false}),
        sb.from('coupon_uses').select('*,coupons(code,discount_type,discount_value)').order('used_at',{ascending:false}).limit(100),
      ])
      setCoupons(cpData||[])
      setUses(usesData||[])
    } finally { setLoading(false) }
  }

  async function toggleActive(id: string, current: boolean) {
    setActioning(id)
    await sb.from('coupons').update({ is_active:!current }).eq('id',id)
    setCoupons(c=>c.map(cp=>cp.id===id?{...cp,is_active:!current}:cp))
    setActioning(null)
  }

  async function deleteCoupon(id: string, code: string) {
    if (!confirm(`حذف الكوبون "${code}" نهائياً؟`)) return
    setActioning(id)
    await sb.from('coupons').delete().eq('id',id)
    setCoupons(c=>c.filter(cp=>cp.id!==id))
    setActioning(null)
  }

  const filteredCoupons = coupons.filter(c =>
    !search || c.code.toLowerCase().includes(search.toLowerCase()) || (c.description||'').includes(search)
  )

  const totalDiscount = uses.reduce((s,u)=>s+(u.discount_amount||0),0)
  const topUsed = [...coupons].sort((a,b)=>b.used_count-a.used_count).slice(0,3)

  return (
    <div style={{ padding:'28px 32px', direction:'rtl' }}>
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontSize:22, fontWeight:800, color:C.navy, margin:'0 0 4px' }}>🏷️ إدارة الكوبونات</h1>
        <p style={{ color:C.muted, fontSize:13, margin:0 }}>مراقبة جميع الكوبونات والخصومات عبر المنصة</p>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:24 }}>
        {[
          { label:'إجمالي الكوبونات', val:coupons.length, color:C.navy },
          { label:'كوبونات نشطة',     val:coupons.filter(c=>c.is_active).length, color:C.green },
          { label:'إجمالي الاستخدام', val:uses.length, color:C.orange },
          { label:'إجمالي الخصومات',  val:`${totalDiscount.toFixed(0)} ر.س`, color:C.red },
        ].map(({ label, val, color }) => (
          <div key={label} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:'14px 16px' }}>
            <div style={{ fontSize:22, fontWeight:800, color }}>{val}</div>
            <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Top coupons */}
      {topUsed.length > 0 && (
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:'16px 20px', marginBottom:20 }}>
          <p style={{ fontSize:13, fontWeight:700, color:C.navy, margin:'0 0 12px' }}>🏆 أكثر الكوبونات استخداماً</p>
          <div style={{ display:'flex', gap:12 }}>
            {topUsed.map((cp,i)=>(
              <div key={cp.id} style={{ flex:1, background:i===0?'#FEF0ED':C.bg, borderRadius:10, padding:'12px 14px', border:`1px solid ${i===0?C.orange:C.border}` }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                  <code style={{ fontSize:14, fontWeight:800, color:i===0?C.orange:C.navy }}>{cp.code}</code>
                  <span style={{ fontSize:20, fontWeight:900, color:i===0?C.orange:C.muted }}>{cp.used_count}</span>
                </div>
                <p style={{ fontSize:11, color:C.muted, margin:0 }}>{cp.discount_type==='percentage'?`${cp.discount_value}%`:` ${cp.discount_value} ر.س`} خصم</p>
                <div style={{ height:4, background:'#E5E7EB', borderRadius:2, marginTop:8 }}>
                  <div style={{ width:cp.max_uses?`${Math.min(100,(cp.used_count/cp.max_uses)*100)}%`:'40%', height:'100%', background:i===0?C.orange:C.navy, borderRadius:2 }}/>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display:'flex', gap:4, marginBottom:16 }}>
        {[['coupons','الكوبونات'],['uses','سجل الاستخدام']] .map(([v,l])=>(
          <button key={v} onClick={()=>setView(v as any)} style={{
            padding:'7px 18px', border:`1px solid ${view===v?C.navy:C.border}`,
            borderRadius:7, cursor:'pointer', fontWeight:600, fontSize:12, fontFamily:'inherit',
            background:view===v?C.navy:C.card, color:view===v?'#fff':C.muted,
          }}>{l}</button>
        ))}
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 بحث..."
          style={{ padding:'7px 12px', border:`1px solid ${C.border}`, borderRadius:7, fontSize:12, outline:'none', background:C.card, fontFamily:'inherit', marginRight:'auto' }}/>
      </div>

      {loading ? (
        <div style={{ textAlign:'center', padding:60, color:C.muted }}>⏳</div>
      ) : view==='coupons' ? (
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, overflow:'hidden' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
            <thead>
              <tr style={{ background:'#F8F7FA', borderBottom:`1px solid ${C.border}` }}>
                {['الكود','الخصم','الاستخدام','الانتهاء','الحالة','الإجراءات'].map(h=>(
                  <th key={h} style={{ padding:'10px 14px', textAlign:'right', fontWeight:600, color:C.muted, fontSize:11 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredCoupons.map((cp,i)=>{
                const isExpired = cp.expires_at && new Date(cp.expires_at)<new Date()
                const isFull    = cp.max_uses!==null && cp.used_count>=cp.max_uses
                const badge = !cp.is_active?{label:'متوقف',bg:'#FEE2E2',color:C.red}
                            : isExpired?{label:'منتهي',bg:'#FEF3C7',color:'#92400E'}
                            : isFull?{label:'استُنفد',bg:'#F3E8FF',color:'#7C3AED'}
                            :{label:'نشط',bg:'#DCFCE7',color:C.green}
                return (
                  <tr key={cp.id} style={{ borderBottom:i<filteredCoupons.length-1?`1px solid ${C.border}`:'none', opacity:actioning===cp.id?0.5:1 }}>
                    <td style={{ padding:'12px 14px' }}>
                      <code style={{ background:'#F3F0F8', color:C.navy, padding:'2px 8px', borderRadius:5, fontWeight:700, letterSpacing:'0.05em' }}>{cp.code}</code>
                      {cp.description && <p style={{ fontSize:10, color:C.muted, margin:'3px 0 0' }}>{cp.description}</p>}
                    </td>
                    <td style={{ padding:'12px 14px', fontWeight:700, color:C.orange }}>
                      {cp.discount_type==='percentage'?`${cp.discount_value}%`:`${cp.discount_value} ر.س`}
                    </td>
                    <td style={{ padding:'12px 14px' }}>
                      <span style={{ fontWeight:700 }}>{cp.used_count}</span>
                      {cp.max_uses&&<span style={{ color:C.muted }}> / {cp.max_uses}</span>}
                    </td>
                    <td style={{ padding:'12px 14px', fontSize:12, color:isExpired?C.red:C.muted }}>
                      {cp.expires_at?new Date(cp.expires_at).toLocaleDateString('ar-SA'):'دائم'}
                    </td>
                    <td style={{ padding:'12px 14px' }}>
                      <span style={{ fontSize:11, fontWeight:600, padding:'3px 9px', borderRadius:50, background:badge.bg, color:badge.color }}>{badge.label}</span>
                    </td>
                    <td style={{ padding:'12px 14px' }}>
                      <div style={{ display:'flex', gap:6 }}>
                        <button onClick={()=>toggleActive(cp.id,cp.is_active)} disabled={actioning===cp.id} style={{ padding:'4px 10px', borderRadius:5, border:'none', cursor:'pointer', background:cp.is_active?'#FEF3C7':'#DCFCE7', color:cp.is_active?'#92400E':C.green, fontWeight:600, fontSize:11, fontFamily:'inherit' }}>
                          {cp.is_active?'⏸':'▶'}
                        </button>
                        <button onClick={()=>deleteCoupon(cp.id,cp.code)} disabled={actioning===cp.id} style={{ padding:'4px 8px', background:'#FEE2E2', color:C.red, border:'none', borderRadius:5, cursor:'pointer', fontSize:11 }}>🗑</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, overflow:'hidden' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
            <thead>
              <tr style={{ background:'#F8F7FA', borderBottom:`1px solid ${C.border}` }}>
                {['الكوبون','مبلغ الخصم','تاريخ الاستخدام'].map(h=>(
                  <th key={h} style={{ padding:'10px 14px', textAlign:'right', fontWeight:600, color:C.muted, fontSize:11 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {uses.length===0?(
                <tr><td colSpan={3} style={{ padding:'40px',textAlign:'center',color:C.muted }}>لا توجد استخدامات بعد</td></tr>
              ):uses.map((u,i)=>(
                <tr key={u.id} style={{ borderBottom:i<uses.length-1?`1px solid ${C.border}`:'none' }}>
                  <td style={{ padding:'12px 14px' }}>
                    <code style={{ background:'#F3F0F8', color:C.navy, padding:'2px 8px', borderRadius:5, fontWeight:700 }}>{u.coupons?.code||'—'}</code>
                  </td>
                  <td style={{ padding:'12px 14px', fontWeight:700, color:C.green }}>{u.discount_amount?.toFixed(2)||'0'} ر.س</td>
                  <td style={{ padding:'12px 14px', fontSize:12, color:C.muted }}>{new Date(u.used_at).toLocaleDateString('ar-SA',{year:'numeric',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
