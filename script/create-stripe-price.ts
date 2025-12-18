import Stripe from "stripe";

const sk = process.env.STRIPE_SECRET_KEY;
if (!sk) {
  console.error("STRIPE_SECRET_KEY not set. Export it and retry.");
  process.exit(1);
}

const stripe = new Stripe(sk, { apiVersion: "2024-12-18.acacia" });

async function main() {
  // 1) Find or create product
  const productName = "Code Flow Pro";
  let product = (await stripe.products.list({ limit: 50 })).data.find(p => p.name === productName);
  if (!product) {
    product = await stripe.products.create({ name: productName });
    console.log(`Created product: ${product.id}`);
  } else {
    console.log(`Using existing product: ${product.id}`);
  }

  // 2) Find or create USD $2.00 monthly recurring price
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

  console.log("\nSet this environment variable before running dev:");
  console.log(`$env:STRIPE_PRICE_PRO_MONTHLY_USD="${price.id}"`);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
