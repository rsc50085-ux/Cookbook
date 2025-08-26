import type { NextApiRequest, NextApiResponse } from "next";
import { withApiAuthRequired, getAccessToken } from "@auth0/nextjs-auth0";

// Prefer server-only API_URL; fall back to browser URL for local dev
const API = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL!;
const AUDIENCE = process.env.AUTH0_AUDIENCE || "https://api.cookbook";

async function getToken(req: NextApiRequest, res: NextApiResponse): Promise<string | undefined> {
  try {
    const { accessToken } = await (getAccessToken as any)(req as any, res as any, { audience: AUDIENCE } as any);
    return accessToken as string;
  } catch {
    try {
      const { accessToken } = await (getAccessToken as any)(req as any, res as any);
      return accessToken as string;
    } catch {
      return undefined;
    }
  }
}

export default withApiAuthRequired(async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id } = req.query as { id: string };
    const accessToken = await getToken(req, res);
    const headers: Record<string, string> = {};
    if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;
    
    if (req.method === "GET") {
      const r = await fetch(`${API}/recipes/${id}`, { headers });
      const ct = r.headers.get("content-type") || "";
      const body = ct.includes("application/json") ? await r.json().catch(()=>({})) : await r.text();
      if (!r.ok) return res.status(r.status).send(body);
      return ct.includes("application/json") ? res.status(200).json(body) : res.status(200).send(body as any);
    }
    
    if (req.method === "PUT") {
      headers["Content-Type"] = "application/json";
      const r = await fetch(`${API}/recipes/${id}`, { 
        method: "PUT", 
        headers, 
        body: JSON.stringify(req.body || {}) 
      });
      const ct = r.headers.get("content-type") || "";
      const body = ct.includes("application/json") ? await r.json().catch(()=>({})) : await r.text();
      if (!r.ok) return res.status(r.status).send(body);
      return ct.includes("application/json") ? res.status(200).json(body) : res.status(200).send(body as any);
    }
    
    if (req.method === "DELETE") {
      const r = await fetch(`${API}/recipes/${id}`, { 
        method: "DELETE", 
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const ct = r.headers.get("content-type") || "";
      const body = ct.includes("application/json") ? await r.json().catch(()=>({})) : await r.text();
      if (!r.ok) return res.status(r.status).send(body);
      return ct.includes("application/json") ? res.status(200).json(body) : res.status(200).send(body as any);
    }
    
    res.setHeader("Allow", "GET, PUT, DELETE");
    return res.status(405).end("Method Not Allowed");
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || "proxy_failed" });
  }
});


