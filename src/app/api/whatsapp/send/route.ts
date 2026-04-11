import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// ══════════════════════════════════════════════════════════
// WhatsApp Send API — Mock mode by default
// To activate: set WHATSAPP_TOKEN + WHATSAPP_PHONE_ID in Vercel
// ══════════════════════════════════════════════════════════

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SB_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// WhatsApp message templates (Arabic)
const TEMPLATES: Record<string, (data: any) => string> = {
  // ── Events ──────────────────────────────────────────────
  event_new: (d) =>
    `🎪 *فعالية جديدة!*\n\n*${d.event_name}*\n📅 ${d.event_date}\n📍 ${d.location}\n💰 ${d.price || 'مجاني'}\n\n👉 سجّل الآن: ${d.url}`,

  event_reminder: (d) =>
    `⏰ *تذكير: فعاليتك غداً!*\n\n*${d.event_name}*\n📅 ${d.event_date} | ${d.event_time}\n📍 ${d.location}\n\n🎫 تذكرتك: ${d.ticket_code}\n\nنراك قريباً! 🎉`,

  ticket_confirmed: (d) =>
    `✅ *تأكيد تسجيلك*\n\nأهلاً ${d.name}،\nتم تسجيلك بنجاح في:\n\n*${d.event_name}*\n📅 ${d.event_date}\n\n🎫 رقم تذكرتك: *${d.ticket_code}*\n\nاحتفظ بهذه الرسالة للدخول.`,

  // ── Staffing ────────────────────────────────────────────
  staff_application_received: (d) =>
    `📋 *طلب كوادر جديد*\n\n*${d.applicant_name}* تقدّم لطلب:\n"${d.job_title}"\n\n👉 راجع الطلب: ${d.url}`,

  staff_application_accepted: (d) =>
    `🎉 *تهانينا! قُبل طلبك*\n\nأهلاً ${d.name}،\nتم قبول طلبك للعمل في:\n\n*${d.job_title}*\n🏢 ${d.org_name}\n📅 ${d.event_date}\n\nسيتواصل معك المنظم قريباً.`,

  staff_shift_reminder: (d) =>
    `⏰ *تذكير: وردية اليوم*\n\nلديك وردية خلال ساعتين:\n\n*${d.job_title}*\n📍 ${d.location}\n🕐 ${d.start_time}\n\nكن في الموعد! 💪`,

  // ── Influencer / Campaign ───────────────────────────────
  inf_proposal_received: (d) =>
    `📩 *عرض جديد على بريفك!*\n\n*${d.influencer_name}* قدّم عرضاً على:\n"${d.brief_title}"\n\n💰 السعر المقترح: *${d.price} ريال*\n\n👉 راجع العرض: ${d.url}`,

  inf_proposal_accepted: (d) =>
    `🎉 *تهانينا! تم قبول عرضك*\n\nأهلاً ${d.name}،\nوافق المنظم على عرضك لحملة:\n\n*${d.brief_title}*\n💰 المبلغ: *${d.price} ريال*\n\nفي انتظار تحويل المبلغ للـ Escrow.`,

  inf_payment_held: (d) =>
    `🔒 *تم إيداع المبلغ في Escrow*\n\nأهلاً ${d.name}،\nالمنظم دفع مبلغ حملتك:\n\n💰 *${d.amount} ريال*\nمحفوظ بأمان — يُفرج بعد موافقتهم على المحتوى.\n\nابدأ التنفيذ الآن! 🚀`,

  inf_content_submitted: (d) =>
    `📤 *المؤثر سلّم المحتوى*\n\n*${d.influencer_name}* رفع المحتوى لحملة:\n"${d.brief_title}"\n\n👉 راجع وأقبل: ${d.url}\n\n⏰ سيُفرج المبلغ تلقائياً بعد 7 أيام.`,

  inf_payment_released: (d) =>
    `💸 *تم إفراج مبلغك!*\n\nأهلاً ${d.name}،\nتم تحويل مبلغ حملتك:\n\n💰 *${d.amount} ريال*\n\nشكراً على تعاملك مع EventVMS! ⭐`,

  // ── System ──────────────────────────────────────────────
  system_updates: (d) =>
    `🆕 *تحديث جديد في EventVMS*\n\n${d.title}\n\n${d.body}\n\n👉 ${d.url}`,

  test: (d) =>
    `✅ *اختبار الإشعارات*\n\nأهلاً! هذه رسالة اختبار من EventVMS.\nنظام الإشعارات يعمل بشكل صحيح. 🎉`,
}

