import { redirect } from "next/navigation";
import { createAuthServerClient } from "@/lib/supabase/auth-server";
import { login } from "./actions";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
    next?: string;
  }>;
};
export default async function LoginPage({
  searchParams
}: LoginPageProps) {
  const supabase = await createAuthServerClient();
  const { data } = await supabase.auth.getClaims();

  if (data?.claims) {
    redirect("/");
  }

  const params = await searchParams;

  return (
    <main className="login-shell">
      <section className="login-card">
        <h1>Deferred Attention</h1>
        <p className="muted">
          Your pile, when you have time for it.
        </p>

        {params.error ? (
          <p className="message error">{params.error}</p>
        ) : null}

        <form className="login-form" action={login}>
          <input
            type="hidden"
            name="next"
            value={params.next ?? "/"}
          />        
          <label>
            Email
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
            />
          </label>

          <label>
            Password
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </label>

          <button type="submit">Log in</button>
        </form>
      </section>
    </main>
  );
}
