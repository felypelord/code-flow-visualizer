import bcrypt from "bcryptjs";
import postgres from "postgres";

const dbUrl = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/codeflow";
const sql = postgres(dbUrl, {
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

const targetUser = {
  email: process.env.SEED_USER_EMAIL || "test@example.com",
  password: process.env.SEED_USER_PASSWORD || "Test12345",
  firstName: process.env.SEED_USER_FIRSTNAME || "Test",
  lastName: process.env.SEED_USER_LASTNAME || "User",
  country: process.env.SEED_USER_COUNTRY || "Brazil",
  dateOfBirth: new Date(process.env.SEED_USER_DOB || "1990-01-01T00:00:00Z"),
};

async function main() {
  try {
    const hashed = await bcrypt.hash(targetUser.password, 10);
    const proExpiresAt = new Date("2030-12-31T00:00:00Z");

    const existing = await sql<{ id: string }[]>`
      SELECT id FROM users WHERE email = ${targetUser.email} LIMIT 1
    `;

    if (existing.length > 0) {
      await sql`
        UPDATE users
        SET password = ${hashed},
            first_name = ${targetUser.firstName},
            last_name = ${targetUser.lastName},
            country = ${targetUser.country},
            date_of_birth = ${targetUser.dateOfBirth},
            email_verified = true,
            is_pro = true,
            pro_expires_at = ${proExpiresAt}
        WHERE email = ${targetUser.email}
      `;
      console.log("Updated existing user to Pro", { email: targetUser.email });
    } else {
      await sql`
        INSERT INTO users (email, password, first_name, last_name, country, date_of_birth, email_verified, is_pro, pro_expires_at)
        VALUES (${targetUser.email}, ${hashed}, ${targetUser.firstName}, ${targetUser.lastName}, ${targetUser.country}, ${targetUser.dateOfBirth}, true, true, ${proExpiresAt})
      `;
      console.log("Created Pro user", { email: targetUser.email });
    }
  } catch (err: any) {
    console.error("Failed to seed Pro user:", err?.message || err);
    process.exitCode = 1;
  } finally {
    await sql.end();
  }
}

main();
