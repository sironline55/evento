'use client'
import MobilePageHeader from '@/components/layout/MobilePageHeader'
import { useEffect, useState, useMemo } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line
} from 'recharts'
export const dynamic = 'force-dynamic'

const C = { navy:'#1E0A3C', orange:'#F05537', muted:'#6F7287', border:'#DBDAE3', card:'#FFFFFF' }
const COLORS = ['#F05537','#1E0A3C','#3D1A78','#7B4FBF','#BBBBBB']

export default function AnalyticsPage() {
  const sb = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), [])

  const [loading, setLoading]   = useState(true)
  const [orgId,   setOrgId]     = useState<string|null>(null)
  const [events,  setEvents]    = useState<any[]>([])
  const [regs,    setRegs]      = useState<any[]>([])

  useEffect(() => {
    async function load() {
      const { data:{ user } } = await sb.auth.getUser()
      if (!user) return
      const { data: org } = await sb.from('organizations').select('id').eq('owner_id', user.id).single()
      if (!org) return
      setOrgId(org.id)
      const [{ data: evs }, { data: rs }] = await Promise.all([
        sb.from('events').select('id,title,start_date,capacity,price_from,status,category_icon').eq('org_id', org.id).order('start_date', { ascending:false }),
        sb.from('registrations').select('id,event_id,status,created_at').in('event_id',
          (await sb.from('events').select('id').eq('org_id', org.id)).data?.map((e:any)=>e.id) || []
        )
      ])
      setEvents(evs || [])
      setRegs(rs || [])
      setLoading(false)
    }
    load()
  }, [])

  // ── Derived stats ──
  const totalRegs      = regs.filter(r => r.status !== 'cancelled').length
  const totalAttended  = regs.filter(r => r.status === 'attended').length
  const totalCancelled = regs.filter(r => r.status === 'cancelled').length
  const attendanceRate = totalRegs > 0 ? Math.round(totalAttended/totalRegs*100) : 0
  const totalRevenue   = events.reduce((sum, e) => {
    const paid = regs.filter(r => r.event_id === e.id && r.status !== 'cancelled').length
    return sum + paid * Number(e.price_from || 0)
  }, 0)

  // Per-event bar chart data
  const eventChartData = events.slice(0, 8).map(e => {
    const evRegs = regs.filter(r => r.event_id === e.id)
    const registered = evRegs.filter(r => r.status !== 'cancelled').length
    const attended   = evRegs.filter(r => r.status === 'attended').length
    return {
      name: e.title.length > 10 ? e.title.slice(0,10)+'…' : e.title,
      fullName: e.title,
      مسجل: registered,
      حضر: attended,
    }
  }).reverse()

  // Registration status pie
  const pieData = [
    { name:'مسجل',    value: regs.filter(r=>r.status==='registered').length },
    { name:'حضر',     value: regs.filter(r=>r.status==='attended').length },
    { name:'ملغي',    value: regs.filter(r=>r.status==='cancelled').length },
    { name:'غائب',    value: regs.filter(r=>r.status==='no_show').length },
  ].filter(d => d.value > 0)

  // Registrations over time (by month)
  const byMonth: Record<string, number> = {}
  regs.forEach(r => {
    const m = new Date(r.created_at).toLocaleDateString('ar-SA', { month:'short', year:'2-digit' })
    byMonth[m] = (byMonth[m] || 0) + 1
  })
  const timeData = Object.entries(byMonth).map(([month, count]) => ({ month, تسجيلات: count })).slice(-6)

  // Revenue per event
  const revenueData = events
    .map(e => {
      const paid = regs.filter(r => r.event_id === e.id && r.status !== 'cancelled').length
      const revenue = paid * Number(e.price_from || 0)
      return { name: e.title.length > 12 ? e.title.slice(0,12)+'…' : e.title, إيراد: revenue }
    })
    .filter(d => d.إيراد > 0)
    .sort((a,b) => b.إيراد - a.إيراد)
    .slice(0, 6)

  const StatCard = ({ label, val, sub, color = C.navy }: any) => (
    <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:'18px 20px' }}>
      <p style={{ fontSize:11, color:C.muted, margin:'0 0 6px', fontWeight:600, textTransform:'uppercase' }}>{label}</p>
      <p style={{ fontSize:28, fontWeight:900, color, margin:0 }}>{val}</p>
      {sub && <p style={{ fontSize:12, color:C.muted, margin:'4px 0 0' }}>{sub}</p>}
    </div>
  )

  if (loading) return <div style={{ padding:48, textAlign:'center', color:C.muted, fontFamily:'Tajawal,sans-serif' }}>جاري تحميل الإحصاءات...</div>

  return (
    <div style={{ direction:'rtl', fontFamily:'Tajawal,sans-serif', padding:'24px 20px', maxWidth:960, margin:'0 auto' }}>

      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontSize:22, fontWeight:800, color:C.navy, margin:0 }}>الإحصاءات والتقارير</h1>
        <p style={{ fontSize:13, color:C.muted, margin:'4px 0 0' }}>{events.length} فعالية · {totalRegs} تسجيل</p>
      </div>

      <MobilePageHeader title="التقارير" subtitle="إحصاءات الفعاليات"/>
      {/* KPI cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:12, marginBottom:24 }}>
        <StatCard label="إجمالي الفعاليات"  val={events.length}  sub={`${events.filter(e=>e.status==='published').length} نشطة`} />
        <StatCard label="إجمالي التسجيلات" val={totalRegs}       sub={`${totalCancelled} ملغي`} color={C.orange} />
        <StatCard label="معدل الحضور"       val={`${attendanceRate}%`} sub={`${totalAttended} شخص حضر فعلاً`} color={attendanceRate>60?'#166534':'#854F0B'} />
        <StatCard label="إجمالي الإيرادات" val={totalRevenue>0?`${totalRevenue.toLocaleString('ar-SA')} ﷼`:'—'} sub="من التذاكر المدفوعة" color="#185FA5" />
      </div>

      {/* Charts row 1 */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr', gap:16, marginBottom:16 }}>

        {/* Bar chart - registrations per event */}
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:'20px' }}>
          <h2 style={{ fontSize:14, fontWeight:700, color:C.navy, margin:'0 0 16px' }}>التسجيلات لكل فعالية</h2>
          {eventChartData.length === 0 ? (
            <div style={{ height:200, display:'flex', alignItems:'center', justifyContent:'center', color:C.muted, fontSize:13 }}>لا بيانات</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={eventChartData} margin={{ top:0, right:0, bottom:0, left:-20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                <XAxis dataKey="name" tick={{ fontSize:11, fill:C.muted }} />
                <YAxis tick={{ fontSize:11, fill:C.muted }} allowDecimals={false} />
                <Tooltip
                  formatter={(val, name) => [val, name]}
                  labelFormatter={(label, payload) => payload?.[0]?.payload?.fullName || label}
                  contentStyle={{ fontFamily:'Tajawal,sans-serif', fontSize:12, direction:'rtl' }}
                />
                <Bar dataKey="مسجل" fill={C.navy}   radius={[4,4,0,0]} />
                <Bar dataKey="حضر"  fill={C.orange} radius={[4,4,0,0]} />
                <Legend wrapperStyle={{ fontSize:12, fontFamily:'Tajawal,sans-serif' }} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Pie chart - status distribution */}
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:'20px' }}>
          <h2 style={{ fontSize:14, fontWeight:700, color:C.navy, margin:'0 0 16px' }}>توزيع الحضور</h2>
          {pieData.length === 0 ? (
            <div style={{ height:200, display:'flex', alignItems:'center', justifyContent:'center', color:C.muted, fontSize:13 }}>لا بيانات</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="45%" outerRadius={70} dataKey="value" label={({ name, percent }) => `${name} ${Math.round(percent*100)}%`} labelLine={false} fontSize={11}>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ fontFamily:'Tajawal,sans-serif', fontSize:12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Charts row 2 */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr', gap:16, marginBottom:16 }}>

        {/* Line chart - registrations over time */}
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:'20px' }}>
          <h2 style={{ fontSize:14, fontWeight:700, color:C.navy, margin:'0 0 16px' }}>التسجيلات عبر الزمن</h2>
          {timeData.length < 2 ? (
            <div style={{ height:160, display:'flex', alignItems:'center', justifyContent:'center', color:C.muted, fontSize:13 }}>تحتاج بيانات أكثر</div>
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={timeData} margin={{ top:0, right:0, bottom:0, left:-20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                <XAxis dataKey="month" tick={{ fontSize:11, fill:C.muted }} />
                <YAxis tick={{ fontSize:11, fill:C.muted }} allowDecimals={false} />
                <Tooltip contentStyle={{ fontFamily:'Tajawal,sans-serif', fontSize:12 }} />
                <Line type="monotone" dataKey="تسجيلات" stroke={C.orange} strokeWidth={2.5} dot={{ r:4, fill:C.orange }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Revenue bar */}
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:'20px' }}>
          <h2 style={{ fontSize:14, fontWeight:700, color:C.navy, margin:'0 0 16px' }}>الإيرادات لكل فعالية (ريال)</h2>
          {revenueData.length === 0 ? (
            <div style={{ height:160, display:'flex', alignItems:'center', justifyContent:'center', color:C.muted, fontSize:13 }}>لا فعاليات مدفوعة</div>
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={revenueData} layout="vertical" margin={{ top:0, right:10, bottom:0, left:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                <XAxis type="number" tick={{ fontSize:10, fill:C.muted }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize:10, fill:C.muted }} width={80} />
                <Tooltip formatter={(v:any) => [`${Number(v).toLocaleString('ar-SA')} ﷼`, 'الإيراد']} contentStyle={{ fontFamily:'Tajawal,sans-serif', fontSize:12 }} />
                <Bar dataKey="إيراد" fill="#185FA5" radius={[0,4,4,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Events table */}
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, overflow:'hidden' }}>
        <div style={{ padding:'16px 20px', borderBottom:`1px solid ${C.border}` }}>
          <h2 style={{ fontSize:14, fontWeight:700, color:C.navy, margin:0 }}>تفاصيل الفعاليات</h2>
        </div>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
            <thead>
              <tr style={{ background:'#F8F7FA' }}>
                {['الفعالية','التاريخ','الطاقة','المسجلون','الحضور','معدل الحضور','الإيراد'].map(h => (
                  <th key={h} style={{ padding:'10px 14px', textAlign:'right', color:C.muted, fontWeight:600, fontSize:11, whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {events.map((e, i) => {
                const evRegs   = regs.filter(r => r.event_id === e.id && r.status !== 'cancelled')
                const attended = regs.filter(r => r.event_id === e.id && r.status === 'attended').length
                const rate     = evRegs.length > 0 ? Math.round(attended/evRegs.length*100) : 0
                const revenue  = evRegs.length * Number(e.price_from || 0)
                return (
                  <tr key={e.id} style={{ borderTop:`1px solid ${C.border}`, background: i%2===0?'#fff':'#FAFAFA' }}>
                    <td style={{ padding:'12px 14px', fontWeight:600, color:C.navy, maxWidth:200 }}>
                      <span style={{ marginLeft:6 }}>{e.category_icon}</span>
                      {e.title.length > 18 ? e.title.slice(0,18)+'…' : e.title}
                    </td>
                    <td style={{ padding:'12px 14px', color:C.muted, whiteSpace:'nowrap' }}>
                      {new Date(e.start_date).toLocaleDateString('ar-SA',{month:'short',day:'numeric',year:'2-digit'})}
                    </td>
                    <td style={{ padding:'12px 14px', color:C.muted }}>{e.capacity || '—'}</td>
                    <td style={{ padding:'12px 14px', fontWeight:700, color:C.navy }}>{evRegs.length}</td>
                    <td style={{ padding:'12px 14px', fontWeight:700, color:C.orange }}>{attended}</td>
                    <td style={{ padding:'12px 14px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <div style={{ flex:1, height:5, background:'#EDE9F7', borderRadius:4, overflow:'hidden', minWidth:40 }}>
                          <div style={{ height:'100%', width:`${rate}%`, background:rate>60?'#166534':rate>30?C.orange:'#DC2626', borderRadius:4 }}/>
                        </div>
                        <span style={{ fontSize:11, color:C.muted, minWidth:30 }}>{rate}%</span>
                      </div>
                    </td>
                    <td style={{ padding:'12px 14px', fontWeight:700, color:'#185FA5' }}>
                      {revenue > 0 ? `${revenue.toLocaleString('ar-SA')} ﷼` : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
