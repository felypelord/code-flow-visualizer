import postgres from "postgres";
import crypto from "crypto";

type Req = { method: string; headers: Record<string,string | undefined>; body?: any };
type Res = { setHeader: (k:string,v:string)=>void; statusCode: number; end: (b?:string)=>void };

export default async function (req: Req, res: Res) {
  res.setHeader("Content-Type", "application/json");

  if (req.method !== "POST") {
    res.statusCode = 400;
    res.end(JSON.stringify({ ok: false, error: "POST only" }));
    return;
  }

  const adminToken = process.env.ADMIN_API_TOKEN || "";
  const auth = req.headers["authorization"] || "";
  const provided = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!adminToken || provided !== adminToken) {
    res.statusCode = 403;
    res.end(JSON.stringify({ ok: false, error: "Forbidden" }));
    return;
  }

  if (!process.env.DATABASE_URL) {
    res.statusCode = 503;
    res.end(JSON.stringify({ ok: false, error: "DATABASE_URL not configured" }));
    return;
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    const email = String(body.email || "").trim();
    const status = (body.status as string) || "granted"; // 'granted' | 'paid'
    const token = (body.token as string) || crypto.randomBytes(16).toString("hex");
    if (!email) {
      res.statusCode = 400;
      res.end(JSON.stringify({ ok: false, error: "email is required" }));
      return;
    }

    const client = postgres(process.env.DATABASE_URL!, {
      ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
    });
    try {
      await client`
        INSERT INTO pro_signup_entitlements (email, token, status)
        VALUES (${email}, ${token}, ${status})
        ON CONFLICT (token) DO NOTHING
      `;
    } finally {
      await client.end();
    }

    res.statusCode = 200;
    res.end(JSON.stringify({ ok: true, email, token, status }));
  } catch (err: any) {
    console.error("[ERROR] /api/pro/grant:", err);
    res.statusCode = 500;
    res.end(JSON.stringify({ ok: false, error: err?.message || String(err) }));
  }
}
