const API = process.env.NEXT_PUBLIC_API_URL!;
export async function apiGet<T>(path: string, token?: string): Promise<T> {
  const r = await fetch(`${API}${path}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}
export async function apiPost<T>(path: string, body: any, token: string): Promise<T> {
  const r = await fetch(`${API}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}


