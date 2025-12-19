import jwt from "jsonwebtoken";
import postgres from "postgres";

export default async function (req: any, res: any) {
  res.setHeader("Content-Type", "application/json");

  if (req.method !== "GET") {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: "GET only" }));
    return;
  }

  const auth = req.headers?.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token || !process.env.JWT_SECRET) {
    res.statusCode = 401;
    res.end(JSON.stringify({ error: "unauthorized" }));
    return;
  }

  let email: string | null = null;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as any;
    email = decoded?.email || null;
  } catch (err) {
    res.statusCode = 401;
    res.end(JSON.stringify({ error: "invalid token" }));
    return;
  }

  if (!email) {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: "email missing" }));
    return;
  }

  if (!process.env.DATABASE_URL) {
    res.statusCode = 503;
    res.end(JSON.stringify({ error: "database not configured" }));
    return;
  }

  const sql = postgres(process.env.DATABASE_URL, {
    ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
  });

  try {
    await sql`
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

    const rows = await sql<{ receipt_url: string | null }[]>`
      SELECT receipt_url FROM pro_transactions
      WHERE email = ${email}
      AND receipt_url IS NOT NULL
      ORDER BY created_at DESC
      LIMIT 1
    `;

    const receiptUrl = rows[0]?.receipt_url || null;
    res.statusCode = 200;
    res.end(JSON.stringify({ receiptUrl }));
  } catch (err: any) {
    console.error("[ERROR] /api/pro/receipt", err?.message || err);
    res.statusCode = 500;
    res.end(JSON.stringify({ error: "failed" }));
  } finally {
    await sql.end();
  }
}
