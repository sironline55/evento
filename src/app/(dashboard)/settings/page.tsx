'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState, useMemo } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'

const C = {
  navy:'#1E0A3C', orange:'#F05537', text:'#39364F',
  muted:'#6F7287', border:'#DBDAE3', bg:'#FAFAFA', card:'#FFFFFF', green:'#3A7D0A'
}
const inp: React.CSSProperties = {
  width:'100%', padding:'10px 14px', border:`1px solid ${C.border}`, borderRadius:8,
  fontSize:14, outline:'none', fontFamily:'inherit', color:C.text,
  background:C.card, boxSizing:'border-box'
}
const lbl: React.CSSProperties = { fontSize:12, fontWeight:600, color:C.text, display:'block', marginBottom:5 }

const CITIES = ['الرياض','جدة','الدمام','مكة المكرمة','المدينة المنورة','الخبر','تبوك','أبها']
const INDUSTRIES = ['فعاليات وترفيه','تعليم وتدريب','أعمال ومؤتمرات','رياضة ونشاط','ثقافة وفنون','صحة وطب','حكومة وقطاع عام','أخرى']
const ROLES: Record<string,{label:string;color:string;bg:string;perms:string[]}> = {
  owner:   { label:'مالك',    color:'#5B3FA0', bg:'#EDE9F7', perms:['كل الصلاحيات'] },
  admin:   { label:'مدير',    color:C.navy,    bg:'#E8E4F0', perms:['إدارة الفعاليات','إدارة الفريق','التقارير'] },
  editor:  { label:'محرر',    color:C.orange,  bg:'#FEF0ED', perms:['إنشاء الفعاليات','تعديل الفعاليات'] },
  scanner: { label:'ماسح',    color:C.green,   bg:'#EAF7E0', perms:['مسح التذاكر فقط'] },
  viewer:  { label:'مشاهد',   color:C.muted,   bg:'#F1F1F1', perms:['قراءة التقارير فقط'] },
}

type Org    = { id:string; name:string; name_ar:string|null; email:string|null; phone:string|null; logo_url:string|null; website:string|null; city:string|null; industry:string|null; description:string|null; plan:string|null; status:string|null; max_members:number|null; owner_id:string|null; created_at:string }
type Member = { id:string; email:string; full_name:string|null; role:string|null; status:string|null; invited_by:string|null; created_at:string; last_active_at:string|null }

const TABS = [
  { id:'org',      icon:'🏢', label:'المنظمة'      },
  { id:'identity', icon:'🪪', label:'هوية المؤسسة'  },
  { id:'catalog',  icon:'🌐', label:'الكتالوج'      },
  { id:'team',     icon:'👥', label:'الفريق'        },
  { id:'roles',    icon:'🎭', label:'الأدوار'       },
  { id:'plan',     icon:'💳', label:'الباقة'        },
]

