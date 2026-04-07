'use client'
export const dynamic = 'force-dynamic'
import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import Link from 'next/link'

const C = { navy:'#1E0A3C',orange:'#F05537',text:'#39364F',muted:'#6F7287',border:'#DBDAE3',bg:'#FAFAFA',card:'#FFFFFF',green:'#3A7D0A' }

export default function MyTicketsPage() {
  const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const [email, setEmail]   = useState('')
  const [phone, setPhone]   = useState('')
  const [tickets, setTickets] = useState<any[]|null>(null)
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  async function search(e: React.FormEvent) {
  const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    e.preventDefault(); setLoading(true)
    let q = sb.from('registrations').select('*, events(title,start_date,end_date,location,cover_image,location_type)')
    if (email.trim()) q = q.eq('guest_email', email.trim().toLowerCase())
    else if (phone.trim()) q = q.eq('guest_phone', phone.trim())
    else { setLoading(false); return }
    const { data } = await q.order('created_at', { ascending: false })
    setTickets(data || [])
    setSearched(true)
    setLoading(false)
  }

  const ST: Record<string,{label:string;color:string;bg:string;icon:string}> = {
    registered: {label:'مسجّل',    color:'#7B4FBF', bg:'#EDE9F7', icon:'🎟'},
    attended:   {label:'حضر',      color:C.green,   bg:'#EAF7E0', icon:'✅'},
    cancelled:  {label:'ملغي',     color:'#DC2626', bg:'#FEF2F2', icon:'❌'},
    waitlisted: {label:'انتظار',   color:'#B07000', bg:'#FFF8E8', icon:'⏳'},
  }

  return (
    <div style={{ minHeight:'100vh', background:`linear-gradient(135deg, ${C.navy} 0%, #3D1A78 100%)`, direction:'rtl', padding:'24px 16px' }}>
      {/* Logo */}
      <div style={{ textAlign:'center', marginBottom:28 }}>
        <Link href="/" style={{ display:'inline-flex', alignItems:'center', gap:8, textDecoration:'none' }}>
          <div style={{ width:36,height:36,background:C.orange,borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:800,fontSize:16 }}>E</div>
          <span style={{ color:'rgba(255,255,255,0.8)',fontWeight:700,fontSize:16 }}>EventVMS</span>
        </Link>
      </div>

      <div style={{ maxWidth:420, margin:'0 auto' }}>
        {/* Search card */}
        <div style={{ background:'rgba(255,255,255,0.08)', borderRadius:16, padding:28, border:'1px solid rgba(255,255,255,0.15)', backdropFilter:'blur(10px)', marginBottom:20 }}>
          <h1 style={{ color:'#fff', fontSize:20, fontWeight:800, margin:'0 0 6px', textAlign:'center' }}>🎟 تذاكري</h1>
          <p style={{ color:'rgba(255,255,255,0.6)', fontSize:13, textAlign:'center', margin:'0 0 20px' }}>أدخل بريدك أو جوالك للوصول لتذاكرك</p>

          <form onSubmit={search}>
            <div style={{ marginBottom:12 }}>
              <label style={{ color:'rgba(255,255,255,0.7)', fontSize:12, display:'block', marginBottom:4 }}>البريد الإلكتروني</label>
              <input type="email" value={email} onChange={e=>{setEmail(e.target.value);setPhone('')}} style={{ width:'100%', padding:'12px 14px', border:'1px solid rgba(255,255,255,0.2)', borderRadius:8, fontSize:13, outline:'none', fontFamily:'inherit', color:'#fff', background:'rgba(255,255,255,0.1)', boxSizing:'border-box' }} placeholder="email@example.com"/>
            </div>
            <div style={{ textAlign:'center', color:'rgba(255,255,255,0.4)', fontSize:12, margin:'4px 0' }}>أو</div>
            <div style={{ marginBottom:20 }}>
              <label style={{ color:'rgba(255,255,255,0.7)', fontSize:12, display:'block', marginBottom:4 }}>رقم الجوال</label>
              <input type="tel" value={phone} onChange={e=>{setPhone(e.target.value);setEmail('')}} style={{ width:'100%', padding:'12px 14px', border:'1px solid rgba(255,255,255,0.2)', borderRadius:8, fontSize:13, outline:'none', fontFamily:'inherit', color:'#fff', background:'rgba(255,255,255,0.1)', boxSizing:'border-box' }} placeholder="05xxxxxxxx"/>
            </div>
            <button type="submit" disabled={loading||(!email&&!phone)} style={{ width:'100%', padding:'13px', background:C.orange, border:'none', borderRadius:8, color:'#fff', fontWeight:800, fontSize:15, cursor:'pointer', fontFamily:'inherit', opacity:loading||(!email&&!phone)?0.6:1 }}>
              {loading ? 'جاري البحث...' : '🔍 ابحث عن تذاكري'}
            </button>
          </form>
        </div>

        {/* Results */}
        {searched && tickets !== null && (
          <>
            {tickets.length === 0 ? (
              <div style={{ textAlign:'center', padding:32 }}>
                <p style={{ fontSize:40, margin:'0 0 12px' }}>🎭</p>
                <p style={{ color:'rgba(255,255,255,0.7)', fontSize:14 }}>لا توجد تذاكر مرتبطة بهذا البريد/الجوال</p>
              </div>
            ) : (
              <>
                <p style={{ color:'rgba(255,255,255,0.6)', fontSize:13, marginBottom:12 }}>وجدنا {tickets.length} تذكرة</p>
                {tickets.map(t => {
                  const ev = t.events || {}
                  const st = ST[t.status] || ST.registered
                  return (
                    <div key={t.id} style={{ background:C.card, borderRadius:12, overflow:'hidden', marginBottom:12, boxShadow:'0 4px 20px rgba(0,0,0,0.2)' }}>
                      {ev.cover_image && <img src={ev.cover_image} alt="" style={{ width:'100%', height:100, objectFit:'cover' }}/>}
                      <div style={{ padding:16 }}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                          <h3 style={{ fontSize:15, fontWeight:800, color:C.navy, margin:0, flex:1, paddingLeft:8 }}>{ev.title || 'فعالية'}</h3>
                          <span style={{ padding:'3px 8px', borderRadius:20, fontSize:11, fontWeight:700, color:st.color, background:st.bg, flexShrink:0 }}>{st.icon} {st.label}</span>
                        </div>
                        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:12 }}>
                          <div><p style={{ fontSize:10, color:C.muted, margin:0 }}>التاريخ</p><p style={{ fontSize:12, fontWeight:600, color:C.text, margin:'2px 0 0' }}>{ev.start_date?new Date(ev.start_date).toLocaleDateString('ar-SA',{month:'short',day:'numeric',year:'numeric'}):'—'}</p></div>
                          <div><p style={{ fontSize:10, color:C.muted, margin:0 }}>الموقع</p><p style={{ fontSize:12, fontWeight:600, color:C.text, margin:'2px 0 0' }}>{ev.location_type==='online'?'أونلاين':ev.location||'—'}</p></div>
                          <div><p style={{ fontSize:10, color:C.muted, margin:0 }}>الاسم</p><p style={{ fontSize:12, fontWeight:600, color:C.text, margin:'2px 0 0' }}>{t.guest_name}</p></div>
                          <div><p style={{ fontSize:10, color:C.muted, margin:0 }}>التذكرة</p><p style={{ fontSize:12, fontWeight:600, color:C.text, margin:'2px 0 0' }}>{t.ticket_type||'عام'}</p></div>
                        </div>
                        <Link href={`/ticket/${t.id}`} style={{ display:'block', padding:'10px', background:C.orange, borderRadius:8, textDecoration:'none', fontWeight:700, fontSize:13, color:'#fff', textAlign:'center' }}>
                          {st.icon} عرض التذكرة
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
