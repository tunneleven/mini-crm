import Link from "next/link";
import { ReactNode } from "react";

import {
  contactRows,
  companyRows,
  dashboardStats,
  dealRows,
  pipelineSnapshot,
  taskRows,
  timelineRows,
} from "@/lib/mock-data";

export function DashboardSection() {
  return (
    <div className="page-grid">
      <section className="hero-grid">
        <article className="hero-card">
          <span className="eyebrow">Wave 1 dashboard shell</span>
          <h2>Track the pipeline without falling back to a spreadsheet.</h2>
          <p>
            This first implementation wave lands the authenticated shell, core navigation, and
            operational dashboard scaffolding. The next blocked tasks can plug real APIs, stage
            movement, and timeline events into these surfaces without reworking the layout.
          </p>
          <div className="cta-row">
            <Link className="cta-primary" href="/deals">
              Open deal workspace
            </Link>
            <Link className="cta-secondary" href="/contacts">
              Review contact queue
            </Link>
          </div>
          <div className="meta-row">
            <span className="meta-chip">Workspace-scoped search</span>
            <span className="meta-chip">Dashboard metrics ready</span>
            <span className="meta-chip">Record detail shells in place</span>
          </div>
        </article>

        <article className="card">
          <div className="card-head">
            <div>
              <h2>Pipeline snapshot</h2>
              <p>Stage totals wired with placeholder data for the shell.</p>
            </div>
            <span className="eyebrow">Metrics</span>
          </div>

          <div className="metrics-list">
            {pipelineSnapshot.map((item) => (
              <div key={item.label}>
                <div className="metric-row">
                  <span>{item.label}</span>
                  <span className="subtle">{item.value}</span>
                </div>
                <div className="metric-bar">
                  <span style={{ width: item.width }} />
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="stats-grid">
        {dashboardStats.map((stat) => (
          <article key={stat.label} className="stat-card">
            <h3>{stat.label}</h3>
            <div className="stat-value">{stat.value}</div>
            <span className={`stat-trend trend-${stat.tone}`}>{stat.trend}</span>
          </article>
        ))}
      </section>

      <section className="record-grid">
        <RecordTable
          title="Open deals"
          copy="Priority opportunities in the current build dataset."
          rows={dealRows}
          hrefPrefix="/deals"
        />
        <TimelineCard />
      </section>
    </div>
  );
}

type RecordTableProps = {
  title: string;
  copy: string;
  rows: Array<{ id?: string; title: string; subtitle: string; meta: string; status: string }>;
  hrefPrefix?: string;
};

export function RecordTable({ title, copy, rows, hrefPrefix }: RecordTableProps) {
  return (
    <article className="table-card">
      <div className="card-head">
        <div>
          <h2>{title}</h2>
          <p>{copy}</p>
        </div>
        <span className="eyebrow">List shell</span>
      </div>
      <div className="table-shell">
        {rows.map((row) => {
          const content = (
            <>
              <div className="record-row-head">
                <span className="record-title">{row.title}</span>
                <span className={`status-pill status-${statusTone(row.status)}`}>{row.status}</span>
              </div>
              <p className="record-subtitle">{row.subtitle}</p>
              <p className="subtle">{row.meta}</p>
            </>
          );

          return hrefPrefix && row.id ? (
            <Link key={row.id} href={`${hrefPrefix}/${row.id}`} className="record-row">
              {content}
            </Link>
          ) : (
            <div key={`${row.title}-${row.meta}`} className="record-row">
              {content}
            </div>
          );
        })}
      </div>
    </article>
  );
}

export function SidebarCard({
  title,
  copy,
  children,
}: {
  title: string;
  copy: string;
  children?: ReactNode;
}) {
  return (
    <article className="card">
      <div className="card-head">
        <div>
          <h2>{title}</h2>
          <p>{copy}</p>
        </div>
        <span className="eyebrow">Context</span>
      </div>
      {children}
    </article>
  );
}

export function DetailScaffold({
  title,
  subtitle,
  badges,
}: {
  title: string;
  subtitle: string;
  badges: string[];
}) {
  return (
    <div className="page-grid">
      <section className="details-grid">
        <article className="hero-card">
          <span className="eyebrow">Record detail scaffold</span>
          <h2>{title}</h2>
          <p>{subtitle}</p>
          <div className="badge-row">
            {badges.map((badge) => (
              <span key={badge} className="tiny-badge">
                {badge}
              </span>
            ))}
          </div>
        </article>

        <TimelineCard />
      </section>

      <section className="details-grid">
        <div className="detail-grid">
          <article className="detail-card">
            <h3>Key fields</h3>
            <p className="record-subtitle">
              Reserved for editable CRM properties. The downstream API task will wire these fields
              to persisted records and validation.
            </p>
          </article>
          <article className="detail-card">
            <h3>Related records</h3>
            <p className="record-subtitle">
              This area is set up for contact-company and deal association cards.
            </p>
          </article>
        </div>

        <div className="detail-grid">
          <article className="detail-card">
            <h3>Open tasks</h3>
            <div className="record-list">
              {taskRows.map((task) => (
                <div key={task.title} className="record-row">
                  <div className="record-row-head">
                    <span className="record-title">{task.title}</span>
                    <span className={`status-pill status-${statusTone(task.tone)}`}>{task.tone}</span>
                  </div>
                  <p className="subtle">{task.subtitle}</p>
                </div>
              ))}
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}

function TimelineCard() {
  return (
    <article className="timeline-card">
      <div className="card-head">
        <div>
          <h2>Activity timeline</h2>
          <p>Foundation for notes, tasks, stage changes, and future integrations.</p>
        </div>
        <span className="eyebrow">Timeline</span>
      </div>
      <div className="timeline-list">
        {timelineRows.map((item) => (
          <div key={`${item.title}-${item.when}`} className="timeline-row">
            <div className="timeline-row-head">
              <span className="record-title">{item.title}</span>
              <span className="tiny-badge">{item.when}</span>
            </div>
            <p className="timeline-copy">{item.copy}</p>
          </div>
        ))}
      </div>
    </article>
  );
}

function statusTone(input: string) {
  if (input === "Warm lead" || input === "Qualified" || input === "open") {
    return "open";
  }

  if (input === "proposal" || input === "pending" || input === "Needs follow-up") {
    return "pending";
  }

  return "paused";
}

export const recordTables = {
  contacts: contactRows,
  companies: companyRows,
  deals: dealRows,
};
