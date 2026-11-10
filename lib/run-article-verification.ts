import "server-only";

import { getAdminSupabase } from "@/lib/supabase-admin";
import { generateArticleVerification } from "@/lib/article-verification";

export type ArticleVerificationRunStatus =
  | "passed"
  | "blocked"
  | "failed"
  | "running"
  | "source_required"
  | "setup_required"
  | "article_error";

export async function runArticleVerification(articleId: string): Promise<ArticleVerificationRunStatus> {
  const supabase = getAdminSupabase();
  const { data: article, error: articleError } = await supabase
    .from("articles")
    .select("id, title, summary, body, source_url")
    .eq("id", articleId)
    .maybeSingle();

  if (articleError || !article) return "article_error";
  if (!article.source_url) return "source_required";

  const configuredModel = process.env.GEMINI_VERIFICATION_MODEL?.trim() ||
    process.env.GEMINI_ARTICLE_MODEL?.trim() || "gemini-flash-lite-latest";
  const { data: run, error: runError } = await supabase
    .from("article_verifications")
    .insert({ article_id: articleId, provider: "google", model: configuredModel, status: "running" })
    .select("id")
    .single();

  if (runError?.code === "23505") return "running";
  if (runError || !run) {
    console.error("Article verification could not start:", runError);
    return "setup_required";
  }

  try {
    const generated = await generateArticleVerification(article);
    const { report } = generated;
    const { error: completionError } = await supabase
      .from("article_verifications")
      .update({
        model: generated.model,
        status: "completed",
        verdict: report.verdict,
        score: report.score,
        publish_ready: report.publishReady,
        summary: report.summary,
        critical_issues: report.criticalIssues,
        warnings: report.warnings,
        claims: report.claims,
        source_text_chars: generated.sourceChars,
        article_fingerprint: generated.fingerprint,
        completed_at: new Date().toISOString(),
      })
      .eq("id", run.id);
    if (completionError) throw completionError;

    return report.publishReady ? "passed" : "blocked";
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 500) : "Verification failed.";
    await supabase.from("article_verifications").update({
      status: "failed",
      error: message,
      completed_at: new Date().toISOString(),
    }).eq("id", run.id);
    console.error("Article verification failed:", { message });
    return "failed";
  }
}
