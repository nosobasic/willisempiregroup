import { test, expect, type Page } from "@playwright/test";
const org = "11111111-1111-4111-8111-111111111111",
  owner = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const user = {
  id: owner,
  aud: "authenticated",
  role: "authenticated",
  email: "founder@example.test",
  email_confirmed_at: "2026-01-01T00:00:00Z",
  app_metadata: { provider: "email" },
  user_metadata: {},
  created_at: "2026-01-01T00:00:00Z",
  factors: [] as Record<string, unknown>[],
};
function token(aal = "aal1", expired = false) {
  const encode = (x: unknown) =>
    Buffer.from(JSON.stringify(x)).toString("base64url");
  return `${encode({ alg: "HS256", typ: "JWT" })}.${encode({ sub: owner, aud: "authenticated", role: "authenticated", aal, amr: [{ method: "password", timestamp: 1 }], exp: expired ? 1 : Math.floor(Date.now() / 1000) + 3600 })}.${encode("test-signature")}`;
}
function session(aal = "aal1", expired = false) {
  return {
    access_token: token(aal, expired),
    refresh_token: "test-refresh",
    token_type: "bearer",
    expires_in: 3600,
    expires_at: expired ? 1 : Math.floor(Date.now() / 1000) + 3600,
    user,
  };
}
type MockOptions = {
  loggedIn?: boolean;
  invalid?: boolean;
  expired?: boolean;
  member?: boolean;
  mfa?: boolean;
  role?: string;
  empty?: boolean;
};
async function mock(page: Page, options: MockOptions = {}) {
  const mockUser = {
    ...user,
    factors: options.mfa
      ? [
          {
            id: "factor-1",
            factor_type: "totp",
            status: "verified",
            friendly_name: "Test factor",
          },
        ]
      : [],
  };
  const stamp = {
    organization_id: org,
    created_by: owner,
    created_at: "2026-09-23T12:00:00Z",
    updated_at: "2026-09-23T12:00:00Z",
    version: 1,
  };
  const tables: Record<string, Record<string, unknown>[]> = {
    organization_members:
      options.member === false
        ? []
        : [
            {
              organization_id: org,
              role: options.role ?? "owner",
              organizations: { id: org, name: "Willis Empire Group" },
            },
          ],
    businesses: [
      {
        ...stamp,
        id: "biz-1",
        name: "Willis Empire Group",
        description: "Parent company overseeing the WEG portfolio.",
        status: "Active",
        industry: "Holding company",
      },
      {
        ...stamp,
        id: "biz-2",
        name: "Revenue Ripple",
        description:
          "Marketing SaaS, AI automation, and business-growth infrastructure.",
        status: "Active",
        industry: "Marketing & technology",
      },
      {
        ...stamp,
        id: "biz-3",
        name: "binGone",
        description: "Technology platform focused on facilitating donations.",
        status: "Active",
        industry: "Donation technology",
      },
      {
        ...stamp,
        id: "biz-4",
        name: "binRich Entertainment",
        description: "Entertainment and music business.",
        status: "Active",
        industry: "Entertainment & music",
      },
    ],
    opportunities: [],
    tasks: [],
    mentors: [],
    company_profiles: [{ ...stamp, id: "profile-1", content: {} }],
    profiles: [{ id: owner, full_name: "Test founder" }],
    application_answers: [],
  };
  if (!options.empty) {
    tables.opportunities.push({
      ...stamp,
      id: "opp-1",
      name: "TEST FIXTURE — Cloud founder program",
      organization: "Test provider",
      category: "Cloud/startup credits",
      status: "Researching",
      priority: "High",
      description:
        "Development fixture only. Not a researched or real opportunity.",
      deadline: "2026-10-01",
      rolling_deadline: false,
      fit_score: null,
      fit_reason: null,
      business_id: "biz-2",
      next_action: "Verify program eligibility",
      next_action_date: "2026-09-25",
      date_discovered: "2026-09-23",
      score_source: "manual",
      score_evidence: [],
    });
  }
  if (options.loggedIn) {
    await page.addInitScript(
      ({ value }) =>
        localStorage.setItem("sb-weg-test-auth-token", JSON.stringify(value)),
      { value: { ...session("aal1", options.expired), user: mockUser } },
    );
  }
  let verified = false;
  await page.route("https://weg-test.supabase.co/**", async (route) => {
    const req = route.request(),
      url = new URL(req.url()),
      path = url.pathname;
    const respond = (body: unknown, status = 200) =>
      route.fulfill({
        status,
        contentType: "application/json",
        body: JSON.stringify(body),
      });
    if (path === "/auth/v1/token") {
      if (options.invalid || options.expired)
        return respond(
          {
            error_code: "refresh_token_not_found",
            msg: "Refresh Token Not Found",
          },
          400,
        );
      return respond({ ...session(), user: mockUser });
    }
    if (path === "/auth/v1/user") {
      if (options.invalid)
        return respond({ message: "Invalid JWT", error_code: "bad_jwt" }, 401);
      return respond({ ...mockUser, factors: mockUser.factors });
    }
    if (path === "/auth/v1/logout") return route.fulfill({ status: 204 });
    if (path === "/auth/v1/recover") return respond({});
    if (path.endsWith("/challenge"))
      return respond({
        id: "challenge-1",
        expires_at: Math.floor(Date.now() / 1000) + 300,
      });
    if (path.endsWith("/verify")) {
      verified = true;
      return respond({ ...session("aal2"), user: mockUser });
    }
    if (path.startsWith("/rest/v1/")) {
      const table = path.split("/").pop()!;
      if (options.mfa && !verified) return respond([]);
      let rows = tables[table] ?? [];
      const id = url.searchParams.get("id")?.replace("eq.", "");
      if (req.method() === "POST") {
        let body = req.postDataJSON();
        if (Array.isArray(body)) body = body[0];
        const row = {
          ...stamp,
          id: `${table}-${Date.now()}`,
          deadline: null,
          fit_score: null,
          fit_reason: null,
          rolling_deadline: false,
          ...body,
        };
        if (table === "company_profiles" && rows.length) {
          Object.assign(rows[0], body);
          return respond([rows[0]], 201);
        }
        rows.push(row);
        tables[table] = rows;
        return respond([row], 201);
      }
      if (req.method() === "PATCH") {
        rows = rows.filter((r) => !id || r.id === id);
        rows.forEach((r) =>
          Object.assign(r, req.postDataJSON(), {
            updated_at: new Date().toISOString(),
          }),
        );
        return respond(rows);
      }
      if (req.method() === "DELETE") {
        const removed = rows.filter((r) => r.id === id);
        tables[table] = rows.filter((r) => r.id !== id);
        return respond(removed);
      }
      if (id) rows = rows.filter((r) => r.id === id);
      const opportunity = url.searchParams
        .get("opportunity_id")
        ?.replace("eq.", "");
      if (opportunity)
        rows = rows.filter((r) => r.opportunity_id === opportunity);
      return respond(
        req.headers().accept?.includes("vnd.pgrst.object")
          ? (rows[0] ?? null)
          : rows,
      );
    }
    return respond({ message: "Unhandled test endpoint" }, 404);
  });
  return tables;
}
async function navigate(page: Page, name: string) {
  const button = page.getByRole("button", { name: "Open navigation" });
  if (await button.isVisible()) await button.click();
  await page
    .getByRole("navigation")
    .getByRole("link", { name: new RegExp(`^${name}(?: \\d+)?$`) })
    .click();
}
async function login(page: Page) {
  await page.getByLabel("Email address").fill("founder@example.test");
  await page.getByLabel("Password", { exact: true }).fill("test-password-123");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "A clear view. A focused next move." }),
  ).toBeVisible();
}
test("direct protected route shows login and never requests private data", async ({
  page,
}) => {
  await mock(page);
  const privateRequests: string[] = [];
  page.on("request", (r) => {
    if (r.url().includes("/rest/v1/")) privateRequests.push(r.url());
  });
  await page.goto("/admin/capital/opp-1");
  await expect(
    page.getByRole("button", { name: "Sign in", exact: true }),
  ).toBeVisible();
  expect(privateRequests).toEqual([]);
  await expect(page.getByText("TEST FIXTURE")).toHaveCount(0);
});
test("login, persistent session, logout, and return to a protected URL", async ({
  page,
}) => {
  await mock(page, { empty: true });
  await page.goto("/admin/dashboard");
  await login(page);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "A clear view. A focused next move." }),
  ).toBeVisible();
  if (await page.getByRole("button", { name: "Open navigation" }).isVisible())
    await page.getByRole("button", { name: "Open navigation" }).click();
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Sign in", exact: true }),
  ).toBeVisible();
  await page.goto("/admin/tasks");
  await expect(
    page.getByRole("button", { name: "Sign in", exact: true }),
  ).toBeVisible();
});
test("invalid and expired sessions fail closed", async ({ page }) => {
  await mock(page, { loggedIn: true, invalid: true, expired: true });
  await page.goto("/admin/dashboard");
  await expect(
    page.getByRole("button", { name: "Sign in", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "A clear view. A focused next move." }),
  ).toHaveCount(0);
});
test("authenticated account without membership gets no workspace", async ({
  page,
}) => {
  await mock(page, { loggedIn: true, member: false });
  await page.goto("/admin/dashboard");
  await expect(
    page.getByRole("heading", { name: "No workspace access yet." }),
  ).toBeVisible();
  await expect(page.getByRole("navigation")).toHaveCount(0);
});
test("MFA challenge blocks workspace until verification", async ({ page }) => {
  await mock(page, { loggedIn: true, mfa: true });
  await page.goto("/admin/dashboard");
  await expect(
    page.getByRole("heading", { name: "Verify it’s you." }),
  ).toBeVisible();
  await expect(page.getByRole("navigation")).toHaveCount(0);
  await page.getByLabel("Authentication code").fill("123456");
  await page.getByRole("button", { name: "Verify & continue" }).click();
  await expect(
    page.getByRole("heading", { name: "A clear view. A focused next move." }),
  ).toBeVisible();
});
test("password reset requests email without revealing account existence", async ({
  page,
}) => {
  await mock(page);
  await page.goto("/admin/");
  await page.getByRole("button", { name: "Forgot password?" }).click();
  await page.getByLabel("Email address").fill("founder@example.test");
  await page.getByRole("button", { name: "Send reset link" }).click();
  await expect(page.getByRole("status")).toContainText(
    "If this address has an account",
  );
});
test("opportunity to fit, application, linked task, and outcome workflow", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (e) => {
    if (e.type() === "error") errors.push(e.text());
  });
  await mock(page, { loggedIn: true, empty: true });
  await page.goto("/admin/dashboard");
  await navigate(page, "Capital & Mentorship");
  await page
    .getByRole("button", { name: "Add opportunity", exact: true })
    .click();
  await page
    .getByLabel("Opportunity name")
    .fill("TEST FIXTURE — Founder grant");
  await page.getByLabel("Offering organization").fill("Test foundation");
  await page
    .getByLabel("Next action", { exact: true })
    .fill("Prepare founder biography");
  await page.getByRole("button", { name: "Save record" }).click();
  await page
    .getByRole("link", { name: "TEST FIXTURE — Founder grant" })
    .click();
  await page
    .getByRole("button", { name: "Eligibility & fit", exact: true })
    .click();
  await page.getByRole("button", { name: "Review & update fit" }).click();
  await page.getByLabel("Fit score").fill("75");
  await page
    .getByLabel("Explanation", { exact: true })
    .fill(
      "Founder assessment based on official test criteria. Eligibility is still unknown.",
    );
  await page.getByRole("button", { name: "Save assessment" }).click();
  await expect(page.getByText("75 / 100", { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "Application preparation", exact: true })
    .click();
  await page.getByRole("button", { name: "Add question" }).click();
  await page.getByLabel("Application question").fill("What is your mission?");
  await page
    .getByLabel("Draft answer")
    .fill("Editable test draft — founder review required.");
  await page.getByRole("button", { name: "Save record" }).click();
  await page
    .getByRole("button", { name: "Application preparation", exact: true })
    .click();
  await expect(
    page.getByText("Editable test draft — founder review required."),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Tasks & outcome", exact: true })
    .click();
  await page.getByRole("button", { name: "Create linked task" }).click();
  await expect(page.getByLabel("Task title")).toHaveValue(
    "Prepare founder biography",
  );
  await page.getByRole("button", { name: "Save record" }).click();
  await navigate(page, "Tasks");
  await page.getByRole("button", { name: "Update task", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("combobox", { name: "Status", exact: true })
    .selectOption("Done");
  await page
    .getByRole("textbox", { name: /^Completion evidence Required/ })
    .fill("Verified synthetic workflow outcome.");
  await page
    .getByLabel("Completion evidence link", { exact: true })
    .fill("https://example.com/verified");
  await page.getByRole("button", { name: "Save record" }).click();
  await page
    .getByRole("combobox", { name: "Status", exact: true })
    .selectOption("Completed");
  await expect(
    page.getByRole("heading", { name: "Prepare founder biography" }),
  ).toBeVisible();
  await navigate(page, "Capital & Mentorship");
  await page
    .getByRole("link", { name: "TEST FIXTURE — Founder grant" })
    .click();
  await page.getByRole("button", { name: "Edit opportunity" }).click();
  await page
    .getByRole("combobox", { name: "Status", exact: true })
    .selectOption("Awarded");
  await page.getByRole("button", { name: "Save record" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByText("Awarded", { exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});
test("search/filter, mentor creation, portfolio and profile empty states", async ({
  page,
}) => {
  await mock(page, { loggedIn: true });
  await page.goto("/admin/capital");
  await page.getByLabel("Search opportunities").fill("unmatched");
  await expect(page.getByText("No matching opportunities")).toBeVisible();
  await page.getByRole("button", { name: "Clear filters" }).first().click();
  await page.getByLabel("All fit scores").selectOption("unknown");
  await expect(
    page.getByRole("link", { name: "TEST FIXTURE — Cloud founder program" }),
  ).toBeVisible();
  await page.getByRole("button", { name: /Mentorship & contacts/ }).click();
  await page.getByRole("button", { name: "Add contact", exact: true }).click();
  await page
    .getByLabel("Name *", { exact: true })
    .fill("TEST FIXTURE — Mentor");
  await page.getByLabel(/^Expertise/).fill("B2B SaaS, Cloud");
  await page.getByRole("button", { name: "Save record" }).click();
  await expect(
    page.getByRole("heading", { name: "TEST FIXTURE — Mentor" }),
  ).toBeVisible();
  await navigate(page, "Portfolio");
  await expect(
    page.getByRole("heading", { name: "Revenue Ripple", exact: true }),
  ).toBeVisible();
  await navigate(page, "Settings");
  await expect(
    page.getByText("REQUIRED FROM FOUNDER", { exact: true }).first(),
  ).toBeVisible();
});
test("viewer cannot enter owner workspace", async ({ page }) => {
  await mock(page, { loggedIn: true, role: "viewer", empty: true });
  await page.goto("/admin/dashboard");
  await expect(
    page.getByRole("heading", { name: "No workspace access yet." }),
  ).toBeVisible();
  await expect(page.getByRole("navigation")).toHaveCount(0);
});

test("invalid access token is rejected by server-side validation", async ({
  page,
}) => {
  await mock(page, { loggedIn: true, invalid: true });
  await page.goto("/admin/dashboard");
  await expect(
    page.getByRole("button", { name: "Sign in", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("navigation")).toHaveCount(0);
});

test("password recovery validates confirmation, saves, and signs out", async ({
  page,
}) => {
  await mock(page, { loggedIn: true });
  await page.goto("/admin/reset-password");
  await expect(
    page.getByRole("heading", { name: "Choose a new password" }),
  ).toBeVisible();
  await page
    .getByLabel("New password", { exact: true })
    .fill("test-new-password-123");
  await page.getByLabel("Confirm password").fill("test-mismatch-password");
  await page.getByRole("button", { name: "Save password & sign out" }).click();
  await expect(page.getByRole("alert")).toContainText("Passwords do not match");
  await page.getByLabel("Confirm password").fill("test-new-password-123");
  await page.getByRole("button", { name: "Save password & sign out" }).click();
  await expect(
    page.getByRole("button", { name: "Sign in", exact: true }),
  ).toBeVisible();
});
