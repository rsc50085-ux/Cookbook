import type { NextApiRequest, NextApiResponse } from "next";
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(501).json({ error: "Auth route is configured in production" });
}


