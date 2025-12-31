declare module './pro/create-checkout' {
  import type { Request, Response } from 'express';
  const _default: (req: Request | any, res: Response | any) => Promise<any> | any;
  export default _default;
}

declare module './monetization/index' {
  import type { Request, Response } from 'express';
  export function stripeWebhook(req: Request | any, res: Response | any): Promise<any> | any;
  export function confirmPurchase(req: Request | any, res: Response | any): Promise<any> | any;
  const _default: any;
  export default _default;
}
