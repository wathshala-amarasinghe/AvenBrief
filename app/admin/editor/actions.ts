"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getAdminSupabase } from "@/lib/supabase-admin";
import { isArticleId, validateArticle } from "@/lib/article-validation.mjs";
import { articleVerificationFingerprint } from "@/lib/article-verification";
import type { EditorState } from "@/lib/article-types";

export async function saveArticle(
  _previousState: EditorState,
  formData: FormData,
): Promise<EditorState> {
  await requireAdmin();
  const supabase = getAdminSupabase();
  const result = validateArticle(Object.fromEntries(formData.entries()));

  if (!result.ok) return { error: result.error };

  const idValue = formData.get("id");
  const id = typeof idValue === "string" ? idValue : "";

  if (id && !isArticleId(id)) return { error: "Invalid article ID." };

  let previous: { slug: string; published_at: string | null } | null = null;

  if (id) {
    const { data, error } = await supabase
      .from("articles")
      .select("slug, published_at")
      .eq("id", id)
      .maybeSingle();

    if (error || !data) return { error: "This article could not be opened. Return to the dashboard and try again." };
    previous = data;

    if (previous.slug !== result.value.slug) {
      return { error: "An article's URL name cannot change after its first save." };
    }
  }

  const { intent, ...values } = result.value;

  if (intent === "publish" && values.source_url) {
    if (!id) {
      return { error: "Save this article as a draft, run automated verification, then publish it." };
    }

    const fingerprint = articleVerificationFingerprint(values);
    const { data: verification, error: verificationError } = await supabase
      .from("article_verifications")
      .select("publish_ready")
      .eq("article_id", id)
      .eq("status", "completed")
      .eq("article_fingerprint", fingerprint)
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (verificationError) {
      console.error("Article verification lookup failed:", verificationError);
      return { error: "Automated verification is not ready. Apply the article-verification migration and try again." };
    }
    if (!verification) {
      return { error: "This exact article version has not been verified. Save your changes and run automated verification before publishing." };
    }
    if (!verification.publish_ready) {
      return { error: "Verification found issues that block publishing. Correct the flagged claims, save, and verify again." };
    }
  }

  const status = intent === "publish" ? "published" : "draft";
  const record = {
    ...values,
    status,
    published_at: status === "published"
      ? previous?.published_at ?? new Date().toISOString()
      : null,
  };

  const save = (values: typeof record | Omit<typeof record, "featured_image_url" | "image_alt" | "image_credit">) => {
    const query = id
      ? supabase.from("articles").update(values).eq("id", id)
      : supabase.from("articles").insert(values);
    return query.select("id, slug").single();
  };

  let { data, error } = await save(record);
  const missingImageMigration = error && (
    error.code === "PGRST204" ||
    error.message?.includes("featured_image_url") ||
    error.message?.includes("image_alt")
  );

  if (missingImageMigration && !values.featured_image_url && !values.image_alt && !values.image_credit) {
    const legacyRecord = {
      title: record.title,
      slug: record.slug,
      summary: record.summary,
      body: record.body,
      category: record.category,
      author_name: record.author_name,
      source_url: record.source_url,
      status: record.status,
      published_at: record.published_at,
    };
    ({ data, error } = await save(legacyRecord));
  }

  if (error || !data) {
    console.error("Article save failed:", error);
    return {
      error: missingImageMigration && (values.featured_image_url || values.image_alt || values.image_credit)
        ? "Apply migration 20261030000500 before saving featured-image details. Your article text is still here."
        : error?.code === "23505"
        ? "That URL name is already used. Choose another."
        : "Could not save the article. Your text is still here; please try again.",
    };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/editor");
  revalidatePath("/");
  revalidatePath("/news/" + data.slug);
  revalidatePath("/api/articles");
  revalidatePath("/search");
  revalidatePath("/category/[slug]", "page");

  redirect("/admin/editor?id=" + data.id + "&saved=" + status);
}
