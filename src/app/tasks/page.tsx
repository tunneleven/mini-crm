import { CrmShell } from "@/components/crm-shell";
import { SidebarCard } from "@/components/crm-sections";
import { taskRows } from "@/lib/mock-data";

export default function TasksPage() {
  return (
    <CrmShell
      currentPath="/tasks"
      title="Follow-up work lined up for the next implementation wave"
      copy="Tasks are visible in the shell now so the timeline and reminder slice can plug into a stable route and interaction pattern."
    >
      <div className="record-grid">
        <article className="table-card">
          <div className="card-head">
            <div>
              <h2>Task list shell</h2>
              <p>Placeholder task state for overdue, in-flight, and upcoming follow-up.</p>
            </div>
            <span className="eyebrow">Tasks</span>
          </div>
          <div className="table-shell">
            {taskRows.map((task) => (
              <div key={task.title} className="record-row">
                <div className="record-row-head">
                  <span className="record-title">{task.title}</span>
                  <span className={`status-pill status-${task.tone}`}>{task.tone}</span>
                </div>
                <p className="subtle">{task.subtitle}</p>
              </div>
            ))}
          </div>
        </article>
        <SidebarCard
          title="Timeline dependency"
          copy="This route is intentionally simple in wave one. The notes, tasks, and timeline task can now reuse the shared record row and detail patterns instead of inventing them later."
        />
      </div>
    </CrmShell>
  );
}
