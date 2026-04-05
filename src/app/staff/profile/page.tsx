'use client'
import { useEffect, useState, useRef } from 'react'
import { createBrowserClient } from '@supabase/ssr'

const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
const C = { navy:'#1E0A3C',orange:'#F05537',text:'#39364F',muted:'#6F7287',border:'#DBDAE3',bg:'#FAFAFA',card:'#FFFFFF',green:'#3A7D0A' }
const fs = { width:'100%',padding:'11px 14px',border:`1px solid ${C.border}`,borderRadius:8,fontSize:13,outline:'none',fontFamily:'inherit',color:C.text,background:C.bg,boxSizing:'border-box' as const }

const SKILLS_LIST = [
  { value:'scanner',       label:'📷 ماسح تذاكر' },
  { value:'receptionist',  label:'🤝 استقبال' },
  { value:'crowd_manager', label:'👥 إدارة حشود' },
  { value:'parking',       label:'🚗 مواقف سيارات' },
  { value:'security',      label:'🛡️ أمن' },
  { value:'technical',     label:'💡 تقني' },
  { value:'cleaning',      label:'🧹 نظافة' },
  { value:'catering',      label:'🍽️ ضيافة' },
]

export default function StaffProfile() {
  const [worker, setWorker] = useState<any>(null)
  const [form, setForm]     = useState<any>({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved]   = useState(false)
  const [uploading, setUploading] = useState(false)
  const [assignments, setAssignments] = useState<any[]>([])
  const [ratings, setRatings] = useState<any[]>([])
  const imgRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    sb.auth.getUser().then(async ({ data }) => {
      if (!data.user) return
      const { data: wp } = await sb.from('worker_profiles').select('*').eq('user_id', data.user.id).single()
      if (wp) { setWorker(wp); setForm(wp) }
      const [{ data: asgn }, { data: rats }] = await Promise.all([
        sb.from('event_staff_assignments').select('*, events(title,start_date)').eq('worker_profile_id', wp?.id).order('work_date', {ascending:false}).limit(20),
        sb.from('staff_ratings').select('*').eq('worker_profile_id', wp?.id).order('created_at', {ascending:false}),
      ])
      setAssignments(asgn || [])
      setRatings(rats || [])
    })
  }, [])

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }))

  async function uploadPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file || !worker) return
    setUploading(true)
    const path = `workers/${worker.id}/photo`
    await sb.storage.from('event-images').upload(path, file, { upsert: true })
    const { data } = sb.storage.from('event-images').getPublicUrl(path)
    await sb.from('worker_profiles').update({ profile_photo: data.publicUrl }).eq('id', worker.id)
    set('profile_photo', data.publicUrl)
    setUploading(false)
  }

  async function save() {
    setSaving(true)
    await sb.from('worker_profiles').update({
      full_name: form.full_name, phone: form.phone, city: form.city,
      bio: form.bio, skills: form.skills, daily_rate: form.daily_rate,
      gender: form.gender, national_id: form.national_id,
      is_available: form.is_available, date_of_birth: form.date_of_birth,
    }).eq('id', worker.id)
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function toggleSkill(s: string) {
    const cur: string[] = form.skills || []
    set('skills', cur.includes(s) ? cur.filter(x => x !== s) : [...cur, s])
  }

  const avgRating = ratings.length > 0 ? (ratings.reduce((a,r)=>a+r.rating,0)/ratings.length).toFixed(1) : null

  if (!worker) return <div style={{ padding:40, textAlign:'center', color:C.muted }}>جاري التحميل...</div>

  return (
    <div style={{ minHeight:'100vh', background:C.bg, direction:'rtl', paddingBottom:80 }}>
      {/* Header */}
      <div style={{ background:`linear-gradient(135deg, ${C.navy}, #3D1A78)`, padding:'20px 20px 40px', textAlign:'center', position:'relative' }}>
        <input ref={imgRef} type="file" accept="image/*" onChange={uploadPhoto} style={{ display:'none' }}/>
        <div onClick={() => imgRef.current?.click()} style={{ width:80, height:80, borderRadius:'50%', background:C.orange, display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize:32, fontWeight:800, color:'#fff', margin:'0 auto 10px', overflow:'hidden', border:'3px solid rgba(255,255,255,0.4)', cursor:'pointer', position:'relative' }}>
          {form.profile_photo ? <img src={form.profile_photo} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/> : (form.full_name?.[0]||'?')}
          <div style={{ position:'absolute', bottom:0, right:0, width:24, height:24, background:C.orange, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, border:'2px solid #fff' }}>📷</div>
        </div>
        {uploading && <p style={{ color:'rgba(255,255,255,0.7)', fontSize:12 }}>جاري الرفع...</p>}
        <h2 style={{ color:'#fff', fontSize:18, fontWeight:800, margin:0 }}>{form.full_name}</h2>
        <div style={{ display:'flex', gap:12, justifyContent:'center', marginTop:10 }}>
          {avgRating && <span style={{ color:'#FFD700', fontSize:13 }}>⭐ {avgRating} ({ratings.length} تقييم)</span>}
          <span style={{ color:'rgba(255,255,255,0.6)', fontSize:12 }}>🎯 {assignments.length} فعالية</span>
        </div>
      </div>

      <div style={{ padding:16, marginTop:-20 }}>
        {/* Availability toggle */}
        <div style={{ background:C.card, border:`2px solid ${form.is_available?C.green:C.border}`, borderRadius:10, padding:14, marginBottom:14, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <p style={{ fontSize:14, fontWeight:700, color:C.navy, margin:0 }}>{form.is_available ? '✅ متاح للعمل' : '❌ غير متاح حالياً'}</p>
            <p style={{ fontSize:11, color:C.muted, margin:0 }}>يتيح لأصحاب العمل رؤية ملفك وتوظيفك</p>
          </div>
          <div onClick={()=>set('is_available',!form.is_available)} style={{ width:46, height:26, background:form.is_available?C.green:'#D1D5DB', borderRadius:13, cursor:'pointer', position:'relative', transition:'background 0.2s' }}>
            <div style={{ position:'absolute', top:3, right:form.is_available?3:undefined, left:form.is_available?undefined:3, width:20, height:20, background:'#fff', borderRadius:'50%', transition:'all 0.2s', boxShadow:'0 1px 4px rgba(0,0,0,0.2)' }}/>
          </div>
        </div>

        {/* Basic info */}
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:18, marginBottom:14 }}>
          <h3 style={{ fontSize:14, fontWeight:700, color:C.navy, margin:'0 0 14px' }}>المعلومات الأساسية</h3>
          {[['text','full_name','الاسم الكامل'],['tel','phone','رقم الجوال'],['text','city','المدينة'],['number','daily_rate','الأجر اليومي (SAR)'],['date','date_of_birth','تاريخ الميلاد'],['text','national_id','رقم الهوية']].map(([type,key,label])=>(
            <div key={key} style={{ marginBottom:10 }}>
              <label style={{ fontSize:12, fontWeight:600, color:C.navy, display:'block', marginBottom:3 }}>{label}</label>
              <input type={type} value={form[key]||''} onChange={e=>set(key,e.target.value)} style={fs}/>
            </div>
          ))}
          <div style={{ marginBottom:10 }}>
            <label style={{ fontSize:12, fontWeight:600, color:C.navy, display:'block', marginBottom:3 }}>الجنس</label>
            <select value={form.gender||''} onChange={e=>set('gender',e.target.value)} style={fs}>
              <option value="">اختر</option>
              <option value="male">ذكر</option>
              <option value="female">أنثى</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize:12, fontWeight:600, color:C.navy, display:'block', marginBottom:3 }}>نبذة عنك</label>
            <textarea value={form.bio||''} onChange={e=>set('bio',e.target.value)} rows={3} style={{ ...fs, resize:'vertical' }} placeholder="اكتب نبذة مختصرة عن خبرتك..."/>
          </div>
        </div>

        {/* Skills */}
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:18, marginBottom:14 }}>
          <h3 style={{ fontSize:14, fontWeight:700, color:C.navy, margin:'0 0 12px' }}>المهارات والتخصصات</h3>
          <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
            {SKILLS_LIST.map(s => {
              const on = (form.skills||[]).includes(s.value)
              return (
                <button key={s.value} onClick={()=>toggleSkill(s.value)} style={{ padding:'7px 14px', border:`2px solid ${on?C.orange:C.border}`, borderRadius:20, background:on?'#FEF0ED':C.bg, color:on?C.orange:C.text, fontWeight:on?700:500, fontSize:12, cursor:'pointer', fontFamily:'inherit', transition:'all 0.15s' }}>
                  {s.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Work history */}
        {assignments.length > 0 && (
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, overflow:'hidden', marginBottom:14 }}>
            <div style={{ padding:'12px 16px', borderBottom:`1px solid ${C.border}` }}>
              <span style={{ fontWeight:700, color:C.navy, fontSize:14 }}>📋 سجل العمل ({assignments.length} فعالية)</span>
            </div>
            {assignments.slice(0,5).map((a,i)=>(
              <div key={a.id} style={{ padding:'10px 16px', borderBottom:i<Math.min(assignments.length,5)-1?`1px solid ${C.border}`:'none', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div>
                  <p style={{ fontSize:13, fontWeight:700, color:C.navy, margin:0 }}>{a.events?.title||'فعالية'}</p>
                  <p style={{ fontSize:11, color:C.muted, margin:'2px 0 0' }}>{a.work_date?new Date(a.work_date).toLocaleDateString('ar-SA'):''} · {a.role}</p>
                </div>
                <span style={{ fontSize:11, padding:'3px 8px', borderRadius:20, background:a.status==='completed'?'#EAF7E0':a.status==='checked_in'?'#EDE9F7':'#F8F7FA', color:a.status==='completed'?C.green:a.status==='checked_in'?'#7B4FBF':C.muted, fontWeight:700 }}>
                  {a.status==='completed'?'مكتمل':a.status==='checked_in'?'نشط':a.status==='absent'?'غياب':'مجدول'}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Ratings */}
        {ratings.length > 0 && (
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, overflow:'hidden', marginBottom:14 }}>
            <div style={{ padding:'12px 16px', borderBottom:`1px solid ${C.border}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ fontWeight:700, color:C.navy, fontSize:14 }}>⭐ تقييماتي</span>
              <span style={{ fontSize:13, fontWeight:800, color:C.orange }}>{avgRating}/5</span>
            </div>
            {ratings.map((r,i)=>(
              <div key={r.id} style={{ padding:'12px 16px', borderBottom:i<ratings.length-1?`1px solid ${C.border}`:'none' }}>
                <div style={{ display:'flex', gap:2, marginBottom:4 }}>
                  {[1,2,3,4,5].map(n=><span key={n} style={{ color:n<=r.rating?'#FFD700':'#E5E7EB', fontSize:14 }}>★</span>)}
                </div>
                {r.comment&&<p style={{ fontSize:12, color:C.text, margin:0 }}>{r.comment}</p>}
                <p style={{ fontSize:10, color:C.muted, margin:'3px 0 0' }}>{new Date(r.created_at).toLocaleDateString('ar-SA')}</p>
              </div>
            ))}
          </div>
        )}

        {/* Save */}
        <button onClick={save} disabled={saving} style={{ width:'100%', padding:'13px', background:saved?C.green:C.orange, border:'none', borderRadius:8, color:'#fff', fontWeight:800, fontSize:14, cursor:'pointer', fontFamily:'inherit' }}>
          {saved ? '✓ تم الحفظ!' : saving ? 'جاري الحفظ...' : '💾 حفظ الملف'}
        </button>
      </div>
    </div>
  )
}
