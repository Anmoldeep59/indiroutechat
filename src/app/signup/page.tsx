import type { Metadata } from "next";
import { Logo } from "@/components/Logo";
import { SignupForm } from "@/components/SignupForm";

export const metadata: Metadata = {
  title: "Create Account — IndiRoute",
  description:
    "Get your personal India warehouse address and start shipping worldwide.",
};

export default function SignupPage() {
  return (
    <main className="relative flex flex-1 items-center justify-center overflow-hidden bg-background px-4 py-12 sm:px-6 sm:py-16">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(12,35,64,0.07),_transparent_55%),radial-gradient(ellipse_at_bottom_right,_rgba(232,106,23,0.09),_transparent_45%)]"
        aria-hidden="true"
      />
      <div className="pattern-jaali-dark pointer-events-none absolute inset-0" aria-hidden="true" />
      {/* subtle holi-inspired colour drift */}
      <div
        className="pointer-events-none absolute -right-24 top-1/3 h-64 w-64 rounded-full bg-accent/[0.07] blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -left-20 top-16 h-56 w-56 rounded-full bg-[#c2408c]/[0.05] blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-24 right-1/3 h-56 w-56 rounded-full bg-success/[0.05] blur-3xl"
        aria-hidden="true"
      />

      <div className="relative w-full max-w-lg">
        <div className="animate-fade-up mb-8 flex justify-center">
          <Logo />
        </div>

        <div className="animate-scale-in animation-delay-100 relative overflow-hidden rounded-2xl border border-border bg-surface p-6 shadow-[0_16px_48px_rgba(12,35,64,0.1)] sm:p-8">
          <div
            className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-accent/50 to-transparent"
            aria-hidden="true"
          />
          <div className="text-center">
            <h1 className="font-display text-2xl font-bold tracking-tight text-brand sm:text-3xl">
              Create Your IndiRoute Account
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-brand-muted sm:text-base">
              Get your personal India warehouse address and start shipping
              worldwide.
            </p>
          </div>

          <SignupForm />
        </div>
      </div>
    </main>
  );
}
