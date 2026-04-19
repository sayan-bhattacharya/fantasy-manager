// ─────────────────────────────────────────────────────────────────────────────
// Supabase client — paste your Project URL and anon key into .env.local:
//
//   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
//   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
//   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  (server-only)
// ─────────────────────────────────────────────────────────────────────────────

// Placeholder until credentials are provided — swap in @supabase/supabase-js once wired up.
// import { createClient } from "@supabase/supabase-js";
//
// const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
// const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
//
// export const supabase = createClient(supabaseUrl, supabaseAnon);
//
// Server-side admin client (never expose service role key to browser):
// export const supabaseAdmin = createClient(
//   supabaseUrl,
//   process.env.SUPABASE_SERVICE_ROLE_KEY!,
//   { auth: { autoRefreshToken: false, persistSession: false } }
// );

export {};
