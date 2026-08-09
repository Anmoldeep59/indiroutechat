import Image from "next/image";
import Link from "next/link";

/**
 * Swap to an image logo later:
 * 1. Add a transparent PNG/SVG at /public/logo.svg (or logo.png)
 * 2. Set USE_IMAGE_LOGO to true
 * 3. Update LOGO_SRC if the filename differs
 */
const USE_IMAGE_LOGO = false;
const LOGO_SRC = "/logo.svg";

type LogoProps = {
  tone?: "default" | "on-dark";
};

export function Logo({ tone = "default" }: LogoProps) {
  const textClass =
    tone === "on-dark"
      ? "font-display text-xl font-bold tracking-tight text-white sm:text-[1.625rem]"
      : "font-display text-xl font-bold tracking-tight text-brand sm:text-[1.625rem]";

  const focusClass =
    tone === "on-dark"
      ? "focus-visible:outline-accent"
      : "focus-visible:outline-brand";

  return (
    <Link
      href="/"
      className={`inline-flex shrink-0 items-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${focusClass}`}
      aria-label="IndiRoute home"
    >
      {USE_IMAGE_LOGO ? (
        <Image
          src={LOGO_SRC}
          alt="IndiRoute"
          width={168}
          height={40}
          className="h-8 w-auto object-contain object-left sm:h-9"
          priority
        />
      ) : (
        <span className={textClass}>IndiRoute</span>
      )}
    </Link>
  );
}
