import { timingSafeEqual } from "node:crypto";
import { revalidatePath } from "next/cache";
import { ensureAutomationHealthNotification } from "@/lib/admin-notifications";
import { recoverStaleAutomationRuns } from "@/lib/automation-recovery";

export const maxDuration = 30;

const responseHeaders = { "Cache-Control": "private, no-store" };

function authorised(request: Request, expectedSecret: string) {
  const header = request.headers.get("authorization") ?? "";
  if (!header.startsWith("Bearer ")) return false;
  const supplied = Buffer.from(header.slice(7));
  const expected = Buffer.from(expectedSecret);
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret || secret.length < 32) {
    return Response.json({ error: "Automation monitoring is not configured." }, { status: 503, headers: responseHeaders });
  }
  if (!authorised(request, secret)) {
    return Response.json({ error: "Unauthorized." }, { status: 401, headers: responseHeaders });
  }

  const recovery = await recoverStaleAutomationRuns();
  await ensureAutomationHealthNotification();
  revalidatePath("/admin/notifications");
  revalidatePath("/admin/automation");
  return Response.json({ checked: true, recovery }, { headers: responseHeaders });
}
