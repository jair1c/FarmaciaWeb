import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { nombre, ruc, telefono, contacto } = await request.json();

  if (!nombre?.trim()) {
    return NextResponse.json({ error: "El nombre es obligatorio" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("proveedores")
    .insert({
      nombre: nombre.trim(),
      ruc: ruc?.trim() || null,
      telefono: telefono?.trim() || null,
      contacto: contacto?.trim() || null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ proveedor: data });
}

export async function DELETE(request: NextRequest) {
  const supabase = createClient();
  const { id } = await request.json();

  const { error } = await supabase.from("proveedores").delete().eq("id", id);

  if (error) {
    const mensaje = error.code === "23503"
      ? "No se puede eliminar: hay compras registradas con este proveedor"
      : error.message;
    return NextResponse.json({ error: mensaje }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
