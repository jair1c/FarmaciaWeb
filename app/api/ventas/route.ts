import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type ItemVenta = {
  producto_id: string;
  cantidad: number;
  precio_unitario: number;
  descuento?: number;
};

export async function POST(request: NextRequest) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { data: perfil } = await supabase
    .from("perfiles")
    .select("sucursal_id")
    .eq("id", user.id)
    .single();

  if (!perfil?.sucursal_id) {
    return NextResponse.json({ error: "Tu usuario no tiene una sucursal asignada" }, { status: 400 });
  }

  const body = await request.json();
  const { cliente_id, tipo_comprobante, metodo_pago, estado_pago, items } = body as {
    cliente_id: string | null;
    tipo_comprobante: string;
    metodo_pago: string;
    estado_pago: string;
    items: ItemVenta[];
  };

  if (!items?.length) {
    return NextResponse.json({ error: "El carrito está vacío" }, { status: 400 });
  }

  const { data, error } = await supabase.rpc("crear_venta", {
    p_sucursal_id: perfil.sucursal_id,
    p_usuario_id: user.id,
    p_cliente_id: cliente_id,
    p_tipo_comprobante: tipo_comprobante,
    p_metodo_pago: metodo_pago,
    p_estado_pago: estado_pago,
    p_items: items,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ venta_id: data });
}
