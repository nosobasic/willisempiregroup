import { useEffect, useRef, useState, type FormEvent } from "react";
import { FiX } from "react-icons/fi";
import {
  categories,
  statuses,
  priorities,
  todayISO,
  type Row,
  type Workspace,
} from "./domain";
import { message } from "./client";
import {
  taskStatuses,
  validateTask,
  localDateTime,
  functionBuckets,
} from "./taskModel";
export type Field = {
  key: string;
  label: string;
  type?: string;
  options?: { value: string; label: string }[] | readonly string[];
  required?: boolean;
  wide?: boolean;
  min?: number;
  max?: number;
  hint?: string;
};
const field = (
  key: string,
  label: string,
  type = "text",
  extra: Partial<Field> = {},
): Field => ({ key, label, type, ...extra });
const select = (
  key: string,
  label: string,
  options: Field["options"],
  extra: Partial<Field> = {},
): Field => ({ key, label, type: "select", options, ...extra });
export type Entity =
  "opportunities" | "tasks" | "mentors" | "businesses" | "application_answers";
export function fieldsFor(entity: Entity, data: Workspace): Field[] {
  const business = select("business_id", "Business", [
    { value: "", label: "WEG workspace / unassigned" },
    ...data.businesses.map((b) => ({ value: b.id, label: b.name })),
  ]);
  if (entity === "opportunities")
    return [
      field("name", "Opportunity name", "text", { required: true, wide: true }),
      field("organization", "Offering organization"),
      select("category", "Category", categories, { required: true }),
      business,
      select("status", "Status", statuses),
      select("priority", "Priority", priorities),
      field("description", "Description", "textarea", { wide: true }),
      field("website", "Website", "url"),
      field("application_url", "Application URL", "url"),
      field("funding_min", "Minimum funding (USD)", "number", { min: 0 }),
      field("funding_max", "Maximum funding (USD)", "number", { min: 0 }),
      select("equity_required", "Equity required", [
        { value: "", label: "Unknown" },
        { value: "true", label: "Yes" },
        { value: "false", label: "No" },
      ]),
      field("deadline", "Deadline", "date"),
      field("rolling_deadline", "Rolling deadline", "checkbox"),
      field("geography", "Geography"),
      field("eligibility", "Eligibility evidence", "textarea", {
        wide: true,
        hint: "Leave blank when unknown. Record the source; never assume eligibility.",
      }),
      field("requirements", "Requirements", "textarea", { wide: true }),
      field("documents_required", "Documents required", "textarea", {
        wide: true,
      }),
      field("contact_name", "Contact name"),
      field("contact_email", "Contact email", "email"),
      field("next_action", "Next action", "text", { wide: true }),
      field("next_action_date", "Next action date", "date"),
      field("source_url", "Source URL", "url"),
      field("date_discovered", "Date discovered", "date", { required: true }),
      field("date_last_verified", "Last verified", "date"),
      field("notes", "Notes", "textarea", { wide: true }),
    ];
  if (entity === "tasks")
    return [
      field("title", "Task title", "text", { required: true, wide: true }),
      field("description", "Description", "textarea", { wide: true }),
      business,
      select("opportunity_id", "Related opportunity", [
        { value: "", label: "None" },
        ...data.opportunities.map((o) => ({ value: o.id, label: o.name })),
      ]),
      select("priority", "Priority", priorities),
      select("status", "Status", taskStatuses),
      field("project", "Project / entity"),
      select("function_bucket", "Function", functionBuckets),
      field("dependencies", "Dependencies", "textarea"),
      field("uncertainty", "Uncertainty / needs checking", "textarea"),
      field("source_revision", "Source revision"),
      field("next_action", "Next action", "text", { wide: true }),
      field("waiting_on", "Waiting on"),
      field("blocked_reason", "Blocked reason", "textarea"),
      field("due_at", "Due time", "datetime-local"),
      field("follow_up_at", "Follow-up time", "datetime-local"),
      field("last_verified_at", "Last checked", "datetime-local", {
        hint: "When you last checked this task against its source. Times use your device timezone.",
      }),
      field("source_url", "Source / evidence link", "url"),
      field("source_system", "Source system", "text", {
        hint: "Optional stable source namespace, e.g. manual or support-case. No automatic sync.",
      }),
      field("source_id", "Source ID", "text", {
        hint: "Pair with a source system to prevent duplicate records.",
      }),
      select("approval_status", "Approval record", [
        "Not needed",
        "Pending",
        "Approved",
        "Declined",
      ]),
      field("approval_scope", "Approval scope", "textarea", {
        hint: "Tracking only. Recording approval does not authorize or execute any action.",
      }),
      field("approval_evidence", "Approval evidence link", "url"),
      field("completion_summary", "Completion evidence", "textarea", {
        hint: "Required for completed work. Describe what you verified, without private assistant notes.",
      }),
      field("completion_url", "Completion evidence link", "url"),
    ];
  if (entity === "mentors")
    return [
      field("name", "Name", "text", { required: true }),
      field("organization", "Organization"),
      field("title", "Title"),
      field("expertise", "Expertise", "text", {
        hint: "For example: B2B SaaS, AWS, AI, Procurement, MWBE",
      }),
      field("email", "Email", "email"),
      field("website", "Website", "url"),
      field("linkedin_url", "LinkedIn URL", "url"),
      field("program", "Program"),
      select("relationship_status", "Relationship status", [
        "Prospect",
        "Contacted",
        "Active",
        "Paused",
        "Closed",
      ]),
      field("last_interaction", "Last interaction", "date"),
      field("next_follow_up", "Next follow-up", "date"),
      field("notes", "Notes", "textarea", { wide: true }),
    ];
  if (entity === "businesses")
    return [
      field("name", "Business name", "text", { required: true }),
      field("industry", "Industry"),
      field("description", "Description", "textarea", { wide: true }),
      field("website", "Website", "url"),
      select("status", "Status", ["Active", "Planning", "Paused", "Archived"]),
    ];
  return [
    field("question", "Application question", "textarea", {
      required: true,
      wide: true,
    }),
    field("draft_answer", "Draft answer", "textarea", {
      wide: true,
      hint: "Editable draft only. Nothing is submitted automatically.",
    }),
  ];
}
export function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const el = ref.current;
    el?.showModal();
    return () => el?.close();
  }, []);
  return (
    <dialog ref={ref} onCancel={onClose} className="modal">
      <div className="modal-head">
        <h2>{title}</h2>
        <button
          aria-label="Close dialog"
          className="icon-button"
          onClick={onClose}
        >
          <FiX />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function RecordForm({
  entity,
  record,
  data,
  onSave,
  onClose,
}: {
  entity: Entity;
  record?: Partial<Row>;
  data: Workspace;
  onSave: (values: Record<string, unknown>) => Promise<void>;
  onClose: () => void;
}) {
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const defaults: Record<string, unknown> = {
    category: "Grant",
    approval_status: "Not needed",
    function_bucket: "Business admin",
    status:
      entity === "tasks"
        ? "Open"
        : entity === "opportunities"
          ? "Discovered"
          : "Active",
    priority: "Medium",
    date_discovered: todayISO(),
    relationship_status: "Prospect",
    ...record,
  };
  const fields = fieldsFor(entity, data);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget);
    const values: Record<string, unknown> = {};
    for (const f of fields) {
      const raw = String(fd.get(f.key) || "").trim();
      values[f.key] =
        f.type === "checkbox"
          ? fd.has(f.key)
          : f.type === "number"
            ? raw
              ? Number(raw)
              : null
            : f.key === "equity_required"
              ? raw === ""
                ? null
                : raw === "true"
              : raw ||
                ([
                  "name",
                  "title",
                  "organization",
                  "description",
                  "industry",
                  "expertise",
                  "draft_answer",
                ].includes(f.key)
                  ? ""
                  : null);
    }
    if (entity === "tasks") {
      const problem = validateTask(values);
      if (problem) {
        setError(problem);
        return;
      }
      for (const key of ["due_at", "follow_up_at", "last_verified_at"]) {
        if (values[key])
          values[key] = new Date(String(values[key])).toISOString();
      }
      values.due_date = values.due_at
        ? String(values.due_at).slice(0, 10)
        : null;
    }
    if (values.rolling_deadline) values.deadline = null;
    if (
      values.funding_min !== null &&
      values.funding_max !== null &&
      Number(values.funding_max) < Number(values.funding_min)
    ) {
      setError("Maximum funding must be at least the minimum.");
      return;
    }
    setBusy(true);
    try {
      await onSave(values);
      onClose();
    } catch (err) {
      setError(message(err));
    } finally {
      setBusy(false);
    }
  }
  const names: Record<Entity, string> = {
    opportunities: "opportunity",
    tasks: "task",
    mentors: "contact",
    businesses: "business",
    application_answers: "application question",
  };
  return (
    <Modal
      title={`${record?.id ? "Edit" : "Add"} ${names[entity]}`}
      onClose={onClose}
    >
      <form onSubmit={submit}>
        <div className="form-grid">
          {fields.map((f) => (
            <label className={f.wide ? "span-2" : ""} key={f.key}>
              {f.label}
              {f.required && " *"}
              {f.type === "select" ? (
                <select
                  name={f.key}
                  defaultValue={String(defaults[f.key] ?? "")}
                  required={f.required}
                >
                  {f.options?.map((o) =>
                    typeof o === "string" ? (
                      <option key={o}>{o}</option>
                    ) : (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ),
                  )}
                </select>
              ) : f.type === "textarea" ? (
                <textarea
                  name={f.key}
                  rows={4}
                  defaultValue={String(defaults[f.key] ?? "")}
                  required={f.required}
                />
              ) : f.type === "checkbox" ? (
                <input
                  type="checkbox"
                  name={f.key}
                  defaultChecked={Boolean(defaults[f.key])}
                />
              ) : (
                <input
                  name={f.key}
                  type={f.type}
                  defaultValue={
                    f.type === "datetime-local"
                      ? localDateTime(defaults[f.key])
                      : String(defaults[f.key] ?? "")
                  }
                  required={f.required}
                  min={f.min}
                  max={f.max}
                  step={f.type === "number" ? "any" : undefined}
                  maxLength={f.type === "text" ? 1000 : undefined}
                />
              )}{" "}
              {f.hint && <small>{f.hint}</small>}
            </label>
          ))}
        </div>
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        <div className="form-actions">
          <button type="button" className="secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="primary" disabled={busy}>
            {busy ? "Saving…" : "Save record"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
