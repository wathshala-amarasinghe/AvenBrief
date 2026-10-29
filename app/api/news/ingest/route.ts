import { timingSafeEqual } from "node:crypto";
import { revalidatePath } from "next/cache";
import { runRssImport } from "@/lib/rss-import";

function authorised(request: Request, expectedSecret: string) {
  const header = request.headers.get("authorization") ?? "";
  const prefix = "Bearer ";
  if (!header.startsWith(prefix)) return false;

  const suppliedSecret = header.slice(prefix.length);
  const supplied = Buffer.from(suppliedSecret);
  const expected = Buffer.from(expectedSecret);

  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}

async function handleIngest(request: Request) {
  const secret = (
    process.env.CRON_SECRET ?? process.env.RSS_INGEST_SECRET
  )?.trim();

  if (!secret || secret.length < 32) {
    console.error("CRON_SECRET is missing or shorter than 32 characters.");
    return Response.json(
      { error: "Scheduled importing is not configured." },
      { status: 503 },
    );
  }

  if (!authorised(request, secret)) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const summary = await runRssImport("scheduled");

    revalidatePath("/admin/inbox");
    revalidatePath("/admin/sources");

    return Response.json(summary, {
      status: summary.status === "failed" ? 500 : 200,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Scheduled RSS import failed:", error);
    return Response.json(
      { error: "Scheduled import failed." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}

// Vercel Cron invokes production routes with GET.
export const GET = handleIngest;

// Keep POST available for a future n8n or other server-to-server integration.
export const POST = handleIngest;
