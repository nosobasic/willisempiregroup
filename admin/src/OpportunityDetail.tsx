import { useEffect, useState, type FormEvent } from "react";
import {
  FiArrowLeft,
  FiPlus,
  FiExternalLink,
  FiEdit2,
  FiTrash2,
} from "react-icons/fi";
import { db, message } from "./client";
import {
  calculateFit,
  scoreCriteria,
  profileFields,
  dateLabel,
  deadlineLabel,
  safeURL,
  type Evidence,
  type Opportunity,
  type Workspace,
  type Row,
} from "./domain";
import { Badge, Empty } from "./views";
import { Modal, type Entity } from "./forms";
export function OpportunityDetail({
  opportunity: o,
  data,
  orgId,
  canEdit,
  canDelete,
  edit,
  save,
  remove,
  go,
}: {
  opportunity: Opportunity;
  data: Workspace;
  orgId: string;
  canEdit: boolean;
  canDelete: boolean;
  edit: (e: Entity, r?: Partial<Row>) => void;
  save: (
    e: Entity,
    v: Record<string, unknown>,
    r?: Partial<Row>,
  ) => Promise<void>;
  remove: (e: Entity, id: string) => Promise<void>;
  go: (p: string) => void;
}) {
  const [tab, setTab] = useState("overview"),
    [answers, setAnswers] = useState<Row[]>([]),
    [error, setError] = useState(""),
    [scoreOpen, setScoreOpen] = useState(false),
    [deleting, setDeleting] = useState(false),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    let active = true;
    db()
      .from("application_answers")
      .select("*")
      .eq("organization_id", orgId)
      .eq("opportunity_id", o.id)
      .order("created_at")
      .then((r) => {
        if (!active) return;
        if (r.error) setError(r.error.message);
        else setAnswers(r.data ?? []);
      });
    return () => {
      active = false;
    };
  }, [orgId, o]);
  const company = data.company_profiles[0]?.content as
    Record<string, string> | undefined;
  async function deleteRecord() {
    setBusy(true);
    try {
      await remove("opportunities", o.id);
      go("/capital");
    } catch (err) {
      setError(message(err));
      setDeleting(false);
    } finally {
      setBusy(false);
    }
  }
  function detail(label: string, value: unknown) {
    return (
      <div className="detail-field">
        <dt>{label}</dt>
        <dd>
          {typeof value === "boolean" ? (
            value ? (
              "Yes"
            ) : (
              "No"
            )
          ) : value === null || value === undefined || value === "" ? (
            <span className="muted">Unknown / not recorded</span>
          ) : (
            String(value)
          )}
        </dd>
      </div>
    );
  }
  return (
    <>
      <button className="text-button back" onClick={() => go("/capital")}>
        <FiArrowLeft /> Opportunity pipeline
      </button>
      <div className="page-heading">
        <div>
          <span className="eyebrow">
            {o.category} / {o.organization || "ORGANIZATION NOT RECORDED"}
          </span>
          <h1>{o.name}</h1>
          <div className="inline-badges">
            <Badge tone="green">{o.status}</Badge>
            <Badge
              tone={["High", "Urgent"].includes(o.priority) ? "amber" : ""}
            >
              {o.priority} priority
            </Badge>
            <span className="muted">
              {data.businesses.find((b) => b.id === o.business_id)?.name ??
                "WEG workspace"}
            </span>
          </div>
        </div>
        {canEdit && (
          <button
            className="secondary"
            onClick={() => edit("opportunities", o)}
          >
            <FiEdit2 />
            Edit opportunity
          </button>
        )}
      </div>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      <div className="detail-highlights">
        <div>
          <span>DEADLINE</span>
          <strong>{deadlineLabel(o)}</strong>
        </div>
        <div>
          <span>FIT ASSESSMENT</span>
          <strong>
            {o.fit_score === null ? "Not scored" : `${o.fit_score} / 100`}
          </strong>
        </div>
        <div>
          <span>NEXT ACTION</span>
          <strong>{o.next_action || "Choose your next step"}</strong>
          <small>
            {o.next_action_date
              ? dateLabel(o.next_action_date)
              : "No action date set"}
          </small>
        </div>
      </div>
      <div className="tabs">
        {[
          ["overview", "Overview"],
          ["fit", "Eligibility & fit"],
          ["application", "Application preparation"],
          ["actions", "Tasks & outcome"],
        ].map(([key, label]) => (
          <button
            key={key}
            className={tab === key ? "selected" : ""}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === "overview" ? (
        <div className="detail-grid">
          <section className="panel content-panel">
            <h2>The opportunity</h2>
            <p className="preserve">
              {String(
                o.description ||
                  "Add a description to capture what this opportunity offers.",
              )}
            </p>
            <dl className="details">
              {detail(
                "Funding range (USD)",
                o.funding_min != null || o.funding_max != null
                  ? `${o.funding_min ?? "Unknown"} – ${o.funding_max ?? "Unknown"}`
                  : null,
              )}
              {detail("Equity required", o.equity_required)}
              {detail("Geography", o.geography)}
              {detail("Contact", o.contact_name)}
              {detail("Contact email", o.contact_email)}
              {detail("Discovered", dateLabel(o.date_discovered))}
              {detail(
                "Last verified",
                o.date_last_verified ? dateLabel(o.date_last_verified) : null,
              )}
              {detail("Notes", o.notes)}
            </dl>
          </section>
          <aside className="panel content-panel">
            <h2>Sources & links</h2>
            <p className="muted">
              Verify the official requirements before applying.
            </p>
            {[
              ["website", "Website"],
              ["application_url", "Application page"],
              ["source_url", "Research source"],
            ].map(([key, label]) => (
              <div className="source-link" key={key}>
                {safeURL(o[key]) ? (
                  <a href={safeURL(o[key])} target="_blank" rel="noreferrer">
                    {label}
                    <FiExternalLink />
                  </a>
                ) : (
                  <span className="muted">{label} not recorded</span>
                )}
              </div>
            ))}
            <div className="note-box">
              Opening a link does not submit an application. All outreach and
              submissions remain founder-led.
            </div>
            <small className="muted">
              Created {dateLabel(o.created_at)}
              <br />
              Updated {dateLabel(o.updated_at)}
            </small>
          </aside>
        </div>
      ) : tab === "fit" ? (
        <div className="detail-grid">
          <section className="panel content-panel">
            <h2>Eligibility comes first</h2>
            <dl className="details">
              {detail("Eligibility evidence", o.eligibility)}
              {detail("Requirements", o.requirements)}
              {detail("Documents required", o.documents_required)}
            </dl>
            <div className="note-box">
              Unknown information remains unknown. Verify location, ownership,
              revenue, certifications, and program rules against an official
              source.
            </div>
          </section>
          <section className="panel content-panel">
            <span className="eyebrow">OPPORTUNITY FIT</span>
            <div className="big-score">
              {o.fit_score ?? "—"}
              <small>/100</small>
            </div>
            <p className="preserve">
              {o.fit_reason ||
                "No fit assessment yet. Add evidence or record your own assessment with an explanation."}
            </p>
            <p className="muted">
              Source: {String(o.score_source || "manual")}. This is not a
              probability of winning.
            </p>
            {canEdit && (
              <button className="secondary" onClick={() => setScoreOpen(true)}>
                Review & update fit
              </button>
            )}
          </section>
        </div>
      ) : tab === "application" ? (
        <div className="detail-grid application-grid">
          <section className="panel content-panel">
            <div className="panel-heading compact">
              <div>
                <h2>Questions & draft answers</h2>
                <p>Prepare here. Review before submitting.</p>
              </div>
              {canEdit && (
                <button
                  className="secondary"
                  onClick={() =>
                    edit("application_answers", { opportunity_id: o.id })
                  }
                >
                  <FiPlus />
                  Add question
                </button>
              )}
            </div>
            {answers.length ? (
              answers.map((a) => (
                <article className="answer" key={a.id}>
                  <h3>{String(a.question)}</h3>
                  <p className="preserve">
                    {a.draft_answer ? (
                      String(a.draft_answer)
                    ) : (
                      <span className="required-tag">
                        REQUIRED FROM FOUNDER
                      </span>
                    )}
                  </p>
                  <Badge>Editable draft</Badge>
                  {canEdit && (
                    <button
                      className="text-button"
                      onClick={() => edit("application_answers", a)}
                    >
                      Edit answer
                    </button>
                  )}
                </article>
              ))
            ) : (
              <Empty
                title="Prepare a thoughtful application"
                description="Add the application’s questions and build your answers using verified company information."
              />
            )}
          </section>
          <aside className="panel content-panel">
            <h2>Your reusable profile</h2>
            <p className="muted">
              Company and founder information from Settings.
            </p>
            <button className="text-button" onClick={() => go("/settings")}>
              Update profile <FiEdit2 />
            </button>
            <dl className="profile-reference">
              {profileFields.map((f) => (
                <div key={f}>
                  <dt>{f}</dt>
                  <dd>
                    {company?.[f] || (
                      <span className="required-tag">
                        REQUIRED FROM FOUNDER
                      </span>
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </aside>
        </div>
      ) : (
        <div className="panel content-panel">
          <div className="panel-heading compact">
            <div>
              <h2>Next actions & outcome</h2>
              <p>Keep the work connected to this opportunity.</p>
            </div>
            {canEdit && (
              <button
                className="primary"
                onClick={() =>
                  edit("tasks", {
                    opportunity_id: o.id,
                    business_id: o.business_id,
                    title: o.next_action || "",
                    due_date: o.next_action_date,
                  })
                }
              >
                <FiPlus />
                Create linked task
              </button>
            )}
          </div>
          <dl className="details">
            {detail("Current outcome / status", o.status)}
            {detail("Next action", o.next_action)}
            {detail(
              "Action date",
              o.next_action_date ? dateLabel(o.next_action_date) : null,
            )}
          </dl>
          {data.tasks
            .filter((t) => t.opportunity_id === o.id)
            .map((t) => (
              <button
                key={t.id}
                className="linked-task"
                onClick={() => canEdit && edit("tasks", t)}
              >
                <span>
                  <strong>{t.title}</strong>
                  <small>{dateLabel(t.due_date)}</small>
                </span>
                <Badge>{t.status}</Badge>
              </button>
            ))}
          {!data.tasks.some((t) => t.opportunity_id === o.id) && (
            <p className="muted">No linked tasks yet.</p>
          )}
          {canEdit && (
            <button
              className="secondary"
              onClick={() => edit("opportunities", o)}
            >
              Update status or next action
            </button>
          )}
          <p className="footnote">
            Use Awarded, Rejected, Not Eligible, or Expired to close an
            opportunity while preserving its history.
          </p>
        </div>
      )}
      {canDelete && (
        <button
          className="text-button danger delete-link"
          onClick={() => setDeleting(true)}
        >
          <FiTrash2 />
          Delete opportunity
        </button>
      )}
      {scoreOpen && (
        <ScoreForm
          opportunity={o}
          onClose={() => setScoreOpen(false)}
          onSave={(v) => save("opportunities", v, o)}
        />
      )}{" "}
      {deleting && (
        <Modal
          title="Delete this opportunity?"
          onClose={() => setDeleting(false)}
        >
          <div className="content-panel">
            <p>
              This deletes the opportunity and its draft answers. Linked tasks
              must be unlinked first. To retain history, change the status
              instead.
            </p>
            <div className="form-actions">
              <button className="secondary" onClick={() => setDeleting(false)}>
                Keep opportunity
              </button>
              <button
                className="danger-button"
                disabled={busy}
                onClick={() => void deleteRecord()}
              >
                {busy ? "Deleting…" : "Delete opportunity"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
function ScoreForm({
  opportunity: o,
  onSave,
  onClose,
}: {
  opportunity: Opportunity;
  onSave: (v: Record<string, unknown>) => Promise<void>;
  onClose: () => void;
}) {
  const existing = Array.isArray(o.score_evidence)
    ? (o.score_evidence as Evidence[])
    : [];
  const [items, setItems] = useState<Evidence[]>(
      scoreCriteria.map(
        (criterion) =>
          existing.find((i) => i.criterion === criterion) ?? {
            criterion,
            rating: null,
            evidence: "",
          },
      ),
    ),
    [mode, setMode] = useState(
      o.score_source === "evidence" ? "evidence" : "manual",
    ),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const calculated = calculateFit(items);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget);
    const score =
      mode === "manual"
        ? fd.get("score") === ""
          ? null
          : Number(fd.get("score"))
        : calculated.score;
    const reason =
      mode === "manual"
        ? String(fd.get("reason") ?? "").trim()
        : calculated.reason;
    if (score !== null && !reason) {
      setError("Every score needs a human-readable explanation.");
      return;
    }
    if (
      mode === "evidence" &&
      items.some((i) => i.rating !== null && !i.evidence.trim())
    ) {
      setError(
        "Add evidence for each rated criterion, or leave its rating unknown.",
      );
      return;
    }
    setBusy(true);
    try {
      await onSave({
        fit_score: score,
        fit_reason: reason || null,
        score_source: mode,
        score_evidence: items,
      });
      onClose();
    } catch (err) {
      setError(message(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal title="Review opportunity fit" onClose={onClose}>
      <form onSubmit={submit}>
        <p className="note-box">
          Scores compare opportunity fit, not odds of winning. All criteria are
          equally weighted; unknown criteria are excluded. For application
          effort, a higher rating means more manageable effort. Keep eligibility
          unknown without evidence.
        </p>
        <label>
          Assessment method
          <select value={mode} onChange={(e) => setMode(e.target.value)}>
            <option value="manual">Founder assessment / override</option>
            <option value="evidence">Evidence-based calculation</option>
          </select>
        </label>
        {mode === "manual" ? (
          <>
            <label>
              Fit score (0–100; blank = unknown)
              <input
                type="number"
                name="score"
                min={0}
                max={100}
                step={1}
                defaultValue={o.fit_score ?? ""}
              />
            </label>
            <label>
              Explanation
              <textarea
                name="reason"
                rows={5}
                defaultValue={o.fit_reason ?? ""}
              />
            </label>
          </>
        ) : (
          <>
            <div className="score-preview">
              {calculated.score ?? "—"} / 100{" "}
              <small>
                {
                  items.filter((i) => i.rating !== null && i.evidence.trim())
                    .length
                }{" "}
                of {scoreCriteria.length} criteria assessed
              </small>
            </div>
            {items.map((item, index) => (
              <div className="evidence-row" key={item.criterion}>
                <label>
                  {item.criterion}
                  <select
                    value={item.rating ?? ""}
                    onChange={(e) =>
                      setItems(
                        items.map((v, i) =>
                          i === index
                            ? {
                                ...v,
                                rating:
                                  e.target.value === ""
                                    ? null
                                    : Number(e.target.value),
                              }
                            : v,
                        ),
                      )
                    }
                  >
                    <option value="">Unknown</option>
                    {[0, 1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>
                        {n}/5
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Evidence / source
                  <textarea
                    rows={2}
                    value={item.evidence}
                    onChange={(e) =>
                      setItems(
                        items.map((v, i) =>
                          i === index ? { ...v, evidence: e.target.value } : v,
                        ),
                      )
                    }
                  />
                </label>
              </div>
            ))}
          </>
        )}
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
            {busy ? "Saving…" : "Save assessment"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
