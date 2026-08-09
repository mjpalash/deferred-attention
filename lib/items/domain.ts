export const ITEM_STATUSES = ["inbox", "done", "kept"] as const;

export type ItemStatus = (typeof ITEM_STATUSES)[number];

export type Item = {
  id: string;
  userId: string;
  url: string | null;
  title: string | null;
  rawText: string;
  sourceType: string | null;
  note: string | null;
  status: ItemStatus;
  createdAt: string;
  updatedAt: string;
};

export type NewItemInput = {
  url?: string | null;
  title?: string | null;
  rawText?: string | null;
  sourceType?: string | null;
  note?: string | null;
};

export type PreparedNewItem = {
  url: string | null;
  title: string | null;
  rawText: string;
  sourceType: string | null;
  note: string | null;
  status: "inbox";
};

function optionalText(value: string | null | undefined): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function prepareNewItem(input: NewItemInput): PreparedNewItem {
  const url = optionalText(input.url);
  const suppliedRawText = optionalText(input.rawText);

  if (!url && !suppliedRawText) {
    throw new Error("A capture must contain a URL or text");
  }

  return {
    url,
    title: optionalText(input.title),
    rawText: suppliedRawText ?? url!,
    sourceType: optionalText(input.sourceType),
    note: optionalText(input.note),
    status: "inbox"
  };
}

export function isValidItemStatus(value: unknown): value is ItemStatus {
  return typeof value === "string" &&
    ITEM_STATUSES.includes(value as ItemStatus);
}

export function changeItemStatus(
  item: Item,
  status: ItemStatus,
  updatedAt: string
): Item {
  if (!isValidItemStatus(status)) {
    throw new Error("Unsupported item status");
  }

  return {
    ...item,
    status,
    updatedAt
  };
}

export function selectInboxItems(items: readonly Item[]): Item[] {
  return items
    .filter((item) => item.status === "inbox")
    .slice()
    .sort(
      (a, b) =>
        Date.parse(b.createdAt) - Date.parse(a.createdAt)
    );
}
