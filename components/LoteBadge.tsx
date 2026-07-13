function diasParaVencer(fechaVencimiento: string) {
  const hoy = new Date();
  const venc = new Date(fechaVencimiento);
  return Math.ceil((venc.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
}

export function LoteBadge({
  numeroLote,
  fechaVencimiento,
}: {
  numeroLote: string;
  fechaVencimiento: string;
}) {
  const dias = diasParaVencer(fechaVencimiento);
  const alerta = dias <= 60;

  return (
    <span className={`label-chip ${alerta ? "label-chip--alerta" : ""}`}>
      LOTE {numeroLote} · VENC {new Date(fechaVencimiento).toLocaleDateString("es-PE")}
      {alerta && ` · ${dias <= 0 ? "VENCIDO" : `${dias}d`}`}
    </span>
  );
}
