import { CrmShell } from "@/components/crm-shell";
import { DetailScaffold } from "@/components/crm-sections";

type DealDetailPageProps = {
  params: Promise<{ dealId: string }>;
};

export default async function DealDetailPage({ params }: DealDetailPageProps) {
  const { dealId } = await params;

  return (
    <CrmShell
      currentPath="/deals"
      title="Deal detail shell"
      copy="This view is positioned for stage controls, owner updates, related contacts, and timeline activity once the API and board task ship."
    >
      <DetailScaffold
        title={`Deal ${dealId}`}
        subtitle="The CRM shell is ready for stage movement, ownership, and activity context."
        badges={["Stage control next", "Owner state next", "Timeline entry ready"]}
      />
    </CrmShell>
  );
}
