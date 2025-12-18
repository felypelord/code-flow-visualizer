import { Resend } from "resend";

export default async function (req: any, res: any) {
  const apiKey = process.env.RESEND_API_KEY || "";
  const fromEmail = process.env.RESEND_FROM_EMAIL || "noreply@example.com";
  const to = (req?.body?.to as string) || "felypexelepe@hotmail.com"; // default test recipient

  res.setHeader("Content-Type", "application/json");

  if (!apiKey) {
    res.status(200).end(JSON.stringify({ status: "no-key", apiKeyConfigured: false, fromEmail }));
    return;
  }

  try {
    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to,
      subject: "Resend Debug Test",
      html: "<h2>Resend is working!</h2><p>This is a debug test email.</p>",
    });

    if (error) {
      res.status(200).end(JSON.stringify({ status: "error", error, apiKeyConfigured: true, fromEmail }));
      return;
    }
    res.status(200).end(JSON.stringify({ status: "success", data, apiKeyConfigured: true, fromEmail }));
  } catch (err: any) {
    res.status(500).end(JSON.stringify({ status: "exception", error: err?.message || String(err), fromEmail }));
  }
}
