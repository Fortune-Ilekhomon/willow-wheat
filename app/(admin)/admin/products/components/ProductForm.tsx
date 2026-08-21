"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createProduct, updateProduct } from "@/lib/admin/products";
import {
  productCategoryValues,
  complexityLevelValues,
} from "@/lib/admin/productSchemas";
import { ImageUploader } from "./ImageUploader";

const CATEGORY_LABELS: Record<string, string> = {
  CAKE: "Cake",
  CUPCAKE: "Cupcake",
  COOKIE: "Cookie",
  PASTRY: "Pastry",
  BREAD: "Bread",
  SEASONAL: "Seasonal",
  OTHER: "Other",
};

const COMPLEXITY_LABELS: Record<string, string> = {
  LEVEL_1_STANDARD: "Level 1 — Standard (auto-scheduled)",
  LEVEL_2_MODERATE: "Level 2 — Moderate (auto-scheduled)",
  LEVEL_3_COMPLEX: "Level 3 — Complex (requires your approval)",
};

interface SizeOptionRow {
  id?: string;
  label: string;
  priceModifier: string;
  productionUnitModifier: string;
}

interface ProductFormProps {
  mode: "create" | "edit";
  productId?: string;
  initialValues?: {
    name: string;
    description: string;
    category: string;
    basePrice: string;
    images: string[];
    isActive: boolean;
    sizeOptions: SizeOptionRow[];
    productionUnits: string;
    preparationDays: string;
    complexityLevel: string;
    minimumNoticeDays: string;
  };
}

