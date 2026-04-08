import * as XLSX from 'xlsx'
import { createBrowserClient } from '@supabase/ssr'
import { Event, EventStats, Registration } from '../types'


export type EventCreateParams = Omit<Event, 'id' | 'created_at' | 'updated_at'>
export type EventUpdateParams = Partial<Omit<Event, 'id' | 'created_at' | 'updated_at' | 'created_by'>>

export class EventService {
  /** قائمة فعاليات المستخدم الحالي */
  async list(userId: string): Promise<Event[]> {
    const { data, error } = await this.supabase
      .from('events')
      .select('*')
      .eq('created_by', userId)
      .order('start_date', { ascending: true })
    if (error) throw error
    return data || []
  }

  /** فعالية واحدة بالـ ID */
  async getById(id: string): Promise<Event | null> {
    const { data, error } = await this.supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .single()
    if (error) return null
    return data
  }

  /** إنشاء فعالية جديدة */
  async create(params: EventCreateParams): Promise<Event> {
    const { data, error } = await this.supabase
      .from('events')
      .insert(params)
      .select()
      .single()
    if (error) throw error
    return data
  }

  /** تحديث فعالية */
  async update(id: string, updates: EventUpdateParams): Promise<Event> {
    const { data, error } = await this.supabase
      .from('events')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  }

  /** حذف فعالية */
  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('events')
      .delete()
      .eq('id', id)
    if (error) throw error
  }

  /** إحصائيات فعالية */
  async getStats(eventId: string): Promise<EventStats> {
    const { data, error } = await this.supabase
      .from('registrations')
      .select('status')
      .eq('event_id', eventId)
    if (error) throw error

    const stats: EventStats = {
      eventId,
      totalAttendees: 0,
      checkedIn: 0,
      registered: 0,
      cancelled: 0,
    }
    ;(data || []).forEach(({ status }) => {
      stats.totalAttendees += 1
      if (status === 'attended') stats.checkedIn += 1
      if (status === 'registered') stats.registered += 1
      if (status === 'cancelled') stats.cancelled += 1
    })
    return stats
  }

  /** تصدير المسجلين كـ Excel */
  async exportRegistrationsExcel(eventId: string): Promise<ArrayBuffer> {
    const { data, error } = await this.supabase
      .from('registrations')
      .select('*')
      .eq('event_id', eventId)
    if (error) throw error

    const rows = (data || []).map((r: Registration) => ({
      'الاسم': r.guest_name || '',
      'البريد': r.guest_email || '',
      'الجوال': r.guest_phone || '',
      'نوع التذكرة': r.ticket_type || 'عام',
      'الحالة': r.status,
      'تاريخ التسجيل': r.created_at,
      'وقت الدخول': r.checked_in_at || '',
    }))

    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.json_to_sheet(rows)
    XLSX.utils.book_append_sheet(workbook, worksheet, 'المسجلون')
    return XLSX.write(workbook, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer
  }
}
