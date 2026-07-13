import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options) {
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options) {
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isDashboardRoute = request.nextUrl.pathname.startsWith("/dashboard") ||
    request.nextUrl.pathname.startsWith("/productos") ||
    request.nextUrl.pathname.startsWith("/ventas") ||
    request.nextUrl.pathname.startsWith("/cobranzas") ||
    request.nextUrl.pathname.startsWith("/compras") ||
    request.nextUrl.pathname.startsWith("/reportes") ||
    request.nextUrl.pathname.startsWith("/configuracion");

  if (!user && isDashboardRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/productos/:path*", "/ventas/:path*", "/cobranzas/:path*", "/compras/:path*", "/reportes/:path*", "/configuracion/:path*"],
};
