import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { nombre } = await request.json();

  if (!nombre?.trim()) {
    return NextResponse.json({ error: "El nombre es obligatorio" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("categorias")
    .insert({ nombre: nombre.trim() })
    .select()
    .single();

  if (error) {
    const mensaje = error.code === "23505" ? "Ya existe una categoría con ese nombre" : error.message;
    return NextResponse.json({ error: mensaje }, { status: 400 });
  }

  return NextResponse.json({ categoria: data });
}

export async function DELETE(request: NextRequest) {
  const supabase = createClient();
  const { id } = await request.json();

  const { error } = await supabase.from("categorias").delete().eq("id", id);

  if (error) {
    const mensaje = error.code === "23503"
      ? "No se puede eliminar: hay productos usando esta categoría"
      : error.message;
    return NextResponse.json({ error: mensaje }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
