import type { SupabaseClient } from "@supabase/supabase-js";
import {
  type CustomerLockerView,
} from "@/lib/locker-display";
import { getWarehouseConfig } from "@/lib/warehouse";

export type LockerRecord = {
  id: string;
  profile_id: string;
  locker_code: string;
  warehouse_name: string;
  line1: string | null;
  line2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string;
  status: string;
  created_at: string;
  updated_at: string;
};

export type { CustomerLockerView };

export async function ensureLockerForProfile(
  db: SupabaseClient,
  profileId: string,
): Promise<{ locker: LockerRecord | null; error: string | null }> {
  const warehouse = getWarehouseConfig();

  const { data, error } = await db.rpc("ensure_customer_locker", {
    p_profile_id: profileId,
    p_warehouse_name: warehouse.name,
    p_line1: warehouse.line1,
    p_line2: warehouse.line2,
    p_city: warehouse.city,
    p_state: warehouse.state,
    p_postal_code: warehouse.postcode,
    p_country: warehouse.country,
  });

  if (error) {
    return { locker: null, error: error.message };
  }

  return { locker: data as LockerRecord, error: null };
}

export function toCustomerLockerView(
  locker: LockerRecord,
  customerName: string,
): CustomerLockerView {
  const warehouse = getWarehouseConfig();

  return {
    lockerCode: locker.locker_code,
    customerName,
    warehouseName: locker.warehouse_name || warehouse.name,
    line1: locker.line1 || warehouse.line1,
    line2: locker.line2 || warehouse.line2,
    city: locker.city || warehouse.city,
    state: locker.state || warehouse.state,
    postcode: locker.postal_code || warehouse.postcode,
    country: locker.country || warehouse.country,
    phone: warehouse.phone,
    status: locker.status,
  };
}
