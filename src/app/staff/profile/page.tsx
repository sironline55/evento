'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'

const sb = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
const C = { navy:'#1E0A3C', orange:'#F05537', text:'#39364F', muted:'#6F7287', border:'#DBDAE3', bg:'#FAFAFA', card:'#FFFFFF', green:'#3A7D0A' }
const fs = { width:'100%', padding:'10px 14px', border:`1px solid ${C.border}`, borderRadius:6, fontSize:13, outline:'none', fontFamily:'inherit', color:C.text, background:C.bg, boxSizing:'border-box' as const }

export default function StaffProfile() {
  const router = useRouter()
  const [worker, setWorker] = useState<any>(null)
  const [ratings, setRatings] = useState<any[]>([])
  const [assignments, setAssignments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<any>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    sb.auth.getUser().then(async ({ data }) => {
      if (!data.user) return
      const { data: w } = await sb.from('worker_profiles').select('*').eq('user_id', data.user.id).single()
      if (!w) return
      setWorker(w)
      setForm({ full_name:w.full_name||'', phone:w.phone||'', city:w.city||'', bio:w.bio||'', experience_years:w.experience_years||0, daily_rate:w.daily_rate||0, is_available:w.is_available!==false })
      const [{ data: rat }, { data: asgn }] = await Promise.all([
        sb.from('staff_ratings').select('*, events(title)').eq('worker_id', w.id).order('created_at', { ascending:false }),
        sb.from('event_staff_assignments').select('*, events(title,start_date)').eq('worker_profile_id', w.id).order('work_date', { ascending:false }).limit(20),
      ])
      setRatings(rat||[]); setAssignments(asgn||[])
      setLoading(false)
    })
  }, [])

  async function save() {
    setSaving(true)
    await sb.from('worker_profiles').update({ ...form, updated_at: new Date().toISOString() }).eq('id', worker.id)
    setWorker((w: any) => ({ ...w, ...form }))
    setEditing(false); setSaving(false)
  }

  if (loading) return <div style={{ padding:40, textAlign:'center', color:C.muted }}>جاري التحميل...</div>
  if (!worker) return null

  const avgPunct = ratings.length > 0 ? (ratings.reduce((s,r) => s+(r.punctuality||r.rating||0), 0) / ratings.length).toFixed(1) : '—'
  const avgProf  = ratings.length > 0 ? (ratings.reduce((s,r) => s+(r.professionalism||r.rating||0), 0) / ratings.length).toFixed(1) : '—'
  const completedJobs = assignments.filter(a => a.status === 'completed').length

  return (
    <div style={{ direction:'rtl', paddingBottom:80 }}>
      {/* Hero */}
      <div style={{ background:`linear-gradient(135deg, ${C.navy}, #3D1A78)`, padding:'24px 20px 60px', position:'relative' }}>
        <h2 style={{ color:'rgba(255,255,255,0.7)', fontSize:13, margin:'0 0 16px', fontWeight:400 }}>ملف الموظف</h2>
        <div style={{ display:'flex', gap:16, alignItems:'center' }}>
          <div style={{ position:'relative' }}>
            {worker.profile_photo||worker.photo_url ? (
              <img src={worker.profile_photo||worker.photo_url} alt="" style={{ width:72, height:72, borderRadius:'50%', objectFit:'cover', border:'3px solid rgba(255,255,255,0.3)' }}/>
            ) : (
              <div style={{ width:72, height:72, background:C.orange, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:28, color:'#fff', fontWeight:800, border:'3px solid rgba(255,255,255,0.3)' }}>{worker.full_name?.[0]||'?'}</div>
            )}
            {worker.is_verified && <div style={{ position:'absolute', bottom:0, right:0, background:C.green, borderRadius:'50%', width:20, height:20, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, color:'#fff', border:'2px solid #fff' }}>✓</div>}
          </div>
          <div>
            <h1 style={{ color:'#fff', fontSize:20, fontWeight:800, margin:0 }}>{worker.full_name}</h1>
            <p style={{ color:'rgba(255,255,255,0.6)', fontSize:12, margin:'4px 0 0' }}>{worker.city||'—'} · {worker.experience_years||0} سنوات خبرة</p>
            <div style={{ display:'flex', gap:1, marginTop:6 }}>
              {[1,2,3,4,5].map(n => <span key={n} style={{ color: n <= Math.round(worker.rating_avg||worker.rating||0) ? '#FFD700' : 'rgba(255,255,255,0.2)', fontSize:16 }}>★</span>)}
              <span style={{ color:'rgba(255,255,255,0.6)', fontSize:12, marginRight:6 }}>({ratings.length} تقييم)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ padding:'0 16px', marginTop:-28, marginBottom:16 }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10 }}>
          {[
            { l:'أعمال مكتملة', v:completedJobs, c:C.navy, b:'#F0EDF7' },
            { l:'التزام', v:`${worker.commitment_pct||worker.commitment_score||100}%`, c:C.green, b:'#EAF7E0' },
            { l:'الالتزام بالوقت', v:avgPunct+'★', c:'#FFD700', b:'#FFFBEB' },
            { l:'الاحترافية', v:avgProf+'★', c:C.orange, b:'#FEF0ED' },
          ].map(s => (
            <div key={s.l} style={{ background:s.b, borderRadius:10, padding:'12px 10px', textAlign:'center', boxShadow:'0 2px 8px rgba(0,0,0,0.08)' }}>
              <p style={{ fontSize:17, fontWeight:800, color:s.c, margin:0 }}>{s.v}</p>
              <p style={{ fontSize:10, color:C.muted, margin:0 }}>{s.l}</p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding:'0 16px' }}>
        {/* Edit / Info */}
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:18, marginBottom:14 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <h3 style={{ fontSize:14, fontWeight:700, color:C.navy, margin:0 }}>المعلومات الشخصية</h3>
            <button onClick={() => setEditing(!editing)} style={{ padding:'6px 14px', border:`1px solid ${C.border}`, borderRadius:6, background:C.bg, color:C.text, fontSize:12, cursor:'pointer', fontFamily:'inherit', fontWeight:600 }}>
              {editing ? 'إلغاء' : '✏️ تعديل'}
            </button>
          </div>

          {editing ? (
            <div>
              {[['الاسم الكامل','full_name','text'],['رقم الجوال','phone','tel'],['المدينة','city','text'],['الخبرة (سنوات)','experience_years','number'],['الأجر اليومي (SAR)','daily_rate','number']].map(([l,k,t])=>(
                <div key={k as string} style={{ marginBottom:10 }}>
                  <label style={{ fontSize:12, fontWeight:600, color:C.navy, display:'block', marginBottom:4 }}>{l}</label>
                  <input type={t as string} value={form[k as string]||''} onChange={e=>setForm((f:any)=>({...f,[k as string]:e.target.value}))} style={fs}/>
                </div>
              ))}
              <div style={{ marginBottom:10 }}>
                <label style={{ fontSize:12, fontWeight:600, color:C.navy, display:'block', marginBottom:4 }}>نبذة تعريفية</label>
                <textarea value={form.bio||''} onChange={e=>setForm((f:any)=>({...f,bio:e.target.value}))} rows={3} style={{...fs,resize:'vertical'}} placeholder="اكتب نبذة عن نفسك ومهاراتك..."/>
              </div>
              <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', marginBottom:14 }}>
                <input type="checkbox" checked={form.is_available} onChange={e=>setForm((f:any)=>({...f,is_available:e.target.checked}))} style={{ width:15, height:15, accentColor:C.orange }}/>
                <span style={{ fontSize:13, fontWeight:600, color:C.text }}>متاح للعمل حالياً</span>
              </label>
              <button onClick={save} disabled={saving} style={{ width:'100%', padding:'10px', background:C.orange, border:'none', borderRadius:8, color:'#fff', fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
                {saving ? '...' : '💾 حفظ التغييرات'}
              </button>
            </div>
          ) : (
            <div>
              {[['📞 الجوال', worker.phone||'—'],['📍 المدينة', worker.city||'—'],['💼 الخبرة', `${worker.experience_years||0} سنوات`],['💰 الأجر', `${worker.daily_rate||0} SAR / يوم`],['🟢 الحالة', worker.is_available!==false?'متاح للعمل':'غير متاح']].map(([l,v])=>(
                <div key={l as string} style={{ display:'grid', gridTemplateColumns:'110px 1fr', gap:8, marginBottom:10, paddingBottom:10, borderBottom:`1px solid ${C.border}` }}>
                  <span style={{ fontSize:12, color:C.muted, fontWeight:600 }}>{l}</span>
                  <span style={{ fontSize:13, color:C.text, fontWeight:600 }}>{v}</span>
                </div>
              ))}
              {worker.bio && <p style={{ fontSize:13, color:C.text, lineHeight:1.6, margin:'10px 0 0', background:'#F8F7FA', padding:'12px', borderRadius:8 }}>{worker.bio}</p>}
            </div>
          )}
        </div>

        {/* Skills */}
        {(worker.skills||[]).length > 0 && (
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:16, marginBottom:14 }}>
            <h3 style={{ fontSize:14, fontWeight:700, color:C.navy, margin:'0 0 12px' }}>المهارات</h3>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
              {(worker.skills||[]).map((s:string) => (
                <span key={s} style={{ background:'#EDE9F7', color:'#7B4FBF', padding:'4px 12px', borderRadius:20, fontSize:12, fontWeight:700 }}>{s}</span>
              ))}
            </div>
          </div>
        )}

        {/* Work history */}
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, overflow:'hidden', marginBottom:14 }}>
          <div style={{ padding:'12px 16px', borderBottom:`1px solid ${C.border}` }}>
            <span style={{ fontWeight:700, color:C.navy, fontSize:14 }}>📋 سجل الأعمال ({assignments.length})</span>
          </div>
          {assignments.length === 0 ? (
            <p style={{ padding:20, color:C.muted, fontSize:13, margin:0 }}>لا توجد أعمال سابقة</p>
          ) : assignments.map((a,i) => {
            const stMap: any = { pending:{ l:'انتظار',c:'#B07000' }, confirmed:{ l:'مؤكد',c:C.green }, completed:{ l:'مكتمل',c:'#7B4FBF' }, no_show:{ l:'غياب',c:'#DC2626' }, assigned:{ l:'مسند',c:'#0070B8' } }
            const st = stMap[a.status] || stMap.pending
            return (
              <div key={a.id} style={{ padding:'12px 16px', borderBottom: i < assignments.length-1 ? `1px solid ${C.border}` : 'none', display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ fontSize:13, fontWeight:700, color:C.navy, margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{a.events?.title||'—'}</p>
                  <div style={{ display:'flex', gap:8, marginTop:2 }}>
                    <span style={{ fontSize:11, color:C.muted }}>🎭 {a.role}</span>
                    {a.zone && <span style={{ fontSize:11, color:C.muted }}>📍 {a.zone}</span>}
                    {a.work_date && <span style={{ fontSize:11, color:C.muted }}>📅 {new Date(a.work_date).toLocaleDateString('ar-SA')}</span>}
                  </div>
                </div>
                <span style={{ fontSize:11, fontWeight:700, color:st.c, whiteSpace:'nowrap' }}>{st.l}</span>
              </div>
            )
          })}
        </div>

        {/* Ratings */}
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, overflow:'hidden' }}>
          <div style={{ padding:'12px 16px', borderBottom:`1px solid ${C.border}` }}>
            <span style={{ fontWeight:700, color:C.navy, fontSize:14 }}>⭐ تقييمات المنظمين ({ratings.length})</span>
          </div>
          {ratings.length === 0 ? (
            <p style={{ padding:20, color:C.muted, fontSize:13, margin:0 }}>لا توجد تقييمات بعد</p>
          ) : ratings.map((r,i) => (
            <div key={r.id} style={{ padding:'14px 16px', borderBottom: i < ratings.length-1 ? `1px solid ${C.border}` : 'none' }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                <span style={{ fontSize:13, fontWeight:700, color:C.navy }}>{r.events?.title||'فعالية'}</span>
                <div style={{ display:'flex', gap:1 }}>
                  {[1,2,3,4,5].map(n => <span key={n} style={{ color: n<=r.rating?'#FFD700':'#DBDAE3', fontSize:16 }}>★</span>)}
                </div>
              </div>
              {r.comment && <p style={{ fontSize:12, color:C.muted, margin:'0 0 6px' }}>"{r.comment}"</p>}
              <div style={{ display:'flex', gap:12 }}>
                {r.punctuality && <span style={{ fontSize:11, color:C.muted }}>⏰ التزام: {r.punctuality}/5</span>}
                {r.professionalism && <span style={{ fontSize:11, color:C.muted }}>💼 احترافية: {r.professionalism}/5</span>}
              </div>
              <p style={{ fontSize:10, color:C.border, margin:'4px 0 0' }}>{new Date(r.created_at).toLocaleDateString('ar-SA')}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
