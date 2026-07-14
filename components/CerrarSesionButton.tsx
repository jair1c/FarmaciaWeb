"use client";

import { createClient } from "@/lib/supabase/client";

export function CerrarSesionButton() {
  const supabase = createClient();

  async function salir() {
    await supabase.auth.signOut();
    // Navegación completa: igual que en el login, esto asegura que la
    // cookie de sesión ya esté borrada antes de que el servidor procese
    // la siguiente petición.
    window.location.href = "/login";
  }

  return (
    <button onClick={salir} className="mt-2 text-xs text-paper/50 hover:text-paper">
      Cerrar sesión
    </button>
  );
}
