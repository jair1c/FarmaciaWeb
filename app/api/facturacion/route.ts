import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { construirPayloadNubefact, enviarANubefact } from "@/lib/nubefact";

export async function POST(request: NextRequest) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { venta_id } = await request.json();

  const { data: venta, error: errorVenta } = await supabase
    .from("ventas")
    .select(
      "id, tipo_comprobante, serie, numero, sunat_estado, clientes(nombre, tipo_documento, numero_documento, direccion), venta_detalle(cantidad, precio_unitario, productos(nombre))"
    )
    .eq("id", venta_id)
    .single();

  if (errorVenta || !venta) {
    return NextResponse.json({ error: "Venta no encontrada" }, { status: 404 });
  }

  if (venta.tipo_comprobante === "TICKET") {
    return NextResponse.json(
      { error: "Esta venta es un ticket interno; cambia el tipo de comprobante a Boleta o Factura para emitirla ante SUNAT" },
      { status: 400 }
    );
  }

  if (venta.sunat_estado === "ACEPTADO") {
    return NextResponse.json({ error: "Esta venta ya fue emitida ante SUNAT" }, { status: 400 });
  }

  // Serie fija por tipo de comprobante (configúrala según lo que te asigne Nubefact)
  const serie = venta.tipo_comprobante === "FACTURA"
    ? process.env.NUBEFACT_SERIE_FACTURA || "FFF1"
    : process.env.NUBEFACT_SERIE_BOLETA || "BBB1";

  // Correlativo simple: cuenta cuántos comprobantes de esa serie ya se emitieron.
  // Para un negocio con un solo punto de emisión esto es suficiente; con varias
  // sucursales emitiendo en paralelo, conviene llevar el correlativo en una
  // tabla propia con bloqueo (for update) para evitar números duplicados.
  const { count } = await supabase
    .from("ventas")
    .select("*", { count: "exact", head: true })
    .eq("serie", serie)
    .not("numero", "is", null);

  const numero = (count ?? 0) + 1;

  const cliente = (venta.clientes as any) ?? { nombre: "Cliente varios", tipo_documento: null, numero_documento: null, direccion: null };

  const payload = construirPayloadNubefact({
    tipoComprobante: venta.tipo_comprobante as "BOLETA" | "FACTURA",
    serie,
    numero,
    cliente,
    items: (venta.venta_detalle as any[]).map((d) => ({
      descripcion: d.productos?.nombre ?? "Producto",
      cantidad: d.cantidad,
      precio_unitario: Number(d.precio_unitario),
    })),
  });

  try {
    const ambiente = process.env.NODE_ENV === "production" ? "produccion" : "sandbox";
    const { ok, data } = await enviarANubefact(payload, ambiente);

    await supabase
      .from("ventas")
      .update({
        serie,
        numero,
        sunat_estado: ok ? "ACEPTADO" : "RECHAZADO",
        sunat_respuesta: data,
      })
      .eq("id", venta_id);

    if (!ok) {
      return NextResponse.json({ error: data?.errors || "Nubefact rechazó el comprobante", detalle: data }, { status: 400 });
    }

    return NextResponse.json({ ok: true, comprobante: data });
  } catch (err: any) {
    await supabase
      .from("ventas")
      .update({ sunat_estado: "RECHAZADO", sunat_respuesta: { error: err.message } })
      .eq("id", venta_id);

    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
