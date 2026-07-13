// Mapeo de una venta del sistema al formato JSON que espera Nubefact
// (operación "generar_comprobante"). Basado en la estructura estándar
// documentada por Nubefact — verifica los nombres exactos de campo
// contra tu manual de integración (ayuda.nubefact.com) antes de pasar
// a producción, ya que Nubefact puede ajustar detalles por cuenta.

type ClienteVenta = {
  nombre: string;
  tipo_documento: "DNI" | "RUC" | "SIN_DOCUMENTO" | null;
  numero_documento: string | null;
  direccion: string | null;
};

type LineaVenta = {
  descripcion: string;
  cantidad: number;
  precio_unitario: number; // precio de venta, YA incluye IGV
};

const TIPO_DOC_NUBEFACT: Record<string, number> = {
  DNI: 1,
  RUC: 6,
  SIN_DOCUMENTO: 0,
};

export function construirPayloadNubefact({
  tipoComprobante,
  serie,
  numero,
  cliente,
  items,
}: {
  tipoComprobante: "BOLETA" | "FACTURA";
  serie: string;
  numero: number;
  cliente: ClienteVenta;
  items: LineaVenta[];
}) {
  const IGV_FACTOR = 1.18;

  const itemsNubefact = items.map((item) => {
    const precioUnitario = item.precio_unitario;
    const valorUnitario = Math.round((precioUnitario / IGV_FACTOR) * 100) / 100;
    const subtotal = Math.round(valorUnitario * item.cantidad * 100) / 100;
    const igv = Math.round((precioUnitario * item.cantidad - subtotal) * 100) / 100;
    const total = Math.round(precioUnitario * item.cantidad * 100) / 100;

    return {
      unidad_de_medida: "NIU",
      codigo: "",
      descripcion: item.descripcion,
      cantidad: item.cantidad,
      valor_unitario: valorUnitario,
      precio_unitario: precioUnitario,
      subtotal,
      tipo_de_igv: 1, // 1 = Gravado - Operación Onerosa
      igv,
      total,
      anticipo_regularizacion: false,
    };
  });

  const totalGravada = itemsNubefact.reduce((a, i) => a + i.subtotal, 0);
  const totalIgv = itemsNubefact.reduce((a, i) => a + i.igv, 0);
  const total = itemsNubefact.reduce((a, i) => a + i.total, 0);

  return {
    operacion: "generar_comprobante",
    tipo_de_comprobante: tipoComprobante === "FACTURA" ? 1 : 2,
    serie,
    numero,
    sunat_transaction: 1,
    cliente_tipo_de_documento: cliente.tipo_documento ? TIPO_DOC_NUBEFACT[cliente.tipo_documento] : 0,
    cliente_numero_de_documento: cliente.numero_documento ?? "",
    cliente_denominacion: cliente.nombre || "Cliente varios",
    cliente_direccion: cliente.direccion ?? "",
    fecha_de_emision: new Date().toISOString().slice(0, 10).split("-").reverse().join("-"),
    moneda: 1, // 1 = Soles
    porcentaje_de_igv: 18.0,
    total_gravada: Math.round(totalGravada * 100) / 100,
    total_igv: Math.round(totalIgv * 100) / 100,
    total: Math.round(total * 100) / 100,
    enviar_automaticamente_a_la_sunat: true,
    items: itemsNubefact,
  };
}

export async function enviarANubefact(payload: unknown, ambiente: "sandbox" | "produccion") {
  const url = ambiente === "produccion" ? process.env.NUBEFACT_URL_PRODUCCION : process.env.NUBEFACT_URL_SANDBOX;

  if (!url || !process.env.NUBEFACT_TOKEN) {
    throw new Error("Faltan NUBEFACT_URL_* o NUBEFACT_TOKEN en las variables de entorno");
  }

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.NUBEFACT_TOKEN}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  return { ok: res.ok, data };
}
