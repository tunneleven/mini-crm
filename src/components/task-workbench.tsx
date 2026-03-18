"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

import type { WorkspaceOwner, WorkspaceTaskItem } from "@/lib/crm/activity-service";

type TaskWorkbenchProps = {
  tasks: WorkspaceTaskItem[];
  owners: WorkspaceOwner[];
  summary: {
    overdueCount: number;
    doneCount: number;
    openCount: number;
  };
  currentUserId: string;
};

function formatDate(value: string | null) {
  if (!value) {
    return "No due date";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function groupTasks(tasks: WorkspaceTaskItem[]) {
  const buckets = {
    overdue: [] as WorkspaceTaskItem[],
    open: [] as WorkspaceTaskItem[],
    done: [] as WorkspaceTaskItem[],
  };

  for (const task of tasks) {
    if (task.status === "DONE") {
      buckets.done.push(task);
    } else if (task.isOverdue) {
      buckets.overdue.push(task);
    } else {
      buckets.open.push(task);
    }
  }

  return buckets;
}

export function TaskWorkbench({ tasks, owners, summary, currentUserId }: TaskWorkbenchProps) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [assigneeId, setAssigneeId] = useState(currentUserId);
  const [error, setError] = useState<string | null>(null);
  const [pendingTaskId, setPendingTaskId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const buckets = useMemo(() => groupTasks(tasks), [tasks]);

  async function postJson(url: string, body: unknown, method = "POST") {
    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error?.message ?? "Request failed.");
    }

    return payload;
  }

  function submitTask() {
    setError(null);

    startTransition(async () => {
      try {
        await postJson("/api/tasks", {
          title,
          dueAt: dueAt ? new Date(`${dueAt}T00:00:00.000Z`).toISOString() : null,
          assigneeId: assigneeId || null,
        });
        setTitle("");
        setDueAt("");
        router.refresh();
      } catch (submitError) {
        setError(submitError instanceof Error ? submitError.message : "Could not create task.");
      }
    });
  }

  function toggleTask(task: WorkspaceTaskItem) {
    setError(null);
    setPendingTaskId(task.id);

    startTransition(async () => {
      try {
        await postJson(`/api/tasks/${task.id}`, {
          status: task.status === "DONE" ? "TODO" : "DONE",
        }, "PATCH");
        router.refresh();
      } catch (submitError) {
        setError(submitError instanceof Error ? submitError.message : "Could not update task.");
      } finally {
        setPendingTaskId(null);
      }
    });
  }

  return (
    <div className="page-grid">
      <section className="hero-grid">
        <article className="hero-card">
          <span className="eyebrow">Task queue</span>
          <h2>Follow-up work stays visible, sorted, and attributable.</h2>
          <p>
            This workspace view surfaces overdue items first, then the active follow-up queue and recently completed work.
          </p>
          <div className="meta-row">
            <span className="meta-chip">{summary.openCount} open tasks</span>
            <span className="meta-chip">{summary.overdueCount} overdue</span>
            <span className="meta-chip">{summary.doneCount} completed</span>
          </div>
        </article>

        <article className="detail-card">
          <div className="card-head">
            <div>
              <h2>Create task</h2>
              <p>Add a new follow-up item to the workspace queue.</p>
            </div>
            <span className="eyebrow">Composer</span>
          </div>

          {error ? <p className="error-banner">{error}</p> : null}

          <div className="composer-stack">
            <label className="field-stack">
              <span className="subtle">Title</span>
              <input className="input-shell" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Send recap email" />
            </label>
            <div className="field-grid">
              <label className="field-stack">
                <span className="subtle">Due date</span>
                <input className="input-shell" type="date" value={dueAt} onChange={(event) => setDueAt(event.target.value)} />
              </label>
              <label className="field-stack">
                <span className="subtle">Assignee</span>
                <select className="input-shell" value={assigneeId} onChange={(event) => setAssigneeId(event.target.value)}>
                  {owners.map((owner) => (
                    <option key={owner.id} value={owner.id}>
                      {owner.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="detail-action-row">
              <button type="button" className="cta-primary" disabled={isPending || !title.trim()} onClick={submitTask}>
                {isPending ? "Saving..." : "Add task"}
              </button>
            </div>
          </div>
        </article>
      </section>

      <section className="details-grid">
        <article className="timeline-card">
          <div className="card-head">
            <div>
              <h2>Overdue and open</h2>
              <p>Workspace tasks sorted by urgency.</p>
            </div>
            <span className="eyebrow">Active</span>
          </div>
          <div className="record-list">
            {[...buckets.overdue, ...buckets.open].map((task) => (
              <div key={task.id} className="record-row">
                <div className="record-row-head">
                  <span className="record-title">{task.title}</span>
                  <span className={`status-pill status-${task.isOverdue ? "pending" : "open"}`}>{task.isOverdue ? "Overdue" : task.status}</span>
                </div>
                <p className="subtle">
                  {task.record.href ? (
                    <Link href={task.record.href}>{task.record.title}</Link>
                  ) : (
                    task.record.title
                  )}{" "}
                  · {task.assignee?.name ?? "Unassigned"} · {formatDate(task.dueAt)}
                </p>
                <div className="detail-action-row">
                  <button
                    type="button"
                    className="ghost-button"
                    disabled={pendingTaskId === task.id}
                    onClick={() => toggleTask(task)}
                  >
                    {task.status === "DONE" ? "Reopen" : "Mark done"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="timeline-card">
          <div className="card-head">
            <div>
              <h2>Completed work</h2>
              <p>Recently closed tasks stay visible for auditability.</p>
            </div>
            <span className="eyebrow">History</span>
          </div>
          <div className="record-list">
            {buckets.done.length === 0 ? (
              <div className="empty-stage">
                <p>No completed tasks yet.</p>
              </div>
            ) : (
              buckets.done.map((task) => (
                <div key={task.id} className="record-row">
                  <div className="record-row-head">
                    <span className="record-title">{task.title}</span>
                    <span className="status-pill status-paused">Done</span>
                  </div>
                  <p className="subtle">
                    {task.record.href ? <Link href={task.record.href}>{task.record.title}</Link> : task.record.title} · {formatDate(task.completedAt)}
                  </p>
                  <div className="detail-action-row">
                    <button
                      type="button"
                      className="ghost-button"
                      disabled={pendingTaskId === task.id}
                      onClick={() => toggleTask(task)}
                    >
                      Reopen
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </article>
      </section>
    </div>
  );
}
