"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { createUserWithEmailAndPassword, signInWithPopup, updateProfile } from "firebase/auth";
import { getFirebaseAuthErrorMessage } from "@/lib/auth-errors";
import { auth, googleProvider } from "@/lib/firebase";
import { syncProfileWithServer } from "@/lib/sync-profile";

const countries = [
  "Australia",
  "United States",
  "United Kingdom",
  "Canada",
  "New Zealand",
] as const;

const MIN_PASSWORD_LENGTH = 8;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const fieldClassName =
  "mt-1.5 min-h-11 w-full rounded-md border border-border bg-background px-3.5 text-sm text-brand outline-none transition-colors placeholder:text-brand-muted/60 focus:border-accent focus:ring-2 focus:ring-accent/25 disabled:cursor-not-allowed disabled:opacity-60";

const fieldErrorClassName =
  "mt-1.5 min-h-11 w-full rounded-md border border-red-500 bg-background px-3.5 text-sm text-brand outline-none transition-colors placeholder:text-brand-muted/60 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 disabled:cursor-not-allowed disabled:opacity-60";

const labelClassName = "block text-sm font-semibold tracking-tight text-brand";

type FormErrors = {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  country?: string;
  password?: string;
  confirmPassword?: string;
  terms?: string;
};

function PasswordToggle({
  show,
  onToggle,
  labelShow,
  labelHide,
  disabled,
}: {
  show: boolean;
  onToggle: () => void;
  labelShow: string;
  labelHide: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className="absolute inset-y-0 right-0 flex items-center px-3.5 text-sm font-medium text-brand-muted transition-colors hover:text-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-60"
      aria-label={show ? labelHide : labelShow}
      aria-pressed={show}
    >
      {show ? (
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.75}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
          />
        </svg>
      ) : (
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.75}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      )}
    </button>
  );
}

