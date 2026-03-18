import type { DashboardMetrics } from "@/lib/crm/dashboard-metrics";

type DashboardMetricsProps = {
  data: DashboardMetrics;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function DashboardMetricsView({ data }: DashboardMetricsProps) {
  return (
    <div className="page-grid">
      <section className="hero-grid">
        <article className="hero-card">
          <span className="eyebrow">Workspace dashboard</span>
          <h2>{data.workspace.name}</h2>
          <p>
            Keep the deal pipeline, overdue work, and recent activity visible without falling back
            to a spreadsheet.
          </p>
          <div className="meta-row">
            <span className="meta-chip">Workspace-scoped</span>
            <span className="meta-chip">CSV import/export ready</span>
            <span className="meta-chip">Live CRM metrics</span>
          </div>
        </article>

        <article className="card">
          <div className="card-head">
            <div>
              <h2>Pipeline stages</h2>
              <p>Stage totals from the active sales pipeline.</p>
            </div>
            <span className="eyebrow">Board</span>
          </div>

          <div className="stage-summary-list">
            {data.stageBreakdown.length === 0 ? (
              <p className="subtle">No pipeline configured yet.</p>
            ) : (
              data.stageBreakdown.map((stage) => (
                <div key={stage.id} className="stage-summary-row">
                  <div className="metric-row">
                    <span>{stage.name}</span>
                    <span className="subtle">{stage.dealCount} deals</span>
                  </div>
                  <div className="metric-row">
                    <span className="subtle">{stage.kind}</span>
                    <span>{formatCurrency(stage.totalValue)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </article>
      </section>

      <section className="stats-grid">
        {data.summaryCards.map((card) => (
          <article key={card.label} className="stat-card">
            <h3>{card.label}</h3>
            <div className="stat-value">{card.value}</div>
            <span className={`stat-trend trend-${card.tone}`}>{card.note}</span>
          </article>
        ))}
      </section>

      <section className="record-grid">
        <article className="table-card">
          <div className="card-head">
            <div>
              <h2>Overdue tasks</h2>
              <p>Tasks due before now that still need a response.</p>
            </div>
            <span className="eyebrow">Follow-up</span>
          </div>

          <div className="table-shell">
            {data.overdueTasks.length === 0 ? (
              <div className="empty-stage">
                <p>No overdue tasks at the moment.</p>
              </div>
            ) : (
              data.overdueTasks.map((task) => (
                <div key={task.id} className="record-row">
                  <div className="record-row-head">
                    <span className="record-title">{task.title}</span>
                    <span className="tiny-badge">{formatDate(task.dueAt)}</span>
                  </div>
                  <p className="record-subtitle">
                    {task.linkedLabel} · {task.ownerName ?? "Unassigned"} · {task.status}
                  </p>
                </div>
              ))
            )}
          </div>
        </article>

        <article className="timeline-card">
          <div className="card-head">
            <div>
              <h2>Recent activity</h2>
              <p>Most recent timeline events across the workspace.</p>
            </div>
            <span className="eyebrow">Activity</span>
          </div>

          <div className="timeline-list">
            {data.recentActivity.length === 0 ? (
              <div className="empty-stage">
                <p>No recent activity yet.</p>
              </div>
            ) : (
              data.recentActivity.map((activity) => (
                <div key={activity.id} className="timeline-row">
                  <div className="timeline-row-head">
                    <span className="record-title">{activity.type}</span>
                    <span className="tiny-badge">{formatDateTime(activity.happenedAt)}</span>
                  </div>
                  <p className="timeline-copy">{activity.summary}</p>
                  <p className="subtle">{activity.linkedLabel}</p>
                </div>
              ))
            )}
          </div>
        </article>
      </section>

      <section className="record-grid">
        <article className="card">
          <div className="card-head">
            <div>
              <h2>Exports</h2>
              <p>Download workspace-scoped CSV snapshots for supported records.</p>
            </div>
            <span className="eyebrow">CSV</span>
          </div>

          <div className="export-grid">
            {(["contacts", "companies", "deals"] as const).map((resource) => (
              <a key={resource} className="export-link" href={`/api/export/${resource}`}>
                <strong>{resource}</strong>
                <span>Download CSV</span>
              </a>
            ))}
          </div>
        </article>

        <article className="card">
          <div className="card-head">
            <div>
              <h2>CSV imports</h2>
              <p>Upload a CSV file and receive row-level validation feedback.</p>
            </div>
            <span className="eyebrow">Import</span>
          </div>

          <div className="subtle">
            Supported columns are shown in the upload widget, and invalid rows will be reported
            without blocking the valid ones.
          </div>
        </article>
      </section>
    </div>
  );
}
