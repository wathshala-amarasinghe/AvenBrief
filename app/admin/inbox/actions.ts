"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getAdminSupabase } from "@/lib/supabase-admin";
import { runRssImport } from "@/lib/rss-import";
import { isArticleId } from "@/lib/article-validation.mjs";
import { AiDraftError, generateAiDraft } from "@/lib/ai-draft";
import { createArticleSlug } from "@/lib/ai-draft-validation.mjs";

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
  const supabase = getAdminSupabase();
  const id = formData.get("id");

  if (typeof id !== "string" || !isArticleId(id)) {
    redirect("/admin/inbox?result=invalid");
  }

  const { data: story, error: storyError } = await supabase
    .from("rss_inbox")
    .select("id, title, source_name, source_url, source_author, source_published_at, suggested_category, article_id")
    .eq("id", id)
    .maybeSingle();

  if (storyError || !story) {
    console.error("AI draft source lookup failed:", storyError);
    redirect("/admin/inbox?result=database_error");
  }
  if (story.article_id && isArticleId(story.article_id)) {
    redirect(`/admin/editor?id=${story.article_id}`);
  }

  const configuredModel = process.env.GEMINI_ARTICLE_MODEL?.trim() || "gemini-2.5-flash";
  const { data: generation, error: generationError } = await supabase
    .from("ai_draft_generations")
    .insert({
      inbox_id: story.id,
      provider: "google",
      model: configuredModel,
      status: "running",
    })
    .select("id")
    .single();

  if (generationError?.code === "23505") {
    redirect(`/admin/inbox?selected=${story.id}&result=ai_running`);
  }
  if (generationError || !generation) {
    console.error("AI draft history could not be started:", generationError);
    redirect(`/admin/inbox?selected=${story.id}&result=ai_setup_required`);
  }

  try {
    const generated = await generateAiDraft({
      headline: story.title,
      sourceName: story.source_name,
      sourceUrl: story.source_url,
      sourceAuthor: story.source_author,
      publishedAt: story.source_published_at,
      suggestedCategory: story.suggested_category,
    });

    const { data: articleId, error: draftError } = await supabase.rpc(
      "create_draft_from_rss",
      { p_inbox_id: story.id, p_category: generated.draft.category },
    );
    if (draftError || typeof articleId !== "string" || !isArticleId(articleId)) {
      throw draftError ?? new Error("The database returned an invalid article ID.");
    }

    const { error: articleError } = await supabase
      .from("articles")
      .update({
        title: generated.draft.title,
        slug: createArticleSlug(generated.draft.title, articleId),
        summary: generated.draft.summary,
        body: generated.draft.body,
        category: generated.draft.category,
        author_name: "AvenBrief Editorial Team",
        source_url: story.source_url,
        status: "draft",
        published_at: null,
      })
      .eq("id", articleId);
    if (articleError) throw articleError;

    const { error: historyError } = await supabase
      .from("ai_draft_generations")
      .update({
        article_id: articleId,
        model: generated.model,
        status: "succeeded",
        confidence: generated.draft.confidence,
        warnings: generated.draft.warnings,
        source_text_chars: generated.sourceChars,
        completed_at: new Date().toISOString(),
      })
      .eq("id", generation.id);
    if (historyError) {
      console.error("AI draft history completion failed:", historyError);
    }

    revalidatePath("/admin");
    revalidatePath("/admin/analytics");
    revalidatePath("/admin/inbox");
    revalidatePath("/admin/editor");
    redirect(`/admin/editor?id=${articleId}&generated=1`);
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error &&
      String(error.digest).startsWith("NEXT_REDIRECT")) {
      throw error;
    }

    const message = error instanceof Error ? error.message.slice(0, 500) : "AI draft generation failed.";
    await supabase
      .from("ai_draft_generations")
      .update({
        status: "failed",
        error: message,
        completed_at: new Date().toISOString(),
      })
      .eq("id", generation.id);

    console.error("AI draft generation failed:", {
      code: error instanceof AiDraftError ? error.code : "database_or_unknown",
      message,
    });
    const result = error instanceof AiDraftError
      ? `ai_${error.code}`
      : "ai_generation_failed";
    redirect(`/admin/inbox?selected=${story.id}&result=${result}`);
  }
}
