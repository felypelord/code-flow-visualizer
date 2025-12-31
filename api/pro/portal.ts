import Stripe from "stripe";

type Req = { method: string; headers: Record<string,string | undefined>; body?: any };
type Res = { setHeader: (k:string,v:string)=>void; statusCode: number; end: (b?:string)=>void };

function getBaseUrl(req: Req) {
  const origin = (req.headers["origin"] || req.headers["x-forwarded-origin"]) as string | undefined;
  const host = (req.headers["x-forwarded-host"] || req.headers["host"]) as string | undefined;
  const proto = (req.headers["x-forwarded-proto"] as string | undefined) || "https";
  return origin || (host ? `${proto}://${host}` : "https://codeflowbr.site");
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
    res.end(JSON.stringify({ ok: false, error: "Stripe not configured" }));
    return;
  }
  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    const email = String(body.email || "").trim();
    if (!email) {
      res.statusCode = 400;
      res.end(JSON.stringify({ ok: false, error: "email is required" }));
      return;
    }
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    const list = await stripe.customers.list({ email, limit: 1 });
    const customer = list.data[0];
    if (!customer) {
      res.statusCode = 404;
      res.end(JSON.stringify({ ok: false, error: "customer not found" }));
      return;
    }
    const session = await stripe.billingPortal.sessions.create({
      customer: customer.id,
      return_url: `${getBaseUrl(req)}/pro`,
    });
    res.statusCode = 200;
    res.end(JSON.stringify({ ok: true, url: session.url }));
  } catch (err: any) {
    console.error("[ERROR] /api/pro/portal:", err);
    res.statusCode = 500;
    res.end(JSON.stringify({ ok: false, error: err?.message || String(err) }));
  }
}
