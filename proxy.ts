import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const articleMatch = request.nextUrl.pathname.match(/^\/news\/([^/]+)\/?$/);

  if (articleMatch) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (url && key) {
      const supabase = createClient(url, key, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      });
      const { data, error } = await supabase
        .from("articles")
        .select("id")
        .eq("slug", articleMatch[1])
        .eq("status", "published")
        .maybeSingle();

      if (!error && !data) {
        const notFoundUrl = request.nextUrl.clone();
        notFoundUrl.pathname = "/_not-found";
        notFoundUrl.search = "";

        return NextResponse.rewrite(notFoundUrl, {
          status: 404,
          headers: {
            "Cache-Control": "private, no-store",
            "X-Robots-Tag": "noindex, nofollow",
          },
        });
      }
    }

    return NextResponse.next();
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headersToSet) {
          for (const cookie of cookiesToSet) {
            request.cookies.set(cookie.name, cookie.value);
          }

          response = NextResponse.next({ request });

          for (const cookie of cookiesToSet) {
            response.cookies.set(
              cookie.name,
              cookie.value,
              cookie.options,
            );
          }

          for (const [name, value] of Object.entries(
            headersToSet ?? {},
          )) {
            response.headers.set(name, value);
          }
        },
      },
    },
  );

  await supabase.auth.getClaims();

  response.headers.set("Cache-Control", "private, no-store");

  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/login", "/news/:path*"],
};
