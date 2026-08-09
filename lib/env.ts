export type ServerEnv = {
  supabaseUrl: string;
  supabaseSecretKey: string;
};

type ServerEnvSource = Record<string, string | undefined>;

export function getServerEnv(
  source: ServerEnvSource = process.env
): ServerEnv {
  const supabaseUrl = source.SUPABASE_URL;
  const supabaseSecretKey = source.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !supabaseSecretKey) {
    const missing: string[] = [];

    if (!supabaseUrl) {
      missing.push("SUPABASE_URL");
    }

    if (!supabaseSecretKey) {
      missing.push("SUPABASE_SECRET_KEY");
    }

    throw new Error(
      `Missing required server configuration: ${missing.join(", ")}`
    );
  }

  return {
    supabaseUrl,
    supabaseSecretKey
  };
}