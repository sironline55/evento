'use client'
import React, { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import Link from 'next/link'
import { useParams } from 'next/navigation'

const C = { navy:'#1E0A3C', orange:'#F05537', text:'#39364F', muted:'#6F7287', border:'#DBDAE3', bg:'#FAFAFA', card:'#FFFFFF', green:'#3A7D0A' }

function Stars({ rating }: { rating:number }) {
  return <span style={{ color:'#F59E0B' }}>{'★'.repeat(Math.round(rating))}{'☆'.repeat(5-Math.round(rating))}</span>
}

function formatNum(n:number) {
  if (!n) return '0'
  if (n >= 1000000) return `${(n/1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n/1000).toFixed(0)}K`
  return String(n)
}

const PLATFORMS = [
  { key:'tiktok',    icon:'🎵', label:'TikTok',    followKey:'tiktok_followers',    handleKey:'tiktok_handle',    color:'#000' },
  { key:'snap',      icon:'👻', label:'Snapchat',  followKey:'snapchat_followers',  handleKey:'snapchat_handle',  color:'#FFFC00' },
  { key:'instagram', icon:'📷', label:'Instagram', followKey:'instagram_followers', handleKey:'instagram_handle', color:'#E1306C' },
  { key:'youtube',   icon:'▶️', label:'YouTube',   followKey:'youtube_followers',   handleKey:'youtube_handle',   color:'#FF0000' },
]

const SERVICES = [
  { key:'price_reel',  label:'ريلز / TikTok فيديو',  icon:'🎬' },
  { key:'price_story', label:'ستوري (5 قصص)',         icon:'📱' },
  { key:'price_video', label:'فيديو يوتيوب',           icon:'🎥' },
  { key:'price_post',  label:'منشور',                  icon:'📝' },
]

export default function InfluencerProfile() {
  const params = useParams()
  const id = params.id as string
  const sb = React.useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), [])

  const [inf, setInf] = useState<any>(null)
  const [reviews, setReviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedServices, setSelectedServices] = useState<string[]>([])
  const [showProposalModal, setShowProposalModal] = useState(false)

  useEffect(() => {
    async function load() {
      const [{ data: infData }, { data: reviewData }] = await Promise.all([
        sb.from('worker_profiles').select('*').eq('id', id).single(),
        sb.from('campaign_reviews').select('*').eq('reviewee_id', id).order('created_at', { ascending:false }).limit(5)
      ])
      setInf(infData)
      setReviews(reviewData || [])
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) return <div style={{ padding:60, textAlign:'center', color:C.muted, direction:'rtl' }}>⏳ جاري التحميل...</div>
  if (!inf) return <div style={{ padding:60, textAlign:'center', direction:'rtl' }}>المؤثر غير موجود</div>

  const totalFollowers = PLATFORMS.reduce((sum, p) => sum + (inf[p.followKey] || 0), 0)
  const selectedTotal = SERVICES
    .filter(s => selectedServices.includes(s.key))
    .reduce((sum, s) => sum + (inf[s.key] || 0), 0)

  return (
    <div style={{ minHeight:'100vh', background:C.bg, direction:'rtl' }}>
      {/* Back */}
      <div style={{ background:C.card, borderBottom:`1px solid ${C.border}`, padding:'14px 32px' }}>
        <Link href="/influencers" style={{ color:C.orange, textDecoration:'none', fontSize:14, fontWeight:600 }}>
          ← العودة للمؤثرين
        </Link>
      </div>

      <div style={{ maxWidth:1000, margin:'0 auto', padding:'28px 24px', display:'grid', gridTemplateColumns:'1fr 320px', gap:20 }}>
        {/* Main Content */}
        <div>
          {/* Profile header */}
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:24, marginBottom:16 }}>
            <div style={{ display:'flex', gap:18, alignItems:'flex-start' }}>
              <div style={{
                width:80, height:80, borderRadius:16, overflow:'hidden',
                background:'linear-gradient(135deg,#B4A7D6,#7B4FBF)',
                display:'flex', alignItems:'center', justifyContent:'center',
                color:'#fff', fontWeight:900, fontSize:32, flexShrink:0
              }}>
                {inf.profile_image
                  ? <img src={inf.profile_image} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                  : inf.full_name?.[0]
                }
              </div>
              <div style={{ flex:1 }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
                  <h1 style={{ fontSize:24, fontWeight:900, color:C.navy, margin:0 }}>{inf.full_name}</h1>
                  {inf.is_verified_influencer && (
                    <span style={{ background:'#EAF7E0', color:C.green, fontSize:12, fontWeight:700, padding:'3px 10px', borderRadius:20 }}>✅ موثّق</span>
                  )}
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                  <Stars rating={inf.influencer_rating || 0}/>
                  <span style={{ fontSize:13, color:C.muted }}>
                    {inf.influencer_rating ? `${inf.influencer_rating} / 5` : 'لا يوجد تقييم'}
                    {(inf.total_campaigns||0) > 0 && ` · ${inf.total_campaigns} حملة`}
                  </span>
                </div>
                {/* Categories */}
                <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                  {(inf.influencer_categories||[]).map((c:string) => (
                    <span key={c} style={{ background:'#EDE9F7', color:'#5B3FA0', fontSize:12, fontWeight:600, padding:'4px 12px', borderRadius:20 }}>{c}</span>
                  ))}
                </div>
              </div>
              {/* Total followers badge */}
              {totalFollowers > 0 && (
                <div style={{ textAlign:'center', background:'#F8F7FA', borderRadius:12, padding:'14px 20px' }}>
                  <p style={{ fontWeight:900, color:C.navy, fontSize:20, margin:0 }}>{formatNum(totalFollowers)}</p>
                  <p style={{ fontSize:11, color:C.muted, margin:0 }}>إجمالي المتابعين</p>
                </div>
              )}
            </div>
            {inf.influencer_bio && (
              <p style={{ fontSize:14, color:C.text, lineHeight:1.7, margin:'16px 0 0', background:'#F8F7FA', padding:14, borderRadius:10 }}>
                {inf.influencer_bio}
              </p>
            )}
          </div>

          {/* Platform stats */}
          {totalFollowers > 0 && (
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:20, marginBottom:16 }}>
              <h3 style={{ fontSize:15, fontWeight:700, color:C.navy, margin:'0 0 16px' }}>📊 إحصائيات المنصات</h3>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:12 }}>
                {PLATFORMS.filter(p => inf[p.followKey]).map(p => (
                  <div key={p.key} style={{ background:'#F8F7FA', borderRadius:10, padding:'14px 16px', display:'flex', gap:12, alignItems:'center' }}>
                    <div style={{ fontSize:28 }}>{p.icon}</div>
                    <div>
                      <p style={{ fontWeight:800, color:C.navy, margin:'0 0 2px', fontSize:18 }}>{formatNum(inf[p.followKey])}</p>
                      <p style={{ fontSize:12, color:C.muted, margin:0 }}>{p.label} {inf[p.handleKey] ? `· @${inf[p.handleKey]}` : ''}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Portfolio */}
          {(inf.portfolio_links||[]).length > 0 && (
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:20, marginBottom:16 }}>
              <h3 style={{ fontSize:15, fontWeight:700, color:C.navy, margin:'0 0 14px' }}>🎬 أعمال سابقة</h3>
              <div style={{ display:'grid', gap:8 }}>
                {(inf.portfolio_links||[]).map((link:string, i:number) => (
                  <a key={i} href={link} target="_blank" rel="noopener" style={{
                    display:'flex', alignItems:'center', gap:10, padding:'10px 14px',
                    background:'#F8F7FA', borderRadius:8, textDecoration:'none',
                    border:`1px solid ${C.border}`, color:C.text, fontSize:13
                  }}>
                    <span>🔗</span>
                    <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1 }}>{link}</span>
                    <span style={{ color:C.orange, fontSize:12, flexShrink:0 }}>فتح ↗</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Reviews */}
          {reviews.length > 0 && (
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:20 }}>
              <h3 style={{ fontSize:15, fontWeight:700, color:C.navy, margin:'0 0 16px' }}>⭐ تقييمات المنظمين</h3>
              {reviews.map(r => (
                <div key={r.id} style={{ padding:'14px 0', borderBottom:`1px solid ${C.border}` }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                    <Stars rating={r.rating}/>
                    <span style={{ fontSize:11, color:C.muted }}>{new Date(r.created_at).toLocaleDateString('ar-SA')}</span>
                  </div>
                  {r.review_text && <p style={{ fontSize:13, color:C.text, margin:0, lineHeight:1.6 }}>{r.review_text}</p>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar — Booking */}
        <div style={{ position:'sticky', top:20, alignSelf:'flex-start' }}>
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, overflow:'hidden' }}>
            <div style={{ background:C.navy, padding:'16px 20px', color:'#fff' }}>
              <p style={{ fontWeight:800, fontSize:16, margin:0 }}>خدمات المؤثر</p>
              <p style={{ opacity:.7, fontSize:12, margin:'4px 0 0' }}>اختر الخدمات المطلوبة</p>
            </div>
            <div style={{ padding:16 }}>
              {SERVICES.filter(s => inf[s.key]).map(s => (
                <label key={s.key} style={{
                  display:'flex', justifyContent:'space-between', alignItems:'center',
                  padding:'12px 0', borderBottom:`1px solid ${C.border}`, cursor:'pointer'
                }}>
                  <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                    <input
                      type="checkbox"
                      checked={selectedServices.includes(s.key)}
                      onChange={e => setSelectedServices(prev =>
                        e.target.checked ? [...prev, s.key] : prev.filter(k=>k!==s.key)
                      )}
                      style={{ accentColor:C.orange, width:16, height:16 }}
                    />
                    <span style={{ fontSize:13, color:C.text }}>{s.icon} {s.label}</span>
                  </div>
                  <span style={{ fontWeight:700, color:C.navy, fontSize:13 }}>
                    {(inf[s.key]||0).toLocaleString()} ريال
                  </span>
                </label>
              ))}
              {SERVICES.every(s => !inf[s.key]) && (
                <p style={{ color:C.muted, fontSize:13, textAlign:'center', padding:'12px 0' }}>لم يتم تحديد الأسعار بعد</p>
              )}
            </div>
            {selectedServices.length > 0 && (
              <div style={{ padding:'12px 16px', background:'#F8F7FA', borderTop:`1px solid ${C.border}` }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                  <span style={{ fontSize:12, color:C.muted }}>المجموع</span>
                  <span style={{ fontWeight:800, color:C.navy }}>{selectedTotal.toLocaleString()} ريال</span>
                </div>
                <p style={{ fontSize:11, color:C.muted, margin:'0 0 12px' }}>شامل ضريبة القيمة المضافة 15%</p>
              </div>
            )}
            <div style={{ padding:16 }}>
              <Link href={`/influencers/briefs/new?influencer=${id}`} style={{
                display:'block', padding:'13px', background:C.orange, border:'none',
                borderRadius:8, color:'#fff', fontWeight:700, fontSize:14,
                cursor:'pointer', fontFamily:'inherit', textAlign:'center', textDecoration:'none', marginBottom:10
              }}>📢 أضف لحملتك</Link>
              <p style={{ fontSize:11, color:C.muted, textAlign:'center', margin:0 }}>
                💰 المبلغ محفوظ حتى تسليم الخدمة
              </p>
            </div>
          </div>

          {/* Terms card */}
          <div style={{ background:'#FFF8E8', border:'1px solid #F5C842', borderRadius:12, padding:14, marginTop:12 }}>
            <p style={{ fontSize:12, fontWeight:700, color:'#7A5000', margin:'0 0 8px' }}>📋 شروط التعاون</p>
            <ul style={{ fontSize:11, color:'#7A5000', margin:0, paddingRight:16, lineHeight:2 }}>
              <li>الحرية الإبداعية للمؤثر مع الالتزام بهوية الفعالية</li>
              <li>التسليم خلال 7 أيام من تاريخ الفعالية</li>
              <li>المبلغ محتجز في escrow حتى الموافقة</li>
              <li>يتم تقييم الطرفين بعد التسليم</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
