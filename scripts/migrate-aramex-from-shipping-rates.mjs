/**
 * Bulk-migrate real Aramex rows from shipping_rates → aramex_base_rates.
 */
import { Client } from "pg";

const url =
  process.env.DATABASE_URL ||
  "postgresql://postgres:Anmoldeepsingh123456789@db.uaazgyrvobkmdbxoasri.supabase.co:5432/postgres";

const COUNTRIES = [
  "AU",
  "US",
  "GB",
  "CA",
  "NZ",
  "AE",
  "DE",
  "MY",
  "IT",
  "FR",
  "JP",
  "CH",
  "SG",
  "SA",
];

const NAMES = {
  AU: "Australia",
  US: "United States",
  GB: "United Kingdom",
  CA: "Canada",
  NZ: "New Zealand",
  AE: "United Arab Emirates",
  DE: "Germany",
  MY: "Malaysia",
  IT: "Italy",
  FR: "France",
  JP: "Japan",
  CH: "Switzerland",
  SG: "Singapore",
  SA: "Saudi Arabia",
};

const client = new Client({
  connectionString: url,
  ssl: { rejectUnauthorized: false },
});

await client.connect();
console.log("Connected");

await client.query("delete from aramex_base_rates");

// Pick economy/standard Aramex service ids per country in SQL, then insert bands.
const { rows: picks } = await client.query(
  `
  with aramex as (
    select country_code, service, service_id::text as service_id
    from shipping_rates
    where country_code = any($1::text[])
      and active = true
      and service ilike 'Aramex%'
    group by 1,2,3
  ),
  ranked as (
    select
      country_code,
      service,
      service_id,
      case
        when service = 'Aramex EPX' then 1
        when service = 'Aramex International GPX' then 2
        when service = 'Aramex International' then 3
        else 9
      end as economy_rank,
      case
        when service = 'Aramex International' then 1
        when service = 'Aramex International GPX' then 2
        when service = 'Aramex EPX' then 3
        else 9
      end as standard_rank
    from aramex
  ),
  economy as (
    select distinct on (country_code) country_code, service_id, service
    from ranked
    order by country_code, economy_rank, service
  ),
  standard as (
    select distinct on (country_code) country_code, service_id, service
    from ranked
    order by country_code, standard_rank, service
  )
  select
    coalesce(e.country_code, s.country_code) as country_code,
    e.service_id as economy_service_id,
    e.service as economy_service,
    s.service_id as standard_service_id,
    s.service as standard_service
  from economy e
  full outer join standard s using (country_code)
  order by 1
  `,
  [COUNTRIES],
);

console.log("Service picks:", picks);

for (const pick of picks) {
  const code = pick.country_code;
  const name = NAMES[code] || code;

  for (const [tier, serviceId, serviceName] of [
    ["economy", pick.economy_service_id, pick.economy_service],
    ["standard", pick.standard_service_id, pick.standard_service],
  ]) {
    if (!serviceId) {
      console.log(`${code} ${tier}: no Aramex service`);
      continue;
    }

    const result = await client.query(
      `
      with ordered as (
        select
          weight_kg::numeric as weight_kg,
          rate_inr::numeric as rate_inr,
          sla,
          lag(weight_kg::numeric) over (order by weight_kg) as prev_weight
        from shipping_rates
        where country_code = $1
          and service_id::text = $2
          and active = true
          and rate_inr is not null
          and rate_inr > 0
      ),
      bands as (
        select
          coalesce(prev_weight, 0) as min_weight_kg,
          weight_kg as max_weight_kg,
          rate_inr as base_aramex_rate,
          sla as source_sla
        from ordered
      )
      insert into aramex_base_rates (
        country_code, country_name, service_tier,
        min_weight_kg, max_weight_kg, base_aramex_rate,
        currency, source_sla, active
      )
      select
        $1, $3, $4,
        min_weight_kg, max_weight_kg, base_aramex_rate,
        'INR', source_sla, true
      from bands
      `,
      [code, String(serviceId), name, tier],
    );

    console.log(
      `${code} ${tier}: inserted from ${serviceName} (${serviceId}) rowCount=${result.rowCount}`,
    );
  }
}

const { rows } = await client.query(
  "select country_code, service_tier, count(*)::int n from aramex_base_rates group by 1,2 order by 1,2",
);
console.log(rows);

const { rows: ch } = await client.query(
  `
  select service_tier, min_weight_kg, max_weight_kg, base_aramex_rate
  from aramex_base_rates
  where country_code = 'CH'
    and max_weight_kg >= 10
    and min_weight_kg < 10
  order by service_tier
  `,
);
console.log("CH 10kg:", ch);

const missing = COUNTRIES.filter(
  (code) => !picks.some((p) => p.country_code === code),
);
if (missing.length) console.log("No Aramex for:", missing.join(", "));

await client.end();
