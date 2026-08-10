"use client";

import { useState, useTransition } from "react";
import type { Item, ItemStatus } from "@/lib/items/domain";
import { LocalTime } from "@/app/components/local-time";

function looksLikeUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function InboxApp({ initialItems }: { initialItems: Item[] }) {
  const [items, setItems] = useState<Item[]>(initialItems);
  const [capture, setCapture] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function submit(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();

    const value = capture.trim();
    if (!value) return;

    setError(null);

    const response = await fetch("/api/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        looksLikeUrl(value)
          ? { url: value }
          : { rawText: value }
      )
    });

    const payload = await response.json();

    if (!response.ok) {
      setError(payload.error ?? "Could not save item");
      return;
    }

    setItems((current) => [payload.item as Item, ...current]);
    setCapture("");
  }

  function changeStatus(id: string, status: ItemStatus) {
    setError(null);

    startTransition(async () => {
      const response = await fetch(`/api/items/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });

      const payload = await response.json();

      if (!response.ok) {
        setError(payload.error ?? "Could not update item");
        return;
      }

      setItems((current) => current.filter((item) => item.id !== id));
    });
  }

  return (
    <>
      <form className="capture" onSubmit={submit}>
        <input
          aria-label="Save a URL or thought"
          value={capture}
          onChange={(event) => setCapture(event.target.value)}
          placeholder="Paste a link or write something to return to…"
        />
        <button type="submit">Save</button>
      </form>

      {error ? <p className="message error">{error}</p> : null}

      <section className="pile" aria-label="Inbox">
        {items.length === 0 ? (
          <p className="empty">Nothing waiting here.</p>
        ) : null}

        {items.map((item) => (
          <article className="item" key={item.id}>
            <div className="item-main">
              {item.url ? (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="item-link"
                >
                  {item.title ?? item.rawText}
                </a>
              ) : (
                <p className="item-text">{item.rawText}</p>
              )}

              <LocalTime dateTime={item.createdAt} />
            </div>

            <div className="item-actions">
              <button
                type="button"
                disabled={pending}
                className="secondary"
                onClick={() => changeStatus(item.id, "kept")}
              >
                Keep
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => changeStatus(item.id, "done")}
              >
                Done
              </button>
            </div>
          </article>
        ))}
      </section>
    </>
  );
}
