import Link from "next/link";
import { ProductForm } from "../components/ProductForm";

export default function NewProductPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/admin/products"
        className="text-sm font-medium text-cocoa underline"
      >
        ← Back to products
      </Link>

      <h1 className="mt-4 font-display text-2xl font-semibold text-cocoa">
        Add product
      </h1>
      <p className="mt-1 text-sm text-text-secondary">
        Every product needs production rules before it can be scheduled
        against real capacity — both are set here together.
      </p>

      <div className="mt-8">
        <ProductForm mode="create" />
      </div>
    </div>
  );
}
