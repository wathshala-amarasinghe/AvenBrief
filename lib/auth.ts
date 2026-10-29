import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function requireAdmin() {
  const adminId = process.env.ADMIN_USER_ID?.trim();

  if (!adminId) {
    throw new Error("ADMIN_USER_ID is missing.");
  }

  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user || user.id !== adminId) {
    redirect("/login");
  }

  return { supabase, user };
}