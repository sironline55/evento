import { createBrowserClient } from '@supabase/ssr'
let _c: ReturnType<typeof createBrowserClient> | null = null
function g() {
  if (!_c) _c = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  return _c
}
export const supabase = new Proxy({} as ReturnType<typeof createBrowserClient>, {
  get(_, p) { return (g() as any)[p] }
})
