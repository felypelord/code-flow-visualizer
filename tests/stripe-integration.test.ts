#!/usr/bin/env node

/**
 * Test suite para validar Stripe integration antes do deploy
 * Execute: npm test -- stripe-integration.test.ts
 */

import { describe, it, expect, beforeAll } from 'vitest';
import fetch from 'node-fetch';

const BASE_URL = process.env.PUBLIC_BASE_URL || 'http://localhost:5000';

describe('🧪 Stripe Integration Tests', () => {
  
  describe('Configuration', () => {
    it('should have STRIPE_SECRET_KEY configured', () => {
      const key = process.env.STRIPE_SECRET_KEY;
      expect(key).toBeDefined();
      expect(key).toMatch(/^sk_(live|test)_/);
    });

    it('should have STRIPE_PUBLISHABLE_KEY configured', () => {
      const key = process.env.STRIPE_PUBLISHABLE_KEY;
      expect(key).toBeDefined();
      expect(key).toMatch(/^pk_(live|test)_/);
    });

    it('should have STRIPE_WEBHOOK_SECRET configured', () => {
      const secret = process.env.STRIPE_WEBHOOK_SECRET;
      expect(secret).toBeDefined();
      expect(secret).toMatch(/^whsec_/);
    });

    it('should have STRIPE_PRICE_BATTLE_PASS configured', () => {
      const price = process.env.STRIPE_PRICE_BATTLE_PASS;
      expect(price).toBeDefined();
      expect(price).toMatch(/^price_/);
    });

    it('should have STRIPE_PRICE_PRO_MONTHLY_USD configured', () => {
      const price = process.env.STRIPE_PRICE_PRO_MONTHLY_USD;
      expect(price).toBeDefined();
      expect(price).toMatch(/^price_/);
    });
  });

  describe('Debug Endpoints', () => {
    it('should return stripe config from /api/debug/stripe-config', async () => {
      const response = await fetch(`${BASE_URL}/api/debug/stripe-config`);
      const data = await response.json() as any;
      
      expect(data.stripeConfigured).toBe(true);
      expect(data.stripePrices.STRIPE_PRICE_BATTLE_PASS).toBeTruthy();
      expect(data.stripePrices.STRIPE_PRICE_PRO_MONTHLY_USD).toBeTruthy();
    });

    it('should have all required prices in response', async () => {
      const response = await fetch(`${BASE_URL}/api/debug/stripe-config`);
      const data = await response.json() as any;
      
      const prices = data.stripePrices;
      expect(prices.STRIPE_PRICE_BATTLE_PASS).toMatch(/^price_/);
      expect(prices.STRIPE_PRICE_PRO_MONTHLY_USD).toMatch(/^price_/);
    });
  });

  describe('Battle Pass', () => {
    it('should have battle pass data on GET /api/battle-pass/status', async () => {
      const response = await fetch(`${BASE_URL}/api/battle-pass/status`);
      const data = await response.json() as any;
      
      expect(data.season).toBe(1);
      expect(data).toHaveProperty('tierFromXp');
      expect(data).toHaveProperty('hasPremium');
    });
  });

  describe('Environment', () => {
    it('should have DATABASE_URL configured', () => {
      const url = process.env.DATABASE_URL;
      expect(url).toBeDefined();
      expect(url).toMatch(/postgresql/);
    });

    it('should have JWT_SECRET configured', () => {
      const secret = process.env.JWT_SECRET;
      expect(secret).toBeDefined();
      expect(secret?.length).toBeGreaterThan(16);
    });

    it('should have PUBLIC_BASE_URL configured', () => {
      const url = process.env.PUBLIC_BASE_URL;
      expect(url).toBeDefined();
      expect(url).toMatch(/https?:\/\//);
    });
  });
});

describe('📊 Integration Checklist', () => {
  it('All critical configs are present', () => {
    const configs = {
      stripe_secret: !!process.env.STRIPE_SECRET_KEY,
      stripe_publishable: !!process.env.STRIPE_PUBLISHABLE_KEY,
      stripe_webhook: !!process.env.STRIPE_WEBHOOK_SECRET,
      battle_pass_price: !!process.env.STRIPE_PRICE_BATTLE_PASS,
      pro_monthly_price: !!process.env.STRIPE_PRICE_PRO_MONTHLY_USD,
      database: !!process.env.DATABASE_URL,
      jwt: !!process.env.JWT_SECRET,
      base_url: !!process.env.PUBLIC_BASE_URL,
    };

    const allConfigured = Object.values(configs).every(v => v);
    
    console.log('\n📋 Configuration Status:');
    Object.entries(configs).forEach(([key, value]) => {
      console.log(`  ${value ? '✅' : '❌'} ${key}`);
    });

    expect(allConfigured).toBe(true);
  });
});
