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

export function formatCustomerLockerAddress(view: CustomerLockerView): string {
  const cityLine = [view.city, view.state, view.postcode]
    .filter(Boolean)
    .join(", ");

  return [
    view.customerName,
    `Locker: ${view.lockerCode}`,
    view.warehouseName,
    view.line1,
    view.line2,
    cityLine,
    view.country,
    view.phone ? `Phone: ${view.phone}` : "",
  ]
    .filter((line) => Boolean(line && line.trim()))
    .join("\n");
}
