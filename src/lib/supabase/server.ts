import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * [AR] إنشاء Supabase client للـ server
 * [EN] Create Supabase server client for API routes and Server Components
 */
export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: any[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }: any) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component - cookies cannot be set
          }
        },
      },
    }
  );
}
