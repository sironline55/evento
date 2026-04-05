'use client'
import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'

const sb = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
const C = { navy:'#1E0A3C',orange:'#F05537',text:'#39364F',muted:'#6F7287',border:'#DBDAE3',bg:'#FAFAFA',card:'#FFFFFF',green:'#3A7D0A' }
const fs = {width:'100%',padding:'10px 14px',border:`1px solid ${C.border}`,borderRadius:6,fontSize:13,outline:'none',fontFamily:'inherit',color:C.text,background:C.bg,boxSizing:'border-box' as const}

const SKILLS = ['استقبال ومضيافة','قراءة تذاكر','إدارة الحشود','تنظيم مواقف','أمن وحماية','تنسيق فعاليات','خدمة عملاء','تقنية وصوتيات','تصوير وإعلام','لوجستي']

export default function StaffProfilePage() {
  const [member, setMember]       = useState<any>(null)
  const [worker, setWorker]       = useState<any>(null)
  const [ratings, setRatings]     = useState<any[]>([])
  const [assignments, setAssignments] = useState<any[]>([])
  const [saving, setSaving]       = useState(false)
  const [saved, setSaved]         = useState(false)
  const [form, setForm] = useState({
    full_name:'', phone:'', city:'', bio:'', national_id:'',
    experience_years:'0', daily_rate:'150', skills:[] as string[],
  })

  useEffect(()=>{
    sb.auth.getUser().then(async ({data:{user}})=>{
      if (!user) return
      const [{data:m},{data:w},{data:r},{data:a}] = await Promise.all([
        sb.from('org_members').select('*,organizations(name,logo_url)').eq('user_id',user.id).single(),
        sb.from('worker_profiles').select('*').eq('user_id',user.id).maybeSingle(),
        sb.from('staff_ratings').select('*').eq('member_id',(await sb.from('org_members').select('id').eq('user_id',user.id).single()).data?.id||'').order('created_at',{ascending:false}).limit(20),
        sb.from('event_staff_assignments').select('*,events(title,start_date)').eq('member_id',(await sb.from('org_members').select('id').eq('user_id',user.id).single()).data?.id||'').order('shift_start',{ascending:false}).limit(10),
      ])
      setMember(m); setWorker(w); setRatings(r||[]); setAssignments(a||[])
      setForm({
        full_name: m?.full_name||'',
        phone: w?.phone||'',
        city: w?.city||'',
        bio: w?.bio||'',
        national_id: w?.national_id||'',
        experience_years: String(w?.experience_years||0),
        daily_rate: String(w?.daily_rate||150),
        skills: w?.skills||[],
      })
    })
  },[])

  const set = (k:string,v:any) => setForm(f=>({...f,[k]:v}))
  const toggleSkill = (s:string) => set('skills', form.skills.includes(s)?form.skills.filter(x=>x!==s):[...form.skills,s])

  async function save() {
    if (!member) return
    setSaving(true)
    // Update org_members full_name
    await sb.from('org_members').update({full_name:form.full_name}).eq('id',member.id)
    // Upsert worker profile
    await sb.from('worker_profiles').upsert({
      user_id: member.user_id||member.id,
      full_name: form.full_name,
      phone: form.phone,
      city: form.city,
      bio: form.bio,
      national_id: form.national_id,
      experience_years: Number(form.experience_years)||0,
      daily_rate: Number(form.daily_rate)||150,
      skills: form.skills,
      email: member.email,
    },{onConflict:'user_id'})
    setSaved(true); setTimeout(()=>setSaved(false),2000)
    setSaving(false)
  }

  const avgRating = ratings.length>0?(ratings.reduce((a,r)=>a+r.rating,0)/ratings.length).toFixed(1):'—'
  const stars = (n:number) => '⭐'.repeat(n)+'☆'.repeat(5-n)

  if (!member) return <div style={{padding:40,textAlign:'center',color:C.muted}}>جاري التحميل...</div>

  return (
    <div style={{padding:'16px 20px',maxWidth:860,margin:'0 auto',direction:'rtl'}}>
      <div style={{display:'grid',gridTemplateColumns:'1fr 280px',gap:16,alignItems:'start'}}>

        {/* Edit form */}
        <div>
          {/* Header */}
          <div style={{background:`linear-gradient(135deg,${C.navy},#3D1A78)`,borderRadius:12,padding:'24px 20px',marginBottom:14,display:'flex',gap:16,alignItems:'center'}}>
            <div style={{width:64,height:64,background:C.orange,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:26,fontWeight:800,color:'#fff',flexShrink:0}}>
              {form.full_name?.[0]||'؟'}
            </div>
            <div>
              <h2 style={{color:'#fff',fontSize:18,fontWeight:800,margin:0}}>{form.full_name||'الملف الشخصي'}</h2>
              <p style={{color:'rgba(255,255,255,0.65)',fontSize:12,margin:'4px 0 0'}}>{member?.email}</p>
              <div style={{display:'flex',gap:8,marginTop:6}}>
                <span style={{background:'rgba(255,255,255,0.15)',color:'#fff',padding:'2px 10px',borderRadius:10,fontSize:11,fontWeight:700}}>
                  {{admin:'مدير',manager:'مشرف',scanner:'قارئ تذاكر',analyst:'محلل',viewer:'مراقب'}[member?.role]||member?.role}
                </span>
                {worker?.is_verified&&<span style={{background:'#EAF7E0',color:C.green,padding:'2px 10px',borderRadius:10,fontSize:11,fontWeight:700}}>✓ موثّق</span>}
              </div>
            </div>
          </div>

          <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:20,marginBottom:12}}>
            <h3 style={{fontSize:14,fontWeight:700,color:C.navy,margin:'0 0 16px'}}>المعلومات الشخصية</h3>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
              <div><label style={{fontSize:12,fontWeight:600,color:C.navy,display:'block',marginBottom:4}}>الاسم الكامل</label><input value={form.full_name} onChange={e=>set('full_name',e.target.value)} style={fs}/></div>
              <div><label style={{fontSize:12,fontWeight:600,color:C.navy,display:'block',marginBottom:4}}>رقم الجوال</label><input value={form.phone} onChange={e=>set('phone',e.target.value)} style={fs} placeholder="05xxxxxxxx"/></div>
              <div><label style={{fontSize:12,fontWeight:600,color:C.navy,display:'block',marginBottom:4}}>المدينة</label><input value={form.city} onChange={e=>set('city',e.target.value)} style={fs} placeholder="الرياض"/></div>
              <div><label style={{fontSize:12,fontWeight:600,color:C.navy,display:'block',marginBottom:4}}>رقم الهوية / الإقامة</label><input value={form.national_id} onChange={e=>set('national_id',e.target.value)} style={fs} placeholder="1xxxxxxxxx"/></div>
              <div><label style={{fontSize:12,fontWeight:600,color:C.navy,display:'block',marginBottom:4}}>سنوات الخبرة</label><input type="number" value={form.experience_years} onChange={e=>set('experience_years',e.target.value)} style={fs}/></div>
              <div><label style={{fontSize:12,fontWeight:600,color:C.navy,display:'block',marginBottom:4}}>الأجر اليومي (SAR)</label><input type="number" value={form.daily_rate} onChange={e=>set('daily_rate',e.target.value)} style={fs}/></div>
            </div>
            <div style={{marginBottom:12}}>
              <label style={{fontSize:12,fontWeight:600,color:C.navy,display:'block',marginBottom:4}}>نبذة شخصية</label>
              <textarea value={form.bio} onChange={e=>set('bio',e.target.value)} rows={3} style={{...fs,resize:'vertical'}} placeholder="اكتب نبذة مختصرة عن نفسك وخبراتك..."/>
            </div>
          </div>

          {/* Skills */}
          <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:20,marginBottom:12}}>
            <h3 style={{fontSize:14,fontWeight:700,color:C.navy,margin:'0 0 12px'}}>المهارات والتخصصات</h3>
            <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
              {SKILLS.map(s=>(
                <button key={s} onClick={()=>toggleSkill(s)} style={{
                  padding:'6px 14px',borderRadius:20,fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'inherit',
                  border:`2px solid ${form.skills.includes(s)?C.orange:C.border}`,
                  background:form.skills.includes(s)?'#FEF0ED':C.bg,
                  color:form.skills.includes(s)?C.orange:C.text,
                  transition:'all 0.15s'
                }}>{s}</button>
              ))}
            </div>
          </div>

          {/* Save */}
          <button onClick={save} disabled={saving} style={{width:'100%',padding:'13px',background:saved?C.green:saving?'#ccc':C.orange,border:'none',borderRadius:8,color:'#fff',fontWeight:800,fontSize:14,cursor:saving?'not-allowed':'pointer',fontFamily:'inherit',transition:'background 0.2s'}}>
            {saved?'✓ تم الحفظ':saving?'جاري الحفظ...':'💾 حفظ الملف الشخصي'}
          </button>
        </div>

        {/* Right: Stats + ratings + history */}
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          {/* Stats */}
          <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:16}}>
            <h3 style={{fontSize:13,fontWeight:700,color:C.navy,margin:'0 0 12px'}}>إحصاءاتي</h3>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
              {[
                {l:'التقييمات',v:ratings.length,c:'#7B4FBF',b:'#EDE9F7'},
                {l:'متوسط التقييم',v:`⭐ ${avgRating}`,c:'#B07000',b:'#FFF8E8'},
                {l:'المهام',v:assignments.length,c:C.green,b:'#EAF7E0'},
                {l:'المكتملة',v:assignments.filter(a=>a.status==='completed').length,c:C.orange,b:'#FEF0ED'},
              ].map(s=>(
                <div key={s.l} style={{background:s.b,borderRadius:8,padding:'10px 12px',textAlign:'center'}}>
                  <p style={{fontSize:18,fontWeight:800,color:s.c,margin:0}}>{s.v}</p>
                  <p style={{fontSize:10,color:C.muted,margin:0}}>{s.l}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Ratings */}
          <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,overflow:'hidden'}}>
            <div style={{padding:'10px 14px',borderBottom:`1px solid ${C.border}`,background:'#FFF8E8'}}>
              <span style={{fontWeight:700,color:'#B07000',fontSize:13}}>⭐ التقييمات ({ratings.length})</span>
            </div>
            {ratings.length===0?(
              <p style={{padding:16,color:C.muted,fontSize:12,margin:0,textAlign:'center'}}>لا توجد تقييمات بعد</p>
            ):ratings.slice(0,5).map((r,i)=>(
              <div key={r.id} style={{padding:'10px 14px',borderBottom:i<4?`1px solid ${C.border}`:'none'}}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
                  <span style={{fontSize:13}}>{stars(r.rating)}</span>
                  <span style={{fontSize:10,color:C.muted}}>{new Date(r.created_at).toLocaleDateString('ar-SA')}</span>
                </div>
                {r.comment&&<p style={{fontSize:12,color:C.text,margin:0,lineHeight:1.4}}>{r.comment}</p>}
              </div>
            ))}
          </div>

          {/* Work history */}
          <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,overflow:'hidden'}}>
            <div style={{padding:'10px 14px',borderBottom:`1px solid ${C.border}`}}>
              <span style={{fontWeight:700,color:C.navy,fontSize:13}}>📋 سجل العمل</span>
            </div>
            {assignments.length===0?(
              <p style={{padding:16,color:C.muted,fontSize:12,margin:0,textAlign:'center'}}>لا توجد مهام سابقة</p>
            ):assignments.slice(0,5).map((a,i)=>(
              <div key={a.id} style={{padding:'10px 14px',borderBottom:i<4?`1px solid ${C.border}`:'none'}}>
                <p style={{fontSize:12,fontWeight:700,color:C.navy,margin:0}}>{(a.events as any)?.title||'—'}</p>
                <div style={{display:'flex',gap:6,marginTop:2,flexWrap:'wrap'}}>
                  {a.role&&<span style={{fontSize:10,color:'#7B4FBF',background:'#EDE9F7',padding:'1px 5px',borderRadius:3}}>{a.role}</span>}
                  {a.zone&&<span style={{fontSize:10,color:C.muted}}>📍 {a.zone}</span>}
                  <span style={{fontSize:10,color:a.status==='completed'?C.green:C.muted,fontWeight:600}}>
                    {{assigned:'مسندة',confirmed:'مؤكدة',completed:'مكتملة',no_show:'غياب'}[a.status]||a.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
