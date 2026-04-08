import { createClient } from '@supabase/supabase-js';
export class BaseService {
  protected get supabase() { return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!) }
  protected async logActivity(a:string,b:string,c:Record<string,unknown>={}) { const {error}=await this.supabase.from('activity_logs').insert({account_id:a,action:b,metadata:c,created_at:new Date().toISOString()}); if(error) console.warn(error.message) }
}
