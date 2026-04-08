import QRCode from 'qrcode'
import { createBrowserClient } from '@supabase/ssr'
import { v4 as uuidv4 } from 'uuid'


export class QRService {
  /** توليد QR code كـ Data URL */
  static async generate(data: string): Promise<string> {
    return QRCode.toDataURL(data, {
      width: 300,
      margin: 2,
      color: { dark: '#000000', light: '#FFFFFF' },
      errorCorrectionLevel: 'H'
    })
  }

  /** توليد QR code كـ SVG string */
  static async generateSVG(data: string): Promise<string> {
    return QRCode.toString(data, { type: 'svg', errorCorrectionLevel: 'H' })
  }

  /** إنشاء registration جديد مع QR code */
  static async createRegistration(params: {
    event_id: string
    guest_name: string
    guest_email?: string
    guest_phone?: string
    ticket_type?: string
    user_id?: string
    source?: string
    notes?: string
  }) {
    const registrationId = uuidv4()
    const qrData = JSON.stringify({
      id: registrationId,
      event_id: params.event_id,
      v: 1
    })

    const { data, error } = await this.supabase
      .from('registrations')
      .insert({
        id: registrationId,
        event_id: params.event_id,
        user_id: params.user_id,
        guest_name: params.guest_name,
        guest_email: params.guest_email,
        guest_phone: params.guest_phone,
        ticket_type: params.ticket_type || 'general',
        qr_code: qrData,
        source: params.source || 'self',
        notes: params.notes,
        status: 'registered'
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  /** مسح QR code والتحقق من الصحة */
  static async validateAndCheckIn(qrData: string): Promise<{
    valid: boolean
    registration?: any
    message: string
  }> {
    let parsed: { id: string; event_id: string }
    try {
      parsed = JSON.parse(qrData)
    } catch {
      return { valid: false, message: 'رمز QR غير صالح' }
    }

    if (!parsed.id || !parsed.event_id) {
      return { valid: false, message: 'بيانات QR غير مكتملة' }
    }

    const { data: reg, error } = await this.supabase
      .from('registrations')
      .select('*, events(title)')
      .eq('id', parsed.id)
      .eq('event_id', parsed.event_id)
      .single()

    if (error || !reg) {
      return { valid: false, message: 'التسجيل غير موجود' }
    }

    if (reg.status === 'attended') {
      return { valid: false, registration: reg, message: 'تم تسجيل الدخول مسبقاً' }
    }

    if (reg.status === 'cancelled') {
      return { valid: false, registration: reg, message: 'التسجيل ملغي' }
    }

    // تسجيل الدخول
    const { data: updated, error: updateError } = await this.supabase
      .from('registrations')
      .update({
        status: 'attended',
        checked_in_at: new Date().toISOString(),
        check_in_method: 'qr_scan'
      })
      .eq('id', parsed.id)
      .select()
      .single()

    if (updateError) throw updateError

    return { valid: true, registration: updated, message: 'تم تسجيل الدخول بنجاح ✅' }
  }

  /** جلب جميع تسجيلات فعالية مع إحصائيات */
  static async getEventRegistrations(eventId: string) {
    const { data, error } = await this.supabase
      .from('registrations')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false })

    if (error) throw error

    const total = data?.length || 0
    const attended = data?.filter(r => r.status === 'attended').length || 0
    const registered = data?.filter(r => r.status === 'registered').length || 0

    return { registrations: data || [], stats: { total, attended, registered } }
  }
}
