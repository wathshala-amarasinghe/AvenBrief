"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { isArticleId } from "@/lib/article-validation.mjs";
import { getHeadlinesFromSource } from "@/lib/rss";
import { validateRssSource } from "@/lib/rss-source-validation.mjs";
import { getAdminSupabase } from "@/lib/supabase-admin";

function logDatabaseError(context: string, error: {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
}) {
  console.error(context, {
    code: error.code,
    message: error.message,
    details: error.details,
    hint: error.hint,
  });
}

async function verifyFeed(feedUrl: string) {
  try {
    await getHeadlinesFromSource(feedUrl);
    return true;
  } catch (error) {
    console.error("RSS source verification failed:",
      error instanceof Error ? error.message : "Unknown feed error.");
    return false;
  }
}

export async function addSource(formData: FormData) {
  await requireAdmin();
  const result = validateRssSource(Object.fromEntries(formData.entries()));

  if (!result.ok) {
    redirect(
      "/admin/sources?result=invalid&message=" + encodeURIComponent(result.error),
    );
  }

  if (!(await verifyFeed(result.value.feed_url))) {
    redirect(
      "/admin/sources?result=invalid&message=" +
        encodeURIComponent("This URL did not return a valid RSS or Atom feed."),
    );
  }

  const { error } = await getAdminSupabase()
    .from("rss_sources")
    .insert(result.value);

  if (error) {
    logDatabaseError("RSS source create failed:", error);
    redirect(
      error.code === "23505"
        ? "/admin/sources?result=duplicate"
        : "/admin/sources?result=database_error",
    );
  }

  revalidatePath("/admin/sources");
  redirect("/admin/sources?result=added");
}

export async function updateSource(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id");

  if (typeof id !== "string" || !isArticleId(id)) {
    redirect("/admin/sources?result=invalid");
  }

  const result = validateRssSource(Object.fromEntries(formData.entries()));
  if (!result.ok) {
    redirect(
      "/admin/sources?result=invalid&message=" + encodeURIComponent(result.error),
    );
  }

  if (!(await verifyFeed(result.value.feed_url))) {
    redirect(
      "/admin/sources?result=invalid&message=" +
        encodeURIComponent("This URL did not return a valid RSS or Atom feed."),
    );
  }

  const { name, feed_url, default_category } = result.value;
  const { error } = await getAdminSupabase()
    .from("rss_sources")
    .update({
      name,
      feed_url,
      default_category,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    logDatabaseError("RSS source update failed:", error);
    redirect(
      error.code === "23505"
        ? "/admin/sources?result=duplicate"
        : "/admin/sources?result=database_error",
    );
  }

  revalidatePath("/admin/sources");
  redirect("/admin/sources?result=updated");
}

export async function toggleSource(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id");
  const nextEnabled = formData.get("next_enabled");

  if (
    typeof id !== "string" ||
    !isArticleId(id) ||
    (nextEnabled !== "true" && nextEnabled !== "false")
  ) {
    redirect("/admin/sources?result=invalid");
  }

  const enabled = nextEnabled === "true";
  const { error } = await getAdminSupabase()
    .from("rss_sources")
    .update({ enabled, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    logDatabaseError("RSS source toggle failed:", error);
    redirect("/admin/sources?result=database_error");
  }

  revalidatePath("/admin/sources");
  redirect("/admin/sources?result=" + (enabled ? "enabled" : "disabled"));
}

export async function toggleImportPause(formData: FormData) {
  await requireAdmin();
  const nextPaused = formData.get("next_paused");

  if (nextPaused !== "true" && nextPaused !== "false") {
    redirect("/admin/sources?result=invalid");
  }

  const paused = nextPaused === "true";
  const { error } = await getAdminSupabase()
    .from("rss_import_settings")
    .update({ paused, updated_at: new Date().toISOString() })
    .eq("id", 1);

  if (error) {
    logDatabaseError("RSS import pause update failed:", error);
    redirect("/admin/sources?result=database_error");
  }

  revalidatePath("/admin/sources");
  redirect("/admin/sources?result=" + (paused ? "imports_paused" : "imports_resumed"));
}
