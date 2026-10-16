import { useState } from "react";
import {
  FiArrowRight,
  FiArrowUpRight,
  FiPlus,
  FiSearch,
  FiCompass,
  FiClock,
  FiCheckSquare,
  FiUsers,
  FiLayers,
  FiExternalLink,
  FiCheck,
} from "react-icons/fi";
import { PageHeading } from "./App";
import {
  categories,
  statuses,
  priorities,
  filterOpportunities,
  isActive,
  dateLabel,
  deadlineLabel,
  todayISO,
  safeURL,
  type Workspace,
  type Row,
  type Filters,
} from "./domain";
import type { Entity } from "./forms";
import { message } from "./client";
type Edit = (entity: Entity, record?: Partial<Row>) => void;
type Props = { data: Workspace; edit?: Edit };
export function Badge({
  children,
  tone = "",
}: {
  children: React.ReactNode;
  tone?: string;
}) {
  return <span className={`badge ${tone}`}>{children}</span>;
}
export function Empty({
  icon: Icon = FiCompass,
  title,
  description,
  action,
}: {
  icon?: typeof FiCompass;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="empty">
      <span className="empty-icon">
        <Icon />
      </span>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}
export function Dashboard({
  data,
  go,
  edit,
}: Props & { go: (path: string) => void }) {
  const active = data.opportunities.filter(isActive),
    high = active.filter((o) => ["High", "Urgent"].includes(o.priority)),
    applications = active.filter((o) =>
      ["Preparing", "Ready", "Applied", "Follow Up", "Interview"].includes(
        o.status,
      ),
    ),
    tasks = data.tasks.filter((t) => !["Done", "Cancelled"].includes(t.status)),
    mentors = data.mentors.filter((m) => m.relationship_status === "Active");
  const today = todayISO(),
    end = new Date();
  end.setDate(end.getDate() + 30);
  const until = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, "0")}-${String(end.getDate()).padStart(2, "0")}`;
  const deadlines = active
    .filter((o) => o.deadline && !o.rolling_deadline && o.deadline <= until)
    .sort((a, b) => a.deadline!.localeCompare(b.deadline!));
  const actions = [
    ...active
      .filter((o) => o.next_action)
      .map((o) => ({
        id: o.id,
        title: o.next_action!,
        date: o.next_action_date,
        detail: o.name,
        action: () => go(`/capital/${o.id}`),
      })),
    ...data.mentors
      .filter(
        (m) =>
          m.next_follow_up &&
          !["Closed", "Paused"].includes(m.relationship_status),
      )
      .map((m) => ({
        id: m.id,
        title: `Follow up with ${m.name}`,
        date: m.next_follow_up,
        detail: "Mentorship",
        action: () => edit?.("mentors", m),
      })),
    ...tasks.map((t) => ({
      id: t.id,
      title: t.title,
      date: t.due_date,
      detail: "Task",
      action: () => edit?.("tasks", t),
    })),
  ]
    .sort((a, b) => (a.date ?? "9999").localeCompare(b.date ?? "9999"))
    .slice(0, 6);
  const stats = [
    {
      title: "Active opportunities",
      value: active.length,
      note: `${high.length} high priority`,
      icon: FiCompass,
      path: "/capital",
    },
    {
      title: "Applications in progress",
      value: applications.length,
      note: "Preparation through interview",
      icon: FiArrowUpRight,
      path: "/capital",
    },
    {
      title: "Active mentorships",
      value: mentors.length,
      note: "Relationships you’re building",
      icon: FiUsers,
      path: "/capital",
    },
    {
      title: "Open tasks",
      value: tasks.length,
      note: `${tasks.filter((t) => t.due_date && t.due_date < today).length} overdue`,
      icon: FiCheckSquare,
      path: "/tasks",
    },
  ];
  return (
    <>
      <PageHeading
        eyebrow={new Date()
          .toLocaleDateString(undefined, {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
          })
          .toUpperCase()}
        title="A clear view. A focused next move."
        description="Welcome to your Willis Empire Group command center."
        action={
          edit ? (
            <button className="primary" onClick={() => edit("opportunities")}>
              <FiPlus />
              Add opportunity
            </button>
          ) : undefined
        }
      />
      <div className="overview-banner">
        <div>
          <span className="eyebrow">YOUR FOUNDER BRIEF</span>
          <h2>
            {deadlines.length
              ? `${deadlines.length} deadline${deadlines.length === 1 ? "" : "s"} to keep in view.`
              : "Make room for your next opportunity."}
          </h2>
          <p>
            {deadlines.length
              ? "Upcoming in the next 30 days, plus anything overdue. Review eligibility and choose your next action."
              : "Start with one opportunity worth pursuing. Capture the details, assess the fit, and take the next step."}
          </p>
          <button className="banner-link" onClick={() => go("/capital")}>
            Open your opportunity pipeline <FiArrowRight />
          </button>
        </div>
        <div className="banner-symbol" aria-hidden="true">
          <span>W</span>
          <i>↗</i>
        </div>
      </div>
      <div className="stats-grid">
        {stats.map((s) => (
          <button
            className="stat-card"
            key={s.title}
            onClick={() => go(s.path)}
          >
            <div>
              <span>{s.title}</span>
              <s.icon />
            </div>
            <strong>{s.value}</strong>
            <small>{s.note}</small>
          </button>
        ))}
      </div>
      <div className="dashboard-grid">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Your next moves</h2>
              <p>Tasks, follow-ups, and strategic actions.</p>
            </div>
            <button className="text-button" onClick={() => go("/tasks")}>
              All tasks <FiArrowUpRight />
            </button>
          </div>
          {actions.length ? (
            <div className="action-list">
              {actions.map((a) => (
                <button className="action-row" key={a.id} onClick={a.action}>
                  <span className="round-icon">
                    <FiArrowUpRight />
                  </span>
                  <span>
                    <strong>{a.title}</strong>
                    <small>{a.detail}</small>
                  </span>
                  <span
                    className={a.date && a.date < today ? "overdue" : "muted"}
                  >
                    {a.date ? dateLabel(a.date) : "Set a date"}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <Empty
              icon={FiCheckSquare}
              title="Turn a priority into a next step"
              description="Add a task or record an opportunity’s next action. Your working agenda will appear here."
              action={
                edit ? (
                  <button className="secondary" onClick={() => edit("tasks")}>
                    <FiPlus />
                    Create your first task
                  </button>
                ) : undefined
              }
            />
          )}
        </section>
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>On the horizon</h2>
              <p>Deadlines that need your attention.</p>
            </div>
            <FiClock />
          </div>
          {deadlines.length ? (
            <div className="deadline-list">
              {deadlines.slice(0, 5).map((o) => (
                <button key={o.id} onClick={() => go(`/capital/${o.id}`)}>
                  <span className="date-square">
                    <b>{new Date(o.deadline + "T12:00:00").getDate()}</b>
                    <small>
                      {new Date(o.deadline + "T12:00:00").toLocaleDateString(
                        undefined,
                        { month: "short" },
                      )}
                    </small>
                  </span>
                  <span>
                    <strong>{o.name}</strong>
                    <small>
                      {o.deadline! < today ? "Overdue · " : ""}
                      {o.category}
                    </small>
                  </span>
                  <FiArrowUpRight />
                </button>
              ))}
            </div>
          ) : (
            <Empty
              icon={FiClock}
              title="No approaching deadlines"
              description="Dated opportunities will appear here as their deadlines approach."
            />
          )}
        </section>
      </div>
      <section className="panel portfolio-strip">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">ONE GROUP. SHARED AMBITION.</span>
            <h2>Your portfolio</h2>
          </div>
          <button className="text-button" onClick={() => go("/portfolio")}>
            View portfolio <FiArrowUpRight />
          </button>
        </div>
        <div className="mini-portfolio">
          {data.businesses.length ? (
            data.businesses.map((b, i) => (
              <button key={b.id} onClick={() => go("/portfolio")}>
                <span className={`company-icon color-${i % 4}`}>
                  {b.name === "Willis Empire Group"
                    ? "W"
                    : b.name === "Revenue Ripple"
                      ? "R"
                      : b.name === "binGone"
                        ? "bG"
                        : b.name === "binRich Entertainment"
                          ? "bR"
                          : b.name.slice(0, 2)}
                </span>
                <strong>
                  {b.name}
                  <small>{b.industry || "Add industry"}</small>
                </strong>
                <FiArrowUpRight />
              </button>
            ))
          ) : (
            <p className="muted">
              Add your portfolio businesses in Settings to connect them to your
              work.
            </p>
          )}
        </div>
      </section>
    </>
  );
}
export function Pipeline({
  data,
  go,
  edit,
}: Props & { go: (path: string) => void }) {
  const initial: Filters = {
      query: "",
      status: "",
      category: "",
      priority: "",
      business: "",
      deadline: "",
      fit: "",
    },
    [filters, setFilters] = useState(initial);
  const rows = filterOpportunities(data.opportunities, filters),
    hasFilters = Object.values(filters).some(Boolean);
  function select(
    key: keyof Filters,
    label: string,
    options: { value: string; label: string }[],
  ) {
    return (
      <select
        aria-label={label}
        value={filters[key]}
        onChange={(e) => setFilters({ ...filters, [key]: e.target.value })}
      >
        <option value="">{label}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    );
  }
  const opts = (values: readonly string[]) =>
    values.map((v) => ({ value: v, label: v }));
  return (
    <>
      <div className="pipeline-summary">
        <span>
          <b>{data.opportunities.filter(isActive).length}</b> active
          opportunities
        </span>
        <span>
          <b>
            {
              data.opportunities.filter(
                (o) => isActive(o) && ["High", "Urgent"].includes(o.priority),
              ).length
            }
          </b>{" "}
          high priority
        </span>
        <span>
          <b>
            {data.opportunities.filter((o) => o.status === "Awarded").length}
          </b>{" "}
          awarded
        </span>
      </div>
      <section className="panel">
        <div className="filters">
          <label className="search-field">
            <FiSearch />
            <input
              aria-label="Search opportunities"
              placeholder="Search opportunities, organizations, next actions…"
              value={filters.query}
              onChange={(e) =>
                setFilters({ ...filters, query: e.target.value })
              }
            />
          </label>
          <div className="filter-row">
            {select("status", "All statuses", opts(statuses))}
            {select("category", "All categories", opts(categories))}
            {select("priority", "All priorities", opts(priorities))}
            {select(
              "business",
              "All businesses",
              data.businesses.map((b) => ({ value: b.id, label: b.name })),
            )}
            {select("deadline", "All deadlines", [
              { value: "30", label: "Next 30 days" },
              { value: "overdue", label: "Overdue" },
              { value: "rolling", label: "Rolling" },
            ])}
            {select("fit", "All fit scores", [
              { value: "80", label: "80+ fit" },
              { value: "60", label: "60+ fit" },
              { value: "unknown", label: "Not scored" },
            ])}
            {hasFilters && (
              <button
                className="text-button"
                onClick={() => setFilters(initial)}
              >
                Clear filters
              </button>
            )}
          </div>
        </div>
        {rows.length ? (
          <>
            <div className="opportunity-mobile-list">
              {rows.map((o) => (
                <article className="opportunity-mobile-card" key={o.id}>
                  <div className="inline-badges">
                    <Badge>{o.status}</Badge>
                    <Badge
                      tone={
                        ["High", "Urgent"].includes(o.priority) ? "amber" : ""
                      }
                    >
                      {o.priority} priority
                    </Badge>
                  </div>
                  <a
                    className="record-link"
                    href={`/capital/${o.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      go(`/capital/${o.id}`);
                    }}
                  >
                    {o.name}
                  </a>
                  <p>{o.organization || o.category}</p>
                  <dl>
                    <div>
                      <dt>Deadline</dt>
                      <dd>{deadlineLabel(o)}</dd>
                    </div>
                    <div>
                      <dt>Fit</dt>
                      <dd>
                        {o.fit_score === null
                          ? "Not scored"
                          : `${o.fit_score}/100`}
                      </dd>
                    </div>
                  </dl>
                  <small>
                    {data.businesses.find((b) => b.id === o.business_id)
                      ?.name ?? "WEG workspace"}
                  </small>
                </article>
              ))}
            </div>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Opportunity</th>
                    <th>Status</th>
                    <th>Priority</th>
                    <th>Deadline</th>
                    <th>Fit</th>
                    <th>Business</th>
                    <th>
                      <span className="sr-only">Open</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((o) => (
                    <tr key={o.id}>
                      <td>
                        <a
                          className="record-link"
                          href={`/capital/${o.id}`}
                          onClick={(e) => {
                            e.preventDefault();
                            go(`/capital/${o.id}`);
                          }}
                        >
                          {o.name}
                        </a>
                        <small>{o.organization || o.category}</small>
                      </td>
                      <td>
                        <Badge>{o.status}</Badge>
                      </td>
                      <td>
                        <Badge
                          tone={
                            ["High", "Urgent"].includes(o.priority)
                              ? "amber"
                              : ""
                          }
                        >
                          {o.priority}
                        </Badge>
                      </td>
                      <td>
                        <span
                          className={
                            o.deadline &&
                            !o.rolling_deadline &&
                            o.deadline < todayISO()
                              ? "overdue"
                              : ""
                          }
                        >
                          {deadlineLabel(o)}
                        </span>
                      </td>
                      <td>
                        {o.fit_score === null ? (
                          <span className="muted">Not scored</span>
                        ) : (
                          <span
                            className="fit-value"
                            title={o.fit_reason ?? ""}
                          >
                            {o.fit_score}
                            <small>/100</small>
                          </span>
                        )}
                      </td>
                      <td>
                        {data.businesses.find((b) => b.id === o.business_id)
                          ?.name ?? "—"}
                      </td>
                      <td>
                        <button
                          className="icon-button"
                          aria-label={`Open ${o.name}`}
                          onClick={() => go(`/capital/${o.id}`)}
                        >
                          <FiArrowUpRight />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="table-footer">
              {rows.length} opportunit{rows.length === 1 ? "y" : "ies"} · Fit is
              an assessment, never a probability of winning.
            </div>
          </>
        ) : (
          <Empty
            title={
              hasFilters
                ? "No matching opportunities"
                : "Your next opportunity starts here"
            }
            description={
              hasFilters
                ? "Try a broader search or clear your filters."
                : "Add a verified opportunity or one you want to research. Track its fit, application, and next action in one place."
            }
            action={
              edit && !hasFilters ? (
                <button
                  className="primary"
                  onClick={() => edit("opportunities")}
                >
                  <FiPlus />
                  Add your first opportunity
                </button>
              ) : hasFilters ? (
                <button
                  className="secondary"
                  onClick={() => setFilters(initial)}
                >
                  Clear filters
                </button>
              ) : undefined
            }
          />
        )}
      </section>
      <p className="footnote">
        Only founder-entered or verified opportunities belong here. Unknown
        eligibility stays unknown.
      </p>
    </>
  );
}
export function Portfolio({ data, edit }: Props) {
  return (
    <>
      <PageHeading
        eyebrow="THE WEG PORTFOLIO"
        title="Independent ventures. Shared direction."
        description="A simple view of the businesses you’re building."
        action={
          edit ? (
            <button className="primary" onClick={() => edit("businesses")}>
              <FiPlus />
              Add business
            </button>
          ) : undefined
        }
      />
      <div className="portfolio-grid">
        {data.businesses.map((b, i) => (
          <article className="panel business-card" key={b.id}>
            <div className="business-top">
              <span className={`company-icon color-${i % 4}`}>
                {b.name.slice(0, 2)}
              </span>
              <Badge tone="green">{b.status}</Badge>
            </div>
            <span className="eyebrow">{b.industry || "INDUSTRY NOT SET"}</span>
            <h2>{b.name}</h2>
            <p>{b.description || "Add a description for this business."}</p>
            <div className="business-counts">
              <span>
                <b>
                  {
                    data.opportunities.filter(
                      (o) => o.business_id === b.id && isActive(o),
                    ).length
                  }
                </b>{" "}
                active opportunities
              </span>
              <span>
                <b>
                  {
                    data.tasks.filter(
                      (t) =>
                        t.business_id === b.id &&
                        !["Done", "Cancelled"].includes(t.status),
                    ).length
                  }
                </b>{" "}
                open tasks
              </span>
            </div>
            <div className="business-actions">
              {edit && (
                <button
                  className="text-button"
                  onClick={() => edit("businesses", b)}
                >
                  Edit business <FiArrowRight />
                </button>
              )}
              {safeURL(b.website) && (
                <a href={safeURL(b.website)} target="_blank" rel="noreferrer">
                  Website <FiExternalLink />
                </a>
              )}
            </div>
          </article>
        ))}
      </div>
      {!data.businesses.length && (
        <div className="panel">
          <Empty
            icon={FiLayers}
            title="Give your ventures a home"
            description="Add Willis Empire Group and its businesses, then connect opportunities and tasks."
            action={
              edit ? (
                <button className="primary" onClick={() => edit("businesses")}>
                  Add business
                </button>
              ) : undefined
            }
          />
        </div>
      )}
      <p className="footnote">
        Portfolio activity reflects records in this workspace. External
        analytics are not connected.
      </p>
    </>
  );
}
export function Tasks({
  data,
  edit,
  save,
}: Props & {
  save: (
    entity: Entity,
    values: Record<string, unknown>,
    record?: Partial<Row>,
  ) => Promise<void>;
}) {
  const [filter, setFilter] = useState("open"),
    [query, setQuery] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState("");
  const rows = data.tasks
    .filter(
      (t) =>
        (filter === "all" ||
          (filter === "done"
            ? t.status === "Done"
            : !["Done", "Cancelled"].includes(t.status))) &&
        t.title.toLowerCase().includes(query.toLowerCase()),
    )
    .sort((a, b) => (a.due_date ?? "9999").localeCompare(b.due_date ?? "9999"));
  async function toggle(t: Row) {
    setBusy(t.id);
    setError("");
    try {
      await save("tasks", { status: t.status === "Done" ? "Open" : "Done" }, t);
    } catch (err) {
      setError(message(err));
    } finally {
      setBusy("");
    }
  }
  return (
    <>
      <PageHeading
        eyebrow="MOVE THE WORK FORWARD"
        title="Tasks"
        description="Small steps. Clear owners. Meaningful progress."
        action={
          edit ? (
            <button className="primary" onClick={() => edit("tasks")}>
              <FiPlus />
              Add task
            </button>
          ) : undefined
        }
      />
      <div className="panel">
        <div className="filters task-filters">
          <label className="search-field">
            <FiSearch />
            <input
              aria-label="Search tasks"
              placeholder="Search tasks…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <select
            aria-label="Task status"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="open">Open tasks</option>
            <option value="done">Completed</option>
            <option value="all">All tasks</option>
          </select>
        </div>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        {rows.length ? (
          <div className="task-list">
            {rows.map((t) => (
              <div className="task-row" key={t.id}>
                <button
                  className={`task-check ${t.status === "Done" ? "checked" : ""}`}
                  aria-label={`${t.status === "Done" ? "Reopen" : "Complete"} ${t.title}`}
                  disabled={!edit || busy === t.id}
                  onClick={() => void toggle(t)}
                >
                  {t.status === "Done" && <FiCheck />}
                </button>
                <button
                  className="task-title"
                  onClick={() => edit?.("tasks", t)}
                >
                  <strong>{t.title}</strong>
                  <small>
                    {data.businesses.find((b) => b.id === t.business_id)
                      ?.name ?? "WEG workspace"}
                    {t.opportunity_id &&
                      ` · ${data.opportunities.find((o) => o.id === t.opportunity_id)?.name ?? "Linked opportunity"}`}
                  </small>
                </button>
                <Badge>{t.status}</Badge>
                <Badge
                  tone={["High", "Urgent"].includes(t.priority) ? "amber" : ""}
                >
                  {t.priority}
                </Badge>
                <span
                  className={
                    t.due_date &&
                    t.due_date < todayISO() &&
                    !["Done", "Cancelled"].includes(t.status)
                      ? "overdue"
                      : "muted"
                  }
                >
                  {dateLabel(t.due_date)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <Empty
            icon={FiCheckSquare}
            title="A little focus goes a long way"
            description="No tasks match this view. Add a clear next action to move your business forward."
            action={
              edit ? (
                <button className="secondary" onClick={() => edit("tasks")}>
                  Create a task
                </button>
              ) : undefined
            }
          />
        )}
      </div>
    </>
  );
}
export function Mentors({ data, edit }: Props) {
  const [query, setQuery] = useState(""),
    [status, setStatus] = useState("");
  const rows = data.mentors.filter(
    (m) =>
      `${m.name} ${m.organization} ${m.expertise}`
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (!status || m.relationship_status === status),
  );
  return (
    <div className="panel">
      <div className="filters task-filters">
        <label className="search-field">
          <FiSearch />
          <input
            aria-label="Search contacts"
            placeholder="Search names, organizations, expertise…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <select
          aria-label="Relationship status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">All relationships</option>
          {["Prospect", "Contacted", "Active", "Paused", "Closed"].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>
      {rows.length ? (
        <div className="contact-grid">
          {rows.map((m) => (
            <article key={m.id} className="contact-card">
              <div className="contact-header">
                <span className="user-avatar">
                  {m.name
                    .split(" ")
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join("")}
                </span>
                <Badge tone={m.relationship_status === "Active" ? "green" : ""}>
                  {m.relationship_status}
                </Badge>
              </div>
              <h3>{m.name}</h3>
              <p>
                {String(m.title || "")}
                {Boolean(m.title) && m.organization ? " · " : ""}
                {m.organization}
              </p>
              <div className="expertise">
                {m.expertise || "Expertise not recorded"}
              </div>
              <dl>
                <dt>Last interaction</dt>
                <dd>{dateLabel(m.last_interaction)}</dd>
                <dt>Next follow-up</dt>
                <dd
                  className={
                    m.next_follow_up && m.next_follow_up < todayISO()
                      ? "overdue"
                      : ""
                  }
                >
                  {dateLabel(m.next_follow_up)}
                </dd>
              </dl>
              {Boolean(m.notes) && (
                <p className="preserve">{String(m.notes)}</p>
              )}
              {edit && (
                <button
                  className="text-button"
                  onClick={() => edit("mentors", m)}
                >
                  Open contact <FiArrowUpRight />
                </button>
              )}
            </article>
          ))}
        </div>
      ) : (
        <Empty
          icon={FiUsers}
          title="Build relationships with intention"
          description="Keep the people, expertise, and follow-ups that matter close at hand."
          action={
            edit ? (
              <button className="secondary" onClick={() => edit("mentors")}>
                <FiPlus />
                Add a mentor or contact
              </button>
            ) : undefined
          }
        />
      )}
    </div>
  );
}
