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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2 style={{ margin: 0 }}>Your Recipes</h2>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {user && (
            <span style={{ fontSize: "14px", color: "#666" }}>
              Welcome, {user.name || user.email}
            </span>
          )}
          <a 
            href="/api/auth/logout" 
            style={{ 
              padding: "6px 12px", 
              backgroundColor: "#dc3545", 
              color: "white", 
              textDecoration: "none", 
              borderRadius: "4px", 
              fontSize: "14px",
              border: "none",
              cursor: "pointer"
            }}
          >
            Logout
          </a>
        </div>
      </div>
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
            setCreating(true);
            setEditing(null);
            resetForm();
          }} 
          style={{ padding: "8px 16px", backgroundColor: "#007bff", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "16px" }}
        >
          + Add New Recipe
        </button>
      </div>
      {(creating || editing) && (
        <div 
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px"
          }}
          onClick={() => {
            setCreating(false);
            setEditing(null);
            resetForm();
          }}
        >
          <div 
            style={{
              backgroundColor: "white",
              borderRadius: "8px",
              padding: "24px",
              maxWidth: "800px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ margin: 0, fontSize: "24px" }}>{editing ? "Edit Recipe" : "Add New Recipe"}</h3>
              <button
                onClick={() => {
                  setCreating(false);
                  setEditing(null);
                  resetForm();
                }}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "24px",
                  cursor: "pointer",
                  color: "#666",
                  padding: "4px"
                }}
              >
                ×
              </button>
            </div>
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontWeight: "bold", marginBottom: "4px" }}>Title</label>
            <input 
              value={title} 
              onChange={e=>setTitle(e.target.value)} 
              style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }} 
            />
          </div>
          
          <div style={{ display: "flex", gap: "16px", marginBottom: "16px" }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", fontWeight: "bold", marginBottom: "4px" }}>Servings</label>
              <input 
                type="number" 
                value={servings} 
                onChange={e=>setServings(parseInt(e.target.value||"1",10))} 
                style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }} 
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", fontWeight: "bold", marginBottom: "4px" }}>Prep minutes</label>
              <input 
                type="number" 
                value={prepMinutes as any} 
                onChange={e=>setPrepMinutes(e.target.value===""?"":parseInt(e.target.value,10))} 
                style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }} 
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", fontWeight: "bold", marginBottom: "4px" }}>Cook minutes</label>
              <input 
                type="number" 
                value={cookMinutes as any} 
                onChange={e=>setCookMinutes(e.target.value===""?"":parseInt(e.target.value,10))} 
                style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }} 
              />
            </div>
          </div>
          <div style={{ display: "flex", gap: "16px", marginBottom: "16px" }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", fontWeight: "bold", marginBottom: "4px" }}>Cuisine</label>
              <select 
                value={cuisine} 
                onChange={e=>setCuisine(e.target.value)} 
                style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }}
              >
                <option value="">Select cuisine...</option>
                {CUISINES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", fontWeight: "bold", marginBottom: "4px" }}>Meal type</label>
              <select 
                value={mealType} 
                onChange={e=>setMealType(e.target.value)} 
                style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }}
              >
                <option value="">Select meal type...</option>
                {MEAL_TYPES.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>
          
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontWeight: "bold", marginBottom: "4px" }}>Recipe Photo</label>
            <input 
              type="file" 
              accept="image/*" 
              onChange={e => setPhotoFile(e.target.files?.[0] || null)} 
              style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }}
            />
            {photoFile && <span style={{color:"#666", fontSize:"0.9em", marginTop: "4px", display: "block"}}>Selected: {photoFile.name}</span>}
            {photoUrl && !photoFile && <span style={{color:"#666", fontSize:"0.9em", marginTop: "4px", display: "block"}}>Current photo will be kept</span>}
          </div>
          
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontWeight: "bold", marginBottom: "4px" }}>Dietary tags</label>
            <input 
              value={tags} 
              onChange={e=>setTags(e.target.value)} 
              placeholder="comma-separated, e.g. vegetarian,gluten-free" 
              style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }} 
            />
          </div>
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontWeight: "bold", marginBottom: "4px" }}>Ingredients (one per line)</label>
            <textarea 
              value={ingredientsText} 
              onChange={e=>setIngredientsText(e.target.value)} 
              rows={6} 
              placeholder="2 cups flour&#10;1 tsp salt&#10;3 eggs"
              style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ddd", fontFamily: "inherit", resize: "vertical" }}
            />
          </div>
          
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontWeight: "bold", marginBottom: "4px" }}>Instructions (one step per line)</label>
            <textarea 
              value={instructionsText} 
              onChange={e=>setInstructionsText(e.target.value)} 
              rows={6} 
              placeholder="Preheat oven to 180C&#10;Mix dry ingredients&#10;Add wet ingredients and mix"
              style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ddd", fontFamily: "inherit", resize: "vertical" }}
            />
          </div>
          
          <div style={{ marginBottom: "24px" }}>
            <label style={{ display: "block", fontWeight: "bold", marginBottom: "4px" }}>Notes</label>
            <textarea 
              value={notes} 
              onChange={e=>setNotes(e.target.value)} 
              rows={3} 
              placeholder="Any additional notes or tips..."
              style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ddd", fontFamily: "inherit", resize: "vertical" }}
            />
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
            style={{
              padding: "12px 24px",
              backgroundColor: uploading ? "#ccc" : "#28a745",
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontSize: "16px",
              cursor: uploading ? "not-allowed" : "pointer",
              marginRight: "12px"
            }}
          >
            {uploading ? "Uploading..." : editing ? "Update Recipe" : "Save Recipe"}
          </button>
          
          <button 
            onClick={()=>{
              setCreating(false);
              setEditing(null);
              resetForm();
            }} 
            style={{
              padding: "12px 24px",
              backgroundColor: "#6c757d",
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontSize: "16px",
              cursor: "pointer"
            }}
          >
            Cancel
          </button>
          </div>
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


