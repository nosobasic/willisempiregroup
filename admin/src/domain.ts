export const categories = [
  "Grant",
  "Non-dilutive funding",
  "Accelerator",
  "Mentorship",
  "Founder program",
  "Procurement",
  "Supplier program",
  "Certification",
  "Pitch competition",
  "Cloud/startup credits",
  "Strategic partnership",
  "Financing",
] as const;
export const statuses = [
  "Discovered",
  "Researching",
  "Eligible",
  "Not Eligible",
  "Preparing",
  "Ready",
  "Applied",
  "Follow Up",
  "Interview",
  "Awarded",
  "Rejected",
  "Expired",
] as const;
export const priorities = ["Low", "Medium", "High", "Urgent"] as const;
export const expertise = [
  "B2B SaaS",
  "Cloud",
  "DevOps",
  "AWS",
  "AI",
  "Automation",
  "Enterprise Sales",
  "Government Contracting",
  "Procurement",
  "MWBE",
  "Fundraising",
  "Non-dilutive Funding",
  "Marketing",
  "Product",
  "Operations",
];
export const profileFields = [
  "Founder biography",
  "Company description",
  "Mission",
  "Problem",
  "Solution",
  "Target market",
  "Business model",
  "Technology capabilities",
  "Competitive advantage",
  "Current ventures",
  "Traction",
  "Revenue",
  "Audience",
  "Professional certifications",
  "Founder experience",
  "Funding needs",
  "Use of funds",
  "Milestones",
  "Long-term vision",
];
export type Role = "owner" | "admin" | "operator" | "viewer";
export type Row = {
  id: string;
  organization_id: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  [key: string]: unknown;
};
export type Business = Row & {
  name: string;
  description: string;
  website: string | null;
  status: string;
  industry: string;
};
export type Opportunity = Row & {
  name: string;
  organization: string;
  category: string;
  status: string;
  priority: string;
  deadline: string | null;
  rolling_deadline: boolean;
  fit_score: number | null;
  fit_reason: string | null;
  business_id: string | null;
  next_action: string | null;
  next_action_date: string | null;
};
export type Task = Row & {
  title: string;
  status: string;
  priority: string;
  due_date: string | null;
  business_id: string | null;
  opportunity_id: string | null;
};
export type Mentor = Row & {
  name: string;
  organization: string;
  relationship_status: string;
  next_follow_up: string | null;
  expertise: string;
};
export type Workspace = {
  task_events?: Row[];
  opportunities: Opportunity[];
  tasks: Task[];
  mentors: Mentor[];
  businesses: Business[];
  company_profiles: Row[];
};
export const emptyWorkspace: Workspace = {
  opportunities: [],
  tasks: [],
  mentors: [],
  businesses: [],
  company_profiles: [],
};
export const closedStatuses = [
  "Not Eligible",
  "Awarded",
  "Rejected",
  "Expired",
];
export function isActive(o: Opportunity) {
  return !closedStatuses.includes(o.status);
}
export function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export function dateLabel(value: unknown) {
  if (!value || typeof value !== "string") return "No date set";
  return new Date(value.slice(0, 10) + "T12:00:00").toLocaleDateString(
    undefined,
    { month: "short", day: "numeric", year: "numeric" },
  );
}
export function deadlineLabel(o: Opportunity) {
  return o.rolling_deadline ? "Rolling deadline" : dateLabel(o.deadline);
}
export function safeURL(value: unknown): string | undefined {
  if (typeof value !== "string") return;
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) ? url.href : undefined;
  } catch {
    return;
  }
}
export type Filters = {
  query: string;
  status: string;
  category: string;
  priority: string;
  business: string;
  deadline: string;
  fit: string;
};
export function filterOpportunities(
  rows: Opportunity[],
  f: Filters,
  today = todayISO(),
) {
  const end = new Date(today + "T12:00:00");
  end.setDate(end.getDate() + 30);
  const until = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, "0")}-${String(end.getDate()).padStart(2, "0")}`;
  return rows.filter((o) => {
    const search = [o.name, o.organization, o.description, o.next_action]
      .join(" ")
      .toLowerCase();
    return (
      (!f.query || search.includes(f.query.toLowerCase())) &&
      (!f.status || o.status === f.status) &&
      (!f.category || o.category === f.category) &&
      (!f.priority || o.priority === f.priority) &&
      (!f.business || o.business_id === f.business) &&
      (!f.fit ||
        (f.fit === "unknown"
          ? o.fit_score === null
          : o.fit_score !== null && o.fit_score >= Number(f.fit))) &&
      (!f.deadline ||
        (f.deadline === "rolling"
          ? o.rolling_deadline
          : f.deadline === "overdue"
            ? !!o.deadline && !o.rolling_deadline && o.deadline < today
            : !!o.deadline &&
              !o.rolling_deadline &&
              o.deadline >= today &&
              o.deadline <= until))
    );
  });
}
export const scoreCriteria = [
  "Eligibility",
  "WEG relevance",
  "Revenue Ripple relevance",
  "Technology alignment",
  "AI alignment",
  "Cloud alignment",
  "New York eligibility",
  "Long Island eligibility",
  "Minority-business eligibility",
  "Funding value",
  "Mentorship value",
  "Procurement value",
  "Networking value",
  "Deadline urgency",
  "Application effort",
];
export type Evidence = {
  criterion: string;
  rating: number | null;
  evidence: string;
};
export function calculateFit(items: Evidence[]) {
  const known = items.filter(
    (i) =>
      i.rating !== null &&
      i.evidence.trim() &&
      Number.isFinite(i.rating) &&
      i.rating >= 0 &&
      i.rating <= 5,
  );
  return {
    score: known.length
      ? Math.round(
          (known.reduce((s, i) => s + Number(i.rating), 0) /
            (known.length * 5)) *
            100,
        )
      : null,
    reason: known.length
      ? `${known.length}/${scoreCriteria.length} criteria have evidence. ${known.map((i) => `${i.criterion}: ${i.rating}/5 — ${i.evidence}`).join("; ")}. Unassessed criteria remain unknown. This is a fit assessment, not a probability of winning.`
      : "Not scored. Eligibility and fit remain unknown until evidence is recorded.",
  };
}
