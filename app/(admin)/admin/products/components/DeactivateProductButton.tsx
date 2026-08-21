"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setProductActive } from "@/lib/admin/products";

// Soft toggle, not delete — see the comment on setProductActive in
// lib/admin/products.ts for why. Placed at the top of the edit page
// (rather than inside the form) since it is not a form field the admin
// "saves"; it takes effect immediately, matching how a real bakery owner
// would think about "take this off the menu" as a distinct, instant
// action from editing the recipe details.
export function DeactivateProductButton({
  productId,
  isActive,
}: {
  productId: string;
  isActive: boolean;
}) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  async function handleToggle() {
    setIsPending(true);
    try {
      await setProductActive(productId, !isActive);
      router.refresh();
    } finally {
      setIsPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isPending}
      className={`whitespace-nowrap rounded-md border px-3 py-1.5 text-sm font-medium transition disabled:opacity-60 ${
        isActive
          ? "border-error text-error hover:bg-error/10"
          : "border-success text-success hover:bg-success/10"
      }`}
    >
      {isPending
        ? "Updating…"
        : isActive
          ? "Remove from catalogue"
          : "Restore to catalogue"}
    </button>
  );
}
