"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function CerrarSesionButton() {
  const router = useRouter();
  const supabase = createClient();

  async function salir() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button onClick={salir} className="mt-2 text-xs text-paper/50 hover:text-paper">
      Cerrar sesión
    </button>
  );
}
