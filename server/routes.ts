import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { eq, and, desc, asc, gt, sql } from "drizzle-orm";
import { db } from "./db.js";
import { 
  progress, 
  users, 
  webhookEvents, 
  stripeCustomers,
  activityHistory,
  siteAnalytics,
  userAchievements,
  journalEntries,
  storePurchases,
  dailyChallenges,
  coinTransactions,
  infinityPayPurchases,
  adRewards,
  userFollows,
  friendRequests
} from "../shared/schema.js";
import { createPayment, stripeWebhook, watchAd, checkUsage, consumeUsage, confirmPurchase } from "./api/monetization/index.js";
import { getRoadmap, getRoadmapItem, getProgress, completeProgress } from "./api/roadmap/index.js";
import { trackAdImpression, verifyAdWatch, getAdStats, skipAdForCoins } from "./api/analytics/ads.js";
import { storage } from "./storage.js";
import {
  getStripe,
  getBaseUrl,
  STRIPE_PRICE_PRO_MONTHLY,
  STRIPE_PRICE_PRO_ANNUAL,
  STRIPE_PRICE_PRO_MONTHLY_USD,
  STRIPE_PRICE_PRO_MONTHLY_BRL,
  STRIPE_PRICE_PRO_ANNUAL_USD,
  STRIPE_PRICE_PRO_ANNUAL_BRL,
  STRIPE_WEBHOOK_SECRET,
  STRIPE_PRICE_BATTLE_PASS,
} from "./stripe.js";
import Stripe from "stripe";
import { Resend } from "resend";

// JWT secret - must come from environment in production
let JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    console.error('[FATAL] JWT_SECRET not set in production. Aborting startup.');
    throw new Error('Missing JWT_SECRET in production');
  } else {
    console.warn('[WARN] JWT_SECRET not set; using insecure dev fallback. Configure JWT_SECRET in production.');
    JWT_SECRET = 'dev-secret-do-not-use-in-prod';
  }
}
const JWT_EXPIRY = "7d";
const METRICS_TOKEN = process.env.METRICS_TOKEN || "";
const EMAIL_SEND_TIMEOUT_MS = Number(process.env.EMAIL_SEND_TIMEOUT_MS || 4000);
const FORCE_PRO = process.env.FORCE_PRO === "true" || process.env.NODE_ENV === "development";

const computeIsPro = (user: any) => {
  // Drizzle maps DB snake_case columns to camelCase properties
  return FORCE_PRO || Boolean(user?.isPro);
};

// Stripe webhook secret presence check
if (!STRIPE_WEBHOOK_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    console.error('[FATAL] STRIPE_WEBHOOK_SECRET not set in production. Webhook handling will be disabled.');
  } else {
    console.warn('[WARN] STRIPE_WEBHOOK_SECRET not set; stripe webhooks disabled in this environment.');
  }
}

// ============================================================================
// GAMIFICATION HELPERS
// ============================================================================

// Calculate level from XP
function calculateLevel(xp: number): number {
  if (xp < 100) return 1; // Rookie
  if (xp < 500) return 2; // Coder
  if (xp < 1500) return 3; // Developer
  if (xp < 3000) return 4; // Engineer
  if (xp < 10000) return 5; // Architect
  return 6; // Legend
}

// Achievements catalog
const ACHIEVEMENTS_CATALOG = [
  // Streak achievements
  { id: 'streak_3', name: '3-Day Streak', description: 'Complete exercises for 3 consecutive days', xp: 25, category: 'streak', icon: '🔥', progress: true },
  { id: 'streak_7', name: 'Week Warrior', description: 'Complete exercises for 7 consecutive days', xp: 50, category: 'streak', icon: '🔥', progress: true },
  { id: 'streak_30', name: 'Monthly Champion', description: 'Complete exercises for 30 consecutive days', xp: 200, category: 'streak', icon: '🔥', progress: true },
  { id: 'streak_100', name: 'Century Master', description: 'Complete exercises for 100 consecutive days', xp: 500, category: 'streak', icon: '🔥', progress: true },
  
  // Exercise count achievements
  { id: 'exercises_10', name: 'Getting Started', description: 'Complete 10 exercises', xp: 30, category: 'exercises', icon: '🏆', progress: true },
  { id: 'exercises_50', name: 'Coder', description: 'Complete 50 exercises', xp: 100, category: 'exercises', icon: '🏆', progress: true },
  { id: 'exercises_100', name: 'Developer', description: 'Complete 100 exercises', xp: 250, category: 'exercises', icon: '🏆', progress: true },
  { id: 'exercises_500', name: 'Pro Coder', description: 'Complete 500 exercises', xp: 1000, category: 'exercises', icon: '🏆', progress: true },
  
  // Speed achievements
  { id: 'speed_demon', name: 'Speed Demon', description: 'Complete an exercise in under 30 seconds', xp: 50, category: 'speed', icon: '⚡', progress: false },
  { id: 'lightning_fast', name: 'Lightning Fast', description: 'Complete 10 exercises in under 1 minute each', xp: 150, category: 'speed', icon: '⚡', progress: true },
  
  // Accuracy achievements
  { id: 'perfectionist', name: 'Perfectionist', description: 'Get 100% score on 10 exercises', xp: 75, category: 'accuracy', icon: '🎯', progress: true },
  { id: 'flawless', name: 'Flawless', description: 'Get 100% score on 50 exercises', xp: 250, category: 'accuracy', icon: '🎯', progress: true },
  { id: 'master', name: 'Master', description: 'Maintain 95% average score over 100 exercises', xp: 500, category: 'accuracy', icon: '🎯', progress: true },
  
  // Learning achievements
  { id: 'algorithm_wizard', name: 'Algorithm Wizard', description: 'Complete all algorithm exercises', xp: 300, category: 'learning', icon: '🧠', progress: false },
  { id: 'data_structure_master', name: 'Data Structure Master', description: 'Complete all data structure exercises', xp: 300, category: 'learning', icon: '🧠', progress: false },
  { id: 'async_pro', name: 'Async Pro', description: 'Complete all async/await exercises', xp: 200, category: 'learning', icon: '🧠', progress: false },
  
  // Special achievements
  { id: 'pro_starter', name: 'Pro Starter', description: 'Complete first week as Pro member', xp: 100, category: 'special', icon: '⭐', progress: false },
  { id: 'early_bird', name: 'Early Bird', description: 'Complete 10 exercises before 8 AM', xp: 100, category: 'special', icon: '🌅', progress: true },
  { id: 'night_owl', name: 'Night Owl', description: 'Complete 10 exercises after 10 PM', xp: 100, category: 'special', icon: '🦉', progress: true },
  { id: 'comeback_kid', name: 'Comeback Kid', description: 'Return after 30+ days of inactivity', xp: 150, category: 'special', icon: '🎉', progress: false },
  { id: 'boss_challenger', name: 'Boss Challenger', description: 'Purchased a boss challenge with FlowCoins', xp: 200, category: 'special', icon: '🏆', progress: false },
];

// Store catalog
const STORE_CATALOG = [
  // Avatars (cosmetics)
  { id: 'avatar_ninja', name: 'Ninja Avatar', description: 'Become a coding ninja', type: 'cosmetic', category: 'avatar', price: 50, icon: '🥷' },
  { id: 'avatar_robot', name: 'Robot Avatar', description: 'Transform into a robot', type: 'cosmetic', category: 'avatar', price: 50, icon: '🤖' },
  { id: 'avatar_wizard', name: 'Wizard Avatar', description: 'Cast coding spells', type: 'cosmetic', category: 'avatar', price: 75, icon: '🧙' },
  { id: 'avatar_alien', name: 'Alien Avatar', description: 'Code from outer space', type: 'cosmetic', category: 'avatar', price: 75, icon: '👽' },
  { id: 'avatar_pirate', name: 'Pirate Avatar', description: 'Sail the code seas', type: 'cosmetic', category: 'avatar', price: 100, icon: '🏴‍☠️' },
  { id: 'avatar_astronaut', name: 'Astronaut Avatar', description: 'Code in zero gravity', type: 'cosmetic', category: 'avatar', price: 150, icon: '👨‍🚀' },
  { id: 'avatar_cat', name: 'Cat Avatar', description: 'A purr-fect coding companion', type: 'cosmetic', category: 'avatar', price: 75, icon: '🐱' },
  { id: 'avatar_fox', name: 'Fox Avatar', description: 'Clever and quick', type: 'cosmetic', category: 'avatar', price: 100, icon: '🦊' },
  { id: 'avatar_octopus', name: 'Octopus Avatar', description: 'Multi-task like a pro', type: 'cosmetic', category: 'avatar', price: 150, icon: '🐙' },
  
  // Badges (cosmetics)
  { id: 'badge_fire', name: 'Fire Badge', description: 'Show your burning passion', type: 'cosmetic', category: 'badge', price: 100, icon: '🔥' },
  { id: 'badge_diamond', name: 'Diamond Badge', description: 'Shine bright', type: 'cosmetic', category: 'badge', price: 200, icon: '💎' },
  { id: 'badge_crown', name: 'Crown Badge', description: 'Rule the leaderboard', type: 'cosmetic', category: 'badge', price: 300, icon: '👑' },
  { id: 'badge_premium', name: 'Premium Badge', description: 'Special premium badge for your profile', type: 'cosmetic', category: 'badge', price: 800, icon: '🏅' },
  { id: 'badge_vip_halo', name: 'VIP Badge + Halo', description: 'Exclusive VIP badge with golden halo effect', type: 'cosmetic', category: 'badge', price: 5000, icon: '✨' },
  
  // Themes (cosmetics)
  { id: 'theme_neon', name: 'Neon Theme', description: 'Vibrant neon colors', type: 'cosmetic', category: 'theme', price: 200, icon: '🌈' },
  { id: 'theme_ocean', name: 'Ocean Theme', description: 'Calming blue waves', type: 'cosmetic', category: 'theme', price: 200, icon: '🌊' },
  { id: 'theme_forest', name: 'Forest Theme', description: 'Natural green tones', type: 'cosmetic', category: 'theme', price: 200, icon: '🌲' },
  { id: 'theme_cyberpunk', name: 'Cyberpunk Theme', description: 'Neon nights and dark UI', type: 'cosmetic', category: 'theme', price: 250, icon: '🟣' },
  { id: 'theme_matrix', name: 'Matrix Theme', description: 'Green code rain vibes', type: 'cosmetic', category: 'theme', price: 250, icon: '🟩' },
  { id: 'theme_vip_gold', name: 'VIP Gold Theme', description: 'Premium golden grid background', type: 'cosmetic', category: 'theme', price: 5000, icon: '✨' },
  { id: 'theme_aurora', name: 'Aurora Theme', description: 'Soft aurora glow background', type: 'cosmetic', category: 'theme', price: 300, icon: '🌌' },
  { id: 'theme_sunset', name: 'Sunset Theme', description: 'Warm sunset grid background', type: 'cosmetic', category: 'theme', price: 300, icon: '🌅' },
  { id: 'theme_rose', name: 'Rose Theme', description: 'Pink accent grid background', type: 'cosmetic', category: 'theme', price: 300, icon: '🌸' },
  { id: 'theme_obsidian', name: 'Obsidian Theme', description: 'Ultra subtle dark grid background', type: 'cosmetic', category: 'theme', price: 300, icon: '🖤' },
  
  // Profile frames (cosmetics)
  { id: 'frame_gold', name: 'Gold Frame', description: 'Premium golden border', type: 'cosmetic', category: 'frame', price: 250, icon: '🥇' },
  { id: 'frame_silver', name: 'Silver Frame', description: 'Elegant silver border', type: 'cosmetic', category: 'frame', price: 150, icon: '🥈' },
  { id: 'frame_rainbow', name: 'Rainbow Frame', description: 'Colorful rainbow border', type: 'cosmetic', category: 'frame', price: 200, icon: '🌈' },
  { id: 'frame_neon', name: 'Neon Frame', description: 'Electric neon border', type: 'cosmetic', category: 'frame', price: 250, icon: '💡' },
  { id: 'frame_onyx', name: 'Onyx Frame', description: 'Minimal dark border', type: 'cosmetic', category: 'frame', price: 150, icon: '⬛' },
  { id: 'frame_animated', name: 'Animated Avatar Frame', description: 'Frame animado em volta do avatar (10 animações)', type: 'cosmetic', category: 'frame', price: 3500, icon: '🌀' },
  // Name effects
  { id: 'name_effect_gold', name: 'Golden Name', description: 'Gold glow name effect', type: 'cosmetic', category: 'name_effect', price: 400, icon: '✨' },
  { id: 'name_effect_rainbow', name: 'Rainbow Name', description: 'Animated rainbow text', type: 'cosmetic', category: 'name_effect', price: 600, icon: '🌈' },
  { id: 'name_effect_flame', name: 'Flame Name', description: 'Flame flicker text', type: 'cosmetic', category: 'name_effect', price: 700, icon: '🔥' },
  { id: 'name_effect_glitch', name: 'Glitch Name', description: 'Glitchy cyber effect', type: 'cosmetic', category: 'name_effect', price: 600, icon: '🧩' },
  { id: 'name_effect_ice', name: 'Ice Name', description: 'Cool icy glow', type: 'cosmetic', category: 'name_effect', price: 400, icon: '❄️' },

  // Profile: Custom username color (entitlement)
  { id: 'username_color_custom', name: 'Custom Username Color', description: 'Choose a custom color for your username', type: 'cosmetic', category: 'username_color', price: 1000, icon: '🎨' },

  // Effects: Particle effects (entitlement)
  { id: 'particle_effects', name: 'Particle Effects', description: 'Confetti effect when completing exercises', type: 'cosmetic', category: 'effect', price: 1200, icon: '🎉' },

  // Trophy case / achievements display (entitlement)
  { id: 'trophy_case', name: 'Trophy Case', description: 'Showcase up to 3 achievements on your profile', type: 'cosmetic', category: 'trophy_case', price: 2500, icon: '🏆' },

  // Themes: Custom theme creator (entitlement)
  { id: 'custom_theme_creator', name: 'Custom Theme Creator', description: 'Create and save your own theme', type: 'cosmetic', category: 'theme_creator', price: 3000, icon: '🛠️' },

  // Emotes/Stickers (collectibles)
  { id: 'emote_pack_1', name: 'Emotes Pack V1', description: 'Pack of 10 fun emotes', type: 'cosmetic', category: 'emote', price: 150, icon: '😄' },
  { id: 'sticker_pack_1', name: 'Stickers Pack V1', description: 'Pack of stickers for your profile', type: 'cosmetic', category: 'emote', price: 150, icon: '🏷️' },

  // Pets/Mascots (collectibles)
  { id: 'pet_dog', name: 'Virtual Dog Pet', description: 'A loyal coding buddy', type: 'cosmetic', category: 'pet', price: 300, icon: '🐶' },
  { id: 'pet_cat', name: 'Virtual Cat Pet', description: 'A calm and curious companion', type: 'cosmetic', category: 'pet', price: 300, icon: '🐱' },
  
  // Utilities
  { id: 'hint_token', name: 'Hint Token', description: 'Get one free hint', type: 'utility', category: 'hint', price: 10, icon: '💡' },
  { id: 'hint_pack_5', name: 'Hint Pack (5x)', description: 'Bundle of 5 hints', type: 'utility', category: 'hint', price: 40, icon: '💡' },
  { id: 'solution_unlock', name: 'Solution Unlock', description: 'View solution for one exercise', type: 'utility', category: 'solution', price: 25, icon: '🔓' },
  { id: 'solution_pack_3', name: 'Solution Pack (3x)', description: 'Bundle of 3 solution unlocks', type: 'utility', category: 'solution', price: 60, icon: '🔓' },
  { id: 'skip_cooldown', name: 'Skip Cooldown', description: 'Skip exercise cooldown once', type: 'utility', category: 'cooldown', price: 30, icon: '⏩' },
  
  // Boosts
  { id: 'xp_boost_2h', name: '2x XP Boost (2h)', description: 'Double XP for 2 hours', type: 'boost', category: 'xp', price: 100, icon: '⚡' },
  { id: 'xp_boost_24h', name: '2x XP Boost (24h)', description: 'Double XP for 24 hours', type: 'boost', category: 'xp', price: 300, icon: '⚡' },
  { id: 'streak_shield', name: 'Streak Shield (3 days)', description: 'Protect your streak for 3 days', type: 'boost', category: 'streak', price: 150, icon: '🛡️' },
  
  // Weekly Challenge
  { id: 'boss_challenge', name: 'Boss Challenge (Weekly)', description: 'Unlock a special weekly challenge', type: 'utility', category: 'challenge', price: 200, icon: '🏆' },
  // Profile visibility (time-limited)
  { id: 'featured_profile_30d', name: 'Featured Profile (30 days)', description: 'Showcase your profile in the Featured section for 30 days', type: 'utility', category: 'profile', price: 8000, icon: '⭐' },
  // Export / sharing
  { id: 'custom_watermark', name: 'Custom Watermark', description: 'Add a custom watermark to printed/exported pages', type: 'utility', category: 'export', price: 10000, icon: '🏷️' },
  // Legendary / special items
  { id: 'avatar_dragon_legend', name: 'Legendary Dragon Avatar', description: 'Mythical dragon avatar (unique)', type: 'cosmetic', category: 'avatar', price: 800, icon: '🐉' },
  // XP Packs (convert to XP when purchased)
  { id: 'xp_pack_small', name: 'Small XP Pack (500 XP)', description: 'Instantly grant 500 XP', type: 'utility', category: 'xp_pack', price: 50, icon: '🎁' },
  { id: 'xp_pack_medium', name: 'Medium XP Pack (2000 XP)', description: 'Instantly grant 2000 XP', type: 'utility', category: 'xp_pack', price: 180, icon: '🎁' },
  { id: 'xp_pack_large', name: 'Large XP Pack (10000 XP)', description: 'Instantly grant 10000 XP', type: 'utility', category: 'xp_pack', price: 800, icon: '🎁' },
];