// One form for both create and edit rather than two near-identical
// components — the only real difference between them is which server
// action gets called on submit and what the fields start out as. Splitting
// this into ProductCreateForm and ProductEditForm would mean every future
// field addition has to be made twice and would drift out of sync.
export function ProductForm({ mode, productId, initialValues }: ProductFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [name, setName] = useState(initialValues?.name ?? "");
  const [description, setDescription] = useState(initialValues?.description ?? "");
  const [category, setCategory] = useState(initialValues?.category ?? "CAKE");
  const [basePrice, setBasePrice] = useState(initialValues?.basePrice ?? "");
  const [images, setImages] = useState<string[]>(initialValues?.images ?? []);
  const [isActive, setIsActive] = useState(initialValues?.isActive ?? true);
  const [sizeOptions, setSizeOptions] = useState<SizeOptionRow[]>(
    initialValues?.sizeOptions ?? [
      { label: "", priceModifier: "0", productionUnitModifier: "0" },
    ]
  );
  const [productionUnits, setProductionUnits] = useState(
    initialValues?.productionUnits ?? ""
  );
  const [preparationDays, setPreparationDays] = useState(
    initialValues?.preparationDays ?? ""
  );
  const [complexityLevel, setComplexityLevel] = useState(
    initialValues?.complexityLevel ?? "LEVEL_1_STANDARD"
  );
  const [minimumNoticeDays, setMinimumNoticeDays] = useState(
    initialValues?.minimumNoticeDays ?? ""
  );

  function updateSizeOption(index: number, patch: Partial<SizeOptionRow>) {
    setSizeOptions((current) =>
      current.map((size, i) => (i === index ? { ...size, ...patch } : size))
    );
  }

  function addSizeOption() {
    setSizeOptions((current) => [
      ...current,
      { label: "", priceModifier: "0", productionUnitModifier: "0" },
    ]);
  }

  function removeSizeOption(index: number) {
    setSizeOptions((current) => current.filter((_, i) => i !== index));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const payload = {
      name,
      description,
      category: category as (typeof productCategoryValues)[number],
      basePrice: Number(basePrice),
      images,
      isActive,
      sizeOptions: sizeOptions
        .filter((size) => size.label.trim().length > 0)
        .map((size) => ({
          id: size.id,
          label: size.label,
          priceModifier: Number(size.priceModifier || 0),
          productionUnitModifier: Number(size.productionUnitModifier || 0),
        })),
      productionRule: {
        productionUnits: Number(productionUnits),
        preparationDays: Number(preparationDays),
        complexityLevel:
          complexityLevel as (typeof complexityLevelValues)[number],
        minimumNoticeDays: Number(minimumNoticeDays),
      },
    };

    try {
      if (mode === "create") {
        await createProduct(payload);
      } else if (productId) {
        await updateProduct(productId, payload);
      }
      router.push("/admin/products");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong saving this product. Try again."
      );
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <section className="rounded-lg border border-border bg-surface p-6">
        <h2 className="font-display text-lg font-semibold text-cocoa">
          Product details
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          What the customer sees in the catalogue.
        </p>

        <div className="mt-5 space-y-5">
          <TextField
            label="Name"
            value={name}
            onChange={setName}
            required
            placeholder="e.g. Chocolate Buttercream Celebration Cake"
          />

          <div>
            <label className="block text-sm font-medium text-text-primary">
              Description
            </label>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              required
              rows={4}
              className="mt-1 w-full rounded-md border border-border bg-page-bg px-3 py-2 text-sm text-text-primary focus:border-cocoa focus:outline-none focus:ring-1 focus:ring-cocoa"
            />
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-text-primary">
                Category
              </label>
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="mt-1 w-full rounded-md border border-border bg-page-bg px-3 py-2 text-sm text-text-primary focus:border-cocoa focus:outline-none focus:ring-1 focus:ring-cocoa"
              >
                {productCategoryValues.map((value) => (
                  <option key={value} value={value}>
                    {CATEGORY_LABELS[value]}
                  </option>
                ))}
              </select>
            </div>

            <TextField
              label="Base price ($)"
              value={basePrice}
              onChange={setBasePrice}
              required
              type="number"
              step="0.01"
              min="0"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-text-primary">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(event) => setIsActive(event.target.checked)}
              className="h-4 w-4 rounded border-border text-cocoa focus:ring-cocoa"
            />
            Visible in the customer catalogue
          </label>

          <ImageUploader images={images} onChange={setImages} />
        </div>
      </section>

      <section className="rounded-lg border border-border bg-surface p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg font-semibold text-cocoa">
              Sizes
            </h2>
            <p className="mt-1 text-sm text-text-secondary">
              Each size can add or subtract from the base price and
              production units — a larger cake costs more capacity, not
              just more money.
            </p>
          </div>
          <button
            type="button"
            onClick={addSizeOption}
            className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-cocoa transition hover:bg-cream"
          >
            Add size
          </button>
        </div>

        <div className="mt-5 space-y-3">
          {sizeOptions.map((size, index) => (
            <div
              key={index}
              className="grid grid-cols-1 gap-3 rounded-md border border-border p-4 sm:grid-cols-[2fr_1fr_1fr_auto]"
            >
              <TextField
                label="Size label"
                value={size.label}
                onChange={(value) => updateSizeOption(index, { label: value })}
                placeholder='e.g. "6-inch" or "Serves 20"'
                compact
              />
              <TextField
                label="Price +/-"
                value={size.priceModifier}
                onChange={(value) =>
                  updateSizeOption(index, { priceModifier: value })
                }
                type="number"
                step="0.01"
                compact
              />
              <TextField
                label="Units +/-"
                value={size.productionUnitModifier}
                onChange={(value) =>
                  updateSizeOption(index, { productionUnitModifier: value })
                }
                type="number"
                step="1"
                compact
              />
              <div className="flex items-end">
                {sizeOptions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeSizeOption(index)}
                    className="text-sm font-medium text-error underline"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-border bg-surface p-6">
        <h2 className="font-display text-lg font-semibold text-cocoa">
          Production rules
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          What this product costs your production capacity. These numbers
          drive automatic scheduling, per your Capacity Settings.
        </p>

        <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <TextField
            label="Base production units"
            value={productionUnits}
            onChange={setProductionUnits}
            required
            type="number"
            min="1"
            helpText="Workload score, not hours — set relative to your other products"
          />
          <TextField
            label="Preparation days"
            value={preparationDays}
            onChange={setPreparationDays}
            required
            type="number"
            min="0"
            helpText="Standard lead time to produce one of these"
          />
          <TextField
            label="Minimum notice (days)"
            value={minimumNoticeDays}
            onChange={setMinimumNoticeDays}
            required
            type="number"
            min="0"
            helpText="Earliest a customer can request this before the date"
          />
          <div>
            <label className="block text-sm font-medium text-text-primary">
              Complexity level
            </label>
            <select
              value={complexityLevel}
              onChange={(event) => setComplexityLevel(event.target.value)}
              className="mt-1 w-full rounded-md border border-border bg-page-bg px-3 py-2 text-sm text-text-primary focus:border-cocoa focus:outline-none focus:ring-1 focus:ring-cocoa"
            >
              {complexityLevelValues.map((value) => (
                <option key={value} value={value}>
                  {COMPLEXITY_LABELS[value]}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-text-secondary">
              Level 3 orders wait for your review before production begins.
            </p>
          </div>
        </div>
      </section>

      {error && (
        <p className="rounded-md bg-error/10 px-3 py-2 text-sm text-error">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-cocoa px-5 py-2.5 text-sm font-medium text-white transition hover:bg-cocoa/90 disabled:opacity-60"
        >
          {isSubmitting
            ? "Saving…"
            : mode === "create"
              ? "Add product"
              : "Save changes"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/products")}
          className="rounded-md border border-border px-5 py-2.5 text-sm font-medium text-text-primary transition hover:bg-page-bg"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function TextField({
  label,
  value,
  onChange,
  required,
  type = "text",
  step,
  min,
  placeholder,
  helpText,
  compact,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: string;
  step?: string;
  min?: string;
  placeholder?: string;
  helpText?: string;
  compact?: boolean;
}) {
  return (
    <div>
      <label className={`block font-medium text-text-primary ${compact ? "text-xs" : "text-sm"}`}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        step={step}
        min={min}
        placeholder={placeholder}
        className={`mt-1 w-full rounded-md border border-border bg-page-bg text-text-primary focus:border-cocoa focus:outline-none focus:ring-1 focus:ring-cocoa ${
          compact ? "px-2.5 py-1.5 text-sm" : "px-3 py-2 text-sm"
        }`}
      />
      {helpText && (
        <p className="mt-1 text-xs text-text-secondary">{helpText}</p>
      )}
    </div>
  );
}
