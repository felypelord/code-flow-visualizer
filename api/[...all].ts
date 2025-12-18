import type { VercelRequest, VercelResponse } from "@vercel/node";
import serverlessHttp from "serverless-http";
import { buildApp } from "../server/app";

let handler: ((req: VercelRequest, res: VercelResponse) => Promise<void>) | null = null;

export default async function (req: VercelRequest, res: VercelResponse) {
  if (!handler) {
    const app = await buildApp();
    handler = serverlessHttp(app) as any;
  }
  return handler!(req, res);
}
