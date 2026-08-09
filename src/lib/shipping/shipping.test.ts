import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveCountry } from "./countries";
import { DEFAULT_SHIPPING_SETTINGS } from "./defaults";
import { isIndiaPostService } from "./india-post";
import { getPackingFee } from "./packing";
import {
  applyShippingMarkup,
  calculateCustomerPrice,
  PricingSafetyError,
} from "./pricing";
import { buildQuote, QuoteBuildError } from "./quote-builder";
import { generateSeedRates } from "./seed-rates";
import { selectEconomyRate, selectStandardRate } from "./select-rate";
import { getDefaultServiceMap } from "./service-map";
import { selectWeightSlab } from "./weight";
import type { ShippingRateRow } from "./types";

const rates = generateSeedRates();

function countryRates(code: string): ShippingRateRow[] {
  return rates.filter((row) => row.country_code === code);
}

describe("India Post exclusion", () => {
  it("blocks known service IDs and name patterns", () => {
    assert.equal(isIndiaPostService(326, "Something"), true);
    assert.equal(isIndiaPostService(329, null), true);
    assert.equal(isIndiaPostService(384, "SRX Economy"), false);
    assert.equal(isIndiaPostService(999, "India Post EMS"), true);
    assert.equal(isIndiaPostService(999, "India Post Air Parcel"), true);
  });

  it("never selects India Post rows even if present in rate set", () => {
    const poisoned: ShippingRateRow[] = [
      {
        country_code: "AU",
        country_name: "Australia",
        weight_kg: 0.5,
        source_service_name: "India Post EMS Merchandise",
        source_service_id: 326,
        source_sla: "fake",
        lite_rate: 100,
        basic_rate: 100,
        advanced_rate: 100,
        pro_rate: 100,
        enterprise_rate: 100,
        diamond_rate: 100,
        safe_source_rate: 100,
        customer_service_tier: "economy",
        active: true,
      },
      ...countryRates("AU"),
    ];

    const selected = selectEconomyRate(
      poisoned,
      "AU",
      0.5,
      getDefaultServiceMap("AU")!,
    );
    assert.ok(selected);
    assert.notEqual(selected!.sourceServiceId, 326);
    assert.doesNotMatch(selected!.sourceServiceName, /india\s*post/i);
  });
});

describe("weight slab selection", () => {
  it("never interpolates downward", () => {
    assert.equal(selectWeightSlab(0.43, [0.4, 0.45, 0.5]), 0.45);
    assert.equal(selectWeightSlab(0.5, [0.4, 0.45, 0.5]), 0.5);
    assert.equal(selectWeightSlab(0.51, [0.4, 0.45, 0.5]), null);
  });
});

describe("pricing formula", () => {
  it("matches the documented ₹1,000 example", () => {
    const priced = calculateCustomerPrice(1000, 0.75, DEFAULT_SHIPPING_SETTINGS);
    assert.equal(applyShippingMarkup(1000, 11), 1110);
    assert.equal(priced.shippingCharge, 1110);
    assert.equal(priced.handlingFee, 49);
    assert.equal(priced.serviceFee, 79);
    assert.equal(priced.packingFee, 69);
    assert.equal(priced.gst, 35.46);
    assert.equal(priced.finalPrice, 1350);
    assert.ok(priced.finalPrice >= priced.minimumAllowed);
  });

  it("rejects final prices below sourceRate × 1.11", () => {
    assert.throws(() => {
      calculateCustomerPrice(1000, 1, {
        ...DEFAULT_SHIPPING_SETTINGS,
        shipping_markup_percent: 11,
        handling_fee_inr: -2000,
        service_fee_inr: 0,
        final_price_round_to_inr: 10,
        tax_mode: "gst_none",
      });
    }, PricingSafetyError);
  });
});

describe("packing fees", () => {
  it("uses weight slabs including exclusive lower bounds", () => {
    assert.equal(getPackingFee(0.5), 49);
    assert.equal(getPackingFee(0.51), 69);
    assert.equal(getPackingFee(1), 69);
    assert.equal(getPackingFee(1.01), 99);
    assert.equal(getPackingFee(10), 249);
    assert.equal(getPackingFee(10.01), 349);
  });
});

