import { CrmShell } from "@/components/crm-shell";
import { DealBoard } from "@/components/deal-board";
import { SidebarCard } from "@/components/crm-sections";
import { getDealBoardPageData } from "@/lib/crm/page-data";

export default async function DealsPage() {
  const data = await getDealBoardPageData();

  return (
    <CrmShell
      currentPath="/deals"
      title="Deals ready for stage movement and owner handoff"
      copy="The board now runs on live pipeline data with direct stage movement controls, so the core revenue workflow is no longer a placeholder."
    >
      <div className="page-grid">
        <section className="record-grid">
          <article className="hero-card">
            <span className="eyebrow">Pipeline board</span>
            <h2>{data.pipeline?.name ?? "No active pipeline"}</h2>
            <p>
              Monitor active deals by stage, then advance or rewind them without leaving the board.
            </p>
            <div className="meta-row">
              <span className="meta-chip">{data.summary.openDealCount} open deals</span>
              <span className="meta-chip">${data.summary.totalPipelineValue.toLocaleString()} pipeline value</span>
              <span className="meta-chip">{data.summary.activeStageCount} active stages</span>
            </div>
          </article>

          <SidebarCard
            title="Workflow notes"
            copy="This board intentionally uses explicit move controls instead of drag and drop. It keeps stage changes consistent with backend validation and ships faster for the hackathon window."
          />
        </section>

        <DealBoard initialStages={data.stages} />
      </div>
    </CrmShell>
  );
}
