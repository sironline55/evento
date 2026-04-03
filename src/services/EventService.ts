import { BaseService } from './BaseService';
import { Event } from '../types';

export class EventService extends BaseService {
  async getAll(): Promise<Event[]> {
    const { data, error } = await this.supabase
      .from('events')
      .select('*')
      .order('date', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async getById(id: string): Promise<Event | null> {
    const { data, error } = await this.supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return data;
  }

  async create(event: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>): Promise<Event> {
    const { data, error } = await this.supabase
      .from('events')
      .insert(event)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async update(id: string, updates: Partial<Omit<Event, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Event> {
    const { data, error } = await this.supabase
      .from('events')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('events')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async getByOrganizer(organizerId: string): Promise<Event[]> {
    const { data, error } = await this.supabase
      .from('events')
      .select('*')
      .eq('organizerId', organizerId)
      .order('date', { ascending: true });

    if (error) throw error;
    return data || [];
  }
}