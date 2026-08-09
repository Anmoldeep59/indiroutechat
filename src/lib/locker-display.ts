export type CustomerLockerView = {
  lockerCode: string;
  customerName: string;
  warehouseName: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  phone: string;
  status: string;
};

/** Recipient line shown/copied for Indian store checkouts. */
export function formatLockerRecipientName(view: CustomerLockerView): string {
  const name = view.customerName.trim() || "Customer";
  return `${name} - ${view.lockerCode}`;
}

export function formatCustomerLockerAddress(view: CustomerLockerView): string {
  const cityLine = [view.city, view.state, view.postcode]
    .filter(Boolean)
    .join(", ");

  return [
    formatLockerRecipientName(view),
    view.warehouseName,
    view.line1,
    view.line2,
    cityLine,
    view.country,
    view.phone ? `Phone: ${view.phone}` : "",
  ]
    .filter((line) => Boolean(line && String(line).trim()))
    .join("\n");
}