// Calculate achievement progress
function calculateAchievementProgress(achievementId: string, user: any, activities: any[]): number {
  switch (achievementId) {
    case 'streak_3':
      return Math.min(100, ((user.dailyStreak || 0) / 3) * 100);
    case 'streak_7':
      return Math.min(100, ((user.dailyStreak || 0) / 7) * 100);
    case 'streak_30':
      return Math.min(100, ((user.dailyStreak || 0) / 30) * 100);
    case 'streak_100':
      return Math.min(100, ((user.dailyStreak || 0) / 100) * 100);
    
    case 'exercises_10':
      return Math.min(100, ((user.totalExercises || 0) / 10) * 100);
    case 'exercises_50':
      return Math.min(100, ((user.totalExercises || 0) / 50) * 100);
    case 'exercises_100':
      return Math.min(100, ((user.totalExercises || 0) / 100) * 100);
    case 'exercises_500':
      return Math.min(100, ((user.totalExercises || 0) / 500) * 100);
    
    case 'lightning_fast':
      const fastCount = activities.filter(a => a.type === 'exercise' && a.timeSpent && a.timeSpent < 60).length;
      return Math.min(100, (fastCount / 10) * 100);
    
    case 'perfectionist':
      const perfectCount = activities.filter(a => a.type === 'exercise' && a.score === 100).length;
      return Math.min(100, (perfectCount / 10) * 100);
    case 'flawless':
      const flawlessCount = activities.filter(a => a.type === 'exercise' && a.score === 100).length;
      return Math.min(100, (flawlessCount / 50) * 100);
    case 'master':
      const exerciseActivities = activities.filter(a => a.type === 'exercise' && a.score !== null);
      if (exerciseActivities.length < 100) return (exerciseActivities.length / 100) * 100;
      const avgScore = exerciseActivities.reduce((acc, a) => acc + (a.score || 0), 0) / exerciseActivities.length;
      return avgScore >= 95 ? 100 : 0;
    
    case 'early_bird':
      const earlyCount = activities.filter(a => {
        const hour = new Date(a.createdAt).getHours();
        return hour < 8;
      }).length;
      return Math.min(100, (earlyCount / 10) * 100);
    
    case 'night_owl':
      const lateCount = activities.filter(a => {
        const hour = new Date(a.createdAt).getHours();
        return hour >= 22;
      }).length;
      return Math.min(100, (lateCount / 10) * 100);
    
    default:
      return 0;
  }
}

// Check if achievement should be unlocked
function checkAchievementUnlock(achievementId: string, user: any, activities: any[]): boolean {
  const progress = calculateAchievementProgress(achievementId, user, activities);
  return progress >= 100;
}

// ============================================================================
// END GAMIFICATION HELPERS
// ============================================================================

// Resend configuration
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "noreply@example.com";
const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

// Generate 6-digit verification code
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Simple HTML escape to prevent injection in server-rendered templates
function escapeHtml(input: string) {
  return String(input)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Resend email sending function
async function sendVerificationEmail(email: string, code: string, firstName: string): Promise<boolean> {
  try {
    if (!resend) {
      console.warn("⚠️  Resend API key not configured. Logging code instead.");
      console.log(`📧 [MOCK] Verification code for ${email}: ${code}`);
      return true;
    }

    const { data, error } = await resend.emails.send({
      from: RESEND_FROM_EMAIL,
      to: email,
      subject: "Verify your email address",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Welcome, ${escapeHtml(firstName)}!</h2>
          <p>Thank you for signing up. To verify your email address and complete your registration, please enter the following code:</p>
          <div style="background: #f5f5f5; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <h1 style="letter-spacing: 5px; color: #333; margin: 0; font-family: monospace;">${escapeHtml(code)}</h1>
          </div>
          <p style="color: #666; font-size: 14px;">This code will expire in 15 minutes.</p>
          <p style="color: #999; font-size: 12px;">If you didn't request this verification code, you can safely ignore this email.</p>
        </div>
      `,
    });

    if (error) {
      console.error("✗ Failed to send verification email:", error.message);
      return false;
    }

    console.log(`✓ Verification email sent to ${email}`);
    return true;
  } catch (error) {
    console.error("✗ Error sending verification email:", error instanceof Error ? error.message : error);
    return false;
  }
}

async function sendVerificationEmailWithTimeout(email: string, code: string, firstName: string): Promise<boolean> {
  return Promise.race([
    sendVerificationEmail(email, code, firstName),
    new Promise<boolean>((resolve) => setTimeout(() => resolve(false), EMAIL_SEND_TIMEOUT_MS)),
  ]);
}

// Resend password reset email
async function sendPasswordResetEmail(email: string, code: string): Promise<boolean> {
  try {
    if (!resend) {
      console.warn("⚠️  Resend API key not configured. Logging code instead.");
      console.log(`🔐 [MOCK] Password reset code for ${email}: ${code}`);
      return true;
    }

    const { data, error } = await resend.emails.send({
      from: RESEND_FROM_EMAIL,
      to: email,
      subject: "Reset your password",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Password Reset Request</h2>
          <p>We received a request to reset the password for your account. To proceed, please enter the following code:</p>
          <div style="background: #f5f5f5; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <h1 style="letter-spacing: 5px; color: #333; margin: 0; font-family: monospace;">${escapeHtml(code)}</h1>
          </div>
          <p style="color: #666; font-size: 14px;">This code will expire in 15 minutes.</p>
          <p style="color: #999; font-size: 12px;">If you didn't request a password reset, you can safely ignore this email.</p>
        </div>
      `,
    });

    if (error) {
      console.error("✗ Failed to send password reset email:", error.message);
      return false;
    }

    console.log(`✓ Password reset email sent to ${email}`);
    return true;
  } catch (error) {
    console.error("✗ Error sending password reset email:", error instanceof Error ? error.message : error);
    return false;
  }
}

async function sendPasswordResetEmailWithTimeout(email: string, code: string): Promise<boolean> {
  return Promise.race([
    sendPasswordResetEmail(email, code),
    new Promise<boolean>((resolve) => setTimeout(() => resolve(false), EMAIL_SEND_TIMEOUT_MS)),
  ]);
}

// Simple in-memory rate limiter (per key)
type RateBucket = { count: number; resetAt: number };
const rateBuckets = new Map<string, RateBucket>();

function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = rateBuckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    rateBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (bucket.count >= limit) return false;
  bucket.count += 1;
  return true;
}

const usernameSchema = z.string().min(3).max(50);
const emailSchema = z.string().email().max(255);
const strongPassword = z
  .string()
  .min(10)
  .regex(/[A-Za-z]/, "must include letters")
  .regex(/[0-9]/, "must include numbers");

const signupSchema = z.object({
  email: emailSchema,
  password: strongPassword,
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  dateOfBirth: z.string().datetime(),
  country: z.string().min(1).max(100),
});

const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1),
});

const progressSchema = z.object({
  lessonId: z.string().min(1),
  language: z.string().min(1),
  index: z.number().int().nonnegative().max(10_000),
});

const sendVerificationCodeSchema = z.object({
  email: emailSchema,
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  dateOfBirth: z.string().datetime(),
  country: z.string().min(1).max(100),
  password: strongPassword,
});

const verifyCodeSchema = z.object({
  email: emailSchema,
  code: z.string().min(6).max(6),
});

function requireAuth(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ message: "Missing Authorization" });
  const [type, token] = auth.split(" ");
  if (type !== "Bearer" || !token) return res.status(401).json({ message: "Invalid Authorization" });
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET as string) as { userId: string };
    (req as any).userId = decoded.userId;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

// Optional auth: if a valid Bearer token exists, attaches req.userId. Never blocks the request.
function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth) return next();

  const [type, token] = auth.split(" ");
  if (type !== "Bearer" || !token) return next();

  try {
    const decoded = jwt.verify(token, JWT_SECRET as string) as { userId: string };
    (req as any).userId = decoded.userId;
  } catch {
    // ignore invalid/expired tokens
  }

  next();
}

function requirePro(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ message: "Missing Authorization" });
  const [type, token] = auth.split(" ");
  if (type !== "Bearer" || !token) return res.status(401).json({ message: "Invalid Authorization" });
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET as string) as { userId: string };
    (req as any).userId = decoded.userId;
    // Will check isPro in route handler after fetching user
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

