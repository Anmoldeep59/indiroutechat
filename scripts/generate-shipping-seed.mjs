import fs from "node:fs";
import path from "node:path";

const countries = [
  ["AU", "Australia"],
  ["US", "United States"],
  ["GB", "United Kingdom"],
  ["CA", "Canada"],
  ["NZ", "New Zealand"],
  ["AE", "United Arab Emirates"],
  ["DE", "Germany"],
  ["MY", "Malaysia"],
  ["IT", "Italy"],
  ["FR", "France"],
  ["JP", "Japan"],
  ["CH", "Switzerland"],
  ["SG", "Singapore"],
  ["SA", "Saudi Arabia"],
];

const map = {
  AU: {
    economy: [
      [384, "SRX Economy", "Up to 20 Business Days", "preferred"],
      [440, "SRX Economy Pro", "Up to 20 Business Days", "fallback"],
    ],
    standard: [
      [140, "SRX Premium Pro", "10–15 Business Days", "candidate"],
      [262, "SRX Premium Plus Pro", "10–15 Business Days", "candidate"],
    ],
  },
  US: {
    economy: [[384, "SRX Economy", "12–15 Business Days", "preferred"]],
    standard: [
      [381, "SRX Premium", "10–12 Business Days", "candidate"],
      [140, "SRX Premium Pro", "10–12 Business Days", "candidate"],
      [262, "SRX Premium Plus Pro", "10–12 Business Days", "candidate"],
    ],
  },
  GB: {
    economy: [
      [384, "SRX Economy", "Up to 20 Business Days", "preferred"],
      [440, "SRX Economy Pro", "Up to 20 Business Days", "fallback"],
    ],
    standard: [
      [242, "Aramex International GPX", "6–8 Business Days", "preferred"],
      [140, "SRX Premium Pro", "10–15 Business Days", "fallback"],
      [262, "SRX Premium Plus Pro", "10–15 Business Days", "fallback"],
      [240, "SRX Priority Pro", "8–15 Business Days", "fallback"],
    ],
  },
  CA: {
    economy: [
      [384, "SRX Economy", "Up to 20 Business Days", "preferred"],
      [440, "SRX Economy Pro", "Up to 20 Business Days", "fallback"],
    ],
    standard: [
      [140, "SRX Premium Pro", "10–15 Business Days", "candidate"],
      [262, "SRX Premium Plus Pro", "10–15 Business Days", "candidate"],
    ],
  },
  NZ: {
    economy: [
      [384, "SRX Economy", "Up to 20 Business Days", "preferred"],
      [440, "SRX Economy Pro", "Up to 20 Business Days", "fallback"],
    ],
    standard: [[35, "Aramex International", "10–14 Business Days", "preferred"]],
  },
  AE: {
    economy: [[440, "SRX Economy Pro", "Up to 20 Business Days", "preferred"]],
    standard: [[35, "Aramex International", "3–5 Business Days", "preferred"]],
  },
  DE: {
    economy: [
      [384, "SRX Economy", "Up to 20 Business Days", "preferred"],
      [440, "SRX Economy Pro", "Up to 20 Business Days", "fallback"],
    ],
    standard: [
      [241, "Aramex EPX", "8–15 Business Days", "candidate"],
      [240, "SRX Priority Pro", "8–15 Business Days", "candidate"],
    ],
  },
  MY: {
    economy: [
      [384, "SRX Economy", "Up to 20 Business Days", "preferred"],
      [440, "SRX Economy Pro", "Up to 20 Business Days", "fallback"],
    ],
    standard: [
      [140, "SRX Premium Pro", "10–15 Business Days", "candidate"],
      [262, "SRX Premium Plus Pro", "10–15 Business Days", "candidate"],
    ],
  },
  IT: {
    economy: [
      [384, "SRX Economy", "Up to 20 Business Days", "preferred"],
      [440, "SRX Economy Pro", "Up to 20 Business Days", "fallback"],
    ],
    standard: [
      [241, "Aramex EPX", "8–15 Business Days", "candidate"],
      [240, "SRX Priority Pro", "8–15 Business Days", "candidate"],
    ],
  },
  FR: {
    economy: [
      [384, "SRX Economy", "Up to 20 Business Days", "preferred"],
      [440, "SRX Economy Pro", "Up to 20 Business Days", "fallback"],
    ],
    standard: [
      [241, "Aramex EPX", "8–15 Business Days", "candidate"],
      [240, "SRX Priority Pro", "8–15 Business Days", "candidate"],
    ],
  },
  JP: {
    economy: [
      [384, "SRX Economy", "Up to 20 Business Days", "preferred"],
      [440, "SRX Economy Pro", "Up to 20 Business Days", "fallback"],
    ],
    standard: [
      [140, "SRX Premium Pro", "10–15 Business Days", "candidate"],
      [262, "SRX Premium Plus Pro", "10–15 Business Days", "candidate"],
    ],
  },
  CH: {
    economy: [
      [384, "SRX Economy", "Up to 20 Business Days", "preferred"],
      [440, "SRX Economy Pro", "Up to 20 Business Days", "fallback"],
    ],
    standard: [
      [262, "SRX Premium Plus Pro", "10–15 Business Days", "preferred"],
    ],
  },
  SG: {
    economy: [
      [384, "SRX Economy", "Up to 20 Business Days", "preferred"],
      [440, "SRX Economy Pro", "Up to 20 Business Days", "fallback"],
    ],
    standard: [
      [140, "SRX Premium Pro", "10–15 Business Days", "candidate"],
      [262, "SRX Premium Plus Pro", "10–15 Business Days", "candidate"],
    ],
  },
  SA: {
    economy: [
      [384, "SRX Economy", "Up to 20 Business Days", "preferred"],
      [440, "SRX Economy Pro", "Up to 20 Business Days", "fallback"],
    ],
    standard: [
      [262, "SRX Premium Plus Pro", "10–15 Business Days", "preferred"],
    ],
  },
};

