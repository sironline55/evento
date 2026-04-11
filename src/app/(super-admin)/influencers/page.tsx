'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState, useMemo } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'

const C = { navy:'#1E0A3C', orange:'#F05537', text:'#39364F', muted:'#6F7287', border:'#DBDAE3', bg:'#FAFAFA', card:'#FFF', green:'#3A7D0A', red:'#DC2626', yellow:'#B07000' }

function fmt(n: number) {
  if (!n) return '0'
  if (n >= 1000000) return (n/1000000).toFixed(1)+'M'
  if (n >= 1000) return (n/1000).toFixed(0)+'K'
  return n.toString()
}

const STATUS_CFG: Record<string, {label:string; color:string; bg:string; dot:string}> = {
  pending:   { label:'قيد المراجعة', color:C.yellow,  bg:'#FFF8E8', dot:'#F5C842' },
  active:    { label:'نشط',          color:C.green,   bg:'#EAF7E0', dot:C.green   },
  suspended: { label:'موقوف',        color:C.red,     bg:'#FEF2F2', dot:C.red     },
}

export default function AdminInfluencersPage() {
  const sb = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), [])
  const router = useRouter()
  const [influencers, setInfluencers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('pending')
  const [search, setSearch] = useState('')
  const [acting, setActing] = useState<string|null>(null)
  const [selected, setSelected] = useState<any|null>(null)

  useEffect(() => {
    sb.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push('/login'); return }
      const { data: infs } = await sb.from('influencer_profiles')
        .select('*')
        .order('created_at', { ascending: false })
      setInfluencers(infs || [])
      setLoading(false)
    })
  }, [])

  async function updateStatus(id: string, status: string) {
    setActing(id)
    await sb.from('influencer_profiles').update({ status }).eq('id', id)
    setInfluencers(prev => prev.map(i => i.id===id ? {...i, status} : i))
    if (selected?.id === id) setSelected((s: any) => ({...s, status}))
    setActing(null)
  }

  async function toggleField(id: string, field: 'is_verified'|'is_featured', val: boolean) {
    setActing(id)
    await sb.from('influencer_profiles').update({ [field]: val }).eq('id', id)
    setInfluencers(prev => prev.map(i => i.id===id ? {...i, [field]:val} : i))
    if (selected?.id === id) setSelected((s: any) => ({...s, [field]:val}))
    setActing(null)
  }

  const counts = {
    pending:   influencers.filter(i=>i.status==='pending').length,
    active:    influencers.filter(i=>i.status==='active').length,
    suspended: influencers.filter(i=>i.status==='suspended').length,
    verified:  influencers.filter(i=>i.is_verified).length,
    featured:  influencers.filter(i=>i.is_featured).length,
  }

  const filtered = influencers.filter(i => {
    const matchTab = tab==='all' || i.status===tab
    const matchSearch = !search || (i.display_name_ar+i.display_name+(i.bio_ar||'')).toLowerCase().includes(search.toLowerCase())
    return matchTab && matchSearch
  })

  const totalReach = influencers.filter(i=>i.status==='active').reduce((s,i)=>
    s+(i.tiktok_followers||0)+(i.instagram_followers||0)+(i.snapchat_followers||0), 0)

  if (loading) return <div style={{ padding:60, textAlign:'center', color:C.muted, direction:'rtl' }}>⏳ جاري التحميل...</div>

  return (
    <div style={{ padding:'24px', direction:'rtl', minHeight:'100vh', background:C.bg, fontFamily:"'Tajawal',sans-serif" }}>

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:800, color:C.navy, margin:'0 0 4px' }}>🎤 إدارة المؤثرين</h1>
          <p style={{ color:C.muted, fontSize:13, margin:0 }}>مراجعة الطلبات الجديدة، التفعيل، التوثيق، والإيقاف</p>
        </div>
        <a href="/influencers" target="_blank" style={{ padding:'9px 16px', border:`1px solid ${C.border}`, borderRadius:8, color:C.text, fontSize:13, fontWeight:600, textDecoration:'none' }}>
          عرض الكتالوج العام ↗
        </a>
      </div>

      {/* Stats row */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:10, marginBottom:20 }}>
        {[
          { label:'انتظار المراجعة', value:counts.pending,   color:'#F5C842', bg:'#FFF8E8', icon:'⏳' },
          { label:'نشط',             value:counts.active,    color:C.green,   bg:'#EAF7E0', icon:'🟢' },
          { label:'موقوف',           value:counts.suspended, color:C.red,     bg:'#FEF2F2', icon:'🔴' },
          { label:'موثق',            value:counts.verified,  color:C.navy,    bg:'#E8E4F0', icon:'✅' },
          { label:'إجمالي الوصول',  value:fmt(totalReach),  color:C.orange,  bg:'#FEF0ED', icon:'📡' },
        ].map(s => (
          <div key={s.label} style={{ background:s.bg, border:`1px solid ${s.color}30`, borderRadius:10, padding:'12px 14px' }}>
            <div style={{ fontSize:20, marginBottom:3 }}>{s.icon}</div>
            <div style={{ fontSize:20, fontWeight:900, color:s.color }}>{s.value}</div>
            <div style={{ fontSize:11, color:C.muted }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 340px', gap:16, alignItems:'start' }}>
        {/* LEFT: List */}
        <div>
          {/* Search + Tabs */}
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, marginBottom:12, overflow:'hidden' }}>
            <div style={{ padding:'12px 16px', borderBottom:`1px solid ${C.border}` }}>
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="بحث بالاسم أو التخصص..."
                style={{ width:'100%', padding:'8px 12px', border:`1px solid ${C.border}`, borderRadius:8, fontSize:13, fontFamily:'inherit', outline:'none', boxSizing:'border-box' }}
              />
            </div>
            <div style={{ display:'flex', borderBottom:`1px solid ${C.border}` }}>
              {[['pending','⏳ انتظار',counts.pending],['active','🟢 نشط',counts.active],['suspended','🔴 موقوف',counts.suspended],['all','الكل',influencers.length]].map(([v,l,c]) => (
                <button key={v} onClick={() => setTab(v as string)} style={{
                  flex:1, padding:'9px 4px', background:'none', border:'none', cursor:'pointer',
                  fontFamily:'inherit', fontSize:12, fontWeight: tab===v ? 700 : 400,
                  color: tab===v ? C.orange : C.muted,
                  borderBottom: tab===v ? `2px solid ${C.orange}` : '2px solid transparent',
                  marginBottom:-1
                }}>{l} ({c})</button>
              ))}
            </div>
          </div>

          {/* List */}
          {filtered.length === 0 ? (
            <div style={{ textAlign:'center', padding:40, background:C.card, borderRadius:12, border:`1px solid ${C.border}` }}>
              <p style={{ color:C.muted }}>لا يوجد مؤثرون في هذه الفئة</p>
            </div>
          ) : (
            <div style={{ display:'grid', gap:8 }}>
              {filtered.map(inf => {
                const st = STATUS_CFG[inf.status] || STATUS_CFG.pending
                const totalF = (inf.tiktok_followers||0)+(inf.instagram_followers||0)+(inf.snapchat_followers||0)+(inf.youtube_followers||0)
                const isSelected = selected?.id === inf.id

                return (
                  <div key={inf.id}
                    onClick={() => setSelected(isSelected ? null : inf)}
                    style={{
                      background: isSelected ? '#F0EDFF' : C.card,
                      border: `1px solid ${isSelected ? C.navy : C.border}`,
                      borderRadius:10, padding:'14px 16px', cursor:'pointer', transition:'all .15s'
                    }}>
                    <div style={{ display:'flex', gap:12, alignItems:'center' }}>
                      {/* Avatar */}
                      {inf.avatar_url ? (
                        <img src={inf.avatar_url} alt="" style={{ width:44, height:44, borderRadius:'50%', objectFit:'cover', border:`2px solid ${C.border}`, flexShrink:0 }} onError={e=>(e.currentTarget.style.display='none')}/>
                      ) : (
                        <div style={{ width:44, height:44, borderRadius:'50%', background:`linear-gradient(135deg, ${C.orange}, #FF8C42)`, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:800, fontSize:18, flexShrink:0 }}>
                          {(inf.display_name_ar||inf.display_name||'?')[0]}
                        </div>
                      )}

                      {/* Info */}
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3, flexWrap:'wrap' }}>
                          <span style={{ fontWeight:800, color:C.navy, fontSize:14 }}>{inf.display_name_ar||inf.display_name}</span>
                          {inf.is_verified && <span style={{ fontSize:10, background:'#EAF7E0', color:C.green, padding:'1px 7px', borderRadius:20, fontWeight:700 }}>✓ موثق</span>}
                          {inf.is_featured && <span style={{ fontSize:10, background:'#FEF0ED', color:C.orange, padding:'1px 7px', borderRadius:20, fontWeight:700 }}>⭐ مميز</span>}
                        </div>
                        <div style={{ display:'flex', gap:10, fontSize:11, color:C.muted, flexWrap:'wrap' }}>
                          {(inf.specializations||[]).slice(0,2).map((s:string)=>(
                            <span key={s} style={{ background:'#F0EDFF', color:'#5B3FA0', padding:'1px 7px', borderRadius:10 }}>{s}</span>
                          ))}
                          {totalF > 0 && <span>👥 {fmt(totalF)}</span>}
                          {inf.price_basic && <span>💰 {inf.price_basic.toLocaleString()} ريال</span>}
                        </div>
                      </div>

                      {/* Status + date */}
                      <div style={{ textAlign:'left', flexShrink:0 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:4, justifyContent:'flex-end' }}>
                          <div style={{ width:7, height:7, borderRadius:'50%', background:st.dot }}/>
                          <span style={{ fontSize:11, color:st.color, fontWeight:700 }}>{st.label}</span>
                        </div>
                        <span style={{ fontSize:10, color:C.muted }}>{new Date(inf.created_at).toLocaleDateString('ar-SA')}</span>
                      </div>
                    </div>

                    {/* Quick action buttons when selected */}
                    {isSelected && (
                      <div style={{ display:'flex', gap:7, marginTop:12, paddingTop:12, borderTop:`1px solid ${C.border}`, flexWrap:'wrap' }}
                        onClick={e => e.stopPropagation()}>
                        {inf.status === 'pending' && (
                          <button onClick={() => updateStatus(inf.id,'active')} disabled={acting===inf.id} style={{ padding:'7px 14px', background:C.green, border:'none', borderRadius:7, color:'#fff', fontWeight:700, fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>
                            ✓ قبول وتفعيل
                          </button>
                        )}
                        {inf.status === 'active' && (
                          <button onClick={() => updateStatus(inf.id,'suspended')} disabled={acting===inf.id} style={{ padding:'7px 14px', background:'#FEF2F2', border:'none', borderRadius:7, color:C.red, fontWeight:700, fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>
                            🚫 إيقاف
                          </button>
                        )}
                        {inf.status === 'suspended' && (
                          <button onClick={() => updateStatus(inf.id,'active')} disabled={acting===inf.id} style={{ padding:'7px 14px', background:'#EAF7E0', border:'none', borderRadius:7, color:C.green, fontWeight:700, fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>
                            ✓ إعادة تفعيل
                          </button>
                        )}
                        {inf.status === 'pending' && (
                          <button onClick={() => updateStatus(inf.id,'suspended')} disabled={acting===inf.id} style={{ padding:'7px 14px', background:'#FEF2F2', border:'none', borderRadius:7, color:C.red, fontWeight:700, fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>
                            ✗ رفض
                          </button>
                        )}
                        <button onClick={() => toggleField(inf.id,'is_verified',!inf.is_verified)} disabled={acting===inf.id} style={{ padding:'7px 14px', background: inf.is_verified?'#FEF2F2':'#EAF7E0', border:'none', borderRadius:7, color: inf.is_verified?C.red:C.green, fontWeight:700, fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>
                          {inf.is_verified ? '✗ إلغاء التوثيق' : '✓ توثيق'}
                        </button>
                        <button onClick={() => toggleField(inf.id,'is_featured',!inf.is_featured)} disabled={acting===inf.id} style={{ padding:'7px 14px', background: inf.is_featured?'#F1F1F1':'#FEF0ED', border:'none', borderRadius:7, color: inf.is_featured?C.muted:C.orange, fontWeight:700, fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>
                          {inf.is_featured ? '✗ إلغاء التمييز' : '⭐ تمييز'}
                        </button>
                        <a href={`/influencers/${inf.id}`} target="_blank" style={{ padding:'7px 12px', border:`1px solid ${C.border}`, borderRadius:7, color:C.text, fontSize:12, fontWeight:600, textDecoration:'none' }}>
                          عرض البروفايل ↗
                        </a>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* RIGHT: Detail panel */}
        <div style={{ position:'sticky', top:20 }}>
          {selected ? (
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, overflow:'hidden' }}>
              {/* Header */}
              <div style={{ background:`linear-gradient(135deg, ${C.navy}, #3D1A78)`, padding:'20px 18px', position:'relative' }}>
                <button onClick={() => setSelected(null)} style={{ position:'absolute', top:12, left:12, background:'rgba(255,255,255,.15)', border:'none', color:'#fff', width:28, height:28, borderRadius:'50%', cursor:'pointer', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
                <div style={{ display:'flex', gap:14, alignItems:'center' }}>
                  {selected.avatar_url ? (
                    <img src={selected.avatar_url} alt="" style={{ width:60, height:60, borderRadius:'50%', objectFit:'cover', border:'3px solid rgba(255,255,255,.3)', flexShrink:0 }}/>
                  ) : (
                    <div style={{ width:60, height:60, borderRadius:'50%', background:`linear-gradient(135deg, ${C.orange}, #FF8C42)`, border:'3px solid rgba(255,255,255,.3)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:900, fontSize:24, flexShrink:0 }}>
                      {(selected.display_name_ar||selected.display_name||'?')[0]}
                    </div>
                  )}
                  <div>
                    <h3 style={{ color:'#fff', fontWeight:800, fontSize:16, margin:'0 0 4px' }}>{selected.display_name_ar||selected.display_name}</h3>
                    <p style={{ color:'rgba(255,255,255,.65)', fontSize:12, margin:0 }}>{selected.display_name}</p>
                    <div style={{ marginTop:6 }}>
                      <span style={{ fontSize:11, padding:'2px 10px', borderRadius:20, fontWeight:700, background: STATUS_CFG[selected.status]?.bg||'#fff', color: STATUS_CFG[selected.status]?.color||C.navy }}>
                        {STATUS_CFG[selected.status]?.label||selected.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ padding:'16px 18px' }}>
                {/* Bio */}
                {(selected.bio_ar||selected.bio) && (
                  <p style={{ color:C.muted, fontSize:13, lineHeight:1.6, margin:'0 0 14px', background:'#F8F7FA', padding:10, borderRadius:8 }}>
                    {selected.bio_ar||selected.bio}
                  </p>
                )}

                {/* Specializations */}
                {(selected.specializations||[]).length > 0 && (
                  <div style={{ marginBottom:14 }}>
                    <p style={{ fontSize:11, fontWeight:700, color:C.muted, margin:'0 0 6px' }}>التخصصات</p>
                    <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
                      {selected.specializations.map((s:string) => (
                        <span key={s} style={{ fontSize:11, background:'#F0EDFF', color:'#5B3FA0', padding:'2px 9px', borderRadius:10, fontWeight:600 }}>{s}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Platform metrics */}
                <div style={{ marginBottom:14 }}>
                  <p style={{ fontSize:11, fontWeight:700, color:C.muted, margin:'0 0 8px' }}>المتابعون</p>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
                    {[
                      { icon:'🎵', label:'تيك توك', val:selected.tiktok_followers, handle:selected.tiktok_handle },
                      { icon:'📷', label:'إنستغرام', val:selected.instagram_followers, handle:selected.instagram_handle },
                      { icon:'👻', label:'سناب', val:selected.snapchat_followers, handle:selected.snapchat_handle },
                      { icon:'▶️', label:'يوتيوب', val:selected.youtube_followers, handle:selected.youtube_handle },
                    ].filter(p => p.val > 0).map(p => (
                      <div key={p.label} style={{ background:'#F8F7FA', borderRadius:8, padding:'8px 10px' }}>
                        <div style={{ display:'flex', gap:5, alignItems:'center', marginBottom:2 }}>
                          <span style={{ fontSize:14 }}>{p.icon}</span>
                          <span style={{ fontSize:11, color:C.muted }}>{p.label}</span>
                        </div>
                        <div style={{ fontWeight:800, fontSize:15, color:C.navy }}>{fmt(p.val)}</div>
                        {p.handle && <div style={{ fontSize:10, color:C.orange }}>@{p.handle}</div>}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pricing */}
                {selected.price_basic && (
                  <div style={{ marginBottom:14 }}>
                    <p style={{ fontSize:11, fontWeight:700, color:C.muted, margin:'0 0 6px' }}>الأسعار</p>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:6 }}>
                      {[['أساسي',selected.price_basic],['معياري',selected.price_standard],['بريميوم',selected.price_premium]].filter(([,v])=>v).map(([l,v]) => (
                        <div key={l as string} style={{ textAlign:'center', background:'#F8F7FA', borderRadius:8, padding:'8px 6px' }}>
                          <div style={{ fontSize:14, fontWeight:800, color:C.orange }}>{(v as number).toLocaleString()}</div>
                          <div style={{ fontSize:10, color:C.muted }}>{l as string}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Meta */}
                <div style={{ fontSize:11, color:C.muted, borderTop:`1px solid ${C.border}`, paddingTop:12, marginBottom:14 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                    <span>تاريخ التسجيل</span>
                    <span style={{ fontWeight:600, color:C.text }}>{new Date(selected.created_at).toLocaleDateString('ar-SA')}</span>
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                    <span>حملات منجزة</span>
                    <span style={{ fontWeight:600, color:C.text }}>{selected.total_campaigns||0}</span>
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between' }}>
                    <span>متوسط التقييم</span>
                    <span style={{ fontWeight:600, color:'#F5A623' }}>{selected.avg_rating ? `${selected.avg_rating} ★` : '—'}</span>
                  </div>
                </div>

                {/* Action buttons */}
                <div style={{ display:'grid', gap:7 }}>
                  {selected.status === 'pending' && (
                    <>
                      <button onClick={() => updateStatus(selected.id,'active')} disabled={acting===selected.id} style={{ padding:'11px', background:C.green, border:'none', borderRadius:9, color:'#fff', fontWeight:800, fontSize:14, cursor:'pointer', fontFamily:'inherit' }}>
                        {acting===selected.id ? '⏳...' : '✓ قبول وتفعيل المؤثر'}
                      </button>
                      <button onClick={() => updateStatus(selected.id,'suspended')} disabled={acting===selected.id} style={{ padding:'11px', background:'#FEF2F2', border:'none', borderRadius:9, color:C.red, fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
                        ✗ رفض الطلب
                      </button>
                    </>
                  )}
                  {selected.status === 'active' && (
                    <button onClick={() => updateStatus(selected.id,'suspended')} disabled={acting===selected.id} style={{ padding:'11px', background:'#FEF2F2', border:'none', borderRadius:9, color:C.red, fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
                      🚫 إيقاف الحساب
                    </button>
                  )}
                  {selected.status === 'suspended' && (
                    <button onClick={() => updateStatus(selected.id,'active')} disabled={acting===selected.id} style={{ padding:'11px', background:'#EAF7E0', border:'none', borderRadius:9, color:C.green, fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
                      ✓ إعادة تفعيل
                    </button>
                  )}

                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:7 }}>
                    <button onClick={() => toggleField(selected.id,'is_verified',!selected.is_verified)} disabled={acting===selected.id} style={{ padding:'9px', background: selected.is_verified?'#FEF2F2':'#EAF7E0', border:'none', borderRadius:8, color: selected.is_verified?C.red:C.green, fontWeight:700, fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>
                      {selected.is_verified ? '✗ إلغاء التوثيق' : '✓ توثيق الحساب'}
                    </button>
                    <button onClick={() => toggleField(selected.id,'is_featured',!selected.is_featured)} disabled={acting===selected.id} style={{ padding:'9px', background: selected.is_featured?'#F1F1F1':'#FEF0ED', border:'none', borderRadius:8, color: selected.is_featured?C.muted:C.orange, fontWeight:700, fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>
                      {selected.is_featured ? '✗ إلغاء التمييز' : '⭐ تمييز'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ background:C.card, border:`2px dashed ${C.border}`, borderRadius:14, padding:'40px 24px', textAlign:'center' }}>
              <div style={{ fontSize:40, marginBottom:12 }}>👆</div>
              <h3 style={{ fontSize:15, fontWeight:700, color:C.navy, margin:'0 0 6px' }}>اختر مؤثراً</h3>
              <p style={{ fontSize:13, color:C.muted, margin:0 }}>اضغط على أي مؤثر من القائمة لعرض تفاصيله وإجراء القرارات</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
