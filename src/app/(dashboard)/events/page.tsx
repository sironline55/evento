'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState , Suspense} from 'react'
import { createBrowserClient } from '@supabase/ssr'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

const sb = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const C = {
  navy:'#1E0A3C', orange:'#F05537', text:'#39364F',
  muted:'#6F7287', border:'#DBDAE3', bg:'#FAFAFA', card:'#FFFFFF'
}

const STATUS_MAP: Record<string,{label:string;color:string;bg:string}> = {
  draft:     {label:'مسودة',  color:'#6F7287', bg:'#F8F7FA'},
  published: {label:'نشط',   color:'#166534', bg:'#EAF7E0'},
  completed: {label:'منتهي', color:'#6F7287', bg:'#F8F7FA'},
  cancelled: {label:'ملغي',  color:'#991B1B', bg:'#FEF2F2'},
}

type Tab = 'upcoming'|'past'|'draft'|'all'

function EventsPageInner() {
  const sp = useSearchParams()
  const [tab, setTab] = useState<Tab>('upcoming')
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState(sp.get('q')||'')
  const [counts, setCounts] = useState({ upcoming:0, past:0, draft:0, all:0 })

  useEffect(() => {
    loadEvents()
  }, [tab, search])

  async function loadEvents() {
    setLoading(true)
    const now = new Date().toISOString()
    let q = sb.from('events').select('id,title,start_date,end_date,status,location,cover_image,category,capacity,is_public')

    if (search) q = q.ilike('title', `%${search}%`)

    if (tab === 'upcoming') q = q.gte('start_date', now).in('status',['published','active']).order('start_date',{ascending:true})
    else if (tab === 'past') q = q.lt('start_date', now).order('start_date',{ascending:false})
    else if (tab === 'draft') q = q.eq('status','draft').order('created_at',{ascending:false})
    else q = q.order('created_at',{ascending:false})

    const { data } = await q.limit(50)
    setEvents(data||[])

    // count all tabs
    const nowStr = new Date().toISOString()
    const [up,past,draft,all] = await Promise.all([
      sb.from('events').select('*',{count:'exact',head:true}).gte('start_date',nowStr).in('status',['published','active']),
      sb.from('events').select('*',{count:'exact',head:true}).lt('start_date',nowStr),
      sb.from('events').select('*',{count:'exact',head:true}).eq('status','draft'),
      sb.from('events').select('*',{count:'exact',head:true}),
    ])
    setCounts({ upcoming:up.count||0, past:past.count||0, draft:draft.count||0, all:all.count||0 })
    setLoading(false)
  }

  const tabs: {id:Tab;label:string;count:number}[] = [
    { id:'upcoming', label:'🔜 القادمة', count:counts.upcoming },
    { id:'past',     label:'📁 المنتهية', count:counts.past },
    { id:'draft',    label:'📝 المسودات', count:counts.draft },
    { id:'all',      label:'الكل', count:counts.all },
  ]

  return (
    <div style={{ minHeight:'100vh', background:C.bg, direction:'rtl' }}>
      {/* Header */}
      <div style={{ background:C.card, borderBottom:`1px solid ${C.border}`, padding:'20px 24px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
          <h1 style={{ fontSize:26, fontWeight:800, color:C.navy, margin:0 }}>📅 الفعاليات</h1>
          <Link href="/events/new" style={{
            padding:'10px 20px', background:C.orange, color:'#fff',
            borderRadius:7, textDecoration:'none', fontWeight:700, fontSize:13
          }}>+ فعالية جديدة</Link>
        </div>

        {/* Search */}
        <input
          value={search}
          onChange={e=>setSearch(e.target.value)}
          placeholder="ابحث عن فعالية..."
          style={{
            width:'100%', padding:'10px 14px', border:`1px solid ${C.border}`,
            borderRadius:7, fontSize:14, outline:'none', fontFamily:'inherit',
            color:C.text, background:C.bg, boxSizing:'border-box', marginBottom:14
          }}
        />

        {/* Tabs */}
        <div style={{ display:'flex', gap:4, borderBottom:`2px solid ${C.border}`, marginBottom:-1 }}>
          {tabs.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{
              padding:'8px 14px', border:'none', background:'none', cursor:'pointer',
              fontFamily:'inherit', fontSize:13, fontWeight:700,
              color: tab===t.id ? C.orange : C.muted,
              borderBottom: tab===t.id ? `2px solid ${C.orange}` : '2px solid transparent',
              marginBottom:-2, whiteSpace:'nowrap'
            }}>
              {t.label}
              <span style={{ marginRight:5, fontSize:11, background:tab===t.id?'#FEF0ED':'#F8F7FA', color:tab===t.id?C.orange:C.muted, padding:'1px 6px', borderRadius:10 }}>
                {t.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Events Grid */}
      <div style={{ padding:'20px 24px' }}>
        {loading ? (
          <div style={{ textAlign:'center', padding:60, color:C.muted }}>جاري التحميل...</div>
        ) : events.length === 0 ? (
          <div style={{ textAlign:'center', padding:60 }}>
            <div style={{ fontSize:48, marginBottom:12 }}>
              {tab==='upcoming'?'🔜':tab==='past'?'📁':tab==='draft'?'📝':'📭'}
            </div>
            <p style={{ color:C.muted, fontSize:14, margin:'0 0 20px' }}>
              {tab==='upcoming'?'لا توجد فعاليات قادمة':tab==='past'?'لا توجد فعاليات منتهية':tab==='draft'?'لا توجد مسودات':'لا توجد فعاليات'}
            </p>
            <Link href="/events/new" style={{ padding:'10px 24px', background:C.orange, color:'#fff', borderRadius:7, textDecoration:'none', fontWeight:700, fontSize:13 }}>
              + أنشئ فعالية
            </Link>
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:16 }}>
            {events.map(ev=>{
              const st = STATUS_MAP[ev.status]||STATUS_MAP.draft
              const isPast = ev.end_date && new Date(ev.end_date) < new Date()
              return (
                <Link key={ev.id} href={`/events/${ev.id}`} style={{ textDecoration:'none' }}>
                  <div style={{
                    background:C.card, border:`1px solid ${C.border}`, borderRadius:10,
                    overflow:'hidden', transition:'box-shadow 0.15s, transform 0.15s', cursor:'pointer'
                  }}
                    onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.boxShadow='0 4px 20px rgba(0,0,0,0.1)';(e.currentTarget as HTMLElement).style.transform='translateY(-2px)'}}
                    onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.boxShadow='none';(e.currentTarget as HTMLElement).style.transform='translateY(0)'}}
                  >
                    {/* Cover */}
                    {ev.cover_image ? (
                      <div style={{ height:120, overflow:'hidden' }}>
                        <img src={ev.cover_image} alt={ev.title} style={{ width:'100%', height:'100%', objectFit:'cover', filter:isPast?'grayscale(0.4)':'none' }}/>
                      </div>
                    ) : (
                      <div style={{ height:80, background:`linear-gradient(135deg,${C.navy},#3D1A78)`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                        <span style={{ fontSize:28 }}>📅</span>
                      </div>
                    )}

                    <div style={{ padding:'14px 16px' }}>
                      {/* Category & Status */}
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                        <span style={{ fontSize:11, color:C.muted }}>{ev.category||'—'}</span>
                        <span style={{ fontSize:11, fontWeight:700, color:st.color, background:st.bg, padding:'2px 8px', borderRadius:10 }}>
                          {st.label}
                        </span>
                      </div>

                      <h3 style={{ fontSize:14, fontWeight:700, color:C.navy, margin:'0 0 8px', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
                        {ev.title}
                      </h3>

                      <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                        {ev.start_date && (
                          <p style={{ fontSize:12, color:C.muted, margin:0, display:'flex', alignItems:'center', gap:5 }}>
                            <span>📅</span>
                            {new Date(ev.start_date).toLocaleDateString('ar-SA',{weekday:'short',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}
                          </p>
                        )}
                        {ev.location && (
                          <p style={{ fontSize:12, color:C.muted, margin:0, display:'flex', alignItems:'center', gap:5 }}>
                            <span>📍</span>{ev.location}
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div style={{ display:'flex', gap:6, marginTop:12, paddingTop:10, borderTop:`1px solid ${C.border}` }}>
                        <Link href={`/events/${ev.id}`} onClick={e=>e.stopPropagation()} style={{
                          flex:1, padding:'6px', textAlign:'center', fontSize:11, fontWeight:700,
                          color:C.navy, background:'#F0EDF7', borderRadius:5, textDecoration:'none'
                        }}>إدارة</Link>
                        <Link href={`/scanner?event=${ev.id}`} onClick={e=>e.stopPropagation()} style={{
                          flex:1, padding:'6px', textAlign:'center', fontSize:11, fontWeight:700,
                          color:'#166534', background:'#EAF7E0', borderRadius:5, textDecoration:'none'
                        }}>📷 مسح</Link>
                        <Link href={`/e/${ev.id}`} onClick={e=>e.stopPropagation()} target="_blank" style={{
                          flex:1, padding:'6px', textAlign:'center', fontSize:11, fontWeight:700,
                          color:C.orange, background:'#FEF0ED', borderRadius:5, textDecoration:'none'
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
  )
}
