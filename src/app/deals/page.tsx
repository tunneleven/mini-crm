import { CrmShell } from "@/components/crm-shell";
import { RecordTable, SidebarCard, recordTables } from "@/components/crm-sections";

export default function DealsPage() {
  return (
    <CrmShell
      currentPath="/deals"
      title="Deals ready for stage movement and owner handoff"
      copy="This wave establishes the board and detail shell prerequisites: shared layout, dashboard context, and the schema needed for a real pipeline implementation."
    >
      <div className="record-grid">
        <RecordTable
          title="Open deal shell"
          copy="Current shell for deal list rows before the dedicated pipeline board task lands."
          rows={recordTables.deals}
          hrefPrefix="/deals"
        />
        <SidebarCard
          title="Next blocked task"
          copy="The pipeline board task now has a stable deal surface, route structure, and schema to build on as soon as APIs are in place."
        />
      </div>
    </CrmShell>
  );
}
