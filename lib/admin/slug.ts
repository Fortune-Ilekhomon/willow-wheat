// Product.slug is unique and customer-facing (used in catalogue URLs from
// Phase 3 onward). Generated from the name at creation time rather than
// asked for directly in the admin form — the owner should not have to
// think about URL-safe formatting when naming a cake.
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
