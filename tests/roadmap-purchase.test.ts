import { describe, it, expect, vi, beforeEach } from 'vitest';
import path from 'path';

const DB_PATH = path.resolve(process.cwd(), 'server', 'db.js');
const SCHEMA_PATH = path.resolve(process.cwd(), 'shared', 'schema.js');

let monetization: any = null;

beforeEach(async () => {
  process.env.STRIPE_WEBHOOK_SECRET = 'test_secret';
  // Force Stripe mode (not simulation) so we exercise mocked Stripe checkout.
  process.env.STRIPE_SECRET_KEY = 'sk_test_123';

  vi.doMock('stripe', () => {
    return {
      default: function Stripe() {
        return {
          checkout: {
            sessions: {
              create: vi.fn(async (opts: any) => ({ id: 'sess_roadmap_1', url: 'https://checkout.test/session/sess_roadmap_1' })),
            },
          },
          webhooks: {
            constructEvent: vi.fn((rawBody: any, sig: any, secret: any) => {
              return {
                type: 'checkout.session.completed',
                data: {
                  object: {
                    id: 'sess_roadmap_1',
                    metadata: { userId: 'user_test', packageId: 'roadmap_item', itemId: 'roadmap:binary-search', type: 'micro' },
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

  vi.doMock(DB_PATH, () => {
    const mockUser = { id: 'user_test', isPro: false, proExpiresAt: new Date(0), premiumPurchases: 0, coins: 0 };
    const dbMock = {
      insert: vi.fn(() => ({ values: async () => ({}) })),
      update: vi.fn(() => ({ set: () => ({ where: async () => ({}) }) })),
      select: vi.fn(() => ({
        from: () => ({
          where: () => ({
            limit: async () => [mockUser],
            orderBy: () => ({}),
          }),
        }),
      })),
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
  // Import the module under test after setting env and mocks
  monetization = (await import('../api/monetization/index.js')) as any;
});

describe('roadmap micro purchase (mocked)', () => {
  it('createPayment for roadmap_item returns checkoutUrl', async () => {
    const req: any = {
      body: { packageId: 'roadmap_item', itemId: 'roadmap:binary-search' },
      user: { id: 'user_test', email: 'user@test' },
    };
    let jsonData: any = null;
    const res: any = {
      status: (code: number) => ({ json: (d: any) => { jsonData = d; return d; } }),
      json: (d: any) => { jsonData = d; return d; },
    };

    await monetization.createPayment(req, res);
    expect(jsonData).toBeTruthy();
    expect(jsonData.checkoutUrl).toBe('https://checkout.test/session/sess_roadmap_1');
  });

  it('stripeWebhook records completed roadmap micro purchase', async () => {
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
