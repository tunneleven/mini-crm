"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import type { ImportResource } from "@/lib/crm/import-export-schemas";

type ImportResult = {
  resource: ImportResource;
  summary: {
    totalRows: number;
    createdRows: number;
    updatedRows: number;
    failedRows: number;
  };
  errors: Array<{
    rowNumber: number;
    message: string;
    fields: string[];
  }>;
};

const resources: Array<{
  resource: ImportResource;
  title: string;
  columns: string;
}> = [
  {
    resource: "contacts",
    title: "Contacts",
    columns: "firstName,lastName,email,phone,title,ownerEmail",
  },
  {
    resource: "companies",
    title: "Companies",
    columns: "name,domain,industry,website,ownerEmail",
  },
  {
    resource: "deals",
    title: "Deals",
    columns: "title,amount,currency,closeDate,ownerEmail,pipelineName,stageName",
  },
];

export function ImportExportPanel() {
  const router = useRouter();
  const [results, setResults] = useState<Record<ImportResource, ImportResult | null>>({
    contacts: null,
    companies: null,
    deals: null,
  });
  const [busyResource, setBusyResource] = useState<ImportResource | null>(null);
  const [error, setError] = useState<string | null>(null);

  const hasResults = useMemo(
    () => Object.values(results).some((value) => value !== null),
    [results],
  );

  async function handleImport(resource: ImportResource, formData: FormData) {
    const file = formData.get("file");

    if (!(file instanceof File)) {
      setError("Choose a CSV file before importing.");
      return;
    }

    setBusyResource(resource);
    setError(null);

    try {
      const upload = new FormData();
      upload.set("file", file);

      const response = await fetch(`/api/import/${resource}`, {
        method: "POST",
        body: upload,
      });

      const payload = await response.json();

      if (!response.ok) {
        setError(payload.error?.message ?? "Import failed.");
        return;
      }

      setResults((current) => ({
        ...current,
        [resource]: payload as ImportResult,
      }));
      router.refresh();
    } catch {
      setError("Import failed.");
    } finally {
      setBusyResource(null);
    }
  }

  return (
    <div className="import-grid">
      {resources.map((entry) => {
        const result = results[entry.resource];
        const busy = busyResource === entry.resource;

        return (
          <article key={entry.resource} className="import-card">
            <div className="card-head">
              <div>
                <h3>{entry.title}</h3>
                <p>Columns: {entry.columns}</p>
              </div>
              <a className="export-link compact" href={`/api/export/${entry.resource}`}>
                Export CSV
              </a>
            </div>

            <form
              className="import-form"
              onSubmit={async (event) => {
                event.preventDefault();
                const formData = new FormData(event.currentTarget);
                await handleImport(entry.resource, formData);
                event.currentTarget.reset();
              }}
            >
              <input className="input-shell" type="file" name="file" accept=".csv,text/csv" />
              <button type="submit" className="cta-primary" disabled={busy}>
                {busy ? "Importing..." : "Import CSV"}
              </button>
            </form>

            {result ? (
              <div className="import-result">
                <div className="metric-row">
                  <span>Rows</span>
                  <span>{result.summary.totalRows}</span>
                </div>
                <div className="metric-row">
                  <span>Created</span>
                  <span>{result.summary.createdRows}</span>
                </div>
                <div className="metric-row">
                  <span>Updated</span>
                  <span>{result.summary.updatedRows}</span>
                </div>
                <div className="metric-row">
                  <span>Errors</span>
                  <span>{result.summary.failedRows}</span>
                </div>
                {result.errors.length > 0 ? (
                  <div className="import-errors">
                    {result.errors.slice(0, 3).map((item) => (
                      <div key={`${item.rowNumber}-${item.message}`} className="import-error-row">
                        <strong>Row {item.rowNumber}</strong>
                        <p>{item.message}</p>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}
          </article>
        );
      })}

      {error ? <p className="error-banner">{error}</p> : null}
      {!hasResults ? <p className="subtle">Run an import to see validation results here.</p> : null}
    </div>
  );
}
