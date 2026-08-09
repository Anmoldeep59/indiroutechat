"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { getFirebaseAuthErrorMessage } from "@/lib/auth-errors";
import { auth } from "@/lib/firebase";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const fieldClassName =
  "mt-1.5 min-h-11 w-full rounded-md border border-border bg-background px-3.5 text-sm text-brand outline-none transition-colors placeholder:text-brand-muted/60 focus:border-accent focus:ring-2 focus:ring-accent/25 disabled:cursor-not-allowed disabled:opacity-60";

const fieldErrorClassName =
  "mt-1.5 min-h-11 w-full rounded-md border border-red-500 bg-background px-3.5 text-sm text-brand outline-none transition-colors placeholder:text-brand-muted/60 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 disabled:cursor-not-allowed disabled:opacity-60";

const labelClassName = "block text-sm font-semibold tracking-tight text-brand";

export function ForgotPasswordForm() {
  const [emailError, setEmailError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();

    setEmailError(null);
    setFormError(null);
    setSuccessMessage(null);

    if (!email) {
      setEmailError("Email address is required.");
      return;
    }

    if (!EMAIL_PATTERN.test(email)) {
      setEmailError("Please enter a valid email address.");
      return;
    }

    setIsSubmitting(true);

    try {
      await sendPasswordResetEmail(auth, email);
      setSuccessMessage(
        "If an account exists for that email, a password reset link has been sent.",
      );
    } catch (error) {
      setFormError(getFirebaseAuthErrorMessage(error, "login"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-5">
      {formError ? (
        <p
          className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {formError}
        </p>
      ) : null}

      {successMessage ? (
        <p
          className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
          role="status"
        >
          {successMessage}
        </p>
      ) : null}

      <div>
        <label htmlFor="reset-email" className={labelClassName}>
          Email Address
        </label>
        <input
          id="reset-email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="you@example.com"
          disabled={isSubmitting}
          aria-invalid={Boolean(emailError)}
          aria-describedby={emailError ? "reset-email-error" : undefined}
          className={emailError ? fieldErrorClassName : fieldClassName}
        />
        {emailError ? (
          <p
            id="reset-email-error"
            className="mt-1.5 text-sm text-red-600"
            role="alert"
          >
            {emailError}
          </p>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-accent px-5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting ? "Sending reset link..." : "Send Reset Link"}
      </button>

      <p className="text-center text-sm text-brand-muted">
        Remembered your password?{" "}
        <Link
          href="/login"
          className="font-semibold text-accent transition-colors hover:text-accent-hover"
        >
          Sign In
        </Link>
      </p>
    </form>
  );
}
