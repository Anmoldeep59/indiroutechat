"use client";

import { useState, type FormEvent } from "react";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  sendEmailVerification,
  updatePassword,
  verifyBeforeUpdateEmail,
} from "firebase/auth";
import { useAuthState } from "@/hooks/useAuthState";
import { getFirebaseAuthErrorMessage } from "@/lib/auth-errors";

const fieldClassName =
  "mt-1.5 min-h-11 w-full rounded-md border border-border bg-background px-3.5 text-sm text-brand outline-none focus:border-accent focus:ring-2 focus:ring-accent/25";

const labelClassName = "block text-sm font-semibold tracking-tight text-brand";

export function ProfileAccountForm() {
  const { user, loading } = useAuthState();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const emailVerified = Boolean(user?.emailVerified);

  async function resendVerification() {
    if (!user) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      await sendEmailVerification(user);
      setMessage("Verification email sent. Check your inbox (and spam folder).");
    } catch (err) {
      setError(getFirebaseAuthErrorMessage(err, "login"));
    } finally {
      setBusy(false);
    }
  }

  async function changeEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user?.email) return;
    const form = new FormData(event.currentTarget);
    const newEmail = String(form.get("newEmail") ?? "").trim();
    const currentPassword = String(form.get("currentPasswordEmail") ?? "");

    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const credential = EmailAuthProvider.credential(
        user.email,
        currentPassword,
      );
      await reauthenticateWithCredential(user, credential);
      await verifyBeforeUpdateEmail(user, newEmail);
      setMessage(
        "Confirmation link sent to the new email. Your address updates after you confirm.",
      );
      event.currentTarget.reset();
    } catch (err) {
      setError(getFirebaseAuthErrorMessage(err, "login"));
    } finally {
      setBusy(false);
    }
  }

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user?.email) return;
    const form = new FormData(event.currentTarget);
    const currentPassword = String(form.get("currentPassword") ?? "");
    const nextPassword = String(form.get("newPassword") ?? "");
    const confirmPassword = String(form.get("confirmPassword") ?? "");

    if (nextPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    if (nextPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const credential = EmailAuthProvider.credential(
        user.email,
        currentPassword,
      );
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, nextPassword);
      setMessage("Password updated successfully.");
      event.currentTarget.reset();
    } catch (err) {
      setError(getFirebaseAuthErrorMessage(err, "login"));
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <p className="rounded-xl border border-border bg-surface p-6 text-sm text-brand-muted">
        Loading account…
      </p>
    );
  }

  if (!user) {
    return (
      <p className="rounded-xl border border-border bg-surface p-6 text-sm text-brand-muted">
        Sign in to manage your account.
      </p>
    );
  }

  const usesPasswordProvider = user.providerData.some(
    (provider) => provider.providerId === "password",
  );

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-border bg-surface p-6 sm:p-8">
        <h1 className="font-display text-2xl font-bold tracking-tight text-brand">
          Account
        </h1>
        <p className="mt-2 text-sm text-brand-muted">
          Email verification, password reset (via Forgot Password), and email
          change are handled by Firebase Authentication.
        </p>

        <dl className="mt-5 space-y-2 text-sm">
          <div className="flex flex-wrap gap-2">
            <dt className="font-semibold text-brand">Signed in as</dt>
            <dd className="text-brand-muted">{user.email || "—"}</dd>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <dt className="font-semibold text-brand">Email status</dt>
            <dd>
              {emailVerified ? (
                <span className="rounded-md bg-emerald-50 px-2 py-1 text-emerald-800">
                  Verified
                </span>
              ) : (
                <span className="rounded-md bg-amber-50 px-2 py-1 text-amber-900">
                  Not verified
                </span>
              )}
            </dd>
          </div>
        </dl>

        {!emailVerified ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => void resendVerification()}
            className="mt-4 min-h-11 rounded-md bg-brand px-4 text-sm font-semibold text-white disabled:opacity-60"
          >
            {busy ? "Sending…" : "Resend verification email"}
          </button>
        ) : null}
      </section>

      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          {message}
        </p>
      ) : null}

      {usesPasswordProvider ? (
        <>
          <form
            onSubmit={changeEmail}
            className="space-y-4 rounded-xl border border-border bg-surface p-6 sm:p-8"
          >
            <h2 className="font-display text-lg font-bold text-brand">
              Change email
            </h2>
            <p className="text-sm text-brand-muted">
              Firebase sends a confirmation link to the new address before the
              change is applied.
            </p>
            <div>
              <label className={labelClassName} htmlFor="newEmail">
                New email
              </label>
              <input
                id="newEmail"
                name="newEmail"
                type="email"
                required
                className={fieldClassName}
              />
            </div>
            <div>
              <label className={labelClassName} htmlFor="currentPasswordEmail">
                Current password
              </label>
              <input
                id="currentPasswordEmail"
                name="currentPasswordEmail"
                type="password"
                required
                className={fieldClassName}
              />
            </div>
            <button
              type="submit"
              disabled={busy}
              className="min-h-11 rounded-md bg-accent px-4 text-sm font-semibold text-white disabled:opacity-60"
            >
              Send email change confirmation
            </button>
          </form>

          <form
            onSubmit={changePassword}
            className="space-y-4 rounded-xl border border-border bg-surface p-6 sm:p-8"
          >
            <h2 className="font-display text-lg font-bold text-brand">
              Change password
            </h2>
            <p className="text-sm text-brand-muted">
              Or use{" "}
              <a href="/forgot-password" className="font-semibold text-accent">
                Forgot password
              </a>{" "}
              to get a Firebase reset link by email.
            </p>
            <div>
              <label className={labelClassName} htmlFor="currentPassword">
                Current password
              </label>
              <input
                id="currentPassword"
                name="currentPassword"
                type="password"
                required
                className={fieldClassName}
              />
            </div>
            <div>
              <label className={labelClassName} htmlFor="newPassword">
                New password
              </label>
              <input
                id="newPassword"
                name="newPassword"
                type="password"
                required
                minLength={8}
                className={fieldClassName}
              />
            </div>
            <div>
              <label className={labelClassName} htmlFor="confirmPassword">
                Confirm new password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                minLength={8}
                className={fieldClassName}
              />
            </div>
            <button
              type="submit"
              disabled={busy}
              className="min-h-11 rounded-md bg-accent px-4 text-sm font-semibold text-white disabled:opacity-60"
            >
              Update password
            </button>
          </form>
        </>
      ) : (
        <section className="rounded-xl border border-border bg-surface p-6 text-sm text-brand-muted">
          This account uses Google sign-in. Email/password change is managed in
          your Google account. Password reset still works only for email/password
          accounts via Forgot Password.
        </section>
      )}
    </div>
  );
}
