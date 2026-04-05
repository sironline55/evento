'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const sb = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
const C = { navy:'#1E0A3C', orange:'#F05537', text:'#39364F', muted:'#6F7287', border:'#DBDAE3', bg:'#FAFAFA', card:'#FFFFFF', green:'#3A7D0A' }

export default function StaffDashboard() {
  const router = useRouter()
  const [worker, setWorker]       = useState<any>(null)
  const [assignments, setAssignments] = useState<any[]>([])
  const [ratings, setRatings]     = useState<any[]>([])
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    sb.auth.getUser().then(async ({ data }) => {
      if (!data.user) return
      const { data: w } = await sb.from('worker_profiles').select('*').eq('user_id', data.user.id).single()
      if (!w) return
      setWorker(w)
      const [{ data: asgn }, { data: rat }] = await Promise.all([
        sb.from('event_staff_assignments')
          .select('*, events(title, start_date, end_date, location, cover_image)')
          .eq('worker_profile_id', w.id)
          .order('created_at', { ascending: false })
          .limit(10),
        sb.from('staff_ratings')
          .select('*, events(title)')
          .eq('worker_id', w.id)
          .order('created_at', { ascending: false })
          .limit(5),
      ])
      setAssignments(asgn || [])
      setRatings(rat || [])
      setLoading(false)
    })
  }, [])

  async function handleCheckIn(assignId: string) {
    await sb.from('event_staff_assignments').update({ checked_in_at: new Date().toISOString(), status: 'confirmed' }).eq('id', assignId)
    setAssignments(a => a.map(x => x.id === assignId ? { ...x, checked_in_at: new Date().toISOString(), status: 'confirmed' } : x))
  }

  async function handleSignOut() {
    await sb.auth.signOut()
    router.push('/staff/login')
  }

  if (loading) return <div style={{ padding:40, textAlign:'center', color:C.muted }}>جاري التحميل...</div>
  if (!worker) return null

  const today = assignments.filter(a => {
    if (!a.work_date) return false
    return new Date(a.work_date).toDateString() === new Date().toDateString()
  })
  const upcoming = assignments.filter(a => a.work_date && new Date(a.work_date) > new Date())
  const past = assignments.filter(a => a.status === 'completed')

  return (
    <div style={{ direction:'rtl' }}>
      {/* Hero */}
      <div style={{ background:`linear-gradient(135deg, ${C.navy}, #3D1A78)`, padding:'24px 20px 32px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 }}>
          <div>
            <p style={{ color:'rgba(255,255,255,0.6)', fontSize:12, margin:0 }}>مرحباً بعودتك</p>
            <h1 style={{ color:'#fff', fontSize:22, fontWeight:800, margin:'4px 0' }}>{worker.full_name}</h1>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ background: worker.is_available ? '#EAF7E0' : '#FEF2F2', color: worker.is_available ? C.green : '#DC2626', padding:'2px 10px', borderRadius:20, fontSize:11, fontWeight:700 }}>
                {worker.is_available ? '🟢 متاح' : '🔴 غير متاح'}
              </span>
              {worker.is_verified && <span style={{ background:'#EAF7E0', color:C.green, padding:'2px 10px', borderRadius:20, fontSize:11, fontWeight:700 }}>✓ موثّق</span>}
            </div>
          </div>
          <button onClick={handleSignOut} style={{ background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:8, padding:'7px 14px', color:'rgba(255,255,255,0.7)', fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>
            خروج
          </button>
        </div>

        {/* Stats */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10 }}>
          {[
            { l:'التقييم', v:`${worker.rating_avg||worker.rating||0}★`, c:'#FFD700' },
            { l:'إجمالي أعمال', v:worker.total_jobs||assignments.length, c:'#fff' },
            { l:'ساعات عمل', v:worker.total_hours||0, c:'#fff' },
            { l:'الالتزام', v:`${worker.commitment_pct||worker.commitment_score||100}%`, c:'#4ADE80' },
          ].map(s => (
            <div key={s.l} style={{ background:'rgba(255,255,255,0.08)', borderRadius:8, padding:'10px 8px', textAlign:'center' }}>
              <p style={{ fontSize:18, fontWeight:800, color:s.c, margin:0 }}>{s.v}</p>
              <p style={{ fontSize:10, color:'rgba(255,255,255,0.5)', margin:0 }}>{s.l}</p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding:'16px' }}>
        {/* Quick actions based on role */}
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:16, marginBottom:14 }}>
          <h3 style={{ fontSize:13, fontWeight:700, color:C.navy, margin:'0 0 12px' }}>⚡ إجراءات سريعة</h3>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            {[
              { href:'/staff/scanner', icon:'📷', label:'مسح التذاكر', desc:'افتح الماسح الضوئي', bg:'#FEF0ED', c:C.orange },
              { href:'/staff/checkin', icon:'👋', label:'استقبال الضيوف', desc:'قائمة الحضور', bg:'#EAF7E0', c:C.green },
              { href:'/staff/crowd',   icon:'👥', label:'إدارة الحشود', desc:'مراقبة المناطق', bg:'#EDE9F7', c:'#7B4FBF' },
              { href:'/staff/parking', icon:'🚗', label:'الباركينغ', desc:'إدارة المواقف', bg:'#EDF7FF', c:'#0070B8' },
            ].map(a => (
              <Link key={a.href} href={a.href} style={{ textDecoration:'none' }}>
                <div style={{ background:a.bg, borderRadius:8, padding:'12px', display:'flex', gap:10, alignItems:'center' }}>
                  <span style={{ fontSize:20 }}>{a.icon}</span>
                  <div>
                    <p style={{ fontSize:12, fontWeight:700, color:a.c, margin:0 }}>{a.label}</p>
                    <p style={{ fontSize:10, color:C.muted, margin:0 }}>{a.desc}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Today's assignments */}
        {today.length > 0 && (
          <div style={{ background:C.card, border:`2px solid ${C.orange}`, borderRadius:10, overflow:'hidden', marginBottom:14 }}>
            <div style={{ padding:'12px 16px', background:'#FEF0ED', borderBottom:`1px solid ${C.border}` }}>
              <span style={{ fontWeight:700, color:C.orange, fontSize:13 }}>📅 مهامك اليوم ({today.length})</span>
            </div>
            {today.map((a, i) => (
              <div key={a.id} style={{ padding:'14px 16px', borderBottom: i < today.length-1 ? `1px solid ${C.border}` : 'none' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ fontSize:14, fontWeight:700, color:C.navy, margin:0 }}>{a.events?.title || '—'}</p>
                    <div style={{ display:'flex', gap:8, marginTop:4, flexWrap:'wrap' }}>
                      <span style={{ fontSize:11, color:C.muted }}>🎭 {a.role}</span>
                      {a.zone && <span style={{ fontSize:11, color:C.muted }}>📍 {a.zone}</span>}
                      {a.shift_start && <span style={{ fontSize:11, color:C.muted }}>⏰ {new Date(a.shift_start).toLocaleTimeString('ar-SA', { hour:'2-digit', minute:'2-digit' })}</span>}
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                    {!a.checked_in_at && (
                      <button onClick={() => handleCheckIn(a.id)} style={{ padding:'6px 12px', background:C.green, border:'none', borderRadius:6, color:'#fff', fontWeight:700, fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>
                        تسجيل حضور
                      </button>
                    )}
                    {a.checked_in_at && <span style={{ fontSize:11, background:'#EAF7E0', color:C.green, padding:'4px 10px', borderRadius:20, fontWeight:700 }}>✓ حاضر</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Upcoming */}
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, overflow:'hidden', marginBottom:14 }}>
          <div style={{ padding:'12px 16px', borderBottom:`1px solid ${C.border}` }}>
            <span style={{ fontWeight:700, color:C.navy, fontSize:13 }}>📋 جميع المهام ({assignments.length})</span>
          </div>
          {assignments.length === 0 ? (
            <div style={{ padding:32, textAlign:'center' }}>
              <p style={{ fontSize:32, marginBottom:8 }}>📭</p>
              <p style={{ color:C.muted, fontSize:13 }}>لا توجد مهام مسندة إليك بعد</p>
            </div>
          ) : assignments.map((a, i) => {
            const stMap: any = { pending:{ l:'في الانتظار',c:'#B07000',b:'#FFF8E8' }, confirmed:{ l:'مؤكد',c:C.green,b:'#EAF7E0' }, completed:{ l:'مكتمل',c:'#7B4FBF',b:'#EDE9F7' }, no_show:{ l:'غياب',c:'#DC2626',b:'#FEF2F2' }, assigned:{ l:'مسند',c:'#0070B8',b:'#EDF7FF' } }
            const st = stMap[a.status] || stMap.pending
            return (
              <div key={a.id} style={{ padding:'12px 16px', borderBottom: i < assignments.length-1 ? `1px solid ${C.border}` : 'none', display:'flex', gap:12, alignItems:'center' }}>
                <div style={{ width:40, height:40, background:'#F0EDF7', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>
                  {a.events?.cover_image ? <img src={a.events.cover_image} alt="" style={{ width:40, height:40, borderRadius:8, objectFit:'cover' }}/> : '🎪'}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ fontSize:13, fontWeight:700, color:C.navy, margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{a.events?.title||'—'}</p>
                  <div style={{ display:'flex', gap:8, marginTop:2 }}>
                    <span style={{ fontSize:11, color:C.muted }}>{a.role}</span>
                    {a.zone && <span style={{ fontSize:11, color:C.muted }}>· {a.zone}</span>}
                    {a.work_date && <span style={{ fontSize:11, color:C.muted }}>· {new Date(a.work_date).toLocaleDateString('ar-SA', { month:'short', day:'numeric' })}</span>}
                  </div>
                </div>
                <span style={{ padding:'3px 8px', borderRadius:20, fontSize:10, fontWeight:700, color:st.c, background:st.b, whiteSpace:'nowrap' }}>{st.l}</span>
              </div>
            )
          })}
        </div>

        {/* Recent ratings */}
        {ratings.length > 0 && (
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, overflow:'hidden', marginBottom:14 }}>
            <div style={{ padding:'12px 16px', borderBottom:`1px solid ${C.border}` }}>
              <span style={{ fontWeight:700, color:C.navy, fontSize:13 }}>⭐ آخر التقييمات</span>
            </div>
            {ratings.map((r, i) => (
              <div key={r.id} style={{ padding:'12px 16px', borderBottom: i < ratings.length-1 ? `1px solid ${C.border}` : 'none' }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                  <span style={{ fontSize:12, fontWeight:700, color:C.navy }}>{r.events?.title||'فعالية'}</span>
                  <div style={{ display:'flex', gap:1 }}>
                    {[1,2,3,4,5].map(n => <span key={n} style={{ color: n <= r.rating ? '#FFD700' : '#DBDAE3', fontSize:14 }}>★</span>)}
                  </div>
                </div>
                {r.comment && <p style={{ fontSize:12, color:C.muted, margin:0 }}>{r.comment}</p>}
                <div style={{ display:'flex', gap:10, marginTop:6 }}>
                  {r.punctuality && <span style={{ fontSize:10, color:C.muted }}>الالتزام: {r.punctuality}/5</span>}
                  {r.professionalism && <span style={{ fontSize:10, color:C.muted }}>الاحترافية: {r.professionalism}/5</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        <Link href="/staff/profile" style={{ display:'block', textAlign:'center', padding:'12px', background:C.navy, borderRadius:10, color:'#fff', fontWeight:700, fontSize:13, textDecoration:'none' }}>
          👤 عرض ملفي الكامل ←
        </Link>
      </div>
    </div>
  )
}
