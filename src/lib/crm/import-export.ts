import { ApiError } from "@/lib/api";
import { prisma } from "@/lib/prisma";

import {
  companyImportRowSchema,
  contactImportRowSchema,
  dealImportRowSchema,
  type CompanyImportRowInput,
  type ContactImportRowInput,
  type DealImportRowInput,
  type ImportResource,
} from "@/lib/crm/import-export-schemas";

type CsvRow = Record<string, string>;

type CsvImportError = {
  rowNumber: number;
  message: string;
  fields: string[];
};

type CsvImportResult = {
  resource: ImportResource;
  summary: {
    totalRows: number;
    createdRows: number;
    updatedRows: number;
    failedRows: number;
  };
  errors: CsvImportError[];
};

const contactExportHeaders = [
  "id",
  "firstName",
  "lastName",
  "email",
  "phone",
  "title",
  "ownerName",
  "companyNames",
  "createdAt",
  "updatedAt",
];

const companyExportHeaders = [
  "id",
  "name",
  "domain",
  "industry",
  "website",
  "ownerName",
  "contactNames",
  "createdAt",
  "updatedAt",
];

const dealExportHeaders = [
  "id",
  "title",
  "amount",
  "currency",
  "pipelineName",
  "stageName",
  "ownerName",
  "companyNames",
  "contactNames",
  "closeDate",
  "createdAt",
  "updatedAt",
];

function sanitizeField(value: string | number | boolean | null | undefined) {
  if (value === null || value === undefined) {
    return "";
  }

  const text = String(value).replace(/\r?\n/g, " ");
  return text;
}

