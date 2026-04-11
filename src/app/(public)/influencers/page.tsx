'use client'
export const dynamic = 'force-dynamic'
import React, { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import Link from 'next/link'

const C = { navy:'#1E0A3C', orange:'#F05537', text:'#39364F', muted:'#6F7287', border:'#DBDAE3', bg:'#FAFAFA', card:'#FFFFFF', green:'#3A7D0A' }

const CATEGORIES = ['الكل','فعاليات','ترفيه','رياضة','مؤتمرات','سفر وسياحة','طعام','تقنية','أزياء']
const CONTENT_TYPES = ['ريلز','ستوري','فيديو يوتيوب','منشور']

type Influencer = {
  id: string; user_id: string; full_name: string; profile_image: string|null
  influencer_bio: string|null; influencer_categories: string[]|null
  tiktok_followers: number; instagram_followers: number
  snapchat_followers: number; youtube_followers: number
  tiktok_handle: string|null; instagram_handle: string|null
  snapchat_handle: string|null; youtube_handle: string|null
  is_verified_influencer: boolean; influencer_rating: number
  total_campaigns: number; price_reel: number|null; price_story: number|null
  price_video: number|null; price_post: number|null
}

function PlatformBadge({ count, icon, label }: { count: number; icon: string; label: string }) {
  if (!count) return null
  return (
    <span style={{ fontSize:11, color:C.muted, display:'flex', alignItems:'center', gap:3 }}>
      <span>{icon}</span>
      <span style={{ fontWeight:600, color:C.text }}>
        {count >= 1000000 ? `${(count/1000000).toFixed(1)}M` : count >= 1000 ? `${(count/1000).toFixed(0)}K` : count}
      </span>
    </span>
  )
}

function Stars({ rating }: { rating: number }) {
  return (
    <span style={{ color:'#F59E0B', fontSize:12 }}>
      {'★'.repeat(Math.round(rating))}{'☆'.repeat(5 - Math.round(rating))}
    </span>
  )
}

export default function InfluencersPage() {
  const sb = React.useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), [])

  const [influencers, setInfluencers] = useState<Influencer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [cat, setCat] = useState('الكل')
  const [sort, setSort] = useState('rating') // rating|campaigns|newest

  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data } = await sb.from('worker_profiles')
        .select('*')
        .eq('profile_type', 'influencer')
        .eq('is_available', true)
        .order('influencer_rating', { ascending: false })
      setInfluencers(data || [])
      setLoading(false)
    }
    load()
  }, [])

  const filtered = influencers.filter(inf => {
    const matchSearch = !search || inf.full_name.toLowerCase().includes(search.toLowerCase()) ||
      (inf.influencer_bio || '').includes(search)
    const matchCat = cat === 'الكل' || (inf.influencer_categories || []).includes(cat)
    return matchSearch && matchCat
  }).sort((a, b) => {
    if (sort === 'rating') return (b.influencer_rating || 0) - (a.influencer_rating || 0)
    if (sort === 'campaigns') return (b.total_campaigns || 0) - (a.total_campaigns || 0)
    return 0
  })

  const totalFollowers = (inf: Influencer) =>
    (inf.tiktok_followers||0) + (inf.instagram_followers||0) + (inf.snapchat_followers||0) + (inf.youtube_followers||0)

  return (
    <div style={{ minHeight:'100vh', background:C.bg, direction:'rtl' }}>
      {/* Header */}
      <div style={{ background:`linear-gradient(135deg, ${C.navy} 0%, #3D1A78 100%)`, padding:'40px 32px 32px', color:'#fff' }}>
        <div style={{ maxWidth:1100, margin:'0 auto' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24 }}>
            <div>
              <h1 style={{ fontSize:32, fontWeight:900, margin:'0 0 8px' }}>✨ سوق المؤثرين</h1>
              <p style={{ opacity:.8, fontSize:15, margin:0 }}>
                اختر مؤثرين متخصصين في الفعاليات لتسويق فعاليتك بفعالية
              </p>
            </div>
            <Link href="/influencers/briefs/new" style={{
              background:C.orange, color:'#fff', padding:'12px 24px', borderRadius:10,
              textDecoration:'none', fontWeight:700, fontSize:14, display:'flex', alignItems:'center', gap:6
            }}>📢 انشر طلبك</Link>
          </div>
          {/* Stats row */}
          <div style={{ display:'flex', gap:24 }}>
            {[
              ['🎭', influencers.length, 'مؤثر متاح'],
              ['📊', influencers.filter(i=>i.is_verified_influencer).length, 'موثّق'],
              ['🔥', influencers.filter(i=>(i.total_campaigns||0)>0).length, 'عمل بالفعاليات'],
            ].map(([icon,val,label]) => (
              <div key={label as string} style={{ background:'rgba(255,255,255,.1)', borderRadius:10, padding:'10px 18px' }}>
                <span style={{ fontSize:18 }}>{icon}</span>
                <span style={{ fontSize:22, fontWeight:800, marginRight:6 }}>{val}</span>
                <span style={{ opacity:.7, fontSize:12 }}>{label as string}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth:1100, margin:'0 auto', padding:'24px 32px' }}>
        {/* Filters */}
        <div style={{ display:'flex', gap:12, marginBottom:20, flexWrap:'wrap', alignItems:'center' }}>
          <input
            value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="🔍 ابحث باسم المؤثر..."
            style={{ padding:'10px 16px', border:`1px solid ${C.border}`, borderRadius:8, fontSize:14, outline:'none', fontFamily:'inherit', width:260 }}
          />
          <select value={sort} onChange={e=>setSort(e.target.value)}
            style={{ padding:'10px 14px', border:`1px solid ${C.border}`, borderRadius:8, fontSize:13, fontFamily:'inherit', cursor:'pointer' }}>
            <option value="rating">الأعلى تقييماً</option>
            <option value="campaigns">الأكثر حملات</option>
          </select>
          <span style={{ fontSize:12, color:C.muted, marginRight:'auto' }}>{filtered.length} مؤثر</span>
        </div>

        {/* Category tabs */}
        <div style={{ display:'flex', gap:8, marginBottom:24, flexWrap:'wrap' }}>
          {CATEGORIES.map(c => (
            <button key={c} onClick={()=>setCat(c)} style={{
              padding:'7px 16px', borderRadius:20, border:`1px solid ${cat===c?C.orange:C.border}`,
              background:cat===c?C.orange:'#fff', color:cat===c?'#fff':C.text,
              fontWeight:cat===c?700:400, fontSize:13, cursor:'pointer', fontFamily:'inherit', transition:'all .2s'
            }}>{c}</button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign:'center', padding:60, color:C.muted }}>⏳ جاري تحميل المؤثرين...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign:'center', padding:60 }}>
            <div style={{ fontSize:48, marginBottom:12 }}>🎭</div>
            <p style={{ color:C.muted, fontSize:15 }}>لا يوجد مؤثرون بعد — كن أول من يسجل!</p>
            <Link href="/influencers/register" style={{
              display:'inline-block', marginTop:12, padding:'10px 24px',
              background:C.orange, color:'#fff', borderRadius:8, textDecoration:'none', fontWeight:700
            }}>سجل كمؤثر</Link>
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(320px, 1fr))', gap:16 }}>
            {filtered.map(inf => (
              <Link key={inf.id} href={`/influencers/${inf.id}`} style={{ textDecoration:'none' }}>
                <div style={{
                  background:C.card, border:`1px solid ${C.border}`, borderRadius:14,
                  overflow:'hidden', transition:'all .2s', cursor:'pointer'
                }}
                  onMouseEnter={e=>(e.currentTarget.style.borderColor=C.orange, e.currentTarget.style.boxShadow='0 4px 20px rgba(240,85,55,.15)')}
                  onMouseLeave={e=>(e.currentTarget.style.borderColor=C.border, e.currentTarget.style.boxShadow='none')}
                >
                  {/* Card header */}
                  <div style={{ padding:'18px 18px 14px', display:'flex', gap:14, alignItems:'flex-start' }}>
                    <div style={{
                      width:56, height:56, borderRadius:14, flexShrink:0, overflow:'hidden',
                      background:'linear-gradient(135deg,#B4A7D6,#7B4FBF)',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      color:'#fff', fontWeight:800, fontSize:22
                    }}>
                      {inf.profile_image
                        ? <img src={inf.profile_image} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                        : inf.full_name[0]
                      }
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:2 }}>
                        <span style={{ fontWeight:800, color:C.navy, fontSize:14 }}>{inf.full_name}</span>
                        {inf.is_verified_influencer && <span style={{ fontSize:14 }}>✅</span>}
                      </div>
                      <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
                        <Stars rating={inf.influencer_rating || 0}/>
                        {(inf.total_campaigns||0) > 0 && (
                          <span style={{ fontSize:11, color:C.muted }}>({inf.total_campaigns} حملة)</span>
                        )}
                      </div>
                      {/* Platform followers */}
                      <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                        <PlatformBadge count={inf.tiktok_followers} icon="🎵" label="TikTok"/>
                        <PlatformBadge count={inf.snapchat_followers} icon="👻" label="Snap"/>
                        <PlatformBadge count={inf.instagram_followers} icon="📷" label="Instagram"/>
                        <PlatformBadge count={inf.youtube_followers} icon="▶️" label="YouTube"/>
                        {totalFollowers(inf) === 0 && <span style={{ fontSize:11, color:C.muted }}>لم يتم تحديد الحسابات</span>}
                      </div>
                    </div>
                  </div>
                  {/* Bio */}
                  {inf.influencer_bio && (
                    <p style={{ fontSize:12, color:C.muted, margin:'0 18px 12px', lineHeight:1.6,
                      overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>
                      {inf.influencer_bio}
                    </p>
                  )}
                  {/* Categories */}
                  {(inf.influencer_categories||[]).length > 0 && (
                    <div style={{ padding:'0 18px 12px', display:'flex', gap:6, flexWrap:'wrap' }}>
                      {(inf.influencer_categories||[]).slice(0,3).map(c=>(
                        <span key={c} style={{ fontSize:11, background:'#F8F7FA', border:`1px solid ${C.border}`,
                          borderRadius:20, padding:'3px 10px', color:C.text }}>{c}</span>
                      ))}
                    </div>
                  )}
                  {/* Prices footer */}
                  <div style={{ background:'#F8F7FA', padding:'12px 18px', borderTop:`1px solid ${C.border}`,
                    display:'flex', gap:12, justifyContent:'space-between', alignItems:'center' }}>
                    <div style={{ display:'flex', gap:12 }}>
                      {inf.price_reel && <span style={{ fontSize:12, color:C.text }}><span style={{ fontWeight:700 }}>{inf.price_reel.toLocaleString()}</span> <span style={{ color:C.muted }}>ريلز</span></span>}
                      {inf.price_story && <span style={{ fontSize:12, color:C.text }}><span style={{ fontWeight:700 }}>{inf.price_story.toLocaleString()}</span> <span style={{ color:C.muted }}>ستوري</span></span>}
                    </div>
                    <span style={{ fontSize:12, color:C.orange, fontWeight:700 }}>عرض التفاصيل ←</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Register CTA */}
        <div style={{ marginTop:32, background:`linear-gradient(135deg,${C.navy},#3D1A78)`,
          borderRadius:16, padding:'28px 32px', color:'#fff', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <h3 style={{ fontSize:20, fontWeight:800, margin:'0 0 6px' }}>أنت مؤثر في مجال الفعاليات؟</h3>
            <p style={{ opacity:.8, fontSize:14, margin:0 }}>سجّل ملفك واحصل على حملات مباشرة من المنظمين</p>
          </div>
          <Link href="/influencers/register" style={{
            background:C.orange, color:'#fff', padding:'12px 24px', borderRadius:10,
            textDecoration:'none', fontWeight:700, fontSize:14, flexShrink:0
          }}>سجّل كمؤثر 🎭</Link>
        </div>
      </div>
    </div>
  )
}
