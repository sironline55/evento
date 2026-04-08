import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

let _sb: ReturnType<typeof createBrowserClient> | null = null
function get() {
  if (!_sb) _sb = createBrowserClient(supabaseUrl, supabaseKey)
  return _sb
}
export const supabase = new Proxy({} as ReturnType<typeof createBrowserClient>, {
  get(_t, p) { return (get() as Record<string|symbol, unknown>)[p] }
})