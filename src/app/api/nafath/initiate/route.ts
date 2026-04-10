import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// ── Nafath API provider config ─────────────────────────────────────────
// Switch between providers by changing NAFATH_PROVIDER env var
// Supported: 'rabet' | 'azakaw'
const PROVIDER = process.env.NAFATH_PROVIDER || 'rabet'

const PROVIDER_CONFIG = {
  rabet: {
    baseUrl: process.env.NAFATH_RABET_BASE_URL || 'https://api.elm.sa',
    apiKey:  process.env.NAFATH_RABET_API_KEY  || '',
    requestPath: '/nafath/v1/request',
  },
  azakaw: {
    baseUrl: process.env.NAFATH_AZAKAW_BASE_URL || 'https://api.azakaw.com',
    apiKey:  process.env.NAFATH_AZAKAW_API_KEY  || '',
    requestPath: '/ExtNafath/request',
  },
}

export async function POST(req: NextRequest) {
  try {
    const { nationalId, purpose, eventId } = await req.json()

    if (!nationalId || !/^[12]\d{9}$/.test(nationalId)) {
      return NextResponse.json({ error: 'رقم هوية غير صحيح (10 أرقام)' }, { status: 400 })
    }

    // Auth check — user must be logged in
    const cookieStore = cookies()
    const sb = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { cookies: { get: (n) => cookieStore.get(n)?.value } }
    )
    const { data: { user } } = await sb.auth.getUser()
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

    // ── TODO: Replace with real API call when keys are obtained ──────────
    // const cfg = PROVIDER_CONFIG[PROVIDER]
    // const res = await fetch(`${cfg.baseUrl}${cfg.requestPath}`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${cfg.apiKey}` },
    //   body: JSON.stringify({ nationalId }),
    // })
    // const { result } = await res.json()
    // const { transId, random } = result

    // ── MOCK for development (remove after getting API key) ──────────────
    const transId  = `mock-${Date.now()}-${Math.random().toString(36).slice(2)}`
    const random   = String(Math.floor(10 + Math.random() * 90))

    // Store session in DB
    const { data: session, error } = await sb.from('nafath_sessions').insert({
      user_id:     user.id,
      trans_id:    transId,
      random_code: random,
      national_id: nationalId,
      purpose:     purpose || 'profile_verify',
      event_id:    eventId || null,
      status:      'waiting',
    }).select('id').single()

    if (error) throw error

    return NextResponse.json({ sessionId: session.id, transId, random })

  } catch (e: any) {
    console.error('[nafath/initiate]', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
