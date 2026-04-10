import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  try {
    const { sessionId } = await req.json()
    if (!sessionId) return NextResponse.json({ error: 'sessionId مطلوب' }, { status: 400 })

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
    if (new Date(session.expires_at) < new Date()) {
      await sb.from('nafath_sessions').update({ status: 'expired' }).eq('id', sessionId)
      return NextResponse.json({ status: 'EXPIRED' })
    }
    if (session.status !== 'waiting') {
      return NextResponse.json({ status: session.status.toUpperCase() })
    }

    // ── TODO: Replace with real API call ──────────────────────────────
    // const cfg = PROVIDER_CONFIG[PROVIDER]
    // const res = await fetch(`${cfg.baseUrl}/ExtNafath/status`, {
    //   method: 'POST',
    //   headers: { 'Authorization': `Bearer ${cfg.apiKey}`, 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ transId: session.trans_id, random: session.random_code, nationalId: session.national_id }),
    // })
    // const { result } = await res.json()
    // return NextResponse.json({ status: result.status })

    // ── MOCK: always returns WAITING (will be COMPLETED after real key) ──
    return NextResponse.json({ status: 'WAITING' })

  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
