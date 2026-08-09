import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  children: ReactNode;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-brand text-white hover:bg-[#163258] focus-visible:outline-brand",
  secondary:
    "bg-accent text-white hover:bg-accent-hover focus-visible:outline-accent",
  outline:
    "border border-brand/25 bg-surface text-brand hover:border-brand/45 hover:bg-brand/[0.03] focus-visible:outline-brand",
  ghost:
    "text-brand hover:bg-brand/[0.06] focus-visible:outline-brand",
};

export function Button({
  variant = "primary",
  className = "",
  children,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center rounded-md px-5 py-2.5 text-sm font-semibold tracking-tight transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50 ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
