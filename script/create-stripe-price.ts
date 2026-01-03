import Stripe from "stripe";

// Allow running locally without manually exporting vars.
// This does NOT affect Vercel; it's only for this script execution.
import dotenv from "dotenv";

if (!process.env.STRIPE_SECRET_KEY) {
  // Try a few common env files (no error if missing)
  dotenv.config({ path: ".env.local" });
  dotenv.config({ path: ".env.production" });
  dotenv.config({ path: ".env" });
}

const sk = process.env.STRIPE_SECRET_KEY;
if (!sk) {
  console.error("STRIPE_SECRET_KEY not set. Export it and retry.");
  process.exit(1);
}

const stripe = new Stripe(sk, { apiVersion: "2024-12-18.acacia" });

async function main() {
  // 1) Find or create products
  const productName = "Code Flow Pro";
  let product = (await stripe.products.list({ limit: 50 })).data.find(p => p.name === productName);
  if (!product) {
    product = await stripe.products.create({ name: productName });
    console.log(`Created product: ${product.id}`);
  } else {
    console.log(`Using existing product: ${product.id}`);
  }

  const battlePassProductName = "Code Flow Battle Pass";
  let battlePassProduct = (await stripe.products.list({ limit: 50 })).data.find(p => p.name === battlePassProductName);
  if (!battlePassProduct) {
    battlePassProduct = await stripe.products.create({ name: battlePassProductName });
    console.log(`Created product: ${battlePassProduct.id}`);
  } else {
    console.log(`Using existing product: ${battlePassProduct.id}`);
  }

  // 2) Find or create USD $2.00 monthly recurring price (Pro)
  const existingPrices = await stripe.prices.list({ product: product.id, limit: 100 });
  let price = existingPrices.data.find(p => p.currency === "usd" && p.unit_amount === 200 && p.recurring?.interval === "month");
  if (!price) {
    price = await stripe.prices.create({
      product: product.id,
      currency: "usd",
      unit_amount: 200,
      recurring: { interval: "month" },
      nickname: "Pro Monthly $2",
    });
    console.log(`Created price: ${price.id}`);
  } else {
    console.log(`Using existing price: ${price.id}`);
  }

  // 3) Find or create Battle Pass one-time $5.00 USD price
  const battlePassPrices = await stripe.prices.list({ product: battlePassProduct.id, limit: 100 });
  let battlePassPrice = battlePassPrices.data.find(p => p.currency === "usd" && p.unit_amount === 500 && !p.recurring);
  if (!battlePassPrice) {
    battlePassPrice = await stripe.prices.create({
      product: battlePassProduct.id,
      currency: "usd",
      unit_amount: 500,
      nickname: "Battle Pass $5 (one-time)",
    });
    console.log(`Created price: ${battlePassPrice.id}`);
  } else {
    console.log(`Using existing price: ${battlePassPrice.id}`);
  }

  console.log("\nSet this environment variable before running dev:");
  console.log(`$env:STRIPE_PRICE_PRO_MONTHLY_USD="${price.id}"`);
  console.log(`$env:STRIPE_PRICE_BATTLE_PASS="${battlePassPrice.id}"`);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
