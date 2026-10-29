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

  const query = id
    ? supabase.from("articles").update(record).eq("id", id)
    : supabase.from("articles").insert(record);

  const { data, error } = await query.select("id, slug").single();

  if (error || !data) {
    console.error("Article save failed:", error);
    return {
      error: error?.code === "23505"
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
