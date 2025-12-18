export default async function (req: any, res: any) {
  res.setHeader("Content-Type", "application/json");

  try {
    const { email } = req.body || {};
    if (!email) {
      res.status(400).end(JSON.stringify({ error: "email required" }));
      return;
    }

    // Test importing and calling storage without Express
    const { storage } = await import("../../server/storage");
    
    const existing = await storage.getUserByEmail(email);
    if (existing) {
      res.status(200).end(JSON.stringify({
        ok: false,
        message: "User exists",
        user: existing
      }));
      return;
    }

    res.status(200).end(JSON.stringify({
      ok: true,
      message: "User does not exist",
      email
    }));
  } catch (err: any) {
    res.status(500).end(JSON.stringify({
      ok: false,
      error: err?.message || String(err),
      stack: err?.stack
    }));
  }
}
