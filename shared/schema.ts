import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  dateOfBirth: timestamp("date_of_birth"),
  country: text("country"),
  emailVerified: boolean("email_verified").notNull().default(false),
  isAdmin: boolean("is_admin").notNull().default(false),
  isPro: boolean("is_pro").notNull().default(false),
  proExpiresAt: timestamp("pro_expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
  // Gamification
  xp: integer("xp").notNull().default(0),
  level: integer("level").notNull().default(1),
  // Site currency (FlowCoins)
  coins: integer("coins").notNull().default(0),
  avatar: text("avatar").default("default"),
  bio: text("bio"),
  theme: text("theme").default("dark"),
  language: text("language").default("en"),
  dailyStreak: integer("daily_streak").notNull().default(0),
  lastActivityDate: timestamp("last_activity_date"),
  dailyGoal: integer("daily_goal").notNull().default(3),
  totalExercises: integer("total_exercises").notNull().default(0),
  totalTime: integer("total_time").notNull().default(0), // in seconds
  // Monetization
  freeUsageCount: integer("free_usage_count").notNull().default(10), // Free uses remaining
  adsWatched: integer("ads_watched").notNull().default(0), // Total ads watched
  lastAdWatched: timestamp("last_ad_watched"), // Track cooldown
  premiumPurchases: integer("premium_purchases").notNull().default(0), // Total purchases made
});

export const progress = pgTable("progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  lessonId: text("lesson_id").notNull(),
  language: text("language").notNull(),
  stepIndex: integer("step_index").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Email verification
export const emailVerifications = pgTable("email_verifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  code: text("code").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  attempts: integer("attempts").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Password reset
export const passwordResets = pgTable("password_resets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  code: text("code").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  attempts: integer("attempts").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Stripe billing helpers
export const webhookEvents = pgTable("webhook_events", {
  id: text("id").primaryKey(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const stripeCustomers = pgTable("stripe_customers", {
  userId: varchar("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  customerId: text("customer_id").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
});

// User Activity History
export const activityHistory = pgTable("activity_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // 'exercise', 'lesson', 'profiler', 'inspector', 'debugger'
  title: text("title").notNull(),
  xpEarned: integer("xp_earned").notNull().default(0),
  timeSpent: integer("time_spent"), // in seconds
  score: integer("score"), // 0-100 for exercises
  metadata: text("metadata"), // JSON string for extra data
  createdAt: timestamp("created_at").defaultNow(),
});

// User Achievements/Badges
export const userAchievements = pgTable("user_achievements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  achievementId: text("achievement_id").notNull(), // 'streak_7', 'perfectionist', etc
  unlockedAt: timestamp("unlocked_at").defaultNow(),
});

// Journal Entries
export const journalEntries = pgTable("journal_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  date: timestamp("date").notNull().defaultNow(),
  title: text("title"),
  content: text("content").notNull(),
  tags: text("tags"), // comma-separated
  exerciseId: text("exercise_id"), // optional link to exercise
  code: text("code"), // optional code snippet
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// XP Store Purchases
export const storePurchases = pgTable("store_purchases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  itemId: text("item_id").notNull(), // 'avatar_ninja', 'hint_token', etc
  itemType: text("item_type").notNull(), // 'cosmetic', 'utility', 'boost'
  xpCost: integer("xp_cost").notNull(),
  coinCost: integer("coin_cost").notNull().default(0),
  purchasedAt: timestamp("purchased_at").defaultNow(),
});

// Daily Challenges Completion
export const dailyChallenges = pgTable("daily_challenges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  challengeDate: timestamp("challenge_date").notNull(),
  exercisesCompleted: integer("exercises_completed").notNull().default(0),
  goalMet: boolean("goal_met").notNull().default(false),
  xpBonus: integer("xp_bonus").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// FlowCoins transactions (earn/spend)
export const coinTransactions = pgTable("coin_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(), // positive for earn, negative for spend
  type: text("type").notNull(), // 'earn' | 'spend'
  source: text("source"), // 'activity' | 'purchase' | 'bonus' | etc
  metadata: text("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Infinity Pay purchases
export const infinityPayPurchases = pgTable("infinity_pay_purchases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  transactionId: text("transaction_id").notNull().unique(), // Infinity Pay transaction ID
  packageId: text("package_id").notNull(), // 'pro_monthly', 'coins_100', etc
  amount: integer("amount").notNull(), // in cents
  currency: text("currency").notNull().default("BRL"),
  status: text("status").notNull(), // 'pending', 'completed', 'failed', 'refunded'
  paymentMethod: text("payment_method"), // 'pix', 'credit_card', etc
  metadata: text("metadata"), // JSON string
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Ad rewards tracking
export const adRewards = pgTable("ad_rewards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  adProvider: text("ad_provider").notNull(), // 'google_adsense', 'custom'
  rewardType: text("reward_type").notNull(), // 'usage_unlock', 'coins', 'xp'
  rewardAmount: integer("reward_amount").notNull(), // 5 uses, 10 coins, etc
  watchedAt: timestamp("watched_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  password: true,
});

export const insertProgressSchema = createInsertSchema(progress).pick({
  userId: true,
  lessonId: true,
  language: true,
  stepIndex: true,
});

// Roadmap progress for Pro users (persistent)
export const roadmapProgress = pgTable("roadmap_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  pathId: text("path_id").notNull(),
  itemSlug: text("item_slug").notNull(),
  status: text("status").notNull().default('completed'),
  progressMeta: text("progress_meta"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type RoadmapProgress = typeof roadmapProgress.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Progress = typeof progress.$inferSelect;
export type InsertProgress = z.infer<typeof insertProgressSchema>;
export type WebhookEventRow = typeof webhookEvents.$inferSelect;
export type StripeCustomerRow = typeof stripeCustomers.$inferSelect;
export type ActivityHistory = typeof activityHistory.$inferSelect;
export type UserAchievement = typeof userAchievements.$inferSelect;
export type JournalEntry = typeof journalEntries.$inferSelect;
export type StorePurchase = typeof storePurchases.$inferSelect;
export type DailyChallenge = typeof dailyChallenges.$inferSelect;
export type CoinTransaction = typeof coinTransactions.$inferSelect;
export type InfinityPayPurchase = typeof infinityPayPurchases.$inferSelect;
export type AdReward = typeof adRewards.$inferSelect;
