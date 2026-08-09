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
  consolidated: "Consolidated",
  assigned_to_shipment: "Assigned to Shipment",
};

/** Parcels the customer may select for a quote request. */
export const SELECTABLE_PARCEL_STATUSES = [
  "warehouse_received",
  "inspection",
  "ready_for_consolidation",
  "in_process",
] as const;

export function getParcelStatusLabel(status: string): string {
  return PARCEL_STATUS_LABELS[status] ?? status;
}

export type CustomerParcel = {
  id: string;
  reference_code: string | null;
  description: string | null;
  carrier: string | null;
  inbound_tracking_number: string | null;
  sender_name: string | null;
  weight_kg: number | null;
  length_cm: number | null;
  width_cm: number | null;
  height_cm: number | null;
  photo_url: string | null;
  received_at: string | null;
  status: string;
  created_at: string;
};

export function isParcelSelectable(status: string): boolean {
  return (SELECTABLE_PARCEL_STATUSES as readonly string[]).includes(status);
}

export const INCOMING_PARCEL_STATUSES = [
  "in_process",
  "warehouse_received",
  "inspection",
  "ready_for_consolidation",
  "packed",
  "payment_pending",
  "ready_to_ship",
] as const;
