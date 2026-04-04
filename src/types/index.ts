// Types aligned with Supabase DB schema

export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  created_at: string
  updated_at: string
}

export interface Event {
  id: string
  created_by: string
  title: string
  description?: string
  location?: string
  start_date: string
  end_date?: string
  capacity?: number
  is_public: boolean
  status: 'draft' | 'published' | 'cancelled' | 'completed'
  slug?: string
  created_at: string
  updated_at: string
}

export interface EventStats {
  eventId: string
  totalAttendees: number
  checkedIn: number
  registered: number
  cancelled: number
}

export interface Registration {
  id: string
  event_id: string
  user_id?: string
  guest_name: string
  guest_email?: string
  guest_phone?: string
  status: 'registered' | 'attended' | 'cancelled' | 'no_show'
  qr_code?: string
  ticket_type?: string
  checked_in_at?: string
  check_in_method?: string
  source?: string
  notes?: string
  created_at: string
}

// Legacy alias for backward compat
export type Attendee = Registration & {
  name?: string
  eventId?: string
  userId?: string
}

export interface AuthUser {
  id: string
  email: string
  user_metadata: {
    name?: string
    avatar_url?: string
    full_name?: string
  }
}

export interface Profile {
  id: string
  full_name?: string
  email?: string
  phone?: string
  avatar_url?: string
  role: 'super_admin' | 'admin' | 'editor'
  organization?: string
  created_at: string
  updated_at: string
}

export interface SubscriptionPlan {
  id: string
  name: string
  name_en: string
  slug: string
  price_monthly: number | null
  price_yearly: number | null
  currency: string
  max_events: number | null
  max_attendees_per_event: number | null
  max_total_attendees: number | null
  max_team_members: number
  max_sms: number
  max_import_rows: number | null
  badge_printing: boolean
  parking_management: boolean
  zones_management: boolean
  excel_import: boolean
  google_forms_import: boolean
  api_access: boolean
  white_label: boolean
  custom_domain: boolean
  priority_support: boolean
  is_active: boolean
  is_featured: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface AttendeeLimit {
  allowed: boolean
  current: number
  max: number | null
  percentage: number
}
