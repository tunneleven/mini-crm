"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { RecordEngagementPanel } from "@/components/record-engagement-panel";
import type { EngagementPageData } from "@/lib/crm/engagement-page-data";
import type { DealDetailPageData, DealRecord } from "@/lib/crm/page-data";

type DealDetailProps = DealDetailPageData & {
  engagement: EngagementPageData;
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

function formatDateLabel(value: string | null) {
  if (!value) {
    return "No close date";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function formatDateInput(value: string | null) {
  if (!value) {
    return "";
  }

  return new Date(value).toISOString().slice(0, 10);
}

function getPrimaryCompany(deal: DealRecord) {
  return deal.companies.find((company) => company.isPrimary) ?? deal.companies[0] ?? null;
}

export function DealDetail({ deal: initialDeal, ownerOptions, stageOptions, engagement }: DealDetailProps) {
  const router = useRouter();
  const [deal, setDeal] = useState(initialDeal);
  const [title, setTitle] = useState(initialDeal.title);
  const [amount, setAmount] = useState(initialDeal.amount?.toString() ?? "");
  const [ownerId, setOwnerId] = useState(initialDeal.owner?.id ?? "");
  const [closeDate, setCloseDate] = useState(formatDateInput(initialDeal.closeDate));
  const [stageId, setStageId] = useState(initialDeal.stage.id);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const primaryCompany = getPrimaryCompany(deal);

  function saveDeal() {
    setMessage(null);
    setError(null);

    startTransition(async () => {
      try {
        const dealResponse = await fetch(`/api/deals/${deal.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title,
            amount: amount.trim() === "" ? null : Number(amount),
            ownerId: ownerId || null,
            closeDate: closeDate ? new Date(`${closeDate}T00:00:00.000Z`).toISOString() : null,
          }),
        });

        const dealPayload = await dealResponse.json();

        if (!dealResponse.ok) {
          setError(dealPayload.error?.message ?? "Could not save deal details.");
          return;
        }

        let updatedDeal = dealPayload.item as typeof initialDeal;

        if (stageId !== updatedDeal.stage.id) {
          const stageResponse = await fetch(`/api/deals/${deal.id}/stage`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ stageId }),
          });

          const stagePayload = await stageResponse.json();

          if (!stageResponse.ok) {
            setError(stagePayload.error?.message ?? "Could not update the deal stage.");
            return;
          }

          updatedDeal = {
            ...updatedDeal,
            stage: stagePayload.item.stage,
          };
        }

        setDeal((currentDeal) => ({
          ...currentDeal,
          ...updatedDeal,
          pipeline: currentDeal.pipeline,
        }));
        setStageId(updatedDeal.stage.id);
        setTitle(updatedDeal.title);
        setAmount(updatedDeal.amount?.toString() ?? "");
        setOwnerId(updatedDeal.owner?.id ?? "");
        setCloseDate(formatDateInput(updatedDeal.closeDate));
        setMessage("Deal details saved.");
        router.refresh();
      } catch {
        setError("Could not save deal details.");
      }
    });
  }

  return (
    <div className="page-grid">
      <section className="hero-grid">
        <article className="hero-card">
          <span className="eyebrow">Active deal workflow</span>
          <h2>{deal.title}</h2>
          <p>
            {primaryCompany?.name ?? "Unlinked deal"} · {formatCurrency(deal.amount, deal.currency)} ·{" "}
            {deal.owner?.name ?? "Unassigned owner"}
          </p>
          <div className="meta-row">
            <span className="meta-chip">{deal.pipeline.name}</span>
            <span className="meta-chip">{deal.stage.name}</span>
            <span className="meta-chip">{formatDateLabel(deal.closeDate)}</span>
          </div>
        </article>

        <article className="card">
          <div className="card-head">
            <div>
              <h2>Deal context</h2>
              <p>Key account relationships and the current pipeline position.</p>
            </div>
            <span className="eyebrow">Summary</span>
          </div>

          <div className="fact-grid">
            <div className="fact-card">
              <span className="subtle">Primary account</span>
              <strong>{primaryCompany?.name ?? "No primary company"}</strong>
            </div>
            <div className="fact-card">
              <span className="subtle">Linked contacts</span>
              <strong>{deal.contacts.length}</strong>
            </div>
            <div className="fact-card">
              <span className="subtle">Owner</span>
              <strong>{deal.owner?.name ?? "Unassigned"}</strong>
            </div>
          </div>
        </article>
      </section>

      {error ? <p className="error-banner">{error}</p> : null}
      {message ? <p className="success-banner">{message}</p> : null}

      <section className="details-grid">
        <article className="detail-card">
          <div className="card-head">
            <div>
              <h2>Update deal</h2>
              <p>Edit the owner, target date, amount, and stage from one place.</p>
            </div>
            <span className="eyebrow">Editable</span>
          </div>

          <div className="field-grid">
            <label className="field-stack">
              <span className="subtle">Deal title</span>
              <input
                className="input-shell"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />
            </label>

            <label className="field-stack">
              <span className="subtle">Owner</span>
              <select
                className="input-shell"
                value={ownerId}
                onChange={(event) => setOwnerId(event.target.value)}
              >
                <option value="">Unassigned</option>
                {ownerOptions.map((owner) => (
                  <option key={owner.id} value={owner.id}>
                    {owner.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="field-stack">
              <span className="subtle">Stage</span>
              <select
                className="input-shell"
                value={stageId}
                onChange={(event) => setStageId(event.target.value)}
              >
                {stageOptions.map((stage) => (
                  <option key={stage.id} value={stage.id}>
                    {stage.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="field-stack">
              <span className="subtle">Amount</span>
              <input
                className="input-shell"
                inputMode="decimal"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
              />
            </label>

            <label className="field-stack">
              <span className="subtle">Close date</span>
              <input
                className="input-shell"
                type="date"
                value={closeDate}
                onChange={(event) => setCloseDate(event.target.value)}
              />
            </label>
          </div>

          <div className="detail-action-row">
            <button type="button" className="cta-primary" disabled={isPending} onClick={saveDeal}>
              {isPending ? "Saving..." : "Save deal"}
            </button>
          </div>
        </article>

        <article className="detail-card">
          <div className="card-head">
            <div>
              <h2>Related records</h2>
              <p>Core relationship context for the account and buying group.</p>
            </div>
            <span className="eyebrow">Context</span>
          </div>

          <div className="related-section">
            <h3>Companies</h3>
            <div className="record-list">
              {deal.companies.map((company) => (
                <Link key={company.id} href={`/companies/${company.id}`} className="record-row">
                  <div className="record-row-head">
                    <span className="record-title">{company.name}</span>
                    {company.isPrimary ? <span className="tiny-badge">Primary</span> : null}
                  </div>
                  <p className="subtle">{company.domain ?? "No domain"}</p>
                </Link>
              ))}
            </div>
          </div>

          <div className="related-section">
            <h3>Contacts</h3>
            <div className="record-list">
              {deal.contacts.map((contact) => (
                <Link key={contact.id} href={`/contacts/${contact.id}`} className="record-row">
                  <div className="record-row-head">
                    <span className="record-title">{contact.name}</span>
                    <span className="tiny-badge">Contact</span>
                  </div>
                  <p className="subtle">{contact.email ?? "No email"}</p>
                </Link>
              ))}
            </div>
          </div>
        </article>
      </section>

      <RecordEngagementPanel
        targetType="deal"
        targetId={deal.id}
        timeline={engagement.timeline}
        tasks={engagement.tasks}
        ownerOptions={ownerOptions}
      />
    </div>
  );
}
