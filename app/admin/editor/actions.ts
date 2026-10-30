"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { articles as samples } from "@/lib/news";
import { isArticleId, validateArticle } from "@/lib/article-validation.mjs";
import type { EditorState } from "@/lib/article-types";

export async function saveArticle(
  _previousState: EditorState,
  formData: FormData,
): Promise<EditorState> {
  // Check again for every write; a protected page alone cannot authorize an action.
  const { supabase } = await requireAdmin();
  const result = validateArticle(
    Object.fromEntries(formData.entries()),
    samples.map((article) => article.slug),
  );

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
    const { featured_image_url: _image, image_alt: _alt, image_credit: _credit, ...legacyRecord } = record;
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
