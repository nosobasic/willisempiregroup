import { useState } from "react";
import { FiPlus, FiArrowUpRight, FiCheckCircle, FiClock } from "react-icons/fi";
import type { Workspace, Task, Row } from "./domain";
import { safeURL } from "./domain";
import type { Entity } from "./forms";
import { statusLabel, functionBuckets, freshness } from "./taskModel";
const groups = [
  "Active",
  "Needs approval",
  "Waiting on response",
  "Blocked",
  "Completed",
  "Cancelled",
];
const groupOf = (t: Task) =>
  t.status === "Done"
    ? "Completed"
    : ["Open", "In progress"].includes(t.status)
      ? "Active"
      : t.status;
const text = (v: unknown) => String(v ?? "");
const source = (t: Task) => (t.source_record ?? {}) as Record<string, unknown>;
const held = (t: Task) => source(t).on_hold === true;
function sourceDate(v: unknown): string {
 if (!v) return "Not recorded";
 if (typeof v === "string") return v;
 const d=v as Record<string,unknown>;
 return [d.date || d.local, d.timezone, d.basis].filter(Boolean).join(" · ");
}
function time(v: unknown) {
  if (!v) return "Not recorded";
  const d = new Date(String(v));
  return Number.isNaN(d.valueOf())
    ? "Not recorded"
    : d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}
