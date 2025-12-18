export default async function (_req: any, res: any) {
  res.setHeader("Content-Type", "application/json");
  res.status(200).end(JSON.stringify({ ok: true, status: "ok" }));
}
