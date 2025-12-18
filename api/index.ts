export default async function (_req: any, res: any) {
  res.setHeader("Content-Type", "application/json");
  res.status(200).end(JSON.stringify({
    ok: true,
    message: "API is ready",
    endpoints: {
      health: "/api/health",
      diag: "/api/diag",
      auth: {
        signup: "POST /api/auth/signup (requires proToken)",
        verifyCode: "POST /api/auth/verify-code",
        forgotPassword: "POST /api/auth/forgot-password",
        resetPassword: "POST /api/auth/reset-password"
      },
      pro: {
        createCheckout: "POST /api/pro/create-checkout",
        confirm: "POST /api/pro/confirm"
      }
    },
    timestamp: new Date().toISOString()
  }));
}
