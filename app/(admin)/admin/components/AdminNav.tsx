"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutButton } from "../LogoutButton";

// Named for what each screen answers, not for generic CRUD nouns — per
// the Build Prompt's "Avoid Generic SaaS Patterns" instruction: this is
// "Production Overview" rather than "Dashboard", "Capacity" rather than
// "Settings", because the owner should recognize the business question
// each link answers before clicking it.
const NAV_ITEMS = [
  { href: "/admin", label: "Production Overview" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/capacity", label: "Capacity" },
] as const;

export function AdminNav() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-border bg-surface lg:flex">
      <div className="border-b border-border px-6 py-6">
        <p className="font-display text-lg font-semibold text-cocoa">
          Willow &amp; Wheat
        </p>
        <p className="text-xs text-text-secondary">Bakery operations</p>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-md px-3 py-2 text-sm font-medium transition ${
                isActive
                  ? "bg-cream text-cocoa"
                  : "text-text-secondary hover:bg-page-bg hover:text-text-primary"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border px-6 py-4">
        <LogoutButton />
      </div>
    </aside>
  );
}
