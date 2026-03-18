import { CrmShell } from "@/components/crm-shell";
import { TaskWorkbench } from "@/components/task-workbench";
import { getTaskWorkspacePageData } from "@/lib/crm/engagement-page-data";

export default async function TasksPage() {
  const data = await getTaskWorkspacePageData();

  return (
    <CrmShell
      currentPath="/tasks"
      title="Follow-up work with overdue visibility"
      copy="Workspace tasks are now real records with due dates, assignees, and completion state."
    >
      <TaskWorkbench
        tasks={data.tasks}
        owners={data.owners}
        summary={data.summary}
        currentUserId={data.currentUser.id}
      />
    </CrmShell>
  );
}
