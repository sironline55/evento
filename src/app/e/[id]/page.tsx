export const dynamic = 'force-dynamic'
import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import ShareButtons from './ShareButtons'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const C = {
  navy:'#1E0A3C', orange:'#F05537', text:'#39364F',
  muted:'#6F7287', border:'#DBDAE3', bg:'#FAFAFA', card:'#FFFFFF'
}

export default async function PublicEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const { data: ev } = await sb
    .from('events')
    .select('*, organizations(name, logo_url, accent_color, slug)')
    .eq('id', id)
    .single()

  if (!ev) notFound()

  const { count: regCount } = await sb
    .from('registrations')
    .select('*', { count:'exact', head:true })
    .eq('event_id', id)
    .neq('status','cancelled')

  const isFull    = ev.capacity && (regCount||0) >= ev.capacity
  const spotsLeft = ev.capacity ? ev.capacity - (regCount||0) : null
  const isPast    = ev.end_date && new Date(ev.end_date) < new Date()
  const org       = ev.organizations as any
  const accent    = org?.accent_color || C.orange

  const pageUrl = `https://evento-h2ir.vercel.app/e/${id}`

  const fmtDate = (d: string) => new Date(d).toLocaleString('ar-SA', {
    weekday:'long', year:'numeric', month:'long', day:'numeric',
    hour:'2-digit', minute:'2-digit'
  })
  const fmtTime = (d: string) => new Date(d).toLocaleTimeString('ar-SA', {
    hour:'2-digit', minute:'2-digit'
  })

  const pct = ev.capacity ? Math.round(((regCount||0)/ev.capacity)*100) : 0

  return (
    <div style={{ minHeight:'100vh', background:C.bg, direction:'rtl', fontFamily:'Tajawal, system-ui, sans-serif' }}>

      {/* Sticky header */}
      <div style={{ position:'sticky', top:0, zIndex:50, background:'rgba(255,255,255,0.96)', backdropFilter:'blur(10px)', borderBottom:`1px solid ${C.border}`, padding:'10px 20px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          {org?.logo_url ? (
            <img src={org.logo_url} alt={org.name} style={{ width:28, height:28, borderRadius:6, objectFit:'cover' }}/>
          ) : (
            <div style={{ width:28, height:28, background:accent, borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:800, fontSize:11 }}>
              {org?.name?.[0] || 'E'}
            </div>
          )}
          <span style={{ fontSize:13, fontWeight:700, color:C.navy }}>{org?.name || 'EventVMS'}</span>
        </div>
        {!isPast && !isFull && (
          <Link href={`/r/${id}`} style={{
            padding:'9px 22px', background:accent, color:'#fff',
            borderRadius:8, textDecoration:'none', fontWeight:700, fontSize:13
          }}>سجّل الآن</Link>
        )}
      </div>

      {/* Hero */}
      {ev.cover_image ? (
        <div style={{ height:340, position:'relative', overflow:'hidden' }}>
          <img src={ev.cover_image} alt={ev.title} style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
          <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.75))' }}/>
          <div style={{ position:'absolute', bottom:28, right:24, left:24 }}>
            <span style={{ fontSize:28, display:'block', marginBottom:8 }}>{ev.category_icon || '🎪'}</span>
            <h1 style={{ fontSize:26, fontWeight:900, color:'#fff', margin:0, lineHeight:1.2, textShadow:'0 2px 8px rgba(0,0,0,.4)' }}>{ev.title}</h1>
          </div>
        </div>
      ) : (
        <div style={{ height:240, background:`linear-gradient(135deg,${C.navy},#3D1A78)`, display:'flex', flexDirection:'column', alignItems:'flex-start', justifyContent:'flex-end', padding:'28px 24px' }}>
          <span style={{ fontSize:36, marginBottom:10 }}>{ev.category_icon || '🎪'}</span>
          <h1 style={{ fontSize:26, fontWeight:900, color:'#fff', margin:0, lineHeight:1.25 }}>{ev.title}</h1>
        </div>
      )}

      <div style={{ maxWidth:720, margin:'0 auto', padding:'0 16px 40px' }}>

        {/* Main info card */}
        <div style={{ background:C.card, borderRadius:16, border:`1px solid ${C.border}`, marginTop:-32, position:'relative', zIndex:10, overflow:'hidden', marginBottom:14, boxShadow:'0 4px 24px rgba(0,0,0,.07)' }}>
          <div style={{ padding:'24px 24px 18px' }}>

            {/* Badges */}
            <div style={{ display:'flex', gap:8, marginBottom:14, flexWrap:'wrap' }}>
              {ev.status === 'published' && !isPast && (
                <span style={{ fontSize:12, padding:'4px 10px', background:'#EAF7E0', color:'#166534', borderRadius:20, fontWeight:600 }}>● نشط</span>
              )}
              {ev.price_from && Number(ev.price_from) > 0 ? (
                <span style={{ fontSize:12, padding:'4px 10px', background:'#FEF0ED', color:accent, borderRadius:20, fontWeight:600 }}>
                  يبدأ من {Number(ev.price_from).toLocaleString('ar-SA')} ريال
                </span>
              ) : (
                <span style={{ fontSize:12, padding:'4px 10px', background:'#EDE9F7', color:'#7B4FBF', borderRadius:20, fontWeight:600 }}>مجاني</span>
              )}
              {isPast && (
                <span style={{ fontSize:12, padding:'4px 10px', background:'#F8F7FA', color:C.muted, borderRadius:20, fontWeight:600 }}>انتهت الفعالية</span>
              )}
            </div>

            {ev.description && (
              <p style={{ fontSize:14, color:C.text, lineHeight:1.75, margin:0 }}>{ev.description}</p>
            )}
          </div>

          {/* Details */}
          <div style={{ borderTop:`1px solid ${C.border}`, padding:'18px 24px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:18 }}>
            {ev.start_date && (
              <div style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
                <span style={{ fontSize:22 }}>📅</span>
                <div>
                  <p style={{ fontSize:11, color:C.muted, margin:'0 0 3px', fontWeight:600 }}>التاريخ</p>
                  <p style={{ fontSize:13, fontWeight:700, color:C.navy, margin:0 }}>{fmtDate(ev.start_date)}</p>
                  {ev.end_date && (
                    <p style={{ fontSize:11, color:C.muted, margin:'2px 0 0' }}>ينتهي: {fmtTime(ev.end_date)}</p>
                  )}
                </div>
              </div>
            )}
            {ev.location && (
              <div style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
                <span style={{ fontSize:22 }}>📍</span>
                <div>
                  <p style={{ fontSize:11, color:C.muted, margin:'0 0 3px', fontWeight:600 }}>الموقع</p>
                  <p style={{ fontSize:13, fontWeight:700, color:C.navy, margin:0 }}>{ev.location}</p>
                  <a href={`https://maps.google.com/?q=${encodeURIComponent(ev.location)}`} target="_blank" rel="noopener"
                    style={{ fontSize:11, color:accent, textDecoration:'none', marginTop:3, display:'inline-block' }}>
                    افتح الخريطة ↗
                  </a>
                </div>
              </div>
            )}
            {ev.capacity && (
              <div style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
                <span style={{ fontSize:22 }}>🎟</span>
                <div>
                  <p style={{ fontSize:11, color:C.muted, margin:'0 0 3px', fontWeight:600 }}>المقاعد</p>
                  <p style={{ fontSize:13, fontWeight:700, color: isFull?'#DC2626':C.navy, margin:'0 0 5px' }}>
                    {isFull ? 'اكتملت المقاعد' : `${(spotsLeft||0).toLocaleString('ar-SA')} متبقي من ${ev.capacity.toLocaleString('ar-SA')}`}
                  </p>
                  {!isFull && ev.capacity && (
                    <div style={{ height:5, background:'#EDE9F7', borderRadius:4, overflow:'hidden' }}>
                      <div style={{ height:'100%', width:`${pct}%`, background: pct>80?'#DC2626':accent, borderRadius:4, transition:'width .3s' }}/>
                    </div>
                  )}
                </div>
              </div>
            )}
            {(regCount||0) > 0 && (
              <div style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
                <span style={{ fontSize:22 }}>👥</span>
                <div>
                  <p style={{ fontSize:11, color:C.muted, margin:'0 0 3px', fontWeight:600 }}>المسجلون</p>
                  <p style={{ fontSize:13, fontWeight:700, color:C.navy, margin:0 }}>{(regCount||0).toLocaleString('ar-SA')} شخص</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Share card — client component for copy */}
        <ShareButtons eventTitle={ev.title} pageUrl={pageUrl} accent={accent} />

        {/* CTA */}
        {!isPast && (
          <div style={{ background:`linear-gradient(135deg,${C.navy},#3D1A78)`, borderRadius:16, padding:'28px 24px', marginTop:14, textAlign:'center' }}>
            {isFull ? (
              <>
                <p style={{ color:'rgba(255,255,255,.7)', fontSize:14, margin:'0 0 8px' }}>اكتملت المقاعد</p>
                <p style={{ color:'#fff', fontWeight:700, fontSize:16, margin:0 }}>تابع فعالياتنا القادمة</p>
                {org?.slug && (
                  <Link href={`/org/${org.slug}`} style={{ display:'inline-block', marginTop:14, padding:'10px 28px', background:'rgba(255,255,255,.15)', color:'#fff', borderRadius:8, textDecoration:'none', fontWeight:600, fontSize:14 }}>
                    عرض الفعاليات الأخرى
                  </Link>
                )}
              </>
            ) : (
              <>
                <p style={{ color:'rgba(255,255,255,.7)', fontSize:13, margin:'0 0 6px' }}>
                  {spotsLeft !== null ? `${(spotsLeft).toLocaleString('ar-SA')} مقعد متبقي فقط` : 'التسجيل مفتوح'}
                </p>
                <Link href={`/r/${id}`} style={{
                  display:'inline-block', padding:'14px 48px',
                  background:accent, color:'#fff', borderRadius:10,
                  textDecoration:'none', fontWeight:800, fontSize:16
                }}>🎟 سجّل مقعدك الآن</Link>
              </>
            )}
          </div>
        )}

        {/* Org footer */}
        {org && (
          <div style={{ textAlign:'center', marginTop:24 }}>
            <Link href={`/org/${org.slug}`} style={{ color:C.muted, fontSize:12, textDecoration:'none' }}>
              عرض جميع فعاليات {org.name} ←
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
