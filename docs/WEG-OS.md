> Current owner-task release: see [OWNER-TASKS.md](OWNER-TASKS.md). The owner-only migration supersedes the earlier operator/viewer access model described below. Historical test results are not live-production verification.

# WEG OS V1

A private founder workspace for Willis Empire Group. The public business-card site remains a separate application. No opportunities, metrics, application answers, or founder claims are seeded in production.

## Repository audit and implementation decisions

Before implementation, this repository contained React 19, Vite 6, JavaScript/JSX, Framer Motion, React Icons, and an intersection-observer hook. It had a public personal/company page, a roadmap component, branding assets, and CSS. `.replit` configured a static deployment of `dist`, built with `npm run build`, and a development server on port 5000. There were no database clients, server routes, authentication, environment templates, migrations, or tests. No project AGENTS.md was present.

Reused React, Vite, React Icons, npm, the public site, and the static hosting model. The admin app uses a distinct Vite root, HTML entry, styles, and output directory so it cannot replace or mix with the public build. The public site's animations are not imported into the admin bundle. Existing Emotion, Tailwind, and Autoprefixer were unused in source; retained to avoid unnecessary public-site dependency churn. Compatible lockfile security updates were applied. Two pre-existing public-page lint issues and the stable rotating-word dependency were cleaned up without redesigning that page.

The short implementation plan was: separate admin entry; Supabase Auth and tenant-scoped PostgreSQL migrations; opportunities, scoring, application preparation, contacts, tasks, and portfolio; dashboard and settings; then security, browser, mobile, build checks, and deployment documentation. TypeScript covers the new app. There is no custom auth, new web server, role-management UI, autonomous AI, file/document subsystem, or external business integration.

## Local development

Use Node 22.14+ and npm. From the repository root:

```sh
npm ci
cp .env.example .env.local
npm run dev:admin
```

Open `http://127.0.0.1:5001`. Without configured Supabase values, the app shows an explicit setup screen. It does not bypass login, create a demo session, or store operating records in localStorage. `npm run dev` continues to serve the public site on port 5000.

Required browser environment variables:

- `VITE_SUPABASE_URL`: project API URL, for example `https://PROJECT.supabase.co`.
- `VITE_SUPABASE_PUBLISHABLE_KEY`: Supabase public publishable key, or legacy anon key. This value is intentionally public. RLS is the security boundary.

Never put a secret key, service-role key, database password, SMTP credential, or third-party token in a `VITE_*` variable. `.env*` files are ignored, except the placeholder-only `.env.example`. Changes to Vite environment variables require a restart or rebuild. The admin Vite configuration refuses known privileged key names, Supabase secret-key prefixes, and legacy service-role JWTs before bundling.

## Provision Supabase (required before live use)

1. Create a Supabase project in the desired region. In Authentication settings, **disable new-user signups** and anonymous sign-in. Keep email/password authentication enabled. No signup UI or signup API call exists in this app, but hosted Auth must also be configured to reject signup.
2. Set Site URL to `https://willisempiregroup.com/admin`. Allow the exact redirect `https://willisempiregroup.com/admin/reset-password`. For development only, allow `http://127.0.0.1:5001/admin/reset-password`. Avoid production wildcard redirects. Enable TOTP enrollment and verification. Configure SMTP and a password policy of at least 12 characters; test actual delivery.
3. Apply `supabase/migrations/202609230001_weg_os.sql` using the Supabase SQL Editor, or link the Supabase CLI and use `supabase db push`. This is the versioned schema source. It assumes the standard Supabase `auth`, `anon`, and `authenticated` roles and schemas.
4. Create the founder with Authentication > Users > Add user. Use an administrator-generated initial password or an invitation, and assign a new password via the reset flow. Do not share privileged API keys with the app.
5. Copy the founder's Auth **user UUID** into the clearly marked placeholder in `supabase/bootstrap.sql`, review the script, and run it with SQL Editor privileges. The bootstrap validates that the user exists and is idempotent. It creates the WEG organization, owner membership, blank profile, and the four business descriptions supplied in the brief. It inserts no opportunities or invented performance data.
6. Add the two public environment values, start or rebuild the admin app, and sign in. Enroll an authenticator in Settings > Security & MFA. Verify that logging out and back in requires the code.
7. Complete the live acceptance checks below before putting sensitive records into the hosted workspace.

