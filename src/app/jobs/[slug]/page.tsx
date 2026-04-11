import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import JobPageClient from './JobPageClient'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const cookieStore = cookies()
  const sb = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (n) => cookieStore.get(n)?.value } }
  )
  const { data } = await sb.from('staffing_requests').select('title,description,cover_image,city,role_type').eq('slug', params.slug).single()
  if (!data) return { title: 'فرصة توظيف' }
  return {
    title: data.title + ' | EventVMS',
    description: data.description || `${data.role_type} في ${data.city}`,
    openGraph: {
      title: data.title,
      description: data.description || `${data.role_type} في ${data.city}`,
      images: data.cover_image ? [data.cover_image] : [],
    },
  }
}

export default async function JobPage({ params }: { params: { slug: string } }) {
  const cookieStore = cookies()
  const sb = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (n) => cookieStore.get(n)?.value } }
  )
  const { data: job } = await sb.from('staffing_requests')
    .select('*')
    .eq('slug', params.slug)
    .eq('has_public_page', true)
    .single()

  if (!job) notFound()

  // Increment view count (fire and forget)
  sb.from('staffing_requests').update({ views_count: (job.views_count || 0) + 1 }).eq('id', job.id)

  return <JobPageClient job={job} />
}
