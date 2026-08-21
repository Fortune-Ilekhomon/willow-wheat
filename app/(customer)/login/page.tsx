"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
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

    setIsSubmitting(false);

    if (!response.ok) {
      const data = await response.json();
      setError(data.error ?? "Something went wrong. Try again.");
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="font-display text-3xl font-semibold text-cocoa">
            Welcome back
          </h1>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-lg border border-border bg-surface p-8"
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

        <p className="mt-6 text-center text-sm text-text-secondary">
          Do not have an account?{" "}
          <Link href="/register" className="font-medium text-cocoa underline">
            Create one
          </Link>
        </p>
        <p className="mt-2 text-center text-sm text-text-secondary">
          Or{" "}
          <Link href="/" className="font-medium text-cocoa underline">
            continue as guest
          </Link>
        </p>
      </div>
    </main>
  );
}
