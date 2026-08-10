"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ParsedSharedContent } from "@/lib/share/parse";

export function ShareCapture({
  shared
}: {
  shared: ParsedSharedContent;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (saving) return;

    setSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          url: shared.url,
          rawText: shared.rawText,
          title: shared.title,
          sourceType: "android-share"
        })
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Could not save item");
      }

      router.replace("/");
      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Could not save item"
      );
      setSaving(false);
    }
  }

  return (
    <>
      <div className="share-preview">
        {shared.title ? (
          <strong className="share-title">{shared.title}</strong>
        ) : null}

        {shared.url ? (
          <a
            className="item-link"
            href={shared.url}
            target="_blank"
            rel="noreferrer"
          >
            {shared.rawText}
          </a>
        ) : (
          <p className="item-text">{shared.rawText}</p>
        )}
      </div>

      {error ? <p className="message error">{error}</p> : null}

      <div className="share-actions">
        <button
          type="button"
          className="secondary"
          disabled={saving}
          onClick={() => router.replace("/")}
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={save}
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </>
  );
}
