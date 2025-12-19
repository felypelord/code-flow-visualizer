import { z } from "zod";
import postgres from "postgres";

const payloadSchema = z.object({
  email: z.string().email(),
  code: z.string().min(4).max(8),
});

export default async function (req: any, res: any) {
  res.setHeader("Content-Type", "application/json");

  if (req.method !== "POST") {
    res.statusCode = 400;
    res.end(JSON.stringify({ ok: false, error: "POST only" }));
    return;
  }

  if (!process.env.DATABASE_URL) {
    res.statusCode = 503;
    res.end(JSON.stringify({ ok: false, error: "DATABASE_URL not configured" }));
    return;
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    const parsed = payloadSchema.safeParse(body);
    if (!parsed.success) {
      res.statusCode = 400;
      res.end(JSON.stringify({ ok: false, error: "invalid payload" }));
      return;
    }

    const { email, code } = parsed.data;
    const client = postgres(process.env.DATABASE_URL, {
      ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
    });

    const rows = await client`
      SELECT code, expires_at, attempts
      FROM email_verifications
      WHERE email = ${email}
      LIMIT 1
    `;

    if (!rows.length) {
      await client.end();
      res.statusCode = 404;
      res.end(JSON.stringify({ ok: false, error: "no code requested" }));
      return;
    }

    const rec = rows[0] as { code: string; expires_at: Date; attempts: number };
    const now = new Date();
    
    // Check max attempts (prevent brute force)
    if (rec.attempts >= 5) {
      await client`DELETE FROM email_verifications WHERE email = ${email}`;
      await client.end();
      res.statusCode = 429;
      res.end(JSON.stringify({ ok: false, error: "too many attempts" }));
      return;
    }
    
    if (new Date(rec.expires_at).getTime() < now.getTime()) {
      await client.end();
      res.statusCode = 400;
      res.end(JSON.stringify({ ok: false, error: "expired" }));
      return;
    }

    if (String(rec.code) !== String(code)) {
      await client`
        UPDATE email_verifications SET attempts = attempts + 1 WHERE email = ${email}
      `;
      await client.end();
      res.statusCode = 400;
      res.end(JSON.stringify({ ok: false, error: "invalid" }));
      return;
    }

    await client`
      UPDATE email_verifications SET attempts = 0 WHERE email = ${email}
    `;
    await client.end();
    res.statusCode = 200;
    res.end(JSON.stringify({ ok: true }));
  } catch (err: any) {
    console.error("[ERROR] /api/auth/validate-code:", err);
    res.statusCode = 500;
    res.end(JSON.stringify({ ok: false, error: err?.message || String(err) }));
  }
}
