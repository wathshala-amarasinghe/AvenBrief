"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { isArticleId } from "@/lib/article-validation.mjs";
import { getAdminSupabase } from "@/lib/supabase-admin";

export async function markNotificationRead(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id");
  if (typeof id !== "string" || !isArticleId(id)) redirect("/admin/notifications?result=invalid");

  await getAdminSupabase()
    .from("admin_notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id)
    .is("read_at", null);
  revalidatePath("/admin/notifications");
  redirect("/admin/notifications");
}

export async function markAllNotificationsRead() {
  await requireAdmin();
  await getAdminSupabase()
    .from("admin_notifications")
    .update({ read_at: new Date().toISOString() })
    .is("read_at", null);
  revalidatePath("/admin/notifications");
  redirect("/admin/notifications");
}
