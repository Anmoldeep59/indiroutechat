import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { findAdminBaseRateRow, toSelectedFromBaseRate } from "./base-rate";
import { resolveCountry } from "./countries";
import {
  DEFAULT_INDIROUTE_FEE_SLABS,
  DEFAULT_MARGIN_BRACKETS,
  DEFAULT_SHIPPING_SETTINGS,
} from "./defaults";
import { isIndiaPostService } from "./india-post";
import { getIndiRouteFee } from "./packing";
import {
  calculateCustomerPrice,
  PricingSafetyError,
  selectMarginPercent,
} from "./pricing";
import { buildQuote, QuoteBuildError } from "./quote-builder";
import type { AramexBaseRateRow } from "./types";

const sampleRates: AramexBaseRateRow[] = [
  {
    country_code: "AU",
    country_name: "Australia",
    service_tier: "economy",
    min_weight_kg: 0,
    max_weight_kg: 0.5,
    base_aramex_rate: 1200,
    currency: "INR",
    source_sla: "Up to 20 Business Days",
    active: true,
  },
  {
    country_code: "AU",
    country_name: "Australia",
    service_tier: "economy",
    min_weight_kg: 0.5,
    max_weight_kg: 2,
    base_aramex_rate: 1500,
    currency: "INR",
    source_sla: "Up to 20 Business Days",
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
    source_sla: "10–15 Business Days",
    active: true,
  },
  {
    country_code: "AU",
    country_name: "Australia",
    service_tier: "standard",
    min_weight_kg: 0.5,
    max_weight_kg: 2,
    base_aramex_rate: 2100,
    currency: "INR",
    source_sla: "10–15 Business Days",
    active: true,
  },
];

describe("India Post exclusion", () => {
  it("blocks known service IDs and name patterns", () => {
    assert.equal(isIndiaPostService(326, "Something"), true);
    assert.equal(isIndiaPostService(384, "SRX Economy"), false);
    assert.equal(isIndiaPostService(999, "India Post EMS"), true);
  });
});

describe("Aramex-style pricing formula", () => {
  it("matches the documented ₹1,500 example", () => {
    const priced = calculateCustomerPrice(
      1500,
      1.5,
      DEFAULT_SHIPPING_SETTINGS,
      DEFAULT_INDIROUTE_FEE_SLABS,
      DEFAULT_MARGIN_BRACKETS,
    );

    assert.equal(priced.fuelCharge, 348.75);
    assert.equal(priced.aramexLandedCost, 1848.75);
    assert.equal(priced.marginPercent, 12);
    assert.equal(priced.shippingSellingPrice, 2070.6);
    assert.equal(priced.indiRouteFee, 169);
    assert.equal(priced.preRoundTotal, 2239.6);
    assert.equal(priced.finalPrice, 2240);
  });

  it("selects margin brackets correctly", () => {
    assert.equal(selectMarginPercent(1000), 15);
    assert.equal(selectMarginPercent(1001), 12);
    assert.equal(selectMarginPercent(2500), 12);
    assert.equal(selectMarginPercent(2501), 10);
    assert.equal(selectMarginPercent(5000), 10);
    assert.equal(selectMarginPercent(5000.01), 8);
  });

  it("rejects final prices below shipping selling price", () => {
    assert.throws(() => {
      calculateCustomerPrice(1500, 1.5, {
        ...DEFAULT_SHIPPING_SETTINGS,
        final_price_round_to_inr: 10,
      }, DEFAULT_INDIROUTE_FEE_SLABS, DEFAULT_MARGIN_BRACKETS, -5000);
    }, PricingSafetyError);
  });
});

describe("IndiRoute fee slabs", () => {
  it("uses combined weight-based fee", () => {
    assert.equal(getIndiRouteFee(0.5), 99);
    assert.equal(getIndiRouteFee(0.51), 129);
    assert.equal(getIndiRouteFee(1.5), 169);
    assert.equal(getIndiRouteFee(10), 399);
    assert.equal(getIndiRouteFee(10.01), 599);
    assert.equal(getIndiRouteFee(25), 799);
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
    const selected = toSelectedFromBaseRate(row!, "standard");
    assert.equal(selected.baseAramexRate, 2100);
    assert.doesNotMatch(selected.sourceServiceName, /India Post/i);
  });
});

describe("quote builder", () => {
  it("quotes AU with IndiRoute names only when base rates exist", async () => {
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

    assert.equal(quote.origin, "India");
    const economy = quote.options.find((o) => o.tier === "economy");
    const standard = quote.options.find((o) => o.tier === "standard");
    const express = quote.options.find((o) => o.tier === "express");
    assert.ok(economy?.available);
    assert.ok(standard?.available);
    assert.equal(economy?.displayName, "IndiRoute Economy");
    assert.equal(standard?.displayName, "IndiRoute Standard");
    assert.equal(express?.comingSoon, true);
    assert.equal(express?.priceInr, null);

    const blob = JSON.stringify(quote);
    assert.doesNotMatch(blob, /fuelCharge|baseAramexRate|AramexLanded|marginPercent/i);
  });

  it("uses volumetric weight when dimensions dominate", async () => {
    await assert.rejects(
      () =>
        buildQuote(
          {
            countryCode: "AU",
            actualWeightKg: 0.2,
            lengthCm: 50,
            widthCm: 40,
            heightCm: 40,
          },
          { baseRates: sampleRates },
        ),
      (error: unknown) =>
        error instanceof QuoteBuildError &&
        error.code === "missing_rates",
    );

    // Prove volumetric math: 50*40*40/5000 = 16kg chargeable
    const { calculateChargeableWeightKg } = await import("./weight");
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

  it("rejects missing admin base rates without inventing", async () => {
    await assert.rejects(
      () =>
        buildQuote(
          {
            countryCode: "AU",
            actualWeightKg: 1,
            lengthCm: 10,
            widthCm: 10,
            heightCm: 10,
          },
          { baseRates: [] },
        ),
      QuoteBuildError,
    );
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
