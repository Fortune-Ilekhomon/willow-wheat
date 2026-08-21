"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const payload = {
      name: formData.get("name"),
      email: formData.get("email"),
      password: formData.get("password"),
      phone: formData.get("phone") || undefined,
    };

    const response = await fetch("/api/auth/register", {
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
            Create an account
          </h1>
          <p className="mt-2 text-sm text-text-secondary">
            An account is entirely optional. You can order as a guest and
            still track your order — this just saves your details for next
            time.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-lg border border-border bg-surface p-8"
        >
          <div className="space-y-5">
            <Field label="Name" name="name" type="text" required />
            <Field label="Email" name="email" type="email" required />
            <Field
              label="Phone"
              name="phone"
              type="tel"
              required={false}
              helpText="Optional — used only for order updates"
            />
            <Field
              label="Password"
              name="password"
              type="password"
              required
              helpText="At least 8 characters"
            />
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
            {isSubmitting ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-text-secondary">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-cocoa underline">
            Log in
          </Link>
        </p>
        <p className="mt-2 text-center text-sm text-text-secondary">
          Prefer not to register?{" "}
          <Link href="/" className="font-medium text-cocoa underline">
            Continue as guest
          </Link>
        </p>
      </div>
    </main>
  );
}

function Field({
  label,
  name,
  type,
  required,
  helpText,
}: {
  label: string;
  name: string;
  type: string;
  required: boolean;
  helpText?: string;
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="block text-sm font-medium text-text-primary"
      >
        {label}
        {!required && (
          <span className="ml-1 font-normal text-text-secondary">
            (optional)
          </span>
        )}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        className="mt-1.5 block w-full rounded-md border border-border bg-white px-3 py-2.5 text-sm text-text-primary focus:border-cocoa focus:outline-none focus:ring-1 focus:ring-cocoa"
      />
      {helpText && (
        <p className="mt-1 text-xs text-text-secondary">{helpText}</p>
      )}
    </div>
  );
}
