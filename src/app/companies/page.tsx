import { CrmShell } from "@/components/crm-shell";
import { RecordTable, SidebarCard, recordTables } from "@/components/crm-sections";

export default function CompaniesPage() {
  return (
    <CrmShell
      currentPath="/companies"
      title="Company records that keep context attached"
      copy="Company shells are ready for domain details, linked contacts, and the primary-deal relationship model from the schema."
    >
      <div className="record-grid">
        <RecordTable
          title="Company list"
          copy="Shell state for company records and related opportunity context."
          rows={recordTables.companies}
          hrefPrefix="/companies"
        />
        <SidebarCard
          title="Schema handoff"
          copy="The Prisma model already includes company ownership, contact links, deal links, and archive support so the next API task can wire records directly."
        />
      </div>
    </CrmShell>
  );
}
