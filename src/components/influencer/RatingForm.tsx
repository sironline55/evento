'use client'
import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'

const C = { navy:'#1E0A3C', orange:'#F05537', muted:'#6F7287', border:'#DBDAE3' }

interface Props {
  contractId: string
  influencerId: string
  orgId: string
  influencerName: string
  onDone?: () => void
}

export default function RatingForm({ contractId, influencerId, orgId, influencerName, onDone }: Props) {
  const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const [rating,  setRating]  = useState(0)
  const [hover,   setHover]   = useState(0)
  const [text,    setText]    = useState('')
  const [saving,  setSaving]  = useState(false)
  const [done,    setDone]    = useState(false)

  async function submit() {
    if (!rating) return
    setSaving(true)
    const { error } = await sb.from('campaign_reviews').insert({
      contract_id: contractId,
      org_id: orgId,
      influencer_id: influencerId,
      rating,
      review_text: text || null
    })
    // Update influencer avg_rating
    const { data: allReviews } = await sb.from('campaign_reviews')
      .select('rating').eq('influencer_id', influencerId)
    if (allReviews?.length) {
      const avg = allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length
      await sb.from('influencer_profiles').update({
        avg_rating: Math.round(avg * 10) / 10,
        total_campaigns: allReviews.length
      }).eq('user_id', influencerId)
    }
    if (!error) { setDone(true); onDone?.() }
    setSaving(false)
  }

  if (done) return (
    <div style={{ padding:'16px', background:'#EAF7E0', border:'1px solid #9DE07B', borderRadius:12, textAlign:'center' }}>
      <p style={{ color:'#166534', fontWeight:700, fontSize:14, margin:0 }}>✅ تم إرسال التقييم!</p>
    </div>
  )

  return (
    <div style={{ padding:'18px', background:'#fff', border:`1px solid ${C.border}`, borderRadius:14, direction:'rtl', fontFamily:'Tajawal,sans-serif' }}>
      <h3 style={{ fontSize:14, fontWeight:700, color:C.navy, margin:'0 0 12px' }}>
        ⭐ قيّم تجربتك مع {influencerName}
      </h3>

      {/* Stars */}
      <div style={{ display:'flex', gap:6, marginBottom:14, justifyContent:'center' }}>
        {[1,2,3,4,5].map(n => (
          <button key={n} type="button"
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            onClick={() => setRating(n)}
            style={{ background:'none', border:'none', cursor:'pointer', fontSize:32,
              filter: (hover||rating) >= n ? 'none' : 'grayscale(1) opacity(0.3)',
              transform: hover === n ? 'scale(1.2)' : 'scale(1)',
              transition:'all .15s' }}>
            ⭐
          </button>
        ))}
      </div>
      {rating > 0 && (
        <p style={{ textAlign:'center', fontSize:13, color:C.muted, margin:'0 0 12px' }}>
          {['','ضعيف','مقبول','جيد','جيد جداً','ممتاز!'][rating]}
        </p>
      )}

      <textarea
        placeholder="شارك تجربتك مع هذا المؤثر... (اختياري)"
        value={text} onChange={e => setText(e.target.value)}
        rows={3}
        style={{ width:'100%', padding:'10px 12px', border:`1px solid ${C.border}`,
          borderRadius:10, fontSize:13, fontFamily:'inherit', resize:'vertical',
          boxSizing:'border-box', outline:'none', marginBottom:12 }}/>

      <button onClick={submit} disabled={!rating || saving}
        style={{ width:'100%', padding:'11px', background: !rating?C.muted:C.orange,
          color:'#fff', border:'none', borderRadius:10, fontWeight:700, fontSize:14,
          cursor: !rating?'not-allowed':'pointer', fontFamily:'inherit' }}>
        {saving ? 'جاري الحفظ...' : 'إرسال التقييم'}
      </button>
    </div>
  )
}
