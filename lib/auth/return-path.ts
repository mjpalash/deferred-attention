export type ShareReturnParams = {
  title?: string | null;
  text?: string | null;
  url?: string | null;
};

export function buildShareReturnPath(
  params: ShareReturnParams
): string {
  const query = new URLSearchParams();

  if (params.title?.trim()) {
    query.set("title", params.title);
  }

  if (params.text?.trim()) {
    query.set("text", params.text);
  }

  if (params.url?.trim()) {
    query.set("url", params.url);
  }

  const encoded = query.toString();

  return encoded ? `/share?${encoded}` : "/share";
}

export function safeNextPath(
  next: string | null | undefined
): string {
  if (!next) {
    return "/";
  }

  if (!next.startsWith("/") || next.startsWith("//")) {
    return "/";
  }

  return next;
}