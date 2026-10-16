import { useCallback, useEffect, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import {
  FiGrid,
  FiCompass,
  FiLayers,
  FiCheckSquare,
  FiSettings,
  FiLogOut,
  FiArrowUpRight,
  FiPlus,
  FiMenu,
  FiShield,
} from "react-icons/fi";
import { AuthLayout, Login, MfaChallenge, PasswordReset } from "./Auth";
import { check, db, message, supabase, readWorkspaceRows } from "./client";
import { emptyWorkspace, type Role, type Workspace, type Row } from "./domain";
import { RecordForm, type Entity } from "./forms";
import { Dashboard, Pipeline, Portfolio, Mentors } from "./views";
import { OpportunityDetail } from "./OpportunityDetail";
import { Settings } from "./Settings";
import { TaskBoard, TaskSummary, ActionQueue } from "./TaskBoard";
const nav = [
  { path: "dashboard", label: "Dashboard", icon: FiGrid },
  { path: "capital", label: "Capital & Mentorship", icon: FiCompass },
  { path: "portfolio", label: "Portfolio", icon: FiLayers },
  { path: "tasks", label: "Tasks", icon: FiCheckSquare },
  { path: "settings", label: "Settings", icon: FiSettings },
];
type Access = { id: string; name: string; role: Role };
export default function App() {
  const [user, setUser] = useState<User | null>(null),
    [loading, setLoading] = useState(Boolean(supabase)),
    [authError, setAuthError] = useState(""),
    [factor, setFactor] = useState(""),
    [recovery, setRecovery] = useState(
      location.pathname === "/admin/reset-password",
    ),
    [access, setAccess] = useState<Access[]>([]);
  const generation = useRef(0);
  const validate = useCallback(async () => {
    if (!supabase) return;
    const run = ++generation.current;
    setLoading(true);
    setAuthError("");
    try {
      const result = await supabase.auth.getUser();
      if (run !== generation.current) return;
      if (result.error || !result.data.user) {
        setUser(null);
        setAccess([]);
        setFactor("");
        if (
          result.error &&
          !result.error.message.includes("Auth session missing")
        )
          setAuthError(
            "Your session could not be validated. Please sign in again.",
          );
        return;
      }
      const aal = check(
        await supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
      );
      if (run !== generation.current) return;
      if (aal.nextLevel === "aal2" && aal.currentLevel !== "aal2") {
        const factors = check(await supabase.auth.mfa.listFactors());
        if (run !== generation.current) return;
        const id = factors.totp.find((f) => f.status === "verified")?.id;
        if (!id)
          throw new Error(
            "A supported authenticator is required. Contact your administrator.",
          );
        setFactor(id);
        setUser(null);
        return;
      }
      setFactor("");
      const memberships = check(
        await supabase
          .from("organization_members")
          .select("organization_id,role,organizations(id,name)")
          .eq("user_id", result.data.user.id),
      );
      if (run !== generation.current) return;
      setAccess(
        (memberships ?? [])
          .filter((m) => m.role === "owner")
          .map((m) => {
            const org = m.organizations as unknown as {
              id: string;
              name: string;
            };
            return {
              id: m.organization_id,
              name: org?.name ?? "Workspace",
              role: m.role as Role,
            };
          }),
      );
      setUser(result.data.user);
    } catch (err) {
      if (run === generation.current) {
        setAuthError(message(err));
        setUser(null);
        setAccess([]);
      }
    } finally {
      if (run === generation.current) setLoading(false);
    }
  }, []);
  useEffect(() => {
    if (!supabase) return;
    void validate();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setRecovery(true);
      if (event === "SIGNED_OUT") {
        ++generation.current;
        setUser(null);
        setAccess([]);
        setFactor("");
        setLoading(false);
      } else if (event !== "INITIAL_SESSION") {
        setTimeout(() => void validate(), 0);
      }
    });
    const recheck = () => {
      if (document.visibilityState === "visible") void validate();
    };
    document.addEventListener("visibilitychange", recheck);
    return () => {
      subscription.unsubscribe();
      // Invalidate pending validation; this ref is a counter, not a DOM node.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      ++generation.current;
      document.removeEventListener("visibilitychange", recheck);
    };
  }, [validate]);
  async function logout() {
    try {
      check(await db().auth.signOut({ scope: "local" }));
      setUser(null);
      setAccess([]);
      setFactor("");
      setRecovery(false);
      history.replaceState({}, "", "/admin/");
    } catch (err) {
      setAuthError(message(err));
    }
  }
  if (loading && !user && !factor)
    return (
      <AuthLayout>
        <span className="eyebrow">WEG OS</span>
        <h2>Opening your workspace…</h2>
        <p className="muted">Verifying your session and access.</p>
      </AuthLayout>
    );
  if (factor)
    return (
      <>
        {authError && (
          <div className="global-error" role="alert">
            {authError}
          </div>
        )}
        <MfaChallenge
          factorId={factor}
          onDone={() => void validate()}
          onCancel={() => void logout()}
        />
      </>
    );
  if (!user)
    return (
      <>
        {authError && (
          <div className="global-error" role="alert">
            {authError}
          </div>
        )}
        <Login />
      </>
    );
  if (recovery)
    return (
      <PasswordReset
        onDone={() => {
          setRecovery(false);
          setUser(null);
          history.replaceState({}, "", "/admin/");
        }}
      />
    );
  if (!access.length)
    return (
      <AuthLayout>
        <h2>No workspace access yet.</h2>
        {authError && (
          <p className="error" role="alert">
            {authError}
          </p>
        )}
        <p>
          Your account is authenticated, but has no organization membership. Ask
          your administrator to assign access.
        </p>
        <button className="secondary" onClick={() => void logout()}>
          Sign out
        </button>
      </AuthLayout>
    );
  return (
    <>
      {authError && (
        <div className="global-error" role="alert">
          {authError}
        </div>
      )}
      <WorkspaceApp
        key={`${user.id}:${access
          .map((a) => `${a.id}:${a.role}`)
          .sort()
          .join(",")}`}
        user={user}
        access={access}
        onLogout={logout}
      />
    </>
  );
}
function WorkspaceApp({
  user,
  access,
  onLogout,
}: {
  user: User;
  access: Access[];
  onLogout: () => Promise<void>;
}) {
  const [orgId, setOrgId] = useState(access[0].id),
    [data, setData] = useState<Workspace>(emptyWorkspace),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [path, setPath] = useState(
      location.pathname.replace(/^\/admin(?=\/|$)/, "") || "/",
    ),
    [menu, setMenu] = useState(false),
    [tab, setTab] = useState("pipeline");
  const [editor, setEditor] = useState<{
    entity: Entity;
    record?: Partial<Row>;
  } | null>(null);
  const org = access.find((a) => a.id === orgId) ?? access[0],
    canEdit = org.role !== "viewer",
    canDelete = ["owner", "admin"].includes(org.role);
  const request = useRef(0);
  const currentOrganization = useRef(orgId);
  currentOrganization.current = orgId;
  const refresh = useCallback(async () => {
    if (orgId !== currentOrganization.current) return;
    const run = ++request.current;
    setError("");
    try {
      const tables = [
        "opportunities",
        "tasks",
        "mentors",
        "businesses",
        "company_profiles",
        "task_events",
      ] as const;
      const rows = await Promise.all(
        tables.map(async (table) => [
          table,
          await readWorkspaceRows(table, orgId),
        ]),
      );
      if (run === request.current)
        setData(Object.fromEntries(rows) as unknown as Workspace);
    } catch (err) {
      if (run === request.current) {
        setData(emptyWorkspace);
        setError(message(err));
      }
    } finally {
      if (run === request.current) setLoading(false);
    }
  }, [orgId]);
  useEffect(() => {
    setLoading(true);
    setData(emptyWorkspace);
    void refresh();
    return () => {
      // Invalidate the current request when the organization changes.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      ++request.current;
    };
  }, [refresh]);
  useEffect(() => {
    const listener = () => {
      setPath(location.pathname.replace(/^\/admin(?=\/|$)/, "") || "/");
      setMenu(false);
    };
    window.addEventListener("popstate", listener);
    return () => window.removeEventListener("popstate", listener);
  }, []);
  function go(next: string) {
    history.pushState({}, "", `/admin${next}`);
    setPath(next);
    setMenu(false);
    setNotice("");
  }
  function edit(entity: Entity, record?: Partial<Row>) {
    setEditor({ entity, record });
  }
  async function save(
    entity: Entity,
    values: Record<string, unknown>,
    record?: Partial<Row>,
  ) {
    if (!canEdit) throw new Error("You have read-only access.");
    if (entity === "tasks" && record?.id && record.version == null)
      throw new Error("Refresh this task before editing.");
    let query;
    if (record?.id) {
      query = db()
        .from(entity)
        .update(values)
        .eq("organization_id", orgId)
        .eq("id", record.id);
      if (entity === "tasks") query = query.eq("version", record.version);
    } else {
      query = db()
        .from(entity)
        .insert({
          ...values,
          organization_id: orgId,
          ...(entity === "application_answers"
            ? { opportunity_id: record?.opportunity_id }
            : {}),
        });
    }
    const result = check(await query.select("id"));
    if (!result?.length)
      throw new Error(
        "Record was changed or access is unavailable. Refresh and review the latest record before trying again.",
      );
    setNotice("Changes saved.");
    await refresh();
  }
  async function remove(entity: Entity, id: string) {
    if (!canDelete) throw new Error("Owner or admin access required.");
    const rows = check(
      await db()
        .from(entity)
        .delete()
        .eq("organization_id", orgId)
        .eq("id", id)
        .select("id"),
    );
    if (!rows?.length)
      throw new Error("Record was not deleted. Check your access.");
    setNotice("Record deleted.");
    await refresh();
  }
  const segment = path.split("/")[1] || "dashboard";
  const selected = data.opportunities.find((o) => path === `/capital/${o.id}`);
  const current = nav.find((n) => n.path === segment);
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <aside className={`sidebar ${menu ? "open" : ""}`}>
        <a
          className="brand"
          href="/admin/dashboard"
          onClick={(e) => {
            e.preventDefault();
            go("/dashboard");
          }}
        >
          <span className="brand-mark">
            W<span>▰</span>
          </span>
          <span>
            WILLIS EMPIRE<small>GROUP / OPERATING SYSTEM</small>
          </span>
        </a>
        <div className="workspace-switch">
          <span className="workspace-avatar">W</span>
          <div>
            <strong>{org.name}</strong>
            <small>Founder workspace</small>
          </div>
          {access.length > 1 && (
            <select
              aria-label="Organization"
              value={orgId}
              onChange={(e) => {
                setOrgId(e.target.value);
                setEditor(null);
                go("/dashboard");
              }}
            >
              {access.map((a) => (
                <option value={a.id} key={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          )}
        </div>
        <span className="nav-caption">WORKSPACE</span>
        <nav>
          {nav.map((n) => (
            <a
              href={`/admin/${n.path}`}
              key={n.path}
              className={segment === n.path ? "active" : ""}
              aria-current={segment === n.path ? "page" : undefined}
              onClick={(e) => {
                e.preventDefault();
                go(`/${n.path}`);
              }}
            >
              <n.icon />
              {n.label}
              {n.path === "tasks" &&
                data.tasks.filter(
                  (t) => !["Done", "Cancelled"].includes(t.status),
                ).length > 0 && (
                  <span className="nav-count">
                    {
                      data.tasks.filter(
                        (t) => !["Done", "Cancelled"].includes(t.status),
                      ).length
                    }
                  </span>
                )}
            </a>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="private-label">
            <FiShield />
            <span>
              Private by design<small>Your focus. Your next move.</small>
            </span>
          </div>
          <div className="user">
            <span className="user-avatar">
              {user.email?.[0].toUpperCase() ?? "W"}
            </span>
            <div>
              <strong>
                {org.role === "owner" ? "Founder account" : org.role}
              </strong>
              <small title={user.email}>{user.email}</small>
            </div>
            <button
              className="icon-button"
              onClick={() =>
                void onLogout().catch((err) => setError(message(err)))
              }
              aria-label="Sign out"
            >
              <FiLogOut />
            </button>
          </div>
        </div>
      </aside>
      {menu && (
        <button
          className="menu-backdrop"
          aria-label="Close navigation"
          onClick={() => setMenu(false)}
        />
      )}
      <div className="app-body">
        <header className="topbar">
          <div>
            <button
              className="icon-button mobile-menu"
              onClick={() => setMenu(!menu)}
              aria-label="Open navigation"
            >
              <FiMenu />
            </button>
            <span className="breadcrumb">
              Workspace <span>/</span>{" "}
              <strong>{current?.label ?? "Page"}</strong>
            </span>
          </div>
          <div className="topbar-right">
            <span className="live-dot" />
            Internal workspace<span className="top-avatar">W</span>
          </div>
        </header>
        <main id="main-content" className="main-content">
          {error && (
            <div className="error" role="alert">
              {error}{" "}
              <button className="text-button" onClick={() => void refresh()}>
                Retry loading
              </button>
            </div>
          )}
          {notice && (
            <div className="notice" role="status">
              {notice}
              <button
                aria-label="Dismiss notification"
                className="text-button"
                onClick={() => setNotice("")}
              >
                ×
              </button>
            </div>
          )}
          {loading ? (
            <div className="loading-state">Loading workspace…</div>
          ) : error ? (
            <div className="empty">
              <h2>Workspace data is unavailable.</h2>
              <p>Retry loading before making changes.</p>
            </div>
          ) : segment === "dashboard" ? (
            <>
              <TaskSummary data={data} go={go} />
              <ActionQueue data={data} edit={edit} />
              <Dashboard
                data={data}
                go={go}
                edit={canEdit ? edit : undefined}
              />
            </>
          ) : segment === "capital" ? (
            selected ? (
              <OpportunityDetail
                key={selected.id}
                opportunity={selected}
                data={data}
                orgId={orgId}
                canEdit={canEdit}
                canDelete={canDelete}
                edit={edit}
                save={save}
                remove={remove}
                go={go}
              />
            ) : path.split("/")[2] ? (
              <div className="empty">
                <h2>Opportunity not found</h2>
                <button onClick={() => go("/capital")}>
                  Return to pipeline
                </button>
              </div>
            ) : (
              <>
                <PageHeading
                  eyebrow="BUILD YOUR NEXT ADVANTAGE"
                  title="Capital & Mentorship"
                  description="The right opportunities. The right relationships. A clear next move."
                  action={
                    canEdit ? (
                      <button
                        className="primary"
                        onClick={() =>
                          edit(tab === "pipeline" ? "opportunities" : "mentors")
                        }
                      >
                        <FiPlus />{" "}
                        {tab === "pipeline" ? "Add opportunity" : "Add contact"}
                      </button>
                    ) : undefined
                  }
                />
                <div className="tabs">
                  <button
                    className={tab === "pipeline" ? "selected" : ""}
                    onClick={() => setTab("pipeline")}
                  >
                    Opportunity pipeline{" "}
                    <span>{data.opportunities.length}</span>
                  </button>
                  <button
                    className={tab === "mentors" ? "selected" : ""}
                    onClick={() => setTab("mentors")}
                  >
                    Mentorship & contacts <span>{data.mentors.length}</span>
                  </button>
                </div>
                {tab === "pipeline" ? (
                  <Pipeline
                    data={data}
                    go={go}
                    edit={canEdit ? edit : undefined}
                  />
                ) : (
                  <Mentors data={data} edit={canEdit ? edit : undefined} />
                )}
              </>
            )
          ) : segment === "portfolio" ? (
            <Portfolio data={data} edit={canEdit ? edit : undefined} />
          ) : segment === "tasks" ? (
            <TaskBoard data={data} edit={canEdit ? edit : undefined} />
          ) : segment === "settings" ? (
            <Settings
              user={user}
              orgId={orgId}
              data={data}
              canEdit={canEdit}
              refresh={refresh}
              edit={edit}
            />
          ) : (
            <div className="empty">
              <h2>Page not found</h2>
              <button onClick={() => go("/dashboard")}>
                Return to dashboard
              </button>
            </div>
          )}
          <footer className="main-footer">
            <span>WILLIS EMPIRE GROUP</span>
            <span>
              Built for what comes next. <FiArrowUpRight />
            </span>
          </footer>
        </main>
      </div>
      {editor && (
        <RecordForm
          key={`${editor.entity}-${editor.record?.id ?? "new"}`}
          entity={editor.entity}
          record={editor.record}
          data={data}
          onSave={(values) => save(editor.entity, values, editor.record)}
          onClose={() => setEditor(null)}
        />
      )}
    </div>
  );
}
export function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action}
    </div>
  );
}
