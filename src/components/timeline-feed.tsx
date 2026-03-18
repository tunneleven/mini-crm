import Link from "next/link";

import type { TimelineItem } from "@/lib/crm/activity-service";

function formatRelativeTime(value: string) {
  const date = new Date(value);
  const diffMinutes = Math.round((Date.now() - date.getTime()) / 60000);

  if (diffMinutes < 1) {
    return "Just now";
  }

  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  const diffDays = Math.round(diffHours / 24);
  return `${diffDays}d ago`;
}

export function TimelineFeed({ items }: { items: TimelineItem[] }) {
  return (
    <article className="timeline-card">
      <div className="card-head">
        <div>
          <h2>Unified timeline</h2>
          <p>Notes, tasks, and activities appear in a single chronological feed.</p>
        </div>
        <span className="eyebrow">Timeline</span>
      </div>

      <div className="timeline-list">
        {items.length === 0 ? (
          <div className="empty-stage">
            <p>No timeline items yet.</p>
          </div>
        ) : (
          items.map((item) => (
            <article key={item.id} className="timeline-row">
              <div className="timeline-row-head">
                <span className="record-title">{item.title}</span>
                <span className={`tiny-badge timeline-badge timeline-${item.kind}`}>{item.badge}</span>
              </div>
              <p className="timeline-copy">{item.body}</p>
              <div className="timeline-meta-row">
                <span className="subtle">{formatRelativeTime(item.occurredAt)}</span>
                {item.isOverdue ? <span className="timeline-overdue">Overdue</span> : null}
                <Link className="tiny-badge" href={item.recordHref}>
                  Open record
                </Link>
              </div>
            </article>
          ))
        )}
      </div>
    </article>
  );
}
