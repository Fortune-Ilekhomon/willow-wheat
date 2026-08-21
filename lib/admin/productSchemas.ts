import { z } from "zod";

// Mirrors ProductCategory in schema.prisma exactly. Kept as an explicit
// list here (rather than importing the Prisma enum into a client-facing
// form schema) so this file has zero Prisma dependency and can be safely
// imported into client components without pulling in @prisma/client.
export const productCategoryValues = [
  "CAKE",
  "CUPCAKE",
  "COOKIE",
  "PASTRY",
  "BREAD",
  "SEASONAL",
  "OTHER",
] as const;

export const complexityLevelValues = [
  "LEVEL_1_STANDARD",
  "LEVEL_2_MODERATE",
  "LEVEL_3_COMPLEX",
] as const;

export const sizeOptionSchema = z.object({
  id: z.string().optional(), // present when editing an existing size, absent for a new one
  label: z.string().min(1, "Size label is required").max(100),
  priceModifier: z.coerce.number().default(0),
  productionUnitModifier: z.coerce.number().int().default(0),
});

// Production units, prep days, complexity, and minimum notice are the
// numbers the Capacity Engine depends on (Rules doc §1) — required, not
// optional, and constrained to sane ranges. A product cannot be saved
// without them because an unconfigured product would silently break
// capacity math the moment a customer tried to order it.
export const productionRuleSchema = z.object({
  productionUnits: z.coerce
    .number()
    .int()
    .min(1, "Must be at least 1 production unit")
    .max(100, "That seems too high — check the value"),
  preparationDays: z.coerce
    .number()
    .int()
    .min(0, "Cannot be negative")
    .max(60, "That seems too high — check the value"),
  complexityLevel: z.enum(complexityLevelValues),
  minimumNoticeDays: z.coerce
    .number()
    .int()
    .min(0, "Cannot be negative")
    .max(365, "That seems too high — check the value"),
});

export const productSchema = z.object({
  name: z.string().min(1, "Product name is required").max(200),
  description: z.string().min(1, "Description is required").max(2000),
  category: z.enum(productCategoryValues),
  basePrice: z.coerce.number().min(0, "Price cannot be negative"),
  images: z.array(z.string().url()).default([]),
  isActive: z.boolean().default(true),
  sizeOptions: z
    .array(sizeOptionSchema)
    .min(1, "Add at least one size option"),
  productionRule: productionRuleSchema,
});

export type ProductInput = z.infer<typeof productSchema>;
export type SizeOptionInput = z.infer<typeof sizeOptionSchema>;
export type ProductionRuleInput = z.infer<typeof productionRuleSchema>;