function EvidenceLink({ value, label }: { value: unknown; label: string }) {
  const href = safeURL(value);
  return href ? (
    <a href={href} target="_blank" rel="noreferrer">
      {label} <FiArrowUpRight />
    </a>
  ) : null;
}
export function TaskSummary({
  data,
  go,
  selectStatus,
}: {
  data: Workspace;
  go: (path: string) => void;
  selectStatus?: (status: string) => void;
}) {
  return (
    <section className="task-overview" aria-label="Work status">
      <div>
        <span className="eyebrow">YOUR WORK, AT A GLANCE</span>
        <h2>Know the next move.</h2>
        <p>
          Owner-private records. Approvals track decisions; they do not
          authorize actions.
        </p>
      </div>
      <div className="task-counts">
        {groups.slice(0, 5).map((g) => (
          <button
            key={g}
            className="task-count"
            onClick={() => (selectStatus ? selectStatus(g) : go("/tasks"))}
          >
            <strong>{data.tasks.filter((t) => groupOf(t) === g).length}</strong>
            <span>{g}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
export function TaskBoard({
  data,
  edit,
  offline = false,
}: {
  data: Workspace;
  offline?: boolean;
  edit?: (entity: Entity, record?: Partial<Row>) => void;
}) {
  const [filter, setFilter] = useState("All active"),
    [query, setQuery] = useState(""),
    [project, setProject] = useState(""),
    [bucket, setBucket] = useState("");
  const projects = [
    ...new Set(data.tasks.map((t) => text(t.project)).filter(Boolean)),
  ].sort();
  const rows = data.tasks
    .filter(
      (t) =>
        (!bucket || t.function_bucket === bucket) &&
        (filter === "All" ||
          (filter === "All active"
            ? !["Done", "Cancelled"].includes(t.status) && !held(t)
            : filter === "On hold" ? held(t) : groupOf(t) === filter)) &&
        (!project || t.project === project) &&
        [t.title, t.project, t.next_action, t.waiting_on].some((v) =>
          text(v).toLowerCase().includes(query.toLowerCase()),
        ),
    )
    .sort((a, b) =>
      text(a.follow_up_at || a.due_at || a.due_date || "9999").localeCompare(
        text(b.follow_up_at || b.due_at || b.due_date || "9999"),
      ),
    );
  return (
    <>
      <header className="page-heading">
        <div>
          <span className="eyebrow">OWNER WORKSPACE</span>
          <h1>Tasks & next actions</h1>
          <p className="muted">
            A clear record of what is moving, what is waiting, and what is
            verified.
          </p>
        </div>
        {edit && (
          <button className="primary" onClick={() => edit("tasks")}>
            <FiPlus />
            Add task
          </button>
        )}
      </header>
      <TaskSummary
        data={data}
        selectStatus={setFilter}
        go={() => {
          setFilter("All");
        }}
      />
      <div className="notice task-boundary">
        Private to your owner account.{" "}
        {offline
          ? "Synthetic local preview. Changes exist only in memory."
          : "Updates are saved to the connected workspace."}{" "}
        Source links are references, not automatic chat sync. An approval record
        never grants execution permission.
      </div>
      <section className="panel task-board">
        <div className="filters task-toolbar">
          <label>
            Search tasks
            <input
              placeholder="Title, next action, waiting on…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <label>
            Status
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              {["All active", ...groups, "On hold", "All"].map((g) => (
                <option key={g}>{g}</option>
              ))}
            </select>
          </label>
          <label>
            Function
            <select value={bucket} onChange={(e) => setBucket(e.target.value)}>
              <option value="">All functions</option>
              {functionBuckets.map((b) => (
                <option key={b}>{b}</option>
              ))}
            </select>
          </label>
          <label>
            Project
            <select
              value={project}
              onChange={(e) => setProject(e.target.value)}
            >
              <option value="">All projects</option>
              {projects.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </label>
        </div>
        <p className="muted task-result-count">
          {rows.length} {rows.length === 1 ? "task" : "tasks"} · times shown in
          your device timezone
        </p>
        {rows.length === 0 ? (
          <div className="task-empty">
            <FiCheckCircle />
            <h2>Room for your next move.</h2>
            <p>
              No tasks match this view. Add a task with its next action and
              source.
            </p>
          </div>
        ) : (
          <div className="work-cards">
            {rows.map((t) => {
              const history = (data.task_events ?? []).filter(
                (e) => e.task_id === t.id,
              );
              const overdue =
                t.status !== "Done" &&
                t.status !== "Cancelled" &&
                Boolean(t.follow_up_at || t.due_at) &&
                new Date(text(t.follow_up_at || t.due_at)).valueOf() <
                  Date.now();
              return (
                <article className="work-card" key={t.id}>
                  <div className="work-card-top">
                    <span
                      className={`work-status status-${t.status.replaceAll(" ", "-").toLowerCase()}`}
                    >
                      {statusLabel(t.status)}
                    </span>
                    <span className="muted">{t.priority}</span>
                  </div>
                  <h2>{t.title}</h2>
                  <p className="work-meta">
                    Private owner: You · {text(t.function_bucket) || "Business admin"} ·{" "}
                    {text(t.project) ||
                      data.businesses.find((b) => b.id === t.business_id)
                        ?.name ||
                      "WEG workspace"}
                  </p>
                  {Boolean(source(t).owner) && <p className="work-meta">Proposed assignee: {text(source(t).owner)} · {source(t).review_needed ? "Needs review" : "Reviewed source"}</p>}
                  {held(t) && <p className="on-hold">On hold · excluded from the active queue</p>}
                  <p className="work-freshness">
                    {source(t).last_verified_at ? `Conversation evidence dated ${text(source(t).last_verified_at)}` : freshness(t.last_verified_at)}
                    {t.uncertainty ? ` · ${text(t.uncertainty)}` : ""}
                  </p>
                  {Boolean(t.dependencies) && (
                    <p>
                      <strong>Depends on:</strong> {text(t.dependencies)}
                    </p>
                  )}
                  <div className="next-move">
                    <span className="eyebrow">NEXT ACTION</span>
                    <p>{text(t.next_action) || "No next action recorded"}</p>
                  </div>
                  {Boolean(t.waiting_on) && (
                    <p>
                      <strong>Waiting on:</strong> {text(t.waiting_on)}
                    </p>
                  )}
                  {t.status === "Blocked" && (
                    <p className="error">
                      <strong>Blocked:</strong> {text(t.blocked_reason)}
                    </p>
                  )}
                  <dl className="work-dates">
                    <div>
                      <dt>
                        <FiClock /> Due
                      </dt>
                      <dd>{t.due_at || t.due_date ? time(t.due_at || t.due_date) : sourceDate(source(t).due_at)}</dd>
                    </div>
                    <div className={overdue ? "overdue" : ""}>
                      <dt>Follow-up</dt>
                      <dd>{t.follow_up_at ? time(t.follow_up_at) : sourceDate(source(t).follow_up_at)}</dd>
                    </div>
                    <div>
                      <dt>Last checked</dt>
                      <dd>{t.last_verified_at ? time(t.last_verified_at) : sourceDate(source(t).last_verified_at)}</dd>
                    </div>
                    <div>
                      <dt>Updated</dt>
                      <dd>{time(t.updated_at)}</dd>
                    </div>
                  </dl>
                  <div className="work-links">
                    <EvidenceLink value={t.source_url} label="Source" />
                    {Boolean(t.source_id) && (
                      <small>
                        {text(t.source_system)} · {text(t.source_id)}
                      </small>
                    )}
                  </div>
                  {Boolean(t.approval_status) &&
                    t.approval_status !== "Not needed" && (
                      <div className="work-decision">
                        <strong>
                          Approval record: {text(t.approval_status)}
                        </strong>
                        <p>{text(t.approval_scope)}</p>
                        <EvidenceLink
                          value={t.approval_evidence}
                          label="Decision evidence"
                        />
                        <small>
                          Informational only. No action is authorized or
                          executed here.
                        </small>
                      </div>
                    )}
                  {t.status === "Done" && (
                    <div className="work-complete">
                      <strong>
                        {t.source_record ? "Completion reported in source" : t.completion_verified_at
                          ? "Completion verified"
                          : "Verification not recorded"}
                      </strong>
                      <p>{text(t.completion_summary)}</p>
                      <EvidenceLink
                        value={t.completion_url}
                        label="Completion evidence"
                      />
                      {!t.source_record && <small>{time(t.completion_verified_at)}</small>}
                    </div>
                  )}
                  {Boolean(t.source_record) && <details className="work-history"><summary>Source record & evidence</summary><p>Original reviewed record; later manual edits appear above. Dates retain their original precision. Evidence IDs are references, not invented links.</p><pre className="source-detail">{JSON.stringify({record:t.source_record,evidence:t.source_evidence},null,2)}</pre></details>}
                  <details className="work-history">
                    <summary>Activity history ({history.length})</summary>
                    {history.length ? (
                      history.map((e) => (
                        <p key={e.id}>
                          <strong>{text(e.action)}</strong> ·{" "}
                          {time(e.created_at)}
                          <br />
                          {text(e.from_status) &&
                            `${statusLabel(text(e.from_status))} → `}
                          {statusLabel(text(e.to_status))}
                          {Boolean(e.changed_fields) && (
                            <small>
                              Changed:{" "}
                              {(e.changed_fields as string[]).join(", ")}
                            </small>
                          )}
                        </p>
                      ))
                    ) : (
                      <p>No recorded activity yet.</p>
                    )}
                  </details>
                  {edit && (
                    <button
                      className="secondary"
                      onClick={() => edit("tasks", t)}
                    >
                      Update task
                    </button>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}

export function ActionQueue({
  data,
  edit,
}: {
  data: Workspace;
  edit: (e: Entity, r?: Partial<Row>) => void;
}) {
  const priority: Record<string, number> = {
    Urgent: 0,
    High: 1,
    Medium: 2,
    Low: 3,
  };
  const active = data.tasks.filter(
    (t) => !["Done", "Cancelled"].includes(t.status) && !held(t),
  );
  const ready = active.filter(
    (t) => ["Open", "In progress"].includes(t.status) && !t.dependencies,
  );
  ready.sort(
    (a, b) =>
      Number(source(a).user_priority_order || 99) - Number(source(b).user_priority_order || 99) ||
      (priority[a.priority] ?? 3) - (priority[b.priority] ?? 3) ||
      text(a.follow_up_at || a.due_at || "9999").localeCompare(
        text(b.follow_up_at || b.due_at || "9999"),
      ),
  );
  const attention = active.filter(
    (t) =>
      !["Open", "In progress"].includes(t.status) ||
      t.dependencies ||
      freshness(t.last_verified_at) !== "Checked within 7 days",
  );
  return (
    <section className="action-queue panel">
      <h2>Your game plan</h2>
      <p className="muted">
        Priority first, then follow-up time. Check source freshness before
        acting.
      </p>
      <div className="queue-columns">
        {[
          { title: "Actionable next", rows: ready },
          { title: "Needs attention", rows: attention },
        ].map((g) => (
          <div key={g.title}>
            <h3>{g.title}</h3>
            {g.rows.length ? (
              g.rows.slice(0, 6).map((t) => (
                <button
                  key={t.id}
                  className="queue-item"
                  onClick={() => edit("tasks", t)}
                >
                  <span>
                    {t.priority} · {text(t.function_bucket) || "Business admin"}
                  </span>
                  <strong>{t.title}</strong>
                  <p>{text(t.next_action) || "Record the next action"}</p>
                  <small>
                    {statusLabel(t.status)} · {source(t).last_verified_at ? `Conversation evidence dated ${text(source(t).last_verified_at)}` : freshness(t.last_verified_at)}
                  </small>
                  {Boolean(t.dependencies) && (
                    <small>Depends on: {text(t.dependencies)}</small>
                  )}
                  {Boolean(t.waiting_on) && (
                    <small>Waiting on: {text(t.waiting_on)}</small>
                  )}
                </button>
              ))
            ) : (
              <p>No tasks in this queue.</p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
