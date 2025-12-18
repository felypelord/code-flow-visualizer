import jwt from "jsonwebtoken";
import postgres from "postgres";

type Req = { method: string; headers: Record<string,string | undefined> };
type Res = { setHeader: (k:string,v:string)=>void; statusCode: number; end: (b?:string)=>void };

export default async function (req: Req, res: Res) {
  res.setHeader("Content-Type", "application/json");

  if (req.method !== "GET") {
    res.statusCode = 400;
    res.end(JSON.stringify({ ok: false, error: "GET only" }));
    return;
  }

  const auth = req.headers["authorization"] || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) {
    res.statusCode = 401;
    res.end(JSON.stringify({ ok: false, error: "Missing authorization token" }));
    return;
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    res.statusCode = 500;
    res.end(JSON.stringify({ ok: false, error: "JWT_SECRET not configured" }));
    return;
  }

  if (!process.env.DATABASE_URL) {
    res.statusCode = 503;
    res.end(JSON.stringify({ ok: false, error: "DATABASE_URL not configured" }));
    return;
  }

  try {
    const decoded = jwt.verify(token, jwtSecret) as { userId: string };
    const userId = decoded.userId;

    const client = postgres(process.env.DATABASE_URL, {
      ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
    });

    try {
      const users = await client`
        SELECT id, email, first_name, last_name, is_admin, is_pro, pro_expires_at, email_verified
        FROM users WHERE id = ${userId} LIMIT 1
      `;
      if (users.length === 0) {
        res.statusCode = 404;
        res.end(JSON.stringify({ ok: false, error: "User not found" }));
        await client.end();
        return;
      }

      const user = users[0] as any;
      res.statusCode = 200;
      res.end(JSON.stringify({
        ok: true,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          isAdmin: user.is_admin,
          isPro: user.is_pro,
          proExpiresAt: user.pro_expires_at,
          emailVerified: user.email_verified,
        },
      }));
    } finally {
      await client.end();
    }
  } catch (err: any) {
    console.error("[ERROR] /api/auth/me:", err?.message || err);
    res.statusCode = 401;
    res.end(JSON.stringify({ ok: false, error: "Invalid or expired token" }));
  }
}
