"use client";

import type { FormEvent } from "react";

export function NewsletterForm() {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
  }

  return (
    <form className="mt-7" onSubmit={handleSubmit} noValidate>
      <label
        htmlFor="footer-newsletter"
        className="block font-display text-sm font-semibold tracking-tight text-white"
      >
        Stay updated
      </label>
      <p className="mt-1 text-sm text-white/70">
        Shipping tips and IndiRoute news in your inbox.
      </p>
      <div className="mt-3 flex flex-col gap-2.5 sm:flex-row sm:items-stretch">
        <input
          id="footer-newsletter"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="Enter your email"
          className="min-h-11 w-full flex-1 rounded-md border border-white/20 bg-white/5 px-3.5 text-sm text-white placeholder:text-white/45 outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/30"
        />
        <button
          type="submit"
          className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-md bg-accent px-5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Subscribe
        </button>
      </div>
    </form>
  );
}
