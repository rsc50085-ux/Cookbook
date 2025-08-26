const API = process.env.NEXT_PUBLIC_API_URL!;
function resolveUrl(path: string): string {
  return path.startsWith("/api/") ? path : `${API}${path}`;
}
export async function apiGet<T>(path: string, token?: string): Promise<T> {
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const r = await fetch(resolveUrl(path), { headers });
  const ct = r.headers.get("content-type") || "";
  const body = ct.includes("application/json") ? await r.json().catch(() => ({})) : await r.text();
  if (!r.ok) throw new Error(typeof body === "string" && body ? body : r.statusText);
  return body as T;
}
export async function apiPost<T>(path: string, body: any, token?: string): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const r = await fetch(resolveUrl(path), { method: "POST", headers, body: JSON.stringify(body) });
  const ct = r.headers.get("content-type") || "";
  const resp = ct.includes("application/json") ? await r.json().catch(() => ({})) : await r.text();
  if (!r.ok) throw new Error(typeof resp === "string" && resp ? resp : r.statusText);
  return resp as T;
}

export async function apiPut<T>(path: string, body: any, token?: string): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const r = await fetch(resolveUrl(path), { method: "PUT", headers, body: JSON.stringify(body) });
  const ct = r.headers.get("content-type") || "";
  const resp = ct.includes("application/json") ? await r.json().catch(() => ({})) : await r.text();
  if (!r.ok) throw new Error(typeof resp === "string" && resp ? resp : r.statusText);
  return resp as T;
}

export async function apiDelete<T>(path: string, token?: string): Promise<T> {
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const r = await fetch(resolveUrl(path), { method: "DELETE", headers });
  const ct = r.headers.get("content-type") || "";
  const resp = ct.includes("application/json") ? await r.json().catch(() => ({})) : await r.text();
  if (!r.ok) throw new Error(typeof resp === "string" && resp ? resp : r.statusText);
  return resp as T;
}


