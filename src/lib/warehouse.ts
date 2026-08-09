export type WarehouseConfig = {
  name: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  phone: string;
};

export function getWarehouseConfig(): WarehouseConfig {
  return {
    name:
      process.env.INDIROUTE_WAREHOUSE_NAME?.trim() || "IndiRoute Warehouse",
    line1: process.env.INDIROUTE_WAREHOUSE_ADDRESS_LINE1?.trim() || "",
    line2: process.env.INDIROUTE_WAREHOUSE_ADDRESS_LINE2?.trim() || "",
    city: process.env.INDIROUTE_WAREHOUSE_CITY?.trim() || "New Delhi",
    state: process.env.INDIROUTE_WAREHOUSE_STATE?.trim() || "",
    postcode: process.env.INDIROUTE_WAREHOUSE_POSTCODE?.trim() || "",
    country: process.env.INDIROUTE_WAREHOUSE_COUNTRY?.trim() || "India",
    phone: process.env.INDIROUTE_WAREHOUSE_PHONE?.trim() || "",
  };
}
