# Owner task dashboard release

Target: https://willisempiregroup.com/admin (supersedes the historical admin subdomain in WEG-OS.md).

## Current implementation

The homepage prioritizes actionable next steps and an attention queue. Tasks retain project, function, priority, status, dependency, uncertainty, next action, waiting party, due/follow-up times, source identity/revision/link, last-checked time, approval scope/evidence, and completion evidence. Completed and cancelled work are excluded from the default active view; completed records remain available through the status count/filter. Per-task activity is collapsed by default. There is no automatic chat sync and approval records do not authorize execution.

The new owner-only migration restricts operational access to owner memberships, and tasks/history further restrict access to the creating owner. Another owner in the same organization cannot read another owner's tasks. Updates use version predicates; a stale edit must refresh rather than overwrite. Source identity is unique per organization/owner/system/id. The database maintains completion timestamps, checks evidence/status prerequisites, and records append-only change history. Existing historical base-migration tests exercise earlier operator/viewer rules separately; the new migration tests enforce owner-only behavior.

## Build and routing

`npm run build:all` builds the unchanged public site into dist, then the admin SPA into dist/admin. Vite's admin base is /admin/. vercel.json rewrites only known admin routes to its index and adds no-store, noindex, nosniff and frame-denial headers. Public source and asset URLs remain intact. Run the combined build in Vercel; do not deploy dist-preview. The synthetic preview is local only (`npm run dev:preview`). It contains no owner inventory and does not persist changes.

## Safe next step after owner project setup

1. Obtain the owner's confirmed new project URL/reference and intended owner login email, not the database password or service key. Confirm authorization to disable public signups and bootstrap that single owner. Never reuse Revenue Ripple/BinGOne project data.
2. Inspect the new empty project and Free plan. Apply the base migration then 202610160001_owner_tasks.sql only after confirming the target. Review bootstrap SQL for minimal owner/org creation; do not run demo/seed SQL or import the 60 review records. Do not use the new migration blindly on an existing populated database.
3. Owner completes account/password creation. Disable public signup with permission, configure site URL to https://willisempiregroup.com/admin and the exact recovery URL https://willisempiregroup.com/admin/reset-password. Bootstrap only the confirmed auth user ID as owner. Optional MFA enrollment requires owner participation.
4. Configure only VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY for the admin build. Never put database passwords, service-role keys or secret keys in browser code. The build rejects privileged VITE variables.
5. Test hosted auth and direct API access using disposable synthetic records: anonymous, authenticated nonmember, viewer, second owner in same org, owner, expired session, and enrolled-MFA aal1/aal2. Verify owner save/reload persists; stale versions conflict; other owners cannot read/update; completion evidence is required; history cannot be forged. Remove disposable test data through a reviewed cleanup path. Local PGlite tests do not replace this gate.
6. Only after these checks, publish /admin through the existing site deployment and verify root public page/assets, direct admin deep links, login/logout/recovery, mobile layout and unauthorized requests. Check Vercel project build settings do not override the combined build. Do not mark production complete before these checks.

## Secure assistant import/update design (not automatic sync)

The implemented path is authenticated owner UI editing. For future batch import, the assistant first rereads authorized source material, produces a minimal structured change proposal, and records source system/id, revision, checked time, uncertainty and evidence links. Exclude raw private chat transcripts, credentials and hidden reasoning. No inventory is committed to this repository.

A future owner-facing importer should validate an allowlisted schema, show insert/update/conflict counts and field diffs before saving, and execute through the owner's normal authenticated Supabase client/RLS. Match stable source identity; carry expected version for every update. Require a fresh read on conflicts, never a blind upsert. Limit batch size and use a transaction RPC with invoker privileges for atomic application; validate owner/org from auth.uid(), never trust supplied ownership. Preserve manual fields unless explicitly included in the reviewed diff. A repeated identical source revision must be a no-op. Audit provenance and changed-field names without copying source contents. Imported approval remains informational; imported completion still needs evidence and explicit verification.

An unattended assistant writer is NOT implemented. It would require a separately approved scoped server integration and identity/expiry/revocation controls; a service key in the browser is not an acceptable shortcut. Until that exists, authorized fresh-read updates can be entered through the signed-in owner UI, with published evidence and save/reload verification.

## Verification so far

- TypeScript, ESLint and combined production build pass.
- 24 domain/database tests pass, including eight owner-task tests. Migrations execute in PGlite (PostgreSQL compiled to WASM), with actual roles, RLS, constraints and triggers. Supabase auth.uid()/jwt() and MFA catalog are local fixtures; hosted Auth and PostgREST remain separate verification gates.
- Supported Mac-browser fixture checks: active view hides completed; completed count selects one completed record; blocked update fails without reason; supplying reason updates counts; 390px layout has no horizontal overflow.
- All 24 Playwright cases pass (12 desktop, 12 mobile) using the existing installed Chrome and synthetic HTTP mocks: protected deep links, login/session/logout, invalid/expired tokens, nonmembers/viewers, MFA challenge, password reset/recovery, opportunity-to-task workflow, evidence-based completion, search/profile/portfolio, and overflow checks. Two initial timing failures were fixed by waiting for authenticated navigation and save-dialog closure. Screenshots are in ignored test-results/owner-{dashboard,tasks}-{desktop,mobile}.png.
- Combined artifact/config checks pass for public root, nine admin paths, all referenced asset files, missing-asset exclusions and no preview bundle. Public JS/CSS are byte-identical to the existing performance-release build. This is not a hosted Vercel routing test.
- Source identity trims surrounding whitespace before uniqueness checks. Blank pairs become null; partial or duplicate identities fail. Optimistic conflict protection uses a version predicate in the UI; direct clients must supply the predicate too. The planned import RPC remains unimplemented.
- Live Supabase authentication, production persistence and deployed RLS remain pending owner setup.
