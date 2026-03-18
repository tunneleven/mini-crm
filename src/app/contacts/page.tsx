import { CrmShell } from "@/components/crm-shell";
import { RecordTable, SidebarCard, recordTables } from "@/components/crm-sections";

export default function ContactsPage() {
  return (
    <CrmShell
      currentPath="/contacts"
      title="Contacts with enough structure to stay actionable"
      copy="Lead people records, ownership, and next-step context live here. The API task will replace the mock data without changing this list/detail flow."
    >
      <div className="record-grid">
        <RecordTable
          title="Contact queue"
          copy="Initial shell for contact search, owner views, and warm lead prioritization."
          rows={recordTables.contacts}
          hrefPrefix="/contacts"
        />
        <SidebarCard
          title="Implementation note"
          copy="This first wave keeps the page stable while contact CRUD and workspace-scoped search are added in the next backend slice."
        />
      </div>
    </CrmShell>
  );
}
