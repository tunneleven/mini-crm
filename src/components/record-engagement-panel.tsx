"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { TimelineFeed } from "@/components/timeline-feed";
import type { TimelineItem, WorkspaceOwner } from "@/lib/crm/activity-service";

type RecordEngagementPanelProps = {
  targetType: "contact" | "company" | "deal";
  targetId: string;
  timeline: TimelineItem[];
  tasks: Array<{
    id: string;
    title: string;
    dueAt: string | null;
    completedAt: string | null;
    status: "TODO" | "IN_PROGRESS" | "DONE";
    isOverdue: boolean;
    assignee: {
      id: string;
      name: string;
      role: string;
    } | null;
    record: {
      type: "contact" | "company" | "deal" | "workspace";
      id: string;
      title: string;
      href: string | null;
    };
  }>;
  ownerOptions: WorkspaceOwner[];
};

export function RecordEngagementPanel({
  targetType,
  targetId,
  timeline,
  tasks,
  ownerOptions,
}: RecordEngagementPanelProps) {
  const router = useRouter();
  const [noteBody, setNoteBody] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDueAt, setTaskDueAt] = useState("");
  const [taskAssigneeId, setTaskAssigneeId] = useState("");
  const [activityType, setActivityType] = useState("CALL");
  const [activitySummary, setActivitySummary] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<"note" | "task" | "activity" | null>(null);
  const [isPending, startTransition] = useTransition();

  async function postJson(url: string, body: unknown) {
    const response = await fetch(url, {
      method: "POST",
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

  function submitNote() {
    setError(null);
    setPendingAction("note");

    startTransition(async () => {
      try {
        await postJson("/api/notes", {
          targetType,
          targetId,
          body: noteBody,
        });
        setNoteBody("");
        router.refresh();
      } catch (submitError) {
        setError(submitError instanceof Error ? submitError.message : "Could not save note.");
      } finally {
        setPendingAction(null);
      }
    });
  }

  function submitTask() {
    setError(null);
    setPendingAction("task");

    startTransition(async () => {
      try {
        await postJson("/api/tasks", {
          targetType,
          targetId,
          title: taskTitle,
          dueAt: taskDueAt ? new Date(`${taskDueAt}T00:00:00.000Z`).toISOString() : null,
          assigneeId: taskAssigneeId || null,
        });
        setTaskTitle("");
        setTaskDueAt("");
        router.refresh();
      } catch (submitError) {
        setError(submitError instanceof Error ? submitError.message : "Could not save task.");
      } finally {
        setPendingAction(null);
      }
    });
  }

  function submitActivity() {
    setError(null);
    setPendingAction("activity");

    startTransition(async () => {
      try {
        await postJson("/api/activities", {
          targetType,
          targetId,
          type: activityType,
          summary: activitySummary,
        });
        setActivitySummary("");
        router.refresh();
      } catch (submitError) {
        setError(submitError instanceof Error ? submitError.message : "Could not save activity.");
      } finally {
        setPendingAction(null);
      }
    });
  }

  return (
    <div className="details-grid">
      <article className="detail-card">
        <div className="card-head">
          <div>
            <h2>Engagement actions</h2>
            <p>Add notes, assign follow-up tasks, or log a manual activity.</p>
          </div>
          <span className="eyebrow">Composer</span>
        </div>

        {error ? <p className="error-banner">{error}</p> : null}

        <div className="composer-stack">
          <label className="field-stack">
            <span className="subtle">Note</span>
            <textarea
              className="input-shell input-textarea"
              value={noteBody}
              onChange={(event) => setNoteBody(event.target.value)}
              rows={4}
              placeholder="Summarize the latest update, blocker, or next step."
            />
          </label>
          <div className="detail-action-row">
            <button type="button" className="cta-primary" disabled={isPending || !noteBody.trim()} onClick={submitNote}>
              {pendingAction === "note" ? "Saving..." : "Add note"}
            </button>
          </div>

          <div className="field-grid">
            <label className="field-stack">
              <span className="subtle">Task</span>
              <input
                className="input-shell"
                value={taskTitle}
                onChange={(event) => setTaskTitle(event.target.value)}
                placeholder="Schedule follow-up call"
              />
            </label>
            <label className="field-stack">
              <span className="subtle">Due date</span>
              <input
                className="input-shell"
                type="date"
                value={taskDueAt}
                onChange={(event) => setTaskDueAt(event.target.value)}
              />
            </label>
            <label className="field-stack">
              <span className="subtle">Assignee</span>
              <select
                className="input-shell"
                value={taskAssigneeId}
                onChange={(event) => setTaskAssigneeId(event.target.value)}
              >
                <option value="">Current user</option>
                {ownerOptions.map((owner) => (
                  <option key={owner.id} value={owner.id}>
                    {owner.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="detail-action-row">
            <button type="button" className="cta-primary" disabled={isPending || !taskTitle.trim()} onClick={submitTask}>
              {pendingAction === "task" ? "Saving..." : "Add task"}
            </button>
          </div>

          <div className="field-grid">
            <label className="field-stack">
              <span className="subtle">Activity type</span>
              <select
                className="input-shell"
                value={activityType}
                onChange={(event) => setActivityType(event.target.value)}
              >
                <option value="CALL">Call</option>
                <option value="EMAIL">Email</option>
                <option value="MEETING">Meeting</option>
              </select>
            </label>
            <label className="field-stack">
              <span className="subtle">Summary</span>
              <input
                className="input-shell"
                value={activitySummary}
                onChange={(event) => setActivitySummary(event.target.value)}
                placeholder="Reviewed pricing with procurement."
              />
            </label>
          </div>
          <div className="detail-action-row">
            <button
              type="button"
              className="cta-primary"
              disabled={isPending || !activitySummary.trim()}
              onClick={submitActivity}
            >
              {pendingAction === "activity" ? "Saving..." : "Log activity"}
            </button>
          </div>
        </div>
      </article>

      <div className="detail-stack">
        <TimelineFeed items={timeline} />

        <article className="detail-card">
          <div className="card-head">
            <div>
              <h2>Open tasks</h2>
              <p>Target-scoped tasks stay visible beside the record timeline.</p>
            </div>
            <span className="eyebrow">Tasks</span>
          </div>

          <div className="record-list">
            {tasks.length === 0 ? (
              <div className="empty-stage">
                <p>No tasks linked to this record.</p>
              </div>
            ) : (
              tasks.map((task) => (
                <div key={task.id} className="record-row">
                  <div className="record-row-head">
                    <span className="record-title">{task.title}</span>
                    <span className={`status-pill status-${task.isOverdue ? "pending" : task.status === "DONE" ? "paused" : "open"}`}>
                      {task.isOverdue ? "Overdue" : task.status}
                    </span>
                  </div>
                  <p className="subtle">
                    {task.assignee?.name ?? "Unassigned"} · {task.dueAt ? new Date(task.dueAt).toLocaleDateString() : "No due date"}
                  </p>
                </div>
              ))
            )}
          </div>
        </article>
      </div>
    </div>
  );
}
