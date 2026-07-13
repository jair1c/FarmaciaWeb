import { Sidebar } from "@/components/Sidebar";
import { getPerfilActual } from "@/lib/permisos";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const perfil = await getPerfilActual();

  return (
    <div className="flex">
      <Sidebar rol={perfil?.rol ?? "cajero"} nombre={perfil?.nombre} />
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
