'use client'
import React, { useEffect, useState, useMemo } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'

const C = { navy:'#1E0A3C', orange:'#F05537', text:'#39364F', muted:'#6F7287', border:'#DBDAE3', bg:'#FAFAFA', card:'#FFFFFF', green:'#3A7D0A' }
const inp: React.CSSProperties = { width:'100%', padding:'11px 14px', border:`1px solid ${C.border}`, borderRadius:8, fontSize:14, outline:'none', fontFamily:'inherit', color:C.text, background:C.card, boxSizing:'border-box' }
const lbl: React.CSSProperties = { fontSize:12, fontWeight:700, color:C.text, display:'block', marginBottom:6 }

const CATEGORIES = ['فعاليات','ترفيه','رياضة','مؤتمرات وأعمال','سفر وسياحة','طعام','تقنية','أزياء','صحة ولياقة']

export default function InfluencerRegisterPage() {
  const sb = useMemo(()=>createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!),[])
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    full_name:'', influencer_bio:'',
    influencer_categories:[] as string[],
    tiktok_handle:'', tiktok_followers:'',
    instagram_handle:'', instagram_followers:'',
    snapchat_handle:'', snapchat_followers:'',
    youtube_handle:'', youtube_followers:'',
    portfolio_links:['','',''],
    price_reel:'', price_story:'', price_video:'', price_post:''
  })
  const set = (k:string,v:any) => setForm(f=>({...f,[k]:v}))

  useEffect(()=>{ sb.auth.getUser().then(({data})=>{ if(!data.user){router.push('/login');return} setUser(data.user) }) },[])

  function toggleCat(c:string) {
    set('influencer_categories', form.influencer_categories.includes(c)
      ? form.influencer_categories.filter(x=>x!==c) : [...form.influencer_categories,c])
  }

  async function submit() {
    if (!form.full_name.trim()) { alert('يرجى إدخال الاسم'); return }
    setSaving(true)
    const { error } = await sb.from('worker_profiles').upsert({
      user_id: user.id,
      profile_type: 'influencer',
      full_name: form.full_name.trim(),
      influencer_bio: form.influencer_bio||null,
      influencer_categories: form.influencer_categories,
      tiktok_handle: form.tiktok_handle||null,
      tiktok_followers: parseInt(form.tiktok_followers)||0,
      instagram_handle: form.instagram_handle||null,
      instagram_followers: parseInt(form.instagram_followers)||0,
      snapchat_handle: form.snapchat_handle||null,
      snapchat_followers: parseInt(form.snapchat_followers)||0,
      youtube_handle: form.youtube_handle||null,
      youtube_followers: parseInt(form.youtube_followers)||0,
      portfolio_links: form.portfolio_links.filter(l=>l.trim()),
      price_reel: parseInt(form.price_reel)||null,
      price_story: parseInt(form.price_story)||null,
      price_video: parseInt(form.price_video)||null,
      price_post: parseInt(form.price_post)||null,
      is_available: true,
    }, { onConflict:'user_id' })
    setSaving(false)
    if (!error) router.push('/influencers')
    else alert('خطأ: '+error.message)
  }

  return (
    <div style={{minHeight:'100vh',background:C.bg,direction:'rtl'}}>
      <div style={{background:`linear-gradient(135deg,${C.navy},#3D1A78)`,padding:'32px',color:'#fff',textAlign:'center'}}>
        <h1 style={{fontSize:28,fontWeight:900,margin:'0 0 8px'}}>🎭 سجّل كمؤثر في الفعاليات</h1>
        <p style={{opacity:.8,fontSize:14,margin:0}}>ابدأ باستقبال طلبات من المنظمين مباشرة</p>
      </div>

      <div style={{maxWidth:640,margin:'32px auto',padding:'0 24px'}}>
        {/* Step tabs */}
        <div style={{display:'flex',gap:0,marginBottom:24,background:C.card,borderRadius:12,border:`1px solid ${C.border}`,overflow:'hidden'}}>
          {[['1','معلوماتك الأساسية'],['2','حساباتك الاجتماعية'],['3','أسعارك']].map(([s,l],i)=>(
            <button key={s} onClick={()=>setStep(i+1)} style={{
              flex:1,padding:'12px',border:'none',fontFamily:'inherit',cursor:'pointer',fontSize:13,
              background:step===i+1?C.navy:C.card, color:step===i+1?'#fff':C.muted,
              fontWeight:step===i+1?700:400, borderLeft:i>0?`1px solid ${C.border}`:'none'
            }}>{s} — {l}</button>
          ))}
        </div>

        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:28}}>

          {step===1&&(
            <div style={{display:'grid',gap:16}}>
              <h2 style={{fontSize:17,fontWeight:800,color:C.navy,margin:'0 0 4px'}}>👤 المعلومات الأساسية</h2>
              <div><label style={lbl}>الاسم الكامل *</label><input value={form.full_name} onChange={e=>set('full_name',e.target.value)} placeholder="اسمك كما يظهر للمنظمين" style={inp}/></div>
              <div><label style={lbl}>نبذة عنك</label><textarea value={form.influencer_bio} onChange={e=>set('influencer_bio',e.target.value)} rows={4} placeholder="صف نفسك ومجالك وتجربتك في الفعاليات..." style={{...inp,resize:'vertical'}}/></div>
              <div>
                <label style={lbl}>تخصصاتك في الفعاليات (اختر ما يناسبك)</label>
                <div style={{display:'flex',gap:8,flexWrap:'wrap',marginTop:4}}>
                  {CATEGORIES.map(c=>(
                    <button key={c} onClick={()=>toggleCat(c)} style={{
                      padding:'8px 16px',borderRadius:20,cursor:'pointer',fontFamily:'inherit',fontSize:13,
                      border:`2px solid ${form.influencer_categories.includes(c)?C.orange:C.border}`,
                      background:form.influencer_categories.includes(c)?'#FEF0ED':'#fff',
                      color:form.influencer_categories.includes(c)?C.orange:C.text,
                      fontWeight:form.influencer_categories.includes(c)?700:400
                    }}>{c}</button>
                  ))}
                </div>
              </div>
              <div>
                <label style={lbl}>روابط أعمال سابقة (اختياري)</label>
                {form.portfolio_links.map((l,i)=>(
                  <input key={i} value={l} onChange={e=>{const arr=[...form.portfolio_links];arr[i]=e.target.value;set('portfolio_links',arr)}}
                    placeholder={`رابط ${i+1} — فيديو أو منشور سابق`} style={{...inp,marginBottom:8,fontFamily:'monospace',fontSize:12}}/>
                ))}
              </div>
              <button onClick={()=>setStep(2)} style={{padding:'13px',background:C.navy,border:'none',borderRadius:8,color:'#fff',fontWeight:700,fontSize:15,cursor:'pointer',fontFamily:'inherit'}}>التالي ←</button>
            </div>
          )}

          {step===2&&(
            <div style={{display:'grid',gap:16}}>
              <h2 style={{fontSize:17,fontWeight:800,color:C.navy,margin:'0 0 4px'}}>📱 حساباتك الاجتماعية</h2>
              {[
                {icon:'🎵',label:'TikTok',hk:'tiktok_handle',fk:'tiktok_followers'},
                {icon:'👻',label:'Snapchat',hk:'snapchat_handle',fk:'snapchat_followers'},
                {icon:'📷',label:'Instagram',hk:'instagram_handle',fk:'instagram_followers'},
                {icon:'▶️',label:'YouTube',hk:'youtube_handle',fk:'youtube_followers'},
              ].map(p=>(
                <div key={p.hk} style={{background:'#F8F7FA',borderRadius:10,padding:14}}>
                  <p style={{fontWeight:700,color:C.navy,fontSize:13,margin:'0 0 10px'}}>{p.icon} {p.label}</p>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                    <div><label style={lbl}>اسم المستخدم</label><input value={(form as any)[p.hk]} onChange={e=>set(p.hk,e.target.value.replace('@',''))} placeholder="username بدون @" style={inp}/></div>
                    <div><label style={lbl}>عدد المتابعين</label><input type="number" value={(form as any)[p.fk]} onChange={e=>set(p.fk,e.target.value)} placeholder="0" style={inp}/></div>
                  </div>
                </div>
              ))}
              <div style={{display:'flex',gap:10}}>
                <button onClick={()=>setStep(1)} style={{padding:'13px 20px',background:'#F8F7FA',border:`1px solid ${C.border}`,borderRadius:8,fontFamily:'inherit',cursor:'pointer',fontWeight:600,color:C.text}}>← رجوع</button>
                <button onClick={()=>setStep(3)} style={{flex:1,padding:'13px',background:C.navy,border:'none',borderRadius:8,color:'#fff',fontWeight:700,fontSize:15,cursor:'pointer',fontFamily:'inherit'}}>التالي ←</button>
              </div>
            </div>
          )}

          {step===3&&(
            <div style={{display:'grid',gap:16}}>
              <h2 style={{fontSize:17,fontWeight:800,color:C.navy,margin:'0 0 4px'}}>💰 أسعار خدماتك</h2>
              <p style={{color:C.muted,fontSize:13,margin:'0 0 8px'}}>حدد سعر كل نوع من المحتوى (بالريال السعودي شامل VAT)</p>
              {[
                {k:'price_reel',l:'🎬 ريلز / TikTok فيديو',ph:'مثال: 2000'},
                {k:'price_story',l:'📱 ستوري (5 قصص)',ph:'مثال: 800'},
                {k:'price_video',l:'🎥 فيديو يوتيوب',ph:'مثال: 5000'},
                {k:'price_post',l:'📝 منشور (صورة أو كاروسيل)',ph:'مثال: 1500'},
              ].map(({k,l,ph})=>(
                <div key={k}>
                  <label style={lbl}>{l}</label>
                  <input type="number" value={(form as any)[k]} onChange={e=>set(k,e.target.value)} placeholder={ph} style={inp}/>
                </div>
              ))}
              <div style={{background:'#EAF7E0',border:'1px solid #C3E6C3',borderRadius:10,padding:12,marginTop:4}}>
                <p style={{fontSize:12,color:'#1A5A00',fontWeight:700,margin:'0 0 4px'}}>💡 نصيحة للتسعير</p>
                <p style={{fontSize:11,color:'#1A5A00',margin:0,lineHeight:1.7}}>يمكنك ترك الأسعار فارغة والتفاوض مع كل منظم. أو حدد أسعارك لتساعد المنظمين على اتخاذ القرار بسرعة.</p>
              </div>
              <div style={{display:'flex',gap:10,marginTop:4}}>
                <button onClick={()=>setStep(2)} style={{padding:'13px 20px',background:'#F8F7FA',border:`1px solid ${C.border}`,borderRadius:8,fontFamily:'inherit',cursor:'pointer',fontWeight:600,color:C.text}}>← رجوع</button>
                <button onClick={submit} disabled={saving||!form.full_name.trim()} style={{flex:1,padding:'13px',background:saving?C.muted:C.orange,border:'none',borderRadius:8,color:'#fff',fontWeight:700,fontSize:15,cursor:saving?'wait':'pointer',fontFamily:'inherit'}}>
                  {saving?'⏳ جاري الحفظ...':'🚀 إنشاء ملفي كمؤثر'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
