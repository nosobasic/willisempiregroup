import { useState } from "react";
import { createRoot } from "react-dom/client";
import { TaskBoard, ActionQueue } from "../admin/src/TaskBoard";
import { RecordForm, type Entity } from "../admin/src/forms";
import {
  emptyWorkspace,
  type Row,
  type Task,
  type Workspace,
} from "../admin/src/domain";
import "../admin/src/styles.css";
const stamp = {
  organization_id: "fixture-org",
  created_by: "fixture-owner",
  owner_id: "fixture-owner",
  created_at: "2026-10-15T10:00:00Z",
  updated_at: "2026-10-15T10:00:00Z",
  version: 1,
};
const tasks = [
  {
    title: "Review the launch checklist",
    project: "Sample product",
    function_bucket: "Product / engineering",
    status: "In progress",
    priority: "High",
    next_action: "Check the accessibility report and record the result.",
    source_url: "https://example.com/checklist",
    source_system: "fixture",
    source_id: "launch-1",
    last_verified_at: "2026-10-15T09:00:00Z",
    due_at: "2026-10-19T16:00:00Z",
  },
  {
    title: "Approve the event outline",
    project: "Sample campaign",
    function_bucket: "Growth",
    status: "Needs approval",
    priority: "Medium",
    next_action: "Review the proposed audience and event scope.",
    approval_status: "Pending",
    approval_scope: "Outline only; no invitations or purchases.",
    source_url: "https://example.com/outline",
    uncertainty: "Audience size is still an estimate.",
  },
  {
    title: "Await venue availability",
    project: "Sample event",
    function_bucket: "Business admin",
    status: "Waiting on response",
    priority: "High",
    next_action: "Check for a response before choosing a date.",
    waiting_on: "Example venue coordinator",
    follow_up_at: "2026-10-17T14:00:00Z",
    last_verified_at: "2026-10-01T12:00:00Z",
    source_url: "https://example.com/request",
  },
  {
    title: "Prepare a study session",
    project: "Sample course",
    function_bucket: "Education",
    status: "Blocked",
    priority: "Low",
    next_action: "Confirm the prerequisite exercise.",
    blocked_reason: "Prerequisite exercise is incomplete.",
    dependencies: "Finish the sample networking exercise.",
  },
  {
    title: "Verify the sample export",
    project: "Sample product",
    function_bucket: "Product / engineering",
    status: "Done",
    priority: "Medium",
    completion_summary:
      "Opened the generated fixture file and checked its expected columns.",
    completion_url: "https://example.com/result",
    completion_verified_at: "2026-10-15T10:00:00Z",
    last_verified_at: "2026-10-15T10:00:00Z",
  },
].map((t, i) => ({
  ...stamp,
  id: `fixture-${i}`,
  due_date: null,
  business_id: null,
  opportunity_id: null,
  approval_status: "Not needed",
  ...t,
})) as Task[];
function Preview() {
  const [data, setData] = useState<Workspace>({
    ...emptyWorkspace,
    tasks,
    task_events: [],
  });
  const [editor, setEditor] = useState<{
    entity: Entity;
    record?: Partial<Row>;
  } | null>(null);
  const edit = (entity: Entity, record?: Partial<Row>) =>
    setEditor({ entity, record });
  return (
    <div className="preview-shell">
      <div className="preview-banner" role="status">
        LOCAL SYNTHETIC PREVIEW · No account, no network data, no persistence.
        Changes reset on reload.
      </div>
      <header className="preview-brand">
        WEG OS <small>Founder workspace / Design preview</small>
      </header>
      <main>
        <ActionQueue data={data} edit={edit} />
        <TaskBoard data={data} edit={edit} offline />
        {editor && (
          <RecordForm
            entity={editor.entity}
            record={editor.record}
            data={data}
            onClose={() => setEditor(null)}
            onSave={async (values) => {
              const id = editor.record?.id ?? `fixture-${Date.now()}`;
              const old = data.tasks.find((t) => t.id === id);
              const now = new Date().toISOString();
              const task = {
                ...stamp,
                ...old,
                ...values,
                id,
                updated_at: now,
                version: Number(old?.version ?? 0) + 1,
                completion_verified_at: values.status === "Done" ? now : null,
              } as Task;
              setData((d) => ({
                ...d,
                tasks: [task, ...d.tasks.filter((t) => t.id !== id)],
                task_events: [
                  {
                    ...stamp,
                    id: `event-${Date.now()}`,
                    task_id: id,
                    action: old ? "Updated (synthetic)" : "Created (synthetic)",
                    from_status: old?.status,
                    to_status: task.status,
                    created_at: now,
                  },
                  ...(d.task_events ?? []),
                ],
              }));
            }}
          />
        )}
      </main>
    </div>
  );
}
createRoot(document.getElementById("root")!).render(<Preview />);
