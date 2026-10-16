import type { Row } from "./domain";
import { createClient } from "@supabase/supabase-js";
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
export const configured = Boolean(
  url && key && !url.includes("YOUR_PROJECT") && !key.includes("YOUR_PUBLIC"),
);
export const supabase = configured
  ? createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: "pkce",
      },
    })
  : null;
export function db() {
  if (!supabase) throw new Error("Supabase is not configured.");
  return supabase;
}
export function check<
  T extends { data?: unknown; error: { message: string } | null },
>(result: T): NonNullable<T["data"]> {
  if (result.error) throw new Error(result.error.message);
  return result.data as NonNullable<T["data"]>;
}
export function message(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Something went wrong. Please try again.";
}

// Explicit pagination avoids silently dropping records at the API's row limit.
export async function readWorkspaceRows(
  table: string,
  organizationId: string,
): Promise<Row[]> {
  const rows: Row[] = [];
  const size = 500;
  for (let offset = 0; ; offset += size) {
    const page = check(
      await db()
        .from(table)
        .select("*")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false })
        .order("id")
        .range(offset, offset + size - 1),
    ) as Row[];
    rows.push(...page);
    if (page.length < size) return rows;
  }
}
