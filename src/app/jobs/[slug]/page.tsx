import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import PublicJobClient from './PublicJobClient'

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const sb = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (n) => cookies().get(n)?.value } }
  )
  const { data } = await sb.from('staffing_requests')
    .select('title,city,role_type,daily_rate,cover_image,org_name')
    .eq('slug', params.slug).single()
  if (!data) return { title: 'وظيفة غير موجودة' }
  return {
    title: `${data.title} — ${data.city} | EventVMS`,
    description: `${data.role_type} · ${data.city} · ${data.daily_rate} ر.س/يوم`,
    openGraph: {
      title: data.title,
      description: `${data.role_type} · ${data.city} · ${data.daily_rate} ر.س/يوم`,
      images: data.cover_image ? [data.cover_image] : [],
    },
  }
}

export default async function JobPage({ params }: { params: { slug: string } }) {
  const sb = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (n) => cookies().get(n)?.value } }
  )
  const { data: job } = await sb.from('staffing_requests')
    .select('*')
    .eq('slug', params.slug)
    .eq('has_public_page', true)
    .single()
  if (!job) notFound()
  // Increment view count (fire and forget)
  sb.rpc('increment_staffing_views', { req_id: job.id }).then(() => {})
  return <PublicJobClient job={job} />
}