describe("service selection", () => {
  it("selects Economy preferred then fallback", () => {
    const map = getDefaultServiceMap("AU")!;
    const selected = selectEconomyRate(countryRates("AU"), "AU", 1, map);
    assert.ok(selected);
    assert.equal(selected!.sourceServiceId, 384);
  });

  it("selects cheapest Standard candidate for Australia", () => {
    const map = getDefaultServiceMap("AU")!;
    const selected = selectStandardRate(countryRates("AU"), "AU", 1, map);
    assert.ok(selected);
    assert.equal(selected!.sourceServiceId, 140);
  });

  it("uses real UAE Standard SLA", () => {
    const map = getDefaultServiceMap("AE")!;
    const selected = selectStandardRate(countryRates("AE"), "AE", 1, map);
    assert.ok(selected);
    assert.equal(selected!.sourceSla, "3–5 Business Days");
  });
});

describe("quote builder", () => {
  const cases = [
    ["AU", 0.5],
    ["AU", 1],
    ["US", 0.5],
    ["US", 2],
    ["GB", 1],
    ["CA", 1],
    ["AE", 1],
    ["DE", 1],
    ["MY", 1],
    ["NZ", 1],
  ] as const;

  for (const [country, weight] of cases) {
    it(`quotes ${country} ${weight}kg with IndiRoute names only`, () => {
      const quote = buildQuote(
        {
          countryCode: country,
          actualWeightKg: weight,
          lengthCm: 10,
          widthCm: 10,
          heightCm: 10,
        },
        { rates },
      );

      assert.equal(quote.origin, "India");
      assert.equal(quote.options.length, 3);

      const economy = quote.options.find((o) => o.tier === "economy");
      const standard = quote.options.find((o) => o.tier === "standard");
      const express = quote.options.find((o) => o.tier === "express");

      assert.ok(economy?.available);
      assert.ok(standard?.available);
      assert.equal(economy?.displayName, "IndiRoute Economy");
      assert.equal(standard?.displayName, "IndiRoute Standard");
      assert.equal(express?.displayName, "IndiRoute Express");
      assert.equal(express?.comingSoon, true);
      assert.equal(express?.priceInr, null);

      const blob = JSON.stringify(quote);
      assert.doesNotMatch(blob, /Aramex|SRX|ShipX|India Post/i);

      assert.ok((economy?.priceInr ?? 0) > 0);
      assert.ok((standard?.priceInr ?? 0) > 0);
    });
  }

  it("uses higher volumetric weight when dimensions dominate", () => {
    const quote = buildQuote(
      {
        countryCode: "AU",
        actualWeightKg: 0.5,
        lengthCm: 50,
        widthCm: 40,
        heightCm: 40,
      },
      { rates },
    );
    // 50*40*40/5000 = 16kg
    assert.ok(quote.chargeableWeightKg >= 16);
    assert.ok(quote.volumetricWeightKg > quote.actualWeightKg);
  });

  it("rejects unsupported country", () => {
    assert.throws(
      () =>
        buildQuote(
          {
            countryCode: "BR",
            actualWeightKg: 1,
            lengthCm: 10,
            widthCm: 10,
            heightCm: 10,
          },
          { rates },
        ),
      QuoteBuildError,
    );
  });

  it("rejects negative / zero weight", () => {
    assert.throws(
      () =>
        buildQuote(
          {
            countryCode: "AU",
            actualWeightKg: 0,
            lengthCm: 10,
            widthCm: 10,
            heightCm: 10,
          },
          { rates },
        ),
      QuoteBuildError,
    );
  });

  it("allows zero dimensions (volumetric = 0)", () => {
    const quote = buildQuote(
      {
        countryCode: "AU",
        actualWeightKg: 1,
        lengthCm: 0,
        widthCm: 0,
        heightCm: 0,
      },
      { rates },
    );
    assert.equal(quote.volumetricWeightKg, 0);
    assert.equal(quote.chargeableWeightKg, 1);
  });

  it("resolves United Arab Emirates correctly (not Dubai)", () => {
    const country = resolveCountry("AE");
    assert.equal(country?.name, "United Arab Emirates");
  });

  it("handles missing rate / unsupported weight", () => {
    const quote = buildQuote(
      {
        countryCode: "AU",
        actualWeightKg: 100,
        lengthCm: 1,
        widthCm: 1,
        heightCm: 1,
      },
      { rates },
    );
    assert.equal(quote.options[0]?.available, false);
    assert.equal(quote.options[1]?.available, false);
  });
});
