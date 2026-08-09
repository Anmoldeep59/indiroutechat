export const dashboardNavItems = [
  { label: "Overview", href: "/dashboard", id: "overview" },
  { label: "My Locker", href: "/dashboard/locker", id: "locker" },
  { label: "My Parcels", href: "/dashboard/parcels", id: "parcels" },
  {
    label: "Consolidation",
    href: "/dashboard/consolidation",
    id: "consolidation",
  },
  { label: "Shipments", href: "/dashboard/shipments", id: "shipments" },
  {
    label: "Shipping Calculator",
    href: "/dashboard/shipping-calculator",
    id: "shipping-calculator",
  },
  {
    label: "Assisted Purchase",
    href: "/dashboard/assisted-purchase",
    id: "assisted-purchase",
  },
  {
    label: "Pickup Request",
    href: "/dashboard/pickup-request",
    id: "pickup-request",
  },
  { label: "Payments", href: "/dashboard/payments", id: "payments" },
  {
    label: "Notifications",
    href: "/dashboard/notifications",
    id: "notifications",
  },
  { label: "Profile", href: "/dashboard/profile", id: "profile" },
  { label: "Support", href: "/dashboard/support", id: "support" },
] as const;
