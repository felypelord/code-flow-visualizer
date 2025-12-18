export default async function (req: any, res: any) {
  res.setHeader("Content-Type", "application/json");
  res.status(200).end(JSON.stringify({
    jwtSecretPresent: !!process.env.JWT_SECRET,
    resendApiKeyPresent: !!process.env.RESEND_API_KEY,
    resendFromEmail: process.env.RESEND_FROM_EMAIL || null,
    databaseUrlPresent: !!process.env.DATABASE_URL,
    nodeEnv: process.env.NODE_ENV || null,
  }));
}
