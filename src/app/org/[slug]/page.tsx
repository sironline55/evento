'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState, useMemo } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useParams } from 'next/navigation'
import OrgCatalogClient from './OrgCatalogClient'

export default function OrgCatalogPage() {
  const params = useParams()
  const slug = params?.slug as string

  const sb = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), [])

  const [org, setOrg]           = useState<any>(null)
  const [upcoming, setUpcoming] = useState<any[]>([])
  const [past, setPast]         = useState<any[]>([])
  const [loading, setLoading]   = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!slug) return
    async function load() {
      const { data: orgData, error } = await sb.from('organizations')
        .select('*')
        .eq('slug', slug)
        .eq('catalog_enabled', true)
        .single()

      if (error || !orgData) { setNotFound(true); setLoading(false); return }
      setOrg(orgData)

      const now = new Date().toISOString()
      const [{ data: upData }, { data: pastData }] = await Promise.all([
        sb.from('events')
          .select('id,title,description,cover_image,start_date,end_date,location,category,category_icon,is_featured,price_from,slug')
          .eq('org_id', orgData.id)
          .eq('is_public', true)
          .in('status', ['published', 'active'])
          .gte('start_date', now)
          .order('is_featured', { ascending: false })
          .order('start_date', { ascending: true })
          .limit(20),
        sb.from('events')
          .select('id,title,cover_image,start_date,location,category,category_icon,slug')
          .eq('org_id', orgData.id)
          .eq('is_public', true)
          .lt('start_date', now)
          .order('start_date', { ascending: false })
          .limit(12),
      ])
      setUpcoming(upData || [])
      setPast(pastData || [])
      setLoading(false)
    }
    load()
  }, [slug])

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#1E0A3C', display:'flex', alignItems:'center', justifyContent:'center', direction:'rtl' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ width:40, height:40, border:'3px solid rgba(255,255,255,0.2)', borderTop:'3px solid #F05537', borderRadius:'50%', margin:'0 auto 14px', animation:'spin 1s linear infinite' }}/>
        <p style={{ color:'rgba(255,255,255,0.5)', fontSize:13 }}>جاري التحميل...</p>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  )

  if (notFound) return (
    <div style={{ minHeight:'100vh', background:'#1E0A3C', display:'flex', alignItems:'center', justifyContent:'center', direction:'rtl' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:56, marginBottom:12 }}>🔍</div>
        <h1 style={{ color:'#fff', fontSize:22, fontWeight:800, margin:'0 0 8px' }}>الصفحة غير موجودة</h1>
        <p style={{ color:'rgba(255,255,255,0.5)', fontSize:14 }}>لا يوجد كتالوج بهذا الرابط أو أنه غير مفعّل</p>
      </div>
    </div>
  )

  return <OrgCatalogClient org={org} upcoming={upcoming} past={past} />
}