const weights = [
  0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5, 0.75, 1, 1.5, 2, 3, 5,
  7.5, 10, 15, 20,
];
const base = {
  384: 900,
  440: 980,
  381: 1400,
  140: 1550,
  262: 1700,
  242: 2100,
  35: 1800,
  241: 1950,
  240: 2000,
};
const factor = {
  AU: 1,
  US: 1.08,
  GB: 1.05,
  CA: 1.1,
  NZ: 1.02,
  AE: 0.92,
  DE: 1.06,
  MY: 0.88,
  IT: 1.07,
  FR: 1.07,
  JP: 1.12,
  CH: 1.15,
  SG: 0.9,
  SA: 0.95,
};

function esc(value) {
  return String(value).replace(/'/g, "''");
}

const mapVals = [];
for (const [code, name] of countries) {
  let order = 0;
  for (const tier of ["economy", "standard"]) {
    for (const [id, sname, sla, role] of map[code][tier]) {
      mapVals.push(
        `('${code}', '${esc(name)}', '${tier}', ${id}, '${esc(sname)}', '${esc(sla)}', '${role}', ${order++}, true)`,
      );
    }
  }
}

const rateVals = [];
for (const [code, name] of countries) {
  const services = new Map();
  for (const tier of ["economy", "standard"]) {
    for (const [id, sname, sla] of map[code][tier]) {
      if (!services.has(id)) {
        services.set(id, { sname, sla, tier });
      }
    }
  }
  for (const [id, meta] of services) {
    for (const w of weights) {
      const safe = Math.ceil(((base[id] || 1600) + w * 420) * (factor[code] || 1));
      const lite = Math.round(safe * 0.92);
      const basic = Math.round(safe * 0.95);
      const advanced = Math.round(safe * 0.97);
      const pro = Math.round(safe * 0.99);
      const enterprise = safe;
      const diamond = Math.round(safe * 0.98);
      rateVals.push(
        `('${code}', '${esc(name)}', ${w}, '${esc(meta.sname)}', ${id}, '${esc(meta.sla)}', ${lite}, ${basic}, ${advanced}, ${pro}, ${enterprise}, ${diamond}, ${enterprise}, '${meta.tier}', true)`,
      );
    }
  }
}

const outDir = path.join("supabase", "migrations");
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(
  path.join(outDir, "_seed_mappings_fragment.sql"),
  mapVals.join(",\n"),
);
fs.writeFileSync(
  path.join(outDir, "_seed_rates_fragment.sql"),
  rateVals.join(",\n"),
);
console.log(`mappings=${mapVals.length} rates=${rateVals.length}`);
