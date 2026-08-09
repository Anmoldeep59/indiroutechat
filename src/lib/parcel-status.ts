export const PARCEL_STATUS_LABELS: Record<string, string> = {
  in_process: "In Process",
  warehouse_received: "Warehouse Received",
  inspection: "Inspection",
  ready_for_consolidation: "Ready for Consolidation",
  packed: "Packed",
  payment_pending: "Payment Pending",
  ready_to_ship: "Ready to Ship",
  shipped: "Shipped",
  in_transit: "In Transit",
  delivered: "Delivered",
};

export function getParcelStatusLabel(status: string): string {
  return PARCEL_STATUS_LABELS[status] ?? status;
}

export type CustomerParcel = {
  id: string;
  carrier: string | null;
  inbound_tracking_number: string | null;
  sender_name: string | null;
  weight_kg: number | null;
  received_at: string | null;
  status: string;
  created_at: string;
};

export const INCOMING_PARCEL_STATUSES = [
  "in_process",
  "warehouse_received",
  "inspection",
  "ready_for_consolidation",
  "packed",
  "payment_pending",
  "ready_to_ship",
] as const;
