import { useEffect, useState, type FormEvent } from "react";
import type { User } from "@supabase/supabase-js";
import { FiShield, FiPlus } from "react-icons/fi";
import { PageHeading } from "./App";
import { db, check, message } from "./client";
import { profileFields, type Workspace, type Row } from "./domain";
import type { Entity } from "./forms";
export function Settings({
  user,
  orgId,
  data,
  canEdit,
  refresh,
  edit,
}: {
  user: User;
  orgId: string;
  data: Workspace;
  canEdit: boolean;
  refresh: () => Promise<void>;
  edit: (e: Entity, r?: Partial<Row>) => void;
}) {
  const [tab, setTab] = useState("profile"),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false),
    [fullName, setFullName] = useState("");
  useEffect(() => {
    let active = true;
    db()
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .maybeSingle()
      .then((r) => {
        if (active) {
          if (r.error) setError(r.error.message);
          else setFullName(r.data?.full_name ?? "");
        }
      });
    return () => {
      active = false;
    };
  }, [user.id]);
  const profile = data.company_profiles[0],
    content = (profile?.content ?? {}) as Record<string, string>;
  async function saveProfile(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    const form = new FormData(e.currentTarget);
    try {
      const values = Object.fromEntries(
        profileFields.map((f) => [f, String(form.get(f) || "").trim()]),
      );
      check(
        await db()
          .from("company_profiles")
          .upsert(
            {
              ...(profile ? { id: profile.id } : {}),
              organization_id: orgId,
              content: values,
            },
            { onConflict: "organization_id" },
          ),
      );
      await refresh();
      setNotice("Company and founder profile saved.");
    } catch (err) {
      setError(message(err));
    } finally {
      setBusy(false);
    }
  }
  async function saveAccount(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      check(
        await db()
          .from("profiles")
          .upsert({ id: user.id, full_name: fullName }),
      );
      setNotice("Account profile saved.");
    } catch (err) {
      setError(message(err));
    } finally {
      setBusy(false);
    }
  }
  async function reset() {
    setBusy(true);
    setError("");
    try {
      check(
        await db().auth.resetPasswordForEmail(user.email!, {
          redirectTo: `${location.origin}/admin/reset-password`,
        }),
      );
      setNotice(
        "Password reset email requested. Open the link in this browser.",
      );
    } catch (err) {
      setError(message(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageHeading
        eyebrow="YOUR WORKSPACE, WELL KEPT"
        title="Settings"
        description="Keep your company information current and your account secure."
      />
      <div className="tabs">
        {[
          ["profile", "Founder & company profile"],
          ["account", "Account"],
          ["security", "Security & MFA"],
          ["businesses", "Portfolio businesses"],
        ].map(([k, l]) => (
          <button
            key={k}
            className={tab === k ? "selected" : ""}
            onClick={() => {
              setTab(k);
              setError("");
              setNotice("");
            }}
          >
            {l}
          </button>
        ))}
      </div>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {notice && (
        <p className="notice" role="status">
          {notice}
        </p>
      )}
      {tab === "profile" ? (
        <section className="panel content-panel">
          <h2>Write once. Build on it.</h2>
          <p className="muted">
            Reusable, founder-verified context for your applications. Leave
            anything unverified blank.
          </p>
          <form onSubmit={saveProfile}>
            <div className="form-grid">
              {profileFields.map((f) => (
                <label key={f}>
                  {f}
                  {!content[f] && (
                    <span className="required-tag">REQUIRED FROM FOUNDER</span>
                  )}
                  <textarea
                    name={f}
                    rows={4}
                    defaultValue={content[f] ?? ""}
                    placeholder="REQUIRED FROM FOUNDER"
                    disabled={!canEdit}
                  />
                </label>
              ))}
            </div>
            {canEdit && (
              <div className="form-actions">
                <button className="primary" disabled={busy}>
                  {busy ? "Saving…" : "Save profile"}
                </button>
              </div>
            )}
          </form>
        </section>
      ) : tab === "account" ? (
        <section className="panel content-panel narrow">
          <h2>Your account</h2>
          <form onSubmit={saveAccount}>
            <label>
              Full name
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </label>
            <label>
              Email address
              <input readOnly value={user.email ?? ""} />
            </label>
            <p className="muted">
              Account access is assigned by organization membership.
            </p>
            <button className="primary" disabled={busy}>
              Save account
            </button>
          </form>
        </section>
      ) : tab === "security" ? (
        <>
          <section className="panel content-panel narrow">
            <h2>Password</h2>
            <p className="muted">
              Request a secure email link to change your password.
            </p>
            <button
              className="secondary"
              onClick={() => void reset()}
              disabled={busy}
            >
              Send password reset email
            </button>
          </section>
          <MfaSettings />
        </>
      ) : (
        <section className="panel content-panel">
          <div className="panel-heading compact">
            <h2>Portfolio businesses</h2>
            {canEdit && (
              <button className="primary" onClick={() => edit("businesses")}>
                <FiPlus />
                Add business
              </button>
            )}
          </div>
          {data.businesses.map((b) => (
            <div className="settings-business" key={b.id}>
              <span>
                <strong>{b.name}</strong>
                <small>
                  {b.industry} · {b.status}
                </small>
              </span>
              {canEdit && (
                <button
                  className="secondary"
                  onClick={() => edit("businesses", b)}
                >
                  Edit
                </button>
              )}
            </div>
          ))}
        </section>
      )}
    </>
  );
}
function MfaSettings() {
  const [factors, setFactors] = useState<
      { id: string; friendly_name?: string; status: string }[]
    >([]),
    [enrollment, setEnrollment] = useState<{
      id: string;
      qr: string;
      secret: string;
    } | null>(null),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false);
  async function load() {
    try {
      const data = check(await db().auth.mfa.listFactors());
      setFactors(data.totp);
    } catch (err) {
      setError(message(err));
    }
  }
  useEffect(() => {
    void load();
  }, []);
  async function enroll() {
    setBusy(true);
    setError("");
    try {
      for (const f of factors.filter((f) => f.status === "unverified"))
        check(await db().auth.mfa.unenroll({ factorId: f.id }));
      const data = check(
        await db().auth.mfa.enroll({
          factorType: "totp",
          friendlyName: "WEG authenticator",
        }),
      );
      setEnrollment({
        id: data.id,
        qr: data.totp.qr_code,
        secret: data.totp.secret,
      });
    } catch (err) {
      setError(message(err));
    } finally {
      setBusy(false);
    }
  }
  async function verify(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!enrollment) return;
    setBusy(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    try {
      check(
        await db().auth.mfa.challengeAndVerify({
          factorId: enrollment.id,
          code: String(fd.get("code")),
        }),
      );
      setEnrollment(null);
      setNotice(
        "MFA is enabled. Your database access now requires a verified second-factor session.",
      );
      await load();
    } catch (err) {
      setError(message(err));
    } finally {
      setBusy(false);
    }
  }
  async function unenroll(id: string) {
    setBusy(true);
    setError("");
    try {
      check(await db().auth.mfa.unenroll({ factorId: id }));
      await db().auth.refreshSession();
      setNotice("Authenticator removed.");
      await load();
    } catch (err) {
      setError(message(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="panel content-panel narrow">
      <span className="icon-tile">
        <FiShield />
      </span>
      <h2>Multi-factor authentication</h2>
      <p className="muted">
        Protect your workspace with a time-based authenticator code.
      </p>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {notice && (
        <p className="notice" role="status">
          {notice}
        </p>
      )}
      {factors
        .filter((f) => f.status === "verified")
        .map((f) => (
          <div key={f.id} className="mfa-factor">
            <strong>{f.friendly_name || "Authenticator"} · Enabled</strong>
            <details>
              <summary>Remove authenticator</summary>
              <p>
                This disables this second factor. Keep another verified method
                before removing your only factor.
              </p>
              <button
                className="danger-button"
                disabled={busy}
                onClick={() => void unenroll(f.id)}
              >
                Confirm removal
              </button>
            </details>
          </div>
        ))}
      {enrollment ? (
        <form onSubmit={verify}>
          <p>
            Scan this QR code in your authenticator, then enter its six-digit
            code.
          </p>
          <img
            className="qr"
            src={enrollment.qr}
            alt="Authenticator enrollment QR code"
          />
          <details>
            <summary>Manual setup key</summary>
            <code className="secret-key">{enrollment.secret}</code>
          </details>
          <label>
            Authentication code
            <input
              name="code"
              required
              pattern="[0-9]{6}"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
            />
          </label>
          <button className="primary" disabled={busy}>
            Verify & enable MFA
          </button>
        </form>
      ) : (
        !factors.some((f) => f.status === "verified") && (
          <button
            className="secondary"
            disabled={busy}
            onClick={() => void enroll()}
          >
            {busy ? "Preparing…" : "Set up authenticator"}
          </button>
        )
      )}
      <p className="footnote">
        If you lose your authenticator, an administrator must verify your
        identity and reset the factor through Supabase. No recovery bypass is
        available here.
      </p>
    </section>
  );
}
