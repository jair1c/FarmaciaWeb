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

  const { venta_id, monto, metodo_pago } = await request.json();

  if (!venta_id || !monto || !metodo_pago) {
    return NextResponse.json({ error: "Faltan datos del pago" }, { status: 400 });
  }

  const { error } = await supabase.rpc("registrar_pago", {
    p_venta_id: venta_id,
    p_monto: monto,
    p_metodo_pago: metodo_pago,
    p_usuario_id: user.id,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
