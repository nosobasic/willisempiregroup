import { useState, type FormEvent, type ReactNode } from "react";
import { FiArrowUpRight, FiLock, FiShield } from "react-icons/fi";
import { check, configured, db, message } from "./client";

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="auth-layout">
      <aside className="auth-story">
        <div className="brand">
          <span className="brand-mark">
            W<span>▰</span>
          </span>
          <span>
            WILLIS EMPIRE GROUP<small>THE FOUNDER WORKSPACE</small>
          </span>
        </div>
        <div>
          <span className="eyebrow">CLARITY. THEN ACTION.</span>
          <h1>
            Build the empire.
            <br />
            <em>
              One decision
              <br />
              at a time.
            </em>
          </h1>
          <p>
            Your opportunities, relationships, and next moves.
            <br />
            Together in one focused workspace.
          </p>
        </div>
        <footer>
          <span>WEG OS / VERSION 1.0</span>
          <FiArrowUpRight size={24} />
        </footer>
      </aside>
      <main className="auth-main">
        <div className="auth-box">{children}</div>
        <div className="auth-foot">
          <FiShield /> Private workspace · Authorized members only
        </div>
      </main>
    </div>
  );
}
export function Login() {
  const [reset, setReset] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    const f = new FormData(e.currentTarget);
    try {
      if (reset) {
        check(
          await db().auth.resetPasswordForEmail(String(f.get("email")), {
            redirectTo: `${location.origin}/admin/reset-password`,
          }),
        );
        setNotice(
          "If this address has an account, a password reset link is on its way. Open it in this browser.",
        );
      } else
        check(
          await db().auth.signInWithPassword({
            email: String(f.get("email")),
            password: String(f.get("password")),
          }),
        );
    } catch (err) {
      setError(message(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <AuthLayout>
      <span className="icon-tile">
        <FiLock />
      </span>
      <span className="eyebrow">WELCOME TO WEG OS</span>
      <h2>
        {configured
          ? reset
            ? "Reset your password"
            : "Your next move starts here."
          : "Your workspace is ready to connect."}
      </h2>
      <p className="muted">
        {configured
          ? reset
            ? "We’ll send a secure link to your account email."
            : "Sign in to the Willis Empire Group founder workspace."
          : "Connect Supabase to enable secure sign-in and your private operating workspace."}
      </p>
      {!configured ? (
        <div className="setup-note">
          <strong>One-time setup required</strong>
          <ol>
            <li>Create a Supabase project and disable public signups.</li>
            <li>Apply the migration and provision your owner account.</li>
            <li>Add the project URL and public key to the environment.</li>
          </ol>
          <p>
            Follow <code>docs/WEG-OS.md</code> in this repository. No private
            records are stored in this browser.
          </p>
        </div>
      ) : (
        <form onSubmit={submit}>
          <label>
            Email address
            <input
              name="email"
              type="email"
              autoComplete="username"
              required
              placeholder="you@company.com"
            />
          </label>
          {!reset && (
            <label>
              Password
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                required
                minLength={1}
                placeholder="Enter your password"
              />
            </label>
          )}
          {error && (
            <p role="alert" className="error">
              {error}
            </p>
          )}
          {notice && (
            <p role="status" className="notice">
              {notice}
            </p>
          )}
          <button className="primary wide" disabled={busy}>
            {busy ? "Please wait…" : reset ? "Send reset link" : "Sign in"}
            <FiArrowUpRight />
          </button>
          <button
            className="text-button wide"
            type="button"
            onClick={() => {
              setReset(!reset);
              setNotice("");
              setError("");
            }}
          >
            {reset ? "Back to sign in" : "Forgot password?"}
          </button>
        </form>
      )}
      <div className="closed-note">
        An invitation-only workspace. Contact your administrator for access.
      </div>
    </AuthLayout>
  );
}
export function PasswordReset({ onDone }: { onDone: () => void }) {
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setError("");
    if (f.get("password") !== f.get("confirm")) {
      setError("Passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      check(
        await db().auth.updateUser({ password: String(f.get("password")) }),
      );
      check(await db().auth.signOut({ scope: "local" }));
      onDone();
    } catch (err) {
      setError(message(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <AuthLayout>
      <h2>Choose a new password</h2>
      <p className="muted">Use at least 12 characters.</p>
      <form onSubmit={submit}>
        <label>
          New password
          <input
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={12}
            required
          />
        </label>
        <label>
          Confirm password
          <input
            name="confirm"
            type="password"
            autoComplete="new-password"
            minLength={12}
            required
          />
        </label>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <button className="primary" disabled={busy}>
          {busy ? "Saving…" : "Save password & sign out"}
        </button>
      </form>
    </AuthLayout>
  );
}
export function MfaChallenge({
  factorId,
  onDone,
  onCancel,
}: {
  factorId: string;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const f = new FormData(e.currentTarget);
    try {
      check(
        await db().auth.mfa.challengeAndVerify({
          factorId,
          code: String(f.get("code")),
        }),
      );
      onDone();
    } catch (err) {
      setError(message(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <AuthLayout>
      <span className="icon-tile">
        <FiShield />
      </span>
      <h2>Verify it’s you.</h2>
      <p className="muted">
        Enter the six-digit code from your authenticator app.
      </p>
      <form onSubmit={submit}>
        <label>
          Authentication code
          <input
            name="code"
            autoComplete="one-time-code"
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            required
            autoFocus
          />
        </label>
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        <button className="primary wide" disabled={busy}>
          {busy ? "Verifying…" : "Verify & continue"}
        </button>
        <button type="button" className="text-button wide" onClick={onCancel}>
          Back to sign in
        </button>
      </form>
    </AuthLayout>
  );
}
