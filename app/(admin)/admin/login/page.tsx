"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const payload = {
      email: formData.get("email"),
      password: formData.get("password"),
    };

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    setIsSubmitting(false);

    if (!response.ok) {
      setError(data.error ?? "Something went wrong. Try again.");
      return;
    }

    if (data.user.accountType !== "ADMIN") {
      // A customer account credential pair happened to be valid, but this
      // door is admin-only. Do not sign them into an admin session that
      // the middleware would reject anyway on the next request.
      setError("This account does not have dashboard access.");
      return;
    }

    const redirectTo = searchParams.get("redirectTo") ?? "/admin";
    router.push(redirectTo);
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-cocoa px-4 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="font-display text-2xl font-semibold text-cream">
            Willow &amp; Wheat
          </h1>
          <p className="mt-1 text-sm text-cream/70">Production dashboard</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-lg bg-surface p-8 shadow-sm"
        >
          <div className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-text-primary"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoFocus
                className="mt-1.5 block w-full rounded-md border border-border bg-white px-3 py-2.5 text-sm text-text-primary focus:border-cocoa focus:outline-none focus:ring-1 focus:ring-cocoa"
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-text-primary"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="mt-1.5 block w-full rounded-md border border-border bg-white px-3 py-2.5 text-sm text-text-primary focus:border-cocoa focus:outline-none focus:ring-1 focus:ring-cocoa"
              />
            </div>
          </div>

          {error && (
            <p className="mt-4 rounded-md bg-error/10 px-3 py-2 text-sm text-error">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-6 w-full rounded-md bg-cocoa px-4 py-3 text-sm font-medium text-white transition hover:bg-cocoa/90 disabled:opacity-60"
          >
            {isSubmitting ? "Logging in…" : "Log in"}
          </button>
        </form>
      </div>
    </main>
  );
}
