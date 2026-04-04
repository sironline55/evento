export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TicketType {
  label: string;
  price: number;
}

export interface Event {
  id: string;
  account_id: string;
  title: string;
  description: string;
  date: string; // ISO date string
  location: string;
  organizerId: string;
  maxAttendees?: number;
  ticketTypes?: TicketType[];
  createdAt: string;
  updatedAt: string;
}

export interface EventStats {
  eventId: string;
  totalAttendees: number;
  checkedIn: number;
  registered: number;
  cancelled: number;
  revenue: number;
}

export interface Attendee {
  id: string;
  eventId: string;
  userId: string;
  status: 'registered' | 'attended' | 'cancelled';
  registeredAt: string;
  attendedAt?: string;
  name?: string;
  company?: string;
  ticketType?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  user_metadata: {
    name?: string;
    avatar_url?: string;
  };
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  name_en: string;
  slug: string;
  price_monthly: number | null;
  price_yearly: number | null;
  currency: string;
  max_events: number | null;
  max_attendees_per_event: number | null;
  max_total_attendees: number | null;
  max_team_members: number;
  max_sms: number;
  max_import_rows: number | null;
  badge_printing: boolean;
  parking_management: boolean;
  zones_management: boolean;
  excel_import: boolean;
  google_forms_import: boolean;
  api_access: boolean;
  white_label: boolean;
  custom_domain: boolean;
  priority_support: boolean;
  is_active: boolean;
  is_featured: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface AccountSubscription {
  id: string;
  account_id: string;
  plan_id: string;
  status: 'active' | 'cancelled' | 'expired' | 'trial';
  trial_ends_at: string | null;
  current_period_start: string;
  current_period_end: string;
  payment_ref: string | null;
  cancelled_at: string | null;
  created_at: string;
  plan?: SubscriptionPlan;
}

export interface PlanUsageStats {
  plan: SubscriptionPlan;
  current_events: number;
  current_attendees: number;
  current_sms: number;
  current_team_members: number;
  period_end: string;
}

export interface AttendeeLimit {
  allowed: boolean;
  current: number;
  max: number | null;
  percentage: number;
}