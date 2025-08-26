import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useUser } from "@auth0/nextjs-auth0/client";
import { apiGet, apiPost, apiPut } from "../../lib/api";

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

export default function RecipeView() {
  const { query } = useRouter();
  const { user } = useUser();
  const [r, setR] = useState<Recipe | null>(null);
  const [editing, setEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // Form fields for editing
  const [title, setTitle] = useState("");
  const [servings, setServings] = useState(2);
  const [prepMinutes, setPrepMinutes] = useState<number | "">("");
  const [cookMinutes, setCookMinutes] = useState<number | "">("");
  const [cuisine, setCuisine] = useState("");
  const [mealType, setMealType] = useState("");
  const [tags, setTags] = useState("");
  const [notes, setNotes] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [ingredientsText, setIngredientsText] = useState("");
  const [instructionsText, setInstructionsText] = useState("");
  
  const id = query.id as string;

  const loadRecipeIntoForm = (recipe: Recipe) => {
    setTitle(recipe.title);
    setServings(recipe.servings);
    setPrepMinutes(recipe.prep_minutes || "");
    setCookMinutes(recipe.cook_minutes || "");
    setCuisine(recipe.cuisine || "");
    setMealType(recipe.meal_type || "");
    setTags((recipe.dietary_tags || []).join(", "));
    setNotes(recipe.notes || "");
    setIngredientsText((recipe.ingredients || []).join("\n"));
    setInstructionsText((recipe.instructions || []).join("\n"));
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

  useEffect(() => {
    if (!id) return;
    (async () => {
      const data = await apiGet<Recipe>(`/api/recipes/${id}`);
      setR(data);
    })().catch(console.error);
  }, [id]);

  if (!r) return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
      <p style={{ fontSize: "18px", color: "#666" }}>Loading recipe...</p>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8f9fa" }}>
      {/* Header */}
      <header style={{ 
        backgroundColor: "white", 
        borderBottom: "1px solid #dee2e6", 
        padding: "16px 0",
        marginBottom: "32px"
      }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <a href="/library" style={{ 
              color: "#6c757d", 
              textDecoration: "none", 
              fontSize: "14px",
              padding: "8px 12px",
              borderRadius: "4px",
              border: "1px solid #dee2e6"
            }}>
              ← Back to Library
            </a>
            <h1 style={{ margin: 0, fontSize: "28px", color: "#212529" }}>Recipe Details</h1>
          </div>
          
          {user && (
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "14px", color: "#666" }}>
                {user.name || user.email}
              </span>
              <a 
                href="/api/auth/logout" 
                style={{ 
                  padding: "6px 12px", 
                  backgroundColor: "#dc3545", 
                  color: "white", 
                  textDecoration: "none", 
                  borderRadius: "4px", 
                  fontSize: "14px"
                }}
              >
                Logout
              </a>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 24px" }}>
        {!editing ? (
          /* View Mode */
          <>
            {/* Hero Section */}
            <div style={{ 
              backgroundColor: "white", 
              borderRadius: "12px", 
              padding: "32px", 
              marginBottom: "24px",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
            }}>
              <div style={{ display: "flex", gap: "32px", alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <h1 style={{ margin: "0 0 16px 0", fontSize: "36px", color: "#212529" }}>{r.title}</h1>
                  
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "24px", marginBottom: "16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "18px" }}>🍽️</span>
                      <span style={{ fontSize: "16px", color: "#495057" }}>{r.servings} serving{r.servings !== 1 ? 's' : ''}</span>
                    </div>
                    {r.prep_minutes && (
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "18px" }}>⏱️</span>
                        <span style={{ fontSize: "16px", color: "#495057" }}>{r.prep_minutes} min prep</span>
                      </div>
                    )}
                    {r.cook_minutes && (
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "18px" }}>🔥</span>
                        <span style={{ fontSize: "16px", color: "#495057" }}>{r.cook_minutes} min cook</span>
                      </div>
                    )}
                    {r.cuisine && (
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "18px" }}>🌍</span>
                        <span style={{ fontSize: "16px", color: "#495057" }}>{r.cuisine}</span>
                      </div>
                    )}
                    {r.meal_type && (
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "18px" }}>🍴</span>
                        <span style={{ fontSize: "16px", color: "#495057" }}>{r.meal_type}</span>
                      </div>
                    )}
                  </div>
                  
                  {r.dietary_tags && r.dietary_tags.length > 0 && (
                    <div style={{ marginBottom: "16px" }}>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                        {r.dietary_tags.map(tag => (
                          <span key={tag} style={{ 
                            backgroundColor: "#e9ecef", 
                            color: "#495057", 
                            padding: "4px 8px", 
                            borderRadius: "12px", 
                            fontSize: "14px" 
                          }}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {r.notes && (
                    <div style={{ 
                      backgroundColor: "#fff3cd", 
                      border: "1px solid #ffeaa7", 
                      padding: "16px", 
                      borderRadius: "8px", 
                      marginBottom: "16px" 
                    }}>
                      <strong style={{ color: "#856404" }}>Chef's Notes:</strong>
                      <p style={{ margin: "8px 0 0 0", color: "#856404" }}>{r.notes}</p>
                    </div>
                  )}
                  
                  <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
                    <button 
                      onClick={() => {
                        setEditing(true);
                        loadRecipeIntoForm(r);
                      }}
                      style={{
                        padding: "12px 24px",
                        backgroundColor: "#007bff",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        fontSize: "16px",
                        cursor: "pointer"
                      }}
                    >
                      ✏️ Edit Recipe
                    </button>
                    
                    {user && (
                      <button 
                        onClick={async ()=>{
                          const out = await apiPost<{url:string}>(`/api/recipes/${id}/export-pdf`, { style: "minimal" });
                          window.open(out.url, "_blank");
                        }}
                        style={{
                          padding: "12px 24px",
                          backgroundColor: "#28a745",
                          color: "white",
                          border: "none",
                          borderRadius: "6px",
                          fontSize: "16px",
                          cursor: "pointer"
                        }}
                      >
                        📄 Export PDF
                      </button>
                    )}
                  </div>
                </div>
                
                {r.photo_url && (
                  <div style={{ flexShrink: 0 }}>
                    <img 
                      src={r.photo_url} 
                      alt={r.title} 
                      style={{ 
                        width: "300px", 
                        height: "300px", 
                        objectFit: "cover", 
                        borderRadius: "12px",
                        boxShadow: "0 4px 8px rgba(0,0,0,0.1)"
                      }} 
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Ingredients & Instructions */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
              {/* Ingredients */}
              <div style={{ 
                backgroundColor: "white", 
                borderRadius: "12px", 
                padding: "24px",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
              }}>
                <h2 style={{ margin: "0 0 20px 0", fontSize: "24px", color: "#212529", borderBottom: "2px solid #007bff", paddingBottom: "8px" }}>
                  🥘 Ingredients
                </h2>
                <ul style={{ margin: 0, padding: "0 0 0 20px" }}>
                  {(r.ingredients ?? []).map((ingredient: string, i: number) => (
                    <li key={i} style={{ 
                      marginBottom: "8px", 
                      fontSize: "16px", 
                      lineHeight: "1.5",
                      color: "#495057"
                    }}>
                      {ingredient}
                    </li>
                  ))}
                </ul>
              </div>
              
              {/* Instructions */}
              <div style={{ 
                backgroundColor: "white", 
                borderRadius: "12px", 
                padding: "24px",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
              }}>
                <h2 style={{ margin: "0 0 20px 0", fontSize: "24px", color: "#212529", borderBottom: "2px solid #28a745", paddingBottom: "8px" }}>
                  👨‍🍳 Instructions
                </h2>
                <ol style={{ margin: 0, padding: "0 0 0 20px" }}>
                  {(r.instructions ?? []).map((instruction: string, i: number) => (
                    <li key={i} style={{ 
                      marginBottom: "12px", 
                      fontSize: "16px", 
                      lineHeight: "1.6",
                      color: "#495057"
                    }}>
                      {instruction}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </>
        ) : (
          /* Edit Mode - Modal */
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
            onClick={() => setEditing(false)}
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
                <h3 style={{ margin: 0, fontSize: "24px" }}>Edit Recipe</h3>
                <button
                  onClick={() => setEditing(false)}
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

              {/* Title */}
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontWeight: "bold", marginBottom: "4px" }}>Title</label>
                <input 
                  value={title} 
                  onChange={e=>setTitle(e.target.value)} 
                  style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }} 
                />
              </div>
              
              {/* Servings, Prep, Cook */}
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

              {/* Cuisine & Meal Type */}
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
              
              {/* Photo Upload */}
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontWeight: "bold", marginBottom: "4px" }}>Recipe Photo</label>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={e => setPhotoFile(e.target.files?.[0] || null)} 
                  style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }}
                />
                {photoFile && <span style={{color:"#666", fontSize:"0.9em", marginTop: "4px", display: "block"}}>Selected: {photoFile.name}</span>}
                {r.photo_url && !photoFile && <span style={{color:"#666", fontSize:"0.9em", marginTop: "4px", display: "block"}}>Current photo will be kept</span>}
              </div>
              
              {/* Dietary Tags */}
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontWeight: "bold", marginBottom: "4px" }}>Dietary tags</label>
                <input 
                  value={tags} 
                  onChange={e=>setTags(e.target.value)} 
                  placeholder="comma-separated, e.g. vegetarian,gluten-free" 
                  style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }} 
                />
              </div>

              {/* Ingredients */}
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
              
              {/* Instructions */}
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
              
              {/* Notes */}
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

              {/* Action Buttons */}
              <div style={{ display: "flex", gap: "12px" }}>
                <button 
                  onClick={async ()=>{
                    try{
                      setUploading(true);
                      
                      // Upload photo if a new file is selected
                      let finalPhotoUrl = r.photo_url;
                      if (photoFile) {
                        finalPhotoUrl = await uploadPhoto(photoFile);
                      }
                      
                      const payload = {
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
                      
                      const updated = await apiPut<Recipe>(`/api/recipes/${id}`, payload);
                      setR(updated);
                      setEditing(false);
                      setPhotoFile(null);
                    }catch(err){ 
                      console.error("Recipe update error:", err); 
                      alert("Failed to update recipe"); 
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
                  {uploading ? "Updating..." : "Update Recipe"}
                </button>
                
                <button 
                  onClick={() => setEditing(false)}
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
          </div>
        )}
      </div>
    </div>
  );
}


