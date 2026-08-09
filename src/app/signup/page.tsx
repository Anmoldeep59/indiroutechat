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
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(12,35,64,0.06),_transparent_55%),radial-gradient(ellipse_at_bottom_right,_rgba(232,106,23,0.07),_transparent_45%)]"
        aria-hidden="true"
      />

      <div className="relative w-full max-w-lg">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>

        <div className="rounded-xl border border-border bg-surface p-6 shadow-[0_1px_2px_rgba(12,35,64,0.04)] sm:p-8">
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
