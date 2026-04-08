import { createClient } from '@supabase/supabase-js';

export class BaseService {
  protected get supabase() {
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }

  protected async logActivity(accountId: string, action: string, metadata: Record<string, unknown> = {}) {
    const { error } = await this.supabase.from('activity_logs').insert({
      account_id: accountId,
      action,
      metadata,
      created_at: new Date().toISOString(),
    });
    if (error) console.warn('Failed to log activity:', error.message);
  }
}
