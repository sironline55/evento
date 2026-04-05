import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Public routes — no auth check
  const PUBLIC = ['/e/','/ticket/','/r/','/staff/login','/login','/register','/workers/register','/_next/','/api/','/favicon']
  if (PUBLIC.some(p => pathname.startsWith(p)) || pathname === '/') {
    return NextResponse.next()
  }

  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Not logged in
  if (!user) {
    // Staff routes → staff login
    if (pathname.startsWith('/staff')) {
      return NextResponse.redirect(new URL('/staff/login', request.url))
    }
    // Super admin → super admin login  
    if (pathname.startsWith('/super-admin')) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    // Dashboard → login
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Get profile role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, portal_role')
    .eq('id', user.id)
    .single()

  const role = profile?.role || 'admin'

  // Super admin guard
  if (pathname.startsWith('/super-admin') && role !== 'super_admin') {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Staff portal guard — check if user has a worker_profile
  if (pathname.startsWith('/staff')) {
    const { data: worker } = await supabase
      .from('worker_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()
    if (!worker && role !== 'super_admin') {
      return NextResponse.redirect(new URL('/', request.url))
    }
    return response
  }

  // If worker tries to access organizer dashboard, redirect to staff portal
  if (!pathname.startsWith('/super-admin') && !pathname.startsWith('/staff')) {
    const { data: worker } = await supabase
      .from('worker_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()
    if (worker && role !== 'super_admin' && role !== 'admin' && role !== 'organizer') {
      return NextResponse.redirect(new URL('/staff', request.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
