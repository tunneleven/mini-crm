import { CrmShell } from "@/components/crm-shell";
import { DealDetail } from "@/components/deal-detail";
import { getDealDetailPageData } from "@/lib/crm/page-data";
import { notFound } from "next/navigation";

type DealDetailPageProps = {
  params: Promise<{ dealId: string }>;
};

export default async function DealDetailPage({ params }: DealDetailPageProps) {
  const { dealId } = await params;
  const data = await getDealDetailPageData(dealId);

  if (!data) {
    notFound();
  }

  return (
    <CrmShell
      currentPath="/deals"
      title="Deal detail workflow"
      copy="Review the account context, update the core deal fields, and move the opportunity to the right stage without leaving the record."
    >
      <DealDetail {...data} />
    </CrmShell>
  );
}
