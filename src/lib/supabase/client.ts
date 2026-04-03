'use client';
import { createBrowserClient } from '@supabase/ssr';

/**
 * [AR] إنشاء Supabase client للمتصفح
 * [EN] Create Supabase browser client
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
