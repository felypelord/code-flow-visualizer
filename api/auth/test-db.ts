import postgres from "postgres";

export default async function (req: any, res: any) {
  res.setHeader("Content-Type", "application/json");

  try {
    if (!process.env.DATABASE_URL) {
      res.status(500).end(JSON.stringify({
        ok: false,
        error: "DATABASE_URL not configured"
      }));
      return;
    }

    console.log("[DEBUG] DATABASE_URL exists, creating connection...");

    const client = postgres(process.env.DATABASE_URL, {
      ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
    });

    console.log("[DEBUG] Executing test query...");
    const result = await client`SELECT NOW()`;

    console.log("[DEBUG] Query successful:", result);

    await client.end();

    res.status(200).end(JSON.stringify({
      ok: true,
      message: "Database connection works!",
      result: result
    }));
  } catch (err: any) {
    console.error("[DEBUG ERROR]", err);
    res.status(500).end(JSON.stringify({
      ok: false,
      error: err?.message || String(err),
      stack: err?.stack
    }));
  }
}
