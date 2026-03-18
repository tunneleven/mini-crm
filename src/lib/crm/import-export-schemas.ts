import { z } from "zod";

const importResourceSchema = z.enum(["contacts", "companies", "deals"]);

const optionalText = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().trim().max(255).optional(),
);

const optionalEmail = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().trim().email().optional(),
);

const optionalDateText = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().trim().optional(),
);

const optionalAmount = z.preprocess(
  (value) => {
    if (typeof value === "string" && value.trim() === "") {
      return undefined;
    }

    return value;
  },
  z.coerce.number().finite().nonnegative().optional(),
);

const optionalCurrency = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().trim().length(3).optional(),
);

export const importQuerySchema = z.object({
  includeArchived: z
    .preprocess((value) => {
      if (value === "true" || value === true) {
        return true;
      }

      return false;
    }, z.boolean())
    .optional()
    .default(false),
});

export const contactImportRowSchema = z.object({
  firstName: z.string().trim().min(1).max(120),
  lastName: optionalText,
  email: optionalEmail,
  phone: optionalText,
  title: optionalText,
  ownerEmail: optionalEmail,
});

export const companyImportRowSchema = z.object({
  name: z.string().trim().min(1).max(160),
  domain: optionalText,
  industry: optionalText,
  website: optionalText,
  ownerEmail: optionalEmail,
});

export const dealImportRowSchema = z.object({
  title: z.string().trim().min(1).max(160),
  amount: optionalAmount,
  currency: optionalCurrency,
  closeDate: optionalDateText,
  ownerEmail: optionalEmail,
  pipelineName: optionalText,
  stageName: optionalText,
});

export const importResourceSchemas = {
  contacts: contactImportRowSchema,
  companies: companyImportRowSchema,
  deals: dealImportRowSchema,
} as const;

export type ImportResource = z.infer<typeof importResourceSchema>;
export type ContactImportRowInput = z.infer<typeof contactImportRowSchema>;
export type CompanyImportRowInput = z.infer<typeof companyImportRowSchema>;
export type DealImportRowInput = z.infer<typeof dealImportRowSchema>;
export type ImportQueryInput = z.infer<typeof importQuerySchema>;

export function parseImportResource(value: string | null | undefined) {
  return importResourceSchema.parse(value);
}
