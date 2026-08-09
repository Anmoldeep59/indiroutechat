const trustItems = [
  {
    title: "Global Shipping",
    description: "Forward parcels from India to destinations worldwide.",
    delayClass: "animation-delay-100",
    icon: (
      <svg
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.75}
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 21a9 9 0 100-18 9 9 0 000 18z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3.6 9h16.8M3.6 15h16.8M12 3a14.5 14.5 0 010 18M12 3a14.5 14.5 0 000 18"
        />
      </svg>
    ),
  },
  {
    title: "Parcel Consolidation",
    description: "Combine multiple packages into one cost-effective shipment.",
    delayClass: "animation-delay-200",
    icon: (
      <svg
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.75}
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
        />
      </svg>
    ),
  },
  {
    title: "Assisted Purchase",
    description: "We buy on your behalf when local payment is required.",
    delayClass: "animation-delay-300",
    icon: (
      <svg
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.75}
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 3h2l.4 2M7 13h10l3-8H6.4M7 13L5.4 5M7 13l-2.3 2.3c-.4.4-.1 1.1.4 1.1H17M17 13v6a1 1 0 01-1 1H8a1 1 0 01-1-1v-6"
        />
      </svg>
    ),
  },
  {
    title: "Secure Storage",
    description: "Safe warehouse holding until you are ready to ship.",
    delayClass: "animation-delay-400",
    icon: (
      <svg
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.75}
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 3l8 4v6c0 5-3.5 7.5-8 9-4.5-1.5-8-4-8-9V7l8-4z"
        />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
      </svg>
    ),
  },
] as const;

export function TrustRow() {
  return (
    <section
      aria-label="Why IndiRoute"
      className="border-t border-border bg-surface"
    >
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:gap-8 lg:px-8 lg:py-14">
        {trustItems.map((item) => (
          <div
            key={item.title}
            className={`animate-fade-in ${item.delayClass} flex flex-col gap-3`}
          >
            <div className="flex h-10 w-10 items-center justify-center text-trust-icon">
              {item.icon}
            </div>
            <h2 className="font-display text-base font-semibold tracking-tight text-brand">
              {item.title}
            </h2>
            <p className="text-sm leading-relaxed text-brand-muted">
              {item.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
