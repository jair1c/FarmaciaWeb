import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type ItemDevolucion = {
  venta_detalle_id: string;
  cantidad: number;
};

export async function POST(request: NextRequest) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  // Solo un admin puede registrar devoluciones/anulaciones: afecta stock y caja.
  const { data: perfil } = await supabase.from("perfiles").select("rol").eq("id", user.id).single();

  if (perfil?.rol !== "admin") {
    return NextResponse.json({ error: "Solo un administrador puede registrar devoluciones" }, { status: 403 });
  }

  const { venta_id, items, motivo } = await request.json();

  if (!venta_id || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "Indica al menos una línea a devolver" }, { status: 400 });
  }

  for (const item of items as ItemDevolucion[]) {
    if (!item.venta_detalle_id || !item.cantidad || item.cantidad <= 0) {
      return NextResponse.json({ error: "Cada línea necesita una cantidad válida" }, { status: 400 });
    }
  }

  const { data, error } = await supabase.rpc("registrar_devolucion", {
    p_venta_id: venta_id,
    p_usuario_id: user.id,
    p_items: items,
    p_motivo: motivo || null,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ devolucion_id: data });
}
