'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState, useMemo } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'

const C = {
  navy:'#1E0A3C', orange:'#F05537', text:'#39364F',
  muted:'#6F7287', border:'#DBDAE3', bg:'#FAFAFA', card:'#FFFFFF', green:'#3A7D0A', red:'#DC2626'
}
const inp: React.CSSProperties = {
  width:'100%', padding:'10px 14px', border:`1px solid ${C.border}`, borderRadius:8,
  fontSize:14, outline:'none', fontFamily:'inherit', color:C.text,
  background:C.card, boxSizing:'border-box'
}
const lbl: React.CSSProperties = { fontSize:12, fontWeight:600, color:C.text, display:'block', marginBottom:6 }
const section: React.CSSProperties = {
  background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:24, marginBottom:16
}
const sectionTitle: React.CSSProperties = { fontSize:15, fontWeight:800, color:C.navy, margin:'0 0 4px' }
const sectionSub: React.CSSProperties = { fontSize:12, color:C.muted, margin:'0 0 20px' }

const CITIES = ['الرياض','جدة','الدمام','مكة المكرمة','المدينة المنورة','الخبر','تبوك','أبها']
const INDUSTRIES = ['فعاليات وترفيه','تعليم وتدريب','أعمال ومؤتمرات','رياضة ونشاط','ثقافة وفنون','صحة وطب','حكومة وقطاع عام','أخرى']
const ACCENT_COLORS = ['#F05537','#1E0A3C','#2E8B57','#1DA1F2','#E91E63','#FF6B35','#6C5CE7','#00B894','#B07000','#E44D26']
const SOCIALS = [
  { k:'social_instagram', l:'📷 إنستغرام', ph:'username', prefix:'instagram.com/' },
  { k:'social_twitter',   l:'𝕏 تويتر / X',  ph:'username', prefix:'x.com/' },
  { k:'social_tiktok',    l:'🎵 تيك توك',   ph:'username', prefix:'tiktok.com/@' },
  { k:'social_snapchat',  l:'👻 سناب شات',  ph:'username', prefix:'snapchat.com/add/' },
  { k:'social_linkedin',  l:'💼 لينكدإن',   ph:'company-name', prefix:'linkedin.com/company/' },
  { k:'social_whatsapp',  l:'💬 واتساب',    ph:'966xxxxxxxxx', prefix:'wa.me/' },
]
const ROLES: Record<string,{label:string;color:string;bg:string}> = {
  owner:   { label:'مالك',  color:'#5B3FA0', bg:'#EDE9F7' },
  admin:   { label:'مدير',  color:C.navy,    bg:'#E8E4F0' },
  editor:  { label:'محرر',  color:C.orange,  bg:'#FEF0ED' },
  scanner: { label:'ماسح',  color:C.green,   bg:'#EAF7E0' },
  viewer:  { label:'مشاهد', color:C.muted,   bg:'#F1F1F1' },
}

type Org = {
  id:string; name:string; name_ar:string|null; email:string|null; phone:string|null
  logo_url:string|null; cover_image:string|null; website:string|null; city:string|null
  industry:string|null; description:string|null; plan:string|null; status:string|null
  max_members:number|null; owner_id:string|null; created_at:string; tagline:string|null
  slug:string|null; accent_color:string|null; catalog_enabled:boolean|null
  social_instagram:string|null; social_twitter:string|null; social_whatsapp:string|null
  social_tiktok:string|null; social_snapchat:string|null; social_linkedin:string|null
  custom_domain:string|null; license_number:string|null; vat_number:string|null
  features:Record<string,boolean>|null
}
type Member = { id:string; email:string; full_name:string|null; role:string|null; status:string|null; created_at:string }

function SaveBtn({ saving, saved, label='💾 حفظ التغييرات', onClick }: { saving:boolean; saved:boolean; label?:string; onClick:()=>void }) {
  return (
    <button onClick={onClick} disabled={saving} style={{
      padding:'11px 22px', border:'none', borderRadius:8,
      background: saved ? C.green : C.orange,
      color:'#fff', fontWeight:700, fontSize:13, cursor: saving?'wait':'pointer',
      fontFamily:'inherit', transition:'background .3s', marginTop:4
    }}>
      {saving ? '⏳ جاري الحفظ...' : saved ? '✅ تم الحفظ' : label}
    </button>
  )
}

