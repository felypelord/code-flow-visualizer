export default async function (req: any, res: any) {
  res.setHeader("Content-Type", "application/json");

  try {
    const body = req.body || {};
    
    res.status(200).end(JSON.stringify({
      ok: true,
      received: body,
      nodeEnv: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    }));
  } catch (err: any) {
    res.status(500).end(JSON.stringify({
      ok: false,
      error: err?.message || String(err)
    }));
  }
}
