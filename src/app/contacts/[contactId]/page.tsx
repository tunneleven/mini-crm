import { CrmShell } from "@/components/crm-shell";
import { RecordEngagementPanel } from "@/components/record-engagement-panel";
import { getContactEngagementPageData } from "@/lib/crm/engagement-page-data";
import Link from "next/link";
import { notFound } from "next/navigation";

type ContactDetailPageProps = {
  params: Promise<{ contactId: string }>;
};

export default async function ContactDetailPage({ params }: ContactDetailPageProps) {
  const { contactId } = await params;
  const data = await getContactEngagementPageData(contactId);

  if (!data) {
    notFound();
  }

  return (
    <CrmShell
      currentPath="/contacts"
      title={`${data.record.title} · Contact detail`}
      copy="Notes, tasks, activities, and timeline history are now tied to the contact record itself."
    >
      <div className="page-grid">
        <section className="hero-grid">
          <article className="hero-card">
            <span className="eyebrow">Contact record</span>
            <h2>{data.record.title}</h2>
            <p>
              {data.record.subtitle} · {data.record.meta}
            </p>
          </article>

          <article className="card">
            <div className="card-head">
              <div>
                <h2>Related records</h2>
                <p>Ownership and linked accounts stay visible beside the engagement history.</p>
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
          targetType="contact"
          targetId={data.target.id}
          timeline={data.timeline}
          tasks={data.tasks}
          ownerOptions={data.ownerOptions}
        />
      </div>
    </CrmShell>
  );
}
