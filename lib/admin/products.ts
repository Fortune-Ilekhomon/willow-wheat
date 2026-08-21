"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { requireAdminSession } from "@/lib/admin/requireAdmin";
import { productSchema, type ProductInput } from "@/lib/admin/productSchemas";
import { slugify } from "@/lib/admin/slug";

export async function listProducts() {
  await requireAdminSession();

  return prisma.product.findMany({
    include: { productionRule: true, sizeOptions: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getProductById(id: string) {
  await requireAdminSession();

  return prisma.product.findUnique({
    where: { id },
    include: { productionRule: true, sizeOptions: true },
  });
}

// Slug collisions happen in practice — "Chocolate Cake" and "Chocolate
// Cake!" both slugify to "chocolate-cake". Rather than reject the save and
// force the owner to manually invent a different name, append a numeric
// suffix automatically, same pattern most CMS products use.
async function generateUniqueSlug(name: string, excludeProductId?: string): Promise<string> {
  const base = slugify(name);
  let candidate = base;
  let suffix = 1;

  while (true) {
    const existing = await prisma.product.findUnique({ where: { slug: candidate } });
    if (!existing || existing.id === excludeProductId) {
      return candidate;
    }
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }
}

// Creates a Product, its ProductionRule, and its ProductSizeOption rows in
// one transaction. All three must exist together or not at all — a
// Product with no ProductionRule is exactly the "unconfigured product
// silently breaks capacity math" scenario the schema comments warn about,
// so this function makes that state unreachable rather than relying on
// admin discipline to always fill in the second step.
export async function createProduct(input: ProductInput) {
  await requireAdminSession();

  const parsed = productSchema.parse(input);
  const slug = await generateUniqueSlug(parsed.name);

  const product = await prisma.$transaction(async (tx) => {
    return tx.product.create({
      data: {
        name: parsed.name,
        slug,
        description: parsed.description,
        category: parsed.category,
        basePrice: parsed.basePrice,
        images: parsed.images,
        isActive: parsed.isActive,
        productionRule: {
          create: {
            productionUnits: parsed.productionRule.productionUnits,
            preparationDays: parsed.productionRule.preparationDays,
            complexityLevel: parsed.productionRule.complexityLevel,
            minimumNoticeDays: parsed.productionRule.minimumNoticeDays,
          },
        },
        sizeOptions: {
          create: parsed.sizeOptions.map((size) => ({
            label: size.label,
            priceModifier: size.priceModifier,
            productionUnitModifier: size.productionUnitModifier,
          })),
        },
      },
      include: { productionRule: true, sizeOptions: true },
    });
  });

  revalidatePath("/admin/products");
  return product;
}

// Updating size options is a replace-all rather than a diff, because the
// admin form does not track which existing size rows were removed versus
// edited versus left alone — it just submits the current full list. Given
// this is Phase 2 (no live orders referencing these size options yet in
// practice), replace-all is the simpler correct choice. Once Phase 3
// orders exist and OrderItem.sizeOptionId references live rows, this
// function's delete-and-recreate approach would orphan foreign keys —
// revisit this to a real diff before Phase 3 ordering goes live.
export async function updateProduct(productId: string, input: ProductInput) {
  await requireAdminSession();

  const parsed = productSchema.parse(input);
  const slug = await generateUniqueSlug(parsed.name, productId);

  const product = await prisma.$transaction(async (tx) => {
    await tx.productSizeOption.deleteMany({ where: { productId } });

    return tx.product.update({
      where: { id: productId },
      data: {
        name: parsed.name,
        slug,
        description: parsed.description,
        category: parsed.category,
        basePrice: parsed.basePrice,
        images: parsed.images,
        isActive: parsed.isActive,
        productionRule: {
          upsert: {
            create: {
              productionUnits: parsed.productionRule.productionUnits,
              preparationDays: parsed.productionRule.preparationDays,
              complexityLevel: parsed.productionRule.complexityLevel,
              minimumNoticeDays: parsed.productionRule.minimumNoticeDays,
            },
            update: {
              productionUnits: parsed.productionRule.productionUnits,
              preparationDays: parsed.productionRule.preparationDays,
              complexityLevel: parsed.productionRule.complexityLevel,
              minimumNoticeDays: parsed.productionRule.minimumNoticeDays,
            },
          },
        },
        sizeOptions: {
          create: parsed.sizeOptions.map((size) => ({
            label: size.label,
            priceModifier: size.priceModifier,
            productionUnitModifier: size.productionUnitModifier,
          })),
        },
      },
      include: { productionRule: true, sizeOptions: true },
    });
  });

  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${productId}`);
  return product;
}

// Soft-disable only — matches the schema comment on Product.isActive.
// Hard deletion is never exposed because OrderItem.productId references
// this row; deleting it would corrupt historical order records the moment
// Phase 3 orders exist. An inactive product simply stops appearing in the
// customer catalogue while its order history stays intact.
export async function setProductActive(productId: string, isActive: boolean) {
  await requireAdminSession();

  const product = await prisma.product.update({
    where: { id: productId },
    data: { isActive },
  });

  revalidatePath("/admin/products");
  return product;
}
