'use client'
import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import Link from 'next/link'

const sb = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
const C = { navy:'#1E0A3C', orange:'#F05537', text:'#39364F', muted:'#6F7287', border:'#DBDAE3', bg:'#FAFAFA', card:'#FFFFFF', green:'#3A7D0A' }

const ROLE_INFO: Record<string,{label:string;icon:string;desc:string;color:string}> = {
  scanner:       { label:'ماسح تذاكر',      icon:'📷', desc:'مسح رموز QR وتسجيل الحضور',      color:'#3A7D0A' },
  receptionist:  { label:'استقبال',          icon:'🤝', desc:'تسجيل الوافدين والرد على الاستفسارات', color:'#7B4FBF' },
  crowd_manager: { label:'إدارة حشود',       icon:'👥', desc:'الإشراف على المنطقة وضبط الحشد',  color:'#B07000' },
  parking:       { label:'مواقف سيارات',    icon:'🚗', desc:'تنظيم دخول وخروج السيارات',       color:'#0070B8' },
  staff:         { label:'كادر عام',         icon:'⭐', desc:'مهام متعددة حسب الحاجة',          color:C.orange },
}

export default function StaffDashboard() {
  const [worker, setWorker] = useState<any>(null)
  const [assignments, setAssignments] = useState<any[]>([])
  const [ratings, setRatings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    sb.auth.getUser().then(async ({ data }) => {
      if (!data.user) return
      const { data: wp } = await sb.from('worker_profiles').select('*').eq('user_id', data.user.id).single()
      if (!wp) { setLoading(false); return }
      setWorker(wp)

      const [{ data: asgn }, { data: rats }] = await Promise.all([
        sb.from('event_staff_assignments')
          .select('*, events(title, start_date, location, cover_image)')
          .eq('worker_profile_id', wp.id)
          .order('work_date', { ascending: false })
          .limit(10),
        sb.from('staff_ratings')
          .select('*')
          .eq('worker_profile_id', wp.id)
          .order('created_at', { ascending: false })
          .limit(5),
      ])
      setAssignments(asgn || [])
      setRatings(rats || [])
      setLoading(false)
    })
  }, [])

  if (loading) return <div style={{ padding:40, textAlign:'center', color:C.muted }}>جاري التحميل...</div>

  const todayStr = new Date().toISOString().split('T')[0]
  const todayAssign = assignments.filter(a => a.work_date === todayStr)
  const upcoming    = assignments.filter(a => a.work_date > todayStr)
  const past        = assignments.filter(a => a.work_date < todayStr)
  const role = worker?.skills?.[0] || 'staff'
  const roleInfo = ROLE_INFO[role] || ROLE_INFO.staff

  return (
    <div style={{ minHeight:'100vh', background:C.bg, direction:'rtl' }}>
      {/* Hero */}
      <div style={{ background:`linear-gradient(135deg, ${C.navy}, #3D1A78)`, padding:'24px 20px 32px', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:-40, left:-40, width:160, height:160, borderRadius:'50%', background:'rgba(255,255,255,0.05)' }}/>
        <div style={{ display:'flex', gap:14, alignItems:'flex-start', position:'relative' }}>
          {/* Avatar */}
          <div style={{ width:60, height:60, borderRadius:'50%', background:C.orange, display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, fontWeight:800, color:'#fff', flexShrink:0, overflow:'hidden', border:'3px solid rgba(255,255,255,0.3)' }}>
            {worker?.profile_photo ? <img src={worker.profile_photo} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/> : (worker?.full_name?.[0] || '?')}
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <h2 style={{ color:'#fff', fontSize:18, fontWeight:800, margin:0 }}>{worker?.full_name || 'الكادر'}</h2>
            <div style={{ display:'flex', gap:6, marginTop:4, flexWrap:'wrap' }}>
              <span style={{ background:C.orange, color:'#fff', fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:10 }}>{roleInfo.icon} {roleInfo.label}</span>
              {worker?.city && <span style={{ background:'rgba(255,255,255,0.15)', color:'rgba(255,255,255,0.8)', fontSize:11, padding:'2px 8px', borderRadius:10 }}>📍 {worker.city}</span>}
            </div>
          </div>
          <Link href="/staff/profile" style={{ color:'rgba(255,255,255,0.6)', fontSize:12, textDecoration:'none', flexShrink:0 }}>تعديل ←</Link>
        </div>

        {/* Stats row */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginTop:20 }}>
          {[
            { l:'مجموع الفعاليات', v: worker?.total_jobs || assignments.length, icon:'🎯' },
            { l:'التقييم',          v: worker?.rating ? `${worker.rating} ⭐` : '—',   icon:'⭐' },
            { l:'الالتزام',         v: worker?.commitment_pct ? `${worker.commitment_pct}%` : '—', icon:'✅' },
          ].map(s => (
            <div key={s.l} style={{ background:'rgba(255,255,255,0.1)', borderRadius:10, padding:'10px 12px', textAlign:'center' }}>
              <p style={{ fontSize:18, fontWeight:800, color:'#fff', margin:0 }}>{s.v}</p>
              <p style={{ fontSize:10, color:'rgba(255,255,255,0.6)', margin:0 }}>{s.l}</p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding:'16px' }}>
        {/* Today's assignment */}
        {todayAssign.length > 0 && (
          <div style={{ marginBottom:16 }}>
            <h3 style={{ fontSize:14, fontWeight:700, color:C.navy, margin:'0 0 10px' }}>🔴 مهامك اليوم</h3>
            {todayAssign.map(a => (
              <Link key={a.id} href={`/staff/event/${a.event_id}`} style={{ textDecoration:'none', display:'block' }}>
                <div style={{ background:C.orange, borderRadius:10, padding:16, color:'#fff', marginBottom:8 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                    <div>
                      <p style={{ fontSize:15, fontWeight:800, margin:0 }}>{a.events?.title || 'فعالية'}</p>
                      <p style={{ fontSize:12, opacity:0.85, margin:'4px 0 0' }}>📍 {a.events?.location || '—'} {a.zone ? `· المنطقة: ${a.zone}` : ''}</p>
                      <p style={{ fontSize:12, opacity:0.85, margin:'2px 0 0' }}>
                        🎯 {(ROLE_INFO[a.role] || ROLE_INFO.staff).label}
                        {a.shift_start ? ` · ${a.shift_start} - ${a.shift_end}` : ''}
                      </p>
                    </div>
                    <span style={{ background:'rgba(255,255,255,0.25)', padding:'4px 10px', borderRadius:20, fontSize:11, fontWeight:700 }}>
                      {a.status === 'checked_in' ? '✓ حاضر' : 'ابدأ الآن'}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {todayAssign.length === 0 && (
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:20, marginBottom:16, textAlign:'center' }}>
            <p style={{ fontSize:28, margin:'0 0 8px' }}>☀️</p>
            <p style={{ fontSize:14, fontWeight:700, color:C.navy, margin:0 }}>لا مهام اليوم</p>
            <p style={{ fontSize:12, color:C.muted, margin:'4px 0 0' }}>راجع جدول عملك للمهام القادمة</p>
          </div>
        )}

        {/* Role-specific quick action */}
        <Link href="/staff/scanner" style={{ textDecoration:'none' }}>
          <div style={{ background:C.card, border:`2px solid ${C.orange}`, borderRadius:10, padding:16, marginBottom:16, display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:48, height:48, background:'#FEF0ED', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, flexShrink:0 }}>
              {roleInfo.icon}
            </div>
            <div>
              <p style={{ fontSize:14, fontWeight:700, color:C.navy, margin:0 }}>الوصول السريع — {roleInfo.label}</p>
              <p style={{ fontSize:12, color:C.muted, margin:'2px 0 0' }}>{roleInfo.desc}</p>
            </div>
            <span style={{ marginRight:'auto', fontSize:16, color:C.orange }}>←</span>
          </div>
        </Link>

        {/* Upcoming */}
        {upcoming.length > 0 && (
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, overflow:'hidden', marginBottom:16 }}>
            <div style={{ padding:'12px 16px', borderBottom:`1px solid ${C.border}` }}>
              <span style={{ fontWeight:700, color:C.navy, fontSize:14 }}>🔜 مهام قادمة ({upcoming.length})</span>
            </div>
            {upcoming.slice(0,4).map((a, i) => (
              <Link key={a.id} href={`/staff/event/${a.event_id}`} style={{ textDecoration:'none' }}>
                <div style={{ padding:'12px 16px', borderBottom: i < Math.min(upcoming.length,4)-1 ? `1px solid ${C.border}` : 'none', display:'flex', gap:12, alignItems:'center' }}>
                  <div style={{ width:40, height:40, background:'#FEF0ED', borderRadius:8, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <span style={{ fontSize:12, fontWeight:800, color:C.orange, lineHeight:1 }}>{a.work_date ? new Date(a.work_date).getDate() : '?'}</span>
                    <span style={{ fontSize:9, color:C.orange }}>{a.work_date ? new Date(a.work_date).toLocaleDateString('ar-SA',{month:'short'}) : ''}</span>
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ fontSize:13, fontWeight:700, color:C.navy, margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{a.events?.title || 'فعالية'}</p>
                    <p style={{ fontSize:11, color:C.muted, margin:'2px 0 0' }}>{(ROLE_INFO[a.role]||ROLE_INFO.staff).icon} {(ROLE_INFO[a.role]||ROLE_INFO.staff).label} {a.zone?`· ${a.zone}`:''}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Latest ratings */}
        {ratings.length > 0 && (
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, overflow:'hidden' }}>
            <div style={{ padding:'12px 16px', borderBottom:`1px solid ${C.border}` }}>
              <span style={{ fontWeight:700, color:C.navy, fontSize:14 }}>⭐ آخر التقييمات</span>
            </div>
            {ratings.map((r, i) => (
              <div key={r.id} style={{ padding:'12px 16px', borderBottom: i < ratings.length-1 ? `1px solid ${C.border}` : 'none' }}>
                <div style={{ display:'flex', gap:4, marginBottom:4 }}>
                  {[1,2,3,4,5].map(n => <span key={n} style={{ color: n <= r.rating ? '#FFD700' : '#E5E7EB', fontSize:14 }}>★</span>)}
                </div>
                {r.comment && <p style={{ fontSize:12, color:C.text, margin:0 }}>{r.comment}</p>}
                <p style={{ fontSize:10, color:C.muted, margin:'4px 0 0' }}>{new Date(r.created_at).toLocaleDateString('ar-SA')}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
