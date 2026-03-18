import { CrmShell } from "@/components/crm-shell";
import { DashboardSection } from "@/components/crm-sections";

export default function DashboardPage() {
  return (
    <CrmShell
      currentPath="/dashboard"
      title="Command center for a cleaner revenue rhythm"
      copy="A workspace-scoped dashboard shell for open deals, overdue follow-up, and fast access to core CRM records."
    >
      <DashboardSection />
    </CrmShell>
  );
}
