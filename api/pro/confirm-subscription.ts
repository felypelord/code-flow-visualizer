import Stripe from "stripe";
import postgres from "postgres";

type Req = { method: string; headers: Record<string, string | undefined>; body?: any; query?: any };
type Res = { setHeader: (k: string, v: string) => void; statusCode: number; end: (b?: string) => void };

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

  if (!process.env.DATABASE_URL) {
    res.statusCode = 503;
    res.end(JSON.stringify({ ok: false, error: "DATABASE_URL not configured" }));
    return;
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    const sessionId = (body.sessionId as string) || (body.session_id as string) || (req.query?.session_id as string);
    if (!sessionId) {
      res.statusCode = 400;
      res.end(JSON.stringify({ ok: false, error: "sessionId is required" }));
      return;
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    const paid = session.payment_status === "paid" || session.status === "complete";
    const email = session.customer_details?.email || undefined;

    if (!paid || !email) {
      res.statusCode = 402;
      res.end(JSON.stringify({ ok: false, error: "Payment not confirmed or missing email" }));
      return;
    }

    let expiresAt: Date | null = null;
    const subscriptionId = (session.subscription as string) || undefined;
    if (subscriptionId) {
      try {
        const sub = await stripe.subscriptions.retrieve(subscriptionId);
        if (sub.current_period_end) expiresAt = new Date(sub.current_period_end * 1000);
      } catch {
        // If subscription retrieval fails, still set is_pro=true; webhook will reconcile expiry.
      }
    }

    const client = postgres(process.env.DATABASE_URL!, {
      ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
    });

    try {
      const updated = await client`
        UPDATE users
        SET is_pro = ${true}, pro_expires_at = ${expiresAt}
        WHERE email = ${email}
        RETURNING id
      `;

      if (!updated || updated.length === 0) {
        res.statusCode = 404;
        res.end(JSON.stringify({ ok: false, error: "User not found for this email" }));
        return;
      }
    } finally {
      await client.end();
    }

    res.statusCode = 200;
    res.end(JSON.stringify({ ok: true, email, expiresAt: expiresAt ? expiresAt.toISOString() : null }));
  } catch (err: any) {
    console.error("[ERROR] /api/pro/confirm-subscription:", err);
    res.statusCode = 500;
    res.end(JSON.stringify({ ok: false, error: err?.message || String(err) }));
  }
}
