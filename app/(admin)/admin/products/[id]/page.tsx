import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductById } from "@/lib/admin/products";
import { ProductForm } from "../components/ProductForm";
import { DeactivateProductButton } from "../components/DeactivateProductButton";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProductById(id);

  if (!product) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/admin/products"
        className="text-sm font-medium text-cocoa underline"
      >
        ← Back to products
      </Link>

      <div className="mt-4 flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-cocoa">
            Edit {product.name}
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Changes apply to future orders. Past orders keep the production
            units that were frozen when they were placed.
          </p>
        </div>
        <DeactivateProductButton
          productId={product.id}
          isActive={product.isActive}
        />
      </div>

      <div className="mt-8">
        <ProductForm
          mode="edit"
          productId={product.id}
          initialValues={{
            name: product.name,
            description: product.description,
            category: product.category,
            basePrice: product.basePrice.toString(),
            images: product.images,
            isActive: product.isActive,
            sizeOptions: product.sizeOptions.map((size) => ({
              id: size.id,
              label: size.label,
              priceModifier: size.priceModifier.toString(),
              productionUnitModifier: size.productionUnitModifier.toString(),
            })),
            productionUnits:
              product.productionRule?.productionUnits.toString() ?? "",
            preparationDays:
              product.productionRule?.preparationDays.toString() ?? "",
            complexityLevel:
              product.productionRule?.complexityLevel ?? "LEVEL_1_STANDARD",
            minimumNoticeDays:
              product.productionRule?.minimumNoticeDays.toString() ?? "",
          }}
        />
      </div>
    </div>
  );
}
