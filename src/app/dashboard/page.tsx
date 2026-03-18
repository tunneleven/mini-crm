import { CrmShell } from "@/components/crm-shell";
import { DashboardMetricsView } from "@/components/dashboard-metrics";
import { ImportExportPanel } from "@/components/import-export-panel";
import { getDashboardMetrics } from "@/lib/crm/dashboard-metrics";
import { resolveWorkspaceIdFromServer } from "@/lib/crm/workspace";

export default async function DashboardPage() {
  const workspaceId = await resolveWorkspaceIdFromServer();
  const data = await getDashboardMetrics({ workspaceId });

  return (
    <CrmShell
      currentPath="/dashboard"
      title="Command center for a cleaner revenue rhythm"
      copy="A workspace-scoped dashboard for open deals, overdue follow-up, recent activity, and CSV imports."
    >
      <DashboardMetricsView data={data} />
      <ImportExportPanel />
    </CrmShell>
  );
}
