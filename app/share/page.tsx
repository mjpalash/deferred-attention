import { redirect } from "next/navigation";
import { buildShareReturnPath } from "@/lib/auth/return-path";
import { handleShareCapture } from "@/lib/share/handle-share-capture";
import { parseSharedContent } from "@/lib/share/parse";
import { captureShareWithSupabase } from "@/lib/share/supabase-capture-store";
import { createAuthServerClient } from "@/lib/supabase/auth-server";

type SharePageProps = {
  searchParams: Promise<{
    title?: string;
    text?: string;
    url?: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function SharePage({
  searchParams
}: SharePageProps) {
  const params = await searchParams;

  let shared;

  try {
    shared = parseSharedContent(params);
  } catch {
    redirect("/");
  }

  const returnPath = buildShareReturnPath({
    title: params.title,
    text: params.text,
    url: params.url
  });

  const supabase = await createAuthServerClient();

  const result = await handleShareCapture({
    shared,
    returnPath,
    dependencies: {
      async getUserId() {
        const { data } = await supabase.auth.getClaims();

        return typeof data?.claims?.sub === "string"
          ? data.claims.sub
          : null;
      },
      capture({ userId, shared }) {
        return captureShareWithSupabase({
          supabase,
          userId,
          shared
        });
      }
    }
  });

  if (result.kind === "login-required") {
    redirect(result.loginPath);
  }

  return (
    <main className="share-shell">
      <section className="share-card">
        <h1>Deferred Attention</h1>

        {result.kind === "saved" ? (
          <>
            <p className="message">Saved</p>

            {shared.url ? (
              <a
                className="item-link"
                href={shared.url}
                target="_blank"
                rel="noreferrer"
              >
                {shared.url}
              </a>
            ) : (
              <p className="item-text">{shared.rawText}</p>
            )}

            <p className="muted">
              Use your phone&apos;s Back button or gesture to return to the app you were using.
            </p>
          </>
        ) : (
          <p className="message error">{result.message}</p>
        )}
      </section>
    </main>
  );
}