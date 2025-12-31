import Stripe from "stripe";
import postgres from "postgres";

type Req = { method: string; headers: Record<string,string | undefined>; body?: any; rawBody?: string | Buffer };
type Res = { setHeader: (k:string,v:string)=>void; statusCode: number; end: (b?:string)=>void };

export const config = {
  api: {
    bodyParser: false,
  },
};

function bufferize(req: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export default async function (req: Req & any, res: Res) {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripeKey || !webhookSecret) {
    res.statusCode = 503;
    res.end("Stripe not configured");
    return;
  }
  if (!process.env.DATABASE_URL) {
    res.statusCode = 503;
    res.end("DATABASE_URL not configured");
    return;
  }

  if (req.method !== 'POST') {
    res.statusCode = 400;
    res.end('POST only');
    return;
  }

  try {
    const buf = await bufferize(req);
    const sig = req.headers['stripe-signature'] as string;
    const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' });
    const event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);

    const client = postgres(process.env.DATABASE_URL!, {
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });

    try {
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.Checkout.Session;
          const email = session.customer_details?.email || undefined;
          const subId = (session.subscription as string) || undefined;
          if (email) {
            let expiresAt: Date | null = null;
            if (subId) {
              const sub = await stripe.subscriptions.retrieve(subId);
              if (sub.current_period_end) expiresAt = new Date(sub.current_period_end * 1000);
            }
            await client`
              UPDATE users SET is_pro = ${true}, pro_expires_at = ${expiresAt}
              WHERE email = ${email}
            `;
          }
          break;
        }
        case 'customer.subscription.updated':
        case 'customer.subscription.deleted': {
          const sub = event.data.object as Stripe.Subscription;
          const customerId = sub.customer as string;
          // Try to get email via customer lookup
          const customer = await stripe.customers.retrieve(customerId);
          const email = (customer as any).email as string | undefined;
          const status = sub.status;
          const active = status === 'active' || status === 'trialing' || status === 'past_due';
          const expiresAt = sub.current_period_end ? new Date(sub.current_period_end * 1000) : null;
          if (email) {
            await client`
              UPDATE users SET is_pro = ${active}, pro_expires_at = ${active ? expiresAt : null}
              WHERE email = ${email}
            `;
          }
          break;
        }
        case 'invoice.payment_failed': {
          const invoice = event.data.object as Stripe.Invoice;
          const customerId = invoice.customer as string;
          const customer = await stripe.customers.retrieve(customerId);
          const email = (customer as any).email as string | undefined;
          if (email) {
            await client`
              UPDATE users SET is_pro = ${false}
              WHERE email = ${email}
            `;
          }
          break;
        }
        default:
          // ignore others
          break;
      }
    } finally {
      await client.end();
    }

    res.statusCode = 200;
    res.end(JSON.stringify({ received: true }));
  } catch (err: any) {
    console.error('[ERROR] /api/pro/webhook', err?.message || err);
    res.statusCode = 400;
    res.end(`Webhook Error: ${err?.message || String(err)}`);
  }
}
