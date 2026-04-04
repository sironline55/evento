
export interface WorkerProfile {
  id: string
  account_id?: string
  attendee_id?: string
  full_name: string
  email?: string
  phone: string
  city: string
  gender: 'male' | 'female'
  age?: number
  photo_url?: string
  bio?: string
  skills: string[]
  experience_years: number
  daily_rate: number
  availability: ('sat' | 'sun' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri')[]
  event_types: string[]
  id_number?: string
  is_verified: boolean
  is_available: boolean
  rating: number
  total_jobs: number
  source: 'self_registered' | 'attendee_optin' | 'company_upload'
  status: 'pending' | 'active' | 'inactive' | 'blocked'
  created_at: string
  updated_at: string
}

export interface WorkerApplication {
  id: string
  worker_id: string
  staffing_request_id: string
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn'
  cover_note?: string
  created_at: string
}

export interface StaffingRequest {
  id: string
  account_id: string
  event_id?: string
  title: string
  description?: string
  city: string
  event_date: string
  event_time?: string
  duration_hours: number
  workers_needed: number
  workers_confirmed: number
  role_type: string
  gender_preference?: 'male' | 'female' | 'any'
  daily_rate: number
  requirements?: string[]
  status: 'open' | 'filled' | 'cancelled' | 'completed'
  created_at: string
}
