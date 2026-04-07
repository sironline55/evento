import { createBrowserClient } from '@supabase/ssr'
import { Registration } from '../types'

const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export class AttendeeService {
  /** جلب كل المسجلين لفعالية */
  async getByEvent(eventId: string): Promise<Registration[]> {
    const { data, error } = await supabase
      .from('registrations')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  }

  /** جلب مسجل واحد */
  async getById(id: string): Promise<Registration | null> {
    const { data, error } = await supabase
      .from('registrations')
      .select('*')
      .eq('id', id)
      .single()
    if (error) return null
    return data
  }

  /** تحديث حالة المسجل */
  async updateStatus(
    id: string,
    status: Registration['status'],
    checked_in_at?: string
  ): Promise<Registration> {
    const updates: Partial<Registration> = { status }
    if (status === 'attended' && checked_in_at) {
      updates.checked_in_at = checked_in_at
      updates.check_in_method = 'manual'
    }
    const { data, error } = await supabase
      .from('registrations')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  }

  /** إلغاء تسجيل */
  async cancel(id: string): Promise<void> {
    const { error } = await supabase
      .from('registrations')
      .update({ status: 'cancelled' })
      .eq('id', id)
    if (error) throw error
  }

  /** إحصائيات سريعة */
  async getStats(eventId: string) {
    const { data } = await supabase
      .from('registrations')
      .select('status')
      .eq('event_id', eventId)
    const list = data || []
    return {
      total: list.length,
      attended: list.filter(r => r.status === 'attended').length,
      registered: list.filter(r => r.status === 'registered').length,
      cancelled: list.filter(r => r.status === 'cancelled').length,
    }
  }
}
