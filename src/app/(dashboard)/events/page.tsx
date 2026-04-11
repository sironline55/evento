'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState, useMemo, Suspense } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import MobilePageHeader from '@/components/layout/MobilePageHeader'
const C = {
  navy:'#1E0A3C', orange:'#F05537', text:'#39364F',
  muted:'#6F7287', border:'#DBDAE3', bg:'#FAFAFA', card:'#FFFFFF'
}

const STATUS_MAP: Record<string,{label:string;color:string;bg:string}> = {
  draft:     {label:'مسودة',  color:'#6F7287', bg:'#F8F7FA'},
  published: {label:'نشط',   color:'#166534', bg:'#EAF7E0'},
  active:    {label:'نشط',   color:'#166534', bg:'#EAF7E0'},
  completed: {label:'منتهي', color:'#6F7287', bg:'#F8F7FA'},
  cancelled: {label:'ملغي',  color:'#991B1B', bg:'#FEF2F2'},
}

type Tab = 'upcoming'|'past'|'draft'|'all'

function EventsPageInner() {
  // ✅ Create client once with useMemo — not re-created on every render
  const sb = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), [])

  const sp = useSearchParams()
  const [tab, setTab] = useState<Tab>('all')  // ✅ Default 'all' — no date filter
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string|null>(null)
  const [search, setSearch] = useState(sp.get('q')||'')
  const [counts, setCounts] = useState({ upcoming:0, past:0, draft:0, all:0 })

  useEffect(() => {
    loadEvents()
  }, [tab, search])

  async function loadEvents() {
    setLoading(true)
    setError(null)

    // ── Main fetch ──────────────────────────────────────────────
    try {
      const now = new Date().toISOString()
      let q = sb.from('events').select(
        'id,title,start_date,end_date,status,location,cover_image,category,capacity,is_public'
      )

      if (search) q = q.ilike('title', `%${search}%`)

      if (tab === 'upcoming') {
        q = q.gte('start_date', now).in('status',['published','active']).order('start_date',{ascending:true})
      } else if (tab === 'past') {
        q = q.lt('start_date', now).order('start_date',{ascending:false})
      } else if (tab === 'draft') {
        q = q.eq('status','draft').order('created_at',{ascending:false})
      } else {
        // 'all' — no date filter
        q = q.order('created_at',{ascending:false})
      }

      const { data, error: qErr } = await q.limit(50)

      if (qErr) {
        console.error('Events fetch error:', qErr)
        setError(`خطأ في التحميل: ${qErr.message}`)
        setEvents([])
      } else {
        setEvents(data || [])
      }
    } catch (e: any) {
      console.error('loadEvents exception:', e)
      setError(`خطأ غير متوقع: ${e?.message}`)
      setEvents([])
    } finally {
      // ✅ ALWAYS called — even if counts below throw
      setLoading(false)
    }

    // ── Counts (non-critical — failure doesn't freeze the page) ──
    try {
      const nowStr = new Date().toISOString()
      const [up, past, draft, all] = await Promise.all([
        sb.from('events').select('id').gte('start_date',nowStr).in('status',['published','active']),
        sb.from('events').select('id').lt('start_date',nowStr),
        sb.from('events').select('id').eq('status','draft'),
        sb.from('events').select('id'),
      ])
      setCounts({
        upcoming: up.data?.length   || 0,
        past:     past.data?.length  || 0,
        draft:    draft.data?.length || 0,
        all:      all.data?.length   || 0,
      })
    } catch (ce) {
      console.warn('Counts fetch failed (non-critical):', ce)
    }
  }

  const tabs: {id:Tab;label:string;count:number}[] = [
    { id:'all',      label:'الكل',        count:counts.all },
    { id:'upcoming', label:'🔜 القادمة',  count:counts.upcoming },
    { id:'past',     label:'📁 المنتهية', count:counts.past },
    { id:'draft',    label:'📝 المسودات', count:counts.draft },
  ]


  async function duplicateEvent(ev: any, e: React.MouseEvent) {
    e.preventDefault(); e.stopPropagation()
    const { data: { user } } = await sb.auth.getUser()
    if (!user) return
    const { data: org } = await sb.from('organizations').select('id').eq('owner_id', user.id).single()
    if (!org) return
    const newTitle = `نسخة من ${ev.title}`
    const { error } = await sb.from('events').insert({
      title: newTitle, description: ev.description,
      location: ev.location, capacity: ev.capacity,
      price_from: ev.price_from, category_icon: ev.category_icon,
      is_public: false, status: 'draft',
      org_id: org.id, created_by: user.id,
      start_date: ev.start_date, end_date: ev.end_date,
      cancellation_policy: ev.cancellation_policy,
      waitlist_enabled: ev.waitlist_enabled,
    })
    if (!error) {
      window.location.reload()
    } else {
      alert('خطأ في النسخ: ' + error.message)
    }
  }

  return (
    <div style={{ minHeight:'100vh', background:C.bg, direction:'rtl' }}>
      <MobilePageHeader
        title="الفعاليات"
        subtitle={`${events.length} فعالية`}
        action={{ label:'+ جديدة', href:'/events/new' }}
      />

      {/* ── Header ── */}
      <div style={{ background:C.card, borderBottom:`1px solid ${C.border}`, padding:'20px 24px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
          <h1 style={{ fontSize:26, fontWeight:800, color:C.navy, margin:0 }}>📅 الفعاليات</h1>
          <Link href="/events/new" style={{
            padding:'10px 20px', background:C.orange, color:'#fff',
            borderRadius:7, textDecoration:'none', fontWeight:700, fontSize:13
          }}>+ فعالية جديدة</Link>
        </div>

        <input
          value={search}
          onChange={e=>setSearch(e.target.value)}
          placeholder="ابحث عن فعالية..."
          style={{
            width:'100%', padding:'10px 14px', border:`1px solid ${C.border}`,
            borderRadius:7, fontSize:14, outline:'none', fontFamily:'inherit',
            color:C.text, background:C.bg, boxSizing:'border-box' as const, marginBottom:14
          }}
        />

        <div style={{ display:'flex', gap:4, borderBottom:`2px solid ${C.border}`, marginBottom:-1 }}>
          {tabs.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{
              padding:'8px 14px', border:'none', background:'none', cursor:'pointer',
              fontFamily:'inherit', fontSize:13, fontWeight:700,
              color: tab===t.id ? C.orange : C.muted,
              borderBottom: tab===t.id ? `2px solid ${C.orange}` : '2px solid transparent',
              marginBottom:-2, whiteSpace:'nowrap' as const
            }}>
              {t.label}
              <span style={{
                marginRight:5, fontSize:11, padding:'1px 6px', borderRadius:10,
                background:tab===t.id?'#FEF0ED':'#F8F7FA',
                color:tab===t.id?C.orange:C.muted
              }}>
                {t.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ padding:'20px 24px' }}>

        {error && (
          <div style={{
            padding:'12px 16px', background:'#FEF2F2', border:'1px solid #FCA5A5',
            borderRadius:8, color:'#991B1B', marginBottom:16, fontSize:13
          }}>
            ⚠️ {error}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign:'center', padding:60, color:C.muted }}>جاري التحميل...</div>

        ) : events.length === 0 ? (
          <div style={{ textAlign:'center', padding:60 }}>
            <div style={{ fontSize:48, marginBottom:12 }}>
              {tab==='upcoming'?'🔜':tab==='past'?'📁':tab==='draft'?'📝':'📭'}
            </div>
            <p style={{ color:C.muted, fontSize:14, margin:'0 0 20px' }}>
              {tab==='upcoming'?'لا توجد فعاليات قادمة'
               :tab==='past'?'لا توجد فعاليات منتهية'
               :tab==='draft'?'لا توجد مسودات'
               :'لا توجد فعاليات'}
            </p>
            <Link href="/events/new" style={{
              padding:'10px 24px', background:C.orange, color:'#fff',
              borderRadius:7, textDecoration:'none', fontWeight:700, fontSize:13
            }}>
              + أنشئ فعالية
            </Link>
          </div>

        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:16 }}>
            {events.map(ev=>{
              const st = STATUS_MAP[ev.status] || STATUS_MAP.draft
              const isPast = ev.end_date && new Date(ev.end_date) < new Date()
              return (
                <Link key={ev.id} href={`/events/${ev.id}`} style={{ textDecoration:'none' }}>
                  <div
                    style={{
                      background:C.card, border:`1px solid ${C.border}`,
                      borderRadius:10, overflow:'hidden',
                      transition:'box-shadow 0.15s, transform 0.15s', cursor:'pointer'
                    }}
                    onMouseEnter={e=>{
                      const el = e.currentTarget as HTMLElement
                      el.style.boxShadow='0 4px 20px rgba(0,0,0,0.1)'
                      el.style.transform='translateY(-2px)'
                    }}
                    onMouseLeave={e=>{
                      const el = e.currentTarget as HTMLElement
                      el.style.boxShadow='none'
                      el.style.transform='translateY(0)'
                    }}
                  >
                    {ev.cover_image ? (
                      <div style={{ height:120, overflow:'hidden' }}>
                        <img src={ev.cover_image} alt={ev.title} style={{
                          width:'100%', height:'100%', objectFit:'cover',
                          filter:isPast?'grayscale(0.4)':'none'
                        }}/>
                      </div>
                    ) : (
                      <div style={{
                        height:80,
                        background:`linear-gradient(135deg,${C.navy},#3D1A78)`,
                        display:'flex', alignItems:'center', justifyContent:'center'
                      }}>
                        <span style={{ fontSize:28 }}>📅</span>
                      </div>
                    )}

                    <div style={{ padding:'14px 16px' }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                        <span style={{ fontSize:11, color:C.muted }}>{ev.category||'—'}</span>
                        <span style={{
                          fontSize:11, fontWeight:700,
                          color:st.color, background:st.bg,
                          padding:'2px 8px', borderRadius:10
                        }}>{st.label}</span>
                      </div>

                      <h3 style={{
                        fontSize:14, fontWeight:700, color:C.navy, margin:'0 0 8px',
                        display:'-webkit-box' as const,
                        WebkitLineClamp:2, WebkitBoxOrient:'vertical' as const, overflow:'hidden'
                      }}>
                        {ev.title}
                      </h3>

                      <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                        {ev.start_date && (
                          <p style={{ fontSize:12, color:C.muted, margin:0, display:'flex', alignItems:'center', gap:5 }}>
                            <span>📅</span>
                            {new Date(ev.start_date).toLocaleDateString('ar-SA',{
                              weekday:'short',month:'short',day:'numeric',
                              hour:'2-digit',minute:'2-digit'
                            })}
                          </p>
                        )}
                        {ev.location && (
                          <p style={{ fontSize:12, color:C.muted, margin:0, display:'flex', alignItems:'center', gap:5 }}>
                            <span>📍</span>{ev.location}
                          </p>
                        )}
                      </div>

                      <div style={{
                        display:'flex', gap:6, marginTop:12,
                        paddingTop:10, borderTop:`1px solid ${C.border}`
                      }}>
                        <Link href={`/events/${ev.id}`} onClick={e=>e.stopPropagation()} style={{
                          flex:1, padding:'6px', textAlign:'center' as const, fontSize:11,
                          fontWeight:700, color:C.navy, background:'#F0EDF7',
                          borderRadius:5, textDecoration:'none'
                        }}>إدارة</Link>
                        <Link href={`/scanner?event=${ev.id}`} onClick={e=>e.stopPropagation()} style={{
                          flex:1, padding:'6px', textAlign:'center' as const, fontSize:11,
                          fontWeight:700, color:'#166534', background:'#EAF7E0',
                          borderRadius:5, textDecoration:'none'
                        }}>📷 مسح</Link>
                        <Link href={`/e/${ev.id}`} onClick={e=>e.stopPropagation()} target="_blank" style={{
                          flex:1, padding:'6px', textAlign:'center' as const, fontSize:11,
                          fontWeight:700, color:C.orange, background:'#FEF0ED',
                          borderRadius:5, textDecoration:'none'
                        }}>🔗 عرض</Link>
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      <div className="h-20 md:h-0"/>
    </div>
  )
}

export default function EventsPage() {
  return (
    <Suspense fallback={<div style={{padding:40,textAlign:'center',color:'#666'}}>جاري التحميل...</div>}>
      <EventsPageInner />
    </Suspense>
    </div>
  )
}
