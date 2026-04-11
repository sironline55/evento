'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import OrgCatalogClient from './OrgCatalogClient'

const SB_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SB_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

async function sbFetch(table: string, params: string) {
  const r = await fetch(`${SB_URL}/rest/v1/${table}?${params}`, {
    headers: {
      apikey:        SB_ANON,
      Authorization: `Bearer ${SB_ANON}`,
      Accept:        'application/json',
    },
    cache: 'no-store',
  })
  if (!r.ok) return null
  return r.json()
}

export default function OrgCatalogPage() {
  const params  = useParams()
  const slug    = params?.slug as string
  const [org, setOrg]           = useState<any>(null)
  const [upcoming, setUpcoming] = useState<any[]>([])
  const [past, setPast]         = useState<any[]>([])
  const [loading, setLoading]   = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!slug) return
    ;(async () => {
      // Fetch org — anon key only, no user cookies
      const orgs = await sbFetch('organizations',
        `slug=eq.${encodeURIComponent(slug)}&catalog_enabled=eq.true&select=*&limit=1`)
      const org = orgs?.[0]
      if (!org) { setNotFound(true); setLoading(false); return }
      setOrg(org)

      const now = new Date().toISOString()
      const evSel = 'id,title,description,cover_image,start_date,end_date,location,category,category_icon,is_featured,price_from,slug'
      const [upData, pastData] = await Promise.all([
        sbFetch('events', `org_id=eq.${org.id}&is_public=eq.true&status=in.(published,active)&start_date=gte.${now}&select=${evSel}&order=is_featured.desc,start_date.asc&limit=20`),
        sbFetch('events', `org_id=eq.${org.id}&is_public=eq.true&start_date=lt.${now}&select=id,title,cover_image,start_date,location,category,category_icon,slug&order=start_date.desc&limit=12`),
      ])
      setUpcoming(upData || [])
      setPast(pastData || [])
      setLoading(false)
    })()
  }, [slug])

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#1E0A3C', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ width:40, height:40, border:'3px solid rgba(255,255,255,0.15)', borderTop:'3px solid #F05537', borderRadius:'50%', margin:'0 auto 12px', animation:'spin 0.8s linear infinite' }}/>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <p style={{ color:'rgba(255,255,255,0.4)', fontSize:12, margin:0 }}>جاري التحميل...</p>
      </div>
    </div>
  )

  if (notFound) return (
    <div style={{ minHeight:'100vh', background:'#1E0A3C', display:'flex', alignItems:'center', justifyContent:'center', direction:'rtl' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:56, marginBottom:12 }}>🔍</div>
        <h1 style={{ color:'#fff', fontSize:22, fontWeight:800, margin:'0 0 8px' }}>المنظم غير موجود</h1>
        <p style={{ color:'rgba(255,255,255,0.4)', fontSize:14 }}>تحقق من الرابط أو تواصل مع المنظم</p>
      </div>
    </div>
  )

  return <OrgCatalogClient org={org} upcoming={upcoming} past={past} />
}
