export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string; // ISO date string
  location: string;
  organizerId: string;
  maxAttendees?: number;
  createdAt: string;
  updatedAt: string;
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