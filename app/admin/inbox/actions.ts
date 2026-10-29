"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getAdminSupabase } from "@/lib/supabase-admin";
import { runRssImport } from "@/lib/rss-import";
import { isArticleId } from "@/lib/article-validation.mjs";

export async function importRss() {
  await requireAdmin();
  let summary;

  try {
    summary = await runRssImport("manual");
  } catch (error) {
    console.error("Manual RSS import failed:", error);
    redirect("/admin/inbox?result=database_error");
  }

  revalidatePath("/admin/inbox");
  revalidatePath("/admin/sources");

  if (summary.reason === "paused") {
    redirect("/admin/inbox?result=paused");
  }

  if (summary.reason === "already_running") {
    redirect("/admin/inbox?result=already_running");
  }

  if (summary.reason === "no_sources") {
    redirect("/admin/inbox?result=no_sources");
  }

  if (summary.status === "failed") {
    redirect(`/admin/inbox?result=feed_error&failed=${summary.sourcesFailed}`);
  }

  redirect(
    `/admin/inbox?result=imported&imported=${summary.itemsImported}&failed=${summary.sourcesFailed}`,
  );
}

export async function markReviewed(formData: FormData) {
  await requireAdmin();
  const supabase = getAdminSupabase();
  const id = formData.get("id");

  if (typeof id !== "string" || !isArticleId(id)) {
    redirect("/admin/inbox?result=invalid");
  }

  const { error } = await supabase
    .from("rss_inbox")
    .update({ status: "reviewed" })
    .eq("id", id)
    .eq("status", "new");

  if (error) {
    console.error("RSS review update failed:", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });
    redirect("/admin/inbox?result=database_error");
  }

  revalidatePath("/admin/inbox");
  redirect("/admin/inbox?result=reviewed");
}

export async function createDraft(formData: FormData) {
  await requireAdmin();
  const supabase = getAdminSupabase();

  const id = formData.get("id");
  const category = formData.get("category");

  if (typeof id !== "string" || !isArticleId(id)) {
    redirect("/admin/inbox?result=invalid");
  }

  if (
    typeof category !== "string" ||
    !["World", "Technology", "Climate", "Finance", "Gaming"].includes(category)
  ) {
    redirect("/admin/inbox?result=category_required");
  }

  const { data, error } = await supabase.rpc(
    "create_draft_from_rss",
    {
      p_inbox_id: id,
      p_category: category,
    },
  );

  if (
    error ||
    typeof data !== "string" ||
    !isArticleId(data)
  ) {
    console.error("Could not create RSS draft:", error ? {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    } : { message: "The database returned an invalid article ID." });
    redirect("/admin/inbox?result=draft_error");
  }

  revalidatePath("/admin");
  revalidatePath("/admin/inbox");

  redirect("/admin/editor?id=" + data);
}
