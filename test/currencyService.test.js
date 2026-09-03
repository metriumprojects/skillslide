import test from "node:test";
import assert from "node:assert/strict";
import { normalizeCurrency, requireCurrency, roundMoney, toSmallestUnit } from "../src/services/currencyService.js";

test("normalizes supported and legacy currency values", () => {
  assert.equal(normalizeCurrency("eur"), "EUR");
  assert.equal(normalizeCurrency("inr"), "INR");
  assert.equal(normalizeCurrency("US Dollar"), "USD");
  assert.equal(normalizeCurrency("unsupported"), "USD");
  assert.equal(requireCurrency("GBP"), "GBP");
  assert.throws(() => requireCurrency("BTC"), /not supported/);
});

test("rounds canonical money and Stripe units consistently", () => {
  assert.equal(roundMoney(12.345), 12.35);
  assert.equal(toSmallestUnit(12.345), 1235);
  assert.equal(toSmallestUnit(1000, "INR"), 100000);
  assert.equal(toSmallestUnit(1000, "JPY"), 1000);
  assert.throws(() => roundMoney(-1), /non-negative/);
  assert.throws(() => roundMoney("bad"), /non-negative/);
});
