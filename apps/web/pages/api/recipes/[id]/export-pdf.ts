import type { NextApiRequest, NextApiResponse } from "next";
import { withApiAuthRequired, getAccessToken } from "@auth0/nextjs-auth0";

const API = process.env.NEXT_PUBLIC_API_URL!;
const AUDIENCE = process.env.AUTH0_AUDIENCE || "https://api.cookbook";

export default withApiAuthRequired(async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id } = req.query as { id: string };
    const { accessToken } = await (getAccessToken as any)(req as any, res as any, { audience: AUDIENCE } as any);
    const r = await fetch(`${API}/recipes/${id}/export-pdf`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify(req.body || {}),
    });
    const data = await r.json();
    if (!r.ok) return res.status(r.status).send(data);
    return res.status(200).json(data);
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || "proxy_failed" });
  }
});


