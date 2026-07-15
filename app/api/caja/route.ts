import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { data: perfil } = await supabase.from("perfiles").select("sucursal_id").eq("id", user.id).single();

  if (!perfil?.sucursal_id) {
    return NextResponse.json({ error: "Tu usuario no tiene una sucursal asignada" }, { status: 400 });
  }

  const { monto_apertura } = await request.json();

  if (monto_apertura === undefined || monto_apertura === null || monto_apertura < 0) {
    return NextResponse.json({ error: "Indica el monto inicial en caja" }, { status: 400 });
  }

  const { data, error } = await supabase.rpc("abrir_caja", {
    p_sucursal_id: perfil.sucursal_id,
    p_usuario_id: user.id,
    p_monto_apertura: monto_apertura,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ turno_id: data });
}

export async function PATCH(request: NextRequest) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { turno_id, monto_contado } = await request.json();

  if (!turno_id || monto_contado === undefined || monto_contado === null || monto_contado < 0) {
    return NextResponse.json({ error: "Indica el monto contado al cerrar caja" }, { status: 400 });
  }

  const { error } = await supabase.rpc("cerrar_caja", {
    p_turno_id: turno_id,
    p_usuario_id: user.id,
    p_monto_contado: monto_contado,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
