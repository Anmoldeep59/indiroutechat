import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { findAdminBaseRateRow, toSelectedFromBaseRate } from "./base-rate";
import { SHIPPING_COUNTRIES, resolveCountry } from "./countries";
import {
  DEFAULT_HANDLING_FEE_SLABS,
  DEFAULT_MARGIN_BRACKETS,
  DEFAULT_REPACKING_FEE_SLABS,
  DEFAULT_SERVICE_FEE_SLABS,
  DEFAULT_SHIPPING_SETTINGS,
} from "./defaults";
import { isIndiaPostService } from "./india-post";
import {
  getHandlingFee,
  getRepackingFee,
  getServiceFee,
} from "./packing";
import {
  calculateCustomerPrice,
  PricingSafetyError,
  selectMarginPercent,
} from "./pricing";
import { buildQuote, QuoteBuildError, toPublicQuote } from "./quote-builder";
import { getDefaultServiceMap } from "./service-map";
import type { AramexBaseRateRow } from "./types";
import { calculateChargeableWeightKg } from "./weight";

const sampleRates: AramexBaseRateRow[] = [
  {
    country_code: "AU",
    country_name: "Australia",
    service_tier: "economy",
    min_weight_kg: 0,
    max_weight_kg: 0.5,
    base_aramex_rate: 1200,
    currency: "INR",
    source_sla: "IGNORE THIS ARAMEX SLA",
    active: true,
  },
  {
    country_code: "AU",
    country_name: "Australia",
    service_tier: "economy",
    min_weight_kg: 0.5,
    max_weight_kg: 30,
    base_aramex_rate: 1500,
    currency: "INR",
    source_sla: null,
    active: true,
  },
  {
    country_code: "AU",
    country_name: "Australia",
    service_tier: "standard",
    min_weight_kg: 0,
    max_weight_kg: 0.5,
    base_aramex_rate: 1800,
    currency: "INR",
    source_sla: null,
    active: true,
  },
  {
    country_code: "AU",
    country_name: "Australia",
    service_tier: "standard",
    min_weight_kg: 0.5,
    max_weight_kg: 30,
    base_aramex_rate: 2100,
    currency: "INR",
    source_sla: null,
    active: true,
  },
];

const feeSlabs = {
  handling: DEFAULT_HANDLING_FEE_SLABS,
  service: DEFAULT_SERVICE_FEE_SLABS,
  repacking: DEFAULT_REPACKING_FEE_SLABS,
};

describe("India Post exclusion", () => {
  it("blocks known service IDs and name patterns", () => {
    assert.equal(isIndiaPostService(326, "Something"), true);
    assert.equal(isIndiaPostService(384, "SRX Economy"), false);
    assert.equal(isIndiaPostService(999, "India Post EMS"), true);
  });
});

describe("Aramex transport pricing formula", () => {
  it("matches the documented ₹1,500 / 1.5kg example → ₹2,360", () => {
    const priced = calculateCustomerPrice(
      1500,
      1.5,
      DEFAULT_SHIPPING_SETTINGS,
      feeSlabs,
      DEFAULT_MARGIN_BRACKETS,
    );

    assert.equal(priced.aramexFuelSurcharge, 348.75);
    assert.equal(priced.aramexTransportCost, 1848.75);
    assert.equal(priced.marginPercent, 10);
    assert.equal(priced.indiRouteTransportPrice, 2033.63);
    assert.equal(priced.handlingFee, 89);
    assert.equal(priced.serviceFee, 129);
    assert.equal(priced.repackingFee, 99);
    assert.equal(priced.preRoundTotal, 2350.63);
    assert.equal(priced.finalPrice, 2360);
  });

  it("selects modest margin brackets", () => {
    assert.equal(selectMarginPercent(1000), 12);
    assert.equal(selectMarginPercent(1001), 10);
    assert.equal(selectMarginPercent(2500), 10);
    assert.equal(selectMarginPercent(2501), 8);
    assert.equal(selectMarginPercent(5000), 8);
    assert.equal(selectMarginPercent(5000.01), 6);
  });

  it("rejects final prices below transport floor", () => {
    assert.throws(() => {
      calculateCustomerPrice(
        1500,
        1.5,
        DEFAULT_SHIPPING_SETTINGS,
        feeSlabs,
        DEFAULT_MARGIN_BRACKETS,
        { packingFeeOverride: -10000 },
      );
    }, PricingSafetyError);
  });
});

describe("IndiRoute fee slabs", () => {
  it("applies handling / service / repacking separately", () => {
    assert.equal(getHandlingFee(0.5), 49);
    assert.equal(getHandlingFee(0.51), 69);
    assert.equal(getHandlingFee(1.5), 89);
    assert.equal(getServiceFee(1.5), 129);
    assert.equal(getRepackingFee(1.5), 99);
    assert.equal(getHandlingFee(10), 199);
    assert.equal(getServiceFee(10.01), 349);
    assert.equal(getRepackingFee(25), 599);
  });
});

