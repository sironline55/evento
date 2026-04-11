import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import OrgCatalogClient from './OrgCatalogClient'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const cookieStore = cookies()
  const sb = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (n) => cookieStore.get(n)?.value } }
  )
  const { data: org } = await sb.from('organizations').select('name,name_ar,tagline,logo_url,cover_image').eq('slug', params.slug).single()
  if (!org) return { title: 'المنظم' }
  return {
    title: (org.name_ar || org.name) + ' — الفعاليات',
    description: org.tagline || `فعاليات ${org.name_ar || org.name}`,
    openGraph: {
      title: org.name_ar || org.name,
      description: org.tagline || '',
      images: org.cover_image ? [org.cover_image] : org.logo_url ? [org.logo_url] : [],
    },
  }
}

export default async function OrgCatalogPage({ params }: { params: { slug: string } }) {
  const cookieStore = cookies()
  const sb = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (n) => cookieStore.get(n)?.value } }
  )

  const { data: org } = await sb.from('organizations')
    .select('*')
    .eq('slug', params.slug)
    .eq('catalog_enabled', true)
    .single()

  if (!org) notFound()

  const now = new Date().toISOString()

  // Upcoming events
  const { data: upcoming } = await sb.from('events')
    .select('id,title,description,cover_image,start_date,end_date,location,category,category_icon,is_featured,price_from,is_public,status,capacity,slug')
    .eq('org_id', org.id)
    .eq('is_public', true)
    .in('status', ['published','active'])
    .gte('start_date', now)
    .order('is_featured', { ascending: false })
    .order('start_date', { ascending: true })
    .limit(20)

  // Past events
  const { data: past } = await sb.from('events')
    .select('id,title,cover_image,start_date,location,category,category_icon,slug')
    .eq('org_id', org.id)
    .eq('is_public', true)
    .lt('start_date', now)
    .order('start_date', { ascending: false })
    .limit(12)

  return <OrgCatalogClient org={org} upcoming={upcoming || []} past={past || []} />
}