export function SignupForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const isBusy = isSubmitting || isGoogleLoading;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isBusy) return;

    const form = event.currentTarget;
    const formData = new FormData(form);
    const firstName = String(formData.get("firstName") ?? "").trim();
    const lastName = String(formData.get("lastName") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const phone = String(formData.get("phone") ?? "").trim();
    const country = String(formData.get("country") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");
    const termsAccepted = formData.get("terms") === "on";

    const nextErrors: FormErrors = {};

    if (!firstName) nextErrors.firstName = "First name is required.";
    if (!lastName) nextErrors.lastName = "Last name is required.";

    if (!email) {
      nextErrors.email = "Email address is required.";
    } else if (!EMAIL_PATTERN.test(email)) {
      nextErrors.email = "Please enter a valid email address.";
    }

    if (!phone) nextErrors.phone = "Phone number is required.";
    if (!country) nextErrors.country = "Please select a country.";

    if (!password) {
      nextErrors.password = "Password is required.";
    } else if (password.length < MIN_PASSWORD_LENGTH) {
      nextErrors.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
    }

    if (!confirmPassword) {
      nextErrors.confirmPassword = "Please confirm your password.";
    } else if (password !== confirmPassword) {
      nextErrors.confirmPassword = "Passwords do not match.";
    }

    if (!termsAccepted) {
      nextErrors.terms =
        "Please agree to the Terms & Conditions and Privacy Policy.";
    }

    setErrors(nextErrors);
    setFormError(null);
    setSuccessMessage(null);

    if (Object.keys(nextErrors).length > 0) return;

    setIsSubmitting(true);

    try {
      const credential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );

      await updateProfile(credential.user, {
        displayName: `${firstName} ${lastName}`.trim(),
      });

      await syncProfileWithServer(credential.user, {
        firstName,
        lastName,
        phone,
        country,
      });

      setSuccessMessage(
        "Account created successfully. Redirecting to your dashboard...",
      );
      router.push("/dashboard");
    } catch (error) {
      setFormError(getFirebaseAuthErrorMessage(error));
      setIsSubmitting(false);
    }
  }

  async function handleGoogleSignIn() {
    if (isBusy) return;

    setErrors({});
    setFormError(null);
    setSuccessMessage(null);
    setIsGoogleLoading(true);

    try {
      const credential = await signInWithPopup(auth, googleProvider);
      await syncProfileWithServer(credential.user);
      setSuccessMessage(
        "Signed in with Google. Redirecting to your dashboard...",
      );
      router.push("/dashboard");
    } catch (error) {
      setFormError(getFirebaseAuthErrorMessage(error, "signup"));
      setIsGoogleLoading(false);
    }
  }

  function fieldClass(hasError?: string) {
    return hasError ? fieldErrorClassName : fieldClassName;
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

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="first-name" className={labelClassName}>
            First Name
          </label>
          <input
            id="first-name"
            name="firstName"
            type="text"
            autoComplete="given-name"
            placeholder="First name"
            disabled={isBusy}
            aria-invalid={Boolean(errors.firstName)}
            aria-describedby={errors.firstName ? "first-name-error" : undefined}
            className={fieldClass(errors.firstName)}
          />
          {errors.firstName ? (
            <p
              id="first-name-error"
              className="mt-1.5 text-sm text-red-600"
              role="alert"
            >
              {errors.firstName}
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor="last-name" className={labelClassName}>
            Last Name
          </label>
          <input
            id="last-name"
            name="lastName"
            type="text"
            autoComplete="family-name"
            placeholder="Last name"
            disabled={isBusy}
            aria-invalid={Boolean(errors.lastName)}
            aria-describedby={errors.lastName ? "last-name-error" : undefined}
            className={fieldClass(errors.lastName)}
          />
          {errors.lastName ? (
            <p
              id="last-name-error"
              className="mt-1.5 text-sm text-red-600"
              role="alert"
            >
              {errors.lastName}
            </p>
          ) : null}
        </div>
      </div>

      <div>
        <label htmlFor="signup-email" className={labelClassName}>
          Email Address
        </label>
        <input
          id="signup-email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="you@example.com"
          disabled={isBusy}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "signup-email-error" : undefined}
          className={fieldClass(errors.email)}
        />
        {errors.email ? (
          <p
            id="signup-email-error"
            className="mt-1.5 text-sm text-red-600"
            role="alert"
          >
            {errors.email}
          </p>
        ) : null}
      </div>

      <div>
        <label htmlFor="phone" className={labelClassName}>
          Phone Number
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          inputMode="tel"
          placeholder="+61 400 000 000"
          disabled={isBusy}
          aria-invalid={Boolean(errors.phone)}
          aria-describedby={errors.phone ? "phone-error" : undefined}
          className={fieldClass(errors.phone)}
        />
        {errors.phone ? (
          <p id="phone-error" className="mt-1.5 text-sm text-red-600" role="alert">
            {errors.phone}
          </p>
        ) : null}
      </div>

      <div>
        <label htmlFor="country" className={labelClassName}>
          Country
        </label>
        <select
          id="country"
          name="country"
          defaultValue=""
          autoComplete="country-name"
          disabled={isBusy}
          aria-invalid={Boolean(errors.country)}
          aria-describedby={errors.country ? "country-error" : undefined}
          className={fieldClass(errors.country)}
        >
          <option value="" disabled>
            Select a country
          </option>
          {countries.map((countryOption) => (
            <option key={countryOption} value={countryOption}>
              {countryOption}
            </option>
          ))}
        </select>
        {errors.country ? (
          <p
            id="country-error"
            className="mt-1.5 text-sm text-red-600"
            role="alert"
          >
            {errors.country}
          </p>
        ) : null}
      </div>

      <div>
        <label htmlFor="signup-password" className={labelClassName}>
          Password
        </label>
        <div className="relative mt-1.5">
          <input
            id="signup-password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Create a password"
            disabled={isBusy}
            aria-invalid={Boolean(errors.password)}
            aria-describedby={
              errors.password ? "signup-password-error" : undefined
            }
            className={`${fieldClass(errors.password)} mt-0 pr-12`}
          />
          <PasswordToggle
            show={showPassword}
            onToggle={() => setShowPassword((value) => !value)}
            labelShow="Show password"
            labelHide="Hide password"
            disabled={isBusy}
          />
        </div>
        {errors.password ? (
          <p
            id="signup-password-error"
            className="mt-1.5 text-sm text-red-600"
            role="alert"
          >
            {errors.password}
          </p>
        ) : null}
      </div>

      <div>
        <label htmlFor="confirm-password" className={labelClassName}>
          Confirm Password
        </label>
        <div className="relative mt-1.5">
          <input
            id="confirm-password"
            name="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Confirm your password"
            disabled={isBusy}
            aria-invalid={Boolean(errors.confirmPassword)}
            aria-describedby={
              errors.confirmPassword ? "confirm-password-error" : undefined
            }
            className={`${fieldClass(errors.confirmPassword)} mt-0 pr-12`}
          />
          <PasswordToggle
            show={showConfirmPassword}
            onToggle={() => setShowConfirmPassword((value) => !value)}
            labelShow="Show confirm password"
            labelHide="Hide confirm password"
            disabled={isBusy}
          />
        </div>
        {errors.confirmPassword ? (
          <p
            id="confirm-password-error"
            className="mt-1.5 text-sm text-red-600"
            role="alert"
          >
            {errors.confirmPassword}
          </p>
        ) : null}
      </div>

      <div>
        <label className="inline-flex items-start gap-2.5 text-sm text-brand-muted">
          <input
            id="terms"
            name="terms"
            type="checkbox"
            disabled={isBusy}
            aria-invalid={Boolean(errors.terms)}
            aria-describedby={errors.terms ? "terms-error" : undefined}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-border text-accent accent-[var(--accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-60"
          />
          <span>
            I agree to the{" "}
            <a
              href="#terms"
              className="font-semibold text-accent transition-colors hover:text-accent-hover"
            >
              Terms &amp; Conditions
            </a>{" "}
            and{" "}
            <a
              href="#privacy"
              className="font-semibold text-accent transition-colors hover:text-accent-hover"
            >
              Privacy Policy
            </a>
          </span>
        </label>
        {errors.terms ? (
          <p id="terms-error" className="mt-1.5 text-sm text-red-600" role="alert">
            {errors.terms}
          </p>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={isBusy}
        className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-accent px-5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting ? "Creating account..." : "Create Account"}
      </button>

      <div className="relative py-1">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-surface px-3 text-brand-muted">
            or continue with
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={isBusy}
        className="inline-flex min-h-11 w-full items-center justify-center gap-2.5 rounded-md border border-border bg-background px-5 text-sm font-semibold text-brand transition-colors hover:border-brand/30 hover:bg-brand/[0.02] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-60"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        {isGoogleLoading ? "Connecting to Google..." : "Continue with Google"}
      </button>

      <p className="pt-1 text-center text-sm text-brand-muted">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-semibold text-accent transition-colors hover:text-accent-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Sign In
        </Link>
      </p>
    </form>
  );
}
