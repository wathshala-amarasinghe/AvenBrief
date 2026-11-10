import "server-only";

import { AiDraftError, generateAiDraft } from "@/lib/ai-draft";
import { createArticleSlug } from "@/lib/ai-draft-validation.mjs";
import { isArticleId } from "@/lib/article-validation.mjs";
import { runArticleVerification, type ArticleVerificationRunStatus } from "@/lib/run-article-verification";
import { getAdminSupabase } from "@/lib/supabase-admin";
import { sanitiseErrorMessage } from "@/lib/error-reporting.mjs";

export type AiDraftWorkflowResult =
  | { status: "created"; articleId: string; verificationStatus: ArticleVerificationRunStatus }
  | { status: "existing"; articleId: string }
  | { status: "running" }
  | { status: "setup_required" }
  | { status: "failed"; resultCode: string };

export async function createVerifiedAiDraft(
  inboxId: string,
  options: { triggerType?: "manual" | "scheduled"; importRunId?: string | null } = {},
): Promise<AiDraftWorkflowResult> {
  const supabase = getAdminSupabase();
  const { data: story, error: storyError } = await supabase
    .from("rss_inbox")
    .select("id, title, source_name, source_url, source_author, source_published_at, suggested_category, article_id")
    .eq("id", inboxId)
    .maybeSingle();

  if (storyError || !story) {
    console.error("AI draft source lookup failed:", storyError);
    return { status: "failed", resultCode: "database_error" };
  }
  if (story.article_id && isArticleId(story.article_id)) {
    return { status: "existing", articleId: story.article_id };
  }

  const configuredModel = process.env.GEMINI_ARTICLE_MODEL?.trim() || "gemini-flash-lite-latest";
  const { data: generation, error: generationError } = await supabase
    .from("ai_draft_generations")
    .insert({
      inbox_id: story.id,
      provider: "google",
      model: configuredModel,
      status: "running",
      trigger_type: options.triggerType ?? "manual",
      import_run_id: options.importRunId ?? null,
    })
    .select("id")
    .single();

  if (generationError?.code === "23505") return { status: "running" };
  if (generationError || !generation) {
    console.error("AI draft history could not be started:", generationError);
    return { status: "setup_required" };
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

    const verificationStatus = await runArticleVerification(articleId);
    return { status: "created", articleId, verificationStatus };
  } catch (error) {
    const message = sanitiseErrorMessage(
      error instanceof Error ? error : "AI draft generation failed.",
    ).slice(0, 500);
    await supabase
      .from("ai_draft_generations")
      .update({ status: "failed", error: message, completed_at: new Date().toISOString() })
      .eq("id", generation.id);

    console.error("AI draft generation failed:", {
      code: error instanceof AiDraftError ? error.code : "database_or_unknown",
      message,
    });
    return {
      status: "failed",
      resultCode: error instanceof AiDraftError ? `ai_${error.code}` : "ai_generation_failed",
    };
  }
}
