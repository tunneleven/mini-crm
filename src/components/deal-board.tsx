"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import type { DealBoardStage, DealRecord } from "@/lib/crm/page-data";

type DealBoardProps = {
  initialStages: DealBoardStage[];
};

function formatCurrency(amount: number | null, currency: string) {
  if (amount === null) {
    return "Value not set";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(value: string | null) {
  if (!value) {
    return "No close date";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function getPrimaryCompanyName(deal: DealRecord) {
  return deal.companies.find((company) => company.isPrimary)?.name ?? deal.companies[0]?.name ?? "No company linked";
}

function sortDeals(deals: DealRecord[]) {
  return [...deals].sort((left, right) => {
    return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
  });
}

function applyDealUpdate(stages: DealBoardStage[], updatedDeal: DealRecord) {
  return stages.map((stage) => {
    const existingDeals = stage.deals.filter((deal) => deal.id !== updatedDeal.id);

    if (stage.id === updatedDeal.stage.id) {
      return {
        ...stage,
        dealCount: existingDeals.length + 1,
        totalValue: existingDeals.reduce((sum, deal) => sum + (deal.amount ?? 0), 0) + (updatedDeal.amount ?? 0),
        deals: sortDeals([...existingDeals, updatedDeal]),
      };
    }

    return {
      ...stage,
      dealCount: existingDeals.length,
      totalValue: existingDeals.reduce((sum, deal) => sum + (deal.amount ?? 0), 0),
      deals: existingDeals,
    };
  });
}

export function DealBoard({ initialStages }: DealBoardProps) {
  const router = useRouter();
  const [stages, setStages] = useState(initialStages);
  const [pendingDealId, setPendingDealId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function moveDeal(dealId: string, stageId: string) {
    setError(null);
    setPendingDealId(dealId);

    startTransition(async () => {
      try {
        const response = await fetch(`/api/deals/${dealId}/stage`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ stageId }),
        });

        const payload = await response.json();

        if (!response.ok) {
          setError(payload.error?.message ?? "Could not update the deal stage.");
          return;
        }

        setStages((currentStages) => applyDealUpdate(currentStages, payload.item as DealRecord));
        router.refresh();
      } catch {
        setError("Could not update the deal stage.");
      } finally {
        setPendingDealId(null);
      }
    });
  }

  if (stages.length === 0) {
    return (
      <article className="table-card empty-shell">
        <h2>No pipeline configured</h2>
        <p className="record-subtitle">
          Add a pipeline and stages to start moving deals across the board.
        </p>
      </article>
    );
  }

  return (
    <section className="board-shell">
      {error ? <p className="error-banner">{error}</p> : null}
      <div className="board-columns">
        {stages.map((stage, stageIndex) => (
          <article key={stage.id} className="stage-column">
            <div className="stage-column-head">
              <div>
                <p className="stage-label">{stage.name}</p>
                <p className="subtle">
                  {stage.dealCount} deals · {formatCurrency(stage.totalValue, "USD")}
                </p>
              </div>
              <span className={`tiny-badge stage-kind-${stage.kind.toLowerCase()}`}>{stage.kind}</span>
            </div>

            <div className="stage-card-list">
              {stage.deals.length === 0 ? (
                <div className="empty-stage">
                  <p>No active deals in this stage.</p>
                </div>
              ) : (
                stage.deals.map((deal) => {
                  const previousStageId = stages[stageIndex - 1]?.id;
                  const nextStageId = stages[stageIndex + 1]?.id;
                  const primaryCompany = getPrimaryCompanyName(deal);
                  const dealPending = isPending && pendingDealId === deal.id;

                  return (
                    <div key={deal.id} className="deal-card">
                      <div className="record-row-head">
                        <Link href={`/deals/${deal.id}`} className="record-title inline-link">
                          {deal.title}
                        </Link>
                        <span className={`status-pill status-${stageTone(deal.stage.kind)}`}>
                          {deal.stage.name}
                        </span>
                      </div>
                      <p className="record-subtitle">
                        {primaryCompany} · {formatCurrency(deal.amount, deal.currency)}
                      </p>
                      <div className="deal-meta-grid">
                        <span>{deal.owner?.name ?? "Unassigned owner"}</span>
                        <span>{formatDate(deal.closeDate)}</span>
                      </div>
                      <div className="deal-meta-grid">
                        <span>{deal.contacts.length} linked contacts</span>
                        <span>{deal.companies.length} linked companies</span>
                      </div>
                      <div className="deal-action-row">
                        <button
                          type="button"
                          className="ghost-button"
                          disabled={!previousStageId || dealPending}
                          onClick={() => {
                            if (previousStageId) {
                              moveDeal(deal.id, previousStageId);
                            }
                          }}
                        >
                          {dealPending ? "Updating..." : "Move back"}
                        </button>
                        <button
                          type="button"
                          className="cta-primary"
                          disabled={!nextStageId || dealPending}
                          onClick={() => {
                            if (nextStageId) {
                              moveDeal(deal.id, nextStageId);
                            }
                          }}
                        >
                          {nextStageId ? "Advance" : "Final stage"}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function stageTone(kind: string) {
  if (kind === "WON") {
    return "open";
  }

  if (kind === "LOST") {
    return "paused";
  }

  return "pending";
}
