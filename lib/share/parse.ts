export type SharedContentInput = {
  title?: string | null;
  text?: string | null;
  url?: string | null;
};

export type ParsedSharedContent = {
  url: string | null;
  rawText: string;
  title: string | null;
};

function clean(value: string | null | undefined): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function firstHttpUrl(text: string): string | null {
  const candidates = text.match(/https?:\/\/[^\s<>"']+/gi) ?? [];

  for (const candidate of candidates) {
    // Common prose punctuation should not become part of a shared URL.
    const normalized = candidate.replace(/[),.;!?]+$/g, "");

    try {
      const parsed = new URL(normalized);
      if (parsed.protocol === "http:" || parsed.protocol === "https:") {
        return parsed.toString();
      }
    } catch {
      // Ignore malformed URL-like substrings and continue.
    }
  }

  return null;
}

function normalizeExplicitUrl(value: string | null): string | null {
  if (!value) return null;

  try {
    const parsed = new URL(value);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.toString();
    }
  } catch {
    // A non-URL value in Android's url field is still preserved as raw text
    // below rather than silently discarded.
  }

  return null;
}

export function parseSharedContent(
  input: SharedContentInput
): ParsedSharedContent {
  const title = clean(input.title);
  const text = clean(input.text);
  const suppliedUrl = clean(input.url);

  if (!text && !suppliedUrl) {
    throw new Error("Shared content must contain a URL or text");
  }

  const explicitUrl = normalizeExplicitUrl(suppliedUrl);
  const embeddedUrl = text ? firstHttpUrl(text) : null;
  const url = explicitUrl ?? embeddedUrl;

  // Preserve the original shared text whenever Android supplied it.
  // For URL-only shares, the URL itself becomes rawText, matching Slice 1.
  const rawText = text ?? suppliedUrl!;

  return {
    url,
    rawText,
    title
  };
}
