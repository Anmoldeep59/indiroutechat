import Link from "next/link";
import type { ButtonHTMLAttributes, MouseEventHandler, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  children: ReactNode;
  href?: string;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-brand text-white shadow-[0_2px_10px_rgba(12,35,64,0.22)] hover:bg-[#163258] hover:shadow-[0_8px_22px_rgba(12,35,64,0.3)] focus-visible:outline-brand",
  secondary:
    "bg-accent text-white shadow-[0_2px_10px_rgba(232,106,23,0.28)] hover:bg-accent-hover hover:shadow-[0_8px_22px_rgba(232,106,23,0.35)] focus-visible:outline-accent",
  outline:
    "border border-brand/25 bg-surface text-brand hover:border-brand/50 hover:bg-brand/[0.04] focus-visible:outline-brand",
  ghost: "text-brand hover:bg-brand/[0.06] focus-visible:outline-brand",
};

const baseClassName =
  "inline-flex items-center justify-center rounded-md px-5 py-2.5 text-sm font-semibold tracking-tight transition-all duration-200 motion-safe:hover:-translate-y-0.5 motion-safe:active:translate-y-0 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50";

export function Button({
  variant = "primary",
  className = "",
  children,
  type = "button",
  href,
  onClick,
  ...props
}: ButtonProps) {
  const classes = `${baseClassName} ${variantClasses[variant]} ${className}`;

  if (href) {
    return (
      <Link
        href={href}
        className={classes}
        onClick={onClick as MouseEventHandler<HTMLAnchorElement> | undefined}
      >
        {children}
      </Link>
    );
  }

  return (
    <button type={type} className={classes} onClick={onClick} {...props}>
      {children}
    </button>
  );
}
