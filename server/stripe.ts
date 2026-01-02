import Stripe from "stripe";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

if (!STRIPE_SECRET_KEY) {
  // We only throw when attempting to use Stripe without config.
  // Handlers will check and return 503 if not configured.
}

export function getStripe(): Stripe | null {
  if (!STRIPE_SECRET_KEY) return null;
  return new Stripe(STRIPE_SECRET_KEY, {
    apiVersion: "2023-10-16",
  });
}

export function getBaseUrl(req: { headers: any; protocol?: string }) {
  const headerOrigin = req.headers?.origin as string | undefined;
  const host = (req.headers?.host as string | undefined) || "localhost:5000";
  const scheme = (req as any).protocol || (headerOrigin?.startsWith("https") ? "https" : "http");
  const baseFromEnv = process.env.PUBLIC_BASE_URL;
  return baseFromEnv || headerOrigin || `${scheme}://${host}`;
}

// Legacy generic price IDs (fallback)
export const STRIPE_PRICE_PRO_MONTHLY = process.env.STRIPE_PRICE_PRO_MONTHLY || "";
export const STRIPE_PRICE_PRO_ANNUAL = process.env.STRIPE_PRICE_PRO_ANNUAL || "";

// Currency-specific price IDs
export const STRIPE_PRICE_PRO_MONTHLY_USD = process.env.STRIPE_PRICE_PRO_MONTHLY_USD || "";
export const STRIPE_PRICE_PRO_MONTHLY_BRL = process.env.STRIPE_PRICE_PRO_MONTHLY_BRL || "";
export const STRIPE_PRICE_PRO_ANNUAL_USD = process.env.STRIPE_PRICE_PRO_ANNUAL_USD || "";
export const STRIPE_PRICE_PRO_ANNUAL_BRL = process.env.STRIPE_PRICE_PRO_ANNUAL_BRL || "";
export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "";

// Battle Pass (one-time $5 purchase)
export const STRIPE_PRICE_BATTLE_PASS = process.env.STRIPE_PRICE_BATTLE_PASS || "";
