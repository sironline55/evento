import XLSX from 'xlsx';
import { BaseService } from './BaseService';
import { Event, EventStats, TicketType } from '../types';

export type EventCreateParams = Omit<Event, 'id' | 'createdAt' | 'updatedAt'>;
export type EventUpdateParams = Partial<Omit<Event, 'id' | 'createdAt' | 'updatedAt' | 'account_id'>>;

export class EventService extends BaseService {
  async list(accountId: string): Promise<Event[]> {
    const { data, error } = await this.supabase
      .from('events')
      .select('*')
      .eq('account_id', accountId)
      .order('date', { ascending: true });

    if (error) throw error;
    await this.logActivity(accountId, 'event.list', {});
    return data || [];
  }

  async getById(id: string, accountId: string): Promise<Event | null> {
    const { data, error } = await this.supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .eq('account_id', accountId)
      .single();

    if (error) return null;
    await this.logActivity(accountId, 'event.getById', { eventId: id });
    return data;
  }

  async create(params: EventCreateParams): Promise<Event> {
    const { data, error } = await this.supabase
      .from('events')
      .insert(params)
      .select()
      .single();

    if (error) throw error;
    await this.logActivity(params.account_id, 'event.create', { eventId: data.id, title: params.title });
    return data;
  }

  async update(id: string, accountId: string, updates: EventUpdateParams): Promise<Event> {
    const { data, error } = await this.supabase
      .from('events')
      .update(updates)
      .eq('id', id)
      .eq('account_id', accountId)
      .select()
      .single();

    if (error) throw error;
    await this.logActivity(accountId, 'event.update', { eventId: id, updates });
    return data;
  }

  async delete(id: string, accountId: string): Promise<void> {
    const { error } = await this.supabase
      .from('events')
      .delete()
      .eq('id', id)
      .eq('account_id', accountId);

    if (error) throw error;
    await this.logActivity(accountId, 'event.delete', { eventId: id });
  }

  async getStats(eventId: string, accountId: string): Promise<EventStats> {
    const event = await this.getById(eventId, accountId);
    if (!event) {
      return {
        eventId,
        totalAttendees: 0,
        checkedIn: 0,
        registered: 0,
        cancelled: 0,
        revenue: 0,
      };
    }

    const { data, error } = await this.supabase
      .from('attendees')
      .select('status, ticketType')
      .eq('eventId', eventId)
      .order('registeredAt', { ascending: true });

    if (error) throw error;

    const ticketPriceMap = new Map<string, number>();
    (event.ticketTypes || []).forEach((ticket: TicketType) => {
      ticketPriceMap.set(ticket.label, ticket.price);
    });

    const stats = {
      eventId,
      totalAttendees: 0,
      checkedIn: 0,
      registered: 0,
      cancelled: 0,
      revenue: 0,
    };

    (data || []).forEach(({ status, ticketType }) => {
      stats.totalAttendees += 1;

      if (status === 'attended') {
        stats.checkedIn += 1;
      }
      if (status === 'registered') {
        stats.registered += 1;
      }
      if (status === 'cancelled') {
        stats.cancelled += 1;
      }

      const price = ticketType ? ticketPriceMap.get(ticketType) ?? 0 : 0;
      stats.revenue += price;
    });

    await this.logActivity(accountId, 'event.getStats', { eventId });
    return stats;
  }

  async exportAttendeesExcel(eventId: string, accountId: string): Promise<ArrayBuffer> {
    const { data, error } = await this.supabase
      .from('attendees')
      .select('*')
      .eq('eventId', eventId);

    if (error) throw error;

    const rows = (data || []).map((attendee) => ({
      Name: attendee.name || '',
      Company: attendee.company || '',
      'Ticket Type': attendee.ticketType || '',
      Status: attendee.status,
      'Registered At': attendee.registeredAt,
      'Checked In At': attendee.attendedAt || '',
    }));

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendees');
    const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

    await this.logActivity(accountId, 'event.exportAttendeesExcel', { eventId });
    return buffer as ArrayBuffer;
  }
}