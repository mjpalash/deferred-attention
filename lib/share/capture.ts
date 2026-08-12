import { prepareNewItem, type Item } from "@/lib/items/domain";
import type { ParsedSharedContent } from "@/lib/share/parse";

export type CaptureSaveInput = {
  userId: string;
  item: {
    url: string | null;
    title: string | null;
    rawText: string;
    sourceType: string | null;
    note: string | null;
    status: "inbox";
  };
};

export type CaptureSaveResult = {
  item: Item;
};

export type CaptureStore = {
  save(input: CaptureSaveInput): Promise<CaptureSaveResult>;
};

export async function captureSharedContent({
  userId,
  shared,
  store
}: {
  userId: string;
  shared: ParsedSharedContent;
  store: CaptureStore;
}): Promise<CaptureSaveResult> {
  const item = prepareNewItem({
    url: shared.url,
    title: shared.title,
    rawText: shared.rawText,
    sourceType: "android-share"
  });

  return store.save({
    userId,
    item
  });
}
