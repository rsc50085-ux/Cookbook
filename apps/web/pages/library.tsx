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
  const [prepMinutes, setPrepMinutes] = useState<number | "">("");
  const [cookMinutes, setCookMinutes] = useState<number | "">("");
  const [cuisine, setCuisine] = useState("");
  const [mealType, setMealType] = useState("");
  const [tags, setTags] = useState("");
  const [notes, setNotes] = useState("");
  const [ingredientsText, setIngredientsText] = useState("");
  const [instructionsText, setInstructionsText] = useState("");
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
        <div style={{ border:"1px solid #ccc", padding:12, maxWidth:720 }}>
          <div style={{ marginBottom:8 }}>Title <input value={title} onChange={e=>setTitle(e.target.value)} style={{width:300}} /></div>
          <div style={{ marginBottom:8 }}>Servings <input type="number" value={servings} onChange={e=>setServings(parseInt(e.target.value||"1",10))} style={{width:100}} /></div>
          <div style={{ marginBottom:8 }}>Prep minutes <input type="number" value={prepMinutes as any} onChange={e=>setPrepMinutes(e.target.value===""?"":parseInt(e.target.value,10))} style={{width:120}} />
            &nbsp; Cook minutes <input type="number" value={cookMinutes as any} onChange={e=>setCookMinutes(e.target.value===""?"":parseInt(e.target.value,10))} style={{width:120}} />
          </div>
          <div style={{ marginBottom:8 }}>Cuisine <input value={cuisine} onChange={e=>setCuisine(e.target.value)} style={{width:200}} />
            &nbsp; Meal type <input value={mealType} onChange={e=>setMealType(e.target.value)} placeholder="main, dessert…" style={{width:200}} />
          </div>
          <div style={{ marginBottom:8 }}>Dietary tags <input value={tags} onChange={e=>setTags(e.target.value)} placeholder="comma-separated, e.g. vegetarian,gluten-free" style={{width:420}} /></div>
          <div style={{ marginBottom:8 }}>Ingredients (one per line)
            <br/>
            <textarea value={ingredientsText} onChange={e=>setIngredientsText(e.target.value)} rows={6} cols={80} placeholder="2 cups flour\n1 tsp salt" />
          </div>
          <div style={{ marginBottom:8 }}>Instructions (one step per line)
            <br/>
            <textarea value={instructionsText} onChange={e=>setInstructionsText(e.target.value)} rows={6} cols={80} placeholder="Preheat oven to 180C\nMix dry ingredients" />
          </div>
          <div style={{ marginBottom:8 }}>Notes
            <br/>
            <textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={3} cols={80} />
          </div>
          <button onClick={async ()=>{
            try{
              const payload: any = {
                title,
                servings,
                prep_minutes: prepMinutes === "" ? undefined : prepMinutes,
                cook_minutes: cookMinutes === "" ? undefined : cookMinutes,
                cuisine: cuisine || undefined,
                meal_type: mealType || undefined,
                dietary_tags: tags.split(',').map(t=>t.trim()).filter(Boolean),
                ingredients: ingredientsText.split('\n').map(l=>l.trim()).filter(Boolean),
                instructions: instructionsText.split('\n').map(l=>l.trim()).filter(Boolean),
                notes: notes || undefined,
              };
              const created = await apiPost<Recipe>("/api/recipes", payload);
              setRecipes([created, ...recipes]);
              setCreating(false);
              setTitle(""); setServings(2); setPrepMinutes(""); setCookMinutes(""); setCuisine(""); setMealType(""); setTags(""); setNotes(""); setIngredientsText(""); setInstructionsText("");
            }catch(err){ console.error(err); alert("Failed to create"); }
          }}>Save</button>
        </div>
      )}
      <ul>{recipes.filter(r=>r.title.toLowerCase().includes(q.toLowerCase())).map(r => (<li key={r.id}><a href={`/recipe/${r.id}`}>{r.title}</a></li>))}</ul>
    </main>
  );
}


