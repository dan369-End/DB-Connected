/**
 * Supabase Client Configuration
 * 
 * DB-Connect — "Votre passerelle vers le numérique."
 * 
 * Client-side integration using Supabase JS client.
 * All operations must respect Row Level Security (RLS).
 * Never expose service-role keys in client-side code.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

/**
 * Validates that environment credentials are provided and non-empty.
 */
export const isSupabaseConfigured: boolean = Boolean(
  typeof supabaseUrl === 'string' &&
  supabaseUrl.trim().length > 0 &&
  typeof supabasePublishableKey === 'string' &&
  supabasePublishableKey.trim().length > 0 &&
  !supabaseUrl.includes('your-project-id') &&
  !supabasePublishableKey.includes('your-publishable-key')
);

/**
 * Shared Supabase client instance.
 * - Initialized only when valid environment credentials are present.
 * - Returns null when configuration is pending, preventing invalid or fake requests.
 */
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabasePublishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

/**
 * Safe accessor helper that ensures Supabase is configured before invoking operations.
 * Throws a clear configuration error if invoked before environment variables are set.
 */
export function getSupabaseClient(): SupabaseClient {
  if (!supabase) {
    throw new Error(
      '[DB-Connect] Supabase is not configured. Please define VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in your environment.'
    );
  }
  return supabase;
}
