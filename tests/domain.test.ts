import { test } from "node:test";
import assert from "node:assert/strict";
import {
  calculateFit,
  filterOpportunities,
  safeURL,
  type Opportunity,
  type Filters,
} from "../admin/src/domain";
const base: Filters = {
  query: "",
  status: "",
  category: "",
  priority: "",
  business: "",
  deadline: "",
  fit: "",
};
const rows = [
  {
    id: "one",
    name: "Local grant",
    organization: "Foundation",
    category: "Grant",
    status: "Researching",
    priority: "High",
    business_id: "biz",
    deadline: "2026-09-30",
    rolling_deadline: false,
    fit_score: 85,
  },
  {
    id: "two",
    name: "Rolling mentor",
    organization: "Program",
    category: "Mentorship",
    status: "Applied",
    priority: "Low",
    business_id: null,
    deadline: null,
    rolling_deadline: true,
    fit_score: null,
  },
  {
    id: "three",
    name: "Past grant",
    organization: "Agency",
    category: "Grant",
    status: "Expired",
    priority: "Medium",
    deadline: "2026-08-01",
    rolling_deadline: false,
    fit_score: 0,
  },
] as Opportunity[];
test("unknown or unevidenced criteria do not invent a score", () => {
  assert.equal(calculateFit([]).score, null);
  assert.equal(
    calculateFit([{ criterion: "Eligibility", rating: 5, evidence: "" }]).score,
    null,
  );
  assert.equal(
    calculateFit([
      { criterion: "Eligibility", rating: null, evidence: "Unknown" },
    ]).score,
    null,
  );
});
test("fit calculation is bounded, explained, and transparent about missing evidence", () => {
  const r = calculateFit([
    {
      criterion: "AI alignment",
      rating: 4,
      evidence: "Official program description",
    },
    { criterion: "Eligibility", rating: null, evidence: "" },
  ]);
  assert.equal(r.score, 80);
  assert.match(r.reason, /1\/15 criteria/);
  assert.match(r.reason, /not a probability/);
  assert.equal(
    calculateFit([{ criterion: "X", rating: 8, evidence: "Bad" }]).score,
    null,
  );
});
test("filters combine status, business, category, priority, score and search", () => {
  assert.deepEqual(
    filterOpportunities(rows, {
      ...base,
      query: "foundation",
      status: "Researching",
      category: "Grant",
      business: "biz",
      priority: "High",
      fit: "80",
    }).map((r) => r.id),
    ["one"],
  );
  assert.equal(
    filterOpportunities(rows, { ...base, fit: "unknown" })[0].id,
    "two",
  );
  assert.equal(filterOpportunities(rows, { ...base, fit: "60" }).length, 1);
});
test("deadlines distinguish rolling, upcoming and overdue by calendar day", () => {
  assert.equal(
    filterOpportunities(rows, { ...base, deadline: "30" }, "2026-09-23")[0].id,
    "one",
  );
  assert.equal(
    filterOpportunities(rows, { ...base, deadline: "overdue" }, "2026-09-23")[0]
      .id,
    "three",
  );
  assert.equal(
    filterOpportunities(rows, { ...base, deadline: "rolling" }, "2026-09-23")[0]
      .id,
    "two",
  );
});
test("external URLs cannot execute javascript or data payloads", () => {
  assert.equal(safeURL("javascript:alert(1)"), undefined);
  assert.equal(safeURL("data:text/html,hi"), undefined);
  assert.equal(safeURL("//evil.example"), undefined);
  assert.equal(safeURL("https://example.com"), "https://example.com/");
});