async function sendWhatsApp(phone: string, message: string): Promise<{ok: boolean; id?: string; error?: string; mock?: boolean}> {
  const token = process.env.WHATSAPP_TOKEN
  const phoneId = process.env.WHATSAPP_PHONE_ID

  // ── MOCK MODE ─────────────────────────────────────────
  if (!token || !phoneId) {
    console.log(`[WhatsApp MOCK] To: ${phone}\nMessage: ${message}`)
    return { ok: true, id: `mock_${Date.now()}`, mock: true }
  }

  // ── REAL MODE (WhatsApp Cloud API) ───────────────────
  try {
    const res = await fetch(`https://graph.facebook.com/v18.0/${phoneId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: phone.replace(/\D/g, ''),
        type: 'text',
        text: { body: message, preview_url: false },
      }),
    })
    const data = await res.json()
    if (data.messages?.[0]?.id) {
      return { ok: true, id: data.messages[0].id }
    }
    return { ok: false, error: JSON.stringify(data) }
  } catch (e: any) {
    return { ok: false, error: e.message }
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { type, userId, phone: rawPhone, data: templateData, referenceId } = body

    if (!type || !userId || !rawPhone) {
      return NextResponse.json({ error: 'type, userId, phone required' }, { status: 400 })
    }

    const phone = rawPhone.startsWith('+') ? rawPhone : `+966${rawPhone.replace(/^0/, '')}`

    // Build message from template
    const templateFn = TEMPLATES[type]
    if (!templateFn) {
      return NextResponse.json({ error: `Unknown type: ${type}` }, { status: 400 })
    }
    const message = templateFn(templateData || {})

    // Determine category
    const category =
      type.startsWith('event_') || type === 'ticket_confirmed' ? 'events' :
      type.startsWith('staff_') ? 'staffing' :
      type.startsWith('inf_') ? 'influencer' : 'system'

    const title = {
      event_new: 'فعالية جديدة',
      event_reminder: 'تذكير بفعاليتك',
      ticket_confirmed: 'تأكيد التذكرة',
      staff_application_received: 'طلب كوادر جديد',
      staff_application_accepted: 'تم قبول طلبك',
      staff_shift_reminder: 'تذكير الوردية',
      inf_proposal_received: 'عرض مؤثر جديد',
      inf_proposal_accepted: 'تم قبول عرضك',
      inf_payment_held: 'مبلغ في Escrow',
      inf_content_submitted: 'محتوى مُسلَّم',
      inf_payment_released: 'تم إفراج المبلغ',
      system_updates: 'تحديث النظام',
      test: 'رسالة اختبار',
    }[type] || type

    // Send
    const result = await sendWhatsApp(phone, message)

    // Log to DB
    const sb = createClient(SB_URL, SB_SERVICE_KEY)
    await sb.from('notification_log').insert({
      user_id: userId,
      phone,
      type,
      category,
      title,
      message,
      status: result.mock ? 'mock' : result.ok ? 'sent' : 'failed',
      reference_id: referenceId || null,
      provider: result.mock ? 'mock' : 'whatsapp_cloud',
      external_id: result.id || null,
      error_msg: result.error || null,
    })

    return NextResponse.json({
      ok: result.ok,
      mock: result.mock || false,
      messageId: result.id,
    })
  } catch (e: any) {
    console.error('WhatsApp send error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
