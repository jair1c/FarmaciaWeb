import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type ItemCompra = {
  producto_id: string;
  cantidad: number;
  costo_unitario: number;
  numero_lote: string;
  fecha_vencimiento: string;
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
  const { proveedor_id, numero_documento, items } = body as {
    proveedor_id: string | null;
    numero_documento: string | null;
    items: ItemCompra[];
  };

  if (!items?.length) {
    return NextResponse.json({ error: "Agrega al menos un producto a la compra" }, { status: 400 });
  }

  for (const item of items) {
    if (!item.producto_id || !item.numero_lote || !item.fecha_vencimiento || !item.cantidad) {
      return NextResponse.json(
        { error: "Cada línea necesita producto, cantidad, número de lote y fecha de vencimiento" },
        { status: 400 }
      );
    }
  }

  const { data, error } = await supabase.rpc("crear_compra", {
    p_sucursal_id: perfil.sucursal_id,
    p_usuario_id: user.id,
    p_proveedor_id: proveedor_id,
    p_numero_documento: numero_documento,
    p_items: items,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ compra_id: data });
}
