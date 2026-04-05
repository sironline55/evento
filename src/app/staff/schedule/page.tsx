'use client'
import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import Link from 'next/link'

const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
const C = { navy:'#1E0A3C', orange:'#F05537', text:'#39364F', muted:'#6F7287', border:'#DBDAE3', bg:'#FAFAFA', card:'#FFFFFF', green:'#3A7D0A' }

const ROLE_LABELS: Record<string,string> = { scanner:'📷 ماسح', receptionist:'🤝 استقبال', crowd_manager:'👥 حشود', parking:'🚗 مواقف', staff:'⭐ كادر' }

export default function StaffSchedule() {
  const [assignments, setAssignments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    sb.auth.getUser().then(async ({ data }) => {
      if (!data.user) return
      const { data: wp } = await sb.from('worker_profiles').select('id').eq('user_id', data.user.id).single()
      if (!wp) { setLoading(false); return }
      const { data: asgn } = await sb.from('event_staff_assignments')
        .select('*, events(title, start_date, location, cover_image)')
        .eq('worker_profile_id', wp.id)
        .order('work_date', { ascending: true })
      setAssignments(asgn || [])
      setLoading(false)
    })
  }, [])

  const today = new Date().toISOString().split('T')[0]
  const groups = {
    today: assignments.filter(a => a.work_date === today),
    upcoming: assignments.filter(a => a.work_date > today),
    past: assignments.filter(a => a.work_date < today),
  }

  if (loading) return <div style={{padding:40,textAlign:'center',color:C.muted}}>جاري التحميل...</div>

  return (
    <div style={{ minHeight:'100vh', background:C.bg, direction:'rtl', paddingBottom:80 }}>
      <div style={{ background:C.navy, padding:'20px', color:'#fff' }}>
        <h1 style={{ fontSize:20, fontWeight:800, margin:0 }}>📅 جدول عملي</h1>
        <p style={{ color:'rgba(255,255,255,0.6)', fontSize:13, margin:'4px 0 0' }}>{assignments.length} مهمة مجدولة</p>
      </div>
      <div style={{ padding:16 }}>
        {Object.entries(groups).map(([key, asgn]) => asgn.length === 0 ? null : (
          <div key={key} style={{ marginBottom:20 }}>
            <h3 style={{ fontSize:13, fontWeight:700, color:C.muted, margin:'0 0 10px' }}>
              {key==='today'?'🔴 اليوم':key==='upcoming'?'🔜 قادمة':'📁 سابقة'}
            </h3>
            {(asgn as any[]).map(a => (
              <Link key={a.id} href={`/staff/event/${a.event_id}`} style={{ textDecoration:'none', display:'block', marginBottom:10 }}>
                <div style={{ background:C.card, border:`1px solid ${key==='today'?C.orange:C.border}`, borderRadius:10, padding:14, display:'flex', gap:12, alignItems:'center' }}>
                  <div style={{ width:44, height:44, background:key==='today'?'#FEF0ED':'#F0EDF7', borderRadius:8, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <span style={{ fontSize:13, fontWeight:800, color:key==='today'?C.orange:C.navy, lineHeight:1 }}>{a.work_date?new Date(a.work_date).getDate():'?'}</span>
                    <span style={{ fontSize:9, color:key==='today'?C.orange:C.muted }}>{a.work_date?new Date(a.work_date).toLocaleDateString('ar-SA',{month:'short'}):''}</span>
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ fontSize:13, fontWeight:700, color:C.navy, margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{a.events?.title||'فعالية'}</p>
                    <p style={{ fontSize:11, color:C.muted, margin:'2px 0 0' }}>
                      {ROLE_LABELS[a.role]||a.role} {a.zone?`· المنطقة: ${a.zone}`:''} {a.shift_start?`· ${a.shift_start}`:''} 
                    </p>
                  </div>
                  <span style={{ fontSize:11, padding:'3px 8px', borderRadius:10, fontWeight:700, background:a.status==='completed'?'#EAF7E0':a.status==='checked_in'?'#EDE9F7':'#F8F7FA', color:a.status==='completed'?C.green:a.status==='checked_in'?'#7B4FBF':C.muted }}>
                    {a.status==='completed'?'✓':a.status==='checked_in'?'نشط':'مجدول'}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ))}
        {assignments.length === 0 && (
          <div style={{ textAlign:'center', padding:48 }}>
            <p style={{ fontSize:40, margin:'0 0 12px' }}>📅</p>
            <p style={{ color:C.muted, fontSize:13 }}>لا توجد مهام مجدولة بعد</p>
          </div>
        )}
      </div>
    </div>
  )
}
