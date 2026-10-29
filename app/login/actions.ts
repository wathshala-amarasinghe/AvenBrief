"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signIn(formData: FormData) {
  const email = formData.get("email");
  const password = formData.get("password");
  const adminId = process.env.ADMIN_USER_ID?.trim();

  if (!adminId) {
    throw new Error("ADMIN_USER_ID is missing.");
  }

  if (
    typeof email !== "string" ||
    typeof password !== "string" ||
    !email.trim() ||
    !password
  ) {
    redirect("/login?error=1");
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error || !data.user) {
    redirect("/login?error=1");
  }

  if (data.user.id !== adminId) {
    await supabase.auth.signOut({ scope: "local" });
    redirect("/login?error=1");
  }

  redirect("/admin");
}

export async function signOut() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut({
    scope: "local",
  });

  if (error) {
    throw new Error("Sign out failed. Please try again.");
  }

  redirect("/login");
}