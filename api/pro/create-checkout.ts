import Stripe from "stripe";

type Req = { method: string; headers: Record<string,string | undefined>; body?: any };
type Res = { setHeader: (k:string,v:string)=>void; statusCode: number; end: (b?:string)=>void };

function getBaseUrl(req: Req) {
  const origin = (req.headers["origin"] || req.headers["x-forwarded-origin"]) as string | undefined;
  const host = (req.headers["x-forwarded-host"] || req.headers["host"]) as string | undefined;
  const proto = (req.headers["x-forwarded-proto"] as string | undefined) || "https";
  return origin || (host ? `${proto}://${host}` : "https://www.codeflowbr.site");
}

function pickPriceId(plan?: string, currency?: string) {
  const p = (plan || "monthly").toLowerCase();
  const c = (currency || "BRL").toUpperCase();
  const m = {
    MONTHLY_USD: process.env.STRIPE_PRICE_PRO_MONTHLY_USD || "",
    MONTHLY_BRL: process.env.STRIPE_PRICE_PRO_MONTHLY_BRL || "",
    ANNUAL_USD: process.env.STRIPE_PRICE_PRO_ANNUAL_USD || "",
    ANNUAL_BRL: process.env.STRIPE_PRICE_PRO_ANNUAL_BRL || "",
  };
  if (p === "annual" && c === "USD" && m.ANNUAL_USD) return m.ANNUAL_USD;
  if (p === "annual" && c === "BRL" && m.ANNUAL_BRL) return m.ANNUAL_BRL;
  if (p === "monthly" && c === "USD" && m.MONTHLY_USD) return m.MONTHLY_USD;
  if (p === "monthly" && c === "BRL" && m.MONTHLY_BRL) return m.MONTHLY_BRL;
  // Fallback to generic monthly env var names used elsewhere in the project
  return process.env.STRIPE_PRICE_PRO_MONTHLY || process.env.STRIPE_PRICE_PRO_MONTHLY_USD || process.env.STRIPE_PRICE_PRO_MONTHLY_BRL || "";
}

export default async function (req: Req, res: Res) {
  res.setHeader("Content-Type", "application/json");

  if (req.method !== "POST") {
    res.statusCode = 400;
    res.end(JSON.stringify({ ok: false, error: "POST only" }));
    return;
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    res.statusCode = 503;
    res.end(JSON.stringify({ ok: false, error: "Stripe not configured (STRIPE_SECRET_KEY missing)" }));
    return;
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
    const email = (body.email as string | undefined) || undefined;
    const plan = (body.plan as string | undefined) || "monthly";
    const currency = (body.currency as string | undefined) || "BRL";
    const price = pickPriceId(plan, currency);
    if (!price) {
      const hint = "Set STRIPE_PRICE_PRO_MONTHLY_BRL / STRIPE_PRICE_PRO_MONTHLY_USD or STRIPE_PRICE_PRO_MONTHLY in environment.";
      console.error("[ERROR] /api/pro/create-checkout: no price configured for plan=", plan, "currency=", currency);
      res.statusCode = 500;
      res.end(JSON.stringify({ ok: false, error: "No Stripe price configured", hint }));
      return;
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    const baseUrl = getBaseUrl(req);

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [ { price, quantity: 1 } ],
      success_url: `${baseUrl}/pro?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/pro?canceled=1`,
      customer_email: email,
      allow_promotion_codes: true,
      metadata: { plan, currency },
    });

    res.statusCode = 200;
    res.end(JSON.stringify({ ok: true, id: session.id, url: session.url }));
  } catch (err: any) {
    console.error("[ERROR] /api/pro/create-checkout:", err);
    res.statusCode = 500;
    res.end(JSON.stringify({ ok: false, error: err?.message || String(err) }));
  }
}
