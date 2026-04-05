'use client'
import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import Link from 'next/link'

const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
const C = { navy:'#1E0A3C', orange:'#F05537', muted:'#6F7287', border:'#DBDAE3', bg:'#FAFAFA', card:'#FFFFFF' }

export default function StaffScannerRedirect() {
  const [todayEvents, setTodayEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    sb.auth.getUser().then(async ({ data }) => {
      if (!data.user) return
      const { data: wp } = await sb.from('worker_profiles').select('id').eq('user_id', data.user.id).single()
      if (!wp) { setLoading(false); return }
      const today = new Date().toISOString().split('T')[0]
      const { data: asgn } = await sb.from('event_staff_assignments')
        .select('*, events(title, start_date, location)')
        .eq('worker_profile_id', wp.id)
        .gte('work_date', today)
        .order('work_date', { ascending: true })
        .limit(5)
      setTodayEvents(asgn || [])
      setLoading(false)
    })
  }, [])

  return (
    <div style={{ minHeight:'100vh', background:C.bg, direction:'rtl', padding:20, paddingBottom:80 }}>
      <div style={{ background:C.navy, borderRadius:12, padding:20, color:'#fff', marginBottom:20 }}>
        <h2 style={{ fontSize:18, fontWeight:800, margin:'0 0 4px' }}>📷 ماسح التذاكر</h2>
        <p style={{ color:'rgba(255,255,255,0.6)', fontSize:13, margin:0 }}>اختر الفعالية للبدء بالمسح</p>
      </div>
      {loading ? <div style={{ textAlign:'center', color:C.muted, padding:32 }}>جاري التحميل...</div> :
       todayEvents.length === 0 ? (
        <div style={{ textAlign:'center', padding:48 }}>
          <p style={{ fontSize:40, margin:'0 0 12px' }}>📷</p>
          <p style={{ color:C.muted, fontSize:13 }}>لا توجد فعاليات مخصصة لك اليوم</p>
          <Link href="/staff/schedule" style={{ color:C.orange, textDecoration:'none', fontSize:13, fontWeight:600 }}>← عرض جدول عملي</Link>
        </div>
      ) : todayEvents.map(a => (
        <Link key={a.id} href={`/staff/event/${a.event_id}`} style={{ textDecoration:'none', display:'block', marginBottom:10 }}>
          <div style={{ background:C.card, border:`2px solid ${C.orange}`, borderRadius:10, padding:16, display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:44, height:44, background:'#FEF0ED', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22 }}>📷</div>
            <div style={{ flex:1 }}>
              <p style={{ fontSize:14, fontWeight:700, color:C.navy, margin:0 }}>{a.events?.title}</p>
              <p style={{ fontSize:12, color:C.muted, margin:'2px 0 0' }}>{a.events?.location||''} {a.zone?`· ${a.zone}`:''}</p>
            </div>
            <span style={{ fontSize:16, color:C.orange }}>←</span>
          </div>
        </Link>
      ))}
    </div>
  )
}
