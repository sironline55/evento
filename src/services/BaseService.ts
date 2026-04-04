import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export class BaseService {
  protected supabase = createClient(supabaseUrl, supabaseKey);

  constructor() {
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase environment variables not set');
    }
  }

  protected async logActivity(accountId: string, action: string, metadata: Record<string, unknown> = {}) {
    const { error } = await this.supabase.from('activity_logs').insert({
      account_id: accountId,
      action,
      metadata,
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.warn('Failed to log activity:', error.message);
    }
  }
}