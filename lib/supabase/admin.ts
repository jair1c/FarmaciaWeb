import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// ¡Nunca importar este archivo desde un componente cliente ("use client")!
// Usa la SUPABASE_SERVICE_ROLE_KEY, que puede saltarse todas las políticas
// RLS. Solo debe usarse dentro de API routes que ya verificaron que quien
// llama es un admin.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
