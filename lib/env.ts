export type ServerEnv = {
  supabaseUrl: string;
  supabaseSecretKey: string;
};

export function getServerEnv(source: NodeJS.ProcessEnv = process.env): ServerEnv {
  const supabaseUrl = source.SUPABASE_URL;
  const supabaseSecretKey = source.SUPABASE_SECRET_KEY;

  const missing = [
    !supabaseUrl ? "SUPABASE_URL" : null,
    !supabaseSecretKey ? "SUPABASE_SECRET_KEY" : null
  ].filter(Boolean);

  if (missing.length > 0) {
    throw new Error(`Missing required server configuration: ${missing.join(", ")}`);
  }

  return { supabaseUrl, supabaseSecretKey };
}
