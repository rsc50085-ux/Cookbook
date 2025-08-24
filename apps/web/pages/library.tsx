import { useEffect, useState } from "react";
import { useUser } from "@auth0/nextjs-auth0/client";
import { apiGet, apiPost } from "../lib/api";

type Recipe = { id: string; title: string; servings: number };

export default function Library() {
  const { user, isLoading } = useUser();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [q, setQ] = useState("");
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [servings, setServings] = useState(2);
  useEffect(() => {
    if (!user) return;
    (async () => {
      const data = await apiGet<Recipe[]>("/api/recipes");
      setRecipes(data);
    })().catch(console.error);
  }, [user]);
  if (isLoading) return <p>Loading…</p>;
  if (!user) return <p>Please <a href="/api/auth/login">log in</a>.</p>;
  return (
    <main style={{ padding: 24 }}>
      <h2>Your Recipes</h2>
      <div style={{ margin: "12px 0" }}>
        <input placeholder="Search title…" value={q} onChange={e=>setQ(e.target.value)} />
        <button onClick={()=>setCreating(s=>!s)} style={{ marginLeft: 8 }}>{creating?"Close":"Add Recipe"}</button>
      </div>
      {creating && (
        <div style={{ border:"1px solid #ccc", padding:12, maxWidth:420 }}>
          <div>Title <input value={title} onChange={e=>setTitle(e.target.value)} /></div>
          <div>Servings <input type="number" value={servings} onChange={e=>setServings(parseInt(e.target.value||"1",10))} /></div>
          <button onClick={async ()=>{
            try{
              const created = await apiPost<Recipe>("/api/recipes", { title, servings });
              setRecipes([created, ...recipes]); setCreating(false); setTitle(""); setServings(2);
            }catch(err){ console.error(err); alert("Failed to create"); }
          }}>Save</button>
        </div>
      )}
      <ul>{recipes.filter(r=>r.title.toLowerCase().includes(q.toLowerCase())).map(r => (<li key={r.id}><a href={`/recipe/${r.id}`}>{r.title}</a></li>))}</ul>
    </main>
  );
}


