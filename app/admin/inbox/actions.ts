"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getAdminSupabase } from "@/lib/supabase-admin";
import { runRssImport } from "@/lib/rss-import";
import { isArticleId } from "@/lib/article-validation.mjs";
import { createVerifiedAiDraft } from "@/lib/ai-draft-workflow";

function selectedStoryIds(formData: FormData) {
  return Array.from(
    new Set(
      formData
        .getAll("ids")
        .filter((value): value is string => typeof value === "string")
        .filter(isArticleId),
    ),
  ).slice(0, 50);
}

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

export async function archiveStories(formData: FormData) {
  await requireAdmin();
  const ids = selectedStoryIds(formData);

  if (!ids.length) redirect("/admin/inbox?result=selection_required");

  const { data, error } = await getAdminSupabase()
    .from("rss_inbox")
    .update({ status: "archived", archived_at: new Date().toISOString() })
    .in("id", ids)
    .in("status", ["new", "reviewed"])
    .select("id");

  if (error) {
    console.error("RSS bulk archive failed:", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });
    redirect("/admin/inbox?result=database_error");
  }

  revalidatePath("/admin");
  revalidatePath("/admin/analytics");
  revalidatePath("/admin/inbox");
  redirect(`/admin/inbox?result=archived&count=${data?.length ?? 0}`);
}

export async function restoreStories(formData: FormData) {
  await requireAdmin();
  const ids = selectedStoryIds(formData);

  if (!ids.length) {
    redirect("/admin/inbox?view=archived&result=selection_required");
  }

  const { data, error } = await getAdminSupabase()
    .from("rss_inbox")
    .update({ status: "new", archived_at: null })
    .in("id", ids)
    .eq("status", "archived")
    .select("id");

  if (error) {
    console.error("RSS bulk restore failed:", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });
    redirect("/admin/inbox?view=archived&result=database_error");
  }

  revalidatePath("/admin");
  revalidatePath("/admin/analytics");
  revalidatePath("/admin/inbox");
  redirect(
    `/admin/inbox?view=archived&result=restored&count=${data?.length ?? 0}`,
  );
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

export async function createAiDraft(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id");

  if (typeof id !== "string" || !isArticleId(id)) {
    redirect("/admin/inbox?result=invalid");
  }

  const result = await createVerifiedAiDraft(id);
  if (result.status === "existing") redirect(`/admin/editor?id=${result.articleId}`);
  if (result.status === "running") redirect(`/admin/inbox?selected=${id}&result=ai_running`);
  if (result.status === "setup_required") redirect(`/admin/inbox?selected=${id}&result=ai_setup_required`);
  if (result.status === "failed") redirect(`/admin/inbox?selected=${id}&result=${result.resultCode}`);

  revalidatePath("/admin");
  revalidatePath("/admin/analytics");
  revalidatePath("/admin/inbox");
  revalidatePath("/admin/editor");
  redirect(`/admin/editor?id=${result.articleId}&generated=1&verification=${result.verificationStatus}`);
}