export default function SettingsPage() {
  const sb = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), [])
  const router = useRouter()

  const [user, setUser]       = useState<any>(null)
  const [org, setOrg]         = useState<Org|null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)

  // Section saving states
  const [savingSection, setSavingSection] = useState<string|null>(null)
  const [savedSection,  setSavedSection]  = useState<string|null>(null)

  // Form state — single object mirrors org fields
  const [f, setF] = useState<Record<string,any>>({})
  const set = (k:string, v:any) => setF(prev => ({...prev, [k]:v}))

  // Create org
  const [creating, setCreating] = useState(false)
  const [newOrg, setNewOrg]     = useState({ name:'', name_ar:'', email:'', phone:'', city:'الرياض', industry:'فعاليات وترفيه' })
  const setN = (k:string, v:string) => setNewOrg(prev => ({...prev,[k]:v}))
  const [creatingLoading, setCreatingLoading] = useState(false)

  // Team invite
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole,  setInviteRole]  = useState('editor')
  const [inviting, setInviting]       = useState(false)
  const [inviteOk, setInviteOk]       = useState(false)

  useEffect(() => {
    sb.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push('/login'); return }
      setUser(data.user)

      const [ownerRes, memberRes] = await Promise.all([
        sb.from('organizations').select('*').eq('owner_id', data.user.id).limit(1),
        sb.from('org_members').select('org_id').eq('user_id', data.user.id).eq('status','active').limit(1)
      ])
      let o: any = ownerRes.data?.[0] || null
      if (!o && memberRes.data?.[0]?.org_id) {
        const { data: od } = await sb.from('organizations').select('*').eq('id', memberRes.data[0].org_id).limit(1)
        o = od?.[0] || null
      }
      if (o) {
        setOrg(o)
        setF({
          name:             o.name||'',
          name_ar:          o.name_ar||'',
          email:            o.email||'',
          phone:            o.phone||'',
          website:          o.website||'',
          city:             o.city||'الرياض',
          industry:         o.industry||'فعاليات وترفيه',
          description:      o.description||'',
          logo_url:         o.logo_url||'',
          cover_image:      o.cover_image||'',
          tagline:          o.tagline||'',
          accent_color:     o.accent_color||'#F05537',
          slug:             o.slug||'',
          catalog_enabled:  o.catalog_enabled||false,
          custom_domain:    o.custom_domain||'',
          license_number:   o.license_number||'',
          vat_number:       o.vat_number||'',
          social_instagram: o.social_instagram||'',
          social_twitter:   o.social_twitter||'',
          social_whatsapp:  o.social_whatsapp||'',
          social_tiktok:    o.social_tiktok||'',
          social_snapchat:  o.social_snapchat||'',
          social_linkedin:  o.social_linkedin||'',
        })
        const { data: mems } = await sb.from('org_members').select('*').eq('org_id', o.id).order('created_at')
        setMembers(mems||[])
      }
      setLoading(false)
    })
  }, [])

  async function saveSection(sectionId: string, fields: Record<string,any>) {
    if (!org) return
    setSavingSection(sectionId)
    const { error } = await sb.from('organizations').update({ ...fields, updated_at: new Date().toISOString() }).eq('id', org.id)
    if (!error) {
      setOrg((o:any) => ({...o,...fields}))
      setSavedSection(sectionId)
      setTimeout(() => setSavedSection(null), 2500)
    } else alert('خطأ في الحفظ: ' + error.message)
    setSavingSection(null)
  }

  async function createOrg() {
    if (!newOrg.name.trim()) { alert('يرجى إدخال اسم المنظمة'); return }
    setCreatingLoading(true)
    try {
      const { data: o, error } = await sb.from('organizations').insert({
        name: newOrg.name.trim(), name_ar: newOrg.name_ar.trim()||null,
        email: newOrg.email||null, phone: newOrg.phone||null,
        city: newOrg.city, industry: newOrg.industry,
        owner_id: user.id, status:'active', plan:'free', max_members:5,
      }).select().single()
      if (error) throw error
      await sb.from('org_members').insert({
        org_id:o.id, user_id:user.id, email:user.email,
        full_name:user.user_metadata?.full_name||'', role:'owner', status:'active',
      })
      await sb.from('role_presets').insert([
        { org_id:o.id, name:'Admin',   name_ar:'مدير',  role_key:'admin',   permissions:{events:'all',team:'manage',reports:true},  color:'#1E0A3C', is_system:true },
        { org_id:o.id, name:'Editor',  name_ar:'محرر',  role_key:'editor',  permissions:{events:'edit',team:'view',reports:false},    color:'#F05537', is_system:true },
        { org_id:o.id, name:'Scanner', name_ar:'ماسح',  role_key:'scanner', permissions:{events:'scan',team:'none',reports:false},    color:'#3A7D0A', is_system:true },
      ])
      window.location.reload()
    } catch(e:any) { alert('خطأ: '+e.message) }
    finally { setCreatingLoading(false) }
  }

  async function inviteMember() {
    if (!inviteEmail.trim()||!org) return
    setInviting(true)
    const { error } = await sb.from('org_members').insert({
      org_id:org.id, email:inviteEmail.trim().toLowerCase(), role:inviteRole,
      status:'invited', invited_by:user.id,
      invite_token:crypto.randomUUID(),
      invite_expires_at:new Date(Date.now()+7*24*60*60*1000).toISOString(),
    })
    if (!error) {
      const { data:mems } = await sb.from('org_members').select('*').eq('org_id',org.id).order('created_at')
      setMembers(mems||[])
      setInviteEmail(''); setInviteOk(true)
      setTimeout(()=>setInviteOk(false),3000)
    }
    setInviting(false)
  }

  async function removeMember(id:string) {
    if (!confirm('هل تريد إزالة هذا العضو؟')) return
    await sb.from('org_members').delete().eq('id',id)
    setMembers(m=>m.filter(x=>x.id!==id))
  }

  if (loading) return <div style={{padding:60,textAlign:'center',color:C.muted,direction:'rtl'}}>⏳ جاري التحميل...</div>

  // ── CREATE ORG ──────────────────────────────────────────────────────────────
  if (!org) return (
    <div style={{minHeight:'100vh',background:C.bg,direction:'rtl',padding:'40px 24px'}}>
      <div style={{maxWidth:520,margin:'0 auto'}}>
        <h1 style={{fontSize:24,fontWeight:800,color:C.navy,margin:'0 0 6px'}}>إنشاء منظمتك</h1>
        <p style={{color:C.muted,fontSize:13,margin:'0 0 24px'}}>أنشئ منظمتك الأولى لبدء إدارة الفعاليات</p>
        <div style={section}>
          <div style={{display:'grid',gap:12}}>
            <div><label style={lbl}>اسم المنظمة *</label><input value={newOrg.name} onChange={e=>setN('name',e.target.value)} placeholder="مثال: شركة الأحداث الكبرى" style={inp}/></div>
            <div><label style={lbl}>الاسم بالعربية</label><input value={newOrg.name_ar} onChange={e=>setN('name_ar',e.target.value)} placeholder="اختياري" style={inp}/></div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
              <div><label style={lbl}>البريد</label><input type="email" value={newOrg.email} onChange={e=>setN('email',e.target.value)} style={inp}/></div>
              <div><label style={lbl}>الجوال</label><input value={newOrg.phone} onChange={e=>setN('phone',e.target.value)} style={inp}/></div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
              <div><label style={lbl}>المدينة</label><select value={newOrg.city} onChange={e=>setN('city',e.target.value)} style={inp}>{CITIES.map(c=><option key={c}>{c}</option>)}</select></div>
              <div><label style={lbl}>القطاع</label><select value={newOrg.industry} onChange={e=>setN('industry',e.target.value)} style={inp}>{INDUSTRIES.map(i=><option key={i}>{i}</option>)}</select></div>
            </div>
          </div>
          <button onClick={createOrg} disabled={creatingLoading||!newOrg.name.trim()} style={{
            marginTop:16,width:'100%',padding:'13px',border:'none',borderRadius:8,
            background:newOrg.name.trim()?C.navy:'#DBDAE3',color:'#fff',fontWeight:700,fontSize:15,
            cursor:newOrg.name.trim()?'pointer':'not-allowed',fontFamily:'inherit'
          }}>{creatingLoading?'⏳ جاري الإنشاء...':'🏢 إنشاء المنظمة'}</button>
        </div>
      </div>
    </div>
  )

  const isOwner = org.owner_id === user?.id
  const activeMem = members.filter(m=>m.status==='active').length

  // ── MAIN SETTINGS ────────────────────────────────────────────────────────────
  return (
    <div style={{minHeight:'100vh',background:C.bg,direction:'rtl',padding:'28px 24px',maxWidth:800,margin:'0 auto'}}>

      {/* Page header */}
      <div style={{marginBottom:24}}>
        <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:6}}>
          <div style={{width:44,height:44,background:'linear-gradient(135deg,#1E0A3C,#3D1A78)',borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:800,fontSize:20}}>
            {org.name?.[0]||'م'}
          </div>
          <div>
            <h1 style={{fontSize:22,fontWeight:800,color:C.navy,margin:0}}>{org.name_ar||org.name}</h1>
            <span style={{fontSize:11,fontWeight:700,background:'#EDE9F7',color:'#5B3FA0',padding:'2px 10px',borderRadius:20}}>{org.plan||'free'}</span>
          </div>
        </div>
        <p style={{color:C.muted,fontSize:13,margin:0}}>قم بتحديث معلومات منظمتك وإعدادات الكتالوج والفريق من هنا مباشرةً</p>
      </div>

      {/* ── 1. الصور والهوية البصرية ─────────────────────────────────────── */}
      <div style={section}>
        <h2 style={sectionTitle}>🖼️ الصور والهوية البصرية</h2>
        <p style={sectionSub}>الشعار وصورة الغلاف ولون التمييز — تظهر في الكتالوج وصفحات الفعاليات</p>

        {/* Logo */}
        <div style={{marginBottom:16}}>
          <label style={lbl}>شعار المنظمة (Logo URL)</label>
          <div style={{display:'flex',gap:10,alignItems:'center'}}>
            {f.logo_url
              ? <img src={f.logo_url} alt="" onError={e=>(e.currentTarget.style.display='none')}
                  style={{width:52,height:52,borderRadius:10,objectFit:'cover',border:`1px solid ${C.border}`,flexShrink:0}}/>
              : <div style={{width:52,height:52,background:'#EDE9F7',borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',color:C.muted,fontSize:22,flexShrink:0}}>🏢</div>
            }
            <div style={{flex:1}}>
              <input value={f.logo_url} onChange={e=>set('logo_url',e.target.value)} placeholder="https://..." style={{...inp,fontFamily:'monospace',fontSize:12}}/>
              <p style={{fontSize:11,color:C.muted,margin:'4px 0 0'}}>ارفع الصورة على <a href="https://imgbb.com" target="_blank" style={{color:C.orange}}>imgbb.com</a> أو Cloudinary ثم الصق الرابط</p>
            </div>
          </div>
        </div>

        {/* Cover */}
        <div style={{marginBottom:16}}>
          <label style={lbl}>صورة الغلاف (Cover Image URL)</label>
          <div style={{display:'flex',gap:10,alignItems:'center'}}>
            {f.cover_image
              ? <img src={f.cover_image} alt="" onError={e=>(e.currentTarget.style.display='none')}
                  style={{width:100,height:52,borderRadius:10,objectFit:'cover',border:`1px solid ${C.border}`,flexShrink:0}}/>
              : <div style={{width:100,height:52,background:'#EDE9F7',borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',color:C.muted,fontSize:12,flexShrink:0}}>لا توجد صورة</div>
            }
            <div style={{flex:1}}>
              <input value={f.cover_image} onChange={e=>set('cover_image',e.target.value)} placeholder="https://... (1920×600px)" style={{...inp,fontFamily:'monospace',fontSize:12}}/>
              <p style={{fontSize:11,color:C.muted,margin:'4px 0 0'}}>تظهر كخلفية كبيرة في رأس الكتالوج</p>
            </div>
          </div>
        </div>

        {/* Accent Color */}
        <div style={{marginBottom:20}}>
          <label style={lbl}>لون التمييز (Accent Color)</label>
          <div style={{display:'flex',gap:10,alignItems:'center',flexWrap:'wrap'}}>
            <input type="color" value={f.accent_color||'#F05537'} onChange={e=>set('accent_color',e.target.value)}
              style={{width:44,height:38,border:`1px solid ${C.border}`,borderRadius:6,cursor:'pointer',padding:2}}/>
            <code style={{fontSize:12,color:C.muted}}>{f.accent_color||'#F05537'}</code>
            {ACCENT_COLORS.map(c=>(
              <button key={c} onClick={()=>set('accent_color',c)} title={c} style={{
                width:28,height:28,borderRadius:'50%',background:c,cursor:'pointer',flexShrink:0,
                border:(f.accent_color===c)?'3px solid #000':'2px solid transparent',outline:'none'
              }}/>
            ))}
          </div>
        </div>

        <SaveBtn
          saving={savingSection==='visual'}
          saved={savedSection==='visual'}
          label="💾 حفظ الصور والألوان"
          onClick={()=>saveSection('visual',{ logo_url:f.logo_url||null, cover_image:f.cover_image||null, accent_color:f.accent_color||'#F05537' })}
        />
      </div>

      {/* ── 2. معلومات المنظمة ───────────────────────────────────────────── */}
      <div style={section}>
        <h2 style={sectionTitle}>🏢 معلومات المنظمة</h2>
        <p style={sectionSub}>الاسم، الشعار التعريفي، المدينة، القطاع، والوصف العام</p>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
          <div><label style={lbl}>الاسم بالإنجليزية *</label><input value={f.name} onChange={e=>set('name',e.target.value)} style={inp}/></div>
          <div><label style={lbl}>الاسم بالعربية</label><input value={f.name_ar} onChange={e=>set('name_ar',e.target.value)} style={inp}/></div>
        </div>
        <div style={{marginBottom:12}}>
          <label style={lbl}>الشعار التعريفي (Tagline)</label>
          <input value={f.tagline} onChange={e=>set('tagline',e.target.value)} placeholder="جملة قصيرة تصف منظمتك — تظهر في الكتالوج" style={inp}/>
        </div>
        <div style={{marginBottom:12}}>
          <label style={lbl}>نبذة عن المنظمة</label>
          <textarea value={f.description} onChange={e=>set('description',e.target.value)} rows={3} placeholder="وصف مختصر يظهر للزوار في الكتالوج..." style={{...inp,resize:'vertical'}}/>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12,marginBottom:12}}>
          <div><label style={lbl}>المدينة</label><select value={f.city} onChange={e=>set('city',e.target.value)} style={inp}>{CITIES.map(c=><option key={c}>{c}</option>)}</select></div>
          <div><label style={lbl}>القطاع</label><select value={f.industry} onChange={e=>set('industry',e.target.value)} style={inp}>{INDUSTRIES.map(i=><option key={i}>{i}</option>)}</select></div>
          <div><label style={lbl}>الموقع الإلكتروني</label><input value={f.website} onChange={e=>set('website',e.target.value)} placeholder="https://..." style={inp}/></div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:20}}>
          <div><label style={lbl}>البريد الإلكتروني</label><input type="email" value={f.email} onChange={e=>set('email',e.target.value)} style={inp}/></div>
          <div><label style={lbl}>رقم الجوال</label><input value={f.phone} onChange={e=>set('phone',e.target.value)} style={inp}/></div>
        </div>

        <SaveBtn
          saving={savingSection==='info'}
          saved={savedSection==='info'}
          label="💾 حفظ معلومات المنظمة"
          onClick={()=>saveSection('info',{ name:f.name.trim(), name_ar:f.name_ar.trim()||null, tagline:f.tagline||null, description:f.description||null, city:f.city||null, industry:f.industry||null, website:f.website||null, email:f.email||null, phone:f.phone||null })}
        />
      </div>

      {/* ── 3. حسابات التواصل الاجتماعي ─────────────────────────────────── */}
      <div style={section}>
        <h2 style={sectionTitle}>📲 حسابات التواصل الاجتماعي</h2>
        <p style={sectionSub}>تظهر كأيقونات قابلة للضغط في الكتالوج وصفحات الفعاليات</p>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:20}}>
          {SOCIALS.map(({k,l,ph})=>(
            <div key={k}>
              <label style={lbl}>{l}</label>
              <div style={{display:'flex',alignItems:'center',gap:6}}>
                {k!=='social_whatsapp' && <span style={{fontSize:11,color:C.muted,flexShrink:0}}>@</span>}
                <input
                  value={f[k]||''}
                  onChange={e=>set(k, e.target.value.replace('@',''))}
                  placeholder={ph}
                  style={inp}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Live preview */}
        {SOCIALS.some(s=>f[s.k]) && (
          <div style={{background:'#F8F7FA',borderRadius:10,padding:12,marginBottom:16}}>
            <p style={{fontSize:11,fontWeight:700,color:C.muted,margin:'0 0 8px'}}>معاينة الأيقونات:</p>
            <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
              {SOCIALS.filter(s=>f[s.k]).map(s=>(
                <span key={s.k} style={{display:'flex',alignItems:'center',gap:5,padding:'5px 12px',background:C.card,border:`1px solid ${C.border}`,borderRadius:20,fontSize:12,color:C.text,fontWeight:600}}>
                  {s.l.split(' ')[0]} <span style={{color:C.muted}}>{f[s.k]}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        <SaveBtn
          saving={savingSection==='social'}
          saved={savedSection==='social'}
          label="💾 حفظ حسابات التواصل"
          onClick={()=>saveSection('social',{
            social_instagram:f.social_instagram||null,
            social_twitter:f.social_twitter||null,
            social_whatsapp:f.social_whatsapp||null,
            social_tiktok:f.social_tiktok||null,
            social_snapchat:f.social_snapchat||null,
            social_linkedin:f.social_linkedin||null,
          })}
        />
      </div>

      {/* ── 4. البيانات القانونية ────────────────────────────────────────── */}
      <div style={section}>
        <h2 style={sectionTitle}>📄 البيانات القانونية</h2>
        <p style={sectionSub}>رقم الترخيص والرقم الضريبي — تظهر في الفواتير والكتالوج</p>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:20}}>
          <div>
            <label style={lbl}>رقم الترخيص (سياحي / تجاري)</label>
            <input value={f.license_number} onChange={e=>set('license_number',e.target.value)} placeholder="مثال: 73106434" style={{...inp,fontFamily:'monospace'}}/>
          </div>
          <div>
            <label style={lbl}>الرقم الضريبي (VAT)</label>
            <input value={f.vat_number} onChange={e=>set('vat_number',e.target.value)} placeholder="مثال: 314132175300003" style={{...inp,fontFamily:'monospace'}}/>
          </div>
        </div>

        <SaveBtn
          saving={savingSection==='legal'}
          saved={savedSection==='legal'}
          label="💾 حفظ البيانات القانونية"
          onClick={()=>saveSection('legal',{ license_number:f.license_number||null, vat_number:f.vat_number||null })}
        />
      </div>

      {/* ── 5. الكتالوج العام والدومين ───────────────────────────────────── */}
      <div style={section}>
        <h2 style={sectionTitle}>🌐 الكتالوج العام والدومين</h2>
        <p style={sectionSub}>الرابط المختصر، الدومين الخاص، وتفعيل الصفحة العامة</p>

        {/* Enable toggle */}
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 14px',background:'#F8F7FA',borderRadius:10,marginBottom:16,border:`1px solid ${C.border}`}}>
          <div>
            <p style={{fontWeight:700,color:C.text,margin:0,fontSize:13}}>تفعيل الكتالوج العام</p>
            <p style={{fontSize:11,color:C.muted,margin:'2px 0 0'}}>صفحة عامة تعرض فعالياتك للجمهور بدون تسجيل دخول</p>
          </div>
          <div onClick={async()=>{
            const nv = !f.catalog_enabled
            set('catalog_enabled', nv)
            await sb.from('organizations').update({ catalog_enabled:nv }).eq('id', org.id)
            setOrg((o:any) => ({...o, catalog_enabled:nv}))
          }} style={{width:48,height:26,borderRadius:50,cursor:'pointer',position:'relative',background:f.catalog_enabled?C.orange:'#DBDAE3',transition:'background .2s',flexShrink:0}}>
            <div style={{position:'absolute',top:3,width:20,height:20,borderRadius:'50%',background:'#fff',transition:'right .2s,left .2s',right:f.catalog_enabled?3:'auto',left:f.catalog_enabled?'auto':3,boxShadow:'0 1px 4px rgba(0,0,0,.2)'}}/>
          </div>
        </div>

        {/* Slug */}
        <div style={{marginBottom:12}}>
          <label style={lbl}>الرابط المختصر (Slug) *</label>
          <div style={{display:'flex',gap:8,alignItems:'center'}}>
            <span style={{fontSize:12,color:C.muted,whiteSpace:'nowrap',background:'#F8F7FA',padding:'10px 12px',border:`1px solid ${C.border}`,borderRadius:8}}>evento.app/org/</span>
            <input value={f.slug} onChange={e=>set('slug',e.target.value.toLowerCase().replace(/[^a-z0-9\-]/g,''))} placeholder="your-slug" style={{...inp,flex:1,fontFamily:'monospace'}}/>
          </div>
          <p style={{fontSize:11,color:C.muted,margin:'4px 0 0'}}>أحرف إنجليزية صغيرة وأرقام وشرطة فقط</p>
        </div>

        {/* Show live link if enabled */}
        {f.catalog_enabled && f.slug && (
          <div style={{background:'#EAF7E0',borderRadius:8,padding:'10px 14px',border:'1px solid #C3E6C3',marginBottom:12}}>
            <p style={{fontSize:11,color:'#1A5A00',fontWeight:700,margin:'0 0 4px'}}>🔗 رابط الكتالوج الخاص بك:</p>
            <div style={{display:'flex',gap:8,alignItems:'center'}}>
              <code style={{fontSize:12,color:C.navy,flex:1,fontFamily:'monospace'}}>
                {typeof window!=='undefined'?window.location.origin:''}/org/{f.slug}
              </code>
              <button onClick={()=>navigator.clipboard?.writeText(window.location.origin+'/org/'+f.slug)}
                style={{padding:'4px 10px',background:C.green,border:'none',borderRadius:6,color:'#fff',fontSize:11,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>نسخ</button>
              <a href={`/org/${f.slug}`} target="_blank" style={{padding:'4px 10px',background:C.navy,borderRadius:6,color:'#fff',fontSize:11,fontWeight:700,textDecoration:'none'}}>فتح ↗</a>
            </div>
          </div>
        )}

        {/* Custom domain */}
        <div style={{marginBottom:20}}>
          <label style={lbl}>الدومين الخاص (Custom Domain)</label>
          <input value={f.custom_domain} onChange={e=>set('custom_domain',e.target.value)} placeholder="events.yourcompany.com" style={{...inp,fontFamily:'monospace'}}/>
          <p style={{fontSize:11,color:C.muted,margin:'4px 0 0'}}>أضف CNAME في DNS يشير لـ <code style={{background:'#F8F7FA',padding:'1px 5px',borderRadius:3}}>cname.vercel-dns.com</code></p>
        </div>

        <SaveBtn
          saving={savingSection==='catalog'}
          saved={savedSection==='catalog'}
          label="💾 حفظ إعدادات الكتالوج"
          onClick={()=>saveSection('catalog',{ slug:f.slug||null, catalog_enabled:f.catalog_enabled, custom_domain:f.custom_domain||null })}
        />
      </div>

      {/* ── 6. الفريق ───────────────────────────────────────────────────── */}
      <div style={section}>
        <h2 style={sectionTitle}>👥 الفريق</h2>
        <p style={sectionSub}>دعوة الأعضاء وإدارة صلاحياتهم — {activeMem}/{org.max_members||5} عضو نشط</p>

        {isOwner && (
          <div style={{background:'#F8F7FA',borderRadius:10,padding:14,marginBottom:16,border:`1px solid ${C.border}`}}>
            <p style={{fontWeight:700,color:C.navy,fontSize:13,margin:'0 0 10px'}}>➕ دعوة عضو جديد</p>
            <div style={{display:'grid',gridTemplateColumns:'1fr auto auto',gap:10,alignItems:'flex-end'}}>
              <div>
                <label style={lbl}>البريد الإلكتروني</label>
                <input value={inviteEmail} onChange={e=>setInviteEmail(e.target.value)} onKeyDown={e=>e.key==='Enter'&&inviteMember()} type="email" placeholder="colleague@company.com" style={inp}/>
              </div>
              <div>
                <label style={lbl}>الدور</label>
                <select value={inviteRole} onChange={e=>setInviteRole(e.target.value)} style={{...inp,width:'auto',minWidth:110}}>
                  {Object.entries(ROLES).filter(([k])=>k!=='owner').map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
              <button onClick={inviteMember} disabled={inviting||!inviteEmail.trim()} style={{
                padding:'10px 18px',background:inviteOk?C.green:C.navy,border:'none',borderRadius:8,
                color:'#fff',fontWeight:700,fontSize:13,cursor:'pointer',fontFamily:'inherit',whiteSpace:'nowrap',height:42
              }}>{inviting?'⏳...':inviteOk?'✅ تمت':'إرسال الدعوة'}</button>
            </div>
          </div>
        )}

        <div style={{border:`1px solid ${C.border}`,borderRadius:10,overflow:'hidden'}}>
          {members.length===0
            ? <p style={{padding:24,textAlign:'center',color:C.muted,fontSize:13}}>لا يوجد أعضاء بعد</p>
            : members.map((m,i)=>{
              const r = ROLES[m.role||'viewer']||ROLES.viewer
              return (
                <div key={m.id} style={{display:'flex',alignItems:'center',gap:12,padding:'12px 16px',borderBottom:i<members.length-1?`1px solid ${C.border}`:'none'}}>
                  <div style={{width:38,height:38,background:'linear-gradient(135deg,#B4A7D6,#7B4FBF)',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:800,fontSize:16,flexShrink:0}}>
                    {m.full_name?.[0]||m.email[0].toUpperCase()}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:'flex',alignItems:'center',gap:6}}>
                      <span style={{fontWeight:700,color:C.navy,fontSize:13}}>{m.full_name||m.email}</span>
                      <span style={{fontSize:10,fontWeight:700,padding:'2px 8px',borderRadius:6,background:r.bg,color:r.color}}>{r.label}</span>
                      {m.status==='invited'&&<span style={{fontSize:10,background:'#FFF8E8',color:'#B07000',padding:'2px 7px',borderRadius:6,fontWeight:600}}>دعوة معلقة</span>}
                    </div>
                    <p style={{fontSize:11,color:C.muted,margin:'2px 0 0',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{m.email}</p>
                  </div>
                  {isOwner && m.role!=='owner' && (
                    <button onClick={()=>removeMember(m.id)} style={{padding:'4px 10px',background:'#FEF2F2',border:'none',borderRadius:6,color:C.red,fontWeight:700,fontSize:11,cursor:'pointer',fontFamily:'inherit'}}>إزالة</button>
                  )}
                </div>
              )
            })
          }
        </div>
      </div>

      {/* ── 7. الخروج ───────────────────────────────────────────────────── */}
      {isOwner && (
        <div style={{background:C.card,border:`1px solid #F5C0B0`,borderRadius:14,padding:20}}>
          <h2 style={{fontSize:14,fontWeight:700,color:'#B91C1C',margin:'0 0 8px'}}>⚠️ منطقة الخطر</h2>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div>
              <p style={{fontWeight:600,color:C.text,margin:0,fontSize:13}}>تسجيل الخروج من الحساب</p>
              <p style={{fontSize:11,color:C.muted,margin:'2px 0 0'}}>ستحتاج لإعادة تسجيل الدخول</p>
            </div>
            <button onClick={async()=>{await sb.auth.signOut(); router.push('/login')}} style={{padding:'8px 18px',border:`1px solid ${C.border}`,borderRadius:6,background:C.card,fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'inherit',color:C.text}}>
              تسجيل خروج
            </button>
          </div>
        </div>
      )}

    </div>
  )
}
