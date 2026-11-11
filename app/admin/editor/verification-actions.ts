"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { isArticleId } from "@/lib/article-validation.mjs";
import { runArticleVerification } from "@/lib/run-article-verification";

export async function verifyArticle(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id");
  if (typeof id !== "string" || !isArticleId(id)) redirect("/admin/editor?verification=invalid");

  const status = await runArticleVerification(id);
  revalidatePath("/admin/articles");
  revalidatePath("/admin/editor");
  redirect(`/admin/editor?id=${id}&verification=${status}`);
}
