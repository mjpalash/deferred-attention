import { redirect } from "next/navigation";
import { createAuthServerClient } from "@/lib/supabase/auth-server";
import { parseSharedContent } from "@/lib/share/parse";
import { buildShareReturnPath } from "@/lib/auth/return-path";
import { ShareCapture } from "./share-capture";

type SharePageProps = {
  searchParams: Promise<{
    title?: string;
    text?: string;
    url?: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function SharePage({
  searchParams,
}: SharePageProps) {
  const params = await searchParams;

  let shared;

  try {
    shared = parseSharedContent(params);
  } catch {
    redirect("/");
  }

  const supabase = await createAuthServerClient();
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims) {
    const returnTo = buildShareReturnPath({
      title: params.title,
      text: params.text,
      url: params.url,
    });

    redirect(
      `/login?next=${encodeURIComponent(returnTo)}`
    );
  }

  return (
    <main className="share-shell">
      <section className="share-card">
        <p className="muted">Save for later</p>
        <h1>Deferred Attention</h1>

        <ShareCapture shared={shared} />
      </section>
    </main>
  );
}