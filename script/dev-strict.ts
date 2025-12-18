import postgres from "postgres";

function log(msg: string) {
  const t = new Date().toISOString();
  console.log(`${t} [dev:strict] ${msg}`);
}

async function main() {
  const env = process.env;
  const nodeEnv = env.NODE_ENV || "development";
  const required = ["DATABASE_URL", "JWT_SECRET"];
  const missing = required.filter((k) => !env[k] || String(env[k]).trim().length === 0);

  if (missing.length > 0) {
    log(`Missing required envs: ${missing.join(", ")}`);
    log(`Set them before starting the server.`);
    process.exit(1);
  }

  const dbUrl = env.DATABASE_URL as string;
  log(`Testing database connectivity...`);
  try {
    const ssl = env.PGSSL === "true" || nodeEnv === "production";
    const client = postgres(dbUrl, ssl ? { ssl: { rejectUnauthorized: env.PGSSL_REJECT_UNAUTHORIZED !== "false" } } : {});
    const rows = await client`select 1 as ok`;
    if (!rows || rows.length === 0) throw new Error("No rows returned");
    log(`Database OK`);
  } catch (e: any) {
    log(`Database connection failed: ${e?.message || e}`);
    process.exit(1);
  }

  const stripeKey = env.STRIPE_SECRET_KEY || "";
  const stripePrice = env.STRIPE_PRICE_PRO_MONTHLY_USD || "";
  const stripeWebhook = env.STRIPE_WEBHOOK_SECRET || "";
  const placeholders = [stripeKey, stripePrice, stripeWebhook].some((v) => /CHANGE_ME/i.test(String(v)) || !String(v));
  if (placeholders) {
    log(`Stripe envs are not fully configured. Hosted Checkout and webhooks may not work until you set:`);
    log(` - STRIPE_SECRET_KEY`);
    log(` - STRIPE_PRICE_PRO_MONTHLY_USD`);
    log(` - STRIPE_WEBHOOK_SECRET`);
  } else {
    log(`Stripe envs detected.`);
  }

  log(`All critical checks passed. You can start the dev server now.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
