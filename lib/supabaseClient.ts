// lib/supabaseClient.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * If env vars are missing during build or preview, we avoid calling createClient()
 * (createClient throws if url/key are falsy). Instead export a proxy that throws
 * a clear error if any method is invoked at runtime. This prevents build-time
 * crashes while making errors explicit at runtime.
 */
function makeNotConfiguredProxy() {
  const handler: ProxyHandler<any> = {
    get(_, prop) {
      throw new Error(
        `Supabase client not configured. Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in your environment variables. Tried to access: ${String(
          prop
        )}`
      );
    },
    apply() {
      throw new Error(
        'Supabase client not configured. Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.'
      );
    }
  };
  return new Proxy({}, handler) as unknown as SupabaseClient;
}

export const supabase: SupabaseClient =
  SUPABASE_URL && SUPABASE_ANON_KEY
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : makeNotConfiguredProxy();
