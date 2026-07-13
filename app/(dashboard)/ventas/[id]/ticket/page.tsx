import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { BotonImprimir } from "@/components/pos/BotonImprimir";
import { EmitirSunatButton } from "@/components/pos/EmitirSunatButton";

async function getVenta(id: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("ventas")
    .select(
      "id, creado_en, tipo_comprobante, metodo_pago, estado_pago, subtotal, igv, total, serie, numero, sunat_estado, sunat_respuesta, clientes(nombre, numero_documento), venta_detalle(cantidad, precio_unitario, productos(nombre))"
    )
    .eq("id", id)
    .single();

  return data;
}

export default async function TicketPage({ params }: { params: { id: string } }) {
  const venta = await getVenta(params.id);

  if (!venta) notFound();

  return (
    <div>
      <div className="mb-4 flex items-center justify-between print:hidden">
        <Link href="/ventas" className="text-sm text-pine-700 hover:underline">
          ← Nueva venta
        </Link>
        <BotonImprimir />
      </div>

      <div className="mx-auto max-w-sm rounded-sm border border-sage-200 bg-white p-6 font-label text-sm">
        <div className="text-center">
          <p className="label-chip">
            {venta.tipo_comprobante === "TICKET" ? "Ticket interno" : venta.tipo_comprobante}
          </p>
          <p className="mt-2 text-xs text-pine-700/60">
            {new Date(venta.creado_en).toLocaleString("es-PE")}
          </p>
        </div>

        <div className="mt-4 border-t border-dashed border-sage-200 pt-3">
          <p className="text-xs text-pine-700/60">
            Cliente: {(venta.clientes as any)?.nombre ?? "Varios"}
          </p>
        </div>

        <div className="mt-3 space-y-1.5 border-t border-dashed border-sage-200 pt-3">
          {(venta.venta_detalle as any[]).map((d, idx) => (
            <div key={idx} className="flex justify-between">
              <span>
                {d.cantidad}x {d.productos?.nombre}
              </span>
              <span>S/ {(d.cantidad * d.precio_unitario).toFixed(2)}</span>
            </div>
          ))}
        </div>

        <div className="mt-3 space-y-1 border-t border-dashed border-sage-200 pt-3">
          <div className="flex justify-between text-pine-700/70">
            <span>Subtotal</span>
            <span>S/ {Number(venta.subtotal).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-pine-700/70">
            <span>IGV</span>
            <span>S/ {Number(venta.igv).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-base font-medium text-pine-900">
            <span>Total</span>
            <span>S/ {Number(venta.total).toFixed(2)}</span>
          </div>
          <p className="pt-1 text-xs text-pine-700/60">
            {venta.estado_pago === "CREDITO" ? "Pendiente de pago (crédito)" : `Pagado · ${venta.metodo_pago}`}
          </p>
        </div>

        <p className="mt-5 text-center text-xs text-pine-700/50">Gracias por su compra</p>

        {venta.tipo_comprobante !== "TICKET" && (
          <div className="mt-4 border-t border-dashed border-sage-200 pt-3 print:hidden">
            <EmitirSunatButton
              ventaId={venta.id}
              sunatEstado={venta.sunat_estado}
              serie={venta.serie}
              numero={venta.numero}
              enlacePdf={(venta.sunat_respuesta as any)?.enlace_del_pdf}
            />
          </div>
        )}
      </div>
    </div>
  );
}
