import { timingSafeEqual } from "node:crypto";
import { revalidatePath } from "next/cache";
import { runRssImport } from "@/lib/rss-import";
import { runScheduledAiDrafts } from "@/lib/scheduled-ai-drafts";
import { createAdminNotification } from "@/lib/admin-notifications";
import { runQueueRetention } from "@/lib/rss-queue-maintenance";

export const maxDuration = 300;

const responseHeaders = { "Cache-Control": "private, no-store" };

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
      { status: 503, headers: responseHeaders },
    );
  }

  if (!authorised(request, secret)) {
    return Response.json(
      { error: "Unauthorized." },
      { status: 401, headers: responseHeaders },
    );
  }

  try {
    const summary = await runRssImport("scheduled");
    const queueMaintenance = await runQueueRetention(summary.runId);
    const drafting = await runScheduledAiDrafts(summary.importedItemIds, summary.runId);
    const { importedItemIds: _importedItemIds, ...publicSummary } = summary;
    void _importedItemIds;

    revalidatePath("/admin");
    revalidatePath("/admin/analytics");
    revalidatePath("/admin/articles");
    revalidatePath("/admin/automation");
    revalidatePath("/admin/inbox");
    revalidatePath("/admin/sources");
    revalidatePath("/admin/editor");

    return Response.json({ ...publicSummary, queueMaintenance, drafting }, {
      status: summary.status === "failed" ? 500 : 200,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("Scheduled RSS import failed:", error);
    await createAdminNotification({
      type: "rss_failure",
      severity: "error",
      title: "Scheduled RSS import failed",
      message: "The scheduled import stopped before it could complete. Check the Vercel runtime logs and approved source configuration.",
      href: "/admin/automation",
      dedupeKey: `scheduled-import-failure:${new Date().toISOString().slice(0, 13)}`,
    });
    return Response.json(
      { error: "Scheduled import failed." },
      { status: 500, headers: responseHeaders },
    );
  }
}

// Vercel Cron invokes production routes with GET.
export const GET = handleIngest;

// Keep POST available for a future n8n or other server-to-server integration.
export const POST = handleIngest;