export default function SettingsPage() {
  const sb = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), [])
  const router = useRouter()

  const [tab, setTab]       = useState('org')
  const [user, setUser]     = useState<any>(null)
  const [org, setOrg]       = useState<Org|null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [rolePresets, setRolePresets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [saved, setSaved]     = useState(false)

  // Create org form
  const [creating, setCreating] = useState(false)
  const [newOrg, setNewOrg] = useState({ name:'', name_ar:'', email:'', phone:'', city:'الرياض', industry:'فعاليات وترفيه', description:'' })
  const setN = (k:string, v:string) => setNewOrg(f => ({...f,[k]:v}))

  // Edit org form
  const [editing, setEditing] = useState(false)
  const [editOrg, setEditOrg] = useState<any>({})
  const setE = (k:string, v:string) => setEditOrg((f:any) => ({...f,[k]:v}))

  // Invite
  const [inviteEmail, setInviteEmail]   = useState('')
  const [inviteRole, setInviteRole]     = useState('editor')
  const [inviting, setInviting]         = useState(false)
  const [inviteSuccess, setInviteSuccess] = useState(false)

  useEffect(() => {
    sb.auth.getUser().then(async ({ data }) => {
      if (!data.user) return
      setUser(data.user)
      // Load org where user is owner or member
      const { data: memberOf } = await sb.from('org_members')
        .select('org_id').eq('user_id', data.user.id).limit(1).maybeSingle()
      let orgId = memberOf?.org_id
      if (!orgId) {
        // Check if owner
        const { data: owned } = await sb.from('organizations')
          .select('id').eq('owner_id', data.user.id).limit(1).maybeSingle()
        orgId = owned?.id
      }
      if (orgId) {
        const { data: o } = await sb.from('organizations').select('*').eq('id', orgId).single()
        if (o) {
          setOrg(o)
          const hasIdentity = o.features?.org_identity === true
          if (!hasIdentity && tab === 'identity') setTab('org')
          setEditOrg({ name:o.name||'', name_ar:o.name_ar||'', email:o.email||'', phone:o.phone||'', website:o.website||'', city:o.city||'', industry:o.industry||'', description:o.description||'', logo_url:o.logo_url||'', cover_image:o.cover_image||'', slug:o.slug||'', tagline:o.tagline||'', accent_color:o.accent_color||'#F05537', social_instagram:o.social_instagram||'', social_twitter:o.social_twitter||'', social_whatsapp:o.social_whatsapp||'', social_tiktok:(o as any).social_tiktok||'', social_snapchat:(o as any).social_snapchat||'', social_linkedin:(o as any).social_linkedin||'', custom_domain:o.custom_domain||'', license_number:(o as any).license_number||'', vat_number:(o as any).vat_number||'' })
          const [{ data: mems }, { data: presets }] = await Promise.all([
            sb.from('org_members').select('*').eq('org_id', orgId).order('created_at'),
            sb.from('role_presets').select('*').eq('org_id', orgId).order('created_at'),
          ])
          setMembers(mems||[])
          setRolePresets(presets||[])
        }
      }
      setLoading(false)
    })
  }, [])

  async function createOrg() {
    if (!newOrg.name.trim()) { alert('يرجى إدخال اسم المنظمة'); return }
    setSaving(true)
    try {
      const { data: o, error } = await sb.from('organizations').insert({
        name:        newOrg.name.trim(),
        name_ar:     newOrg.name_ar.trim()||null,
        email:       newOrg.email||null,
        phone:       newOrg.phone||null,
        city:        newOrg.city||null,
        industry:    newOrg.industry||null,
        description: newOrg.description||null,
        owner_id:    user.id,
        status:      'active',
        plan:        'free',
        max_members: 5,
      }).select().single()
      if (error) throw error
      // Add owner as member
      await sb.from('org_members').insert({
        org_id:    o.id,
        user_id:   user.id,
        email:     user.email,
        full_name: user.user_metadata?.full_name||'',
        role:      'owner',
        status:    'active',
      })
      // Seed default role presets
      await sb.from('role_presets').insert([
        { org_id:o.id, name:'Admin', name_ar:'مدير', role_key:'admin', permissions:{events:'all',team:'manage',reports:true}, color:'#1E0A3C', is_system:true },
        { org_id:o.id, name:'Editor', name_ar:'محرر', role_key:'editor', permissions:{events:'edit',team:'view',reports:false}, color:'#F05537', is_system:true },
        { org_id:o.id, name:'Scanner', name_ar:'ماسح', role_key:'scanner', permissions:{events:'scan',team:'none',reports:false}, color:'#3A7D0A', is_system:true },
      ])
      setOrg(o); setCreating(false)
      setEditOrg({ name:o.name||'', name_ar:o.name_ar||'', email:o.email||'', phone:o.phone||'', website:'', city:o.city||'', industry:o.industry||'', description:o.description||'' })
      const { data: mems } = await sb.from('org_members').select('*').eq('org_id', o.id)
      const { data: presets } = await sb.from('role_presets').select('*').eq('org_id', o.id)
      setMembers(mems||[]); setRolePresets(presets||[])
    } catch(e:any) { alert('خطأ: '+e.message) }
    finally { setSaving(false) }
  }

  async function saveOrg() {
    if (!org) return
    setSaving(true)
    const { error } = await sb.from('organizations').update({
      name:             editOrg.name.trim(),
      name_ar:          editOrg.name_ar.trim()||null,
      email:            editOrg.email||null,
      phone:            editOrg.phone||null,
      website:          editOrg.website||null,
      city:             editOrg.city||null,
      industry:         editOrg.industry||null,
      description:      editOrg.description||null,
      logo_url:         editOrg.logo_url||null,
      cover_image:      editOrg.cover_image||null,
      slug:             editOrg.slug||null,
      tagline:          editOrg.tagline||null,
      accent_color:     editOrg.accent_color||'#F05537',
      social_instagram: editOrg.social_instagram||null,
      social_twitter:   editOrg.social_twitter||null,
      social_whatsapp:  editOrg.social_whatsapp||null,
      social_tiktok:    editOrg.social_tiktok||null,
      social_snapchat:  editOrg.social_snapchat||null,
      social_linkedin:  editOrg.social_linkedin||null,
      custom_domain:    editOrg.custom_domain||null,
      license_number:   editOrg.license_number||null,
      vat_number:       editOrg.vat_number||null,
      updated_at:       new Date().toISOString(),
    }).eq('id', org.id)
    if (!error) {
      setOrg((o:any) => ({...o,...editOrg}))
      setEditing(false); setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
    setSaving(false)
  }

  async function inviteMember() {
    if (!inviteEmail.trim()||!org) return
    setInviting(true)
    const token = crypto.randomUUID()
    const { error } = await sb.from('org_members').insert({
      org_id:      org.id,
      email:       inviteEmail.trim().toLowerCase(),
      role:        inviteRole,
      status:      'invited',
      invited_by:  user.id,
      invite_token: token,
      invite_expires_at: new Date(Date.now() + 7*24*60*60*1000).toISOString(),
    })
    if (!error) {
      const { data: mems } = await sb.from('org_members').select('*').eq('org_id', org.id).order('created_at')
      setMembers(mems||[])
      setInviteEmail(''); setInviteSuccess(true)
      setTimeout(() => setInviteSuccess(false), 3000)
    }
    setInviting(false)
  }

  async function removeMember(memberId: string) {
    if (!confirm('هل تريد إزالة هذا العضو؟')) return
    await sb.from('org_members').delete().eq('id', memberId)
    setMembers(m => m.filter(x => x.id !== memberId))
  }

  async function changeMemberRole(memberId: string, newRole: string) {
    await sb.from('org_members').update({ role:newRole }).eq('id', memberId)
    setMembers(m => m.map(x => x.id===memberId ? {...x, role:newRole} : x))
  }

  async function signOut() {
    await sb.auth.signOut(); router.push('/login')
  }

  if (loading) return <div style={{padding:40,textAlign:'center',color:C.muted}}>جاري التحميل...</div>

  // ── CREATE ORG SCREEN ─────────────────────────────────────────────
  if (!org) return (
    <div style={{minHeight:'100vh',background:C.bg,direction:'rtl'}}>
      <div style={{background:C.card,borderBottom:`1px solid ${C.border}`,padding:'24px 32px'}}>
        <h1 style={{fontSize:28,fontWeight:800,margin:0,color:C.navy}}>إعدادات المنظمة</h1>
        <p style={{color:C.muted,fontSize:13,margin:'4px 0 0'}}>أنشئ منظمتك الأولى لبدء إدارة الفعاليات بشكل احترافي</p>
      </div>
      <div style={{maxWidth:560,margin:'40px auto',padding:'0 24px'}}>
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:28}}>
          <div style={{textAlign:'center',marginBottom:24}}>
            <div style={{fontSize:48,marginBottom:8}}>🏢</div>
            <h2 style={{fontSize:20,fontWeight:800,color:C.navy,margin:'0 0 6px'}}>أنشئ منظمتك</h2>
            <p style={{color:C.muted,fontSize:13}}>ستتمكن من دعوة فريقك وإدارة الفعاليات معاً</p>
          </div>
          <div style={{display:'grid',gap:12}}>
            <div>
              <label style={lbl}>اسم المنظمة *</label>
              <input value={newOrg.name} onChange={e=>setN('name',e.target.value)} placeholder="مثال: شركة الأحداث الكبرى" style={inp}/>
            </div>
            <div>
              <label style={lbl}>الاسم بالعربية</label>
              <input value={newOrg.name_ar} onChange={e=>setN('name_ar',e.target.value)} placeholder="الاسم بالعربية (اختياري)" style={inp}/>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
              <div>
                <label style={lbl}>البريد الإلكتروني</label>
                <input type="email" value={newOrg.email} onChange={e=>setN('email',e.target.value)} placeholder="info@company.com" style={inp}/>
              </div>
              <div>
                <label style={lbl}>رقم الجوال</label>
                <input value={newOrg.phone} onChange={e=>setN('phone',e.target.value)} placeholder="05xxxxxxxx" style={inp}/>
              </div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
              <div>
                <label style={lbl}>المدينة</label>
                <select value={newOrg.city} onChange={e=>setN('city',e.target.value)} style={inp}>
                  {CITIES.map(c=><option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>القطاع</label>
                <select value={newOrg.industry} onChange={e=>setN('industry',e.target.value)} style={inp}>
                  {INDUSTRIES.map(i=><option key={i}>{i}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label style={lbl}>نبذة عن المنظمة</label>
              <textarea value={newOrg.description} onChange={e=>setN('description',e.target.value)} rows={3} placeholder="ماذا تفعل منظمتك؟" style={{...inp,resize:'vertical'}}/>
            </div>
          </div>
          <button onClick={createOrg} disabled={saving||!newOrg.name.trim()} style={{
            marginTop:20, width:'100%', padding:'13px', border:'none', borderRadius:8,
            background: newOrg.name.trim() ? C.navy : '#DBDAE3',
            color:'#fff', fontWeight:700, fontSize:15, cursor: newOrg.name.trim()?'pointer':'not-allowed', fontFamily:'inherit'
          }}>
            {saving ? '⏳ جاري الإنشاء...' : '🏢 إنشاء المنظمة'}
          </button>
        </div>
      </div>
    </div>
  )

  // ── MAIN SETTINGS ─────────────────────────────────────────────────
  const ownerMember = members.find(m => m.role==='owner')
  const isOwner = org.owner_id === user?.id
  const activeMem = members.filter(m=>m.status==='active').length
  const pendingMem = members.filter(m=>m.status==='invited').length

  return (
    <div style={{minHeight:'100vh',background:C.bg,direction:'rtl'}}>
      {/* Header */}
      <div style={{background:C.card,borderBottom:`1px solid ${C.border}`,padding:'24px 32px 0'}}>
        <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:16}}>
          <div style={{width:46,height:46,background:'linear-gradient(135deg,#1E0A3C,#3D1A78)',borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:800,fontSize:18}}>
            {org.name?.[0]||'م'}
          </div>
          <div>
            <h1 style={{fontSize:22,fontWeight:800,margin:0,color:C.navy}}>{org.name_ar||org.name}</h1>
            <div style={{display:'flex',gap:10,marginTop:3}}>
              <span style={{fontSize:11,color:C.muted}}>{org.city||'—'}</span>
              <span style={{fontSize:11,color:C.muted}}>·</span>
              <span style={{fontSize:11,color:C.muted}}>{org.industry||'—'}</span>
              <span style={{fontSize:11,fontWeight:700,padding:'1px 8px',borderRadius:6,background:'#EDE9F7',color:'#5B3FA0'}}>{org.plan||'free'}</span>
            </div>
          </div>
        </div>
        <div style={{display:'flex',borderTop:`1px solid ${C.border}`}}>
          {TABS.map(t => (
            <button key={t.id} onClick={()=>setTab(t.id)} style={{
              padding:'10px 18px', background:'none', border:'none', cursor:'pointer',
              fontSize:13, fontWeight:tab===t.id?700:400,
              color:tab===t.id?C.orange:C.muted,
              borderBottom:tab===t.id?`2px solid ${C.orange}`:'2px solid transparent',
              marginBottom:-1, fontFamily:'inherit', display:'flex', alignItems:'center', gap:5
            }}><span>{t.icon}</span>{t.label}</button>
          ))}
        </div>
      </div>

      <div style={{maxWidth:760,margin:'0 auto',padding:'24px'}}>

        {/* ── ORG TAB ───────────────────────────────────────────── */}
        {tab==='org' && (
          <div>
            {/* Stats row */}
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:16}}>
              {[
                {icon:'📅',label:'الفعاليات',    value:'—',        note:'لا حد في الخطة الحالية'},
                {icon:'👥',label:'أعضاء الفريق', value:`${activeMem}/${org.max_members||5}`, note:`${pendingMem} دعوة معلقة`},
                {icon:'📊',label:'الحالة',        value:org.status==='active'?'نشط':'—', note:org.plan||'free'},
              ].map(s=>(
                <div key={s.label} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:'14px 16px'}}>
                  <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:4}}>
                    <span style={{fontSize:18}}>{s.icon}</span>
                    <span style={{fontSize:20,fontWeight:800,color:C.navy}}>{s.value}</span>
                  </div>
                  <p style={{fontSize:12,fontWeight:600,color:C.text,margin:'0 0 2px'}}>{s.label}</p>
                  <p style={{fontSize:11,color:C.muted,margin:0}}>{s.note}</p>
                </div>
              ))}
            </div>

            {/* ── SECTION 1: الهوية البصرية ──────────────────────── */}
            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:22,marginBottom:14}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
                <div>
                  <h3 style={{fontSize:15,fontWeight:700,color:C.navy,margin:0}}>🎨 الهوية البصرية</h3>
                  <p style={{fontSize:12,color:C.muted,margin:'2px 0 0'}}>الشعار والغلاف والبيانات الأساسية</p>
                </div>
                <button onClick={()=>setEditing(!editing)} style={{padding:'6px 14px',border:`1px solid ${C.border}`,borderRadius:6,background:editing?C.bg:C.orange,fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'inherit',color:editing?C.text:'#fff',transition:'all .2s'}}>
                  {editing?'إلغاء':'✏️ تعديل'}
                </button>
              </div>
              {editing ? (
                <div style={{display:'grid',gap:14}}>

                  {/* Logo + Cover URLs */}
                  <div style={{background:'#F8F7FA',borderRadius:10,padding:14,display:'grid',gap:10}}>
                    <p style={{fontSize:12,fontWeight:700,color:C.navy,margin:0}}>🖼️ الصور</p>
                    <div>
                      <label style={lbl}>رابط الشعار (Logo URL)</label>
                      <div style={{display:'flex',gap:8,alignItems:'center'}}>
                        {editOrg.logo_url && <img src={editOrg.logo_url} alt="" style={{width:40,height:40,borderRadius:8,objectFit:'cover',border:`1px solid ${C.border}`,flexShrink:0}}/>}
                        <input value={editOrg.logo_url} onChange={e=>setE('logo_url',e.target.value)} placeholder="https://..." style={{...inp,fontFamily:'monospace',fontSize:12}}/>
                      </div>
                      <p style={{fontSize:11,color:C.muted,margin:'4px 0 0'}}>يظهر في الهيدر والكتالوج. ارفع الصورة على Cloudinary أو Imgbb ثم ضع الرابط هنا.</p>
                    </div>
                    <div>
                      <label style={lbl}>صورة الغلاف (Cover Image URL)</label>
                      <div style={{display:'flex',gap:8,alignItems:'center'}}>
                        {editOrg.cover_image && <img src={editOrg.cover_image} alt="" style={{width:80,height:40,borderRadius:8,objectFit:'cover',border:`1px solid ${C.border}`,flexShrink:0}}/>}
                        <input value={editOrg.cover_image} onChange={e=>setE('cover_image',e.target.value)} placeholder="https://..." style={{...inp,fontFamily:'monospace',fontSize:12}}/>
                      </div>
                      <p style={{fontSize:11,color:C.muted,margin:'4px 0 0'}}>تظهر كخلفية في الهيدر الرئيسي للكتالوج.</p>
                    </div>
                  </div>

                  {/* Basic info */}
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                    <div>
                      <label style={lbl}>الاسم بالإنجليزية *</label>
                      <input value={editOrg.name} onChange={e=>setE('name',e.target.value)} style={inp}/>
                    </div>
                    <div>
                      <label style={lbl}>الاسم بالعربية</label>
                      <input value={editOrg.name_ar} onChange={e=>setE('name_ar',e.target.value)} style={inp}/>
                    </div>
                  </div>
                  <div>
                    <label style={lbl}>الشعار التعريفي (Tagline)</label>
                    <input value={editOrg.tagline} onChange={e=>setE('tagline',e.target.value)} placeholder="مثال: رحلات لا تُنسى في قلب الطبيعة السعودية" style={inp}/>
                  </div>
                  <div>
                    <label style={lbl}>نبذة عن المنظمة</label>
                    <textarea value={editOrg.description} onChange={e=>setE('description',e.target.value)} rows={3} placeholder="وصف مختصر يظهر في الكتالوج العام..." style={{...inp,resize:'vertical'}}/>
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10}}>
                    <div>
                      <label style={lbl}>المدينة</label>
                      <select value={editOrg.city} onChange={e=>setE('city',e.target.value)} style={inp}>
                        {CITIES.map(c=><option key={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={lbl}>القطاع</label>
                      <select value={editOrg.industry} onChange={e=>setE('industry',e.target.value)} style={inp}>
                        {INDUSTRIES.map(i=><option key={i}>{i}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={lbl}>الموقع الإلكتروني</label>
                      <input value={editOrg.website} onChange={e=>setE('website',e.target.value)} placeholder="https://..." style={inp}/>
                    </div>
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                    <div>
                      <label style={lbl}>البريد الإلكتروني</label>
                      <input type="email" value={editOrg.email} onChange={e=>setE('email',e.target.value)} style={inp}/>
                    </div>
                    <div>
                      <label style={lbl}>رقم الجوال</label>
                      <input value={editOrg.phone} onChange={e=>setE('phone',e.target.value)} style={inp}/>
                    </div>
                  </div>

                  {/* Legal */}
                  <div style={{background:'#F8F7FA',borderRadius:10,padding:14,display:'grid',gap:10}}>
                    <p style={{fontSize:12,fontWeight:700,color:C.navy,margin:0}}>📄 البيانات القانونية</p>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                      <div>
                        <label style={lbl}>رقم الترخيص السياحي</label>
                        <input value={editOrg.license_number} onChange={e=>setE('license_number',e.target.value)} placeholder="مثال: 73106434" style={{...inp,fontFamily:'monospace'}}/>
                      </div>
                      <div>
                        <label style={lbl}>الرقم الضريبي (VAT)</label>
                        <input value={editOrg.vat_number} onChange={e=>setE('vat_number',e.target.value)} placeholder="مثال: 314132175300003" style={{...inp,fontFamily:'monospace'}}/>
                      </div>
                    </div>
                  </div>

                  {/* Social media */}
                  <div style={{background:'#F8F7FA',borderRadius:10,padding:14,display:'grid',gap:10}}>
                    <p style={{fontSize:12,fontWeight:700,color:C.navy,margin:0}}>📲 حسابات التواصل الاجتماعي</p>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                      {[
                        {k:'social_instagram', l:'📷 إنستغرام', ph:'username (بدون @)'},
                        {k:'social_twitter',   l:'𝕏 تويتر / X', ph:'username (بدون @)'},
                        {k:'social_whatsapp',  l:'💬 واتساب',    ph:'966xxxxxxxxx'},
                        {k:'social_tiktok',    l:'🎵 تيك توك',   ph:'username (بدون @)'},
                        {k:'social_snapchat',  l:'👻 سناب شات',  ph:'username'},
                        {k:'social_linkedin',  l:'💼 لينكد إن',  ph:'company-name'},
                      ].map(({k,l,ph})=>(
                        <div key={k}>
                          <label style={lbl}>{l}</label>
                          <div style={{display:'flex',alignItems:'center',gap:6}}>
                            {k!=='social_whatsapp'&&<span style={{fontSize:11,color:C.muted,whiteSpace:'nowrap'}}>@</span>}
                            <input value={editOrg[k]||''} onChange={e=>setE(k,e.target.value.replace('@',''))} placeholder={ph} style={inp}/>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button onClick={saveOrg} disabled={saving} style={{padding:'12px',background:saved?C.green:C.orange,border:'none',borderRadius:8,color:'#fff',fontWeight:700,fontSize:14,cursor:'pointer',fontFamily:'inherit',transition:'background .3s'}}>
                    {saving?'⏳ جاري الحفظ...':saved?'✓ تم الحفظ بنجاح':'💾 حفظ جميع التغييرات'}
                  </button>
                </div>
              ) : (
                /* View mode */
                <div>
                  {/* Logo + cover preview */}
                  {(org.logo_url||org.cover_image) && (
                    <div style={{display:'flex',gap:12,marginBottom:16,alignItems:'center'}}>
                      {org.logo_url&&<img src={org.logo_url} alt="" style={{width:56,height:56,borderRadius:10,objectFit:'cover',border:`1px solid ${C.border}`}}/>}
                      {org.cover_image&&<img src={org.cover_image} alt="" style={{height:56,width:120,borderRadius:10,objectFit:'cover',border:`1px solid ${C.border}`}}/>}
                      {!org.logo_url&&!org.cover_image&&<div style={{color:C.muted,fontSize:12}}>لم يتم رفع صور بعد</div>}
                    </div>
                  )}
                  <div style={{display:'grid',gap:0}}>
                    {[
                      ['🏢 الاسم',         org.name_ar||org.name],
                      ['💬 الشعار',        org.tagline||'—'],
                      ['📧 البريد',        org.email||'—'],
                      ['📞 الجوال',        org.phone||'—'],
                      ['📍 المدينة',       org.city||'—'],
                      ['🏭 القطاع',        org.industry||'—'],
                      ['🌐 الموقع',        org.website||'—'],
                      ['📄 رقم الترخيص',  (org as any).license_number||'—'],
                      ['🧾 الرقم الضريبي',(org as any).vat_number||'—'],
                    ].map(([l,v]) => (
                      <div key={l} style={{display:'grid',gridTemplateColumns:'140px 1fr',padding:'9px 0',borderBottom:`1px solid ${C.border}`}}>
                        <span style={{fontSize:12,color:C.muted,fontWeight:600}}>{l}</span>
                        <span style={{fontSize:13,color:C.text,fontWeight:600,fontFamily:l.includes('رقم')||l.includes('ضريبي')?'monospace':'inherit'}}>{v}</span>
                      </div>
                    ))}
                  </div>
                  {/* Social accounts */}
                  <div style={{marginTop:14}}>
                    <p style={{fontSize:12,fontWeight:700,color:C.navy,margin:'0 0 10px'}}>📲 حسابات التواصل</p>
                    <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                      {[
                        {k:'social_instagram', l:'إنستغرام', icon:'📷', link:`https://instagram.com/`},
                        {k:'social_twitter',   l:'تويتر',    icon:'𝕏',  link:`https://x.com/`},
                        {k:'social_whatsapp',  l:'واتساب',   icon:'💬', link:`https://wa.me/`},
                        {k:'social_tiktok',    l:'تيك توك',  icon:'🎵', link:`https://tiktok.com/@`},
                        {k:'social_snapchat',  l:'سناب',     icon:'👻', link:`https://snapchat.com/add/`},
                        {k:'social_linkedin',  l:'لينكدإن',  icon:'💼', link:`https://linkedin.com/company/`},
                      ].filter(s=>(org as any)[s.k]).map(s=>(
                        <a key={s.k} href={`${s.link}${(org as any)[s.k]}`} target="_blank" rel="noopener"
                          style={{display:'flex',alignItems:'center',gap:6,padding:'6px 12px',background:'#F8F7FA',border:`1px solid ${C.border}`,borderRadius:8,textDecoration:'none',color:C.text,fontSize:12,fontWeight:600}}>
                          <span>{s.icon}</span><span>{s.l}</span>
                          <span style={{fontSize:11,color:C.muted}}>@{(org as any)[s.k]}</span>
                        </a>
                      ))}
                      {!['social_instagram','social_twitter','social_whatsapp','social_tiktok','social_snapchat','social_linkedin'].some(k=>(org as any)[k]) && (
                        <p style={{color:C.muted,fontSize:12,margin:0}}>لم يتم إضافة حسابات بعد — اضغط تعديل لإضافتها</p>
                      )}
                    </div>
                  </div>
                  {org.description && <p style={{fontSize:13,color:C.text,lineHeight:1.6,margin:'14px 0 0',background:'#F8F7FA',padding:12,borderRadius:8}}>{org.description}</p>}
                </div>
              )}
            </div>

            {/* Danger zone */}
            {isOwner && (
              <div style={{background:C.card,border:`1px solid #F5C0B0`,borderRadius:12,padding:20}}>
                <h3 style={{fontSize:14,fontWeight:700,color:'#B91C1C',margin:'0 0 8px'}}>⚠️ منطقة الخطر</h3>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <div>
                    <p style={{fontWeight:600,color:C.text,margin:0,fontSize:13}}>تسجيل الخروج</p>
                    <p style={{fontSize:11,color:C.muted,margin:'2px 0 0'}}>الخروج من الحساب</p>
                  </div>
                  <button onClick={signOut} style={{padding:'7px 16px',border:`1px solid ${C.border}`,borderRadius:6,background:C.card,fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'inherit',color:C.text}}>
                    تسجيل خروج
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── TEAM TAB ──────────────────────────────────────────── */}
        {tab==='team' && (
          <div>
            {/* Invite form */}
            {isOwner && (
              <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:20,marginBottom:14}}>
                <h3 style={{fontSize:15,fontWeight:700,color:C.navy,margin:'0 0 14px'}}>➕ دعوة عضو جديد</h3>
                <div style={{display:'grid',gridTemplateColumns:'1fr auto auto',gap:10,alignItems:'flex-end'}}>
                  <div>
                    <label style={lbl}>البريد الإلكتروني</label>
                    <input value={inviteEmail} onChange={e=>setInviteEmail(e.target.value)} onKeyDown={e=>e.key==='Enter'&&inviteMember()} type="email" placeholder="colleague@company.com" style={inp}/>
                  </div>
                  <div>
                    <label style={lbl}>الدور</label>
                    <select value={inviteRole} onChange={e=>setInviteRole(e.target.value)} style={{...inp,width:'auto',minWidth:110}}>
                      {Object.entries(ROLES).filter(([k])=>k!=='owner').map(([k,v])=>(
                        <option key={k} value={k}>{v.label}</option>
                      ))}
                    </select>
                  </div>
                  <button onClick={inviteMember} disabled={inviting||!inviteEmail.trim()} style={{padding:'10px 18px',background:inviteSuccess?C.green:C.navy,border:'none',borderRadius:8,color:'#fff',fontWeight:700,fontSize:13,cursor:'pointer',fontFamily:'inherit',whiteSpace:'nowrap',height:42}}>
                    {inviting?'⏳...':inviteSuccess?'✓ تمت الدعوة':'إرسال الدعوة'}
                  </button>
                </div>
                <p style={{fontSize:11,color:C.muted,margin:'8px 0 0'}}>
                  سيتلقى العضو رابط دعوة صالح لمدة 7 أيام — الحد الأقصى {org.max_members||5} أعضاء
                </p>
              </div>
            )}

            {/* Members list */}
            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,overflow:'hidden'}}>
              <div style={{padding:'14px 18px',borderBottom:`1px solid ${C.border}`,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <h3 style={{fontSize:15,fontWeight:700,color:C.navy,margin:0}}>أعضاء الفريق ({members.length})</h3>
                <div style={{display:'flex',gap:8}}>
                  <span style={{fontSize:11,background:'#EAF7E0',color:C.green,padding:'3px 8px',borderRadius:6,fontWeight:600}}>{activeMem} نشط</span>
                  {pendingMem>0&&<span style={{fontSize:11,background:'#FFF8E8',color:'#B07000',padding:'3px 8px',borderRadius:6,fontWeight:600}}>{pendingMem} معلّق</span>}
                </div>
              </div>
              {members.length===0 ? (
                <div style={{padding:40,textAlign:'center'}}>
                  <div style={{fontSize:40,marginBottom:8}}>👥</div>
                  <p style={{color:C.muted,fontSize:13}}>لا يوجد أعضاء بعد — ادعُ زميلك أعلاه</p>
                </div>
              ) : members.map((m,i) => {
                const r = ROLES[m.role||'viewer'] || ROLES.viewer
                const isMe = m.role==='owner'
                return (
                  <div key={m.id} style={{padding:'14px 18px',borderBottom:i<members.length-1?`1px solid ${C.border}`:'none',display:'flex',alignItems:'center',gap:12}}>
                    <div style={{width:40,height:40,background:'linear-gradient(135deg,#B4A7D6,#7B4FBF)',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:800,fontSize:16,flexShrink:0}}>
                      {m.full_name?.[0]||m.email[0].toUpperCase()}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:'flex',alignItems:'center',gap:8}}>
                        <p style={{fontWeight:700,color:C.navy,margin:0,fontSize:13,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{m.full_name||m.email}</p>
                        <span style={{fontSize:10,fontWeight:700,padding:'2px 8px',borderRadius:6,background:r.bg,color:r.color,flexShrink:0}}>{r.label}</span>
                        {m.status==='invited'&&<span style={{fontSize:10,fontWeight:600,padding:'2px 7px',borderRadius:6,background:'#FFF8E8',color:'#B07000',flexShrink:0}}>دعوة معلقة</span>}
                      </div>
                      <p style={{fontSize:11,color:C.muted,margin:'2px 0 0',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{m.email}</p>
                    </div>
                    {isOwner && !isMe && (
                      <div style={{display:'flex',gap:6,flexShrink:0}}>
                        <select value={m.role||'viewer'} onChange={e=>changeMemberRole(m.id,e.target.value)} style={{fontSize:11,padding:'4px 8px',border:`1px solid ${C.border}`,borderRadius:6,fontFamily:'inherit',color:C.text,background:C.bg,outline:'none',cursor:'pointer'}}>
                          {Object.entries(ROLES).filter(([k])=>k!=='owner').map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
                        </select>
                        <button onClick={()=>removeMember(m.id)} style={{padding:'4px 10px',background:'#FEF2F2',border:'none',borderRadius:6,color:'#DC2626',fontWeight:700,fontSize:11,cursor:'pointer',fontFamily:'inherit'}}>إزالة</button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── ROLES TAB ─────────────────────────────────────────── */}
        {tab==='roles' && (
          <div>
            <div style={{background:'#FFF8E8',border:'1px solid #F5C842',borderRadius:8,padding:'10px 14px',marginBottom:14,display:'flex',gap:8,alignItems:'center'}}>
              <span style={{fontSize:16}}>💡</span>
              <p style={{margin:0,fontSize:12,color:'#7A5000'}}>الأدوار تحدد ما يستطيع كل عضو رؤيته أو تعديله داخل المنظمة</p>
            </div>
            {Object.entries(ROLES).map(([key, role]) => (
              <div key={key} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:16,marginBottom:10,display:'flex',gap:14,alignItems:'flex-start'}}>
                <div style={{width:40,height:40,background:role.bg,borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0}}>
                  {key==='owner'?'👑':key==='admin'?'⚙️':key==='editor'?'✏️':key==='scanner'?'📷':'👁️'}
                </div>
                <div style={{flex:1}}>
                  <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                    <h4 style={{margin:0,fontSize:14,fontWeight:700,color:C.navy}}>{role.label}</h4>
                    <span style={{fontSize:10,fontWeight:600,padding:'2px 8px',borderRadius:6,background:role.bg,color:role.color}}>{key}</span>
                    {(key==='owner'||key==='admin'||key==='editor'||key==='scanner') && (
                      <span style={{fontSize:10,color:C.muted,background:'#F1F1F1',padding:'1px 6px',borderRadius:4}}>نظام</span>
                    )}
                  </div>
                  <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                    {role.perms.map(p=>(
                      <span key={p} style={{fontSize:11,background:'#F8F7FA',color:C.text,padding:'3px 9px',borderRadius:6,border:`1px solid ${C.border}`}}>{p}</span>
                    ))}
                  </div>
                </div>
                <div style={{fontSize:13,color:C.muted,flexShrink:0,fontWeight:600}}>
                  {members.filter(m=>m.role===key).length} عضو
                </div>
              </div>
            ))}
            {rolePresets.filter(p=>!p.is_system).length>0 && (
              <div style={{marginTop:16}}>
                <h3 style={{fontSize:14,fontWeight:700,color:C.navy,margin:'0 0 10px'}}>أدوار مخصصة</h3>
                {rolePresets.filter(p=>!p.is_system).map(p=>(
                  <div key={p.id} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:14,marginBottom:8,display:'flex',alignItems:'center',gap:10}}>
                    <div style={{width:12,height:12,borderRadius:'50%',background:p.color||C.muted,flexShrink:0}}/>
                    <div style={{flex:1}}>
                      <p style={{fontWeight:700,color:C.navy,margin:0,fontSize:13}}>{p.name_ar||p.name}</p>
                      <p style={{fontSize:11,color:C.muted,margin:'2px 0 0'}}>{p.role_key}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}


        {/* ── IDENTITY TAB ────────────────────────────────────────── */}
        {tab==='identity' && (() => {
          const hasFeature = org?.features?.org_identity === true

          /* Feature gate — not enabled on this plan */
          if (!hasFeature) return (
            <div style={{background:C.card,border:`2px dashed ${C.border}`,borderRadius:16,padding:40,textAlign:'center'}}>
              <div style={{fontSize:56,marginBottom:12}}>🪪</div>
              <h3 style={{fontSize:20,fontWeight:800,color:C.navy,margin:'0 0 8px'}}>هوية المؤسسة</h3>
              <p style={{color:C.muted,fontSize:14,margin:'0 0 6px',lineHeight:1.6}}>
                أضف شعار منظمتك، صورة الغلاف، حساباتك على التواصل الاجتماعي،<br/>
                رقم الترخيص، الرقم الضريبي، والمعلومات القانونية لتظهر<br/>
                في صفحة الكتالوج العام للزوار.
              </p>
              <div style={{display:'inline-flex',gap:8,marginBottom:20,flexWrap:'wrap',justifyContent:'center'}}>
                {['🖼️ الشعار والغلاف','📲 6 حسابات سوشيال','📄 الترخيص والـ VAT','🌐 الكتالوج العام','🎨 لون التمييز'].map(f=>(
                  <span key={f} style={{background:'#F8F7FA',border:`1px solid ${C.border}`,borderRadius:20,padding:'5px 14px',fontSize:12,color:C.muted}}>{f}</span>
                ))}
              </div>
              <div style={{background:'#FEF0ED',border:`1px solid #F5C0B0`,borderRadius:10,padding:'14px 20px',marginBottom:20,display:'inline-block'}}>
                <p style={{color:C.orange,fontSize:13,fontWeight:700,margin:0}}>🔒 هذه الميزة متاحة للباقات: ذهبي · بلاتيني · مؤسسي</p>
                <p style={{color:C.muted,fontSize:12,margin:'4px 0 0'}}>تواصل معنا لترقية باقتك وتفعيل هذه الميزة</p>
              </div>
              <div style={{display:'flex',gap:10,justifyContent:'center'}}>
                <button onClick={()=>setTab('plan')} style={{padding:'10px 24px',background:C.orange,border:'none',borderRadius:8,color:'#fff',fontWeight:700,fontSize:13,cursor:'pointer',fontFamily:'inherit'}}>
                  ترقية الباقة ←
                </button>
                <a href="https://wa.me/966500000000" target="_blank" rel="noopener"
                  style={{padding:'10px 24px',background:C.bg,border:`1px solid ${C.border}`,borderRadius:8,color:C.text,fontWeight:600,fontSize:13,textDecoration:'none',display:'inline-block'}}>
                  تواصل معنا
                </a>
              </div>
            </div>
          )

          /* Feature enabled */
          return (
            <div>
              {/* ── Section 1: الهوية البصرية ────────────────── */}
              <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:22,marginBottom:14}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
                  <div>
                    <h3 style={{fontSize:15,fontWeight:700,color:C.navy,margin:0}}>🎨 الهوية البصرية</h3>
                    <p style={{fontSize:12,color:C.muted,margin:'2px 0 0'}}>الشعار والغلاف والبيانات التي تظهر للزوار</p>
                  </div>
                  <button onClick={()=>setEditing(!editing)} style={{padding:'6px 14px',border:`1px solid ${C.border}`,borderRadius:6,background:editing?C.bg:C.orange,fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'inherit',color:editing?C.text:'#fff'}}>
                    {editing?'إلغاء':'✏️ تعديل'}
                  </button>
                </div>

                {editing ? (
                  <div style={{display:'grid',gap:14}}>
                    {/* Images */}
                    <div style={{background:'#F8F7FA',borderRadius:10,padding:14,display:'grid',gap:12}}>
                      <p style={{fontSize:12,fontWeight:700,color:C.navy,margin:0}}>🖼️ الصور</p>
                      <div>
                        <label style={lbl}>رابط الشعار (Logo)</label>
                        <div style={{display:'flex',gap:10,alignItems:'center'}}>
                          {editOrg.logo_url&&<img src={editOrg.logo_url} alt="" onError={e=>(e.currentTarget.style.display='none')} style={{width:48,height:48,borderRadius:10,objectFit:'cover',border:`1px solid ${C.border}`,flexShrink:0}}/>}
                          <div style={{flex:1}}>
                            <input value={editOrg.logo_url||''} onChange={e=>setE('logo_url',e.target.value)} placeholder="https://..." style={{...inp,fontFamily:'monospace',fontSize:12}}/>
                            <p style={{fontSize:11,color:C.muted,margin:'3px 0 0'}}>ارفع على <a href="https://imgbb.com" target="_blank" style={{color:C.orange}}>imgbb.com</a> أو Cloudinary ثم الصق الرابط هنا</p>
                          </div>
                        </div>
                      </div>
                      <div>
                        <label style={lbl}>صورة الغلاف (Cover Image)</label>
                        <div style={{display:'flex',gap:10,alignItems:'center'}}>
                          {editOrg.cover_image&&<img src={editOrg.cover_image} alt="" onError={e=>(e.currentTarget.style.display='none')} style={{width:96,height:48,borderRadius:10,objectFit:'cover',border:`1px solid ${C.border}`,flexShrink:0}}/>}
                          <div style={{flex:1}}>
                            <input value={editOrg.cover_image||''} onChange={e=>setE('cover_image',e.target.value)} placeholder="https://..." style={{...inp,fontFamily:'monospace',fontSize:12}}/>
                            <p style={{fontSize:11,color:C.muted,margin:'3px 0 0'}}>تظهر كخلفية كبيرة في كتالوجك العام — يُفضَّل 1920×600px</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Identity text */}
                    <div>
                      <label style={lbl}>الشعار التعريفي (Tagline)</label>
                      <input value={editOrg.tagline||''} onChange={e=>setE('tagline',e.target.value)} placeholder="جملة قصيرة تصف منظمتك..." style={inp}/>
                    </div>
                    <div>
                      <label style={lbl}>نبذة عن المنظمة</label>
                      <textarea value={editOrg.description||''} onChange={e=>setE('description',e.target.value)} rows={3} placeholder="وصف يظهر في الكتالوج للزوار..." style={{...inp,resize:'vertical'}}/>
                    </div>
                    <div>
                      <label style={lbl}>لون التمييز (Accent Color)</label>
                      <div style={{display:'flex',gap:10,alignItems:'center',flexWrap:'wrap'}}>
                        <input type="color" value={editOrg.accent_color||'#F05537'} onChange={e=>setE('accent_color',e.target.value)}
                          style={{width:44,height:36,border:`1px solid ${C.border}`,borderRadius:6,cursor:'pointer',padding:2}}/>
                        <span style={{fontSize:12,color:C.muted,fontFamily:'monospace'}}>{editOrg.accent_color||'#F05537'}</span>
                        {['#F05537','#1E0A3C','#2E8B57','#1DA1F2','#E91E63','#FF6B35','#6C5CE7','#00B894'].map(c=>(
                          <button key={c} onClick={()=>setE('accent_color',c)} title={c} style={{width:26,height:26,borderRadius:'50%',background:c,border:editOrg.accent_color===c?'3px solid #000':'2px solid transparent',cursor:'pointer',flexShrink:0}}/>
                        ))}
                      </div>
                    </div>

                    {/* Legal */}
                    <div style={{background:'#F8F7FA',borderRadius:10,padding:14,display:'grid',gap:10}}>
                      <p style={{fontSize:12,fontWeight:700,color:C.navy,margin:0}}>📄 البيانات القانونية</p>
                      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                        <div>
                          <label style={lbl}>رقم الترخيص</label>
                          <input value={editOrg.license_number||''} onChange={e=>setE('license_number',e.target.value)} placeholder="مثال: 73106434" style={{...inp,fontFamily:'monospace'}}/>
                          <p style={{fontSize:11,color:C.muted,margin:'3px 0 0'}}>سياحي، تجاري، أو أي ترخيص رسمي</p>
                        </div>
                        <div>
                          <label style={lbl}>الرقم الضريبي (VAT)</label>
                          <input value={editOrg.vat_number||''} onChange={e=>setE('vat_number',e.target.value)} placeholder="مثال: 314132175300003" style={{...inp,fontFamily:'monospace'}}/>
                        </div>
                      </div>
                    </div>

                    {/* Social media */}
                    <div style={{background:'#F8F7FA',borderRadius:10,padding:14,display:'grid',gap:10}}>
                      <p style={{fontSize:12,fontWeight:700,color:C.navy,margin:0}}>📲 حسابات التواصل الاجتماعي</p>
                      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                        {([
                          {k:'social_instagram', l:'📷 إنستغرام',  ph:'username'},
                          {k:'social_twitter',   l:'𝕏 تويتر',      ph:'username'},
                          {k:'social_whatsapp',  l:'💬 واتساب',    ph:'966xxxxxxxxx'},
                          {k:'social_tiktok',    l:'🎵 تيك توك',   ph:'username'},
                          {k:'social_snapchat',  l:'👻 سناب شات',  ph:'username'},
                          {k:'social_linkedin',  l:'💼 لينكدإن',   ph:'company-name'},
                        ] as const).map(({k,l,ph})=>(
                          <div key={k}>
                            <label style={lbl}>{l}</label>
                            <div style={{display:'flex',alignItems:'center',gap:5}}>
                              {k!=='social_whatsapp'&&<span style={{fontSize:11,color:C.muted,flexShrink:0}}>@</span>}
                              <input value={editOrg[k]||''} onChange={e=>setE(k,e.target.value.replace('@',''))} placeholder={ph} style={inp}/>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button onClick={saveOrg} disabled={saving} style={{padding:'12px',background:saved?C.green:C.orange,border:'none',borderRadius:8,color:'#fff',fontWeight:700,fontSize:14,cursor:'pointer',fontFamily:'inherit',transition:'background .3s'}}>
                      {saving?'⏳ جاري الحفظ...':saved?'✓ تم الحفظ':'💾 حفظ هوية المؤسسة'}
                    </button>
                  </div>
                ) : (
                  /* View mode */
                  <div>
                    {/* Preview images */}
                    <div style={{display:'flex',gap:12,alignItems:'center',marginBottom:14,padding:14,background:'#F8F7FA',borderRadius:10}}>
                      {org.logo_url
                        ? <img src={org.logo_url} alt="" style={{width:56,height:56,borderRadius:10,objectFit:'cover',border:`1px solid ${C.border}`}}/>
                        : <div style={{width:56,height:56,background:'#EDE9F7',borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,color:C.muted}}>🏢</div>
                      }
                      {org.cover_image
                        ? <img src={org.cover_image} alt="" style={{height:56,width:120,borderRadius:10,objectFit:'cover',border:`1px solid ${C.border}`}}/>
                        : <div style={{width:120,height:56,background:'#EDE9F7',borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,color:C.muted}}>لا توجد صورة غلاف</div>
                      }
                      <div>
                        <div style={{display:'flex',alignItems:'center',gap:8}}>
                          <div style={{width:16,height:16,borderRadius:'50%',background:(org as any).accent_color||'#F05537',border:`1px solid ${C.border}`}}/>
                          <span style={{fontSize:11,color:C.muted,fontFamily:'monospace'}}>{(org as any).accent_color||'#F05537'}</span>
                        </div>
                        {org.tagline&&<p style={{fontSize:12,color:C.muted,margin:'4px 0 0',fontStyle:'italic'}}>"{org.tagline}"</p>}
                      </div>
                    </div>

                    <div style={{display:'grid',gap:0}}>
                      {[
                        ['📄 الترخيص',      (org as any).license_number||'—',  true],
                        ['🧾 الرقم الضريبي',(org as any).vat_number||'—',      true],
                        ['🌐 الموقع',        (org as any).website||'—',          false],
                      ].map(([l,v,mono]) => (
                        <div key={l as string} style={{display:'grid',gridTemplateColumns:'140px 1fr',padding:'9px 0',borderBottom:`1px solid ${C.border}`}}>
                          <span style={{fontSize:12,color:C.muted,fontWeight:600}}>{l as string}</span>
                          <span style={{fontSize:13,color:C.text,fontWeight:600,fontFamily:mono?'monospace':'inherit'}}>{v as string}</span>
                        </div>
                      ))}
                    </div>

                    {/* Social links */}
                    <div style={{marginTop:14}}>
                      <p style={{fontSize:12,fontWeight:700,color:C.navy,margin:'0 0 10px'}}>📲 حسابات التواصل</p>
                      <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                        {([
                          {k:'social_instagram',l:'إنستغرام',icon:'📷',href:'https://instagram.com/'},
                          {k:'social_twitter',  l:'تويتر',   icon:'𝕏', href:'https://x.com/'},
                          {k:'social_whatsapp', l:'واتساب',  icon:'💬',href:'https://wa.me/'},
                          {k:'social_tiktok',   l:'تيك توك', icon:'🎵',href:'https://tiktok.com/@'},
                          {k:'social_snapchat', l:'سناب',    icon:'👻',href:'https://snapchat.com/add/'},
                          {k:'social_linkedin', l:'لينكدإن', icon:'💼',href:'https://linkedin.com/company/'},
                        ] as const).filter(s=>(org as any)[s.k]).map(s=>(
                          <a key={s.k} href={`${s.href}${(org as any)[s.k]}`} target="_blank" rel="noopener"
                            style={{display:'flex',alignItems:'center',gap:6,padding:'6px 12px',background:'#F8F7FA',border:`1px solid ${C.border}`,borderRadius:8,textDecoration:'none',color:C.text,fontSize:12,fontWeight:600}}>
                            <span>{s.icon}</span><span>{s.l}</span>
                            <span style={{fontSize:11,color:C.muted}}>@{(org as any)[s.k]}</span>
                          </a>
                        ))}
                        {!['social_instagram','social_twitter','social_whatsapp','social_tiktok','social_snapchat','social_linkedin'].some(k=>(org as any)[k])&&(
                          <p style={{color:C.muted,fontSize:12,margin:0}}>لم يتم إضافة حسابات — اضغط تعديل</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })()}


        {/* ── CATALOG TAB ────────────────────────────────────────── */}
        {tab==='catalog' && (
          <div>
            {/* Enable toggle */}
            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:20,marginBottom:14}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:16}}>
                <div>
                  <h3 style={{fontSize:15,fontWeight:700,color:C.navy,margin:'0 0 4px'}}>🌐 الكتالوج العام</h3>
                  <p style={{fontSize:12,color:C.muted,margin:0}}>صفحة عامة تعرض فعالياتك للجمهور بدون لوحة تحكم</p>
                </div>
                <div onClick={async()=>{
                  if(!org)return
                  const nv=!org.catalog_enabled
                  await sb.from('organizations').update({catalog_enabled:nv}).eq('id',org.id)
                  setOrg((o:any)=>({...o,catalog_enabled:nv}))
                }} style={{
                  width:48,height:26,borderRadius:50,cursor:'pointer',position:'relative',
                  background:org?.catalog_enabled?C.orange:'#DBDAE3',transition:'background 0.2s',flexShrink:0
                }}>
                  <div style={{position:'absolute',top:3,width:20,height:20,borderRadius:'50%',background:'#fff',
                    transition:'right 0.2s, left 0.2s',
                    right:org?.catalog_enabled?3:'auto',left:org?.catalog_enabled?'auto':3,
                    boxShadow:'0 1px 4px rgba(0,0,0,0.2)'}}/>
                </div>
              </div>

              {org?.catalog_enabled && org?.slug && (
                <div style={{background:'#EAF7E0',borderRadius:8,padding:'10px 14px',border:'1px solid #C3E6C3',marginBottom:12}}>
                  <p style={{fontSize:11,color:'#1A5A00',fontWeight:600,margin:'0 0 4px'}}>🔗 رابط الكتالوج الخاص بك</p>
                  <div style={{display:'flex',gap:8,alignItems:'center'}}>
                    <code style={{fontSize:12,color:C.navy,flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',fontFamily:'monospace'}}>
                      {typeof window!=='undefined'?window.location.origin:''}/org/{org.slug}
                    </code>
                    <button onClick={()=>navigator.clipboard?.writeText((typeof window!=='undefined'?window.location.origin:'')+'/org/'+org.slug)} style={{padding:'4px 10px',background:C.green,border:'none',borderRadius:6,color:'#fff',fontSize:11,fontWeight:700,cursor:'pointer',fontFamily:'inherit',flexShrink:0}}>نسخ</button>
                    <a href={`/org/${org.slug}`} target="_blank" style={{padding:'4px 10px',background:C.navy,borderRadius:6,color:'#fff',fontSize:11,fontWeight:700,textDecoration:'none',flexShrink:0}}>فتح</a>
                  </div>
                </div>
              )}
            </div>

            {/* Catalog settings */}
            {org && (
              <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:20,marginBottom:14}}>
                <h3 style={{fontSize:15,fontWeight:700,color:C.navy,margin:'0 0 14px'}}>إعدادات الصفحة العامة</h3>
                <div style={{display:'grid',gap:12}}>
                  <div>
                    <label style={lbl}>الـ Slug (الرابط المختصر) *</label>
                    <div style={{display:'flex',gap:8,alignItems:'center'}}>
                      <span style={{fontSize:12,color:C.muted,whiteSpace:'nowrap'}}>evento.app/org/</span>
                      <input value={editOrg.slug||org.slug||''} onChange={e=>setE('slug',e.target.value.toLowerCase().replace(/[^a-z0-9\-]/g,''))} placeholder="your-slug" style={{...inp,flex:1,fontFamily:'monospace'}}/>
                    </div>
                    <p style={{fontSize:11,color:C.muted,margin:'4px 0 0'}}>أحرف إنجليزية صغيرة وأرقام وشرطة فقط</p>
                  </div>
                  <div>
                    <label style={lbl}>شعار (Tagline) يظهر تحت الاسم</label>
                    <input value={editOrg.tagline||''} onChange={e=>setE('tagline',e.target.value)} placeholder="مثال: رحلات لا تُنسى في قلب الطبيعة السعودية" style={inp}/>
                  </div>
                  <div>
                    <label style={lbl}>لون التمييز (Accent Color)</label>
                    <div style={{display:'flex',gap:10,alignItems:'center'}}>
                      <input type="color" value={editOrg.accent_color||'#F05537'} onChange={e=>setE('accent_color',e.target.value)}
                        style={{width:44,height:36,border:`1px solid ${C.border}`,borderRadius:6,cursor:'pointer',padding:2}}/>
                      <span style={{fontSize:12,color:C.muted,fontFamily:'monospace'}}>{editOrg.accent_color||'#F05537'}</span>
                      {['#F05537','#1E0A3C','#25D366','#1DA1F2','#FF6B35','#6C5CE7'].map(c=>(
                        <button key={c} onClick={()=>setE('accent_color',c)} style={{width:24,height:24,borderRadius:'50%',background:c,border:editOrg.accent_color===c?'2px solid #000':'none',cursor:'pointer'}}/>
                      ))}
                    </div>
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10}}>
                    <div>
                      <label style={lbl}>📷 إنستغرام</label>
                      <input value={editOrg.social_instagram||''} onChange={e=>setE('social_instagram',e.target.value.replace('@',''))} placeholder="username" style={inp}/>
                    </div>
                    <div>
                      <label style={lbl}>𝕏 تويتر</label>
                      <input value={editOrg.social_twitter||''} onChange={e=>setE('social_twitter',e.target.value.replace('@',''))} placeholder="username" style={inp}/>
                    </div>
                    <div>
                      <label style={lbl}>💬 واتساب</label>
                      <input value={editOrg.social_whatsapp||''} onChange={e=>setE('social_whatsapp',e.target.value)} placeholder="966xxxxxxxxx" style={inp}/>
                    </div>
                  </div>
                  <div>
                    <label style={lbl}>🌐 Custom Domain (اختياري)</label>
                    <input value={editOrg.custom_domain||''} onChange={e=>setE('custom_domain',e.target.value)} placeholder="events.yourcompany.com" style={{...inp,fontFamily:'monospace'}}/>
                    <p style={{fontSize:11,color:C.muted,margin:'4px 0 0'}}>
                      أضف CNAME record في DNS يشير لـ <code style={{background:'#F8F7FA',padding:'1px 5px',borderRadius:3}}>cname.vercel-dns.com</code>
                    </p>
                  </div>
                  <button onClick={saveOrg} disabled={saving} style={{padding:'10px',background:saved?C.green:C.orange,border:'none',borderRadius:8,color:'#fff',fontWeight:700,fontSize:13,cursor:'pointer',fontFamily:'inherit'}}>
                    {saving?'جاري الحفظ...':saved?'✓ تم الحفظ':'💾 حفظ الإعدادات'}
                  </button>
                </div>
              </div>
            )}

            {/* White label info */}
            <div style={{background:'#F8F7FA',border:`1px solid ${C.border}`,borderRadius:12,padding:16}}>
              <h3 style={{fontSize:13,fontWeight:700,color:C.navy,margin:'0 0 10px'}}>📌 كيف تربط دومينك الخاص؟</h3>
              <div style={{display:'grid',gap:8}}>
                {[
                  ['1','اذهب إلى إعدادات DNS في موفر دومينك (GoDaddy، Namecheap، إلخ)'],
                  ['2','أضف CNAME record: الاسم = events، القيمة = cname.vercel-dns.com'],
                  ['3','أدخل events.yourcompany.com في حقل Custom Domain أعلاه'],
                  ['4','انتظر 24 ساعة حتى ينتشر DNS — ثم ستعمل الصفحة تلقائياً'],
                ].map(([n,t])=>(
                  <div key={n} style={{display:'flex',gap:10,alignItems:'flex-start'}}>
                    <div style={{width:22,height:22,background:C.navy,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:11,fontWeight:700,flexShrink:0}}>{n}</div>
                    <p style={{fontSize:12,color:C.text,margin:0,lineHeight:1.5}}>{t}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── PLAN TAB ──────────────────────────────────────────── */}
        {tab==='plan' && (
          <div>
            <div style={{background:C.card,border:`2px solid ${C.navy}`,borderRadius:12,padding:20,marginBottom:14}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:14}}>
                <div>
                  <p style={{fontSize:12,color:C.muted,margin:0}}>الباقة الحالية</p>
                  <h3 style={{fontSize:22,fontWeight:800,color:C.navy,margin:'4px 0 0',textTransform:'capitalize'}}>{org.plan||'free'}</h3>
                </div>
                <span style={{background:'#EAF7E0',color:C.green,fontSize:11,fontWeight:700,padding:'4px 10px',borderRadius:6}}>نشطة</span>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8}}>
                {[
                  ['📅','الفعاليات',      String(org.max_events||'غير محدود')],
                  ['👥','الأعضاء',       String(org.max_members||5)],
                  ['🎟','الزوار/فعالية', String(org.max_attendees_per_event||500)],
                ].map(([i,l,v]) => (
                  <div key={l} style={{background:'#F8F7FA',borderRadius:8,padding:'10px 12px',textAlign:'center'}}>
                    <p style={{fontSize:14,margin:'0 0 2px'}}>{i}</p>
                    <p style={{fontSize:16,fontWeight:800,color:C.navy,margin:'0 0 2px'}}>{v}</p>
                    <p style={{fontSize:10,color:C.muted,margin:0}}>{l}</p>
                  </div>
                ))}
              </div>
            </div>

            <p style={{fontWeight:700,color:C.navy,margin:'0 0 12px',fontSize:14}}>ترقية الباقة</p>
            {[
              { key:'gold', name:'ذهبي', price:'149 ريال/شهر', color:'#B07000', bg:'#FFFBEB', events:'5', members:'3', note:'للمنظمات الصغيرة والمتوسطة' },
              { key:'platinum', name:'بلاتيني', price:'399 ريال/شهر', color:'#5B3FA0', bg:'#F5F0FF', events:'20', members:'10', note:'للمنظمات الكبرى' },
              { key:'enterprise', name:'مؤسسي', price:'تواصل معنا', color:C.navy, bg:'#E8E4F0', events:'∞', members:'∞', note:'حل مخصص بالكامل' },
            ].map(plan=>(
              <div key={plan.key} style={{background:plan.bg,border:`1px solid ${C.border}`,borderRadius:10,padding:16,marginBottom:10,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div>
                  <p style={{fontWeight:800,color:plan.color,margin:'0 0 3px',fontSize:16}}>{plan.name}</p>
                  <p style={{fontSize:12,color:C.muted,margin:0}}>{plan.events} فعالية · {plan.members} عضو · {plan.note}</p>
                </div>
                <div style={{textAlign:'left'}}>
                  <p style={{fontWeight:700,color:C.navy,margin:'0 0 6px',fontSize:14}}>{plan.price}</p>
                  <button style={{padding:'7px 16px',border:'none',borderRadius:6,background:plan.color,color:'#fff',fontWeight:700,fontSize:12,cursor:'pointer',fontFamily:'inherit'}}>
                    {plan.key==='enterprise'?'تواصل':'ترقية'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}
