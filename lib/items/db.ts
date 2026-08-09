import type { Item, ItemStatus } from "@/lib/items/domain";

export type DbItem = {
  id: string;
  user_id: string;
  url: string | null;
  title: string | null;
  raw_text: string;
  source_type: string | null;
  note: string | null;
  status: ItemStatus;
  created_at: string;
  updated_at: string;
};

export function fromDbItem(row: DbItem): Item {
  return {
    id: row.id,
    userId: row.user_id,
    url: row.url,
    title: row.title,
    rawText: row.raw_text,
    sourceType: row.source_type,
    note: row.note,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}
