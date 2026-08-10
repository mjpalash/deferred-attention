"use server";

import { redirect } from "next/navigation";
import { createAuthServerClient } from "@/lib/supabase/auth-server";
import { safeNextPath } from "@/lib/auth/return-path";

function credentials(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    redirect("/login?error=Email%20and%20password%20are%20required");
  }

  return { email, password };
}

function safeNext(formData: FormData): string {
  const next = String(formData.get("next") ?? "/");

  if (
    !next.startsWith("/") ||
    next.startsWith("//")
  ) {
    return "/";
  }

  return next;
}

export async function login(formData: FormData) {
  const supabase = await createAuthServerClient();

  const { error } = await supabase.auth.signInWithPassword(
    credentials(formData)
  );

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

redirect(
  safeNextPath(String(formData.get("next") ?? "/"))
);  
  // redirect(safeNext(formData));
}

export async function logout() {
  const supabase = await createAuthServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}