function escapeCsvValue(value: string | number | boolean | null | undefined) {
  const text = sanitizeField(value);

  if (text.includes(",") || text.includes('"') || text.includes("\n")) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

function toCsv(headers: string[], rows: Array<Record<string, string | number | boolean | null | undefined>>) {
  const lines = [headers.join(",")];

  for (const row of rows) {
    lines.push(headers.map((header) => escapeCsvValue(row[header])).join(","));
  }

  return `${lines.join("\n")}\n`;
}

function parseCsvLine(line: string) {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];

    if (char === '"') {
      const next = line[index + 1];

      if (inQuotes && next === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      values.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current);
  return values.map((value) => value.trim());
}

function parseCsv(text: string) {
  const normalized = text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").trim();

  if (!normalized) {
    return [];
  }

  const [headerLine, ...rows] = normalized.split("\n").filter((line) => line.trim().length > 0);
  const headers = parseCsvLine(headerLine).map((header) => header.trim());

  return rows.map((line) => {
    const values = parseCsvLine(line);
    return headers.reduce<CsvRow>((record, header, index) => {
      record[header] = values[index] ?? "";
      return record;
    }, {});
  });
}

function buildError(rowNumber: number, message: string, fields: string[] = []) {
  return {
    rowNumber,
    message,
    fields,
  };
}

function fullName(firstName: string, lastName?: string | null) {
  return [firstName, lastName].filter(Boolean).join(" ");
}

function parseDateValue(value?: string) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid date: ${value}`);
  }

  return parsed;
}

function normalizeDomain(value?: string | null) {
  return value?.trim().toLowerCase() ?? null;
}

function normalizeEmail(value?: string | null) {
  return value?.trim().toLowerCase() ?? null;
}

async function resolveOwnerId(workspaceId: string, ownerEmail?: string | null) {
  if (!ownerEmail) {
    return null;
  }

  const owner = await prisma.user.findFirst({
    where: {
      workspaceId,
      email: ownerEmail,
    },
    select: {
      id: true,
    },
  });

  if (!owner) {
    throw new ApiError(400, `Owner ${ownerEmail} was not found in the workspace.`);
  }

  return owner.id;
}

function resourceHeaders(resource: ImportResource) {
  if (resource === "contacts") {
    return contactExportHeaders;
  }

  if (resource === "companies") {
    return companyExportHeaders;
  }

  return dealExportHeaders;
}

export async function exportResourceCsv(workspaceId: string, resource: ImportResource) {
  if (resource === "contacts") {
    const contacts = await prisma.contact.findMany({
      where: {
        workspaceId,
        archivedAt: null,
      },
      include: {
        owner: {
          select: {
            name: true,
          },
        },
        companyLinks: {
          include: {
            company: {
              select: {
                name: true,
              },
            },
          },
          orderBy: [{ isPrimary: "desc" }, { company: { name: "asc" } }],
        },
      },
      orderBy: [{ updatedAt: "desc" }, { firstName: "asc" }],
    });

    return toCsv(
      resourceHeaders(resource),
      contacts.map((contact) => ({
        id: contact.id,
        firstName: contact.firstName,
        lastName: contact.lastName,
        email: contact.email,
        phone: contact.phone,
        title: contact.title,
        ownerName: contact.owner?.name ?? "",
        companyNames: contact.companyLinks.map((link) => link.company.name).join(" | "),
        createdAt: contact.createdAt.toISOString(),
        updatedAt: contact.updatedAt.toISOString(),
      })),
    );
  }

  if (resource === "companies") {
    const companies = await prisma.company.findMany({
      where: {
        workspaceId,
        archivedAt: null,
      },
      include: {
        owner: {
          select: {
            name: true,
          },
        },
        contacts: {
          include: {
            contact: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: [{ isPrimary: "desc" }, { contact: { firstName: "asc" } }],
        },
      },
      orderBy: [{ updatedAt: "desc" }, { name: "asc" }],
    });

    return toCsv(
      resourceHeaders(resource),
      companies.map((company) => ({
        id: company.id,
        name: company.name,
        domain: company.domain,
        industry: company.industry,
        website: company.website,
        ownerName: company.owner?.name ?? "",
        contactNames: company.contacts
          .map((link) => fullName(link.contact.firstName, link.contact.lastName))
          .join(" | "),
        createdAt: company.createdAt.toISOString(),
        updatedAt: company.updatedAt.toISOString(),
      })),
    );
  }

  const deals = await prisma.deal.findMany({
    where: {
      workspaceId,
      archivedAt: null,
    },
    include: {
      owner: {
        select: {
          name: true,
        },
      },
      pipeline: {
        select: {
          name: true,
        },
      },
      stage: {
        select: {
          name: true,
        },
      },
      companies: {
        include: {
          company: {
            select: {
              name: true,
            },
          },
        },
        orderBy: [{ isPrimary: "desc" }, { company: { name: "asc" } }],
      },
      contacts: {
        include: {
          contact: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: {
          contact: {
            firstName: "asc",
          },
        },
      },
    },
    orderBy: [{ updatedAt: "desc" }, { title: "asc" }],
  });

  return toCsv(
    resourceHeaders(resource),
    deals.map((deal) => ({
      id: deal.id,
      title: deal.title,
      amount: deal.amount ? Number(deal.amount) : "",
      currency: deal.currency,
      pipelineName: deal.pipeline.name,
      stageName: deal.stage.name,
      ownerName: deal.owner?.name ?? "",
      companyNames: deal.companies.map((link) => link.company.name).join(" | "),
      contactNames: deal.contacts
        .map((link) => fullName(link.contact.firstName, link.contact.lastName))
        .join(" | "),
      closeDate: deal.closeDate?.toISOString() ?? "",
      createdAt: deal.createdAt.toISOString(),
      updatedAt: deal.updatedAt.toISOString(),
    })),
  );
}

function pickRow<T>(schema: { safeParse: (value: unknown) => { success: boolean; data?: T; error?: { flatten: () => { fieldErrors: Record<string, string[]> } } } }, row: CsvRow, rowNumber: number) {
  const parsed = schema.safeParse(row);

  if (!parsed.success) {
    const fieldErrors = parsed.error?.flatten().fieldErrors ?? {};
    const fields = Object.keys(fieldErrors);
    const message = Object.entries(fieldErrors)
      .map(([field, errors]) => `${field}: ${errors.join(", ")}`)
      .join("; ");

    throw buildError(rowNumber, message || "Row failed validation.", fields);
  }

  return parsed.data as T;
}

async function upsertContact(workspaceId: string, row: ContactImportRowInput) {
  const ownerId = await resolveOwnerId(workspaceId, row.ownerEmail);
  const email = normalizeEmail(row.email);

  if (email) {
    const existing = await prisma.contact.findFirst({
      where: {
        workspaceId,
        normalizedEmail: email,
      },
    });

    if (existing) {
      const updated = await prisma.contact.update({
        where: {
          id: existing.id,
        },
        data: {
          firstName: row.firstName,
          lastName: row.lastName ?? null,
          email: row.email ?? null,
          normalizedEmail: email,
          phone: row.phone ?? null,
          title: row.title ?? null,
          ownerId: ownerId ?? undefined,
        },
      });

      return { action: "updated" as const, id: updated.id };
    }
  }

  const created = await prisma.contact.create({
    data: {
      workspaceId,
      firstName: row.firstName,
      lastName: row.lastName ?? null,
      email: row.email ?? null,
      normalizedEmail: email,
      phone: row.phone ?? null,
      title: row.title ?? null,
      ownerId: ownerId ?? undefined,
    },
  });

  return { action: "created" as const, id: created.id };
}

async function upsertCompany(workspaceId: string, row: CompanyImportRowInput) {
  const ownerId = await resolveOwnerId(workspaceId, row.ownerEmail);
  const domain = normalizeDomain(row.domain);
  const lookup = domain
    ? { workspaceId, domain }
    : { workspaceId, name: row.name };

  const existing = await prisma.company.findFirst({
    where: lookup,
  });

  if (existing) {
    const updated = await prisma.company.update({
      where: {
        id: existing.id,
      },
      data: {
        name: row.name,
        domain: row.domain ?? null,
        industry: row.industry ?? null,
        website: row.website ?? null,
        ownerId: ownerId ?? undefined,
      },
    });

    return { action: "updated" as const, id: updated.id };
  }

  const created = await prisma.company.create({
    data: {
      workspaceId,
      name: row.name,
      domain: row.domain ?? null,
      industry: row.industry ?? null,
      website: row.website ?? null,
      ownerId: ownerId ?? undefined,
    },
  });

  return { action: "created" as const, id: created.id };
}

async function ensurePipelineAndStage(workspaceId: string, row: DealImportRowInput) {
  const pipeline = row.pipelineName
    ? await prisma.pipeline.findFirst({
        where: {
          workspaceId,
          name: row.pipelineName,
        },
        include: {
          stages: {
            orderBy: {
              position: "asc",
            },
          },
        },
      })
    : await prisma.pipeline.findFirst({
        where: {
          workspaceId,
          isDefault: true,
        },
        include: {
          stages: {
            orderBy: {
              position: "asc",
            },
          },
        },
      });

  if (!pipeline) {
    throw new ApiError(400, "No pipeline exists for the workspace.");
  }

  const stage = row.stageName
    ? pipeline.stages.find((candidate) => candidate.name.toLowerCase() === row.stageName?.trim().toLowerCase())
    : pipeline.stages[0];

  if (!stage) {
    throw new ApiError(400, `Stage ${row.stageName ?? "(default)"} does not exist in pipeline ${pipeline.name}.`);
  }

  return { pipelineId: pipeline.id, stageId: stage.id };
}

async function upsertDeal(workspaceId: string, row: DealImportRowInput) {
  const ownerId = await resolveOwnerId(workspaceId, row.ownerEmail);
  const pipelineStage = await ensurePipelineAndStage(workspaceId, row);
  const existing = await prisma.deal.findFirst({
    where: {
      workspaceId,
      title: row.title,
      pipelineId: pipelineStage.pipelineId,
    },
  });

  const data = {
    workspaceId,
    title: row.title,
    amount: row.amount ?? null,
    currency: row.currency?.toUpperCase() ?? "USD",
    closeDate: parseDateValue(row.closeDate),
    ownerId: ownerId ?? undefined,
    pipelineId: pipelineStage.pipelineId,
    stageId: pipelineStage.stageId,
  };

  if (existing) {
    const updated = await prisma.deal.update({
      where: {
        id: existing.id,
      },
      data,
    });

    return { action: "updated" as const, id: updated.id };
  }

  const created = await prisma.deal.create({
    data,
  });

  return { action: "created" as const, id: created.id };
}

export async function importResourceCsv(
  workspaceId: string,
  resource: ImportResource,
  csvText: string,
): Promise<CsvImportResult> {
  const rows = parseCsv(csvText);
  const errors: CsvImportError[] = [];
  let createdRows = 0;
  let updatedRows = 0;

  for (const [index, row] of rows.entries()) {
    const rowNumber = index + 2;

    try {
      if (resource === "contacts") {
        const parsed = pickRow(contactImportRowSchema, row, rowNumber);
        const result = await upsertContact(workspaceId, parsed);
        if (result.action === "created") {
          createdRows += 1;
        } else {
          updatedRows += 1;
        }
        continue;
      }

      if (resource === "companies") {
        const parsed = pickRow(companyImportRowSchema, row, rowNumber);
        const result = await upsertCompany(workspaceId, parsed);
        if (result.action === "created") {
          createdRows += 1;
        } else {
          updatedRows += 1;
        }
        continue;
      }

      const parsed = pickRow(dealImportRowSchema, row, rowNumber);
      const result = await upsertDeal(workspaceId, parsed);
      if (result.action === "created") {
        createdRows += 1;
      } else {
        updatedRows += 1;
      }
    } catch (error) {
      if (error && typeof error === "object" && "rowNumber" in error) {
        errors.push(error as CsvImportError);
      } else if (error instanceof ApiError) {
        errors.push(buildError(rowNumber, error.message));
      } else {
        errors.push(buildError(rowNumber, "Unexpected import failure."));
      }
    }
  }

  return {
    resource,
    summary: {
      totalRows: rows.length,
      createdRows,
      updatedRows,
      failedRows: errors.length,
    },
    errors,
  };
}