describe("admin base rate lookup", () => {
  it("never invents rates and picks weight band", () => {
    const row = findAdminBaseRateRow(sampleRates, {
      countryCode: "AU",
      countryName: "Australia",
      tier: "standard",
      chargeableWeightKg: 1.5,
    });
    assert.ok(row);
    assert.equal(row!.base_aramex_rate, 2100);
  });

  it("uses existing service-map SLA, not Aramex row SLA", () => {
    const row = findAdminBaseRateRow(sampleRates, {
      countryCode: "AU",
      countryName: "Australia",
      tier: "economy",
      chargeableWeightKg: 0.3,
    });
    assert.ok(row);
    const selected = toSelectedFromBaseRate(row!, "economy");
    const mapSla = getDefaultServiceMap("AU")?.economy[0]?.sourceSla;
    assert.equal(selected.sourceSla, mapSla);
    assert.notEqual(selected.sourceSla, "IGNORE THIS ARAMEX SLA");
  });
});

describe("quote builder", () => {
  it("quotes AU with IndiRoute names and preserved SLAs", async () => {
    const quote = await buildQuote(
      {
        countryCode: "AU",
        actualWeightKg: 1.5,
        lengthCm: 10,
        widthCm: 10,
        heightCm: 10,
      },
      { baseRates: sampleRates },
    );

    const economy = quote.options.find((o) => o.tier === "economy");
    const standard = quote.options.find((o) => o.tier === "standard");
    const express = quote.options.find((o) => o.tier === "express");
    assert.ok(economy?.available);
    assert.ok(standard?.available);
    assert.equal(economy?.displayName, "IndiRoute Economy");
    assert.equal(standard?.displayName, "IndiRoute Standard");
    assert.equal(economy?.estimatedDelivery, "Up to 20 Business Days");
    assert.equal(standard?.estimatedDelivery, "10–15 Business Days");
    assert.equal(express?.comingSoon, true);

    const publicQuote = toPublicQuote(quote);
    const blob = JSON.stringify(publicQuote);
    assert.doesNotMatch(
      blob,
      /fuelCharge|baseAramexRate|aramexTransport|marginPercent|handlingFee/i,
    );
  });

  it("hides missing Economy when only Standard exists", async () => {
    const standardOnly = sampleRates.filter((r) => r.service_tier === "standard");
    const quote = await buildQuote(
      {
        countryCode: "AU",
        actualWeightKg: 1,
        lengthCm: 10,
        widthCm: 10,
        heightCm: 10,
      },
      { baseRates: standardOnly },
    );
    assert.equal(
      quote.options.some((o) => o.tier === "economy"),
      false,
    );
    assert.ok(quote.options.some((o) => o.tier === "standard" && o.available));
    assert.ok(quote.options.some((o) => o.tier === "express"));
  });

  it("returns friendly message when both rates missing", async () => {
    await assert.rejects(
      () =>
        buildQuote(
          {
            countryCode: "IT",
            actualWeightKg: 1,
            lengthCm: 10,
            widthCm: 10,
            heightCm: 10,
          },
          { baseRates: [] },
        ),
      (error: unknown) =>
        error instanceof QuoteBuildError &&
        error.code === "missing_rates" &&
        error.message ===
          "Shipping quote temporarily unavailable for this destination.",
    );
  });

  it("uses volumetric weight when dimensions dominate", () => {
    const weights = calculateChargeableWeightKg(
      0.2,
      50,
      40,
      40,
      DEFAULT_SHIPPING_SETTINGS,
    );
    assert.ok(weights.volumetricWeightKg > weights.actualWeightKg);
    assert.equal(Number(weights.chargeableWeightKg.toFixed(1)), 16);
  });

  it("covers supported countries list", () => {
    const codes = SHIPPING_COUNTRIES.map((c) => c.code).sort();
    assert.deepEqual(codes, [
      "AE",
      "AU",
      "CA",
      "CH",
      "DE",
      "FR",
      "GB",
      "IT",
      "JP",
      "MY",
      "NZ",
      "SA",
      "SG",
      "US",
    ]);
  });

  it("quotes weight bands 0.5–10kg when rates exist", async () => {
    for (const kg of [0.5, 1, 2, 5, 10]) {
      const quote = await buildQuote(
        {
          countryCode: "AU",
          actualWeightKg: kg,
          lengthCm: 10,
          widthCm: 10,
          heightCm: 10,
        },
        { baseRates: sampleRates },
      );
      assert.ok(
        quote.options.some((o) => o.tier === "standard" && o.available),
        `expected standard quote at ${kg}kg`,
      );
      assert.ok(
        (quote.options.find((o) => o.tier === "standard")?.priceInr ?? 0) > 0,
      );
    }
  });

  it("rejects unsupported country", async () => {
    await assert.rejects(
      () =>
        buildQuote(
          {
            countryCode: "BR",
            actualWeightKg: 1,
            lengthCm: 10,
            widthCm: 10,
            heightCm: 10,
          },
          { baseRates: sampleRates },
        ),
      QuoteBuildError,
    );
  });

  it("resolves United Arab Emirates correctly", () => {
    assert.equal(resolveCountry("AE")?.name, "United Arab Emirates");
  });
});
