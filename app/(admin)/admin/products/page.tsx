import Link from "next/link";
import { listProducts } from "@/lib/admin/products";
import { StatusBadge } from "../components/StatusBadge";

const COMPLEXITY_LABELS: Record<string, string> = {
  LEVEL_1_STANDARD: "Standard",
  LEVEL_2_MODERATE: "Moderate",
  LEVEL_3_COMPLEX: "Complex",
};

// A list, not a generic "Products" table with every column crammed in —
// per the Build Prompt's instruction to answer a real business question
// per screen. The question this answers is "what am I selling and what
// does each thing cost me to produce", so production units and complexity
// are visible here, not hidden behind a click into each product.
export default async function ProductsPage() {
  const products = await listProducts();

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-cocoa">
            Products
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            What you sell, and what each item costs your production capacity.
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="rounded-md bg-cocoa px-4 py-2 text-sm font-medium text-white transition hover:bg-cocoa/90"
        >
          Add product
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed border-border bg-surface p-10 text-center">
          <p className="text-sm text-text-secondary">
            No products yet. Add your first product to start configuring how
            it affects production capacity.
          </p>
          <Link
            href="/admin/products/new"
            className="mt-4 inline-block rounded-md bg-cocoa px-4 py-2 text-sm font-medium text-white transition hover:bg-cocoa/90"
          >
            Add product
          </Link>
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-lg border border-border bg-surface">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-page-bg text-xs uppercase tracking-wide text-text-secondary">
              <tr>
                <th className="px-5 py-3 font-medium">Product</th>
                <th className="px-5 py-3 font-medium">Category</th>
                <th className="px-5 py-3 font-medium">Production units</th>
                <th className="px-5 py-3 font-medium">Complexity</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {products.map((product) => (
                <tr key={product.id}>
                  <td className="px-5 py-4">
                    <p className="font-medium text-text-primary">
                      {product.name}
                    </p>
                    <p className="text-xs text-text-secondary">
                      ${product.basePrice.toString()} base
                    </p>
                  </td>
                  <td className="px-5 py-4 text-text-secondary">
                    {product.category}
                  </td>
                  <td className="px-5 py-4 text-text-secondary">
                    {product.productionRule
                      ? product.productionRule.productionUnits
                      : "—"}
                  </td>
                  <td className="px-5 py-4 text-text-secondary">
                    {product.productionRule
                      ? COMPLEXITY_LABELS[product.productionRule.complexityLevel]
                      : "—"}
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge
                      label={product.isActive ? "Active" : "Inactive"}
                      tone={product.isActive ? "success" : "neutral"}
                    />
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Link
                      href={`/admin/products/${product.id}`}
                      className="text-sm font-medium text-cocoa underline"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
