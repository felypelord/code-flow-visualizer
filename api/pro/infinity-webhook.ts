import crypto from "crypto";
import postgres from "postgres";

export const config = {
  api: {
    bodyParser: false,
  },
};

type Req = { method: string; headers: Record<string, string | undefined>; body?: any; rawBody?: string | Buffer };
type Res = { setHeader: (k: string, v: string) => void; statusCode: number; end: (b?: string) => void };

type InfinityPayEvent = {
  id: string;
  type: string;
  status?: string;
  amount?: number;
  currency?: string;
  receipt_url?: string;
  metadata?: Record<string, any>;
  customer?: { email?: string };
};

function bufferize(req: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

function verifySignature(rawBody: Buffer, headerSig: string | undefined, secret: string) {
  if (!headerSig) return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  const sig = headerSig.replace(/^sha256=/i, "");
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig));
}

export default async function (req: Req & any, res: Res) {
  const webhookSecret = process.env.INFINITY_PAY_WEBHOOK_SECRET;
  const dbUrl = process.env.DATABASE_URL;

  if (!webhookSecret) {
    res.statusCode = 503;
    res.end("INFINITY_PAY_WEBHOOK_SECRET not configured");
    return;
  }
  if (!dbUrl) {
    res.statusCode = 503;
    res.end("DATABASE_URL not configured");
    return;
  }
  if (req.method !== "POST") {
    res.statusCode = 400;
    res.end("POST only");
    return;
  }

  try {
    const buf = await bufferize(req);
    const sig = req.headers["x-infinity-signature"] as string | undefined;
    if (!verifySignature(buf, sig, webhookSecret)) {
      res.statusCode = 401;
      res.end("invalid signature");
      return;
    }

    const event = JSON.parse(buf.toString()) as InfinityPayEvent;
    const client = postgres(dbUrl, {
      ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
    });

    try {
      // best-effort create audit table
      await client`
        CREATE TABLE IF NOT EXISTS pro_transactions (
          id SERIAL PRIMARY KEY,
          transaction_id TEXT,
          email TEXT,
          status TEXT,
          amount NUMERIC,
          currency TEXT,
          receipt_url TEXT,
          metadata JSONB,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `;

      const email = event.customer?.email || event.metadata?.email;
      const token = event.metadata?.proToken || event.metadata?.pro_token;
      const trialDays = Number(event.metadata?.trial_days || event.metadata?.trialDays || 0) || 0;
      const expiresAt = new Date(Date.now() + (trialDays > 0 ? trialDays : 30) * 24 * 60 * 60 * 1000);

      const receiptUrl = event.receipt_url || event.metadata?.receipt_url || event.metadata?.invoice_url;

      const isPaid = event.type === "payment.succeeded" || event.status === "paid" || event.status === "succeeded";
      const isRefund = event.type === "payment.refunded" || event.status === "refunded" || event.type === "chargeback";

      if (isPaid && email) {
        // Grant Pro to existing user
        await client`
          UPDATE users
          SET is_pro = true, pro_expires_at = ${expiresAt}
          WHERE email = ${email}
        `;

        // Mark entitlement if present
        if (token) {
          try {
            await client`
              UPDATE pro_signup_entitlements
              SET status = 'paid', used_at = NOW(), transaction_id = ${event.id}
              WHERE token = ${token} AND (email = ${email} OR email IS NULL)
            `;
          } catch (_) {
            // Table might not exist; ignore
          }
        }

        await client`
          INSERT INTO pro_transactions (transaction_id, email, status, amount, currency, receipt_url, metadata)
          VALUES (${event.id}, ${email}, 'paid', ${event.amount || null}, ${event.currency || null}, ${receiptUrl || null}, ${client.json(event.metadata || {})})
        `;
      }

      if (isRefund && email) {
        await client`
          UPDATE users
          SET is_pro = false, pro_expires_at = null
          WHERE email = ${email}
        `;
        if (token) {
          try {
            await client`
              UPDATE pro_signup_entitlements
              SET status = 'refunded'
              WHERE token = ${token}
            `;
          } catch (_) {}
        }

        await client`
          INSERT INTO pro_transactions (transaction_id, email, status, amount, currency, receipt_url, metadata)
          VALUES (${event.id}, ${email}, 'refunded', ${event.amount || null}, ${event.currency || null}, ${receiptUrl || null}, ${client.json(event.metadata || {})})
        `;
      }
    } finally {
      await client.end();
    }

    res.statusCode = 200;
    res.end(JSON.stringify({ received: true }));
  } catch (err: any) {
    console.error("[ERROR] /api/pro/infinity-webhook", err?.message || err);
    res.statusCode = 400;
    res.end(`Webhook Error: ${err?.message || String(err)}`);
  }
}
