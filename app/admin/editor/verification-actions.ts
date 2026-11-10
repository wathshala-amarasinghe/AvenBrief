"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getAdminSupabase } from "@/lib/supabase-admin";
import { isArticleId } from "@/lib/article-validation.mjs";
import { generateArticleVerification } from "@/lib/article-verification";

export async function verifyArticle(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id");
  if (typeof id !== "string" || !isArticleId(id)) redirect("/admin/editor?verification=invalid");

  const supabase = getAdminSupabase();
  const { data: article, error: articleError } = await supabase
    .from("articles")
    .select("id, title, summary, body, source_url")
    .eq("id", id)
    .maybeSingle();
  if (articleError || !article) redirect(`/admin/editor?id=${id}&verification=article_error`);
  if (!article.source_url) redirect(`/admin/editor?id=${id}&verification=source_required`);

  const configuredModel = process.env.GEMINI_VERIFICATION_MODEL?.trim() ||
    process.env.GEMINI_ARTICLE_MODEL?.trim() || "gemini-flash-lite-latest";
  const { data: run, error: runError } = await supabase
    .from("article_verifications")
    .insert({ article_id: id, provider: "google", model: configuredModel, status: "running" })
    .select("id")
    .single();

  if (runError?.code === "23505") redirect(`/admin/editor?id=${id}&verification=running`);
  if (runError || !run) {
    console.error("Article verification could not start:", runError);
    redirect(`/admin/editor?id=${id}&verification=setup_required`);
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

    revalidatePath("/admin/editor");
    redirect(`/admin/editor?id=${id}&verification=${report.publishReady ? "passed" : "blocked"}`);
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error &&
      String(error.digest).startsWith("NEXT_REDIRECT")) throw error;

    const message = error instanceof Error ? error.message.slice(0, 500) : "Verification failed.";
    await supabase.from("article_verifications").update({
      status: "failed",
      error: message,
      completed_at: new Date().toISOString(),
    }).eq("id", run.id);
    console.error("Article verification failed:", { message });
    redirect(`/admin/editor?id=${id}&verification=failed`);
  }
}
