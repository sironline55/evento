import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Email sender using Resend (mock if no API key)
async function sendTicketEmail(opts: {
  to: string; name: string; eventName: string; eventDate: string;
  eventLocation: string; ticketCode: string; ticketUrl: string;
}): Promise<{ ok: boolean; mock?: boolean }> {
  const resendKey = process.env.RESEND_API_KEY

  if (!resendKey) {
    console.log(`[Email MOCK] Ticket email to: ${opts.to}\nEvent: ${opts.eventName}\nCode: ${opts.ticketCode}\nURL: ${opts.ticketUrl}`)
    return { ok: true, mock: true }
  }

  const html = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;background:#0A0A1A;font-family:'Segoe UI',Tahoma,sans-serif;">
<div style="max-width:560px;margin:0 auto;padding:40px 20px;">
  <div style="text-align:center;margin-bottom:32px;">
    <div style="font-size:40px">🎫</div>
    <h1 style="color:#fff;font-size:22px;margin:12px 0 4px">تذكرتك جاهزة!</h1>
    <p style="color:rgba(255,255,255,.6);font-size:14px;margin:0">حجزك مؤكد — نراك قريباً</p>
  </div>
  <div style="background:linear-gradient(135deg,#1E0A3C,#2D1060);border-radius:16px;overflow:hidden;margin-bottom:24px;">
    <div style="height:4px;background:linear-gradient(90deg,#F05537,#FF8C42)"></div>
    <div style="padding:24px;">
      <h2 style="color:#fff;font-size:18px;margin:0 0 16px">${opts.eventName}</h2>
      <div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:20px;">
        <div style="background:rgba(255,255,255,.08);border-radius:8px;padding:10px 14px;flex:1;">
          <div style="font-size:10px;color:rgba(255,255,255,.5);margin-bottom:3px">📅 التاريخ</div>
          <div style="font-size:13px;font-weight:700;color:#fff">${opts.eventDate}</div>
        </div>
        <div style="background:rgba(255,255,255,.08);border-radius:8px;padding:10px 14px;flex:1;">
          <div style="font-size:10px;color:rgba(255,255,255,.5);margin-bottom:3px">📍 الموقع</div>
          <div style="font-size:13px;font-weight:700;color:#fff">${opts.eventLocation}</div>
        </div>
      </div>
      <div style="border-top:1px dashed rgba(255,255,255,.15);padding-top:16px;display:flex;align-items:center;gap:16px;">
        <div>
          <div style="font-size:10px;color:rgba(255,255,255,.5);margin-bottom:4px">رمز التذكرة</div>
          <div style="font-size:16px;font-weight:900;color:#fff;letter-spacing:2px;direction:ltr">${opts.ticketCode}</div>
        </div>
        <div style="background:rgba(255,255,255,.07);border-radius:8px;padding:10px 14px;font-size:11px;color:rgba(255,255,255,.6);flex:1;">
          اعرض هذا الرمز عند الدخول للفعالية
        </div>
      </div>
    </div>
  </div>
  <div style="text-align:center;">
    <a href="${opts.ticketUrl}" style="display:inline-block;padding:14px 32px;background:#F05537;border-radius:12px;color:#fff;font-weight:700;font-size:15px;text-decoration:none;">
      🎫 عرض تذكرتي الكاملة
    </a>
  </div>
  <p style="text-align:center;color:rgba(255,255,255,.3);font-size:11px;margin-top:24px;">
    EventVMS — منصة إدارة الفعاليات والكوادر البشرية
  </p>
</div>
</body></html>`

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'EventVMS <tickets@eventvms.com>',
      to: [opts.to],
      subject: `🎫 تذكرتك لـ ${opts.eventName}`,
      html,
    })
  })
  const data = await res.json()
  return { ok: !!data.id }
}

export async function POST(req: NextRequest) {
  const { registrationId, email } = await req.json()
  if (!registrationId) return NextResponse.json({ error: 'registrationId required' }, { status: 400 })

  const sb = createClient(SB_URL, SB_KEY)

  // Get registration + event
  const { data: reg } = await sb.from('registrations').select('*, events(title,start_date,location)').eq('id', registrationId).single()
  if (!reg) return NextResponse.json({ error: 'Registration not found' }, { status: 404 })

  const sendTo = email || reg.attendee_email || reg.email
  if (!sendTo) return NextResponse.json({ error: 'No email address' }, { status: 400 })

  const event = (reg as any).events
  const ticketUrl = `https://evento-h2ir.vercel.app/ticket/${reg.qr_code}`
  const eventDate = event?.start_date ? new Date(event.start_date).toLocaleDateString('ar-SA', { weekday:'long', year:'numeric', month:'long', day:'numeric' }) : '—'

  const result = await sendTicketEmail({
    to: sendTo,
    name: reg.attendee_name || 'الحضور الكريم',
    eventName: event?.title || 'الفعالية',
    eventDate,
    eventLocation: event?.location || '—',
    ticketCode: reg.qr_code,
    ticketUrl,
  })

  // Log notification
  await sb.from('notification_log').insert({
    user_id: reg.user_id || null,
    phone: sendTo,
    type: 'ticket_email',
    category: 'events',
    title: 'تذكرة بالإيميل',
    message: `تذكرة ${event?.name} أُرسلت لـ ${sendTo}`,
    status: result.mock ? 'mock' : result.ok ? 'sent' : 'failed',
    reference_id: registrationId,
    provider: result.mock ? 'mock' : 'resend',
  })

  return NextResponse.json({ ok: result.ok, mock: result.mock || false, ticketUrl })
}
