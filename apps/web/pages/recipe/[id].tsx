import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useUser, getAccessToken } from "@auth0/nextjs-auth0";
import { apiGet, apiPost } from "../../lib/api";

export default function RecipeView() {
  const { query } = useRouter();
  const { user } = useUser();
  const [r, setR] = useState<any>(null);
  const id = query.id as string;

  useEffect(() => {
    if (!id) return;
    (async () => {
      const token = (await (getAccessToken() as any))?.accessToken;
      const data = await apiGet<any>(`/recipes/${id}`, token);
      setR(data);
    })().catch(console.error);
  }, [id]);

  if (!r) return <p>Loading…</p>;
  return (
    <main style={{ padding: 24 }}>
      <h2>{r.title}</h2>
      <p>Servings: {r.servings}</p>
      <h3>Ingredients</h3>
      <pre>{JSON.stringify(r.ingredients, null, 2)}</pre>
      <h3>Instructions</h3>
      <ol>{(r.instructions ?? []).map((s:string,i:number)=><li key={i}>{s}</li>)}</ol>
      {user && <button onClick={async ()=>{
        const token = (await (getAccessToken() as any))?.accessToken;
        const out = await apiPost<{url:string}>(`/recipes/${id}/export-pdf`, { style: "minimal" }, token);
        window.open(out.url, "_blank");
      }}>Export PDF</button>}
    </main>
  );
}


