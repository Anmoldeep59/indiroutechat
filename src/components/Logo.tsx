import Image from "next/image";
import Link from "next/link";

type LogoProps = {
  tone?: "default" | "on-dark";
};

/**
 * IndiRoute logo: brand mark image + two-tone wordmark.
 * The mark artwork is white + saffron, so on light backgrounds it
 * sits inside a navy tile to stay visible.
 */
export function Logo({ tone = "default" }: LogoProps) {
  const isDark = tone === "on-dark";

  const focusClass = isDark
    ? "focus-visible:outline-accent"
    : "focus-visible:outline-brand";

  return (
    <Link
      href="/"
      className={`inline-flex shrink-0 items-center gap-2.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${focusClass}`}
      aria-label="IndiRoute home"
    >
      <span
        className={`inline-flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg sm:h-10 sm:w-10 ${
          isDark ? "" : "bg-brand shadow-[0_2px_8px_rgba(12,35,64,0.25)]"
        }`}
      >
        <Image
          src="/logo-mark.png"
          alt=""
          width={40}
          height={40}
          className="h-full w-full object-contain p-0.5"
          priority
        />
      </span>
      <span
        className={`font-display text-xl font-bold tracking-tight sm:text-[1.55rem] ${
          isDark ? "text-white" : "text-brand"
        }`}
      >
        Indi<span className="text-accent">Route</span>
      </span>
    </Link>
  );
}
