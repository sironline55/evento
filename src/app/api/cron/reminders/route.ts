import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// ══════════════════════════════════════════════════════════
// Cron Route: /api/cron/reminders
// Runs every hour via Vercel Cron
// Sends WhatsApp reminders:
//   - 24h before event  → reminder_24h
//   - 1h  before event  → reminder_1h
// Protected by CRON_SECRET env var
// ══════════════════════════════════════════════════════════

const SB_URL         = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SB_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const WA_TOKEN       = process.env.WHATSAPP_TOKEN
const WA_PHONE_ID    = process.env.WHATSAPP_PHONE_ID
const MOCK_MODE      = !WA_TOKEN || !WA_PHONE_ID

// Arabic WhatsApp message builders
function msg24h(d: { name: string; event: string; date: string; location: string; code: string }) {
  return `⏰ *تذكير: فعاليتك غداً!*\n\nأهلاً ${d.name}،\n\n*${d.event}*\n📅 ${d.date}\n📍 ${d.location}\n\n🎫 رمز تذكرتك: *${d.code}*\n\nنراك غداً! 🎉`
}

function msg1h(d: { name: string; event: string; date: string; location: string; code: string }) {
  return `🚨 *فعاليتك بعد ساعة!*\n\nأهلاً ${d.name}،\n\n*${d.event}*\n⏰ ${d.date}\n📍 ${d.location}\n\n🎫 تذكرتك: *${d.code}*\n\nكن على أهبة الاستعداد! 🏃`
}

async function sendWhatsApp(phone: string, message: string): Promise<{ ok: boolean; mock?: boolean; error?: string; id?: string }> {
  if (MOCK_MODE) {
    console.log(`[MOCK WA] → ${phone}: ${message.slice(0, 60)}...`)
    return { ok: true, mock: true, id: 'mock_' + Date.now() }
  }
  try {
    const res = await fetch(
      `https://graph.facebook.com/v18.0/${WA_PHONE_ID}/messages`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${WA_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: phone.replace(/\D/g, ''),
          type: 'text',
          text: { body: message }
        })
      }
    )
    const data = await res.json()
    if (!res.ok) return { ok: false, error: data.error?.message || 'WA error' }
    return { ok: true, id: data.messages?.[0]?.id }
  } catch (e: any) {
    return { ok: false, error: e.message }
  }
}

export async function GET(req: NextRequest) {
  // ── Auth ──
  const secret = req.headers.get('x-cron-secret') || req.nextUrl.searchParams.get('secret')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && secret !== cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const sb = createClient(SB_URL, SB_SERVICE_KEY)
  const now = new Date()
  const results = { sent: 0, skipped: 0, failed: 0, mock: MOCK_MODE, events_checked: 0 }

  // ── Find events in the next 1h–26h window ──
  const from24h = new Date(now.getTime() + 23 * 3600_000)  // 23h from now
  const to24h   = new Date(now.getTime() + 26 * 3600_000)  // 26h from now
  const from1h  = new Date(now.getTime() +      3_600_000) // 1h from now  (includes ±30min buffer)
  const to1h    = new Date(now.getTime() +  2 * 3600_000)  // 2h from now

  const { data: events24h } = await sb
    .from('events')
    .select('id, title, start_date, location')
    .eq('status', 'published')
    .gte('start_date', from24h.toISOString())
    .lte('start_date', to24h.toISOString())

  const { data: events1h } = await sb
    .from('events')
    .select('id, title, start_date, location')
    .eq('status', 'published')
    .gte('start_date', from1h.toISOString())
    .lte('start_date', to1h.toISOString())

  const allEvents = [
    ...(events24h || []).map(e => ({ ...e, reminderType: '24h' as const })),
    ...(events1h  || []).map(e => ({ ...e, reminderType: '1h'  as const })),
  ]
  results.events_checked = allEvents.length

  for (const ev of allEvents) {
    const col = ev.reminderType === '24h' ? 'reminder_24h_sent_at' : 'reminder_1h_sent_at'

    // Get registrations that haven't received this reminder yet
    const { data: regs } = await sb
      .from('registrations')
      .select('id, guest_name, guest_phone, qr_code')
      .eq('event_id', ev.id)
      .in('status', ['registered', 'waitlisted'])
      .not('guest_phone', 'is', null)
      .is(col, null)    // not sent yet

    if (!regs?.length) continue

    const eventDate = new Date(ev.start_date).toLocaleString('ar-SA', {
      weekday: 'short', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })

    for (const reg of regs) {
      if (!reg.guest_phone) { results.skipped++; continue }

      const msgData = {
        name:     reg.guest_name  || 'الحضور الكريم',
        event:    ev.title,
        date:     eventDate,
        location: ev.location     || 'انظر تفاصيل الفعالية',
        code:     reg.qr_code     || reg.id
      }
      const message = ev.reminderType === '24h' ? msg24h(msgData) : msg1h(msgData)

      const result = await sendWhatsApp(reg.guest_phone, message)

      if (result.ok) {
        // Mark as sent
        await sb.from('registrations').update({ [col]: now.toISOString() }).eq('id', reg.id)

        // Log in notification_log
        await sb.from('notification_log').insert({
          phone:        reg.guest_phone,
          type:         `event_reminder_${ev.reminderType}`,
          category:     'event',
          title:        `تذكير ${ev.reminderType === '24h' ? '24 ساعة' : 'ساعة'}: ${ev.title}`,
          message:      message,
          status:       result.mock ? 'mock' : 'sent',
          reference_id: ev.id,
          provider:     'whatsapp',
          external_id:  result.id || null
        })
        results.sent++
      } else {
        // Log failure
        await sb.from('notification_log').insert({
          phone:        reg.guest_phone,
          type:         `event_reminder_${ev.reminderType}`,
          category:     'event',
          title:        `فشل تذكير: ${ev.title}`,
          message:      message,
          status:       'failed',
          reference_id: ev.id,
          provider:     'whatsapp',
          error_msg:    result.error || 'unknown'
        })
        results.failed++
      }
    }
  }

  console.log('[Cron/reminders]', JSON.stringify(results))
  return NextResponse.json({
    ok: true,
    timestamp: now.toISOString(),
    ...results
  })
}
