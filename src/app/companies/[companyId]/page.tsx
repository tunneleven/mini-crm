import { CrmShell } from "@/components/crm-shell";
import { DetailScaffold } from "@/components/crm-sections";

type CompanyDetailPageProps = {
  params: Promise<{ companyId: string }>;
};

export default async function CompanyDetailPage({ params }: CompanyDetailPageProps) {
  const { companyId } = await params;

  return (
    <CrmShell
      currentPath="/companies"
      title="Company detail shell"
      copy="Prepared for contact relationships, primary opportunities, notes, and timeline activity."
    >
      <DetailScaffold
        title={`Company ${companyId}`}
        subtitle="Designed to support both account context and open pipeline motion."
        badges={["Contact links", "Deal links", "Timeline ready"]}
      />
    </CrmShell>
  );
}
