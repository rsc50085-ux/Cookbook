import { useEffect, useState } from "react";
import { useUser } from "@auth0/nextjs-auth0/client";
import { apiGet } from "../lib/api";

type Recipe = { id: string; title: string; servings: number };

export default function Library() {
  const { user, isLoading } = useUser();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  useEffect(() => {
    if (!user) return;
    (async () => {
      const data = await apiGet<Recipe[]>("/recipes");
      setRecipes(data);
    })().catch(console.error);
  }, [user]);
  if (isLoading) return <p>Loading…</p>;
  if (!user) return <p>Please <a href="/api/auth/login">log in</a>.</p>;
  return (
    <main style={{ padding: 24 }}>
      <h2>Your Recipes</h2>
      <ul>{recipes.map(r => (<li key={r.id}><a href={`/recipe/${r.id}`}>{r.title}</a></li>))}</ul>
    </main>
  );
}


