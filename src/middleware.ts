import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const sb = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(c) {
          c.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          c.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    }
  )

  const { data: { user } } = await sb.auth.getUser()
  const path = request.nextUrl.pathname

  // Public paths — no auth needed
  const PUBLIC = ['/login', '/register', '/r/', '/e/', '/ticket/', '/staff/login', '/workers/register']
  if (PUBLIC.some(p => path.startsWith(p))) return supabaseResponse

  // Not logged in → login
  if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Get profile + org membership
  const [{ data: profile }, { data: membership }] = await Promise.all([
    sb.from('profiles').select('role, portal_type').eq('id', user.id).single(),
    sb.from('org_members').select('role, org_id').eq('user_id', user.id).eq('status', 'active').single()
  ])

  const isSuperAdmin = profile?.role === 'super_admin'
  const isOrgOwner   = !membership || profile?.portal_type === 'organizer'
  const isStaff      = membership && !isSuperAdmin

  // Route enforcement
  if (path.startsWith('/super-admin') && !isSuperAdmin) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  if (path.startsWith('/staff') && !isStaff) {
    if (isSuperAdmin) return NextResponse.redirect(new URL('/super-admin', request.url))
    return NextResponse.redirect(new URL('/', request.url))
  }

  // After login redirect based on role
  if (path === '/login' && user) {
    if (isSuperAdmin) return NextResponse.redirect(new URL('/super-admin', request.url))
    if (isStaff)      return NextResponse.redirect(new URL('/staff', request.url))
    return NextResponse.redirect(new URL('/', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
