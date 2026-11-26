import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://wunhfrspjumjzodkscvc.supabase.co';

export const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  'sb_publishable_UXo5D83kfLV3VOzstv-czw_cTeUfkEY';

export const supabase: SupabaseClient = createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

export function getServerSupabaseClient(): SupabaseClient {
  const serverKey = process.env.SUPABASE_SECRET_KEY;
  if (serverKey && serverKey.trim()) {
    return createClient(SUPABASE_URL, serverKey.trim(), {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
  return supabase;
}
