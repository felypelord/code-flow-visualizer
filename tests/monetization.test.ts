import { describe, it, expect, vi, beforeEach } from 'vitest';
import path from 'path';

// (Paths resolved at runtime inside hooks to avoid hoisting issues)

let monetization: any = null;

beforeEach(async () => {
  // Ensure webhook secret is present for webhook handling
  process.env.STRIPE_WEBHOOK_SECRET = 'test_secret';
  // Set up runtime mocks (avoid hoisting issues)
  vi.doMock('stripe', () => {
    return {
      default: function Stripe() {
        return {
          checkout: {
            sessions: {
              create: vi.fn(async (opts: any) => ({ id: 'sess_test_1', url: 'https://checkout.test/session/sess_test_1' })),
            },
          },
          webhooks: {
            constructEvent: vi.fn((rawBody: any, sig: any, secret: any) => {
              return {
                type: 'checkout.session.completed',
                data: {
                  object: {
                    id: 'sess_test_1',
                    metadata: { userId: 'user_test', packageId: 'hint', itemId: 'exercise:ex1:hint', type: 'micro' },
                    client_reference_id: 'user_test',
                  },
                },
              };
            }),
          },
        };
      },
    };
  });

  // Mock DB and schema modules using absolute resolved paths
  const DB_PATH = path.resolve(process.cwd(), 'server', 'db.js');
  const SCHEMA_PATH = path.resolve(process.cwd(), 'shared', 'schema.js');
  vi.doMock(DB_PATH, () => {
    const dbMock = {
      insert: vi.fn(() => ({ values: async () => ({}) })),
      update: vi.fn(() => ({ set: () => ({ where: async () => ({}) }) })),
      select: vi.fn(() => ({ from: () => ({ where: () => ({ orderBy: () => ({}) }) }) })),
      query: {
        users: {
          findFirst: async () => ({ freeUsageCount: 0, isPro: false }),
        },
      },
    };
    return { db: dbMock };
  }, { virtual: false });
  vi.doMock(SCHEMA_PATH, () => ({
    users: {},
    infinityPayPurchases: {},
    coinTransactions: {},
    adRewards: {},
    storePurchases: {},
  }), { virtual: false });

  // Import the module under test after mocks are set
  monetization = (await import('../api/monetization/index.js')) as any;
});

describe('monetization createPayment + webhook (mocked)', () => {
  it('createPayment returns checkoutUrl', async () => {
    const req: any = {
      body: { packageId: 'hint', itemId: 'exercise:ex1:hint' },
      user: { id: 'user_test', email: 'user@test' },
    };

    let jsonData: any = null;
    const res: any = {
      status: (code: number) => ({ json: (d: any) => { jsonData = d; return d; } }),
      json: (d: any) => { jsonData = d; return d; },
    };

    await monetization.createPayment(req, res);

    expect(jsonData).toBeTruthy();
    expect(jsonData.checkoutUrl).toBe('https://checkout.test/session/sess_test_1');
    expect(jsonData.sessionId).toBe('sess_test_1');
  });

  it('stripeWebhook processes checkout.session.completed', async () => {
    const req: any = { headers: { 'stripe-signature': 'sig' }, rawBody: 'raw' };
    let jsonData: any = null;
    const res: any = {
      status: (code: number) => ({ json: (d: any) => { jsonData = d; return d; } }),
      json: (d: any) => { jsonData = d; return d; },
    };

    await monetization.stripeWebhook(req, res);

    expect(jsonData).toEqual({ received: true });
  });
});
