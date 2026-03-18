import { CrmShell } from "@/components/crm-shell";
import { DealDetail } from "@/components/deal-detail";
import { getDealEngagementPageData } from "@/lib/crm/engagement-page-data";
import { getDealDetailPageData } from "@/lib/crm/page-data";
import { notFound } from "next/navigation";

type DealDetailPageProps = {
  params: Promise<{ dealId: string }>;
};

export default async function DealDetailPage({ params }: DealDetailPageProps) {
  const { dealId } = await params;
  const [data, engagement] = await Promise.all([
    getDealDetailPageData(dealId),
    getDealEngagementPageData(dealId),
  ]);

  if (!data || !engagement) {
    notFound();
  }

  return (
    <CrmShell
      currentPath="/deals"
      title="Deal detail workflow"
      copy="Review the account context, update the core deal fields, and move the opportunity to the right stage without leaving the record."
    >
      <DealDetail {...data} engagement={engagement} />
    </CrmShell>
  );
}
