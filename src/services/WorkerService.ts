'use client'
import { createBrowserClient } from '@supabase/ssr'

const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export class WorkerService {
  /** تسجيل عامل جديد - self registration */
  static async register(data: {
    full_name: string
    phone: string
    email?: string
    city: string
    gender: 'male' | 'female'
    age?: number
    skills: string[]
    experience_years: number
    daily_rate: number
    availability: string[]
    event_types: string[]
    source?: string
    attendee_id?: string
  }) {
    const { data: worker, error } = await supabase
      .from('worker_profiles')
      .insert({
        ...data,
        source: data.source || 'self_registered',
        is_verified: false,
        is_available: true,
        rating: 0,
        total_jobs: 0,
        status: 'active'
      })
      .select()
      .single()
    if (error) throw error
    return worker
  }

  /** جلب قائمة العمال مع فلاتر */
  static async search(filters: {
    city?: string
    gender?: string
    min_rate?: number
    max_rate?: number
    skills?: string[]
    is_available?: boolean
    limit?: number
    offset?: number
  }) {
    let query = supabase
      .from('worker_profiles')
      .select('*')
      .in('status', ['active', 'pending'])
    if (filters.city) query = query.eq('city', filters.city)
    if (filters.gender && filters.gender !== 'any') query = query.eq('gender', filters.gender)
    if (filters.min_rate) query = query.gte('daily_rate', filters.min_rate)
    if (filters.max_rate) query = query.lte('daily_rate', filters.max_rate)
    if (filters.is_available !== undefined) query = query.eq('is_available', filters.is_available)
    query = query.order('rating', { ascending: false })
      .range(filters.offset || 0, (filters.offset || 0) + (filters.limit || 20) - 1)
    const { data, error } = await query
    if (error) throw error
    return data || []
  }

  /** opt-in من زائر فعالية - يقبل البيانات مباشرة بدون جدول attendees */
  static async optInFromAttendee(
    attendeeId: string,
    attendeeData: { full_name: string; phone: string; email?: string },
    workerData: {
      city: string
      gender: 'male' | 'female'
      daily_rate: number
      skills: string[]
      availability: string[]
    }
  ) {
    return this.register({
      full_name: attendeeData.full_name,
      phone: attendeeData.phone,
      email: attendeeData.email,
      ...workerData,
      experience_years: 0,
      event_types: ['general'],
      source: 'attendee_optin',
      attendee_id: attendeeId
    })
  }

  /** إحصائيات قاعدة البيانات */
  static async getStats() {
    const { count: total } = await supabase
      .from('worker_profiles')
      .select('*', { count: 'exact', head: true })
    const { count: active } = await supabase
      .from('worker_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')
    const { count: available } = await supabase
      .from('worker_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('is_available', true)
    return { total: total || 0, active: active || 0, available: available || 0 }
  }

  /** طلب توظيف جديد */
  static async createRequest(data: {
    account_id?: string
    event_id?: string
    title: string
    city: string
    event_date: string
    duration_hours: number
    workers_needed: number
    role_type: string
    daily_rate: number
    gender_preference?: string
    description?: string
  }) {
    const { data: req, error } = await supabase
      .from('staffing_requests')
      .insert({ ...data, workers_confirmed: 0, status: 'open' })
      .select()
      .single()
    if (error) throw error
    return req
  }
}
