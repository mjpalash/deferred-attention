import { redirect } from "next/navigation";
import { InboxApp } from "@/app/components/inbox-app";
import { logout } from "@/app/login/actions";
import { fromDbItem, type DbItem } from "@/lib/items/db";
import { createAuthServerClient } from "@/lib/supabase/auth-server";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = await createAuthServerClient();

  const { data: authData } = await supabase.auth.getClaims();

  if (!authData?.claims) {
    redirect("/login");
  }

  const { data, error } = await supabase
    .from("items")
    .select("*")
    .eq("status", "inbox")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("Could not load inbox");
  }

  const items = (data as DbItem[]).map(fromDbItem);

  return (
    <main>
      <header className="topbar">
        <div>
          <h1>Later</h1>
          <p className="muted">The pile.</p>
        </div>

        <form action={logout}>
          <button type="submit" className="quiet">
            Log out
          </button>
        </form>
      </header>

      <InboxApp initialItems={items} />
    </main>
  );
}
