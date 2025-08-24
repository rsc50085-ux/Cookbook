import type { NextApiRequest, NextApiResponse } from "next";
import { withApiAuthRequired, getAccessToken } from "@auth0/nextjs-auth0";

const API = process.env.NEXT_PUBLIC_API_URL!;
const AUDIENCE = process.env.AUTH0_AUDIENCE || "https://api.cookbook";

export default withApiAuthRequired(async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { accessToken } = await (getAccessToken as any)(req as any, res as any, { audience: AUDIENCE } as any);
    if (req.method === "GET") {
      const r = await fetch(`${API}/recipes`, { headers: { Authorization: `Bearer ${accessToken}` } });
      const data = await r.json();
      if (!r.ok) return res.status(r.status).send(data);
      return res.status(200).json(data);
    }
    if (req.method === "POST") {
      const r = await fetch(`${API}/recipes`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify(req.body || {}),
      });
      const data = await r.json();
      if (!r.ok) return res.status(r.status).send(data);
      return res.status(200).json(data);
    }
    res.setHeader("Allow", "GET, POST");
    return res.status(405).end("Method Not Allowed");
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || "proxy_failed" });
  }
});


