import test from "node:test";
import assert from "node:assert/strict";
import Stripe from "stripe";
import { stripeWebhook } from "../src/controllers/stripeWebhookController.js";

const invoke = async ({ body, signature }) => {
  const result = { statusCode: 200, body: undefined };
  const req = { body, headers: { "stripe-signature": signature } };
  const res = {
    status(code) { result.statusCode = code; return this; },
    send(value) { result.body = value; return this; },
    json(value) { result.body = value; return this; },
  };
  await stripeWebhook(req, res);
  return result;
};

const restoreEnv = (name, value) => {
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
};

test("Stripe webhook rejects an invalid signature", async () => {
  const previous = process.env.STRIPE_WEBHOOK_SECRET;
  process.env.STRIPE_WEBHOOK_SECRET = "whsec_test_signature_secret";
  const response = await invoke({ body: Buffer.from("{}"), signature: "invalid" });
  restoreEnv("STRIPE_WEBHOOK_SECRET", previous);
  assert.equal(response.statusCode, 400);
});

test("Stripe webhook accepts a verified unhandled event", async () => {
  const secret = "whsec_test_signature_secret";
  const previous = process.env.STRIPE_WEBHOOK_SECRET;
  process.env.STRIPE_WEBHOOK_SECRET = secret;
  const payload = JSON.stringify({
    id: "evt_test_verified",
    object: "event",
    type: "balance.available",
    data: { object: { object: "balance" } },
  });
  const signature = Stripe.webhooks.generateTestHeaderString({ payload, secret });
  const response = await invoke({ body: Buffer.from(payload), signature });
  restoreEnv("STRIPE_WEBHOOK_SECRET", previous);
  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.body, { received: true });
});
