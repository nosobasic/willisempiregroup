export const taskStatuses = [
  { value: "Open", label: "Active · not started" },
  { value: "In progress", label: "Active · in progress" },
  { value: "Needs approval", label: "Needs approval" },
  { value: "Waiting on response", label: "Waiting on response" },
  { value: "Blocked", label: "Blocked" },
  { value: "Done", label: "Completed" },
  { value: "Cancelled", label: "Cancelled" },
];
export function statusLabel(status: string) {
  return taskStatuses.find((s) => s.value === status)?.label ?? status;
}
export function localDateTime(value: unknown) {
  if (!value) return "";
  const d = new Date(String(value));
  return Number.isNaN(d.valueOf())
    ? ""
    : new Date(d.valueOf() - d.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
}
export function validateTask(v: Record<string, unknown>): string | null {
  const has = (key: string) => Boolean(String(v[key] ?? "").trim());
  if (
    v.status === "Done" &&
    (!has("completion_summary") || (!has("completion_url") && !(v.source_record && Array.isArray(v.source_evidence) && v.source_evidence.length)))
  )
    return "Completed work needs a verification summary and evidence link.";
  if (v.status === "Waiting on response" && !has("waiting_on"))
    return "Name who or what you are waiting on.";
  if (v.status === "Blocked" && !has("blocked_reason"))
    return "Describe what is blocking this task.";
  if (
    v.status === "Needs approval" &&
    (!has("approval_scope") || v.approval_status !== "Pending")
  )
    return "Describe the approval scope and mark its record Pending.";
  if (
    ["Approved", "Declined"].includes(String(v.approval_status)) &&
    (!has("approval_scope") || !has("approval_evidence"))
  )
    return "A recorded decision needs its scope and evidence link.";
  if (has("source_system") !== has("source_id"))
    return "Provide both source system and source ID, or leave both blank.";
  if (
    has("last_verified_at") &&
    new Date(String(v.last_verified_at)).valueOf() > Date.now()
  )
    return "Last checked cannot be in the future.";
  return null;
}

export const functionBuckets = [
  "Product / engineering",
  "Growth",
  "Career",
  "Education",
  "Business admin",
  "Personal admin",
];
export function freshness(value: unknown, now = Date.now()) {
  if (!value) return "Not checked";
  const age = now - new Date(String(value)).valueOf();
  return !Number.isFinite(age) || age < 0
    ? "Check timestamp"
    : age > 7 * 86400000
      ? "Needs refresh"
      : "Checked within 7 days";
}
