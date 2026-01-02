import { type User, type InsertUser } from "../shared/schema.js";
import { db } from "./db.js";
import { users, emailVerifications, passwordResets } from "../shared/schema.js";
import { eq } from "drizzle-orm";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser & { firstName?: string; lastName?: string; dateOfBirth?: Date; country?: string }): Promise<User>;
  createEmailVerification(email: string, code: string): Promise<void>;
  getEmailVerification(email: string): Promise<{ email: string; code: string; expiresAt: Date; attempts: number } | undefined>;
  verifyEmail(email: string, code: string): Promise<boolean>;
  markEmailAsVerified(email: string): Promise<void>;
  incrementVerificationAttempts(email: string): Promise<void>;
  deleteEmailVerification(email: string): Promise<void>;
  createPasswordReset(email: string, code: string): Promise<void>;
  getPasswordReset(email: string): Promise<{ email: string; code: string; expiresAt: Date; attempts: number } | undefined>;
  verifyPasswordReset(email: string, code: string): Promise<boolean>;
  incrementPasswordResetAttempts(email: string): Promise<void>;
  deletePasswordReset(email: string): Promise<void>;
  updateUserPassword(email: string, hashedPassword: string): Promise<void>;
}

export class DrizzleStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser & { firstName?: string; lastName?: string; dateOfBirth?: Date; country?: string }): Promise<User> {
    const result = await db.insert(users).values({
      email: insertUser.email,
      password: insertUser.password,
      firstName: insertUser.firstName,
      lastName: insertUser.lastName,
      dateOfBirth: insertUser.dateOfBirth,
      country: insertUser.country,
      emailVerified: false,
    }).returning();
    return result[0];
  }

  async createEmailVerification(email: string, code: string): Promise<void> {
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    await db.insert(emailVerifications).values({
      email,
      code,
      expiresAt,
      attempts: 0,
    }).onConflictDoUpdate({
      target: emailVerifications.email,
      set: { code, expiresAt, attempts: 0 }
    });
  }

  async getEmailVerification(email: string): Promise<{ email: string; code: string; expiresAt: Date; attempts: number } | undefined> {
    const result = await db.select().from(emailVerifications).where(eq(emailVerifications.email, email)).limit(1);
    return result[0];
  }

  async verifyEmail(email: string, code: string): Promise<boolean> {
    const verification = await this.getEmailVerification(email);
    if (!verification) return false;
    if (verification.code !== code) {
      await this.incrementVerificationAttempts(email);
      return false;
    }
    if (new Date() > verification.expiresAt) return false;
    await this.markEmailAsVerified(email);
    await this.deleteEmailVerification(email);
    return true;
  }

  async markEmailAsVerified(email: string): Promise<void> {
    await db.update(users).set({ emailVerified: true }).where(eq(users.email, email));
  }

  async incrementVerificationAttempts(email: string): Promise<void> {
    const verification = await this.getEmailVerification(email);
    if (verification) {
      await db.update(emailVerifications)
        .set({ attempts: verification.attempts + 1 })
        .where(eq(emailVerifications.email, email));
    }
  }

  async deleteEmailVerification(email: string): Promise<void> {
    await db.delete(emailVerifications).where(eq(emailVerifications.email, email));
  }

  async createPasswordReset(email: string, code: string): Promise<void> {
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    await db.insert(passwordResets).values({
      email,
      code,
      expiresAt,
      attempts: 0,
    }).onConflictDoUpdate({
      target: passwordResets.email,
      set: { code, expiresAt, attempts: 0 }
    });
  }

  async getPasswordReset(email: string): Promise<{ email: string; code: string; expiresAt: Date; attempts: number } | undefined> {
    const result = await db.select().from(passwordResets).where(eq(passwordResets.email, email)).limit(1);
    return result[0];
  }

  async verifyPasswordReset(email: string, code: string): Promise<boolean> {
    const reset = await this.getPasswordReset(email);
    if (!reset) return false;
    if (reset.code !== code) {
      await this.incrementPasswordResetAttempts(email);
      return false;
    }
    if (new Date() > reset.expiresAt) return false;
    await this.deletePasswordReset(email);
    return true;
  }

  async incrementPasswordResetAttempts(email: string): Promise<void> {
    const reset = await this.getPasswordReset(email);
    if (reset) {
      await db.update(passwordResets)
        .set({ attempts: reset.attempts + 1 })
        .where(eq(passwordResets.email, email));
    }
  }

  async deletePasswordReset(email: string): Promise<void> {
    await db.delete(passwordResets).where(eq(passwordResets.email, email));
  }

  async updateUserPassword(email: string, hashedPassword: string): Promise<void> {
    await db.update(users).set({ password: hashedPassword }).where(eq(users.email, email));
  }
}

export const storage = new DrizzleStorage();
