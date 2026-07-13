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

  const body = await request.json();
  const {
    nombre,
    categoria_id,
    codigo_barras,
    requiere_receta,
    precio_venta,
    stock_minimo,
    unidad_medida,
    lote_inicial,
  } = body;

  if (!nombre?.trim() || precio_venta === undefined || precio_venta === null) {
    return NextResponse.json({ error: "Nombre y precio son obligatorios" }, { status: 400 });
  }

  const { data: producto, error: errorProducto } = await supabase
    .from("productos")
    .insert({
      nombre: nombre.trim(),
      categoria_id: categoria_id || null,
      codigo_barras: codigo_barras?.trim() || null,
      requiere_receta: !!requiere_receta,
      precio_venta,
      stock_minimo: stock_minimo ?? 5,
      unidad_medida: unidad_medida || "unidad",
    })
    .select()
    .single();

  if (errorProducto) {
    const mensaje = errorProducto.code === "23505"
      ? "Ya existe un producto con ese código de barras"
      : errorProducto.message;
    return NextResponse.json({ error: mensaje }, { status: 400 });
  }

  // Si se indicó stock inicial, crear el primer lote
  if (lote_inicial?.cantidad_inicial > 0) {
    const { data: perfil } = await supabase
      .from("perfiles")
      .select("sucursal_id")
      .eq("id", user.id)
      .single();

    if (!perfil?.sucursal_id) {
      return NextResponse.json(
        { error: "Producto creado, pero tu usuario no tiene sucursal asignada para registrar el lote" },
        { status: 400 }
      );
    }

    const { error: errorLote } = await supabase.from("lotes").insert({
      producto_id: producto.id,
      sucursal_id: perfil.sucursal_id,
      numero_lote: lote_inicial.numero_lote,
      fecha_vencimiento: lote_inicial.fecha_vencimiento,
      cantidad_inicial: lote_inicial.cantidad_inicial,
      cantidad_actual: lote_inicial.cantidad_inicial,
      costo_unitario: lote_inicial.costo_unitario ?? 0,
    });

    if (errorLote) {
      return NextResponse.json(
        { error: `Producto creado, pero falló el registro del lote: ${errorLote.message}` },
        { status: 400 }
      );
    }
  }

  return NextResponse.json({ producto });
}
