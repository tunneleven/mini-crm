import { CrmShell } from "@/components/crm-shell";
import { DetailScaffold } from "@/components/crm-sections";

type ContactDetailPageProps = {
  params: Promise<{ contactId: string }>;
};

export default async function ContactDetailPage({ params }: ContactDetailPageProps) {
  const { contactId } = await params;

  return (
    <CrmShell
      currentPath="/contacts"
      title="Contact detail shell"
      copy="Prepared for notes, tasks, company associations, and owner updates once the core APIs land."
    >
      <DetailScaffold
        title={`Contact ${contactId}`}
        subtitle="This detail scaffold is wired for timeline, task, and relationship blocks."
        badges={["Owner slot ready", "Timeline slot ready", "Company links next"]}
      />
    </CrmShell>
  );
}
