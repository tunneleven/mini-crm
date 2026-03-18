import { z } from "zod";

function emptyStringToNull(value: unknown) {
  if (typeof value === "string" && value.trim() === "") {
    return null;
  }

  return value;
}

const idSchema = z.string().trim().min(1).max(120);
const booleanQueryValue = z.preprocess((value) => {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();

    if (normalized === "true" || normalized === "1") {
      return true;
    }

    if (normalized === "false" || normalized === "0") {
      return false;
    }
  }

  return value;
}, z.boolean().optional());
const optionalText = z.preprocess(
  emptyStringToNull,
  z.string().trim().max(255).nullable().optional(),
);
const optionalDate = z.preprocess(
  emptyStringToNull,
  z
    .string()
    .datetime({ offset: true })
    .nullable()
    .optional(),
);
const optionalNumber = z.preprocess(
  emptyStringToNull,
  z.coerce.number().finite().nonnegative().nullable().optional(),
);
const optionalStringArray = z.array(idSchema).max(50).optional();
const optionalOwnerId = z.preprocess(emptyStringToNull, idSchema.nullable().optional());
const optionalCurrency = z.string().trim().length(3).optional();

export const collectionQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  includeArchived: booleanQueryValue.default(false),
  limit: z.coerce.number().int().min(1).max(100).optional().default(25),
});

export const searchQuerySchema = z.object({
  q: z.string().trim().min(1).max(120),
  limit: z.coerce.number().int().min(1).max(25).optional().default(5),
});

export const contactCreateSchema = z.object({
  firstName: z.string().trim().min(1).max(120),
  lastName: optionalText,
  email: z.preprocess(emptyStringToNull, z.string().trim().email().nullable().optional()),
  phone: optionalText,
  title: optionalText,
  ownerId: optionalOwnerId,
  companyIds: optionalStringArray,
});

export const contactUpdateSchema = contactCreateSchema.partial();

export const companyCreateSchema = z.object({
  name: z.string().trim().min(1).max(160),
  domain: optionalText,
  industry: optionalText,
  website: optionalText,
  ownerId: optionalOwnerId,
  contactIds: optionalStringArray,
  primaryContactId: optionalOwnerId,
});

export const companyUpdateSchema = companyCreateSchema.partial();

export const dealCreateSchema = z.object({
  title: z.string().trim().min(1).max(160),
  amount: optionalNumber,
  currency: optionalCurrency.default("USD"),
  closeDate: optionalDate,
  ownerId: optionalOwnerId,
  pipelineId: z.preprocess(emptyStringToNull, idSchema.nullable().optional()),
  stageId: z.preprocess(emptyStringToNull, idSchema.nullable().optional()),
  companyIds: optionalStringArray,
  primaryCompanyId: optionalOwnerId,
  contactIds: optionalStringArray,
});

export const dealUpdateSchema = z.object({
  title: z.string().trim().min(1).max(160).optional(),
  amount: optionalNumber,
  currency: optionalCurrency,
  closeDate: optionalDate,
  ownerId: optionalOwnerId,
  companyIds: optionalStringArray,
  primaryCompanyId: optionalOwnerId,
  contactIds: optionalStringArray,
});

export const dealStageUpdateSchema = z.object({
  stageId: idSchema,
});

export type CollectionQueryInput = z.infer<typeof collectionQuerySchema>;
export type SearchQueryInput = z.infer<typeof searchQuerySchema>;
export type ContactCreateInput = z.infer<typeof contactCreateSchema>;
export type ContactUpdateInput = z.infer<typeof contactUpdateSchema>;
export type CompanyCreateInput = z.infer<typeof companyCreateSchema>;
export type CompanyUpdateInput = z.infer<typeof companyUpdateSchema>;
export type DealCreateInput = z.infer<typeof dealCreateSchema>;
export type DealUpdateInput = z.infer<typeof dealUpdateSchema>;
export type DealStageUpdateInput = z.infer<typeof dealStageUpdateSchema>;
