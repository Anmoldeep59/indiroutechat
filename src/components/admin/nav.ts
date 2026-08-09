export const adminNavItems = [
  { label: "Overview", href: "/admin", id: "overview" },
  { label: "Customers", href: "/admin/customers", id: "customers" },
  { label: "Lockers", href: "/admin/lockers", id: "lockers" },
  { label: "Parcels", href: "/admin/parcels", id: "parcels" },
  { label: "Consolidation", href: "/admin/consolidation", id: "consolidation" },
  { label: "Shipments", href: "/admin/shipments", id: "shipments" },
  {
    label: "Assisted Purchases",
    href: "/admin/assisted-purchases",
    id: "assisted-purchases",
  },
  {
    label: "Pickup Requests",
    href: "/admin/pickup-requests",
    id: "pickup-requests",
  },
  { label: "Payments", href: "/admin/payments", id: "payments" },
  {
    label: "Shipping Rates",
    href: "/admin/shipping-rates",
    id: "shipping-rates",
  },
  {
    label: "Notifications",
    href: "/admin/notifications",
    id: "notifications",
  },
  { label: "Audit Logs", href: "/admin/audit-logs", id: "audit-logs" },
  { label: "Settings", href: "/admin/settings", id: "settings" },
] as const;