The local CLI config in `supabase/config.toml` provides closed signup and TOTP defaults for local Supabase. It does not configure a hosted project's Auth settings automatically.

## Security architecture

The host serves a static, non-sensitive application shell. Routes render workspace data only after `auth.getUser()` validates the user against Supabase Auth, checks authenticator assurance, and loads organization memberships. Deep links undergo the same checks. Supabase validates JWTs server-side on API requests, and PostgreSQL enforces authorization via RLS. No sensitive data is embedded in HTML or JS bundles, and editing frontend routes or calling REST directly does not bypass database policies. There is no SSR server to protect separately. If server routes are added later, validate identity and membership there as well.

Every operational record carries `organization_id`, `created_at`, `updated_at`, and `created_by`. RLS grants access only through an explicit membership. Organizations can have a parent, but parenthood **does not** confer access to a child organization's data. A portfolio business is a lightweight record within an organization, not an automatic new tenancy. Future independent business workspaces require their own organization and explicit memberships. Composite foreign keys prevent opportunities, tasks, and application answers from linking records across tenants.

- Owner/admin: read, create, update, delete operational records.
- Operator: read, create, update; no deletion.
- Viewer: read only.
- Membership/role and organization changes: administrative SQL or a future authorized server endpoint only. No client grants for membership writes, including for owners, so users cannot promote themselves.
- Personal profiles: user can read and update only their own profile.

A `private` security-definer membership helper uses an empty search path and restricted execute grants. It avoids recursive membership RLS while checking current authenticated user IDs. An enrolled verified MFA factor requires an `aal2` JWT at the database, including direct REST requests. TOTP is the supported second factor for this V1. Enrollment, challenges, password recovery, token refresh, and session storage are provided by Supabase, not custom authentication code.

Audit triggers preserve creator and creation timestamp and reject changing tenant IDs. Database-managed task completion timestamps are set/cleared with status changes. The schema supports adding audit-history triggers later. Reopening a completed task clears its completion time; completing again records the new time.

Logout uses Supabase local-session sign-out and removes the local session. As with normal Supabase JWT sessions, a copied access token may remain valid until JWT expiry; choose an appropriate token lifetime. Organization access can be revoked immediately by removing membership. The UI revalidates when returning to the tab and on auth/token events. Never rely on hiding UI controls as authorization.

## Founder workflow

Dashboard uses stored records for active/high-priority opportunities, applications from Preparing through Interview, active mentorships, open tasks, deadlines within 30 days plus overdue items, strategic actions, mentor follow-ups, and portfolio counts. No financial analytics are invented.

Capital & Mentorship offers full-text-style client search across names, organizations, descriptions, and next actions, plus combined status/category/priority/business/deadline/fit filters. An opportunity has all fields requested in the brief. Funding inputs are labeled USD; currency conversion is not included. Rolling deadlines deliberately clear fixed deadlines.

Opportunity detail contains overview and sources, eligibility and fit, editable application questions/answers beside reusable founder/company data, and linked tasks/outcomes. Blank reusable facts display **REQUIRED FROM FOUNDER**. Application answers are editable drafts only; nothing is sent or submitted. Close an opportunity through its status to retain history. Deletion is available to owners/admins with an explicit destructive confirmation; unlink tasks first.

Fit scoring uses 15 equally weighted 0–5 criteria with evidence. Unknown criteria are excluded, never scored as zero. The explanation identifies how many criteria were assessed and includes their evidence. For application effort, higher means more manageable effort. A sparse score must be reviewed in context; it is never a probability of winning. The founder can record/override a manual 0–100 score with a required explanation. `score_source` also allows a future AI suggestion, but no AI generation is implemented. Eligibility remains explicit founder-entered evidence and status.

Contacts remain a small mentorship address book, with expertise and relationship follow-ups. Tasks can link to a business and/or opportunity, with priority, status, dates, and database completion tracking. Settings holds reusable application context, the personal account name, password reset, MFA, and portfolio editing.

V1 loads a founder-sized workspace in memory. No heavy analytics or integration framework exists. Add server pagination and indexed search if actual usage outgrows this model; do not silently depend on Supabase's default 1,000-row response limit. The data loader explicitly pages through records.

## Deployment: public site plus /admin

