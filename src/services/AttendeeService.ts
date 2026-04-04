import { BaseService } from './BaseService';
import { Attendee } from '../types';
import { PlanService } from './PlanService';

export class AttendeeService extends BaseService {
  async getAll(): Promise<Attendee[]> {
    const { data, error } = await this.supabase
      .from('attendees')
      .select('*')
      .order('registeredAt', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getById(id: string): Promise<Attendee | null> {
    const { data, error } = await this.supabase
      .from('attendees')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return data;
  }

  async getByEvent(eventId: string): Promise<Attendee[]> {
    const { data, error } = await this.supabase
      .from('attendees')
      .select('*')
      .eq('eventId', eventId)
      .order('registeredAt', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getByUser(userId: string): Promise<Attendee[]> {
    const { data, error } = await this.supabase
      .from('attendees')
      .select('*')
      .eq('userId', userId)
      .order('registeredAt', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * [AR] تسجيل مسجل جديد في حدث مع فحص الحدود
   * [EN] Register a new attendee with subscription limit checking
   */
  async register(eventId: string, userId: string, accountId?: string): Promise<{ success: boolean; data?: Attendee; error?: string }> {
    // If accountId provided, check subscription limits
    if (accountId) {
      const planService = new PlanService();
      const limit = await planService.checkAttendeeLimit(accountId, eventId);
      
      if (!limit.allowed) {
        return {
          success: false,
          error: `وصلت إلى الحد الأقصى للمسجلين في خطتك (${limit.current}/${limit.max}). يرجى الترقية.`,
        };
      }
    }

    const { data, error } = await this.supabase
      .from('attendees')
      .insert({
        eventId,
        userId,
        status: 'registered',
        registeredAt: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    if (accountId) {
      await this.logActivity(accountId, 'attendee.register', { eventId, attendeeId: data.id });
    }

    return { success: true, data };
  }

  async updateStatus(id: string, status: Attendee['status'], attendedAt?: string): Promise<Attendee> {
    const updates: Partial<Attendee> = { status };
    if (status === 'attended' && attendedAt) {
      updates.attendedAt = attendedAt;
    }

    const { data, error } = await this.supabase
      .from('attendees')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async cancel(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('attendees')
      .update({ status: 'cancelled' })
      .eq('id', id);

    if (error) throw error;
  }
}