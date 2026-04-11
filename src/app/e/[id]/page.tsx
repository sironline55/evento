export const dynamic = 'force-dynamic'
import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import Link from 'next/link'

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
    .select('*')
    .eq('id', id)
    .single()

  if (!ev) notFound()

  const { count: regCount } = await sb
    .from('registrations')
    .select('*', { count:'exact', head:true })
    .eq('event_id', id)
    .neq('status','cancelled')

  const isFull = ev.capacity && regCount! >= ev.capacity
  const spotsLeft = ev.capacity ? ev.capacity - (regCount||0) : null
  const isPast = ev.end_date && new Date(ev.end_date) < new Date()

  const formatDate = (d: string) => new Date(d).toLocaleString('ar-SA', {
    weekday:'long', year:'numeric', month:'long', day:'numeric', hour:'2-digit', minute:'2-digit'
  })

  const agenda = ev.agenda || []
  const lineup = ev.lineup || []

  return (
    <div style={{ minHeight:'100vh', background:C.bg, direction:'rtl', fontFamily:'Tajawal, system-ui, sans-serif' }}>

      {/* Sticky header */}
      <div style={{ position:'sticky', top:0, zIndex:50, background:'rgba(255,255,255,0.95)', backdropFilter:'blur(8px)', borderBottom:`1px solid ${C.border}`, padding:'12px 20px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ width:28, height:28, background:C.orange, borderRadius:5, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:800, fontSize:11 }}>E</div>
          <span style={{ fontSize:13, fontWeight:700, color:C.navy }}>EventVMS</span>
        </div>
        {!isPast && !isFull && (
          <Link href={`/r/${id}`} style={{
            padding:'9px 20px', background:C.orange, color:'#fff',
            borderRadius:6, textDecoration:'none', fontWeight:700, fontSize:13
          }}>سجّل الآن</Link>
        )}
      </div>

      {/* Cover image */}
      {ev.cover_image ? (
        <div style={{ height:320, position:'relative', overflow:'hidden' }}>
          <img src={ev.cover_image} alt={ev.title} style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
          <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.7))' }}/>
        </div>
      ) : (
        <div style={{ height:220, background:`linear-gradient(135deg,${C.navy},#3D1A78)`, display:'flex', alignItems:'flex-end', padding:32 }}>
          <div style={{ fontSize:48 }}>{ev.category_icon || '🎪'}</div>
        </div>
      )}

      <div style={{ maxWidth:720, margin:'0 auto', padding:'0 16px' }}>

        {/* Main card */}
        <div style={{ background:C.card, borderRadius:12, border:`1px solid ${C.border}`, marginTop:-40, position:'relative', zIndex:10, overflow:'hidden', marginBottom:16 }}>
          <div style={{ padding:'24px 24px 20px' }}>
            <div style={{ display:'flex', gap:8, marginBottom:12, flexWrap:'wrap' }}>
              {ev.status === 'published' && !isPast && (
                <span style={{ fontSize:12, padding:'4px 10px', background:'#EAF7E0', color:'#166534', borderRadius:12, fontWeight:600 }}>● نشط</span>
              )}
              {ev.price_from && ev.price_from > 0 ? (
                <span style={{ fontSize:12, padding:'4px 10px', background:'#FEF0ED', color:C.orange, borderRadius:12, fontWeight:600 }}>
                  يبدأ من {ev.price_from} ريال
                </span>
              ) : (
                <span style={{ fontSize:12, padding:'4px 10px', background:'#EDE9F7', color:'#7B4FBF', borderRadius:12, fontWeight:600 }}>مجاني</span>
              )}
              {isPast && (
                <span style={{ fontSize:12, padding:'4px 10px', background:'#F8F7FA', color:C.muted, borderRadius:12, fontWeight:600 }}>منتهي</span>
              )}
            </div>

            <h1 style={{ fontSize:26, fontWeight:800, color:C.navy, margin:'0 0 8px' }}>{ev.title}</h1>
            {ev.description && (
              <p style={{ fontSize:14, color:C.text, lineHeight:1.65, margin:0 }}>{ev.description}</p>
            )}
          </div>

          {/* Details grid */}
          <div style={{ borderTop:`1px solid ${C.border}`, padding:'16px 24px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            {ev.start_date && (
              <div style={{ display:'flex', gap:10 }}>
                <span style={{ fontSize:20, flexShrink:0 }}>📅</span>
                <div>
                  <p style={{ fontSize:11, color:C.muted, margin:0 }}>التاريخ</p>
                  <p style={{ fontSize:13, fontWeight:600, color:C.text, margin:'2px 0 0' }}>{formatDate(ev.start_date)}</p>
                </div>
              </div>
            )}
            {ev.location && (
              <div style={{ display:'flex', gap:10 }}>
                <span style={{ fontSize:20, flexShrink:0 }}>📍</span>
                <div>
                  <p style={{ fontSize:11, color:C.muted, margin:0 }}>الموقع</p>
                  <p style={{ fontSize:13, fontWeight:600, color:C.text, margin:'2px 0 0' }}>{ev.location}</p>
                </div>
              </div>
            )}
            {ev.capacity && (
              <div style={{ display:'flex', gap:10 }}>
                <span style={{ fontSize:20, flexShrink:0 }}>🎟</span>
                <div>
                  <p style={{ fontSize:11, color:C.muted, margin:0 }}>المقاعد المتبقية</p>
                  <p style={{ fontSize:13, fontWeight:600, color: isFull?'#DC2626':C.text, margin:'2px 0 0' }}>
                    {isFull ? 'اكتملت المقاعد' : `${spotsLeft?.toLocaleString('ar-SA')} مقعد متبقي`}
                  </p>
                </div>
              </div>
            )}
            {regCount! > 0 && (
              <div style={{ display:'flex', gap:10 }}>
                <span style={{ fontSize:20, flexShrink:0 }}>👥</span>
                <div>
                  <p style={{ fontSize:11, color:C.muted, margin:0 }}>المسجلون</p>
                  <p style={{ fontSize:13, fontWeight:600, color:C.text, margin:'2px 0 0' }}>{regCount?.toLocaleString('ar-SA')} شخص</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Share card */}
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:'16px 24px', marginBottom:16, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <p style={{ fontWeight:700, color:C.navy, fontSize:14, margin:0 }}>شارك الفعالية</p>
            <p style={{ color:C.muted, fontSize:12, margin:'4px 0 0' }}>انسخ الرابط وأرسله لأصدقائك</p>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <a href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`${ev.title} - سجّل الآن`)}`} target="_blank" rel="noopener" style={{ padding:'8px 14px', background:'#25D366', color:'#fff', borderRadius:8, textDecoration:'none', fontSize:13, fontWeight:600 }}>واتساب</a>
            <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(ev.title)}`} target="_blank" rel="noopener" style={{ padding:'8px 14px', background:'#000', color:'#fff', borderRadius:8, textDecoration:'none', fontSize:13, fontWeight:600 }}>X</a>
          </div>
        </div>

        {/* Agenda */}
        {agenda.length > 0 && (
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:24, marginBottom:16 }}>
            <h2 style={{ fontSize:16, fontWeight:700, color:C.navy, margin:'0 0 16px' }}>📋 البرنامج</h2>
            <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
              {agenda.map((item: any, i: number) => (
                <div key={i} style={{ display:'flex', gap:16, paddingBottom:16, borderBottom: i<agenda.length-1?`1px solid ${C.border}`:'none', marginBottom: i<agenda.length-1?16:0 }}>
                  <div style={{ flexShrink:0, textAlign:'center', minWidth:52 }}>
                    <span style={{ fontSize:12, fontWeight:700, color:C.orange, background:'#FEF0ED', padding:'4px 8px', borderRadius:6, display:'inline-block' }}>{item.time}</span>
                  </div>
                  <div>
                    <p style={{ fontSize:14, fontWeight:700, color:C.navy, margin:0 }}>{item.title}</p>
                    {item.speaker && <p style={{ fontSize:12, color:C.muted, margin:'2px 0 0' }}>👤 {item.speaker}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Registration CTA */}
        {!isPast && (
          <div style={{ background:`linear-gradient(135deg,${C.navy},#3D1A78)`, borderRadius:12, padding:24, marginBottom:24, textAlign:'center' }}>
            {isFull ? (
              <>
                <p style={{ color:'rgba(255,255,255,0.7)', fontSize:13, margin:'0 0 8px' }}>اكتملت مقاعد هذه الفعالية</p>
                <p style={{ color:'#fff', fontWeight:700, fontSize:16, margin:0 }}>تابعنا للفعاليات القادمة</p>
              </>
            ) : (
              <>
                <p style={{ color:'rgba(255,255,255,0.7)', fontSize:13, margin:'0 0 8px' }}>
                  {spotsLeft ? `${spotsLeft} مقعد متبقي فقط` : 'التسجيل مفتوح'}
                </p>
                <Link href={`/r/${id}`} style={{
                  display:'inline-block', padding:'14px 40px',
                  background:C.orange, color:'#fff', borderRadius:8,
                  textDecoration:'none', fontWeight:800, fontSize:15
                }}>🎟 سجّل مقعدك الآن</Link>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