Use the existing Vercel site, `npm run build:all`, output `dist`. The public build stays at the root; the admin build writes `dist/admin` and uses `/admin/` asset paths. `vercel.json` defines known admin SPA routes. Do not deploy the synthetic preview. See OWNER-TASKS.md for pending hosted verification and owner setup gates.

Recommended additional production headers after the project hostname is known:

```text
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
X-Frame-Options: DENY
Permissions-Policy: camera=(), microphone=(), geolocation=()
Cache-Control: no-store   (for index.html; hashed assets may be immutable)
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self' https://PROJECT.supabase.co wss://PROJECT.supabase.co; frame-ancestors 'none'; base-uri 'self'; form-action 'self'
```

Replace PROJECT with the actual project hostname. These are production headers; Vite's dev server needs its own websocket/script handling. The admin uses Google Fonts with system font fallbacks; no operational data is sent to the font service. A host-specific header file is intentionally not presented as applied because deployment has not occurred.

## Verification

```sh
npm run lint
npm run typecheck
npm test
npm run test:browser
npm run build
npm run build:admin
npm audit
```

Database tests apply the actual migration and bootstrap to PGlite (PostgreSQL compiled to WASM), create Supabase-like auth functions/roles, and execute queries as authenticated/anon users. They test RLS, ownership, tenancy, viewer/operator restrictions, membership self-promotion denial, MFA assurance, composite foreign keys, audit integrity, task completion, and constraints. They do not substitute for verifying hosted Supabase grants and settings.

Playwright uses the installed Chrome browser and a separate dev server on port 5002. Fixtures and intercepted Auth/REST responses are test-only; there is no production demo login or fixture switch. Tests cover route gating, login, session persistence, logout, rejected sessions, missing memberships, MFA challenge, reset email requests, opportunity/app/task workflow, search, mentors, portfolio, profiles, and mobile overflow. Browser screenshots are in ignored `test-results`. On a machine without Chrome, install it or adapt the channel to an installed Playwright Chromium browser.

### Live acceptance checks still required

Because no Supabase project was available during implementation, these must be performed after provisioning:

- Confirm public signup is rejected by Auth directly, not just absent in the UI.
- Sign in with the founder, reload and directly open protected paths; confirm the same private workspace.
- Sign out, use Back, reload, and directly open a private URL; confirm no data is visible.
- Request reset email, follow the exact redirect in the same browser (PKCE), submit a new password, and sign in again. Test invalid/expired reset links.
- Enroll TOTP; sign out/in; test both an incorrect and a correct code, and administrative lost-factor recovery.
- Try Auth with an invalid/expired JWT and a removed user; confirm rejection. Token refresh should recover an expired access token when its refresh token is still valid.
- Use a second Auth user with no membership, then viewer access; direct REST requests must not bypass policy. Confirm another organization's data remains inaccessible.
- Check hosted mobile layouts, browser console, request failures, and Auth/Postgres logs. Confirm HTTPS, headers, and deep-link fallback on the admin domain.
- Confirm the public root domain still serves the original public site.

No hosted deployment, domain configuration, email delivery, or live Auth validation is claimed until these checks pass.

## Implementation verification — September 25, 2026

- Lint and strict TypeScript: passed.
- Domain and PostgreSQL/RLS tests: 16 passed.
- Playwright desktop and mobile tests: 22 passed, including the full opportunity → fit → application draft → linked task → completion → awarded outcome flow.
- Browser JavaScript and console-error assertions in the full workflow: passed.
- Desktop and mobile dashboard screenshots: visually inspected; overflow assertions passed.
- Original public build and separate admin production build: passed.
- Dependency audit after compatible updates: no known vulnerabilities; final production-only audit also clean.
- Secret scan: no live credentials found in new source/configuration. A dummy secret-prefixed browser key was deliberately supplied to the build, and the build refused it as expected.
- Local production preview: verified it shows the setup screen without Supabase credentials. No development authentication bypass exists.

Hosted Auth, email delivery, hosted RLS, server logs, DNS, and deployment remain unverified pending Supabase/project provisioning. Browser tests mock Auth and REST responses; RLS tests execute the actual SQL in local PostgreSQL/PGlite. These results are not a claim of live production certification.

Official references: [Supabase Auth](https://supabase.com/docs/guides/auth), [MFA](https://supabase.com/docs/guides/auth/auth-mfa), [password recovery](https://supabase.com/docs/guides/auth/passwords), and [row-level security](https://supabase.com/docs/guides/database/postgres/row-level-security).
