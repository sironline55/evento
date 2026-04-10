import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  try {
    const { sessionId } = await req.json()

    const cookieStore = cookies()
    const sb = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { cookies: { get: (n) => cookieStore.get(n)?.value } }
    )
    const { data: { user } } = await sb.auth.getUser()
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

    const { data: session } = await sb.from('nafath_sessions')
      .select('*').eq('id', sessionId).eq('user_id', user.id).single()
    if (!session) return NextResponse.json({ error: 'الجلسة غير موجودة' }, { status: 404 })

    // ── TODO: Fetch verified details from Nafath API ──────────────────
    // const cfg = PROVIDER_CONFIG[PROVIDER]
    // const res = await fetch(`${cfg.baseUrl}/ExtNafath/details/${session.trans_id}`, {
    //   headers: { 'Authorization': `Bearer ${cfg.apiKey}` },
    // })
    // const details = await res.json()
    // const verifiedName = [details.englishFirstName, details.englishLastName].join(' ')

    // ── MOCK verified name (replace with real details above) ─────────
    const verifiedName = 'Verified User'
    const maskedId = session.national_id.replace(/^(\d{1})(\d+)(\d{2})$/, '$1*****$3')

    // Update nafath_sessions
    await sb.from('nafath_sessions').update({
      status:        'completed',
      verified_name: verifiedName,
      verified_at:   new Date().toISOString(),
    }).eq('id', sessionId)

    if (session.purpose === 'profile_verify') {
      // Mark worker profile as Nafath verified
      await sb.from('worker_profiles').update({
        nafath_verified:      true,
        nafath_verified_at:   new Date().toISOString(),
        nafath_verified_name: verifiedName,
        nafath_id_masked:     maskedId,
        is_verified:          true,
      }).eq('user_id', user.id)
    }

    if (session.purpose === 'checkin' && session.event_id) {
      // Auto check-in the worker
      await sb.from('registrations').update({
        status:           'attended',
        checked_in_at:    new Date().toISOString(),
        check_in_method:  'nafath_verified',
      }).eq('event_id', session.event_id).eq('user_id', user.id)
    }

    return NextResponse.json({ success: true, verifiedName, maskedId })

  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
