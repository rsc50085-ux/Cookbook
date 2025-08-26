import { useEffect, useState } from "react";
import { useUser } from "@auth0/nextjs-auth0/client";
import { apiGet, apiPost, apiPut } from "../lib/api";

type Recipe = { 
  id: string; 
  title: string; 
  servings: number;
  prep_minutes?: number;
  cook_minutes?: number;
  cuisine?: string;
  meal_type?: string;
  dietary_tags: string[];
  notes?: string;
  photo_url?: string;
  ingredients: string[];
  instructions: string[];
};

const MEAL_TYPES = ["Appetizer", "Main Course", "Dessert", "Side Dish", "Drink", "Other"];
const CUISINES = ["Italian", "Chinese", "Mexican", "Indian", "French", "Thai", "Japanese", "Mediterranean", "American", "Middle Eastern", "Other"];

export default function Library() {
  const { user, isLoading } = useUser();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchCuisine, setSearchCuisine] = useState("");
  const [searchMealType, setSearchMealType] = useState("");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [servings, setServings] = useState(2);
  const [prepMinutes, setPrepMinutes] = useState<number | "">("");
  const [cookMinutes, setCookMinutes] = useState<number | "">("");
  const [cuisine, setCuisine] = useState("");
  const [mealType, setMealType] = useState("");
  const [tags, setTags] = useState("");
  const [notes, setNotes] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [ingredientsText, setIngredientsText] = useState("");
  const [instructionsText, setInstructionsText] = useState("");
  const resetForm = () => {
    setTitle(""); setServings(2); setPrepMinutes(""); setCookMinutes(""); 
    setCuisine(""); setMealType(""); setTags(""); setNotes(""); setPhotoUrl("");
    setPhotoFile(null); setIngredientsText(""); setInstructionsText("");
  };

  const resetSearch = () => {
    setSearchQuery("");
    setSearchCuisine("");
    setSearchMealType("");
  };

  const filterRecipes = (recipes: Recipe[]) => {
    return recipes.filter(recipe => {
      const query = searchQuery.toLowerCase();
      const cuisine = searchCuisine.toLowerCase();
      const mealType = searchMealType.toLowerCase();

      // Search in title
      const titleMatch = !query || recipe.title.toLowerCase().includes(query);
      
      // Search in cuisine
      const cuisineMatch = !searchCuisine || (recipe.cuisine && recipe.cuisine.toLowerCase().includes(cuisine));
      
      // Search in meal type
      const mealTypeMatch = !searchMealType || (recipe.meal_type && recipe.meal_type.toLowerCase().includes(mealType));
      
      // Search in ingredients
      const ingredientsMatch = !query || (recipe.ingredients && recipe.ingredients.some(ing => 
        ing.toLowerCase().includes(query)
      ));
      
      // Search in dietary tags
      const tagsMatch = !query || (recipe.dietary_tags && recipe.dietary_tags.some(tag => 
        tag.toLowerCase().includes(query)
      ));
      
      // Search in notes
      const notesMatch = !query || (recipe.notes && recipe.notes.toLowerCase().includes(query));

      // For text search, match title, ingredients, tags, or notes
      const textMatch = !query || titleMatch || ingredientsMatch || tagsMatch || notesMatch;
      
      return textMatch && cuisineMatch && mealTypeMatch;
    });
  };

  const uploadPhoto = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    
    const response = await fetch("/api/upload-photo", {
      method: "POST",
      body: formData,
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(error);
    }
    
    const data = await response.json();
    return data.photo_url;
  };

  const loadRecipe = (recipe: Recipe) => {
    setTitle(recipe.title);
    setServings(recipe.servings);
    setPrepMinutes(recipe.prep_minutes || "");
    setCookMinutes(recipe.cook_minutes || "");
    setCuisine(recipe.cuisine || "");
    setMealType(recipe.meal_type || "");
    setTags((recipe.dietary_tags || []).join(", "));
    setNotes(recipe.notes || "");
    setPhotoUrl(recipe.photo_url || "");
    setIngredientsText((recipe.ingredients || []).join("\n"));
    setInstructionsText((recipe.instructions || []).join("\n"));
  };

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
      <div style={{ margin: "16px 0", padding: "16px", border: "1px solid #ddd", borderRadius: "8px", backgroundColor: "#f9f9f9" }}>
        <h3 style={{ margin: "0 0 12px 0", fontSize: "18px" }}>Search & Filter Recipes</h3>
        
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center", marginBottom: "12px" }}>
          <div>
            <label style={{ fontSize: "14px", fontWeight: "bold", marginRight: "6px" }}>Search:</label>
            <input 
              placeholder="Recipe name, ingredients, tags..." 
              value={searchQuery} 
              onChange={e=>setSearchQuery(e.target.value)} 
              style={{ width: "250px", padding: "6px" }}
            />
          </div>
          
          <div>
            <label style={{ fontSize: "14px", fontWeight: "bold", marginRight: "6px" }}>Cuisine:</label>
            <select 
              value={searchCuisine} 
              onChange={e=>setSearchCuisine(e.target.value)} 
              style={{ padding: "6px", width: "140px" }}
            >
              <option value="">All Cuisines</option>
              {CUISINES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          
          <div>
            <label style={{ fontSize: "14px", fontWeight: "bold", marginRight: "6px" }}>Meal Type:</label>
            <select 
              value={searchMealType} 
              onChange={e=>setSearchMealType(e.target.value)} 
              style={{ padding: "6px", width: "140px" }}
            >
              <option value="">All Types</option>
              {MEAL_TYPES.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          
          <button 
            onClick={resetSearch}
            style={{ padding: "6px 12px", backgroundColor: "#f0f0f0", border: "1px solid #ccc", borderRadius: "4px", cursor: "pointer" }}
          >
            Clear Filters
          </button>
        </div>
        
        <div style={{ fontSize: "14px", color: "#666" }}>
          Showing {filterRecipes(recipes).length} of {recipes.length} recipes
        </div>
      </div>

      <div style={{ margin: "12px 0" }}>
        <button 
          onClick={()=>{
            setCreating(s=>!s);
            setEditing(null);
            resetForm();
          }} 
          style={{ padding: "8px 16px", backgroundColor: "#007bff", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "16px" }}
        >
          {creating?"Close":"+ Add New Recipe"}
        </button>
      </div>
      {(creating || editing) && (
        <div style={{ border:"1px solid #ccc", padding:12, maxWidth:720 }}>
          <h3>{editing ? "Edit Recipe" : "Add New Recipe"}</h3>
          <div style={{ marginBottom:8 }}>Title <input value={title} onChange={e=>setTitle(e.target.value)} style={{width:300}} /></div>
          <div style={{ marginBottom:8 }}>Servings <input type="number" value={servings} onChange={e=>setServings(parseInt(e.target.value||"1",10))} style={{width:100}} /></div>
          <div style={{ marginBottom:8 }}>Prep minutes <input type="number" value={prepMinutes as any} onChange={e=>setPrepMinutes(e.target.value===""?"":parseInt(e.target.value,10))} style={{width:120}} />
            &nbsp; Cook minutes <input type="number" value={cookMinutes as any} onChange={e=>setCookMinutes(e.target.value===""?"":parseInt(e.target.value,10))} style={{width:120}} />
          </div>
          <div style={{ marginBottom:8 }}>
            Cuisine 
            <select value={cuisine} onChange={e=>setCuisine(e.target.value)} style={{width:200, marginLeft:8}}>
              <option value="">Select cuisine...</option>
              {CUISINES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            &nbsp; Meal type 
            <select value={mealType} onChange={e=>setMealType(e.target.value)} style={{width:200, marginLeft:8}}>
              <option value="">Select meal type...</option>
              {MEAL_TYPES.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div style={{ marginBottom:8 }}>
            Recipe Photo 
            <input 
              type="file" 
              accept="image/*" 
              onChange={e => setPhotoFile(e.target.files?.[0] || null)} 
              style={{marginLeft:8}}
            />
            {photoFile && <span style={{color:"#666", fontSize:"0.9em", marginLeft:8}}>Selected: {photoFile.name}</span>}
            {photoUrl && !photoFile && <span style={{color:"#666", fontSize:"0.9em", marginLeft:8}}>Current photo will be kept</span>}
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
          <button 
            onClick={async ()=>{
              try{
                setUploading(true);
                console.log("Starting recipe save process...");
                
                // Upload photo if a new file is selected
                let finalPhotoUrl = photoUrl;
                if (photoFile) {
                  console.log("Uploading photo...");
                  finalPhotoUrl = await uploadPhoto(photoFile);
                  console.log("Photo uploaded successfully:", finalPhotoUrl);
                }
                
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
                  photo_url: finalPhotoUrl || undefined,
                };
                
                console.log("Recipe payload:", payload);
                
                if (editing) {
                  console.log("Updating recipe:", editing);
                  const updated = await apiPut<Recipe>(`/api/recipes/${editing}`, payload);
                  console.log("Recipe updated successfully:", updated);
                  setRecipes(recipes.map(r => r.id === editing ? updated : r));
                  setEditing(null);
                } else {
                  console.log("Creating new recipe...");
                  const created = await apiPost<Recipe>("/api/recipes", payload);
                  console.log("Recipe created successfully:", created);
                  setRecipes([created, ...recipes]);
                  setCreating(false);
                }
                resetForm();
                console.log("Recipe save process completed successfully");
              }catch(err){ 
                console.error("Recipe save error:", err); 
                alert(editing ? "Failed to update recipe" : "Failed to create recipe"); 
              } finally {
                setUploading(false);
              }
            }}
            disabled={uploading}
          >
            {uploading ? "Uploading..." : editing ? "Update" : "Save"}
          </button>
          
          {editing && (
            <button 
              onClick={()=>{
                setEditing(null);
                resetForm();
              }} 
              style={{marginLeft:8}}
            >
              Cancel
            </button>
          )}
        </div>
      )}
      <div style={{marginTop:20}}>
        {filterRecipes(recipes).length === 0 ? (
          <div style={{textAlign:"center", padding:"40px", color:"#666", fontSize:"16px"}}>
            {recipes.length === 0 ? (
              <div>
                <p>No recipes yet! Click "Add New Recipe" to get started.</p>
              </div>
            ) : (
              <div>
                <p>No recipes match your search criteria.</p>
                <p style={{fontSize:"14px"}}>Try adjusting your filters or search terms.</p>
              </div>
            )}
          </div>
        ) : (
          filterRecipes(recipes).map(r => (
            <div key={r.id} style={{border:"1px solid #eee", padding:12, marginBottom:12, maxWidth:720}}>
              <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
                <div>
                  <h4 style={{margin:"0 0 4px 0"}}>
                    <a href={`/recipe/${r.id}`} style={{textDecoration:"none", color:"#0066cc"}}>{r.title}</a>
                  </h4>
                  <div style={{fontSize:"0.9em", color:"#666"}}>
                    {r.servings} serving{r.servings !== 1 ? 's' : ''}
                    {r.prep_minutes && ` • ${r.prep_minutes}min prep`}
                    {r.cook_minutes && ` • ${r.cook_minutes}min cook`}
                    {r.cuisine && ` • ${r.cuisine}`}
                    {r.meal_type && ` • ${r.meal_type}`}
                  </div>
                  {r.dietary_tags && r.dietary_tags.length > 0 && (
                    <div style={{fontSize:"0.8em", color:"#888", marginTop:2}}>
                      Tags: {r.dietary_tags.join(", ")}
                    </div>
                  )}
                </div>
                <div>
                  {r.photo_url && (
                    <img 
                      src={r.photo_url} 
                      alt={r.title} 
                      style={{width:60, height:60, objectFit:"cover", borderRadius:4, marginRight:8}} 
                    />
                  )}
                  <button 
                    onClick={()=>{
                      setEditing(r.id);
                      setCreating(false);
                      loadRecipe(r);
                    }}
                    style={{fontSize:"0.8em", padding:"4px 8px"}}
                  >
                    Edit
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
}


