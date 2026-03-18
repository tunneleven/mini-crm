import { CrmShell } from "@/components/crm-shell";
import { RecordEngagementPanel } from "@/components/record-engagement-panel";
import { getCompanyEngagementPageData } from "@/lib/crm/engagement-page-data";
import Link from "next/link";
import { notFound } from "next/navigation";

type CompanyDetailPageProps = {
  params: Promise<{ companyId: string }>;
};

export default async function CompanyDetailPage({ params }: CompanyDetailPageProps) {
  const { companyId } = await params;
  const data = await getCompanyEngagementPageData(companyId);

  if (!data) {
    notFound();
  }

  return (
    <CrmShell
      currentPath="/companies"
      title={`${data.record.title} · Company detail`}
      copy="Company context now includes related people, deals, notes, tasks, and activities in one record view."
    >
      <div className="page-grid">
        <section className="hero-grid">
          <article className="hero-card">
            <span className="eyebrow">Company record</span>
            <h2>{data.record.title}</h2>
            <p>
              {data.record.subtitle} · {data.record.meta}
            </p>
          </article>

          <article className="card">
            <div className="card-head">
              <div>
                <h2>Related records</h2>
                <p>Accounts, contacts, and deals stay connected to the same company record.</p>
              </div>
              <span className="eyebrow">Context</span>
            </div>
            <div className="record-list">
              {data.summary.map((item) => (
                <Link key={item.id} className="record-row" href={item.href}>
                  <div className="record-row-head">
                    <span className="record-title">{item.title}</span>
                    <span className="tiny-badge">{item.subtitle}</span>
                  </div>
                  <p className="subtle">{item.meta}</p>
                </Link>
              ))}
            </div>
          </article>
        </section>

        <RecordEngagementPanel
          targetType="company"
          targetId={data.target.id}
          timeline={data.timeline}
          tasks={data.tasks}
          ownerOptions={data.ownerOptions}
        />
      </div>
    </CrmShell>
  );
}