// Middleware: authenticateToken - attaches full user object to req.user
async function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ message: "Missing Authorization" });
  const [type, token] = auth.split(" ");
  if (type !== "Bearer" || !token) return res.status(401).json({ message: "Invalid Authorization" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET as string) as { userId: string };
    const user = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.id, decoded.userId),
    });
    if (!user) return res.status(401).json({ message: "User not found" });
    (req as any).user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Health checks
  app.get("/health", (_req: Request, res: Response) => {
    const mem = process.memoryUsage();
    res.json({
      ok: true,
      status: "ok",
      pid: process.pid,
      uptimeSec: Math.round(process.uptime()),
      rssMB: Math.round(mem.rss / 1024 / 1024),
      heapUsedMB: Math.round(mem.heapUsed / 1024 / 1024),
      env: process.env.NODE_ENV || "development",
      port: process.env.PORT || "5000",
      timestamp: new Date().toISOString(),
    });
  });

  app.head("/health", (_req: Request, res: Response) => {
    res.status(204).end();
  });

  // API health (useful for existing API logging)
  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({ ok: true });
  });

  // Basic JSON metrics (in-memory, dev-only style)
  app.get("/metrics", (req: Request, res: Response) => {
    if (process.env.NODE_ENV === "production") {
      const auth = req.headers.authorization || "";
      const token = auth.startsWith("Bearer ") ? auth.slice("Bearer ".length) : "";
      if (!METRICS_TOKEN || token !== METRICS_TOKEN) {
        return res.status(403).json({ message: "Forbidden" });
      }
    }
    const mem = process.memoryUsage();
    const m = (app as any).locals?.metrics || {};
    res.json({
      ok: true,
      pid: process.pid,
      env: process.env.NODE_ENV || "development",
      uptimeSec: Math.round(process.uptime()),
      rssMB: Math.round(mem.rss / 1024 / 1024),
      heapUsedMB: Math.round(mem.heapUsed / 1024 / 1024),
      requestTimeoutMs: Number(process.env.REQUEST_TIMEOUT_MS || 15000),
      slowRequestMs: Number(process.env.SLOW_REQUEST_MS || 2000),
      metrics: m,
      timestamp: new Date().toISOString(),
    });
  });

  // Send verification code (step 1 of signup)
  app.post("/api/signup", async (req: Request, res: Response) => {
    try {
      // SECURITY: Removed sensitive data logging
      if (!checkRateLimit(`signup:${req.ip}`, 5, 60_000)) {
        return res.status(429).json({ message: "Too many signup attempts" });
      }
      const parsed = sendVerificationCodeSchema.safeParse(req.body || {});
      if (!parsed.success) {
        console.warn("[SIGNUP] Validation failed");
        return res.status(400).json({ message: "invalid signup data", errors: parsed.error.errors });
      }
      const { email, firstName, lastName, dateOfBirth, country, password } = parsed.data;
      console.log("[SIGNUP] Request for:", email);
      const existing = await storage.getUserByEmail(email);
      if (existing) return res.status(409).json({ message: "email already exists" });

      // Create the user immediately (no verification step)
      const hashedPassword = await bcryptjs.hash(password, 10);
      const newUser = await storage.createUser({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        country,
      });
      // Mark email as verified since we no longer require verification
      try { await storage.markEmailAsVerified(email); } catch (_) {}

      const token = jwt.sign({ userId: newUser.id }, JWT_SECRET as string, { expiresIn: JWT_EXPIRY });
      return res.json({ token, user: { id: newUser.id, email: newUser.email, firstName, lastName } });
    } catch (err: any) {
      console.error("[ERROR] /api/signup exception:", err?.message || err, "\nStack:", err?.stack);
      return res.status(500).json({ message: "Internal server error", error: err?.message || String(err) });
    }
  });

  // Verify code and create account (step 2 of signup)
  app.post("/api/verify-code", async (req: Request, res: Response) => {
    if (!checkRateLimit(`verify:${req.ip}`, 10, 60_000)) {
      return res.status(429).json({ message: "Too many verification attempts" });
    }
    // Verification is no longer required — accept any code and return success.
    return res.json({ message: 'Email verification disabled; proceeding' });
  });

  // Complete signup with all data
  app.post("/api/complete-signup", async (req: Request, res: Response) => {
    if (!checkRateLimit(`signup:${req.ip}`, 5, 60_000)) {
      return res.status(429).json({ message: "Too many signup attempts" });
    }
    const parsed = sendVerificationCodeSchema.safeParse(req.body || {});
    if (!parsed.success) return res.status(400).json({ message: "invalid signup data" });
    const { email, firstName, lastName, dateOfBirth, country, password } = parsed.data;
    // We no longer require prior verification. If the user exists, return token (login-like behavior).
    const existing = await storage.getUserByEmail(email);
    if (existing) {
      const token = jwt.sign({ userId: existing.id }, JWT_SECRET as string, { expiresIn: JWT_EXPIRY });
      return res.json({ token, user: { id: existing.id, email: existing.email, firstName: existing.firstName, lastName: existing.lastName } });
    }

    // Create new user
    const hashedPassword = await bcryptjs.hash(password, 10);
    const newUser = await storage.createUser({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      country,
    });
    try { await storage.markEmailAsVerified(email); } catch (_) {}
    const token = jwt.sign({ userId: newUser.id }, JWT_SECRET as string, { expiresIn: JWT_EXPIRY });
    return res.json({ token, user: { id: newUser.id, email: newUser.email, firstName, lastName } });
  });

  // Immediate register (no email verification) - creates account and returns token
  app.post('/api/register', async (req: Request, res: Response) => {
    if (!checkRateLimit(`register:${req.ip}`, 10, 60_000)) {
      return res.status(429).json({ message: 'Too many requests' });
    }

    const parsed = sendVerificationCodeSchema.safeParse(req.body || {});
    if (!parsed.success) return res.status(400).json({ message: 'invalid data', errors: parsed.error.errors });
    const { email, password, firstName, lastName, dateOfBirth, country } = parsed.data;

    try {
      const existing = await storage.getUserByEmail(email);
      if (existing) return res.status(409).json({ message: 'email already exists' });

      const hashed = await bcryptjs.hash(password, 10);
      const newUser = await storage.createUser({
        email,
        password: hashed,
        firstName,
        lastName,
        dateOfBirth: new Date(dateOfBirth),
        country,
      });

      const token = jwt.sign({ userId: newUser.id }, JWT_SECRET as string, { expiresIn: JWT_EXPIRY });
      return res.json({ token, user: { id: newUser.id, email: newUser.email, firstName, lastName, isPro: Boolean(newUser.isPro) } });
    } catch (err: any) {
      console.error('[ERROR] /api/register', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Login
  app.post("/api/login", async (req: Request, res: Response) => {
    const startTime = Date.now();
    try {
      if (!checkRateLimit(`login:${req.ip}`, 10, 60_000)) {
        return res.status(429).json({ message: "Too many login attempts" });
      }
      const parsed = loginSchema.safeParse(req.body || {});
      if (!parsed.success) return res.status(400).json({ message: "email and password required" });
      const { email, password } = parsed.data;
      
      console.log(`[LOGIN] Attempting login for ${email}`);
      
      // Add timeout to prevent hanging
      const userPromise = storage.getUserByEmail(email);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database query timeout')), 25000)
      );
      
      const user = (await Promise.race([userPromise, timeoutPromise])) as any;
      if (!user) {
        console.log(`[LOGIN] User not found: ${email}`);
        return res.status(401).json({ message: "invalid credentials" });
      }
      
      // Compare password with hashed version
      const isValid = await bcryptjs.compare(password, user.password);
      if (!isValid) {
        console.log(`[LOGIN] Invalid password for ${email}`);
        return res.status(401).json({ message: "invalid credentials" });
      }
      
      // Generate JWT token (expires in 7 days)
      const token = jwt.sign({ userId: user.id }, JWT_SECRET as string, { expiresIn: JWT_EXPIRY });
      
      const isPro = computeIsPro(user);
      console.log(`[LOGIN] Successful login for ${email} (${Date.now() - startTime}ms)`);
      return res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          isPro,
          proExpiresAt: user.proExpiresAt,
        },
      });
    } catch (err: any) {
      console.error(`[LOGIN] Error:`, err.message);
      return res.status(500).json({ message: "Login failed: " + err.message });
    }
  });

  // Forgot password - send reset code
  app.post("/api/forgot-password", async (req: Request, res: Response) => {
    if (!checkRateLimit(`forgot:${req.ip}`, 5, 60_000)) {
      return res.status(429).json({ message: "Too many requests" });
    }
    const parsed = z.object({ email: emailSchema }).safeParse(req.body || {});
    if (!parsed.success) return res.status(400).json({ message: "Invalid email" });
    const { email } = parsed.data;
    
    // Check if user exists
    const user = await storage.getUserByEmail(email);
    if (!user) {
      // Don't reveal if email exists
      return res.json({ message: "If email exists, reset code will be sent" });
    }
    
    // Generate verification code
    const code = generateVerificationCode();
    await storage.createPasswordReset(email, code);
    
    // Send email with timeout in background (non-blocking)
    sendPasswordResetEmailWithTimeout(email, code)
      .then((sent) => {
        if (!sent) console.warn(`password reset email send timed out for ${email}`);
      })
      .catch((err) => {
        console.warn(`password reset email send failed for ${email}: ${err?.message || err}`);
      });
    
    return res.json({ message: "Reset code sent to your email" });
  });

  // Verify password reset code
  app.post("/api/verify-reset-code", async (req: Request, res: Response) => {
    if (!checkRateLimit(`verify-reset:${req.ip}`, 10, 60_000)) {
      return res.status(429).json({ message: "Too many verification attempts" });
    }
    const parsed = verifyCodeSchema.safeParse(req.body || {});
    if (!parsed.success) return res.status(400).json({ message: "Invalid data" });
    const { email, code } = parsed.data;
    
    // Verify the code
    const isValid = await storage.verifyPasswordReset(email, code);
    if (!isValid) {
      const reset = await storage.getPasswordReset(email);
      if (reset && reset.attempts >= 5) {
        await storage.deletePasswordReset(email);
        return res.status(429).json({ message: "Too many failed attempts, please request a new code" });
      }
      return res.status(400).json({ message: "Invalid or expired code" });
    }
    
    return res.json({ message: "Code verified successfully" });
  });

  // Reset password with new password
  app.post("/api/reset-password", async (req: Request, res: Response) => {
    if (!checkRateLimit(`reset:${req.ip}`, 5, 60_000)) {
      return res.status(429).json({ message: "Too many requests" });
    }
    const parsed = z.object({
      email: emailSchema,
      code: z.string().min(6).max(6),
      newPassword: strongPassword,
    }).safeParse(req.body || {});
    if (!parsed.success) return res.status(400).json({ message: "Invalid data" });
    const { email, code, newPassword } = parsed.data;
    
    // Verify the code again (as extra validation)
    const isValid = await storage.verifyPasswordReset(email, code);
    if (!isValid) {
      return res.status(400).json({ message: "Invalid or expired code" });
    }
    
    // Hash new password
    const hashedPassword = await bcryptjs.hash(newPassword, 10);
    
    // Update password
    await storage.updateUserPassword(email, hashedPassword);
    
    // Delete reset record
    await storage.deletePasswordReset(email);
    
    return res.json({ message: "Password reset successfully" });
  });

  // Current user
  app.get("/api/me", requireAuth, async (req: Request, res: Response) => {
    const userId = (req as any).userId as string;
    const user = await storage.getUser(userId);
    if (!user) return res.status(404).json({ message: "not found" });
    
    const isPro = computeIsPro(user);
    
    const trophyCase = (() => {
      try {
        const raw = (user as any).trophyCase;
        if (!raw) return [];
        const parsed = JSON.parse(String(raw));
        if (!Array.isArray(parsed)) return [];
        return parsed.map((v: any) => String(v)).map((s: string) => s.trim()).filter(Boolean).slice(0, 3);
      } catch {
        return [];
      }
    })();

    const customTheme = (() => {
      try {
        const raw = (user as any).customTheme;
        if (!raw) return null;
        const parsed = JSON.parse(String(raw));
        if (!parsed || typeof parsed !== 'object') return null;
        const gridColor = typeof (parsed as any).gridColor === 'string' ? String((parsed as any).gridColor) : '';
        const gridOpacityNum = Number((parsed as any).gridOpacity);
        const gridOpacity = Number.isFinite(gridOpacityNum) ? Math.max(0, Math.min(1, gridOpacityNum)) : 0.1;
        if (!/^#[0-9a-fA-F]{6}$/.test(gridColor)) return null;
        return { gridColor, gridOpacity };
      } catch {
        return null;
      }
    })();

    return res.json({ 
      id: user.id, 
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      featuredUntil: (user as any).featuredUntil ?? null,
      usernameColor: user.usernameColor ?? null,
      isAdmin: user.isAdmin,
      isPro,
      proExpiresAt: user.proExpiresAt ?? null,
      emailVerified: user.emailVerified ?? false,
      // Gamification fields
      xp: user.xp ?? 0,
      level: user.level ?? 1,
      coins: user.coins ?? 0,
      avatar: user.avatar ?? null,
      bio: user.bio ?? null,
      theme: user.theme ?? null,
      equippedBadge: user.equippedBadge ?? null,
      equippedFrame: user.equippedFrame ?? null,
      frameAnimation: (user as any).frameAnimation ?? null,
      particleEffects: user.particleEffects ?? false,
      trophyCase,
      customTheme,
      customWatermark: (user as any).customWatermark ?? false,
      watermarkText: (user as any).watermarkText ?? null,
      language: user.language ?? null,
      dailyStreak: user.dailyStreak ?? 0,
      lastActivityDate: user.lastActivityDate ?? null,
      dailyGoal: user.dailyGoal ?? 5,
      totalExercises: user.totalExercises ?? 0,
      totalTime: user.totalTime ?? 0,
      country: user.country ?? null,
      dateOfBirth: user.dateOfBirth ?? null,
    });
  });

  // Featured profiles (public listing)
  app.get("/api/featured-profiles", async (req: Request, res: Response) => {
    try {
      const limitRaw = Number((req.query as any)?.limit);
      const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(50, Math.floor(limitRaw))) : 10;
      const now = new Date();

      const rows = await db
        .select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          usernameColor: users.usernameColor,
          equippedBadge: users.equippedBadge,
          equippedFrame: users.equippedFrame,
          frameAnimation: users.frameAnimation,
          avatar: users.avatar,
          xp: users.xp,
          level: users.level,
          isPro: users.isPro,
          proExpiresAt: users.proExpiresAt,
          featuredUntil: users.featuredUntil,
        })
        .from(users)
        .where(gt(users.featuredUntil, now))
        .orderBy(desc(users.featuredUntil))
        .limit(limit);

      const featured = rows.map((u: any) => ({
        id: u.id,
        firstName: u.firstName,
        lastName: u.lastName,
        usernameColor: u.usernameColor ?? null,
        equippedBadge: u.equippedBadge ?? null,
        equippedFrame: u.equippedFrame ?? null,
        frameAnimation: u.frameAnimation ?? null,
        avatar: u.avatar ?? null,
        xp: u.xp ?? 0,
        level: u.level ?? 1,
        isPro: computeIsPro(u),
        featuredUntil: u.featuredUntil ?? null,
      }));

      return res.json({ featured });
    } catch (error: any) {
      console.error("Error fetching featured profiles:", error);
      return res.status(500).json({ message: "Failed to fetch featured profiles" });
    }
  });

  // Alias for legacy clients
  app.get("/api/auth/me", requireAuth, async (req: Request, res: Response) => {
    const userId = (req as any).userId as string;
    const user = await storage.getUser(userId);
    if (!user) return res.status(404).json({ message: "not found" });

    const isPro = computeIsPro(user);

    return res.json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isAdmin: user.isAdmin,
      isPro
    });
  });

  // ============================================================================
  // GAMIFICATION ROUTES
  // ============================================================================

  // Update user profile
  app.post("/api/profile/update", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId as string;
      const { firstName, lastName, country, bio, avatar, theme, dailyGoal, dateOfBirth, address, usernameColor, trophyCase, customTheme, watermarkText } = req.body;

      const normalizeUsernameColor = (value: unknown): string | null | undefined => {
        if (value === undefined) return undefined;
        if (value === null) return null;
        const s = String(value).trim();
        if (s === '') return null;
        if (/^#[0-9a-fA-F]{6}$/.test(s) || /^#[0-9a-fA-F]{3}$/.test(s)) return s.toLowerCase();
        return undefined;
      };

      const updateData: any = {};
      if (firstName !== undefined) updateData.firstName = firstName;
      if (lastName !== undefined) updateData.lastName = lastName;
      if (country !== undefined) updateData.country = country;
      if (bio !== undefined) updateData.bio = bio;
      if (avatar !== undefined) updateData.avatar = avatar;
      if (usernameColor !== undefined) {
        const normalized = normalizeUsernameColor(usernameColor);
        if (normalized === undefined) {
          return res.status(400).json({ message: 'Invalid usernameColor' });
        }

        // Setting a custom color requires owning the entitlement item.
        if (normalized !== null) {
          const owned = await db.select().from(storePurchases)
            .where(and(eq(storePurchases.userId, userId), eq(storePurchases.itemId, 'username_color_custom')))
            .limit(1);
          if (owned.length === 0) {
            return res.status(403).json({ message: 'Custom username color not owned' });
          }
        }
        updateData.usernameColor = normalized;
      }
      if (theme !== undefined) {
        const nextTheme = String(theme || '');
        // Allow base themes freely; store themes require ownership.
        const isBaseTheme = nextTheme === '' || nextTheme === 'dark' || nextTheme === 'light';
        const isStoreTheme = nextTheme.startsWith('theme_');

        if (isStoreTheme) {
          const owned = await db.select().from(storePurchases)
            .where(and(eq(storePurchases.userId, userId), eq(storePurchases.itemId, nextTheme)))
            .limit(1);
          if (owned.length === 0) {
            return res.status(403).json({ message: 'Theme not owned' });
          }
          updateData.theme = nextTheme;
        } else if (isBaseTheme) {
          updateData.theme = nextTheme || 'dark';
        } else {
          // Unknown theme values are not accepted via profile update.
          return res.status(400).json({ message: 'Invalid theme' });
        }
      }
      if (dailyGoal !== undefined) updateData.dailyGoal = dailyGoal;
      if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth;
      if (address !== undefined) updateData.address = address;

      const normalizeCustomTheme = (value: unknown): { gridColor: string; gridOpacity: number } | null | undefined => {
        if (value === undefined) return undefined;
        if (value === null) return null;
        if (!value || typeof value !== 'object') return undefined;
        const gridColor = String((value as any).gridColor || '').trim();
        const gridOpacityNum = Number((value as any).gridOpacity);
        if (!/^#[0-9a-fA-F]{6}$/.test(gridColor)) return undefined;
        if (!Number.isFinite(gridOpacityNum)) return undefined;
        const gridOpacity = Math.max(0, Math.min(1, gridOpacityNum));
        return { gridColor, gridOpacity };
      };

      if (customTheme !== undefined) {
        const owned = await db.select().from(storePurchases)
          .where(and(eq(storePurchases.userId, userId), eq(storePurchases.itemId, 'custom_theme_creator')))
          .limit(1);
        if (owned.length === 0) {
          return res.status(403).json({ message: 'Custom theme creator not owned' });
        }

        const parsed = normalizeCustomTheme(customTheme);
        if (parsed === undefined) return res.status(400).json({ message: 'Invalid customTheme' });
        updateData.customTheme = parsed ? JSON.stringify(parsed) : null;
      }

      const normalizeWatermarkText = (value: unknown): string | null | undefined => {
        if (value === undefined) return undefined;
        if (value === null) return null;
        const s = String(value).trim();
        if (s === '') return null;
        if (s.length > 48) return undefined;
        return s;
      };

      if (watermarkText !== undefined) {
        const normalized = normalizeWatermarkText(watermarkText);
        if (normalized === undefined) return res.status(400).json({ message: 'Invalid watermarkText' });

        // Updating watermark requires owning the entitlement item.
        const owned = await db.select().from(storePurchases)
          .where(and(eq(storePurchases.userId, userId), eq(storePurchases.itemId, 'custom_watermark')))
          .limit(1);
        if (owned.length === 0) {
          return res.status(403).json({ message: 'Custom watermark not owned' });
        }

        updateData.watermarkText = normalized;
      }

      // Setting theme to custom requires owning creator and having a saved customTheme.
      if (theme === 'theme_custom') {
        const owned = await db.select().from(storePurchases)
          .where(and(eq(storePurchases.userId, userId), eq(storePurchases.itemId, 'custom_theme_creator')))
          .limit(1);
        if (owned.length === 0) {
          return res.status(403).json({ message: 'Custom theme creator not owned' });
        }
        const existingUser = await storage.getUser(userId);
        const themeToUse = customTheme !== undefined ? updateData.customTheme : ((existingUser as any)?.customTheme || null);
        if (!themeToUse) {
          return res.status(400).json({ message: 'Save a custom theme first' });
        }
      }

      if (trophyCase !== undefined) {
        // Updating trophy case requires owning the entitlement item.
        const owned = await db.select().from(storePurchases)
          .where(and(eq(storePurchases.userId, userId), eq(storePurchases.itemId, 'trophy_case')))
          .limit(1);
        if (owned.length === 0) {
          return res.status(403).json({ message: 'Trophy case not owned' });
        }

        const normalizeArray = (value: unknown): string[] | null | undefined => {
          if (value === undefined) return undefined;
          if (value === null) return null;
          if (!Array.isArray(value)) return undefined;
          const next = value
            .map((v) => String(v))
            .map((s) => s.trim())
            .filter(Boolean);
          return next;
        };

        const next = normalizeArray(trophyCase);
        if (next === undefined) {
          return res.status(400).json({ message: 'Invalid trophyCase' });
        }

        const chosen = (next || []).slice(0, 3);
        if (chosen.length > 3) {
          return res.status(400).json({ message: 'Too many trophy case achievements' });
        }
        if (new Set(chosen).size !== chosen.length) {
          return res.status(400).json({ message: 'Duplicate trophy case achievements' });
        }

        const knownIds = new Set(ACHIEVEMENTS_CATALOG.map((a) => a.id));
        for (const id of chosen) {
          if (!knownIds.has(id)) {
            return res.status(400).json({ message: `Unknown achievement: ${id}` });
          }
        }

        const unlockedRows = await db.select({ achievementId: userAchievements.achievementId })
          .from(userAchievements)
          .where(eq(userAchievements.userId, userId));
        const unlockedSet = new Set(unlockedRows.map((r) => r.achievementId));
        for (const id of chosen) {
          if (!unlockedSet.has(id)) {
            return res.status(400).json({ message: `Achievement not unlocked: ${id}` });
          }
        }

        updateData.trophyCase = chosen.length ? JSON.stringify(chosen) : null;
      }

      await db.update(users).set(updateData).where(eq(users.id, userId));

      return res.json({ message: "Profile updated successfully" });
    } catch (error: any) {
      console.error("Error updating profile:", error);
      return res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Get activity history
  app.get("/api/history", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId as string;
      const { type } = req.query;

      let query = db
        .select()
        .from(activityHistory)
        .where(eq(activityHistory.userId, userId))
        .orderBy(desc(activityHistory.createdAt));

      const activities = await query;

      // Filter by type if provided
      const filteredActivities = type && type !== 'all' 
        ? activities.filter(a => a.type === type)
        : activities;

      // Calculate stats
      const stats = {
        totalExercises: activities.filter(a => a.type === 'exercise').length,
        avgScore: activities.filter(a => a.score !== null).reduce((acc, a) => acc + (a.score || 0), 0) / activities.filter(a => a.score !== null).length || 0,
        avgTime: activities.filter(a => a.timeSpent !== null).reduce((acc, a) => acc + (a.timeSpent || 0), 0) / activities.filter(a => a.timeSpent !== null).length || 0,
        totalXP: activities.reduce((acc, a) => acc + a.xpEarned, 0),
      };

      return res.json({ activities: filteredActivities, stats });
    } catch (error: any) {
      console.error("Error fetching history:", error);
      return res.status(500).json({ message: "Failed to fetch history" });
    }
  });

  // Log new activity (called when completing exercises, lessons, etc)
  app.post("/api/activity", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId as string;
      const { type, title, xpEarned, timeSpent, score, metadata } = req.body;

      if (!type || !title) {
        return res.status(400).json({ message: "type and title are required" });
      }

      // Insert activity
      await db.insert(activityHistory).values({
        userId,
        type,
        title,
        xpEarned: xpEarned || 0,
        timeSpent: timeSpent || null,
        score: score || null,
        metadata: metadata ? JSON.stringify(metadata) : null,
      });

      // Update user stats
      const user = await storage.getUser(userId);
      if (user) {
        const newXP = (user.xp || 0) + (xpEarned || 0);
        const newLevel = calculateLevel(newXP);
        const newTotalExercises = (user.totalExercises || 0) + (type === 'exercise' ? 1 : 0);
        const newTotalTime = (user.totalTime || 0) + (timeSpent || 0);

        // Update streak if needed
        const today = new Date().toDateString();
        const lastActivity = user.lastActivityDate ? new Date(user.lastActivityDate).toDateString() : null;
        const yesterday = new Date(Date.now() - 86400000).toDateString();
        
        let newStreak = user.dailyStreak || 0;
        if (lastActivity !== today) {
          if (lastActivity === yesterday) {
            newStreak += 1;
          } else if (lastActivity && lastActivity !== yesterday) {
            newStreak = 1;
          } else {
            newStreak = 1;
          }
        }

        // Earn FlowCoins: 1 coin per 50 XP earned
        const coinsEarned = Math.floor((xpEarned || 0) / 50);

        await db.update(users).set({
          xp: newXP,
          level: newLevel,
          totalExercises: newTotalExercises,
          totalTime: newTotalTime,
          coins: (user.coins || 0) + coinsEarned,
          dailyStreak: newStreak,
          lastActivityDate: new Date(),
        }).where(eq(users.id, userId));

        if (coinsEarned > 0) {
          await db.insert(coinTransactions).values({
            userId,
            amount: coinsEarned,
            type: 'earn',
            source: 'activity',
            metadata: JSON.stringify({ xpEarned: xpEarned || 0, type }),
          });
        }
      }

      return res.json({ message: "Activity logged successfully" });
    } catch (error: any) {
      console.error("Error logging activity:", error);
      return res.status(500).json({ message: "Failed to log activity" });
    }
  });

  // Get journal entries
  app.get("/api/journal", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId as string;
      const entries = await db
        .select()
        .from(journalEntries)
        .where(eq(journalEntries.userId, userId))
        .orderBy(desc(journalEntries.date));

      return res.json({ entries });
    } catch (error: any) {
      console.error("Error fetching journal:", error);
      return res.status(500).json({ message: "Failed to fetch journal" });
    }
  });

  // Create journal entry
  app.post("/api/journal", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId as string;
      const { title, content, tags, code } = req.body;

      if (!content) {
        return res.status(400).json({ message: "content is required" });
      }

      await db.insert(journalEntries).values({
        userId,
        title: title || null,
        content,
        tags: tags || null,
        code: code || null,
        date: new Date(),
      });

      return res.json({ message: "Journal entry created successfully" });
    } catch (error: any) {
      console.error("Error creating journal entry:", error);
      return res.status(500).json({ message: "Failed to create journal entry" });
    }
  });

  // Update journal entry
  app.put("/api/journal/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId as string;
      const { id } = req.params;
      const { title, content, tags, code } = req.body;

      // Verify ownership
      const existing = await db.select().from(journalEntries).where(eq(journalEntries.id, id)).limit(1);
      if (!existing.length || existing[0].userId !== userId) {
        return res.status(404).json({ message: "Journal entry not found" });
      }

      await db.update(journalEntries).set({
        title: title !== undefined ? title : existing[0].title,
        content: content !== undefined ? content : existing[0].content,
        tags: tags !== undefined ? tags : existing[0].tags,
        code: code !== undefined ? code : existing[0].code,
        updatedAt: new Date(),
      }).where(eq(journalEntries.id, id));

      return res.json({ message: "Journal entry updated successfully" });
    } catch (error: any) {
      console.error("Error updating journal entry:", error);
      return res.status(500).json({ message: "Failed to update journal entry" });
    }
  });

  // Delete journal entry
  app.delete("/api/journal/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId as string;
      const { id } = req.params;

      // Verify ownership
      const existing = await db.select().from(journalEntries).where(eq(journalEntries.id, id)).limit(1);
      if (!existing.length || existing[0].userId !== userId) {
        return res.status(404).json({ message: "Journal entry not found" });
      }

      await db.delete(journalEntries).where(eq(journalEntries.id, id));

      return res.json({ message: "Journal entry deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting journal entry:", error);
      return res.status(500).json({ message: "Failed to delete journal entry" });
    }
  });

  // Get achievements
  app.get("/api/achievements", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId as string;
      
      // Get user's unlocked achievements
      const unlocked = await db.select().from(userAchievements).where(eq(userAchievements.userId, userId));
      
      // Get user stats for progress calculation
      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      const activities = await db.select().from(activityHistory).where(eq(activityHistory.userId, userId));
      
      // Calculate progress for each achievement
      const achievementsWithProgress = ACHIEVEMENTS_CATALOG.map(achievement => {
        const isUnlocked = unlocked.some(u => u.achievementId === achievement.id);
        const unlockedEntry = unlocked.find(u => u.achievementId === achievement.id);
        
        let progress = 0;
        if (!isUnlocked && achievement.progress) {
          progress = calculateAchievementProgress(achievement.id, user, activities);
        }

        return {
          ...achievement,
          unlocked: isUnlocked,
          unlockedAt: unlockedEntry?.unlockedAt || null,
          progress: isUnlocked ? 100 : progress,
        };
      });

      return res.json({ achievements: achievementsWithProgress });
    } catch (error: any) {
      console.error("Error fetching achievements:", error);
      return res.status(500).json({ message: "Failed to fetch achievements" });
    }
  });

  // Check and unlock achievements (called after activities)
  app.post("/api/achievements/check", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId as string;
      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      const activities = await db.select().from(activityHistory).where(eq(activityHistory.userId, userId));
      const unlocked = await db.select().from(userAchievements).where(eq(userAchievements.userId, userId));
      
      const newlyUnlocked: string[] = [];

      for (const achievement of ACHIEVEMENTS_CATALOG) {
        const alreadyUnlocked = unlocked.some(u => u.achievementId === achievement.id);
        if (alreadyUnlocked) continue;

        const shouldUnlock = checkAchievementUnlock(achievement.id, user, activities);
        if (shouldUnlock) {
          await db.insert(userAchievements).values({
            userId,
            achievementId: achievement.id,
          });
          newlyUnlocked.push(achievement.id);

          // Award XP
          const newXP = (user.xp || 0) + achievement.xp;
          await db.update(users).set({ xp: newXP, level: calculateLevel(newXP) }).where(eq(users.id, userId));
        }
      }

      return res.json({ newlyUnlocked });
    } catch (error: any) {
      console.error("Error checking achievements:", error);
      return res.status(500).json({ message: "Failed to check achievements" });
    }
  });

  // Get store items
  // Public listing for anonymous users to browse available items
  app.get("/api/store/public", async (req: Request, res: Response) => {
    try {
      // Return catalog without ownership information
      return res.json({ items: STORE_CATALOG });
    } catch (error: any) {
      console.error("Error fetching public store:", error);
      return res.status(500).json({ message: "Failed to fetch public store" });
    }
  });

  
  app.get("/api/store", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId as string;
      const purchases = await db.select().from(storePurchases).where(eq(storePurchases.userId, userId));

      const user = await storage.getUser(userId);
      const featuredActive = Boolean((user as any)?.featuredUntil && new Date((user as any).featuredUntil).getTime() > Date.now());
      
      const itemsWithOwnership = STORE_CATALOG.map(item => ({
        ...item,
        owned: item.id === 'featured_profile_30d' ? featuredActive : purchases.some(p => p.itemId === item.id),
      }));

      return res.json({ items: itemsWithOwnership });
    } catch (error: any) {
      console.error("Error fetching store:", error);
      return res.status(500).json({ message: "Failed to fetch store" });
    }
  });

  // Coins endpoints
  app.get("/api/coins/balance", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId as string;
      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: "User not found" });
      const txCount = (await db.select().from(coinTransactions).where(eq(coinTransactions.userId, userId))).length;
      return res.json({ coins: user.coins || 0, transactions: txCount });
    } catch (error: any) {
      console.error("Error fetching coins:", error);
      return res.status(500).json({ message: "Failed to fetch coins" });
    }
  });

  app.get("/api/coins/transactions", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId as string;
      const tx = await db.select().from(coinTransactions)
        .where(eq(coinTransactions.userId, userId))
        .orderBy(desc(coinTransactions.createdAt));
      return res.json({ transactions: tx });
    } catch (error: any) {
      console.error("Error fetching coin transactions:", error);
      return res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  // Purchase store item
  app.post("/api/store/purchase", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId as string;
      const { itemId } = req.body;

      if (!itemId) {
        return res.status(400).json({ message: "itemId is required" });
      }

      // Check if item exists
      const item = STORE_CATALOG.find(i => i.id === itemId);
      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }

      // Check if already owned (some items are time-limited and can be purchased repeatedly)
      const isRepeatable = itemId === 'featured_profile_30d';
      if (!isRepeatable) {
        const existing = await db.select().from(storePurchases).where(
          and(eq(storePurchases.userId, userId), eq(storePurchases.itemId, itemId))
        ).limit(1);
        
        if (existing.length > 0) {
          return res.status(400).json({ message: "Item already owned" });
        }
      }

      // Check if user has enough coins
      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: "User not found" });
      if ((user.coins || 0) < item.price) {
        return res.status(400).json({ message: "Not enough coins" });
      }

      // Deduct coins and record purchase
      const newCoins = (user.coins || 0) - item.price;
      await db.update(users).set({ coins: newCoins }).where(eq(users.id, userId));

      await db.insert(storePurchases).values({
        userId,
        itemId: item.id,
        itemType: item.type,
        xpCost: 0,
        coinCost: item.price,
      });

      // Record coin transaction
      await db.insert(coinTransactions).values({
        userId,
        amount: -item.price,
        type: 'spend',
        source: 'purchase',
        metadata: JSON.stringify({ itemId: item.id }),
      });

      // Unlock special badge if boss challenge
      if (item.id === 'boss_challenge') {
        const existingBadge = await db.select().from(userAchievements)
          .where(and(eq(userAchievements.userId, userId), eq(userAchievements.achievementId, 'boss_challenger')))
          .limit(1);
        if (existingBadge.length === 0) {
          await db.insert(userAchievements).values({
            userId,
            achievementId: 'boss_challenger',
          });
        }
      }

      // Grant particle effects entitlement
      if (item.id === 'particle_effects') {
        await db.update(users).set({ particleEffects: true }).where(eq(users.id, userId));
      }

      // Grant featured profile time window (extend if already active)
      if (item.id === 'featured_profile_30d') {
        const now = new Date();
        const current = (user as any).featuredUntil ? new Date((user as any).featuredUntil) : null;
        const base = current && current.getTime() > now.getTime() ? current : now;
        const next = new Date(base.getTime() + 30 * 24 * 60 * 60 * 1000);
        await db.update(users).set({ featuredUntil: next }).where(eq(users.id, userId));
      }

      // Grant custom watermark entitlement
      if (item.id === 'custom_watermark') {
        const existingText = String((user as any).watermarkText || '').trim();
        const fallback = `${String(user.firstName || '').trim()} ${String(user.lastName || '').trim()}`.trim() || String(user.email || '').trim();
        await db.update(users).set({ customWatermark: true, watermarkText: existingText || fallback || null }).where(eq(users.id, userId));
      }

      return res.json({ message: "Purchase successful", newCoins });
    } catch (error: any) {
      console.error("Error purchasing item:", error);
      return res.status(500).json({ message: "Failed to purchase item" });
    }
  });

  // Equip or use a purchased item (cosmetics/effects/xp packs)
  app.post("/api/store/equip", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId as string;
      const { itemId } = req.body;
      if (!itemId) return res.status(400).json({ message: "itemId required" });

      // Check ownership
      const owned = await db.select().from(storePurchases).where(and(eq(storePurchases.userId, userId), eq(storePurchases.itemId, itemId))).limit(1);
      if (owned.length === 0) return res.status(403).json({ message: "Item not owned" });

      const item = STORE_CATALOG.find(i => i.id === itemId);
      if (!item) return res.status(404).json({ message: "Item not found" });

      // Handle XP packs immediately: credit XP and record transaction
      if (item.category === 'xp_pack') {
        // Map item to XP amount
        const xpMap: Record<string, number> = {
          xp_pack_small: 500,
          xp_pack_medium: 2000,
          xp_pack_large: 10000,
        };
        const xpAmount = xpMap[itemId] || 0;
        if (xpAmount > 0) {
          const user = await storage.getUser(userId);
          if (!user) return res.status(404).json({ message: 'User not found' });
          const newXP = (user.xp || 0) + xpAmount;
          await db.update(users).set({ xp: newXP, level: calculateLevel(newXP) }).where(eq(users.id, userId));
          await db.insert(coinTransactions).values({ userId, amount: 0, type: 'earn', source: 'xp_pack', metadata: JSON.stringify({ itemId, xp: xpAmount }) });
          return res.json({ message: 'XP granted', xp: xpAmount, newXP });
        }
      }

      // Cosmetics: apply avatar or theme by updating users table
      if (item.type === 'cosmetic') {
        if (item.category === 'avatar') {
          // Extract avatar name from itemId (e.g., "avatar_ninja" -> "ninja")
          const avatarName = itemId.replace('avatar_', '');
          await db.update(users).set({ avatar: avatarName }).where(eq(users.id, userId));
          return res.json({ message: 'Avatar equipped', avatar: avatarName });
        }
        if (item.category === 'theme') {
          await db.update(users).set({ theme: itemId }).where(eq(users.id, userId));
          return res.json({ message: 'Theme applied', theme: itemId });
        }
        if (item.category === 'frame') {
          await db.update(users).set({ equippedFrame: itemId }).where(eq(users.id, userId));
          return res.json({ message: 'Frame applied', frame: itemId });
        }
        if (item.category === 'name_effect') {
          await db.update(users).set({ equippedNameEffect: itemId }).where(eq(users.id, userId));
          return res.json({ message: 'Name effect applied', nameEffect: itemId });
        }
        if (item.category === 'badge') {
          await db.update(users).set({ equippedBadge: itemId }).where(eq(users.id, userId));
          return res.json({ message: 'Badge applied', badge: itemId });
        }
      }

      return res.status(400).json({ message: 'Nothing to equip for this item' });
    } catch (error: any) {
      console.error('Error equipping item:', error);
      return res.status(500).json({ message: 'Failed to equip item' });
    }
  });

  // Get daily streak info
  app.get("/api/streak", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId as string;
      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      return res.json({
        lastActivityDate: user.lastActivityDate,
        dailyGoal: user.dailyGoal || 5,
        dailyStreak: user.dailyStreak || 0,
      });
    } catch (error: any) {
      console.error("Error fetching streak:", error);
      return res.status(500).json({ message: "Failed to fetch streak" });
    }
  });

  // Leaderboard: Top XP
  app.get("/api/leaderboard/xp", async (req: Request, res: Response) => {
    try {
      const limit = Math.min(Number(req.query.limit) || 50, 100);
      const topUsers = await db.select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        usernameColor: users.usernameColor,
        equippedBadge: users.equippedBadge,
        equippedFrame: users.equippedFrame,
        frameAnimation: users.frameAnimation,
        xp: users.xp,
        level: users.level,
        avatar: users.avatar,
        isPro: users.isPro,
      }).from(users).orderBy(desc(users.xp)).limit(limit);
      
      return res.json({ leaderboard: topUsers });
    } catch (error: any) {
      console.error("Error fetching XP leaderboard:", error);
      return res.status(500).json({ message: "Failed to fetch leaderboard" });
    }
  });

  // Leaderboard: Current user's rank (global)
  app.get("/api/leaderboard/me", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId as string;
      const mode = String(req.query.mode || "xp");

      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      if (mode === "streak") {
        const youValue = user.dailyStreak || 0;
        const [{ countGreater = 0 } = {} as any] = await db
          .select({ countGreater: sql<number>`count(*)` })
          .from(users)
          .where(gt(users.dailyStreak, youValue));

        const [{ total = 0 } = {} as any] = await db
          .select({ total: sql<number>`count(*)` })
          .from(users);

        const next = await db
          .select({
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            usernameColor: users.usernameColor,
            equippedBadge: users.equippedBadge,
            equippedFrame: users.equippedFrame,
            frameAnimation: users.frameAnimation,
            value: users.dailyStreak,
            level: users.level,
            avatar: users.avatar,
            isPro: users.isPro,
          })
          .from(users)
          .where(gt(users.dailyStreak, youValue))
          .orderBy(asc(users.dailyStreak))
          .limit(1);

        return res.json({
          mode: "streak",
          rank: Number(countGreater) + 1,
          total: Number(total),
          youValue,
          next: next[0] ? { ...next[0], value: Number(next[0].value || 0) } : null,
        });
      }

      // default: xp
      const youValue = user.xp || 0;
      const [{ countGreater = 0 } = {} as any] = await db
        .select({ countGreater: sql<number>`count(*)` })
        .from(users)
        .where(gt(users.xp, youValue));

      const [{ total = 0 } = {} as any] = await db
        .select({ total: sql<number>`count(*)` })
        .from(users);

      const next = await db
        .select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          usernameColor: users.usernameColor,
          equippedBadge: users.equippedBadge,
          equippedFrame: users.equippedFrame,
          frameAnimation: users.frameAnimation,
          value: users.xp,
          level: users.level,
          avatar: users.avatar,
          isPro: users.isPro,
        })
        .from(users)
        .where(gt(users.xp, youValue))
        .orderBy(asc(users.xp))
        .limit(1);

      return res.json({
        mode: "xp",
        rank: Number(countGreater) + 1,
        total: Number(total),
        youValue,
        next: next[0] ? { ...next[0], value: Number(next[0].value || 0) } : null,
      });
    } catch (error: any) {
      console.error("Error fetching user leaderboard rank:", error);
      return res.status(500).json({ message: "Failed to fetch rank" });
    }
  });

  // Leaderboard: Top Streak
  app.get("/api/leaderboard/streak", async (req: Request, res: Response) => {
    try {
      const limit = Math.min(Number(req.query.limit) || 50, 100);
      const topUsers = await db.select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        usernameColor: users.usernameColor,
        equippedBadge: users.equippedBadge,
        equippedFrame: users.equippedFrame,
        frameAnimation: users.frameAnimation,
        dailyStreak: users.dailyStreak,
        level: users.level,
        avatar: users.avatar,
        isPro: users.isPro,
      }).from(users).orderBy(desc(users.dailyStreak)).limit(limit);
      
      return res.json({ leaderboard: topUsers });
    } catch (error: any) {
      console.error("Error fetching streak leaderboard:", error);
      return res.status(500).json({ message: "Failed to fetch leaderboard" });
    }
  });

  // ============================================================================
  // SOCIAL (MVP): FOLLOW / UNFOLLOW
  // ============================================================================

  type SocialUser = {
    id: string;
    firstName: string | null;
    lastName: string | null;
    avatar: string | null;
    isPro: boolean;
    level: number;
    xp: number;
    dailyStreak: number;
  };

  function socialUserSelect() {
    return {
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      avatar: users.avatar,
      isPro: users.isPro,
      level: users.level,
      xp: users.xp,
      dailyStreak: users.dailyStreak,
    } as const;
  }

  app.get("/api/social/following", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId as string;
      const rows = await db
        .select({ followingId: userFollows.followingId })
        .from(userFollows)
        .where(eq(userFollows.followerId, userId));

      return res.json({ following: rows.map((r) => r.followingId) });
    } catch (error: any) {
      console.error("Error fetching following:", error);
      return res.status(500).json({ message: "Failed to fetch following" });
    }
  });

  // Full user lists for Profile UI
  app.get("/api/social/following/users", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId as string;
      const rows = await db
        .select({ ...socialUserSelect() })
        .from(userFollows)
        .innerJoin(users, eq(users.id, userFollows.followingId))
        .where(eq(userFollows.followerId, userId))
        .orderBy(asc(users.firstName));
      return res.json({ following: rows.map((r: any) => r.users as SocialUser) });
    } catch (error: any) {
      console.error("Error fetching following users:", error);
      return res.status(500).json({ message: "Failed to fetch following users" });
    }
  });

  app.get("/api/social/followers", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId as string;
      const rows = await db
        .select({ ...socialUserSelect() })
        .from(userFollows)
        .innerJoin(users, eq(users.id, userFollows.followerId))
        .where(eq(userFollows.followingId, userId))
        .orderBy(asc(users.firstName));
      return res.json({ followers: rows.map((r: any) => r.users as SocialUser) });
    } catch (error: any) {
      console.error("Error fetching followers:", error);
      return res.status(500).json({ message: "Failed to fetch followers" });
    }
  });

  app.post("/api/social/follow", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId as string;
      const targetUserId = String(req.body?.userId || "").trim();

      if (!targetUserId) return res.status(400).json({ message: "userId required" });
      if (targetUserId === userId) return res.status(400).json({ message: "Cannot follow yourself" });

      const target = await storage.getUser(targetUserId);
      if (!target) return res.status(404).json({ message: "User not found" });

      const existing = await db
        .select({ id: userFollows.id })
        .from(userFollows)
        .where(and(eq(userFollows.followerId, userId), eq(userFollows.followingId, targetUserId)))
        .limit(1);
      if (existing.length > 0) return res.json({ ok: true, following: true });

      await db.insert(userFollows).values({
        followerId: userId,
        followingId: targetUserId,
      });

      return res.json({ ok: true, following: true });
    } catch (error: any) {
      console.error("Error following user:", error);
      return res.status(500).json({ message: "Failed to follow" });
    }
  });

  app.post("/api/social/unfollow", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId as string;
      const targetUserId = String(req.body?.userId || "").trim();

      if (!targetUserId) return res.status(400).json({ message: "userId required" });
      if (targetUserId === userId) return res.status(400).json({ message: "Cannot unfollow yourself" });

      await db
        .delete(userFollows)
        .where(and(eq(userFollows.followerId, userId), eq(userFollows.followingId, targetUserId)));

      return res.json({ ok: true, following: false });
    } catch (error: any) {
      console.error("Error unfollowing user:", error);
      return res.status(500).json({ message: "Failed to unfollow" });
    }
  });

  // ============================================================================
  // SOCIAL: FRIEND REQUESTS
  // ============================================================================

  app.get("/api/social/friend-requests", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId as string;

      const incomingRows = await db
        .select({ ...socialUserSelect(), status: friendRequests.status, createdAt: friendRequests.createdAt })
        .from(friendRequests)
        .innerJoin(users, eq(users.id, friendRequests.fromUserId))
        .where(and(eq(friendRequests.toUserId, userId), eq(friendRequests.status, 'pending')))
        .orderBy(desc(friendRequests.createdAt));

      const outgoingRows = await db
        .select({ ...socialUserSelect(), status: friendRequests.status, createdAt: friendRequests.createdAt })
        .from(friendRequests)
        .innerJoin(users, eq(users.id, friendRequests.toUserId))
        .where(and(eq(friendRequests.fromUserId, userId), eq(friendRequests.status, 'pending')))
        .orderBy(desc(friendRequests.createdAt));

      return res.json({
        incoming: incomingRows.map((r: any) => ({ user: r.users as SocialUser, createdAt: r.createdAt })),
        outgoing: outgoingRows.map((r: any) => ({ user: r.users as SocialUser, createdAt: r.createdAt })),
      });
    } catch (error: any) {
      console.error("Error fetching friend requests:", error);
      return res.status(500).json({ message: "Failed to fetch friend requests" });
    }
  });

  app.get("/api/social/friends", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId as string;

      const asRecipient = await db
        .select({ ...socialUserSelect() })
        .from(friendRequests)
        .innerJoin(users, eq(users.id, friendRequests.fromUserId))
        .where(and(eq(friendRequests.toUserId, userId), eq(friendRequests.status, 'accepted')));

      const asSender = await db
        .select({ ...socialUserSelect() })
        .from(friendRequests)
        .innerJoin(users, eq(users.id, friendRequests.toUserId))
        .where(and(eq(friendRequests.fromUserId, userId), eq(friendRequests.status, 'accepted')));

      const map = new Map<string, SocialUser>();
      for (const r of asRecipient as any[]) map.set((r.users as SocialUser).id, r.users as SocialUser);
      for (const r of asSender as any[]) map.set((r.users as SocialUser).id, r.users as SocialUser);

      return res.json({ friends: Array.from(map.values()) });
    } catch (error: any) {
      console.error("Error fetching friends:", error);
      return res.status(500).json({ message: "Failed to fetch friends" });
    }
  });

  app.post("/api/social/friend-request/send", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId as string;
      const toUserId = String(req.body?.userId || '').trim();
      if (!toUserId) return res.status(400).json({ message: "userId required" });
      if (toUserId === userId) return res.status(400).json({ message: "Cannot friend-request yourself" });

      const target = await storage.getUser(toUserId);
      if (!target) return res.status(404).json({ message: "User not found" });

      // If there's a pending incoming request from them -> accept it.
      const reversePending = await db
        .select({ id: friendRequests.id })
        .from(friendRequests)
        .where(and(eq(friendRequests.fromUserId, toUserId), eq(friendRequests.toUserId, userId), eq(friendRequests.status, 'pending')))
        .limit(1);
      if (reversePending.length > 0) {
        await db
          .update(friendRequests)
          .set({ status: 'accepted', respondedAt: new Date() })
          .where(eq(friendRequests.id, reversePending[0].id));
        return res.json({ ok: true, status: 'accepted' });
      }

      // Already friends?
      const already = await db
        .select({ id: friendRequests.id })
        .from(friendRequests)
        .where(
          and(
            eq(friendRequests.status, 'accepted'),
            sql`(
              (${friendRequests.fromUserId} = ${userId} AND ${friendRequests.toUserId} = ${toUserId})
              OR
              (${friendRequests.fromUserId} = ${toUserId} AND ${friendRequests.toUserId} = ${userId})
            )`
          )
        )
        .limit(1);
      if (already.length > 0) return res.json({ ok: true, status: 'already_friends' });

      const existing = await db
        .select({ id: friendRequests.id, status: friendRequests.status })
        .from(friendRequests)
        .where(and(eq(friendRequests.fromUserId, userId), eq(friendRequests.toUserId, toUserId)))
        .limit(1);

      if (existing.length > 0) {
        if (existing[0].status === 'pending') return res.json({ ok: true, status: 'pending' });
        // revive any non-pending by setting pending again
        await db.update(friendRequests).set({ status: 'pending', respondedAt: null }).where(eq(friendRequests.id, existing[0].id));
        return res.json({ ok: true, status: 'pending' });
      }

      await db.insert(friendRequests).values({ fromUserId: userId, toUserId, status: 'pending' });
      return res.json({ ok: true, status: 'pending' });
    } catch (error: any) {
      console.error("Error sending friend request:", error);
      return res.status(500).json({ message: "Failed to send friend request" });
    }
  });

  app.post("/api/social/friend-request/cancel", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId as string;
      const toUserId = String(req.body?.userId || '').trim();
      if (!toUserId) return res.status(400).json({ message: "userId required" });

      await db
        .update(friendRequests)
        .set({ status: 'canceled', respondedAt: new Date() })
        .where(and(eq(friendRequests.fromUserId, userId), eq(friendRequests.toUserId, toUserId), eq(friendRequests.status, 'pending')));

      return res.json({ ok: true });
    } catch (error: any) {
      console.error("Error canceling friend request:", error);
      return res.status(500).json({ message: "Failed to cancel friend request" });
    }
  });

  app.post("/api/social/friend-request/accept", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId as string;
      const fromUserId = String(req.body?.userId || '').trim();
      if (!fromUserId) return res.status(400).json({ message: "userId required" });

      const updated = await db
        .update(friendRequests)
        .set({ status: 'accepted', respondedAt: new Date() })
        .where(and(eq(friendRequests.fromUserId, fromUserId), eq(friendRequests.toUserId, userId), eq(friendRequests.status, 'pending')));

      return res.json({ ok: true, updated });
    } catch (error: any) {
      console.error("Error accepting friend request:", error);
      return res.status(500).json({ message: "Failed to accept friend request" });
    }
  });

  app.post("/api/social/friend-request/decline", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId as string;
      const fromUserId = String(req.body?.userId || '').trim();
      if (!fromUserId) return res.status(400).json({ message: "userId required" });

      await db
        .update(friendRequests)
        .set({ status: 'declined', respondedAt: new Date() })
        .where(and(eq(friendRequests.fromUserId, fromUserId), eq(friendRequests.toUserId, userId), eq(friendRequests.status, 'pending')));

      return res.json({ ok: true });
    } catch (error: any) {
      console.error("Error declining friend request:", error);
      return res.status(500).json({ message: "Failed to decline friend request" });
    }
  });

  // ============================================================================
  // CHALLENGES ROUTES
  // ============================================================================

  // GET /api/challenges/progress - Get user's challenge progress
  app.get("/api/challenges/progress", authenticateToken, async (req: Request & { user?: any }, res: Response) => {
    try {
      const userId = (req.user as any).id;
      // For now, return empty progress. In production, fetch from database
      return res.json({ progress: [] });
    } catch (error: any) {
      console.error("Error fetching challenge progress:", error);
      return res.status(500).json({ message: "Failed to fetch progress" });
    }
  });

  // GET /api/challenges/daily - Get today's daily challenge
  app.get("/api/challenges/daily", authenticateToken, async (req: Request & { user?: any }, res: Response) => {
    try {
      const { CHALLENGES } = require("../shared/challenges");
      // Get daily challenge based on current date
      const today = new Date();
      const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
      const challengeIndex = dayOfYear % CHALLENGES.length;
      const dailyChallenge = CHALLENGES[challengeIndex];

      return res.json({ challengeId: dailyChallenge.id });
    } catch (error: any) {
      console.error("Error fetching daily challenge:", error);
      return res.status(500).json({ message: "Failed to fetch daily challenge" });
    }
  });

  // POST /api/challenges/execute - Execute challenge code
  app.post("/api/challenges/execute", authenticateToken, async (req: Request & { user?: any }, res: Response) => {
    try {
      const userId = ((req as any).user as any).id;
      const { challengeId, code, hintsUsed, solutionViewed } = req.body;
      const { CHALLENGES, getXPWithHint, getXPWithSolution, getDailyBonusXP } = require("../shared/challenges");

      // Find the challenge
      const challenge = CHALLENGES.find((c: any) => c.id === challengeId);
      if (!challenge) {
        return res.status(404).json({ message: "Challenge not found" });
      }

      // Execute the code and test it
      try {
        const userFunction = new Function(code);
        const fn = userFunction();

        // Run test cases
        let allPassed = true;
        let failedTest = null;

        for (const testCase of challenge.testCases) {
          let result;
          if (Array.isArray(testCase.input)) {
            result = fn(...testCase.input);
          } else if (testCase.input === undefined) {
            result = fn();
          } else {
            result = fn(testCase.input);
          }

          // Compare results (deep equality for objects/arrays)
          const passed = JSON.stringify(result) === JSON.stringify(testCase.output);
          if (!passed) {
            allPassed = false;
            failedTest = {
              input: testCase.input,
              expected: testCase.output,
              received: result,
              description: testCase.description,
            };
            break;
          }
        }

        if (!allPassed) {
          return res.json({
            success: false,
            message: `Test failed: ${failedTest?.description}`,
            details: `Input: ${JSON.stringify(failedTest?.input)}\nExpected: ${JSON.stringify(failedTest?.expected)}\nReceived: ${JSON.stringify(failedTest?.received)}`,
          });
        }

        // Calculate XP earned
        let earnedXP = challenge.baseXP;
        if (solutionViewed) {
          earnedXP = getXPWithSolution(challenge.baseXP);
        } else if (hintsUsed > 0) {
          earnedXP = getXPWithHint(challenge.baseXP, hintsUsed);
        }

        // Check for daily bonus
        const today = new Date();
        const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
        const challengeIndex = dayOfYear % CHALLENGES.length;
        const isDailyChallenge = CHALLENGES[challengeIndex].id === challengeId;
        let bonus = 0;
        if (isDailyChallenge) {
          bonus = getDailyBonusXP(challenge.baseXP);
        }

        const totalXP = earnedXP + bonus;

        // Update user XP and streak
        const user = await db.query.users.findFirst({
          where: (users, { eq }) => eq(users.id, userId),
        });

        if (user) {
          const newXP = (user.xp || 0) + totalXP;
          const newCoins = (user.coins || 0) + Math.floor(totalXP / 50); // 1 coin per 50 XP

          // Check if it's a new day for streak
          const lastActivityDate = user.lastActivityDate ? new Date(user.lastActivityDate) : null;
          const today = new Date();
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);

          let newStreak = user.dailyStreak || 0;
          if (!lastActivityDate || lastActivityDate.toDateString() !== today.toDateString()) {
            if (lastActivityDate && lastActivityDate.toDateString() === yesterday.toDateString()) {
              newStreak += 1;
            } else if (!lastActivityDate) {
              newStreak = 1;
            } else {
              newStreak = 1;
            }
          }

          await db.update(users).set({
            xp: newXP,
            coins: newCoins,
            dailyStreak: newStreak,
            lastActivityDate: new Date(),
          }).where(eq(users.id, userId));

          // Log activity
          await db.insert(activityHistory).values({
            userId,
            type: 'challenge_completed',
            title: `Completed challenge: ${challenge.title}`,
            xpEarned: totalXP,
            metadata: JSON.stringify({ challengeId, earnedXP: earnedXP, bonus, hintsUsed, solutionViewed }),
          } as any);

          // Log coin transaction
          if (newCoins > user.coins!) {
            await db.insert(coinTransactions).values({
              userId,
              amount: newCoins - (user.coins || 0),
              type: 'earn',
              source: 'challenge_completion',
              metadata: JSON.stringify({ challengeId, xpToCoins: Math.floor(totalXP / 50) }),
            } as any);
          }
        }

        return res.json({
          success: true,
          message: "All tests passed!",
          xpEarned: earnedXP,
          bonusXP: bonus,
          totalXP,
        });
      } catch (execError: any) {
        return res.json({
          success: false,
          message: "Code execution error",
          details: execError.message,
        });
      }
    } catch (error: any) {
      console.error("Error executing challenge:", error);
      return res.status(500).json({ message: "Failed to execute challenge" });
    }
  });

  // ============================================================================
  // END GAMIFICATION ROUTES
  // ============================================================================

  // ============================================================================
  // MONETIZATION ROUTES
  // ============================================================================
  
  app.post("/api/monetization/create-payment", authenticateToken, createPayment);
  app.post("/api/monetization/confirm", confirmPurchase);
  app.post("/api/monetization/stripe-webhook", stripeWebhook);
  // Roadmap endpoints
  app.get("/api/roadmap", getRoadmap);
  app.get("/api/roadmap/:slug", getRoadmapItem);
  app.get("/api/roadmap/progress", requireAuth, getProgress);
  app.post("/api/roadmap/complete", requireAuth, completeProgress);
  // Roadmap API
  app.get("/api/monetization/purchases", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId as string;
      const store = await db.select().from(storePurchases).where(eq(storePurchases.userId, userId)).orderBy(desc(storePurchases.purchasedAt));
      const txs = await db.select().from(infinityPayPurchases).where(eq(infinityPayPurchases.userId, userId)).orderBy(desc(infinityPayPurchases.createdAt));
      return res.json({ store, transactions: txs });
    } catch (error: any) {
      console.error('Error fetching monetization purchases:', error);
      return res.status(500).json({ message: 'Failed to fetch purchases' });
    }
  });
  app.post("/api/monetization/watch-ad", authenticateToken, watchAd);
  app.get("/api/monetization/check-usage", authenticateToken, checkUsage);
  app.post("/api/monetization/consume-usage", authenticateToken, consumeUsage);
  
  // Ad Analytics & Tracking
  app.post("/api/analytics/ad-impression", trackAdImpression);
  app.post("/api/analytics/verify-ad-watch", authenticateToken, verifyAdWatch);
  app.get("/api/analytics/ad-stats", authenticateToken, getAdStats);
  app.post("/api/monetization/skip-ad-cooldown", authenticateToken, skipAdForCoins);

  // Generic analytics event collector (can be called from client). Accepts optional user token.
  app.post("/api/analytics/event", async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId as string | undefined;
      const { eventType, payload } = req.body || {};
      if (!eventType) return res.status(400).json({ message: "eventType required" });

      await db.insert(siteAnalytics).values({
        userId: userId || null,
        eventType: String(eventType),
        payload: payload ? JSON.stringify(payload) : null,
      });

      return res.json({ ok: true });
    } catch (err: any) {
      console.error("Error recording analytics event:", err?.message || err);
      return res.status(500).json({ message: "Failed to record event" });
    }
  });

  // ============================================================================
  // END MONETIZATION ROUTES
  // ============================================================================

  // Save progress
  app.post("/api/progress", requireAuth, async (req: Request, res: Response) => {
    const parsed = progressSchema.safeParse(req.body || {});
    if (!parsed.success) return res.status(400).json({ message: "invalid progress payload" });
    const { lessonId, language, index } = parsed.data;
    const userId = (req as any).userId as string;
    
    // Upsert: update if exists, insert if not
    const existing = await db
      .select()
      .from(progress)
      .where(and(eq(progress.userId, userId), eq(progress.lessonId, lessonId), eq(progress.language, language)))
      .limit(1);
    
    if (existing.length > 0) {
      await db
        .update(progress)
        .set({ stepIndex: index, updatedAt: new Date() })
        .where(and(eq(progress.userId, userId), eq(progress.lessonId, lessonId), eq(progress.language, language)));
    } else {
      await db.insert(progress).values({
        userId,
        lessonId,
        language,
        stepIndex: index,
      });
    }
    
    return res.json({ ok: true });
  });

  // Get progress
  app.get("/api/progress", requireAuth, async (req: Request, res: Response) => {
    const userId = (req as any).userId as string;
    const userProgress = await db.select().from(progress).where(eq(progress.userId, userId));
    
    // Convert to map format: "lessonId:language" -> stepIndex
    const map: Record<string, number> = {};
    userProgress.forEach((p) => {
      map[`${p.lessonId}:${p.language}`] = p.stepIndex;
    });
    
    return res.json(map);
  });

  // Check Pro status
  app.get("/api/pro/status", requireAuth, async (req: Request, res: Response) => {
    const userId = (req as any).userId as string;
    const user = await storage.getUser(userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    
    const isPro = user.isPro && (!user.proExpiresAt || new Date(user.proExpiresAt) > new Date());
    
    return res.json({
      isPro,
      expiresAt: user.proExpiresAt,
      plan: isPro ? "pro" : "free"
    });
  });

  // Confirm Stripe subscription and immediately activate Pro for an existing user.
  // This avoids waiting on webhook timing on the post-checkout return.
  // Security model: session_id is treated as a secret; we still rate-limit by IP.
  app.post("/api/pro/confirm-subscription", async (req: Request, res: Response) => {
    try {
      if (!checkRateLimit(`pro-confirm:${req.ip}`, 30, 60_000)) {
        return res.status(429).json({ ok: false, error: "Too many requests" });
      }

      const stripe = getStripe();
      if (!stripe) {
        return res.status(503).json({ ok: false, error: "Billing not configured" });
      }

      const body = (req.body || {}) as any;
      const sessionId: string | undefined = body.sessionId || body.session_id || (req.query as any)?.session_id;
      if (!sessionId) {
        return res.status(400).json({ ok: false, error: "sessionId is required" });
      }

      const session = await stripe.checkout.sessions.retrieve(sessionId);

      const paid = session.payment_status === "paid" || session.status === "complete";
      const email = session.customer_details?.email || undefined;
      if (!paid || !email) {
        return res.status(402).json({ ok: false, error: "Payment not confirmed or missing email" });
      }

      let expiresAt: Date | null = null;
      const subscriptionId = (session.subscription as string) || undefined;
      if (subscriptionId) {
        try {
          const sub = await stripe.subscriptions.retrieve(subscriptionId);
          if (sub.current_period_end) expiresAt = new Date(sub.current_period_end * 1000);
        } catch {
          // Best-effort; webhook will reconcile expiry.
        }
      }

      const updated = await db
        .update(users)
        .set({
          isPro: true,
          proExpiresAt: expiresAt,
        })
        .where(eq(users.email, email))
        .returning({ id: users.id });

      if (!updated || updated.length === 0) {
        return res.status(404).json({ ok: false, error: "User not found for this email" });
      }

      return res.json({ ok: true, email, expiresAt: expiresAt ? expiresAt.toISOString() : null });
    } catch (err: any) {
      console.error("[ERROR] /api/pro/confirm-subscription:", err);
      return res.status(500).json({ ok: false, error: err?.message || String(err) });
    }
  });

  // Upgrade to Pro (legacy simulation - kept for fallback/testing)
  app.post("/api/pro/upgrade", requireAuth, async (req: Request, res: Response) => {
    try {
    const userId = (req as any).userId as string;
    const { months = 1 } = req.body;
    
    if (!months || months < 1 || months > 36) {
      return res.status(400).json({ message: "Invalid months (1-36)" });
    }
    
    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + months);
    
    // Update user
    await db.update(users)
      .set({
        isPro: true,
        proExpiresAt: expiresAt
      })
      .where(eq(users.id, userId));
    
    return res.json({
      success: true,
      isPro: true,
      expiresAt: expiresAt.toISOString(),
      plan: "pro"
    });
    } catch (err: any) {
      return res.status(500).json({ message: "Upgrade failed" });
    }
  });

  // Cancel Pro subscription
  app.post("/api/pro/cancel", requireAuth, async (req: Request, res: Response) => {
    try {
    const userId = (req as any).userId as string;
    
    await db.update(users)
      .set({
        isPro: false,
        proExpiresAt: null
      })
      .where(eq(users.id, userId));
    
    return res.json({
      success: true,
      isPro: false,
      plan: "free"
    });
    } catch (err: any) {
      return res.status(500).json({ message: "Cancel failed" });
    }
  });

  // Create Stripe Checkout session
  app.post("/api/billing/checkout", requireAuth, async (req: Request, res: Response) => {
    const startTime = Date.now();
    try {
      const stripe = getStripe();
      if (!stripe) {
        console.error('[CHECKOUT] Stripe not configured');
        return res.status(503).json({ message: "Billing not configured" });
      }
      const userId = (req as any).userId as string;
      const { product } = req.body; // "pro" or "battle_pass"
      const baseUrl = getBaseUrl(req);

      let mode: "subscription" | "payment" = "subscription";
      let price = STRIPE_PRICE_PRO_MONTHLY_USD || STRIPE_PRICE_PRO_MONTHLY;
      let successUrl = `${baseUrl}/pricing?session_id={CHECKOUT_SESSION_ID}`;
      let cancelUrl = `${baseUrl}/pricing`;

      if (product === "battle_pass") {
        mode = "payment";
        price = STRIPE_PRICE_BATTLE_PASS;
        successUrl = `${baseUrl}/battle-pass?session_id={CHECKOUT_SESSION_ID}`;
        cancelUrl = `${baseUrl}/battle-pass`;
        
        console.log('[BATTLE_PASS_CHECKOUT]', { 
          product, 
          price, 
          successUrl, 
          cancelUrl,
          userId 
        });
        
        if (!price) {
          console.error('[CHECKOUT] STRIPE_PRICE_BATTLE_PASS not configured:', STRIPE_PRICE_BATTLE_PASS);
          return res.status(503).json({ message: "Battle Pass price not configured. Check environment: STRIPE_PRICE_BATTLE_PASS" });
        }
      } else {
        if (!price) {
          console.error('[CHECKOUT] STRIPE_PRICE_PRO_MONTHLY_USD or STRIPE_PRICE_PRO_MONTHLY not configured');
          return res.status(503).json({ message: "Pro price not configured. Contact support." });
        }
      }

      const normalizeStripeId = (value: string) =>
        value
          .trim()
          .replace(/\\r\\n/g, "")
          .replace(/\\n/g, "")
          .replace(/\\r/g, "")
          .trim();

      // Price IDs are often copy/pasted into Vercel envs; defensively normalize CR/LF.
      price = normalizeStripeId(String(price || ""));

      const sessionConfig: any = {
        mode,
        line_items: [{ price, quantity: 1 }],
        success_url: successUrl,
        cancel_url: cancelUrl,
        client_reference_id: userId,
        metadata: { userId, product: product || "pro" },
      };

      // Stripe Tax is not supported for all Stripe account countries.
      // Keep it OFF by default; allow opting in via env.
      const enableAutomaticTax = String(process.env.STRIPE_AUTOMATIC_TAX || "").trim().toLowerCase() === "true";
      if (enableAutomaticTax) {
        sessionConfig.automatic_tax = { enabled: true };
      }

      if (mode === "subscription") {
        sessionConfig.subscription_data = { metadata: { userId } };
        sessionConfig.allow_promotion_codes = true;
      }

      console.log('[CHECKOUT] Creating session with config:', sessionConfig);

      let session: any;
      try {
        session = await stripe.checkout.sessions.create(sessionConfig);
      } catch (err: any) {
        const msg = String(err?.message || "");

        const isStripeTaxUnsupported = /Stripe Tax is not supported\s+for your account country/i.test(msg);
        if (isStripeTaxUnsupported && sessionConfig.automatic_tax) {
          console.warn('[CHECKOUT] Stripe Tax unsupported; retrying without automatic_tax');
          const retryConfig = { ...sessionConfig };
          delete (retryConfig as any).automatic_tax;
          session = await stripe.checkout.sessions.create(retryConfig);
        } else {
          const recurringPriceInPaymentMode =
            product === "battle_pass" &&
            sessionConfig.mode === "payment" &&
            /passed a recurring price|You specified `payment` mode/i.test(msg);
          if (recurringPriceInPaymentMode) {
            console.warn('[CHECKOUT] Battle Pass price is recurring; retrying with subscription mode');
            const retryConfig: any = { ...sessionConfig, mode: "subscription" };
            retryConfig.subscription_data = { metadata: { userId } };
            retryConfig.allow_promotion_codes = false;
            session = await stripe.checkout.sessions.create(retryConfig);
          } else {
            throw err;
          }
        }
      }
      console.log('[CHECKOUT] Session created:', { id: session.id, url: session.url, duration: Date.now() - startTime });
      return res.json({ url: session.url });
    } catch (err: any) {
      console.error("[CHECKOUT] Error:", err.message, err.code);
      return res.status(500).json({ message: "Failed to create checkout: " + err.message });
    }
  });

  // Create Stripe Billing Portal session
  app.get("/api/billing/portal", requireAuth, async (req: Request, res: Response) => {
    try {
      const stripe = getStripe();
      if (!stripe) return res.status(503).json({ message: "Billing not configured" });
      const userId = (req as any).userId as string;
      const baseUrl = getBaseUrl(req);

      // Find stored customer mapping
      const mapping = await db.select().from(stripeCustomers).where(eq(stripeCustomers.userId, userId)).limit(1);
      if (!mapping.length) return res.status(404).json({ message: "No billing customer found" });

      const portal = await stripe.billingPortal.sessions.create({
        customer: mapping[0].customerId,
        return_url: `${baseUrl}/pricing`,
      });
      return res.json({ url: portal.url });
    } catch (err: any) {
      return res.status(500).json({ message: "Failed to create portal" });
    }
  });

  // Stripe webhook (raw body is required; configured in index.ts)
  app.post("/api/webhooks/stripe", async (req: Request, res: Response) => {
    const stripe = getStripe();
    if (!stripe) return res.status(503).json({ message: "Billing not configured" });
    if (!STRIPE_WEBHOOK_SECRET) return res.status(503).json({ message: "Webhook not configured" });

    let event: Stripe.Event;
    try {
      const sig = req.headers["stripe-signature"] as string;
      const raw = (req as any).body || (req as any).rawBody;
      event = stripe.webhooks.constructEvent(raw, sig, STRIPE_WEBHOOK_SECRET);
    } catch (e: any) {
      return res.status(400).send(`Webhook Error: ${e.message}`);
    }

    // Idempotency: skip if already processed
    try {
      await db.insert(webhookEvents).values({ id: event.id });
    } catch {
      return res.status(200).json({ received: true, duplicate: true });
    }

    try {
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object as Stripe.Checkout.Session;
          const userId = (session.client_reference_id as string) || (session.metadata?.userId as string);
          const customerId = (session.customer as string) || "";
          const product = (session.metadata?.product as string) || "pro";
          
          if (userId && customerId) {
            // upsert mapping
            const existing = await db.select().from(stripeCustomers).where(eq(stripeCustomers.userId, userId)).limit(1);
            if (existing.length) {
              // nothing to do, or update if changed
            } else {
              await db.insert(stripeCustomers).values({ userId, customerId });
            }
          }
          
          // Activate Battle Pass if purchased
          if (userId && product === "battle_pass") {
            try {
              // If battle pass was purchased using a recurring price (subscription mode), cancel immediately to prevent renewals.
              const subscriptionId = session.subscription ? String(session.subscription) : "";
              if (subscriptionId) {
                try {
                  await stripe.subscriptions.cancel(subscriptionId);
                  console.log(`[BATTLE_PASS] Canceled subscription ${subscriptionId} after activation`);
                } catch (e: any) {
                  console.error(`[BATTLE_PASS] Failed to cancel subscription ${subscriptionId}:`, e?.message || e);
                }
              }

              const user = await storage.getUser(userId);
              if (user && !user.battlePassActive) {
                await db.update(users).set({
                  battlePassActive: true,
                  battlePassSeason: user.battlePassSeason || 1,
                }).where(eq(users.id, userId));
                console.log(`[BATTLE_PASS] Activated for user ${userId}`);
              }
            } catch (err: any) {
              console.error(`[BATTLE_PASS] Failed to activate for user ${userId}:`, err.message);
            }
          }
          break;
        }
        case "customer.subscription.created":
        case "customer.subscription.updated": {
          const sub = event.data.object as Stripe.Subscription;
          const userId = (sub.metadata?.userId as string) || undefined;
          const customerId = (sub.customer as string) || undefined;
          const status = sub.status;
          const periodEnd = sub.current_period_end ? new Date(sub.current_period_end * 1000) : null;

          let targetUserId = userId;
          if (!targetUserId && customerId) {
            const map = await db.select().from(stripeCustomers).where(eq(stripeCustomers.customerId, customerId)).limit(1);
            if (map.length) targetUserId = map[0].userId;
          }

          if (targetUserId) {
            const active = status === "active" || status === "trialing";
            await db
              .update(users)
              .set({ isPro: active, proExpiresAt: active ? periodEnd : null })
              .where(eq(users.id, targetUserId));
          }
          break;
        }
        case "customer.subscription.deleted": {
          const sub = event.data.object as Stripe.Subscription;
          const customerId = (sub.customer as string) || undefined;
          if (customerId) {
            const map = await db.select().from(stripeCustomers).where(eq(stripeCustomers.customerId, customerId)).limit(1);
            if (map.length) {
              await db.update(users).set({ isPro: false, proExpiresAt: null }).where(eq(users.id, map[0].userId));
            }
          }
          break;
        }
        default:
          break;
      }
    } catch (err: any) {
      // swallow business errors to not get retries for non-critical paths
    }

    return res.json({ received: true });
  });

  // Debug endpoint to test Resend
  app.post("/api/debug/test-email", async (req: Request, res: Response) => {
    if (!resend) {
      return res.json({ 
        status: "no-key",
        message: "Resend API key not configured",
        apiKey: RESEND_API_KEY ? "configured" : "missing",
        fromEmail: RESEND_FROM_EMAIL
      });
    }

    const { data, error } = await resend.emails.send({
      from: RESEND_FROM_EMAIL,
      to: "felypexelepe@hotmail.com",
      subject: "🧪 Teste Resend - Debug",
      html: `<h2>Email de teste do Resend</h2><p>Se você recebeu isso, Resend está funcionando!</p>`,
    });

    return res.json({
      status: error ? "error" : "success",
      error: error ? error : null,
      data: data,
      apiKeyConfigured: !!RESEND_API_KEY,
      fromEmail: RESEND_FROM_EMAIL
    });
  });

  // Debug endpoint to check Stripe configuration
  app.get("/api/debug/stripe-config", async (req: Request, res: Response) => {
    const stripe = getStripe();
    return res.json({
      stripeConfigured: !!stripe,
      stripeSecretKey: process.env.STRIPE_SECRET_KEY ? "configured" : "missing",
      stripePrices: {
        STRIPE_PRICE_PRO_MONTHLY: STRIPE_PRICE_PRO_MONTHLY,
        STRIPE_PRICE_PRO_ANNUAL: STRIPE_PRICE_PRO_ANNUAL,
        STRIPE_PRICE_PRO_MONTHLY_USD: STRIPE_PRICE_PRO_MONTHLY_USD,
        STRIPE_PRICE_PRO_MONTHLY_BRL: STRIPE_PRICE_PRO_MONTHLY_BRL,
        STRIPE_PRICE_PRO_ANNUAL_USD: STRIPE_PRICE_PRO_ANNUAL_USD,
        STRIPE_PRICE_PRO_ANNUAL_BRL: STRIPE_PRICE_PRO_ANNUAL_BRL,
        STRIPE_PRICE_BATTLE_PASS: STRIPE_PRICE_BATTLE_PASS,
      },
      stripeWebhook: STRIPE_WEBHOOK_SECRET ? "configured" : "missing",
    });
  });

  // ============================================================================
  // BATTLE PASS ROUTES
  // ============================================================================

  // Get Battle Pass info (includes user tier/xp/premium status)
  app.get("/api/battle-pass/status", async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId as string | undefined;
      if (!userId) {
        return res.json({
          user: null,
          season: 1,
          tierFromXp: 1,
          hasPremium: false,
          message: "User not logged in"
        });
      }

      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      const tierFromXp = Math.min(50, Math.max(1, Math.floor((user.xp || 0) / 200) + 1));
      const hasPremium = user.battlePassActive || false;

      return res.json({
        userId,
        xp: user.xp || 0,
        level: user.level || 1,
        currentTier: tierFromXp,
        season: user.battlePassSeason || 1,
        hasPremium,
        createdAt: user.createdAt,
      });
    } catch (error: any) {
      console.error("Error getting battle pass status:", error);
      return res.status(500).json({ message: "Failed to get battle pass status" });
    }
  });

  // Complete exercise/lesson and award XP (for Battle Pass progression)
  app.post("/api/battle-pass/award-xp", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId as string;
      const { xpAmount, source } = req.body;

      if (!xpAmount || xpAmount <= 0) {
        return res.status(400).json({ message: "xpAmount must be positive" });
      }

      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      const newXP = (user.xp || 0) + xpAmount;
      const newLevel = calculateLevel(newXP);

      await db.update(users).set({
        xp: newXP,
        level: newLevel,
      }).where(eq(users.id, userId));

      // Record activity
      await db.insert(activityHistory).values({
        userId,
        type: source || "exercise",
        title: `Exercício completado (+${xpAmount} XP)`,
        xpEarned: xpAmount,
        timeSpent: 0,
      });

      return res.json({
        message: "XP awarded",
        newXP,
        newLevel,
        tierFromXp: Math.min(50, Math.max(1, Math.floor(newXP / 200) + 1)),
      });
    } catch (error: any) {
      console.error("Error awarding XP:", error);
      return res.status(500).json({ message: "Failed to award XP" });
    }
  });

  // Claim reward for completing exercises/lessons (grants XP)
  app.post("/api/activity/grant-xp", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId as string;
      const { activityType, xpAmount, lessonId } = req.body;

      if (!xpAmount || xpAmount <= 0 || xpAmount > 500) {
        return res.status(400).json({ message: "Invalid XP amount (1-500)" });
      }

      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      const newXP = (user.xp || 0) + xpAmount;
      const newLevel = calculateLevel(newXP);

      await db.update(users).set({
        xp: newXP,
        level: newLevel,
        totalExercises: (user.totalExercises || 0) + 1,
      }).where(eq(users.id, userId));

      // Record activity
      await db.insert(activityHistory).values({
        userId,
        type: activityType || "exercise",
        title: `Exercício completado (${lessonId || "Unknown"})`,
        xpEarned: xpAmount,
        timeSpent: 0,
      });

      // Award coins based on XP (1 coin per 5 XP)
      const coinReward = Math.floor(xpAmount / 5);
      if (coinReward > 0) {
        await db.update(users).set({
          coins: (user.coins || 0) + coinReward,
        }).where(eq(users.id, userId));

        await db.insert(coinTransactions).values({
          userId,
          amount: coinReward,
          type: "earn",
          source: "exercise_complete",
          metadata: JSON.stringify({ lessonId, xpEarned: xpAmount }),
        });
      }

      return res.json({
        message: "XP awarded",
        xpEarned: xpAmount,
        coinsEarned: coinReward,
        newXP,
        newLevel,
        tierFromXp: Math.min(50, Math.max(1, Math.floor(newXP / 200) + 1)),
      });
    } catch (error: any) {
      console.error("Error granting XP:", error);
      return res.status(500).json({ message: "Failed to grant XP" });
    }
  });

  // Activate Battle Pass after Stripe purchase
  app.post("/api/battle-pass/activate", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId as string;
      const sessionId = (req.body && (req.body.sessionId || req.body.session_id)) as string | undefined;

      const stripe = getStripe();
      if (!stripe) {
        return res.status(503).json({ message: "Billing not configured" });
      }

      if (!sessionId) {
        return res.status(400).json({ message: "sessionId is required" });
      }

      const session = await stripe.checkout.sessions.retrieve(String(sessionId));
      const sessionUserId = (session.client_reference_id as string) || (session.metadata?.userId as string) || "";
      const product = (session.metadata?.product as string) || "";
      const paid = session.payment_status === "paid" || session.status === "complete";

      if (!paid) {
        return res.status(402).json({ message: "Payment not completed" });
      }

      if (sessionUserId !== userId) {
        return res.status(403).json({ message: "Checkout session does not match user" });
      }

      if (product !== "battle_pass") {
        return res.status(400).json({ message: "Invalid product for Battle Pass activation" });
      }

      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      if (user.battlePassActive) {
        return res.json({ message: "Battle Pass already active", season: user.battlePassSeason });
      }

      await db.update(users).set({
        battlePassActive: true,
        battlePassSeason: user.battlePassSeason || 1,
      }).where(eq(users.id, userId));

      return res.json({
        message: "Battle Pass activated",
        season: user.battlePassSeason || 1,
      });
    } catch (error: any) {
      console.error("Error activating battle pass:", error);
      return res.status(500).json({ message: "Failed to activate battle pass" });
    }
  });

  // ============================================================================
  // ENHANCED COSMETICS ROUTES
  // ============================================================================

  // Get all cosmetics inventory for a user (what they own)
  app.get("/api/cosmetics/inventory", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId as string;

      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      // Get all purchases for this user
      const purchases = await db.select().from(storePurchases)
        .where(eq(storePurchases.userId, userId));

      const ownedItemIds = purchases.map(p => p.itemId);
      const ownedItems = STORE_CATALOG.filter(item => ownedItemIds.includes(item.id));

      return res.json({
        owned: ownedItems,
        count: ownedItems.length,
        equipped: {
          avatar: user.avatar || "default",
          frame: user.equippedFrame || null,
          frameAnimation: (user as any).frameAnimation || null,
          nameEffect: user.equippedNameEffect || null,
          theme: (user as any).theme || null,
          badge: user.equippedBadge || null,
        },
      });
    } catch (error: any) {
      console.error("Error fetching cosmetics inventory:", error);
      return res.status(500).json({ message: "Failed to fetch inventory" });
    }
  });

  // Get cosmetics catalog with user ownership info
  app.get("/api/cosmetics/catalog", optionalAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId as string | undefined;

      if (!userId) {
        return res.json({
          items: STORE_CATALOG.filter(item => item.type === "cosmetic"),
          owned: [],
        });
      }

      const purchases = await db.select().from(storePurchases)
        .where(eq(storePurchases.userId, userId));
      const ownedItemIds = purchases.map(p => p.itemId);

      const cosmetics = STORE_CATALOG.filter(item => item.type === "cosmetic");
      const catalogWithOwnership = cosmetics.map(item => ({
        ...item,
        owned: ownedItemIds.includes(item.id),
      }));

      return res.json({
        items: catalogWithOwnership,
        owned: ownedItemIds,
      });
    } catch (error: any) {
      console.error("Error fetching cosmetics catalog:", error);
      return res.status(500).json({ message: "Failed to fetch catalog" });
    }
  });

  // Purchase cosmetic with coins
  app.post("/api/cosmetics/buy-with-coins", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId as string;
      const { itemId } = req.body;

      if (!itemId) return res.status(400).json({ message: "itemId required" });

      const item = STORE_CATALOG.find(i => i.id === itemId);
      if (!item) return res.status(404).json({ message: "Item not found" });
      if (item.type !== "cosmetic") return res.status(400).json({ message: "Not a cosmetic" });

      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      const coinCost = item.price || 500;
      if (user.coins < coinCost) {
        return res.status(400).json({ message: "Insufficient coins", needed: coinCost, have: user.coins });
      }

      // Check if already owned
      const existing = await db.select().from(storePurchases)
        .where(and(eq(storePurchases.userId, userId), eq(storePurchases.itemId, itemId)))
        .limit(1);
      if (existing.length > 0) return res.status(400).json({ message: "Item already owned" });

      const newCoins = user.coins - coinCost;
      await db.update(users).set({ coins: newCoins }).where(eq(users.id, userId));

      await db.insert(storePurchases).values({
        userId,
        itemId: item.id,
        itemType: "cosmetic",
        xpCost: 0,
        coinCost,
      });

      await db.insert(coinTransactions).values({
        userId,
        amount: -coinCost,
        type: "spend",
        source: "cosmetic_purchase",
        metadata: JSON.stringify({ itemId: item.id, itemName: item.name }),
      });

      // Grant particle effects entitlement
      if (item.id === 'particle_effects') {
        await db.update(users).set({ particleEffects: true }).where(eq(users.id, userId));
      }

      return res.json({
        message: "Cosmetic purchased",
        item: item.name,
        newCoins,
      });
    } catch (error: any) {
      console.error("Error purchasing cosmetic:", error);
      return res.status(500).json({ message: "Failed to purchase cosmetic" });
    }
  });

  // Equip cosmetic with better handling
  app.post("/api/cosmetics/equip", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId as string;
      const { itemId, frameAnimation } = req.body;

      if (!itemId) return res.status(400).json({ message: "itemId required" });

      const owned = await db.select().from(storePurchases)
        .where(and(eq(storePurchases.userId, userId), eq(storePurchases.itemId, itemId)))
        .limit(1);
      if (owned.length === 0) return res.status(403).json({ message: "Item not owned" });

      const item = STORE_CATALOG.find(i => i.id === itemId);
      if (!item) return res.status(404).json({ message: "Item not found" });

      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      const updates: any = {};

      const allowedFrameAnimations = new Set([
        "rotate",
        "pulse",
        "shimmer",
        "glow",
        "wave",
        "bounce",
        "wobble",
        "tilt",
        "zoom",
        "flicker",
      ]);

      if (item.category === "avatar") {
        updates.avatar = itemId.replace("avatar_", "");
      } else if (item.category === "frame") {
        updates.equippedFrame = itemId;

        if (itemId === "frame_animated" && frameAnimation !== undefined) {
          const anim = String(frameAnimation).trim();
          if (!allowedFrameAnimations.has(anim)) {
            return res.status(400).json({ message: "Invalid frameAnimation" });
          }
          updates.frameAnimation = anim;
        }
      } else if (item.category === "name_effect") {
        updates.equippedNameEffect = itemId;
      } else if (item.category === "theme") {
        updates.theme = itemId;
      } else if (item.category === "badge") {
        updates.equippedBadge = itemId;
      }

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ message: "Cannot equip this item" });
      }

      await db.update(users).set(updates).where(eq(users.id, userId));

      return res.json({
        message: "Cosmetic equipped",
        item: item.name,
        equipped: {
          avatar: updates.avatar || user.avatar,
          frame: updates.equippedFrame || user.equippedFrame,
          frameAnimation: (updates.frameAnimation ?? (user as any).frameAnimation) || null,
          nameEffect: updates.equippedNameEffect || user.equippedNameEffect,
          theme: updates.theme || (user as any).theme,
          badge: updates.equippedBadge || user.equippedBadge,
        },
      });
    } catch (error: any) {
      console.error("Error equipping cosmetic:", error);
      return res.status(500).json({ message: "Failed to equip cosmetic" });
    }
  });

  return httpServer;
}
